# Treinador de aberturas — Modo de prática Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the opening-practice UI — a new route (`/aprender/aberturas/[id]/praticar`) where the user plays a chosen opening line against a deterministic opponent (no engine), with wrong moves blocked and the correct one revealed after a failed attempt, plus the "Praticar esta abertura" entry point from the study page.

**Architecture:** One new client component (`OpeningPractice`) that reuses `replayLine`'s precomputed per-ply data exactly like `OpeningStudy` does, but drives both the user's and the opponent's moves off the same index instead of stepping through it passively. Two thin route/wiring changes compose it into the app. `lib/openings/` (unchanged since sub-project 1) and `OpeningStudy`/the `/aprender/aberturas` routes (unchanged since sub-project 2) are both already merged to `main` — this plan only adds practice mode on top.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, chess.js, Vitest + Testing Library (`vi.useFakeTimers()` for the opponent's delayed auto-move).

**Spec:** `docs/superpowers/specs/2026-08-26-opening-trainer-practice-mode-design.md`

## Global Constraints

- No Stockfish, no centipawn-loss classification, no `moveExplanation.ts` — the opponent always replays the chosen line's own moves; a user move is only ever "right" (exact `{from, to}` match against `replayLine`'s output) or "wrong" (rejected). (spec, Não-objetivos)
- A wrong move is **never applied** to the board — it's rejected, and the correct move is revealed via `ChessBoard`'s existing `suggestedMove` prop after the failed attempt. (spec §2)
- No transition to free play once the line is completed — a completion card replaces the board controls, with "Praticar outra vez" / "Voltar às aberturas". (spec, Não-objetivos)
- The user's color is derived from `opening.id.startsWith('defesa-')` (Black) vs. everything else (White) — no color picker. (spec §1)
- No persistence — switching lines or remounting always resets to ply 0. (spec, Não-objetivos)
- The opponent's auto-move fires `OPPONENT_MOVE_DELAY_MS = 500` after its turn begins, via `setTimeout` inside a `useEffect` that cleans up its own timer. (spec §2)
- Board/piece theme come from `useSettings()`, same as `OpeningStudy`. (spec §2)
- Route files get no dedicated test file — matches the sub-project 2 convention (`app/aprender/aberturas/page.tsx`, `[id]/page.tsx` have none). Verification is the full suite plus a real `npm run build`. (spec §Testes, inherited convention)
- Test files sit next to the module/component they test (`*.test.tsx`); any click that changes a component's own state uses `fireEvent`; a component-owned `setTimeout` is tested with `vi.useFakeTimers()` + `vi.advanceTimersByTime()` inside `act()`, with `afterEach(() => vi.useRealTimers())` — the exact pattern already used in `components/ChessBoard/ChessBoard.test.tsx` for its capture fade-out. (spec §Testes, `CLAUDE.md`)
- All new user-visible text is PT-PT.

---

### Task 1: `OpeningPractice` — the practice-mode component

**Files:**
- Create: `components/OpeningPractice/OpeningPractice.tsx`
- Create: `components/OpeningPractice/OpeningPractice.test.tsx`

**Interfaces:**
- Consumes (all pre-existing, already merged to `main` — do not modify): `Opening`, `OpeningLine` from `@/lib/openings/types`; `OPENINGS` from `@/lib/openings/data`; `replayLine(line: OpeningLine): ReplayedMove[]` from `@/lib/openings/replayLine`; `useSettings()` from `@/lib/settings/useSettings`; `legalTargetsFrom(fen: string, square: Square): Square[]` and `checkedKingSquare(fen: string): Square | null` from `@/lib/chess/legalMoves`; `ChessBoard` from `@/components/ChessBoard/ChessBoard` (props include `fen`, `boardTheme`, `pieceStyle`, `orientation`, `selectedSquare`, `legalTargets`, `lastMove`, `checkSquare`, `suggestedMove`, `interactive`, `onSquareClick`); `ChipButton` from `@/components/ChipButton/ChipButton`; `ACTIVE_TOGGLE_STYLE` from `@/lib/ui/activeToggleStyle`.
- Produces: `export function OpeningPractice({ opening }: { opening: Opening })` — Task 2's `[id]/praticar/page.tsx` renders it.

- [ ] **Step 1: Write the failing test**

