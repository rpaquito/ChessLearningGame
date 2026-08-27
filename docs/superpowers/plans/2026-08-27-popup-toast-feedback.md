# Popup/Toast Feedback System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the user explicit visual feedback for game-state events (xeque, xeque-mate, vitória/derrota, empate/afogamento) in `/jogar` and for settings changes in `/opções`, via a global toast for small confirmations and a blocking modal for game-ending results.

**Architecture:** One new global React Context (`ToastProvider`/`useToast`, mounted once in the root layout) drives a single always-mounted `Toast` card for lightweight, manually-dismissed confirmations, reused by both `/jogar` (xeque) and `/opções` (settings changes). A separate, page-local `GameEndModal` (same self-contained pattern as the existing `RulesModal`) handles the four game-ending statuses in `/jogar` only, sourcing its copy from a new pure helper, `describeGameEnd`, in `lib/chess/`.

**Tech Stack:** Next.js App Router (client components), React 19 (Context API, hooks), TypeScript, Tailwind v4 (existing design tokens only), Vitest + Testing Library (existing project conventions).

**Spec:** `docs/superpowers/specs/2026-08-27-popup-toast-feedback-design.md`

## Global Constraints

- No auto-dismiss anywhere. Every toast and the game-end modal close only via explicit user action (✕ button, Escape, or — modal only — backdrop click). No timers.
- A single "current toast" slot, no queue. Calling `show()` while a toast is visible replaces it instantly.
- Toast renders at `z-[60]`; `GameEndModal`'s backdrop stays at `z-50` (same as `RulesModal`), so the toast is always visible above an open modal.
- Reuse only existing design tokens (`cyan`, `gold`, `purple`, `pink`, `lilac`, `ink-soft`, `ink`) — no new colors introduced.
- `/configurar` is out of scope entirely — no toast, no wiring, no test there.
- `STATUS_LABEL` in `app/jogar/page.tsx` is untouched — it keeps rendering exactly as it does today.
- Copy is PT-PT and exact, per this table (do not paraphrase):
  | Event | Text |
  |---|---|
  | Xeque | "Xeque!" |
  | Dificuldade alterada | "Dificuldade por omissão alterada." |
  | Cor alterada | "Cor por omissão alterada." |
  | Tema do tabuleiro alterado | "Tema do tabuleiro alterado." |
  | Estilo das peças alterado | "Estilo das peças alterado." |
  | Fundo alterado | "Imagem de fundo alterada." |
  | Xeque-mate, IA, derrota | "Perdeste. Xeque-mate." |
  | Xeque-mate, IA, vitória | "Ganhaste! Xeque-mate." |
  | Xeque-mate, local, brancas vencem | "Xeque-mate! Vencem as brancas." |
  | Xeque-mate, local, pretas vencem | "Xeque-mate! Vencem as pretas." |
  | Afogamento | "Empate por afogamento." |
  | Empate (outro) | "Empate." |
- In any test that reads the DOM synchronously after a click that triggers a state update, use `fireEvent.click()` (Testing Library), never a raw `.click()` — see `CLAUDE.md`'s documented React 19 pitfall.
- No new page-level test files for `app/jogar/page.tsx` or `app/opcoes/page.tsx` — neither has one today, and this plan doesn't add one (component/lib tests cover the logic; Task 7 does a live browser pass instead).

---

## File Structure

```
lib/chess/
  gameEndMessage.ts          # NEW — describeGameEnd(), pure
  gameEndMessage.test.ts     # NEW

components/
  Toast/
    Toast.tsx                 # NEW — presentational card
    Toast.test.tsx            # NEW
    ToastProvider.tsx          # NEW — Context provider + useToast()
    ToastProvider.test.tsx     # NEW
  GameEndModal/
    GameEndModal.tsx           # NEW — self-contained, RulesModal-style
    GameEndModal.test.tsx      # NEW

app/
  layout.tsx                   # MODIFY — mount <ToastProvider>
  jogar/page.tsx                # MODIFY — wire toast + GameEndModal
  opcoes/page.tsx                # MODIFY — wire toast on each updateSettings call
```

