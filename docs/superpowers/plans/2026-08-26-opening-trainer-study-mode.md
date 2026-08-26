# Treinador de aberturas — Modo de estudo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the opening-study UI — a list page (`/aprender/aberturas`) and a per-opening study page (`/aprender/aberturas/[id]`) where the user picks a line (main or variation) and steps through it move-by-move, seeing the board and each move's PT-PT explanation.

**Architecture:** Two thin Next.js server-component routes plus one client component (`OpeningStudy`) that owns all the stepping/line-switching state and composes the existing `ChessBoard` + a small `ChipButton` extension. `lib/openings/` (types, data, `replayLine`) already exists and is merged to `main` — this plan only adds UI on top of it.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, chess.js, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-26-opening-trainer-study-mode-design.md`

## Global Constraints

- No "Praticar esta abertura" button in this sub-project — deferred to sub-project 3. (spec, Não-objetivos)
- Navigation is "Anterior"/"Seguinte" buttons only — no clickable move list, no interactive board clicks. (spec, Não-objetivos)
- No `localStorage` persistence of study progress — switching lines or remounting always resets to line 0 / step 0. (spec, Não-objetivos)
- The study board reads the user's real theme via `useSettings()` (`settings.boardTheme`, `settings.pieceStyle`) — unlike the other `/aprender` demos, which stay on the default theme. (brainstorming decision, spec §2)
- Route files (`page.tsx`, `[id]/page.tsx`) get **no dedicated test file** — matches the existing convention for thin server-component pages (`app/aprender/page.tsx`, `app/page.tsx` have none). All real test coverage lives in `OpeningStudy.test.tsx` and the `ChipButton.test.tsx` additions. (spec §1)
- Line-switching tabs use hand-rolled toggle buttons with `ACTIVE_TOGGLE_STYLE` from `lib/ui/activeToggleStyle.ts` — **not** `ChipButton` — matching the existing convention for "exactly one of these is active" groups (`GameSetup`, `/opções`'s dificuldade/cor pickers). (spec §2)
- `ChipButton` gains an optional `disabled?: boolean` prop, default `false` — every existing call site that doesn't pass it must keep working identically. (spec §3)
- Test files sit next to the module/component they test (`*.test.tsx`), and any test exercising a click that changes a component's own state uses `fireEvent`, never a raw `.click()` — a documented React-19 pitfall in this codebase (`CLAUDE.md`). (spec §Testes)
- All new user-visible text is PT-PT. (`CLAUDE.md`)

---

### Task 1: `ChipButton` — add a `disabled` prop

**Files:**
- Modify: `components/ChipButton/ChipButton.tsx`
- Modify: `components/ChipButton/ChipButton.test.tsx`

**Interfaces:**
- Produces: `ChipButtonProps.disabled?: boolean` (default `false`). When `true`: the rendered `<button>` gets the native `disabled` attribute and does not fire `onClick`; the rendered `<Link>` (used when `href` is passed) gets `pointer-events-none` since `<a>` has no native disabled state. Both get an `opacity-40` class. Task 2's `OpeningStudy` passes this on its "Anterior"/"Seguinte" buttons.

- [ ] **Step 1: Write the failing tests**

Add these three `it` blocks inside the existing `describe('ChipButton', ...)` in `components/ChipButton/ChipButton.test.tsx` (keep the three existing tests unchanged):

```tsx
  it('supports a disabled state that blocks onClick and shows reduced opacity (button)', () => {
    const onClick = vi.fn();
    render(
      <ChipButton color="pink" onClick={onClick} disabled>
        Seguinte
      </ChipButton>
    );
    const button = screen.getByRole('button', { name: 'Seguinte' });
    expect(button).toBeDisabled();
    expect(button.className).toContain('opacity-40');
    button.click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies the disabled styling to a link too, since <a> has no native disabled', () => {
    render(
      <ChipButton color="purple" href="/aprender" disabled>
        Ver tutorial
      </ChipButton>
    );
    const link = screen.getByRole('link', { name: 'Ver tutorial' });
    expect(link.className).toContain('opacity-40');
    expect(link.className).toContain('pointer-events-none');
  });

  it('does not apply disabled styling when disabled is omitted', () => {
    render(
      <ChipButton color="gold" onClick={() => {}}>
        Reiniciar
      </ChipButton>
    );
    const button = screen.getByRole('button', { name: 'Reiniciar' });
    expect(button).not.toBeDisabled();
    expect(button.className).not.toContain('opacity-40');
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run components/ChipButton/ChipButton.test.tsx`
Expected: FAIL — `disabled` is not a recognized prop yet (TypeScript error on `disabled` in the test file, or at minimum the new assertions fail since nothing sets `opacity-40`/`disabled`).

- [ ] **Step 3: Implement the `disabled` prop**

Replace the full contents of `components/ChipButton/ChipButton.tsx` with:

```tsx
import type { ReactNode } from 'react';
import Link from 'next/link';

export type ChipColor = 'purple' | 'cyan' | 'pink' | 'gold';

// Mesma linguagem visual das tiles do menu (corte diagonal, sombra
// "carimbada"), só a uma escala secundária — usado para QUALQUER link ou
// ação de nível de página na app, nunca mais texto sublinhado a solo. Ver
// docs/superpowers/specs do redesenho "anime" (2026-08-25).
const CHIP_GRADIENT: Record<ChipColor, string> = {
  purple: 'linear-gradient(135deg, #B87FDB, #7B3FA0)',
  cyan: 'linear-gradient(135deg, #7DE0E6, #3FA9B0)',
  pink: 'linear-gradient(135deg, #FF9AC2, #FF6FA5)',
  gold: 'linear-gradient(135deg, #FFE066, #FFD600)',
};

const CHIP_TEXT: Record<ChipColor, string> = {
  purple: '#FFF6FF',
  cyan: '#0B2E30',
  pink: '#3A0B1F',
  gold: '#3A2A00',
};

export interface ChipButtonProps {
  color: ChipColor;
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const BASE_CLASS =
  'inline-block font-semibold text-sm px-4 py-2 rounded-lg shadow-[3px_3px_0_rgba(0,0,0,0.35)] ' +
  '[clip-path:polygon(0_0,100%_0,100%_82%,93%_100%,0_100%)] transition-transform hover:scale-[1.03]';

export function ChipButton({
  color,
  children,
  href,
  onClick,
  disabled = false,
  className = '',
}: ChipButtonProps) {
  const style = { background: CHIP_GRADIENT[color], color: CHIP_TEXT[color] };
  const disabledClasses = disabled ? 'opacity-40 pointer-events-none' : '';
  const classes = `${BASE_CLASS} ${disabledClasses} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} style={style} className={classes} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} style={style} className={classes}>
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run components/ChipButton/ChipButton.test.tsx`
Expected: PASS (6/6 — the 3 existing tests plus the 3 new ones).

- [ ] **Step 5: Run the full suite, typecheck, and lint**

Run: `npm run test && npx tsc --noEmit && npm run lint`
Expected: all green — this change touches a widely-used shared component, so the full suite (not just `ChipButton.test.tsx`) must stay green.

- [ ] **Step 6: Commit**

```bash
git add components/ChipButton/ChipButton.tsx components/ChipButton/ChipButton.test.tsx
git commit -m "feat: add disabled prop to ChipButton"
```

---

### Task 2: `OpeningStudy` — the interactive study component

**Files:**
- Create: `components/OpeningStudy/OpeningStudy.tsx`
- Create: `components/OpeningStudy/OpeningStudy.test.tsx`

**Interfaces:**
- Consumes (all pre-existing, already merged to `main` — do not modify): `ChipButtonProps.disabled` (Task 1); `Opening`, `OpeningLine` from `@/lib/openings/types`; `OPENINGS` from `@/lib/openings/data`; `replayLine(line: OpeningLine): ReplayedMove[]` and `ReplayedMove { fen, from, to, promotion?, san, explanation }` from `@/lib/openings/replayLine`; `useSettings(): { settings: Settings }` from `@/lib/settings/useSettings` (`settings.boardTheme`, `settings.pieceStyle`); `checkedKingSquare(fen: string): Square | null` from `@/lib/chess/legalMoves`; `ChessBoard` from `@/components/ChessBoard/ChessBoard` (props include `fen`, `boardTheme`, `pieceStyle`, `lastMove`, `checkSquare`); `ACTIVE_TOGGLE_STYLE` from `@/lib/ui/activeToggleStyle`.
- Produces: `export function OpeningStudy({ opening }: { opening: Opening })` — a React component. Task 3's `[id]/page.tsx` renders `<OpeningStudy opening={opening} />`.

- [ ] **Step 1: Write the failing test**

Create `components/OpeningStudy/OpeningStudy.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { OpeningStudy } from './OpeningStudy';
import { OPENINGS } from '@/lib/openings/data';

const italiana = OPENINGS.find((o) => o.id === 'abertura-italiana')!;

describe('OpeningStudy', () => {
  it('starts at the initial position with "Anterior" disabled', () => {
    render(<OpeningStudy opening={italiana} />);
    expect(screen.getByText(/Posição inicial/)).toBeInTheDocument();
    expect(screen.getByText('0 / 9')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
  });

  it('advances one move per "Seguinte" click, with correct move labels', () => {
    render(<OpeningStudy opening={italiana} />);
    const next = screen.getByRole('button', { name: 'Seguinte' });

    fireEvent.click(next);
    expect(screen.getByText('1. e4')).toBeInTheDocument();
    expect(screen.getByText('Ocupa o centro e abre linha para o bispo e a dama.')).toBeInTheDocument();

    fireEvent.click(next);
    expect(screen.getByText('1...e5')).toBeInTheDocument();
    expect(
      screen.getByText('Resposta simétrica: também disputa o centro imediatamente.')
    ).toBeInTheDocument();
  });

  it('disables "Seguinte" at the last move and does not overshoot on extra clicks', () => {
    render(<OpeningStudy opening={italiana} />);
    const next = screen.getByRole('button', { name: 'Seguinte' });

    for (let i = 0; i < 9; i++) fireEvent.click(next);
    expect(screen.getByText('5. d3')).toBeInTheDocument();
    expect(screen.getByText('9 / 9')).toBeInTheDocument();
    expect(next).toBeDisabled();

    fireEvent.click(next);
    expect(screen.getByText('9 / 9')).toBeInTheDocument();
  });

  it('steps back with "Anterior"', () => {
    render(<OpeningStudy opening={italiana} />);
    const next = screen.getByRole('button', { name: 'Seguinte' });
    const prev = screen.getByRole('button', { name: 'Anterior' });

    for (let i = 0; i < 9; i++) fireEvent.click(next);
    fireEvent.click(prev);

    expect(screen.getByText('4...Nf6')).toBeInTheDocument();
    expect(screen.getByText('8 / 9')).toBeInTheDocument();
  });

  it('switching lines resets to the initial position and shows that line\'s own moves', () => {
    render(<OpeningStudy opening={italiana} />);
    const next = screen.getByRole('button', { name: 'Seguinte' });

    for (let i = 0; i < 6; i++) fireEvent.click(next);
    expect(screen.getByText('3...Bc5')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Gambito Evans' }));
    expect(screen.getByText(/Posição inicial/)).toBeInTheDocument();
    expect(screen.getByText('0 / 9')).toBeInTheDocument();

    for (let i = 0; i < 7; i++) fireEvent.click(next);
    expect(screen.getByText('4. b4')).toBeInTheDocument();
    expect(
      screen.getByText('O Gambito Evans: sacrifica um peão para ganhar tempo e um centro forte.')
    ).toBeInTheDocument();
  });
});
```

This uses `abertura-italiana` from the real `OPENINGS` dataset (merged in sub-project 1): its two lines are `'Linha principal (Giuoco Piano)'` (`e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3`) and `'Gambito Evans'` (`e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3`), both 9 moves.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/OpeningStudy/OpeningStudy.test.tsx`
Expected: FAIL — `Cannot find module './OpeningStudy'`.

- [ ] **Step 3: Write `components/OpeningStudy/OpeningStudy.tsx`**

```tsx
'use client';

import { useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { ACTIVE_TOGGLE_STYLE } from '@/lib/ui/activeToggleStyle';
import { useSettings } from '@/lib/settings/useSettings';
import { replayLine, type ReplayedMove } from '@/lib/openings/replayLine';
import { checkedKingSquare } from '@/lib/chess/legalMoves';
import type { Opening } from '@/lib/openings/types';

const START_FEN = new Chess().fen();

/** "1." para o 1º lance (brancas), "1..." para o 2º (pretas), etc. — as
 * linhas de abertura começam sempre pelas brancas, por isso a paridade do
 * índice (1-based) chega para decidir. */
function moveLabel(stepIndex: number): string {
  const fullmove = Math.ceil(stepIndex / 2);
  return stepIndex % 2 === 1 ? `${fullmove}.` : `${fullmove}...`;
}

export function OpeningStudy({ opening }: { opening: Opening }) {
  const { settings } = useSettings();
  const replayedLines = useMemo(() => opening.lines.map((line) => replayLine(line)), [opening]);
  const [lineIndex, setLineIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  const replayed = replayedLines[lineIndex];
  const current: ReplayedMove | null = stepIndex === 0 ? null : replayed[stepIndex - 1];
  const fen = current?.fen ?? START_FEN;
  const lastMove = current ? { from: current.from, to: current.to } : null;
  const checkSquare = checkedKingSquare(fen);

  function selectLine(index: number) {
    setLineIndex(index);
    setStepIndex(0);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap gap-2 justify-center" role="tablist">
        {opening.lines.map((line, index) => (
          <button
            key={line.name}
            type="button"
            role="tab"
            aria-selected={index === lineIndex}
            onClick={() => selectLine(index)}
            style={index === lineIndex ? ACTIVE_TOGGLE_STYLE : undefined}
            className={`rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-transform hover:scale-[1.02] ${
              index === lineIndex ? 'border-transparent shadow-[3px_3px_0_rgba(0,0,0,0.35)]' : 'border-purple/40 text-lilac'
            }`}
          >
            {line.name}
          </button>
        ))}
      </div>

      <div className="w-[min(98vw,62dvh,560px)] sm:w-[min(92vw,62dvh,560px)] flex flex-col items-center gap-3">
        <ChessBoard
          fen={fen}
          boardTheme={settings.boardTheme}
          pieceStyle={settings.pieceStyle}
          lastMove={lastMove}
          checkSquare={checkSquare}
        />

        <div className="flex items-center gap-3">
          <ChipButton color="pink" onClick={() => setStepIndex((s) => Math.max(0, s - 1))} disabled={stepIndex === 0}>
            Anterior
          </ChipButton>
          <span className="text-sm text-lilac/80">
            {stepIndex} / {replayed.length}
          </span>
          <ChipButton
            color="cyan"
            onClick={() => setStepIndex((s) => Math.min(replayed.length, s + 1))}
            disabled={stepIndex === replayed.length}
          >
            Seguinte
          </ChipButton>
        </div>

        <div className="w-full rounded-xl border-2 border-purple/40 bg-ink-soft p-4 text-center">
          {current ? (
            <>
              <p className="font-semibold text-cyan">
                {moveLabel(stepIndex)} {current.san}
              </p>
              <p className="text-lilac/80 mt-1">{current.explanation}</p>
            </>
          ) : (
            <p className="text-lilac/80">Posição inicial — carrega em &quot;Seguinte&quot; para começar.</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/OpeningStudy/OpeningStudy.test.tsx`
Expected: PASS (5/5).

- [ ] **Step 5: Run the full suite, typecheck, and lint**

Run: `npm run test && npx tsc --noEmit && npm run lint`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add components/OpeningStudy/OpeningStudy.tsx components/OpeningStudy/OpeningStudy.test.tsx
git commit -m "feat: OpeningStudy — step through an opening line move by move"
```

---

### Task 3: Routes — list page, study page, and the `/aprender` hub entry

**Files:**
- Create: `app/aprender/aberturas/page.tsx`
- Create: `app/aprender/aberturas/[id]/page.tsx`
- Modify: `app/aprender/page.tsx`

**Interfaces:**
- Consumes: `OPENINGS` from `@/lib/openings/data`; `OpeningStudy` from `@/components/OpeningStudy/OpeningStudy` (Task 2); `ChipButton` from `@/components/ChipButton/ChipButton`; `PageGlow`, `PageTitle` from `@/components/PageChrome/PageChrome` (existing, no changes).
- Produces: the routes `/aprender/aberturas` and `/aprender/aberturas/[id]`, and a working link to the first one from the `/aprender` hub. Nothing later in this plan consumes these — this is the plan's final task. A future sub-project (practice mode) will add a "Praticar esta abertura" link into `[id]/page.tsx`, out of scope here.

No dedicated test file for this task — per the Global Constraints, these are thin server-component pages (list + lookup + compose), matching the existing untested convention for `app/aprender/page.tsx` and `app/page.tsx`. Verification is the full suite (regression) plus a real Next.js build, which executes `generateStaticParams` and prerenders all 12 opening pages — a stronger check for this kind of file than a unit test would add.

- [ ] **Step 1: Create the list page**

Create `app/aprender/aberturas/page.tsx`:

```tsx
import Link from 'next/link';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { OPENINGS } from '@/lib/openings/data';

export default function AberturasPage() {
  return (
    <main className="relative min-h-screen max-w-2xl mx-auto p-8 flex flex-col gap-6 overflow-hidden bg-ink">
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <div>
        <PageTitle>ABERTURAS</PageTitle>
        <p className="mt-3">
          <ChipButton color="purple" href="/aprender">
            Voltar ao tutorial
          </ChipButton>
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {OPENINGS.map((opening) => (
          <li key={opening.id}>
            <Link
              href={`/aprender/aberturas/${opening.id}`}
              className="block rounded-xl border-2 border-purple/40 bg-ink-soft p-4 transition-colors hover:border-cyan"
            >
              <p className="font-semibold text-white">{opening.name}</p>
              <p className="text-sm text-lilac/80">{opening.description}</p>
              <p className="text-xs text-lilac/60 mt-1">
                {opening.lines.map((line) => line.name).join(' · ')}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 2: Create the per-opening study page**

Create `app/aprender/aberturas/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { OPENINGS } from '@/lib/openings/data';
import { OpeningStudy } from '@/components/OpeningStudy/OpeningStudy';

export async function generateStaticParams() {
  return OPENINGS.map((opening) => ({ id: opening.id }));
}

export default async function OpeningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opening = OPENINGS.find((o) => o.id === id);
  if (!opening) notFound();

  return (
    <main className="relative min-h-screen max-w-2xl mx-auto p-8 flex flex-col gap-6 overflow-hidden bg-ink">
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <div>
        <PageTitle>{opening.name.toUpperCase()}</PageTitle>
        <p className="mt-2 text-lilac/80">{opening.description}</p>
        <p className="mt-3">
          <ChipButton color="purple" href="/aprender/aberturas">
            Voltar às aberturas
          </ChipButton>
        </p>
      </div>
      <OpeningStudy opening={opening} />
    </main>
  );
}
```

- [ ] **Step 3: Add the "Aberturas" entry to the `/aprender` hub**

In `app/aprender/page.tsx`, the `TOPICS` array currently ends with:

```tsx
const TOPICS = [
  { href: '/aprender/pecas', title: 'Como as peças se movem', description: 'O movimento de cada peça, do peão ao rei.' },
  { href: '/aprender/regras-especiais', title: 'Regras especiais', description: 'Roque, en passant e promoção do peão.' },
  { href: '/aprender/fim-de-jogo', title: 'Fim de jogo', description: 'Xeque, xeque-mate, afogamento e empates.' },
  { href: '/aprender/estrategia', title: 'Princípios de estratégia', description: 'Ideias básicas para jogar melhor desde a abertura.' },
  { href: '/aprender/centipawns', title: 'Avaliação e centipawns', description: 'O que são centipawns e como interpretar "Boa jogada", "Imprecisão" e "Erro".' },
];
```

Add a 6th entry after `centipawns`:

```tsx
const TOPICS = [
  { href: '/aprender/pecas', title: 'Como as peças se movem', description: 'O movimento de cada peça, do peão ao rei.' },
  { href: '/aprender/regras-especiais', title: 'Regras especiais', description: 'Roque, en passant e promoção do peão.' },
  { href: '/aprender/fim-de-jogo', title: 'Fim de jogo', description: 'Xeque, xeque-mate, afogamento e empates.' },
  { href: '/aprender/estrategia', title: 'Princípios de estratégia', description: 'Ideias básicas para jogar melhor desde a abertura.' },
  { href: '/aprender/centipawns', title: 'Avaliação e centipawns', description: 'O que são centipawns e como interpretar "Boa jogada", "Imprecisão" e "Erro".' },
  { href: '/aprender/aberturas', title: 'Aberturas', description: 'Estuda 12 aberturas populares, lance a lance, com explicação em português.' },
];
```

Nothing else in `app/aprender/page.tsx` changes — the array is mapped generically, so the new entry renders with the same card styling as the other five automatically.

- [ ] **Step 4: Run the full suite, typecheck, and lint**

Run: `npm run test && npx tsc --noEmit && npm run lint`
Expected: all green (135+ tests, no new failures).

- [ ] **Step 5: Run a real build**

Run: `npm run build`
Expected: succeeds, with `/aprender/aberturas` and all 12 `/aprender/aberturas/[id]` routes listed as prerendered (●/SSG) in the build output — this is the concrete proof that `generateStaticParams` executes cleanly against every real `id` in `OPENINGS` and that `notFound()`/lookup logic doesn't throw for any of them.

- [ ] **Step 6: Commit**

```bash
git add app/aprender/aberturas/page.tsx app/aprender/aberturas/\[id\]/page.tsx app/aprender/page.tsx
git commit -m "feat: opening trainer — study-mode routes (list + per-opening page)"
```
