# Contas e Funcionalidades Premium — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Clerk-based login and gate the move-explanation text (from `lib/chess/moveExplanation.ts`) behind a `publicMetadata.premium` flag, while everything else in the app — playing, suggestion highlighting, the quality badge — stays free and login-free exactly as it is today.

**Architecture:** Clerk (`@clerk/nextjs`, native Vercel Marketplace integration) provides auth entirely client-side plus a session-syncing `middleware.ts` — no custom API routes, no database. A tiny pure helper (`lib/auth/isPremiumUser.ts`) reads `publicMetadata.premium` off the Clerk user object; `app/jogar/page.tsx` computes `isPremium` and passes it down as a plain boolean prop to `LearningPanel`, which stays a dumb presentational component with zero Clerk imports.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, `@clerk/nextjs`, Vitest + Testing Library (existing).

**Spec:** `docs/superpowers/specs/2026-08-21-premium-auth-design.md`

## Global Constraints

- All new user-facing copy is PT-PT (2nd person "teu/tua", infinitive instructions, "a + infinitivo" gerunds — see `CLAUDE.md`).
- No database and no payments in this phase — the only new data is `user.publicMetadata.premium: boolean`, editable only via the Clerk Dashboard or a trusted backend call, never by the end user.
- No route protection anywhere — `middleware.ts` calls `clerkMiddleware()` with no `auth.protect()`. Every route (`/`, `/jogar`, `/aprender`, `/entrar`, `/criar-conta`) stays publicly reachable.
- `LearningPanel` must not import anything from `@clerk/nextjs` — it only ever receives `isPremium` as a boolean prop, matching `ChessBoard`'s existing "dumb component" convention.
- If Clerk fails to load, is offline, or `useUser()` hasn't resolved yet, `isPremium` must resolve to `false` — never throw, never block gameplay, suggestion, or the quality badge.
- Route names are PT-PT (`/entrar`, `/criar-conta`), consistent with `/jogar` and `/aprender`.
- Colocate every new test next to the file it tests (`*.test.ts` / `*.test.tsx`), following the existing pattern in `lib/chess/*.test.ts` and `components/RulesModal/RulesModal.test.tsx`.

---

### Task 1: `isPremiumUser` helper

**Files:**
- Create: `lib/auth/isPremiumUser.ts`
- Test: `lib/auth/isPremiumUser.test.ts`

**Interfaces:**
- Produces: `export interface UserWithPublicMetadata { publicMetadata?: unknown }` and `export function isPremiumUser(user: UserWithPublicMetadata | null | undefined): boolean` — Task 6 imports both.

- [ ] **Step 1: Write the failing test**

```ts
// lib/auth/isPremiumUser.test.ts
import { describe, expect, it } from 'vitest';
import { isPremiumUser } from './isPremiumUser';

describe('isPremiumUser', () => {
  it('is false for a null user', () => {
    expect(isPremiumUser(null)).toBe(false);
  });

  it('is false for an undefined user', () => {
    expect(isPremiumUser(undefined)).toBe(false);
  });

  it('is false when publicMetadata is missing', () => {
    expect(isPremiumUser({})).toBe(false);
  });

  it('is false when publicMetadata.premium is missing', () => {
    expect(isPremiumUser({ publicMetadata: {} })).toBe(false);
  });

  it('is false when publicMetadata.premium is falsy or not exactly true', () => {
    expect(isPremiumUser({ publicMetadata: { premium: false } })).toBe(false);
    expect(isPremiumUser({ publicMetadata: { premium: 'true' } })).toBe(false);
  });

  it('is true when publicMetadata.premium is exactly true', () => {
    expect(isPremiumUser({ publicMetadata: { premium: true } })).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/auth/isPremiumUser.test.ts`