---

### Task 1: `describeGameEnd` pure helper

**Files:**
- Create: `lib/chess/gameEndMessage.ts`
- Test: `lib/chess/gameEndMessage.test.ts`

**Interfaces:**
- Consumes: `GameStatus` type from `lib/chess/useChessGame.ts` (already exists: `'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw'`).
- Produces: `describeGameEnd(status: GameStatus, mode: 'ai' | 'local', humanColor: 'w' | 'b', turn: 'w' | 'b'): string | null` — used by Task 5 (`GameEndModal`).

- [ ] **Step 1: Write the failing test**

```ts
// lib/chess/gameEndMessage.test.ts
import { describe, expect, it } from 'vitest';
import { describeGameEnd } from './gameEndMessage';

describe('describeGameEnd', () => {
  it('returns the loss message when the human is checkmated in ai mode', () => {
    expect(describeGameEnd('checkmate', 'ai', 'w', 'w')).toBe('Perdeste. Xeque-mate.');
  });

  it('returns the win message when the opponent is checkmated in ai mode', () => {
    expect(describeGameEnd('checkmate', 'ai', 'w', 'b')).toBe('Ganhaste! Xeque-mate.');
  });

  it('returns "pretas vencem" when white is checkmated in local mode', () => {
    expect(describeGameEnd('checkmate', 'local', 'w', 'w')).toBe('Xeque-mate! Vencem as pretas.');
  });

  it('returns "brancas vencem" when black is checkmated in local mode', () => {
    expect(describeGameEnd('checkmate', 'local', 'w', 'b')).toBe('Xeque-mate! Vencem as brancas.');
  });

  it('returns the stalemate message regardless of mode/color', () => {
    expect(describeGameEnd('stalemate', 'ai', 'w', 'w')).toBe('Empate por afogamento.');
  });

  it('returns the generic draw message regardless of mode/color', () => {
    expect(describeGameEnd('draw', 'local', 'b', 'b')).toBe('Empate.');
  });

  it('returns null for "playing"', () => {
    expect(describeGameEnd('playing', 'ai', 'w', 'w')).toBeNull();
  });

  it('returns null for "check" (not a game-ending status)', () => {
    expect(describeGameEnd('check', 'ai', 'w', 'w')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/chess/gameEndMessage.test.ts`