Create `components/OpeningPractice/OpeningPractice.test.tsx`:

```tsx
import { describe, expect, it, vi, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { OpeningPractice } from './OpeningPractice';
import { OPENINGS } from '@/lib/openings/data';
import type { Opening } from '@/lib/openings/types';

afterEach(() => {
  vi.useRealTimers();
});

const italiana = OPENINGS.find((o) => o.id === 'abertura-italiana')!;
const siciliana = OPENINGS.find((o) => o.id === 'defesa-siciliana')!;

// Linha curta e sintética, só para o teste de conclusão — evita ter de
// escrever os 9 lances reais da Italiana à mão.
const shortOpening: Opening = {
  id: 'abertura-teste',
  name: 'Abertura de Teste',
  description: 'Linha curta só para testes.',
  lines: [
    {
      name: 'Linha única',
      moves: [
        { san: 'e4', explanation: 'Ocupa o centro.' },
        { san: 'e5', explanation: 'Resposta simétrica.' },
      ],
    },
  ],
};

function clickSquare(container: HTMLElement, square: string) {
  const button = container.querySelector(`[data-square="${square}"]`) as HTMLButtonElement;
  fireEvent.click(button);
}

describe('OpeningPractice', () => {
  it('is interactive on the user\'s first turn (White protagonist) and accepts the correct move', () => {
    const { container } = render(<OpeningPractice opening={italiana} />);
    expect(screen.getByText('A tua vez: encontra o lance da linha.')).toBeInTheDocument();

    clickSquare(container, 'e2');
    clickSquare(container, 'e4');

    expect(screen.queryByText('A tua vez: encontra o lance da linha.')).not.toBeInTheDocument();
    expect(screen.getByText('A pensar…')).toBeInTheDocument();
  });

  it('rejects a legal-but-wrong move and reveals the expected one', () => {
    const { container } = render(<OpeningPractice opening={italiana} />);

    clickSquare(container, 'e2');
    clickSquare(container, 'e3');

    expect(
      screen.getByText('Não é esse — o lance da linha era e4. Tenta de novo.')
    ).toBeInTheDocument();
  });

  it('auto-plays the opponent\'s move after a delay once the user plays correctly', () => {
    vi.useFakeTimers();
    const { container } = render(<OpeningPractice opening={italiana} />);

    clickSquare(container, 'e2');
    clickSquare(container, 'e4');
    expect(screen.getByText('A pensar…')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.queryByText('A pensar…')).not.toBeInTheDocument();
    expect(screen.getByText('A tua vez: encontra o lance da linha.')).toBeInTheDocument();
  });

  it('auto-plays the opponent\'s first move when the user is Black (Defesa Siciliana)', () => {
    vi.useFakeTimers();
    render(<OpeningPractice opening={siciliana} />);

    expect(screen.getByText('A pensar…')).toBeInTheDocument();
    expect(screen.queryByText('A tua vez: encontra o lance da linha.')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText('A tua vez: encontra o lance da linha.')).toBeInTheDocument();
  });

  it('shows the completion card once the line is finished', () => {
    vi.useFakeTimers();
    const { container } = render(<OpeningPractice opening={shortOpening} />);

    clickSquare(container, 'e2');
    clickSquare(container, 'e4');
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText('Linha completa!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Praticar outra vez' })).toBeInTheDocument();
  });

  it('switching lines resets progress', () => {
    const { container } = render(<OpeningPractice opening={italiana} />);

    clickSquare(container, 'e2');
    clickSquare(container, 'e4');
    expect(screen.getByText('A pensar…')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Gambito Evans' }));

    expect(screen.getByText('A tua vez: encontra o lance da linha.')).toBeInTheDocument();
  });
});
```