Expected: FAIL — "Failed to resolve import './isPremiumUser'" (the file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

```ts
// lib/auth/isPremiumUser.ts

/**
 * Forma mínima de um utilizador Clerk que este helper precisa — evita
 * importar o SDK inteiro do Clerk só para ler uma flag.
 */
export interface UserWithPublicMetadata {
  publicMetadata?: unknown;
}

/**
 * Lê a flag `premium` do publicMetadata do Clerk. Só é `true` quando o
 * valor é exatamente `true` — qualquer outra coisa (undefined, false,
 * uma string, um utilizador nulo) conta como conta gratuita. Só uma
 * chamada de backend com CLERK_SECRET_KEY ou a Clerk Dashboard podem
 * escrever este campo, nunca o próprio utilizador — por isso é seguro
 * lê-lo diretamente no cliente, sem precisar de nenhuma API route.
 */
export function isPremiumUser(user: UserWithPublicMetadata | null | undefined): boolean {
  if (!user || typeof user.publicMetadata !== 'object' || user.publicMetadata === null) {
    return false;
  }
  return (user.publicMetadata as Record<string, unknown>).premium === true;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/auth/isPremiumUser.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/isPremiumUser.ts lib/auth/isPremiumUser.test.ts
git commit -m "feat: add isPremiumUser helper for reading Clerk's premium flag

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01KZV2vNQV2E66GMTXiHMQer"
```

---

### Task 2: `LearningPanel` premium gating

**Files:**
- Modify: `components/LearningPanel/LearningPanel.tsx`
- Test: `components/LearningPanel/LearningPanel.test.tsx` (new)

**Interfaces:**
- Consumes: nothing from other tasks — pure prop threading, no Clerk import.
- Produces: `LearningPanelProps` gains a required `isPremium: boolean` field. Task 6 must pass this prop from `app/jogar/page.tsx`.

- [ ] **Step 1: Write the failing tests**

```tsx
// components/LearningPanel/LearningPanel.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LearningPanel } from './LearningPanel';

const noop = () => {};

describe('LearningPanel', () => {
  it('shows the suggestion explanation to a premium user', () => {
    render(
      <LearningPanel
        enabled
        onToggle={noop}
        onRequestSuggestion={noop}
        isPremium
        hasSuggestion
        suggestionExplanation="Captura o cavalo e dá xeque."
      />
    );
    expect(screen.getByText(/Captura o cavalo e dá xeque\./)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Torna-te premium' })).not.toBeInTheDocument();
  });

  it('shows an upsell link instead of the suggestion explanation to a free user', () => {
    render(
      <LearningPanel
        enabled
        onToggle={noop}
        onRequestSuggestion={noop}
        isPremium={false}
        hasSuggestion
        suggestionExplanation="Captura o cavalo e dá xeque."
      />
    );
    expect(screen.queryByText(/Captura o cavalo e dá xeque\./)).not.toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Torna-te premium' });
    expect(link).toHaveAttribute('href', '/entrar');
  });

  it('shows the move-quality explanation to a premium user', () => {
    render(
      <LearningPanel
        enabled
        onToggle={noop}
        onRequestSuggestion={noop}
        isPremium
        lastMoveQuality="erro"
        lastMoveExplanation="Foi um erro: perdeste cerca de 250 centipawns de vantagem."
      />
    );
    expect(
      screen.getByText(/Foi um erro: perdeste cerca de 250 centipawns de vantagem\./)
    ).toBeInTheDocument();
  });

  it('shows an upsell link instead of the move-quality explanation to a free user', () => {
    render(
      <LearningPanel
        enabled
        onToggle={noop}
        onRequestSuggestion={noop}
        isPremium={false}
        lastMoveQuality="erro"
        lastMoveExplanation="Foi um erro: perdeste cerca de 250 centipawns de vantagem."
      />
    );
    expect(
      screen.queryByText(/Foi um erro: perdeste cerca de 250 centipawns de vantagem\./)
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Torna-te premium' })).toBeInTheDocument();
  });

  it('does not show an upsell when there is no explanation to gate', () => {
    render(
      <LearningPanel
        enabled
        onToggle={noop}
        onRequestSuggestion={noop}
        isPremium={false}
        hasSuggestion
        suggestionExplanation={null}
      />
    );
    expect(screen.queryByRole('link', { name: 'Torna-te premium' })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run components/LearningPanel/LearningPanel.test.tsx`
Expected: FAIL — `isPremium` doesn't exist on `LearningPanelProps` yet (TypeScript error) and the upsell link doesn't render.

- [ ] **Step 3: Rewrite the component**

Replace the full contents of `components/LearningPanel/LearningPanel.tsx` with:

```tsx
'use client';

import Link from 'next/link';
import type { MoveQuality } from '@/lib/chess/moveClassification';

export interface LearningPanelProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onRequestSuggestion: () => void;
  isPremium: boolean;
  suggestionLoading?: boolean;
  hasSuggestion?: boolean;
  suggestionExplanation?: string | null;
  lastMoveQuality?: MoveQuality | null;
  lastMoveExplanation?: string | null;
}

const QUALITY_LABEL: Record<MoveQuality, string> = {
  boa: 'Boa jogada',
  imprecisao: 'Imprecisão',
  erro: 'Erro',
};

const QUALITY_CLASS: Record<MoveQuality, string> = {
  boa: 'bg-emerald-100 text-emerald-800',
  imprecisao: 'bg-amber-100 text-amber-800',
  erro: 'bg-red-100 text-red-800',
};

// Mostra a explicação em si a quem é premium, ou uma chamada para
// se tornar premium a quem não é — usado tanto para a jogada sugerida
// como para a qualidade do último lance, daí ser um componente à parte
// em vez de duplicar a condição nos dois sítios.
function ExplanationOrUpsell({
  text,
  isPremium,
  separator,
}: {
  text: string | null | undefined;
  isPremium: boolean;
  separator: string;
}) {
  if (!text) return null;
  if (isPremium) {
    return (
      <>
        {separator}
        {text}
      </>
    );
  }
  return (
    <>
      {separator}
      <Link href="/entrar" className="underline">
        Torna-te premium
      </Link>{' '}
      para veres a explicação deste lance.
    </>
  );
}

export function LearningPanel({
  enabled,
  onToggle,
  onRequestSuggestion,
  isPremium,
  suggestionLoading = false,
  hasSuggestion = false,
  suggestionExplanation = null,
  lastMoveQuality = null,
  lastMoveExplanation = null,
}: LearningPanelProps) {
  return (
    <aside className="flex flex-col gap-4 w-full max-w-xs border border-stone-200 rounded-md p-4">
      <label className="flex items-center justify-between gap-2 font-medium">
        Modo de aprendizagem
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onToggle(event.target.checked)}
          className="h-5 w-5"
        />
      </label>

      {enabled && (
        <>
          <p className="text-sm text-stone-600">
            Lances legais e peças ameaçadas aparecem destacados no tabuleiro.
          </p>
          <button
            type="button"
            onClick={onRequestSuggestion}
            disabled={suggestionLoading}
            className="rounded-md bg-sky-600 text-white px-3 py-2 disabled:opacity-50"
          >
            {suggestionLoading ? 'A pensar…' : 'Sugerir jogada'}
          </button>
          {hasSuggestion && (
            <p className="text-sm text-stone-600">
              Jogada sugerida destacada em verde no tabuleiro.
              <ExplanationOrUpsell
                text={suggestionExplanation}
                isPremium={isPremium}
                separator=" "
              />
            </p>
          )}
          {lastMoveQuality && (
            <p className={`text-sm rounded-md px-3 py-2 ${QUALITY_CLASS[lastMoveQuality]}`}>
              O teu último lance: {QUALITY_LABEL[lastMoveQuality]}
              <ExplanationOrUpsell
                text={lastMoveExplanation}
                isPremium={isPremium}
                separator=" — "
              />
            </p>
          )}
        </>
      )}
    </aside>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run components/LearningPanel/LearningPanel.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Run the full test suite, typecheck, and lint**

Run: `npm run test && npx tsc --noEmit && npm run lint`
Expected: all pass. (`app/jogar/page.tsx` will show a type error here because it doesn't pass `isPremium` yet — that's expected and fixed in Task 6; if this task is executed standalone, temporarily confirm the *only* new error is the missing `isPremium` prop at the `<LearningPanel>` call site in `app/jogar/page.tsx`, then proceed.)

- [ ] **Step 6: Commit**

```bash
git add components/LearningPanel/LearningPanel.tsx components/LearningPanel/LearningPanel.test.tsx
git commit -m "feat: gate LearningPanel's move explanations behind isPremium

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01KZV2vNQV2E66GMTXiHMQer"
```

---

### Task 3: Install and provision Clerk

**Files:**
- Modify: `package.json`, `package-lock.json` (dependency addition)
- Modify (local only, never committed — already covered by `.env*` in `.gitignore`): `.env.local`

**Interfaces:**
- Produces: the `@clerk/nextjs` package available to import, and these env vars present locally and on Vercel: `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/entrar`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/criar-conta`. Tasks 4 and 5 depend on all four existing before their code will actually run (though it will still typecheck without them).

> **STOP — this task touches your real Vercel account and may open a browser for you to confirm installing the Clerk integration (it's a paid marketplace integration, billed through your Vercel account).** Read each step before running it; don't run Step 2 or Step 3 unattended.

- [ ] **Step 1: Confirm the project is linked to Vercel**

Run: `vercel link`
If it's already linked, this is a no-op confirmation. If not, follow the prompts to link it to the `chess-learning-game` project under the `algorithm-cloud` team (per `CLAUDE.md`'s Deploy section).

- [ ] **Step 2: Install Clerk from the Vercel Marketplace**

Run: `vercel integration add clerk`
This may open a browser tab asking you to confirm installing Clerk and agreeing to its billing terms. Complete that step in the browser, then return here — the CLI waits for it.

- [ ] **Step 3: Pull the provisioned env vars locally**

Run: `vercel env pull --yes`
Expected: `.env.local` now contains `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. Verify with:

Run: `grep -c "CLERK_SECRET_KEY\|NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" .env.local`
Expected: `2`

- [ ] **Step 4: Add the sign-in/sign-up routing env vars**

Append to `.env.local` (these aren't provisioned by the marketplace install — they're app-level config Clerk's SDK reads to route to this app's PT-PT auth pages instead of its defaults):

```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/entrar
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/criar-conta
```

- [ ] **Step 5: Install the SDK**

Run: `npm install @clerk/nextjs`

- [ ] **Step 6: Verify `.env.local` will never be committed**

Run: `grep -n "^\.env" .gitignore`
Expected: a line matching `.env*` (already present in this repo — just confirming it still covers `.env.local`).

- [ ] **Step 7: Commit only the dependency change**

```bash
git add package.json package-lock.json
git status --short
```
Confirm the status output shows only `package.json`/`package-lock.json` staged — **never** `git add .env.local`.

```bash
git commit -m "chore: add @clerk/nextjs dependency

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01KZV2vNQV2E66GMTXiHMQer"
```

---

### Task 4: Wire `ClerkProvider` and `middleware.ts`

**Files:**
- Modify: `app/layout.tsx`
- Create: `middleware.ts` (project root)

**Interfaces:**
- Consumes: `@clerk/nextjs` (Task 3), env vars from Task 3.
- Produces: every page in the app is now inside `<ClerkProvider>`, so `useUser()`, `<SignedIn>`, `<SignedOut>`, `<UserButton/>`, `<SignIn/>`, `<SignUp/>` all work from any client component from here on. Tasks 5 and 6 depend on this.

- [ ] **Step 1: Update `app/layout.tsx`**

Read the current file first, then apply this change — wrap `{children}` (and the existing `<ServiceWorkerRegistration />`) in `<ClerkProvider>`, inside `<body>`:

```tsx
import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

export const metadata: Metadata = {
  title: 'Xadrez — aprenda jogando',
  description:
    'Jogue xadrez contra o computador ou com um amigo, com dicas para aprender a jogar melhor.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Xadrez',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#b45309',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT">
      <body className="antialiased">
        <ClerkProvider>
          <ServiceWorkerRegistration />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create `middleware.ts`**

```ts
// middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server';

// Sem auth.protect() em lado nenhum — nenhuma rota desta app exige
// login. O único papel deste middleware é manter o token de sessão
// do Clerk sincronizado entre pedidos.
export default clerkMiddleware();

export const config = {
  // Só exclui assets estáticos com hash/ícones — este projeto não tem
  // rotas /api nem tRPC, por isso o matcher não precisa de as referir.
  matcher: ['/((?!_next|.*\\.(?:png|jpg|svg|ico|webmanifest|json)$).*)'],
};
```

- [ ] **Step 3: Verify the build succeeds**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed with no errors. If `next build` fails complaining about a missing Clerk publishable key, re-check Task 3 Step 3 pulled `.env.local` correctly.

- [ ] **Step 4: Run the full test suite**

Run: `npm run test`
Expected: all existing tests still pass (adding a provider around the app doesn't affect any unit test, since none of them render `RootLayout`).

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx middleware.ts
git commit -m "feat: wrap the app in ClerkProvider and add session-sync middleware

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01KZV2vNQV2E66GMTXiHMQer"
```

---

### Task 5: Sign-in/sign-up pages and the header entry point

**Files:**
- Create: `app/entrar/page.tsx`
- Create: `app/criar-conta/page.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `ClerkProvider` from Task 4 must already wrap the app.
- Produces: `/entrar` and `/criar-conta` routes exist; `app/page.tsx`'s header shows the "Entrar" link (signed out) or `<UserButton/>` (signed in) — used as the destination for `LearningPanel`'s upsell link from Task 2.

- [ ] **Step 1: Create the sign-in page**

```tsx
// app/entrar/page.tsx
import { SignIn } from '@clerk/nextjs';

export default function EntrarPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-8">
      <SignIn />
    </main>
  );
}
```

- [ ] **Step 2: Create the sign-up page**

```tsx
// app/criar-conta/page.tsx
import { SignUp } from '@clerk/nextjs';

export default function CriarContaPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-8">
      <SignUp />
    </main>
  );
}
```

- [ ] **Step 3: Add the header entry point to the main menu**

Read `app/page.tsx` first, then replace its full contents with:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { ModeSelector } from '@/components/ModeSelector/ModeSelector';
import { RulesModal } from '@/components/RulesModal/RulesModal';

export default function HomePage() {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 p-8">
      <div className="w-full max-w-sm flex justify-end text-sm">
        <SignedOut>
          <Link href="/entrar" className="underline text-sky-700">
            Entrar
          </Link>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
      <div className="text-center">
        <h1 className="text-3xl font-bold">Xadrez</h1>
        <p className="text-stone-600 mt-2">
          Joga e aprende a jogar melhor.{' '}
          <Link href="/aprender" className="underline text-sky-700">
            Ver tutorial
          </Link>{' '}
          ·{' '}
          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="underline text-sky-700"
          >
            Regras do jogo
          </button>
        </p>
      </div>
      <ModeSelector />
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </main>
  );
}
```

- [ ] **Step 4: Verify the build succeeds**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed, with `/entrar` and `/criar-conta` listed among the built routes.

- [ ] **Step 5: Run the full test suite**

Run: `npm run test`
Expected: all tests still pass (no test file touches `app/page.tsx`).

- [ ] **Step 6: Commit**

```bash
git add app/entrar/page.tsx app/criar-conta/page.tsx app/page.tsx
git commit -m "feat: add sign-in/sign-up pages and a header auth entry point

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01KZV2vNQV2E66GMTXiHMQer"
```

---

### Task 6: Wire `isPremium` into `app/jogar/page.tsx`

**Files:**
- Modify: `app/jogar/page.tsx`

**Interfaces:**
- Consumes: `isPremiumUser` from `lib/auth/isPremiumUser.ts` (Task 1), the `isPremium: boolean` prop on `LearningPanel` (Task 2), `useUser` from `@clerk/nextjs` (available since Task 4).
- Produces: nothing further downstream — this is the last piece connecting the two.

- [ ] **Step 1: Add the two new imports**

In `app/jogar/page.tsx`, find:

```ts
import { describeMove, explainMoveQuality } from '@/lib/chess/moveExplanation';
import { findThreatenedSquares } from '@/lib/chess/threats';
```

Replace with:

```ts
import { useUser } from '@clerk/nextjs';
import { describeMove, explainMoveQuality } from '@/lib/chess/moveExplanation';
import { isPremiumUser } from '@/lib/auth/isPremiumUser';
import { findThreatenedSquares } from '@/lib/chess/threats';
```

- [ ] **Step 2: Compute `isPremium`**

Find, inside `JogarContent`:

```ts
  const { state, legalMovesFrom, makeMove, reset } = useChessGame(true);
```

Replace with:

```ts
  const { state, legalMovesFrom, makeMove, reset } = useChessGame(true);
  const { user } = useUser();
  const isPremium = isPremiumUser(user);
```

- [ ] **Step 3: Pass it to `LearningPanel`**

Find:

```tsx
          suggestionLoading={suggestionLoading}
          hasSuggestion={Boolean(suggestion)}
          suggestionExplanation={suggestionExplanation}
          lastMoveQuality={lastMoveQuality}
          lastMoveExplanation={lastMoveExplanation}
        />
```

Replace with:

```tsx
          isPremium={isPremium}
          suggestionLoading={suggestionLoading}
          hasSuggestion={Boolean(suggestion)}
          suggestionExplanation={suggestionExplanation}
          lastMoveQuality={lastMoveQuality}
          lastMoveExplanation={lastMoveExplanation}
        />
```

- [ ] **Step 4: Verify the build, typecheck, lint, and full test suite**

Run: `npx tsc --noEmit && npm run lint && npm run test`
Expected: all pass — this is the step where the type error left open at the end of Task 2 (missing `isPremium` prop) disappears for good.

- [ ] **Step 5: Manual smoke check (not automatable — do this once, by hand)**

1. `npm run dev`, open `/jogar?mode=ai`, enable "Modo de aprendizagem", click "Sugerir jogada". Confirm you see "Torna-te premium para veres a explicação deste lance." with a working link to `/entrar` (you're signed out).
2. Sign up via `/criar-conta`, then in the Clerk Dashboard set that user's `publicMetadata` to `{"premium": true}`.
3. Reload `/jogar?mode=ai`, request a suggestion again. Confirm the actual explanation sentence now appears instead of the upsell.
4. Play a move against the engine and confirm the quality badge shows the explanation the same way.

- [ ] **Step 6: Commit**

```bash
git add app/jogar/page.tsx
git commit -m "feat: gate move explanations behind the signed-in user's premium flag

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01KZV2vNQV2E66GMTXiHMQer"
```

---

### Task 7: Update `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:** none — documentation only, no code dependency.

- [ ] **Step 1: Update the intro paragraph**

Find:

```
App Next.js (App Router) de xadrez: jogar contra o Stockfish (3 níveis) ou a
dois no mesmo dispositivo, um "modo de aprendizagem" (lances legais, peças
ameaçadas, sugestão de jogada, avaliação do último lance) e um tutorial em
`/aprender`. Instalável como PWA, funciona offline. Sem backend/API routes —
tudo corre no browser.
```

Replace with:

```
App Next.js (App Router) de xadrez: jogar contra o Stockfish (3 níveis) ou a
dois no mesmo dispositivo, um "modo de aprendizagem" (lances legais, peças
ameaçadas, sugestão de jogada, avaliação do último lance, com explicação de
lances premium) e um tutorial em `/aprender`. Instalável como PWA, funciona
offline. Sem backend/API routes próprias — tudo corre no browser, com uma
exceção: autenticação (Clerk), usada só para gate de funcionalidades premium
(ver secção própria abaixo).
```

- [ ] **Step 2: Add `middleware.ts` and the new routes to the Estrutura tree**

Find the start of the `Estrutura` code block:

```
app/
  layout.tsx              # <html lang="pt-PT">, metadata/PWA, monta ServiceWorkerRegistration
  page.tsx                 # menu inicial: ModeSelector + link "Regras do jogo"
  jogar/page.tsx            # a partida em si — client component "grande", liga tudo
```

Replace with:

```
middleware.ts              # clerkMiddleware() — só sincroniza sessão, sem auth.protect()
app/
  layout.tsx              # <html lang="pt-PT">, metadata/PWA, monta ServiceWorkerRegistration
                           # e ClerkProvider
  page.tsx                 # menu inicial: link "Entrar"/<UserButton/>, ModeSelector,
                            # link "Regras do jogo"
  entrar/page.tsx            # <SignIn/> do Clerk
  criar-conta/page.tsx        # <SignUp/> do Clerk
  jogar/page.tsx                # a partida em si — client component "grande", liga tudo
```

- [ ] **Step 3: Note the premium gating on `LearningPanel`'s line**

Find:

```
  LearningPanel/              # painel lateral do modo de aprendizagem (toggle, botão
                               # "sugerir jogada", badge de qualidade do lance)
```

Replace with:

```
  LearningPanel/              # painel lateral do modo de aprendizagem (toggle, botão
                               # "sugerir jogada", badge de qualidade do lance); as
                               # frases de explicação de lances são premium — recebe
                               # isPremium como prop simples, não sabe nada de Clerk
```

- [ ] **Step 4: Add the `lib/auth/` entry**

Find the end of the `lib/chess/` block:

```
  threats.ts                     # peças penduradas/ameaçadas para o modo de aprendizagem
  *.test.ts                       # cada módulo acima tem testes ao lado
```

Replace with:

```
  threats.ts                     # peças penduradas/ameaçadas para o modo de aprendizagem
  moveExplanation.ts               # frases de explicação de lances (premium) — ver
                                    # secção própria abaixo
  *.test.ts                       # cada módulo acima tem testes ao lado
lib/auth/
  isPremiumUser.ts        # lê user.publicMetadata.premium do Clerk — usada em
                          # app/jogar/page.tsx para decidir o que o LearningPanel
                          # mostra
```

- [ ] **Step 5: Add a new subsection under "Convenções que não são óbvias a partir do código"**

Insert this new `###` subsection (placement: anywhere among the other `###` subsections in that section — e.g. right after the "Peças do tabuleiro" subsection reads naturally):

```markdown
### Autenticação e funcionalidades premium (Clerk)

Login usa o Clerk (`@clerk/nextjs`), instalado como integração nativa
do Vercel Marketplace — `CLERK_SECRET_KEY` e
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` são provisionadas automaticamente
como variáveis de ambiente do projeto na Vercel. `middleware.ts` só
mantém a sessão sincronizada (`clerkMiddleware()`, sem
`auth.protect()`) — nenhuma rota exige autenticação para ser acedida;
`/jogar`, `/aprender`, etc. continuam todas públicas.

O que é premium: as frases de explicação de lances
(`lib/chess/moveExplanation.ts`, mostradas em `LearningPanel`) — tudo o
resto do modo de aprendizagem (destaque de ameaças, sugestão de
jogada, badge de qualidade boa/imprecisão/erro) continua gratuito. A
flag vive em `user.publicMetadata.premium` (booleano) e só é editável
pela Clerk Dashboard ou por uma chamada de backend com
`CLERK_SECRET_KEY` — nunca pelo próprio utilizador — por isso
`lib/auth/isPremiumUser.ts` pode lê-la em segurança no cliente
(`app/jogar/page.tsx`, via `useUser()`) sem precisar de nenhuma API
route própria. Não há pagamentos nem base de dados ainda: ativar
premium para um utilizador é, para já, um passo manual na Clerk
Dashboard.

Páginas `/entrar` e `/criar-conta` (não `/sign-in`/`/sign-up`, para
consistência com as restantes rotas em português) usam os componentes
prontos do Clerk (`<SignIn/>`/`<SignUp/>`) sem lógica própria.
```

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document Clerk auth and the premium-gating convention

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01KZV2vNQV2E66GMTXiHMQer"
```