Expected: FAIL — `Cannot find module './gameEndMessage'` (file doesn't exist yet).

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/chess/gameEndMessage.ts
import type { GameStatus } from './useChessGame';

/**
 * Frase de fim de jogo para o GameEndModal — só cobre os estados
 * verdadeiramente terminais (xeque-mate/afogamento/empate). Devolve
 * null para 'playing'/'check', que não abrem o modal.
 */
export function describeGameEnd(
  status: GameStatus,
  mode: 'ai' | 'local',
  humanColor: 'w' | 'b',
  turn: 'w' | 'b'
): string | null {
  if (status === 'checkmate') {
    // `turn` é sempre o lado que está em xeque-mate (a jogar, sem
    // lances legais) — o vencedor é sempre o lado oposto.
    if (mode === 'ai') {
      return turn === humanColor ? 'Perdeste. Xeque-mate.' : 'Ganhaste! Xeque-mate.';
    }
    return turn === 'w' ? 'Xeque-mate! Vencem as pretas.' : 'Xeque-mate! Vencem as brancas.';
  }
  if (status === 'stalemate') return 'Empate por afogamento.';
  if (status === 'draw') return 'Empate.';
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/chess/gameEndMessage.test.ts`
Expected: PASS (8/8)

- [ ] **Step 5: Commit**

```bash
git add lib/chess/gameEndMessage.ts lib/chess/gameEndMessage.test.ts
git commit -m "feat: add describeGameEnd pure helper for game-end copy"
```

---

### Task 2: `Toast` presentational component

**Files:**
- Create: `components/Toast/Toast.tsx`
- Test: `components/Toast/Toast.test.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `Toast({ toast, onDismiss }: ToastProps)` where `ToastProps = { toast: { id: number; message: string; tone: 'info' | 'check' } | null; onDismiss: () => void }`. Task 3 (`ToastProvider`) renders this directly.

- [ ] **Step 1: Write the failing test**

```tsx
// components/Toast/Toast.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { Toast } from './Toast';

describe('Toast', () => {
  it('renders nothing when toast is null', () => {
    render(<Toast toast={null} onDismiss={() => {}} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders the message when a toast is given', () => {
    render(<Toast toast={{ id: 1, message: 'Xeque!', tone: 'check' }} onDismiss={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('Xeque!');
  });

  it('applies a gold accent for the "check" tone', () => {
    render(<Toast toast={{ id: 1, message: 'Xeque!', tone: 'check' }} onDismiss={() => {}} />);
    expect(screen.getByRole('status').className).toContain('border-gold');
  });

  it('applies a cyan accent for the "info" tone', () => {
    render(<Toast toast={{ id: 1, message: 'Tema alterado.', tone: 'info' }} onDismiss={() => {}} />);
    expect(screen.getByRole('status').className).toContain('border-cyan');
  });

  it('calls onDismiss when the close button is clicked', () => {
    const onDismiss = vi.fn();
    render(<Toast toast={{ id: 1, message: 'Xeque!', tone: 'check' }} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/Toast/Toast.test.tsx`
Expected: FAIL — `Cannot find module './Toast'`

- [ ] **Step 3: Write minimal implementation**

```tsx
// components/Toast/Toast.tsx
export type ToastTone = 'info' | 'check';

export interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

export interface ToastProps {
  toast: ToastState | null;
  onDismiss: () => void;
}

const TONE_ACCENT: Record<ToastTone, string> = {
  info: 'border-cyan',
  check: 'border-gold',
};

/**
 * Cartão de toast puro — sem temporizador, fecho só manual (ver
 * decisão do brainstorming em
 * docs/superpowers/specs/2026-08-27-popup-toast-feedback-design.md).
 * z-[60], acima do z-50 do backdrop do RulesModal/GameEndModal, para
 * nunca ficar escondido atrás de um modal aberto.
 */
export function Toast({ toast, onDismiss }: ToastProps) {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 rounded-xl border-2 ${TONE_ACCENT[toast.tone]} bg-ink-soft px-4 py-2 text-lilac shadow-[3px_3px_0_rgba(0,0,0,0.35)]`}
    >
      <p className="text-sm font-medium">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fechar"
        className="rounded-full h-6 w-6 shrink-0 bg-pink text-[#3A0B1F] font-bold hover:scale-110 transition-transform"
      >
        ✕
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/Toast/Toast.test.tsx`
Expected: PASS (5/5)

- [ ] **Step 5: Commit**

```bash
git add components/Toast/Toast.tsx components/Toast/Toast.test.tsx
git commit -m "feat: add Toast presentational component"
```

---

### Task 3: `ToastProvider`/`useToast` global context + mount in root layout

**Files:**
- Create: `components/Toast/ToastProvider.tsx`
- Test: `components/Toast/ToastProvider.test.tsx`
- Modify: `app/layout.tsx:1-51` (add import + wrap `{children}`)

**Interfaces:**
- Consumes: `Toast`, `ToastState`, `ToastTone` from `components/Toast/Toast.tsx` (Task 2).
- Produces: `<ToastProvider>` (wraps a subtree), `useToast(): { show: (message: string, tone?: ToastTone) => void }` — used by Task 6 (`/jogar`) and Task 7 (`/opções`).

- [ ] **Step 1: Write the failing test**

```tsx
// components/Toast/ToastProvider.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastProvider } from './ToastProvider';
import { useToast } from './ToastProvider';

function Trigger({ message, tone }: { message: string; tone?: 'info' | 'check' }) {
  const { show } = useToast();
  return (
    <button type="button" onClick={() => show(message, tone)}>
      trigger: {message}
    </button>
  );
}

function BadConsumer() {
  useToast();
  return null;
}

describe('ToastProvider / useToast', () => {
  it('renders no toast initially', () => {
    render(
      <ToastProvider>
        <Trigger message="Xeque!" />
      </ToastProvider>
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows a toast when show() is called', () => {
    render(
      <ToastProvider>
        <Trigger message="Xeque!" tone="check" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('trigger: Xeque!'));
    expect(screen.getByRole('status')).toHaveTextContent('Xeque!');
  });

  it('replaces the current toast instantly instead of queueing', () => {
    render(
      <ToastProvider>
        <Trigger message="Xeque!" tone="check" />
        <Trigger message="Tema alterado." tone="info" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('trigger: Xeque!'));
    fireEvent.click(screen.getByText('trigger: Tema alterado.'));
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Tema alterado.');
  });

  it('dismisses the toast via its own close button', () => {
    render(
      <ToastProvider>
        <Trigger message="Xeque!" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('trigger: Xeque!'));
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('throws when useToast() is called outside a ToastProvider', () => {
    expect(() => render(<BadConsumer />)).toThrow(
      'useToast() só pode ser usado dentro de <ToastProvider>.'
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/Toast/ToastProvider.test.tsx`
Expected: FAIL — `Cannot find module './ToastProvider'`

- [ ] **Step 3: Write minimal implementation**

```tsx
// components/Toast/ToastProvider.tsx
'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Toast, type ToastState, type ToastTone } from './Toast';

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Único Context da app (decisão explícita do brainstorming — ver
 * docs/superpowers/specs/2026-08-27-popup-toast-feedback-design.md) —
 * montado uma vez em app/layout.tsx para que useToast() esteja
 * disponível em qualquer página cliente (hoje: /jogar e /opções) sem
 * prop-drilling.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    // Novo toast substitui instantaneamente o anterior — nunca há fila.
    setToast({ id: Date.now(), message, tone });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  // `show` nunca muda de identidade (useCallback, sem dependências
  // reativas) — memorizar o valor do Context com base nela garante que
  // a sua própria identidade também nunca muda. Sem isto, `{ show }`
  // seria recriado a cada render do provider (ou seja, a cada
  // show()/dismiss()), obrigando toda a app — o ToastProvider envolve
  // `{children}` na raiz — a voltar a renderizar de cada vez que um
  // toast aparece ou desaparece.
  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast toast={toast} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast() só pode ser usado dentro de <ToastProvider>.');
  }
  return ctx;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/Toast/ToastProvider.test.tsx`
Expected: PASS (5/5)

- [ ] **Step 5: Mount the provider in the root layout**

Read `app/layout.tsx` first (it's a Server Component; `ToastProvider` above is `'use client'`, so this composition is safe — same pattern as the existing `ServiceWorkerRegistration`).

Modify `app/layout.tsx`:

```tsx
// add near the top, alongside the other component import
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { ToastProvider } from '@/components/Toast/ToastProvider';
```

```tsx
// inside RootLayout's returned JSX, replace:
      <body className="antialiased">
        <ServiceWorkerRegistration />
        {children}
      </body>

// with:
      <body className="antialiased">
        <ServiceWorkerRegistration />
        <ToastProvider>{children}</ToastProvider>
      </body>
```

- [ ] **Step 6: Verify the app still builds and existing tests still pass**

Run: `npx tsc --noEmit && npx vitest run`
Expected: no TypeScript errors; full existing suite still green (this task doesn't change any existing behavior, only adds a wrapper).

- [ ] **Step 7: Commit**

```bash
git add components/Toast/ToastProvider.tsx components/Toast/ToastProvider.test.tsx app/layout.tsx
git commit -m "feat: add global ToastProvider/useToast, mount in root layout"
```

---

### Task 4: `GameEndModal` component

**Files:**
- Create: `components/GameEndModal/GameEndModal.tsx`
- Test: `components/GameEndModal/GameEndModal.test.tsx`

**Interfaces:**
- Consumes: `describeGameEnd` from `lib/chess/gameEndMessage.ts` (Task 1); `GameStatus` from `lib/chess/useChessGame.ts`; `PageTitle` from `components/PageChrome/PageChrome.tsx`; `ChipButton` from `components/ChipButton/ChipButton.tsx`.
- Produces: `GameEndModal({ open, status, mode, humanColor, turn, onClose, onPlayAgain }: GameEndModalProps)` — used by Task 6 (`/jogar`).

- [ ] **Step 1: Write the failing test**

```tsx
// components/GameEndModal/GameEndModal.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameEndModal } from './GameEndModal';

const noop = () => {};

describe('GameEndModal', () => {
  it('renders nothing when closed', () => {
    render(
      <GameEndModal
        open={false}
        status="checkmate"
        mode="ai"
        humanColor="w"
        turn="w"
        onClose={noop}
        onPlayAgain={noop}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders nothing for a non-terminal status even when open', () => {
    render(
      <GameEndModal
        open
        status="check"
        mode="ai"
        humanColor="w"
        turn="w"
        onClose={noop}
        onPlayAgain={noop}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the loss title when the human is checkmated in ai mode', () => {
    render(
      <GameEndModal
        open
        status="checkmate"
        mode="ai"
        humanColor="w"
        turn="w"
        onClose={noop}
        onPlayAgain={noop}
      />
    );
    expect(screen.getByRole('dialog', { name: 'Perdeste. Xeque-mate.' })).toBeInTheDocument();
  });

  it('shows the win title when the opponent is checkmated in ai mode', () => {
    render(
      <GameEndModal
        open
        status="checkmate"
        mode="ai"
        humanColor="w"
        turn="b"
        onClose={noop}
        onPlayAgain={noop}
      />
    );
    expect(screen.getByRole('dialog', { name: 'Ganhaste! Xeque-mate.' })).toBeInTheDocument();
  });

  it('shows the local-mode winner title', () => {
    render(
      <GameEndModal
        open
        status="checkmate"
        mode="local"
        humanColor="w"
        turn="w"
        onClose={noop}
        onPlayAgain={noop}
      />
    );
    expect(
      screen.getByRole('dialog', { name: 'Xeque-mate! Vencem as pretas.' })
    ).toBeInTheDocument();
  });

  it('shows the stalemate title', () => {
    render(
      <GameEndModal
        open
        status="stalemate"
        mode="ai"
        humanColor="w"
        turn="w"
        onClose={noop}
        onPlayAgain={noop}
      />
    );
    expect(screen.getByRole('dialog', { name: 'Empate por afogamento.' })).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <GameEndModal
        open
        status="draw"
        mode="ai"
        humanColor="w"
        turn="w"
        onClose={onClose}
        onPlayAgain={noop}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <GameEndModal
        open
        status="draw"
        mode="ai"
        humanColor="w"
        turn="w"
        onClose={onClose}
        onPlayAgain={noop}
      />
    );
    fireEvent.click(screen.getByTestId('game-end-modal-backdrop'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose when the dialog panel itself is clicked', () => {
    const onClose = vi.fn();
    render(
      <GameEndModal
        open
        status="draw"
        mode="ai"
        humanColor="w"
        turn="w"
        onClose={onClose}
        onPlayAgain={noop}
      />
    );
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(
      <GameEndModal
        open
        status="draw"
        mode="ai"
        humanColor="w"
        turn="w"
        onClose={onClose}
        onPlayAgain={noop}
      />
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onPlayAgain when "Jogar de novo" is clicked', () => {
    const onPlayAgain = vi.fn();
    render(
      <GameEndModal
        open
        status="draw"
        mode="ai"
        humanColor="w"
        turn="w"
        onClose={noop}
        onPlayAgain={onPlayAgain}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Jogar de novo' }));
    expect(onPlayAgain).toHaveBeenCalledOnce();
  });

  it('renders "Menu inicial" as a real link to /', () => {
    render(
      <GameEndModal
        open
        status="draw"
        mode="ai"
        humanColor="w"
        turn="w"
        onClose={noop}
        onPlayAgain={noop}
      />
    );
    expect(screen.getByRole('link', { name: 'Menu inicial' })).toHaveAttribute('href', '/');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/GameEndModal/GameEndModal.test.tsx`
Expected: FAIL — `Cannot find module './GameEndModal'`

- [ ] **Step 3: Write minimal implementation**

```tsx
// components/GameEndModal/GameEndModal.tsx
'use client';

import { useEffect } from 'react';
import type { GameStatus } from '@/lib/chess/useChessGame';
import { describeGameEnd } from '@/lib/chess/gameEndMessage';
import { PageTitle } from '@/components/PageChrome/PageChrome';
import { ChipButton } from '@/components/ChipButton/ChipButton';

export interface GameEndModalProps {
  open: boolean;
  status: GameStatus;
  mode: 'ai' | 'local';
  humanColor: 'w' | 'b';
  turn: 'w' | 'b';
  onClose: () => void;
  onPlayAgain: () => void;
}

/**
 * Auto-contido como o RulesModal (backdrop, role="dialog", fecho por
 * Escape, botão ✕) em vez de passar pelo ToastProvider — só /jogar o
 * usa e precisa de callbacks próprios da página (onPlayAgain). Ver
 * docs/superpowers/specs/2026-08-27-popup-toast-feedback-design.md.
 */
export function GameEndModal({
  open,
  status,
  mode,
  humanColor,
  turn,
  onClose,
  onPlayAgain,
}: GameEndModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  const title = describeGameEnd(status, mode, humanColor, turn);
  if (!title) return null;

  return (
    <div
      data-testid="game-end-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border-2 border-purple bg-ink-soft p-6 text-lilac"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <PageTitle as="h2" size="text-xl" strokeWidth={1}>
            {title}
          </PageTitle>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full h-8 w-8 shrink-0 bg-pink text-[#3A0B1F] font-bold hover:scale-110 transition-transform"
          >
            ✕
          </button>
        </div>
        <div className="flex gap-3">
          <ChipButton color="pink" onClick={onPlayAgain}>
            Jogar de novo
          </ChipButton>
          <ChipButton color="purple" href="/">
            Menu inicial
          </ChipButton>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/GameEndModal/GameEndModal.test.tsx`
Expected: PASS (12/12)

- [ ] **Step 5: Commit**

```bash
git add components/GameEndModal/GameEndModal.tsx components/GameEndModal/GameEndModal.test.tsx
git commit -m "feat: add GameEndModal for xeque-mate/empate/afogamento"
```

---

### Task 5: Wire toast + `GameEndModal` into `/jogar`

**Files:**
- Modify: `app/jogar/page.tsx`

**Interfaces:**
- Consumes: `useToast` from `components/Toast/ToastProvider.tsx` (Task 3); `GameEndModal` from `components/GameEndModal/GameEndModal.tsx` (Task 4); existing `state.status`, `state.turn` from `useChessGame` (`GameStatus` type unchanged); existing `mode`, `humanColor`, `handleReset` already defined in this file.
- Produces: nothing new consumed elsewhere — this is a leaf wiring task.

This task has no new unit test file (per Global Constraints — no page-level tests for `/jogar` today); it's verified by the existing test suite staying green plus the live browser pass in Task 7.

- [ ] **Step 1: Add the imports**

In `app/jogar/page.tsx`, alongside the existing imports (near line 12-13):

```tsx
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow } from '@/components/PageChrome/PageChrome';
import { useToast } from '@/components/Toast/ToastProvider';
import { GameEndModal } from '@/components/GameEndModal/GameEndModal';
```

- [ ] **Step 2: Add toast/modal state and the status-transition effect**

Near the other `useState`/`useRef` declarations (around line 50-58, right after `const [rulesOpen, setRulesOpen] = useState(false);`):

```tsx
  const toast = useToast();
  const [gameEndOpen, setGameEndOpen] = useState(false);
  const prevStatus = useRef<typeof state.status>('playing');

  // Dispara toast/modal só em MUDANÇAS de state.status, nunca a cada
  // render — ver docs/superpowers/specs/2026-08-27-popup-toast-feedback-design.md.
  useEffect(() => {
    if (state.status === prevStatus.current) return;
    prevStatus.current = state.status;

    if (state.status === 'check') {
      toast.show('Xeque!', 'check');
    } else if (
      state.status === 'checkmate' ||
      state.status === 'stalemate' ||
      state.status === 'draw'
    ) {
      setGameEndOpen(true);
    }
  }, [state.status, toast]);
```

- [ ] **Step 3: Reset toast/modal state in `handleReset`**

Find the existing `handleReset` function (around line 190-197):

```tsx
  function handleReset() {
    reset();
    setSelectedSquare(null);
    setSuggestion(null);
    setSuggestionExplanation(null);
    setLastMoveQuality(null);
    setLastMoveExplanation(null);
  }
```

Add two lines so it also clears the game-end modal and the status-tracking ref:

```tsx
  function handleReset() {
    reset();
    setSelectedSquare(null);
    setSuggestion(null);
    setSuggestionExplanation(null);
    setLastMoveQuality(null);
    setLastMoveExplanation(null);
    setGameEndOpen(false);
    prevStatus.current = 'playing';
  }
```

- [ ] **Step 4: Mount `<GameEndModal>` next to the existing `<RulesModal>`**

Find the existing render (around line 275):

```tsx
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </main>
  );
```

Add `<GameEndModal>` right after it:

```tsx
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <GameEndModal
        open={gameEndOpen}
        status={state.status}
        mode={mode}
        humanColor={humanColor}
        turn={state.turn}
        onClose={() => setGameEndOpen(false)}
        onPlayAgain={handleReset}
      />
    </main>
  );
```

- [ ] **Step 5: Run the full test suite and typecheck**

Run: `npx tsc --noEmit && npx vitest run`
Expected: no TypeScript errors; all existing tests still pass (this task adds no new automated tests of its own — see Task 7 for the live verification pass).

- [ ] **Step 6: Commit**

```bash
git add app/jogar/page.tsx
git commit -m "feat: wire xeque toast and GameEndModal into /jogar"
```

---

### Task 6: Wire settings-changed toast into `/opções`

**Files:**
- Modify: `app/opcoes/page.tsx`

**Interfaces:**
- Consumes: `useToast` from `components/Toast/ToastProvider.tsx` (Task 3); existing `updateSettings` calls already in this file (unchanged signatures).
- Produces: nothing new consumed elsewhere — leaf wiring task, same no-new-test-file rule as Task 5.

- [ ] **Step 1: Add the import and the hook call**

In `app/opcoes/page.tsx`, add the import near the other component imports (line 10-11):

```tsx
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { useToast } from '@/components/Toast/ToastProvider';
```

Inside `OpcoesPage`, right after `const { settings, updateSettings } = useSettings();` (line 120):

```tsx
export default function OpcoesPage() {
  const { settings, updateSettings } = useSettings();
  const toast = useToast();
```

- [ ] **Step 2: Add a toast call at each of the 5 `updateSettings` call sites**

Difficulty (was `onClick={() => updateSettings({ defaultDifficulty: level })}`, line 134):

```tsx
                onClick={() => {
                  updateSettings({ defaultDifficulty: level });
                  toast.show('Dificuldade por omissão alterada.');
                }}
```

Color (was `onClick={() => updateSettings({ defaultColor: value })}`, line 156):

```tsx
                onClick={() => {
                  updateSettings({ defaultColor: value });
                  toast.show('Cor por omissão alterada.');
                }}
```

Board theme (was `onChange={(boardTheme) => updateSettings({ boardTheme })}`, line 175):

```tsx
          onChange={(boardTheme) => {
            updateSettings({ boardTheme });
            toast.show('Tema do tabuleiro alterado.');
          }}
```

Piece style (was `onChange={(pieceStyle) => updateSettings({ pieceStyle })}`, line 184):

```tsx
          onChange={(pieceStyle) => {
            updateSettings({ pieceStyle });
            toast.show('Estilo das peças alterado.');
          }}
```

Background (was `onChange={(backgroundTheme) => updateSettings({ backgroundTheme })}`, line 197):

```tsx
          onChange={(backgroundTheme) => {
            updateSettings({ backgroundTheme });
            toast.show('Imagem de fundo alterada.');
          }}
```

- [ ] **Step 3: Run the full test suite and typecheck**

Run: `npx tsc --noEmit && npx vitest run`
Expected: no TypeScript errors; `lib/settings/useSettings.test.ts` and every other existing test still passes unchanged.

- [ ] **Step 4: Commit**

```bash
git add app/opcoes/page.tsx
git commit -m "feat: wire settings-changed toast into /opções"
```

---

### Task 7: Lint + live verification

**Files:** none (verification only).

- [ ] **Step 1: Run lint**

Run: `npm run lint`
Expected: no errors. If ESLint flags the `useEffect` dependency array in `app/jogar/page.tsx` (Task 5, Step 2) for `toast` — it shouldn't, since `useToast()`'s returned object is now stable via `useMemo` (Task 3) — fix inline rather than suppressing.

- [ ] **Step 2: Run the full test suite one more time**

Run: `npx vitest run`
Expected: every test green, including all pre-existing ones (this plan never modifies existing test files).

- [ ] **Step 3: Live verification in the browser**

Start the dev server (`npm run dev` or via the `run` skill) and, using Claude in Chrome or Chrome DevTools MCP, walk through:

1. Navigate to `/jogar` in `mode=local`. Play a move that puts a king in check — confirm the "Xeque!" toast appears top-center with a gold border, and dismiss it with its ✕.
2. Continue to checkmate — confirm `GameEndModal` opens with the correct PT-PT title, `STATUS_LABEL` above the board still reads "Xeque-mate" unchanged, and the existing bottom `ChipButton` row is still visible/functional behind the modal.
3. Click "Jogar de novo" inside the modal — confirm the board resets, the modal closes, and playing into check again still triggers a fresh toast (proves `prevStatus`/`gameEndOpen` were correctly cleared by `handleReset`).
4. Navigate to `/opções` and click a different board theme, then a different default difficulty — confirm each click shows its own toast with a cyan border, and that clicking a second option while the first toast is still open replaces it instantly rather than stacking.
5. Confirm `/configurar` is unchanged — no toast fires there.

Fix anything that doesn't match the spec before considering this plan complete; this is the same "don't just trust the diff" verification pass documented repeatedly in this project's `CLAUDE.md`/backlog history.

- [ ] **Step 4: Update the project backlog memory**

Once verified, update the "Popup/toast feedback system" entry in the user's memory file (`project-backlog.md`) to mark it done, following the same style as other completed backlog items in that file (brief summary of what shipped, commit references, any non-obvious things hit). This is a memory-file update, not a repo commit.