This uses `abertura-italiana` (protagonist White, main line `e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3` / `Gambito Evans` `e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3`) and `defesa-siciliana` (protagonist Black) from the real, already-merged `OPENINGS`, plus one synthetic 2-move `Opening` fixture for the completion case.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/OpeningPractice/OpeningPractice.test.tsx`
Expected: FAIL — `Cannot find module './OpeningPractice'`.

- [ ] **Step 3: Write `components/OpeningPractice/OpeningPractice.tsx`**

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { ACTIVE_TOGGLE_STYLE } from '@/lib/ui/activeToggleStyle';
import { useSettings } from '@/lib/settings/useSettings';
import { replayLine } from '@/lib/openings/replayLine';
import { legalTargetsFrom, checkedKingSquare } from '@/lib/chess/legalMoves';
import type { Opening } from '@/lib/openings/types';

const START_FEN = new Chess().fen();
const OPPONENT_MOVE_DELAY_MS = 500;

/**
 * "defesa-*" são respostas às pretas; todo o resto ("abertura-*",
 * "gambito-da-dama", "sistema-londres") são sistemas das brancas.
 * Cobre os 12 ids reais de OPENINGS sem precisar de um campo novo no
 * modelo de dados — ver spec para a verificação caso a caso.
 */
function protagonistColorFor(opening: Opening): 'w' | 'b' {
  return opening.id.startsWith('defesa-') ? 'b' : 'w';
}

export function OpeningPractice({ opening }: { opening: Opening }) {
  const { settings } = useSettings();
  const protagonistColor = useMemo(() => protagonistColorFor(opening), [opening]);
  const replayedLines = useMemo(() => opening.lines.map((line) => replayLine(line)), [opening]);

  const [lineIndex, setLineIndex] = useState(0);
  const [plyIndex, setPlyIndex] = useState(0);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [wrongAttempt, setWrongAttempt] = useState(false);

  const replayed = replayedLines[lineIndex];
  const fen = plyIndex === 0 ? START_FEN : replayed[plyIndex - 1].fen;
  const lastMove = plyIndex === 0 ? null : { from: replayed[plyIndex - 1].from, to: replayed[plyIndex - 1].to };
  const checkSquare = checkedKingSquare(fen);
  const completed = plyIndex === replayed.length;
  const nextMoverColor: 'w' | 'b' = plyIndex % 2 === 0 ? 'w' : 'b';
  const isUserTurn = !completed && nextMoverColor === protagonistColor;
  const legalTargets = selectedSquare ? legalTargetsFrom(fen, selectedSquare) : [];
  const expected = completed ? null : replayed[plyIndex];

  function selectLine(index: number) {
    setLineIndex(index);
    setPlyIndex(0);
    setSelectedSquare(null);
    setWrongAttempt(false);
  }

  function restartLine() {
    setPlyIndex(0);
    setSelectedSquare(null);
    setWrongAttempt(false);
  }

  // O adversário joga sempre o lance da própria linha, automaticamente.
  useEffect(() => {
    if (completed || isUserTurn) return;
    const timer = setTimeout(() => {
      setPlyIndex((p) => p + 1);
      setWrongAttempt(false);
    }, OPPONENT_MOVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [completed, isUserTurn, plyIndex]);

  function handleSquareClick(square: Square) {
    if (!isUserTurn || !expected) return;

    if (selectedSquare && legalTargets.includes(square)) {
      if (square === expected.to && selectedSquare === expected.from) {
        setPlyIndex((p) => p + 1);
        setWrongAttempt(false);
      } else {
        setWrongAttempt(true);
      }
      setSelectedSquare(null);
      return;
    }
    setSelectedSquare(square);
    setWrongAttempt(false);
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
          orientation={protagonistColor === 'w' ? 'white' : 'black'}
          selectedSquare={selectedSquare}
          legalTargets={legalTargets}
          lastMove={lastMove}
          checkSquare={checkSquare}
          suggestedMove={wrongAttempt && expected ? { from: expected.from, to: expected.to } : null}
          interactive={isUserTurn}
          onSquareClick={handleSquareClick}
        />

        {completed ? (
          <div className="w-full rounded-xl border-2 border-gold bg-ink-soft p-4 text-center flex flex-col gap-3">
            <p className="font-semibold text-gold">Linha completa!</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <ChipButton color="pink" onClick={restartLine}>
                Praticar outra vez
              </ChipButton>
              <ChipButton color="purple" href="/aprender/aberturas">
                Voltar às aberturas
              </ChipButton>
            </div>
          </div>
        ) : (
          <div className="w-full rounded-xl border-2 border-purple/40 bg-ink-soft p-4 text-center">
            {isUserTurn ? (
              wrongAttempt ? (
                <p className="text-lilac/80">
                  Não é esse — o lance da linha era {expected!.san}. Tenta de novo.
                </p>
              ) : (
                <p className="text-lilac/80">A tua vez: encontra o lance da linha.</p>
              )
            ) : (
              <p className="text-lilac/80">A pensar…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/OpeningPractice/OpeningPractice.test.tsx`
Expected: PASS (6/6).

- [ ] **Step 5: Run the full suite, typecheck, and lint**

Run: `npm run test && npx tsc --noEmit && npm run lint`
Expected: all green (143 existing tests + the 6 new ones).

- [ ] **Step 6: Commit**

```bash
git add components/OpeningPractice/OpeningPractice.tsx components/OpeningPractice/OpeningPractice.test.tsx
git commit -m "feat: OpeningPractice — drill an opening line against a deterministic opponent"
```

---

### Task 2: Routes — practice page and the study-page entry point

**Files:**
- Create: `app/aprender/aberturas/[id]/praticar/page.tsx`
- Modify: `app/aprender/aberturas/[id]/page.tsx`

**Interfaces:**
- Consumes: `OPENINGS` from `@/lib/openings/data`; `OpeningPractice` from `@/components/OpeningPractice/OpeningPractice` (Task 1); `ChipButton`, `PageGlow`/`PageTitle` (existing, unchanged).
- Produces: the route `/aprender/aberturas/[id]/praticar`, and a working "Praticar esta abertura" link from the study page to it. Nothing later in this plan consumes these — this is the plan's final task.

No dedicated test file for this task — same convention as sub-project 2's route task. Verification is the full suite (regression) plus a real `npm run build`.

- [ ] **Step 1: Create the practice page**

Create `app/aprender/aberturas/[id]/praticar/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { OPENINGS } from '@/lib/openings/data';
import { OpeningPractice } from '@/components/OpeningPractice/OpeningPractice';

export async function generateStaticParams() {
  return OPENINGS.map((opening) => ({ id: opening.id }));
}

export default async function PraticarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opening = OPENINGS.find((o) => o.id === id);
  if (!opening) notFound();

  return (
    <main className="relative min-h-screen max-w-2xl mx-auto p-8 flex flex-col gap-6 overflow-hidden bg-ink">
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <div>
        <PageTitle>PRATICAR: {opening.name.toUpperCase()}</PageTitle>
        <p className="mt-3">
          <ChipButton color="purple" href={`/aprender/aberturas/${opening.id}`}>
            Voltar ao estudo
          </ChipButton>
        </p>
      </div>
      <OpeningPractice key={opening.id} opening={opening} />
    </main>
  );
}
```

- [ ] **Step 2: Add the "Praticar esta abertura" button to the study page**

In `app/aprender/aberturas/[id]/page.tsx`, replace:

```tsx
        <p className="mt-3">
          <ChipButton color="purple" href="/aprender/aberturas">
            Voltar às aberturas
          </ChipButton>
        </p>
```

with:

```tsx
        <div className="mt-3 flex flex-wrap gap-3">
          <ChipButton color="purple" href="/aprender/aberturas">
            Voltar às aberturas
          </ChipButton>
          <ChipButton color="gold" href={`/aprender/aberturas/${opening.id}/praticar`}>
            Praticar esta abertura
          </ChipButton>
        </div>
```

Nothing else in that file changes — `generateStaticParams`, the `notFound()` lookup, the `<PageTitle>`/description, and `<OpeningStudy key={opening.id} opening={opening} />` all stay exactly as they are.

- [ ] **Step 3: Run the full suite, typecheck, and lint**

Run: `npm run test && npx tsc --noEmit && npm run lint`
Expected: all green (149 tests: 143 existing + 6 from Task 1).

- [ ] **Step 4: Run a real build**

Run: `npm run build`
Expected: succeeds, with `/aprender/aberturas/[id]/praticar` listed as a prerendered (SSG) route alongside the existing `/aprender/aberturas/[id]` — 12 static pages for each dynamic segment, same as sub-project 2's build verification.

- [ ] **Step 5: Commit**

```bash
git add app/aprender/aberturas/\[id\]/praticar/page.tsx app/aprender/aberturas/\[id\]/page.tsx
git commit -m "feat: opening trainer — practice-mode route and study-page entry point"
```
