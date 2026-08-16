# Jogo de Xadrez com Dicas de Aprendizado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js web app to play chess (vs. AI or two-player local) with an optional "learning mode" that highlights legal moves, threatened pieces, move suggestions, and move-quality feedback, plus a separate tutorial section.

**Architecture:** Client-side only — no backend, no database. `chess.js` owns the rules; a `useChessGame` hook wraps it and is the single source of truth for game state. Stockfish (WASM, single-threaded) runs in a Web Worker for both the AI opponent and the learning-mode hints. Pure logic (rules helpers, difficulty mapping, move classification, threat detection, UCI parsing) is TDD'd with Vitest; UI components are hand-verified in the browser per the approved spec.

**Tech Stack:** Next.js (App Router) + TypeScript + Tailwind CSS, `chess.js`, `stockfish` (npm package, single-threaded WASM build), Vitest + Testing Library for hook/logic tests, Docker (multi-stage, `node:24-alpine`) for containerized deploy, Vercel for hosted deploy.

**Spec:** `docs/superpowers/specs/2026-08-16-chess-game-design.md`

## Global Constraints

- No user accounts, login, or online multiplayer — local-only (vs. AI or pass-and-play).
- No backend, no database, no required environment variables.
- All UI copy is in Portuguese (pt-BR).
- Must deploy both to Vercel (zero-config) and as a Docker image (`output: 'standalone'`, `node:24-alpine` runtime).
- Persistence is `localStorage` only, and failures there must degrade silently (no crash).
- Pure logic (rules helpers, difficulty, move classification, threats, UCI parsing) is TDD'd with Vitest; `ChessBoard` and page-level UI are verified manually in the browser (per approved spec — no automated UI tests in this first version).

---

## File Structure

```
app/
  layout.tsx                          # root shell, pt-BR, metadata (Task 8)
  page.tsx                            # mode selection home page (Task 8)
  jogar/page.tsx                      # game screen: vs. AI or 2 players (Task 10)
  aprender/page.tsx                   # tutorial index (Task 11)
  aprender/pecas/page.tsx             # how each piece moves (Task 11)
  aprender/regras-especiais/page.tsx  # castling, en passant, promotion (Task 11)
  aprender/fim-de-jogo/page.tsx       # check/mate/stalemate/draws (Task 11)
  aprender/estrategia/page.tsx        # basic strategy principles (Task 11)
components/
  ChessBoard/ChessBoard.tsx           # interactive board, pure rendering (Task 7)
  ChessBoard/pieceGlyphs.ts           # unicode glyph lookup (Task 7)
  ModeSelector/ModeSelector.tsx       # mode/difficulty/color picker (Task 8)
  LearningPanel/LearningPanel.tsx     # hints toggle + suggestion + quality badge (Task 9)
lib/
  chess/uciParser.ts                  # pure UCI protocol parsing (Task 2)
  chess/difficulty.ts                 # difficulty -> engine options (Task 3)
  chess/moveClassification.ts         # centipawn loss -> move quality (Task 4)
  chess/threats.ts                    # which of a side's pieces are attacked (Task 4)
  chess/useChessGame.ts               # game state hook, wraps chess.js (Task 5)
  chess/stockfishClient.ts            # Worker wrapper, UCI I/O (Task 6)
public/
  stockfish/stockfish-18-lite-single.js    # vendored engine (Task 6)
  stockfish/stockfish-18-lite-single.wasm  # vendored engine binary (Task 6)
Dockerfile                            # multi-stage build (Task 12)
.dockerignore                         # (Task 12)
vitest.config.ts                      # (Task 1)
vitest.setup.ts                       # (Task 1)
README.md                             # dev/test/docker/deploy instructions (Task 12)
```

---

### Task 1: Bootstrap Next.js app with TypeScript, Tailwind, and Vitest

**Files:**
- Create: entire Next.js scaffold (`app/`, `package.json`, `tsconfig.json`, `next.config.*`, `.gitignore`, etc.)
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Modify: `package.json` (add `test`/`test:watch` scripts)

**Interfaces:**
- Produces: a working `npm run dev`, `npm run build`, and `npm test` in this repo.

- [ ] **Step 1: Scaffold into a temp directory (repo root already has `.git` and `docs/`, which `create-next-app` would reject as non-empty)**

```bash
cd /Users/rpaquito/Documents/Projects/Teste
npx --yes create-next-app@latest tmp-app \
  --typescript --tailwind --eslint --app \
  --no-src-dir --import-alias "@/*" --use-npm --turbopack
```

- [ ] **Step 2: Merge the scaffold into the repo root, keeping our existing `.git` and `docs/`**

```bash
cd /Users/rpaquito/Documents/Projects/Teste
rm -rf tmp-app/.git
shopt -s dotglob nullglob
mv tmp-app/* .
rmdir tmp-app
```

- [ ] **Step 3: Verify the scaffold builds**

Run: `npm run build`
Expected: build completes with no errors (exit code 0).

- [ ] **Step 4: Install test tooling**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/dom
```

- [ ] **Step 5: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

- [ ] **Step 6: Create `vitest.setup.ts`**

```typescript
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 7: Add test scripts to `package.json`**

Add to the `"scripts"` object:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 8: Add a throwaway smoke test to confirm the toolchain is wired**

Create `lib/sanity.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

describe('vitest setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm test`
Expected: 1 test file, 1 test, PASS.

- [ ] **Step 9: Remove the smoke test (its job was only to prove the config works)**

```bash
rm lib/sanity.test.ts
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: bootstrap Next.js app with TypeScript, Tailwind and Vitest"
```

---

### Task 2: UCI protocol parsing helpers

**Files:**
- Create: `lib/chess/uciParser.ts`
- Test: `lib/chess/uciParser.test.ts`

**Interfaces:**
- Produces: `parseBestMove(line: string): string | null`, `parseScoreCp(line: string): number | null`, `isReadyLine(line: string): boolean`, `parseUciMove(uci: string): { from: string; to: string; promotion?: string }` — used by Task 6 (`stockfishClient.ts`) and Task 10 (`jogar/page.tsx`).

- [ ] **Step 1: Write the failing tests**

Create `lib/chess/uciParser.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { parseBestMove, parseScoreCp, isReadyLine, parseUciMove } from './uciParser';

describe('parseBestMove', () => {
  it('extracts the move from a bestmove line', () => {
    expect(parseBestMove('bestmove e2e4 ponder e7e5')).toBe('e2e4');
  });

  it('returns null for lines without bestmove', () => {
    expect(parseBestMove('info depth 10 score cp 25')).toBeNull();
  });
});

describe('parseScoreCp', () => {
  it('extracts a positive centipawn score', () => {
    expect(parseScoreCp('info depth 12 score cp 34 nodes 1000')).toBe(34);
  });

  it('extracts a negative centipawn score', () => {
    expect(parseScoreCp('info depth 12 score cp -120 nodes 1000')).toBe(-120);
  });

  it('returns null when there is no score', () => {
    expect(parseScoreCp('bestmove e2e4')).toBeNull();
  });
});

describe('isReadyLine', () => {
  it('recognizes the readyok line', () => {
    expect(isReadyLine('readyok')).toBe(true);
  });

  it('rejects other lines', () => {
    expect(isReadyLine('uciok')).toBe(false);
  });
});

describe('parseUciMove', () => {
  it('parses a simple move without promotion', () => {
    expect(parseUciMove('e2e4')).toEqual({ from: 'e2', to: 'e4' });
  });

  it('parses a promotion move', () => {
    expect(parseUciMove('e7e8q')).toEqual({ from: 'e7', to: 'e8', promotion: 'q' });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- lib/chess/uciParser.test.ts`
Expected: FAIL — `Cannot find module './uciParser'`.

- [ ] **Step 3: Implement `lib/chess/uciParser.ts`**

```typescript
export function parseBestMove(line: string): string | null {
  const match = /^bestmove (\S+)/.exec(line);
  return match ? match[1] : null;
}

export function parseScoreCp(line: string): number | null {
  const match = /score cp (-?\d+)/.exec(line);
  return match ? parseInt(match[1], 10) : null;
}

export function isReadyLine(line: string): boolean {
  return line === 'readyok';
}

export function parseUciMove(uci: string): { from: string; to: string; promotion?: string } {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci[4] : undefined;
  return promotion ? { from, to, promotion } : { from, to };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- lib/chess/uciParser.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/chess/uciParser.ts lib/chess/uciParser.test.ts
git commit -m "feat: add UCI protocol parsing helpers"
```

---

### Task 3: Difficulty-to-engine-options mapping

**Files:**
- Create: `lib/chess/difficulty.ts`
- Test: `lib/chess/difficulty.test.ts`

**Interfaces:**
- Produces: `type Difficulty = 'facil' | 'medio' | 'dificil'`, `interface EngineOptions { skillLevel: number; depth: number; moveTimeMs: number }`, `difficultyToEngineOptions(difficulty: Difficulty): EngineOptions` — used by Task 6, Task 8 (`ModeSelector`), Task 10.

- [ ] **Step 1: Write the failing tests**

Create `lib/chess/difficulty.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { difficultyToEngineOptions } from './difficulty';

describe('difficultyToEngineOptions', () => {
  it('maps facil to a low skill level and shallow depth', () => {
    expect(difficultyToEngineOptions('facil')).toEqual({ skillLevel: 2, depth: 4, moveTimeMs: 300 });
  });

  it('maps medio to a mid skill level', () => {
    expect(difficultyToEngineOptions('medio')).toEqual({ skillLevel: 10, depth: 8, moveTimeMs: 800 });
  });

  it('maps dificil to the maximum skill level', () => {
    expect(difficultyToEngineOptions('dificil')).toEqual({ skillLevel: 20, depth: 14, moveTimeMs: 1500 });
  });

  it('increases skill level and depth as difficulty rises', () => {
    const facil = difficultyToEngineOptions('facil');
    const medio = difficultyToEngineOptions('medio');
    const dificil = difficultyToEngineOptions('dificil');
    expect(medio.skillLevel).toBeGreaterThan(facil.skillLevel);
    expect(dificil.skillLevel).toBeGreaterThan(medio.skillLevel);
    expect(medio.depth).toBeGreaterThan(facil.depth);
    expect(dificil.depth).toBeGreaterThan(medio.depth);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- lib/chess/difficulty.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/chess/difficulty.ts`**

```typescript
export type Difficulty = 'facil' | 'medio' | 'dificil';

export interface EngineOptions {
  skillLevel: number; // Stockfish "Skill Level" UCI option, 0-20
  depth: number; // search depth limit
  moveTimeMs: number; // max thinking time in milliseconds
}

const DIFFICULTY_OPTIONS: Record<Difficulty, EngineOptions> = {
  facil: { skillLevel: 2, depth: 4, moveTimeMs: 300 },
  medio: { skillLevel: 10, depth: 8, moveTimeMs: 800 },
  dificil: { skillLevel: 20, depth: 14, moveTimeMs: 1500 },
};

export function difficultyToEngineOptions(difficulty: Difficulty): EngineOptions {
  return DIFFICULTY_OPTIONS[difficulty];
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- lib/chess/difficulty.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/chess/difficulty.ts lib/chess/difficulty.test.ts
git commit -m "feat: add difficulty-to-engine-options mapping"
```

---

### Task 4: Move-quality classification and threatened-square detection

**Files:**
- Create: `lib/chess/moveClassification.ts`
- Test: `lib/chess/moveClassification.test.ts`
- Create: `lib/chess/threats.ts`
- Test: `lib/chess/threats.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks (uses `chess.js` directly for `threats.ts`).
- Produces: `type MoveQuality = 'boa' | 'imprecisao' | 'erro'`, `classifyMove(loss: number): MoveQuality`, `centipawnLoss(bestEval: number, playedEval: number): number`, `findThreatenedSquares(fen: string, color: 'w' | 'b'): Square[]` — used by Task 9 (`LearningPanel`) and Task 10.

- [ ] **Step 1: Install `chess.js`**

```bash
npm install chess.js
```

- [ ] **Step 2: Write the failing tests for move classification**

Create `lib/chess/moveClassification.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { classifyMove, centipawnLoss } from './moveClassification';

describe('centipawnLoss', () => {
  it('is zero when the played move matches the best move', () => {
    expect(centipawnLoss(50, 50)).toBe(0);
  });

  it('is the difference when the played move is worse', () => {
    expect(centipawnLoss(50, 10)).toBe(40);
  });

  it('never goes negative when the played move is better than expected', () => {
    expect(centipawnLoss(50, 80)).toBe(0);
  });
});

describe('classifyMove', () => {
  it('classifies 0 centipawn loss as a good move', () => {
    expect(classifyMove(0)).toBe('boa');
  });

  it('classifies exactly 30 centipawn loss as a good move', () => {
    expect(classifyMove(30)).toBe('boa');
  });

  it('classifies 31 centipawn loss as an imprecision', () => {
    expect(classifyMove(31)).toBe('imprecisao');
  });

  it('classifies exactly 100 centipawn loss as an imprecision', () => {
    expect(classifyMove(100)).toBe('imprecisao');
  });

  it('classifies 101 centipawn loss as a mistake', () => {
    expect(classifyMove(101)).toBe('erro');
  });

  it('throws for a negative centipawn loss', () => {
    expect(() => classifyMove(-1)).toThrow(RangeError);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npm test -- lib/chess/moveClassification.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `lib/chess/moveClassification.ts`**

```typescript
export type MoveQuality = 'boa' | 'imprecisao' | 'erro';

/**
 * Diferença entre a avaliação do melhor lance disponível e a
 * avaliação obtida com o lance realmente jogado, ambas na perspectiva
 * de quem jogou. Nunca é negativa: se o lance jogado avaliar melhor
 * que a referência do motor, consideramos perda zero.
 */
export function centipawnLoss(bestEval: number, playedEval: number): number {
  return Math.max(0, bestEval - playedEval);
}

/**
 * Classifica um lance a partir da perda de centipawns em relação ao
 * melhor lance disponível na posição.
 */
export function classifyMove(loss: number): MoveQuality {
  if (loss < 0) {
    throw new RangeError('loss não pode ser negativo');
  }
  if (loss <= 30) return 'boa';
  if (loss <= 100) return 'imprecisao';
  return 'erro';
}
```

- [ ] **Step 5: Run to verify pass**

Run: `npm test -- lib/chess/moveClassification.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 6: Write the failing tests for threat detection**

Create `lib/chess/threats.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { findThreatenedSquares } from './threats';

describe('findThreatenedSquares', () => {
  it('finds no threats in the starting position', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(findThreatenedSquares(fen, 'w')).toEqual([]);
  });

  it('detects a hanging pawn attacked by an enemy knight', () => {
    const fen = '4k3/8/2n5/4P3/8/8/8/4K3 b - - 0 1';
    expect(findThreatenedSquares(fen, 'w')).toEqual(['e5']);
  });

  it('detects multiple threatened pieces', () => {
    const fen = '4k3/8/2n5/4Pp2/6P1/8/8/4K3 b - - 0 1';
    expect(findThreatenedSquares(fen, 'w').sort()).toEqual(['e5', 'g4']);
  });
});
```

- [ ] **Step 7: Run to verify failure**

Run: `npm test -- lib/chess/threats.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 8: Implement `lib/chess/threats.ts`**

```typescript
import { Chess, type Color, type Square } from 'chess.js';

/**
 * Retorna as casas ocupadas por peças de `color` que estão sob ataque
 * do adversário na posição dada, independentemente de quem tem a vez.
 *
 * Implementação: força o adversário a "jogar" trocando o campo de vez
 * no FEN, e reúne os destinos de captura sobre casas ocupadas por
 * `color`. Isso é uma aproximação pragmática (pode, em posições raras
 * de duplo xeque cruzado, deixar de contar uma peça que só ficaria
 * livre por causa da troca artificial de vez) — aceitável para um
 * recurso de dica, não para um motor de análise.
 */
export function findThreatenedSquares(fen: string, color: Color): Square[] {
  const parts = fen.split(' ');
  const opponent: Color = color === 'w' ? 'b' : 'w';
  parts[1] = opponent;
  parts[3] = '-'; // remove en passant target — invalid once the side to move is flipped
  const chess = new Chess(parts.join(' '));

  const board = chess.board();
  const ownSquares = new Set<Square>();
  for (const row of board) {
    for (const cell of row) {
      if (cell && cell.color === color) ownSquares.add(cell.square as Square);
    }
  }

  const threatened = new Set<Square>();
  for (const row of board) {
    for (const cell of row) {
      if (!cell || cell.color !== opponent) continue;
      const moves = chess.moves({ square: cell.square as Square, verbose: true });
      for (const move of moves) {
        if (ownSquares.has(move.to as Square)) threatened.add(move.to as Square);
      }
    }
  }
  return Array.from(threatened);
}
```

- [ ] **Step 9: Run to verify pass**

Run: `npm test -- lib/chess/threats.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 10: Commit**

```bash
git add lib/chess/moveClassification.ts lib/chess/moveClassification.test.ts lib/chess/threats.ts lib/chess/threats.test.ts package.json package-lock.json
git commit -m "feat: add move-quality classification and threat detection"
```

---

### Task 5: `useChessGame` hook

**Files:**
- Create: `lib/chess/useChessGame.ts`
- Test: `lib/chess/useChessGame.test.ts`

**Interfaces:**
- Consumes: `chess.js` (`Chess`, `Square`, `PieceSymbol`).
- Produces:
  ```typescript
  type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';
  interface ChessGameState {
    fen: string;
    turn: 'w' | 'b';
    status: GameStatus;
    history: string[];
    isGameOver: boolean;
    checkSquare: Square | null;
    lastMove: { from: Square; to: Square } | null;
  }
  interface UseChessGameResult {
    state: ChessGameState;
    legalMovesFrom: (square: Square) => Square[];
    makeMove: (from: Square, to: Square, promotion?: PieceSymbol) => boolean;
    reset: () => void;
  }
  function useChessGame(persist?: boolean): UseChessGameResult;
  ```
  Used by Task 10 (`jogar/page.tsx`).

- [ ] **Step 1: Write the failing tests**

Create `lib/chess/useChessGame.test.ts`:

```typescript
import { describe, expect, it, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useChessGame } from './useChessGame';

describe('useChessGame', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts at the standard opening position', () => {
    const { result } = renderHook(() => useChessGame(false));
    expect(result.current.state.turn).toBe('w');
    expect(result.current.state.status).toBe('playing');
    expect(result.current.state.history).toEqual([]);
    expect(result.current.state.checkSquare).toBeNull();
    expect(result.current.state.lastMove).toBeNull();
  });

  it('applies a legal move and updates the turn', () => {
    const { result } = renderHook(() => useChessGame(false));
    act(() => {
      const applied = result.current.makeMove('e2', 'e4');
      expect(applied).toBe(true);
    });
    expect(result.current.state.turn).toBe('b');
    expect(result.current.state.history).toEqual(['e4']);
    expect(result.current.state.lastMove).toEqual({ from: 'e2', to: 'e4' });
  });

  it('rejects an illegal move and keeps the state unchanged', () => {
    const { result } = renderHook(() => useChessGame(false));
    act(() => {
      const applied = result.current.makeMove('e2', 'e5');
      expect(applied).toBe(false);
    });
    expect(result.current.state.history).toEqual([]);
  });

  it('lists legal destination squares for a selected piece', () => {
    const { result } = renderHook(() => useChessGame(false));
    expect(result.current.legalMovesFrom('e2').sort()).toEqual(['e3', 'e4']);
  });

  it("detects checkmate (fool's mate) and reports the checked king square", () => {
    const { result } = renderHook(() => useChessGame(false));
    act(() => {
      result.current.makeMove('f2', 'f3');
      result.current.makeMove('e7', 'e5');
      result.current.makeMove('g2', 'g4');
      result.current.makeMove('d8', 'h4');
    });
    expect(result.current.state.status).toBe('checkmate');
    expect(result.current.state.isGameOver).toBe(true);
    expect(result.current.state.checkSquare).toBe('e1');
  });

  it('resets to the starting position', () => {
    const { result } = renderHook(() => useChessGame(false));
    act(() => {
      result.current.makeMove('e2', 'e4');
      result.current.reset();
    });
    expect(result.current.state.history).toEqual([]);
    expect(result.current.state.turn).toBe('w');
  });

  it('persists the position to localStorage and restores it on next mount', () => {
    const { result, unmount } = renderHook(() => useChessGame(true));
    let fenAfterMove = '';
    act(() => {
      result.current.makeMove('e2', 'e4');
      fenAfterMove = result.current.state.fen;
    });
    unmount();

    const { result: restored } = renderHook(() => useChessGame(true));
    expect(restored.current.state.fen).toBe(fenAfterMove);
    expect(restored.current.state.turn).toBe('b');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- lib/chess/useChessGame.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/chess/useChessGame.ts`**

```typescript
import { useCallback, useState } from 'react';
import { Chess, type PieceSymbol, type Square } from 'chess.js';

export type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';

export interface ChessGameState {
  fen: string;
  turn: 'w' | 'b';
  status: GameStatus;
  history: string[];
  isGameOver: boolean;
  checkSquare: Square | null;
  lastMove: { from: Square; to: Square } | null;
}

export interface UseChessGameResult {
  state: ChessGameState;
  legalMovesFrom: (square: Square) => Square[];
  makeMove: (from: Square, to: Square, promotion?: PieceSymbol) => boolean;
  reset: () => void;
}

const STORAGE_KEY = 'chess-learning-game-fen';

function statusFromChess(chess: Chess): GameStatus {
  if (chess.isCheckmate()) return 'checkmate';
  if (chess.isStalemate()) return 'stalemate';
  if (chess.isDraw()) return 'draw';
  if (chess.isCheck()) return 'check';
  return 'playing';
}

function findKingSquare(chess: Chess): Square | null {
  const board = chess.board();
  for (const row of board) {
    for (const cell of row) {
      if (cell && cell.type === 'k' && cell.color === chess.turn()) {
        return cell.square as Square;
      }
    }
  }
  return null;
}

function buildState(chess: Chess): ChessGameState {
  const status = statusFromChess(chess);
  const verboseHistory = chess.history({ verbose: true });
  const last = verboseHistory[verboseHistory.length - 1];
  return {
    fen: chess.fen(),
    turn: chess.turn(),
    status,
    history: chess.history(),
    isGameOver: chess.isGameOver(),
    checkSquare: status === 'check' || status === 'checkmate' ? findKingSquare(chess) : null,
    lastMove: last ? { from: last.from as Square, to: last.to as Square } : null,
  };
}

export function useChessGame(persist = true): UseChessGameResult {
  const [chess] = useState(() => {
    const instance = new Chess();
    if (persist && typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) instance.load(saved);
      } catch {
        // localStorage indisponível (ex.: modo privado) — começa do zero
      }
    }
    return instance;
  });
  const [state, setState] = useState<ChessGameState>(() => buildState(chess));

  const persistFen = useCallback(
    (fen: string) => {
      if (!persist || typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(STORAGE_KEY, fen);
      } catch {
        // quota cheia ou indisponível — a partida continua sem persistir
      }
    },
    [persist]
  );

  const legalMovesFrom = useCallback(
    (square: Square): Square[] => {
      return chess.moves({ square, verbose: true }).map((m) => m.to as Square);
    },
    [chess]
  );

  const makeMove = useCallback(
    (from: Square, to: Square, promotion?: PieceSymbol): boolean => {
      try {
        const move = chess.move({ from, to, promotion });
        if (!move) return false;
        const next = buildState(chess);
        setState(next);
        persistFen(next.fen);
        return true;
      } catch {
        return false;
      }
    },
    [chess, persistFen]
  );

  const reset = useCallback(() => {
    chess.reset();
    const next = buildState(chess);
    setState(next);
    persistFen(next.fen);
  }, [chess, persistFen]);

  return { state, legalMovesFrom, makeMove, reset };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- lib/chess/useChessGame.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/chess/useChessGame.ts lib/chess/useChessGame.test.ts
git commit -m "feat: add useChessGame hook"
```

---

### Task 6: Stockfish engine client

**Files:**
- Create: `public/stockfish/stockfish-18-lite-single.js` (vendored, copied not authored)
- Create: `public/stockfish/stockfish-18-lite-single.wasm` (vendored, copied not authored)
- Create: `lib/chess/stockfishClient.ts`

**Interfaces:**
- Consumes: `parseBestMove`, `parseScoreCp`, `isReadyLine` from `lib/chess/uciParser.ts` (Task 2); `EngineOptions` from `lib/chess/difficulty.ts` (Task 3).
- Produces:
  ```typescript
  interface StockfishClient {
    getBestMove: (fen: string, options: EngineOptions) => Promise<string>; // move in UCI form, e.g. "e2e4"
    evaluate: (fen: string, depth: number) => Promise<number>; // centipawns, side-to-move perspective
    terminate: () => void;
  }
  function createStockfishClient(): StockfishClient;
  ```
  Used by Task 10 (`jogar/page.tsx`).

This task has no automated tests: it drives a real browser `Worker` running a real WASM engine, which `jsdom`/Vitest cannot execute. Correctness is checked with `tsc` here and with a full manual run once it's wired into the game page in Task 10.

- [ ] **Step 1: Install the engine package**

```bash
npm install stockfish
```

- [ ] **Step 2: Vendor the single-threaded "lite" build (no cross-origin-isolation headers required; ~7MB, vs. ~108MB for the full net — plenty strong for this app's difficulty range) into `public/`**

```bash
mkdir -p public/stockfish
cp node_modules/stockfish/bin/stockfish-18-lite-single.js public/stockfish/
cp node_modules/stockfish/bin/stockfish-18-lite-single.wasm public/stockfish/
```

- [ ] **Step 3: Implement `lib/chess/stockfishClient.ts`**

```typescript
import type { EngineOptions } from './difficulty';
import { parseBestMove, parseScoreCp, isReadyLine } from './uciParser';

export interface StockfishClient {
  getBestMove: (fen: string, options: EngineOptions) => Promise<string>;
  evaluate: (fen: string, depth: number) => Promise<number>;
  terminate: () => void;
}

export function createStockfishClient(): StockfishClient {
  const worker = new Worker('/stockfish/stockfish-18-lite-single.js');
  let readyPromise: Promise<void> | null = null;

  function waitForReady(): Promise<void> {
    if (readyPromise) return readyPromise;
    readyPromise = new Promise((resolve) => {
      const onMessage = (event: MessageEvent<string>) => {
        if (isReadyLine(event.data)) {
          worker.removeEventListener('message', onMessage);
          resolve();
        }
      };
      worker.addEventListener('message', onMessage);
      worker.postMessage('uci');
      worker.postMessage('isready');
    });
    return readyPromise;
  }

  async function getBestMove(fen: string, options: EngineOptions): Promise<string> {
    await waitForReady();
    return new Promise((resolve) => {
      const onMessage = (event: MessageEvent<string>) => {
        const move = parseBestMove(event.data);
        if (move) {
          worker.removeEventListener('message', onMessage);
          resolve(move);
        }
      };
      worker.addEventListener('message', onMessage);
      worker.postMessage(`setoption name Skill Level value ${options.skillLevel}`);
      worker.postMessage('ucinewgame');
      worker.postMessage(`position fen ${fen}`);
      worker.postMessage(`go depth ${options.depth} movetime ${options.moveTimeMs}`);
    });
  }

  async function evaluate(fen: string, depth: number): Promise<number> {
    await waitForReady();
    return new Promise((resolve) => {
      let lastScore = 0;
      const onMessage = (event: MessageEvent<string>) => {
        const score = parseScoreCp(event.data);
        if (score !== null) lastScore = score;
        if (parseBestMove(event.data)) {
          worker.removeEventListener('message', onMessage);
          resolve(lastScore);
        }
      };
      worker.addEventListener('message', onMessage);
      worker.postMessage('ucinewgame');
      worker.postMessage(`position fen ${fen}`);
      worker.postMessage(`go depth ${depth}`);
    });
  }

  function terminate() {
    worker.terminate();
  }

  return { getBestMove, evaluate, terminate };
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add public/stockfish lib/chess/stockfishClient.ts package.json package-lock.json
git commit -m "feat: vendor Stockfish and add engine client"
```

---

### Task 7: `ChessBoard` component

**Files:**
- Create: `components/ChessBoard/pieceGlyphs.ts`
- Create: `components/ChessBoard/ChessBoard.tsx`

**Interfaces:**
- Consumes: `chess.js` (`Chess`, `Color`, `PieceSymbol`, `Square`).
- Produces:
  ```typescript
  interface ChessBoardProps {
    fen: string;
    orientation?: 'white' | 'black';
    selectedSquare?: Square | null;
    legalTargets?: Square[];
    lastMove?: { from: Square; to: Square } | null;
    checkSquare?: Square | null;
    threatenedSquares?: Square[];
    suggestedMove?: { from: Square; to: Square } | null;
    interactive?: boolean;
    onSquareClick?: (square: Square) => void;
  }
  function ChessBoard(props: ChessBoardProps): JSX.Element;
  ```
  Used by Task 10 (`jogar/page.tsx`) and Task 11 (tutorial pages).

No automated tests for this component per the approved spec (manual visual verification only). Verification here is limited to type-checking; full visual verification happens once it's wired into the game page in Task 10.

- [ ] **Step 1: Implement `components/ChessBoard/pieceGlyphs.ts`**

```typescript
import type { Color, PieceSymbol } from 'chess.js';

const WHITE_GLYPHS: Record<PieceSymbol, string> = {
  p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔',
};

const BLACK_GLYPHS: Record<PieceSymbol, string> = {
  p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚',
};

export function pieceGlyph(type: PieceSymbol, color: Color): string {
  return color === 'w' ? WHITE_GLYPHS[type] : BLACK_GLYPHS[type];
}
```

- [ ] **Step 2: Implement `components/ChessBoard/ChessBoard.tsx`**

```tsx
'use client';

import { Chess, type Square } from 'chess.js';
import { pieceGlyph } from './pieceGlyphs';

export interface ChessBoardProps {
  fen: string;
  orientation?: 'white' | 'black';
  selectedSquare?: Square | null;
  legalTargets?: Square[];
  lastMove?: { from: Square; to: Square } | null;
  checkSquare?: Square | null;
  threatenedSquares?: Square[];
  suggestedMove?: { from: Square; to: Square } | null;
  interactive?: boolean;
  onSquareClick?: (square: Square) => void;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export function ChessBoard({
  fen,
  orientation = 'white',
  selectedSquare = null,
  legalTargets = [],
  lastMove = null,
  checkSquare = null,
  threatenedSquares = [],
  suggestedMove = null,
  interactive = true,
  onSquareClick,
}: ChessBoardProps) {
  const board = new Chess(fen).board();
  const files = orientation === 'white' ? FILES : [...FILES].reverse();
  const ranks = orientation === 'white' ? RANKS : [...RANKS].reverse();

  return (
    <div
      role="grid"
      aria-label="Tabuleiro de xadrez"
      className="grid grid-cols-8 aspect-square w-full max-w-[560px] select-none border-4 border-stone-800 rounded-md overflow-hidden"
    >
      {ranks.map((rank, rankIdx) =>
        files.map((file, fileIdx) => {
          const square = `${file}${rank}` as Square;
          const boardRankIdx = RANKS.indexOf(rank);
          const boardFileIdx = FILES.indexOf(file);
          const piece = board[boardRankIdx][boardFileIdx];
          const isLight = (fileIdx + rankIdx) % 2 === 0;
          const isSelected = selectedSquare === square;
          const isLegalTarget = legalTargets.includes(square);
          const isLastMove = lastMove?.from === square || lastMove?.to === square;
          const isCheck = checkSquare === square;
          const isThreatened = threatenedSquares.includes(square);
          const isSuggested = suggestedMove?.from === square || suggestedMove?.to === square;

          return (
            <button
              type="button"
              key={square}
              data-square={square}
              disabled={!interactive}
              onClick={() => onSquareClick?.(square)}
              className={[
                'relative flex items-center justify-center text-3xl sm:text-4xl aspect-square',
                isLight ? 'bg-amber-100' : 'bg-amber-700',
                isCheck ? 'bg-red-400' : '',
                isLastMove ? 'ring-4 ring-yellow-400 ring-inset' : '',
                isSelected ? 'outline outline-4 outline-sky-500 -outline-offset-4' : '',
                isThreatened ? 'outline outline-4 outline-red-500 -outline-offset-4' : '',
                isSuggested ? 'outline outline-4 outline-emerald-500 -outline-offset-4' : '',
              ].join(' ')}
            >
              {piece && (
                <span
                  className={
                    piece.color === 'w'
                      ? 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]'
                      : 'text-black'
                  }
                >
                  {pieceGlyph(piece.type, piece.color)}
                </span>
              )}
              {isLegalTarget && !piece && (
                <span className="absolute w-3 h-3 rounded-full bg-slate-900/40" />
              )}
              {isLegalTarget && piece && (
                <span className="absolute inset-0 rounded-full ring-4 ring-slate-900/40" />
              )}
            </button>
          );
        })
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/ChessBoard
git commit -m "feat: add ChessBoard component"
```

---

### Task 8: Home page and app shell

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Create: `components/ModeSelector/ModeSelector.tsx`

**Interfaces:**
- Consumes: `Difficulty` from `lib/chess/difficulty.ts` (Task 3).
- Produces: navigable route `/` that pushes to `/jogar?mode=ai&difficulty=<d>&color=<c>` or `/jogar?mode=local`.

- [ ] **Step 1: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Xadrez — aprenda jogando',
  description:
    'Jogue xadrez contra o computador ou com um amigo, com dicas para aprender a jogar melhor.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Implement `components/ModeSelector/ModeSelector.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Difficulty } from '@/lib/chess/difficulty';

type Mode = 'ai' | 'local';
type PlayerColor = 'white' | 'black' | 'random';

export function ModeSelector() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('ai');
  const [difficulty, setDifficulty] = useState<Difficulty>('facil');
  const [color, setColor] = useState<PlayerColor>('white');

  function handleStart() {
    const params = new URLSearchParams({ mode });
    if (mode === 'ai') {
      params.set('difficulty', difficulty);
      params.set('color', color);
    }
    router.push(`/jogar?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-6 max-w-sm mx-auto">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('ai')}
          aria-pressed={mode === 'ai'}
          className={`flex-1 rounded-md border px-4 py-3 ${
            mode === 'ai' ? 'bg-sky-600 text-white border-sky-600' : 'border-stone-300'
          }`}
        >
          Jogar contra o computador
        </button>
        <button
          type="button"
          onClick={() => setMode('local')}
          aria-pressed={mode === 'local'}
          className={`flex-1 rounded-md border px-4 py-3 ${
            mode === 'local' ? 'bg-sky-600 text-white border-sky-600' : 'border-stone-300'
          }`}
        >
          Dois jogadores
        </button>
      </div>

      {mode === 'ai' && (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className="font-medium mb-1">Dificuldade</legend>
            <div className="flex gap-2">
              {(['facil', 'medio', 'dificil'] as Difficulty[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  aria-pressed={difficulty === level}
                  className={`flex-1 rounded-md border px-3 py-2 capitalize ${
                    difficulty === level
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-stone-300'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="font-medium mb-1">Suas peças</legend>
            <div className="flex gap-2">
              {(
                [
                  ['white', 'Brancas'],
                  ['black', 'Pretas'],
                  ['random', 'Aleatório'],
                ] as [PlayerColor, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setColor(value)}
                  aria-pressed={color === value}
                  className={`flex-1 rounded-md border px-3 py-2 ${
                    color === value
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-stone-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        </>
      )}

      <button
        type="button"
        onClick={handleStart}
        className="rounded-md bg-stone-900 text-white px-4 py-3 font-semibold"
      >
        Começar
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Replace `app/page.tsx`**

```tsx
import Link from 'next/link';
import { ModeSelector } from '@/components/ModeSelector/ModeSelector';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Xadrez</h1>
        <p className="text-stone-600 mt-2">
          Jogue e aprenda a jogar melhor.{' '}
          <Link href="/aprender" className="underline text-sky-700">
            Ver tutorial
          </Link>
        </p>
      </div>
      <ModeSelector />
    </main>
  );
}
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: page shows title, both mode buttons toggle correctly, difficulty/color buttons appear only for "Jogar contra o computador", clicking "Começar" navigates the browser URL to `/jogar?mode=ai&difficulty=facil&color=white` (a 404 there is expected until Task 10).

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/page.tsx components/ModeSelector
git commit -m "feat: add home page and mode selector"
```

---

### Task 9: `LearningPanel` component

**Files:**
- Create: `components/LearningPanel/LearningPanel.tsx`

**Interfaces:**
- Consumes: `MoveQuality` from `lib/chess/moveClassification.ts` (Task 4).
- Produces:
  ```typescript
  interface LearningPanelProps {
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    onRequestSuggestion: () => void;
    suggestionLoading?: boolean;
    hasSuggestion?: boolean;
    lastMoveQuality?: MoveQuality | null;
  }
  function LearningPanel(props: LearningPanelProps): JSX.Element;
  ```
  Used by Task 10 (`jogar/page.tsx`).

- [ ] **Step 1: Implement `components/LearningPanel/LearningPanel.tsx`**

```tsx
'use client';

import type { MoveQuality } from '@/lib/chess/moveClassification';

export interface LearningPanelProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onRequestSuggestion: () => void;
  suggestionLoading?: boolean;
  hasSuggestion?: boolean;
  lastMoveQuality?: MoveQuality | null;
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

export function LearningPanel({
  enabled,
  onToggle,
  onRequestSuggestion,
  suggestionLoading = false,
  hasSuggestion = false,
  lastMoveQuality = null,
}: LearningPanelProps) {
  return (
    <aside className="flex flex-col gap-4 w-full max-w-xs border border-stone-200 rounded-md p-4">
      <label className="flex items-center justify-between gap-2 font-medium">
        Modo aprendizado
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
            {suggestionLoading ? 'Pensando…' : 'Sugerir jogada'}
          </button>
          {hasSuggestion && (
            <p className="text-sm text-stone-600">
              Jogada sugerida destacada em verde no tabuleiro.
            </p>
          )}
          {lastMoveQuality && (
            <p className={`text-sm rounded-md px-3 py-2 ${QUALITY_CLASS[lastMoveQuality]}`}>
              Seu último lance: {QUALITY_LABEL[lastMoveQuality]}
            </p>
          )}
        </>
      )}
    </aside>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/LearningPanel
git commit -m "feat: add LearningPanel component"
```

---

### Task 10: `/jogar` game page — full integration

**Files:**
- Create: `app/jogar/page.tsx`

**Interfaces:**
- Consumes: `useChessGame` (Task 5), `ChessBoard` (Task 7), `LearningPanel` (Task 9), `difficultyToEngineOptions`/`Difficulty` (Task 3), `classifyMove`/`centipawnLoss`/`MoveQuality` (Task 4), `findThreatenedSquares` (Task 4), `createStockfishClient`/`StockfishClient` (Task 6), `parseUciMove` (Task 2).
- Produces: the `/jogar` route, fully playable.

- [ ] **Step 1: Implement `app/jogar/page.tsx`**

```tsx
'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Chess, type Square } from 'chess.js';
import { useChessGame } from '@/lib/chess/useChessGame';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';
import { LearningPanel } from '@/components/LearningPanel/LearningPanel';
import { difficultyToEngineOptions, type Difficulty } from '@/lib/chess/difficulty';
import { classifyMove, centipawnLoss, type MoveQuality } from '@/lib/chess/moveClassification';
import { findThreatenedSquares } from '@/lib/chess/threats';
import { createStockfishClient, type StockfishClient } from '@/lib/chess/stockfishClient';
import { parseUciMove } from '@/lib/chess/uciParser';

const STATUS_LABEL: Record<string, string> = {
  playing: 'Em andamento',
  check: 'Xeque',
  checkmate: 'Xeque-mate',
  stalemate: 'Afogamento (empate)',
  draw: 'Empate',
};

export default function JogarPage() {
  return (
    <Suspense fallback={<p className="p-8">Carregando…</p>}>
      <JogarContent />
    </Suspense>
  );
}

function JogarContent() {
  const params = useSearchParams();
  const mode = params.get('mode') === 'local' ? 'local' : 'ai';
  const difficulty = (params.get('difficulty') as Difficulty) ?? 'facil';
  const requestedColor = params.get('color');
  const [humanColor] = useState<'w' | 'b'>(() => {
    if (requestedColor === 'black') return 'b';
    if (requestedColor === 'random') return Math.random() < 0.5 ? 'w' : 'b';
    return 'w';
  });

  const { state, legalMovesFrom, makeMove, reset } = useChessGame(true);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [learningEnabled, setLearningEnabled] = useState(true);
  const [suggestion, setSuggestion] = useState<{ from: Square; to: Square } | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [lastMoveQuality, setLastMoveQuality] = useState<MoveQuality | null>(null);

  const engineRef = useRef<StockfishClient | null>(null);
  useEffect(() => {
    if (mode !== 'ai') return;
    engineRef.current = createStockfishClient();
    return () => engineRef.current?.terminate();
  }, [mode]);

  const isHumanTurn = mode === 'local' || state.turn === humanColor;
  const legalTargets = selectedSquare ? legalMovesFrom(selectedSquare) : [];
  const threatenedSquares =
    learningEnabled && mode === 'ai' ? findThreatenedSquares(state.fen, humanColor) : [];

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (!isHumanTurn || state.isGameOver) return;
      setSuggestion(null);

      if (selectedSquare && legalMovesFrom(selectedSquare).includes(square)) {
        const fenBefore = state.fen;
        const preview = new Chess(fenBefore);
        const previewMove = preview.move({ from: selectedSquare, to: square, promotion: 'q' });
        const moved = makeMove(selectedSquare, square, 'q');
        setSelectedSquare(null);

        if (moved && previewMove && mode === 'ai' && learningEnabled && engineRef.current) {
          const engine = engineRef.current;
          const fenAfter = preview.fen();
          Promise.all([engine.evaluate(fenBefore, 10), engine.evaluate(fenAfter, 10)]).then(
            ([bestEval, replyEval]) => {
              const playedEval = -replyEval;
              setLastMoveQuality(classifyMove(centipawnLoss(bestEval, playedEval)));
            }
          );
        }
        return;
      }
      setSelectedSquare(square);
    },
    [isHumanTurn, state.isGameOver, state.fen, selectedSquare, legalMovesFrom, makeMove, mode, learningEnabled]
  );

  // IA joga automaticamente quando é a vez dela
  useEffect(() => {
    if (mode !== 'ai' || state.isGameOver || state.turn === humanColor) return;
    const engine = engineRef.current;
    if (!engine) return;

    let cancelled = false;
    engine.getBestMove(state.fen, difficultyToEngineOptions(difficulty)).then((uci) => {
      if (cancelled) return;
      const { from, to, promotion } = parseUciMove(uci);
      makeMove(from as Square, to as Square, promotion as Parameters<typeof makeMove>[2]);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, state.turn, state.isGameOver, state.fen, humanColor, difficulty, makeMove]);

  const handleRequestSuggestion = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    setSuggestionLoading(true);
    engine.getBestMove(state.fen, difficultyToEngineOptions('dificil')).then((uci) => {
      const { from, to } = parseUciMove(uci);
      setSuggestion({ from: from as Square, to: to as Square });
      setSuggestionLoading(false);
    });
  }, [state.fen]);

  function handleReset() {
    reset();
    setSelectedSquare(null);
    setSuggestion(null);
    setLastMoveQuality(null);
  }

  return (
    <main className="min-h-screen flex flex-col md:flex-row items-center md:items-start justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-4">
        <p className="font-medium">{STATUS_LABEL[state.status]}</p>
        <ChessBoard
          fen={state.fen}
          orientation={humanColor === 'w' ? 'white' : 'black'}
          selectedSquare={selectedSquare}
          legalTargets={legalTargets}
          lastMove={state.lastMove}
          checkSquare={state.checkSquare}
          threatenedSquares={threatenedSquares}
          suggestedMove={learningEnabled ? suggestion : null}
          interactive={isHumanTurn && !state.isGameOver}
          onSquareClick={handleSquareClick}
        />
        <button type="button" onClick={handleReset} className="text-sm underline text-stone-600">
          Reiniciar partida
        </button>
      </div>

      {mode === 'ai' && (
        <LearningPanel
          enabled={learningEnabled}
          onToggle={setLearningEnabled}
          onRequestSuggestion={handleRequestSuggestion}
          suggestionLoading={suggestionLoading}
          hasSuggestion={Boolean(suggestion)}
          lastMoveQuality={lastMoveQuality}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual verification — vs. computer**

Run: `npm run dev`, go to `/`, choose "Jogar contra o computador", "facil", "Brancas", click "Começar".
Expected:
- Board renders with white at the bottom.
- Clicking a pawn (e.g. e2) shows dots on its legal destinations (e3, e4).
- Clicking e4 moves the pawn; after a short pause, black (the engine) replies automatically.
- The status line updates ("Em andamento", "Xeque", etc.).
- With "Modo aprendizado" on: a piece under attack gets a red outline; "Sugerir jogada" highlights a move in green; after a human move, a quality badge ("Boa jogada" / "Imprecisão" / "Erro") appears.
- Turning "Modo aprendizado" off removes all hint highlighting.
- "Reiniciar partida" returns to the starting position.
- Reloading the page mid-game restores the same position.

- [ ] **Step 4: Manual verification — two players**

From `/`, choose "Dois jogadores", click "Começar".
Expected: no `LearningPanel`, no automatic AI replies; both colors are clickable on their respective turns, alternating correctly.

- [ ] **Step 5: Commit**

```bash
git add app/jogar
git commit -m "feat: add /jogar game page with AI and two-player modes"
```

---

### Task 11: Tutorial pages (`/aprender`)

**Files:**
- Create: `app/aprender/page.tsx`
- Create: `app/aprender/pecas/page.tsx`
- Create: `app/aprender/regras-especiais/page.tsx`
- Create: `app/aprender/fim-de-jogo/page.tsx`
- Create: `app/aprender/estrategia/page.tsx`

**Interfaces:**
- Consumes: `ChessBoard` (Task 7), `chess.js`.
- Produces: the `/aprender` route tree.

- [ ] **Step 1: Implement `app/aprender/page.tsx`**

```tsx
import Link from 'next/link';

const TOPICS = [
  { href: '/aprender/pecas', title: 'Como as peças se movem', description: 'O movimento de cada peça, do peão ao rei.' },
  { href: '/aprender/regras-especiais', title: 'Regras especiais', description: 'Roque, en passant e promoção do peão.' },
  { href: '/aprender/fim-de-jogo', title: 'Fim de jogo', description: 'Xeque, xeque-mate, afogamento e empates.' },
  { href: '/aprender/estrategia', title: 'Princípios de estratégia', description: 'Ideias básicas para jogar melhor desde a abertura.' },
];

export default function AprenderPage() {
  return (
    <main className="min-h-screen max-w-2xl mx-auto p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Aprenda a jogar xadrez</h1>
        <p className="text-stone-600 mt-2">
          <Link href="/" className="underline text-sky-700">
            Voltar para o início
          </Link>
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {TOPICS.map((topic) => (
          <li key={topic.href}>
            <Link
              href={topic.href}
              className="block rounded-md border border-stone-200 p-4 hover:bg-stone-50"
            >
              <p className="font-semibold">{topic.title}</p>
              <p className="text-sm text-stone-600">{topic.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 2: Implement `app/aprender/pecas/page.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { Chess, type Square } from 'chess.js';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';

interface PieceDemo {
  title: string;
  description: string;
  fen: string;
  square: Square;
}

const DEMOS: PieceDemo[] = [
  {
    title: 'Peão',
    description: 'Anda uma casa para frente (duas no primeiro lance) e captura na diagonal.',
    fen: '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1',
    square: 'e2',
  },
  {
    title: 'Cavalo',
    description:
      'Move-se em "L": duas casas em uma direção e uma casa perpendicular. É a única peça que pula por cima de outras.',
    fen: '4k3/8/8/8/4N3/8/8/4K3 w - - 0 1',
    square: 'e4',
  },
  {
    title: 'Bispo',
    description: 'Move-se livremente na diagonal, sempre pela mesma cor de casa.',
    fen: '4k3/8/8/8/4B3/8/8/4K3 w - - 0 1',
    square: 'e4',
  },
  {
    title: 'Torre',
    description: 'Move-se livremente na horizontal ou na vertical.',
    fen: '4k3/8/8/8/4R3/8/8/4K3 w - - 0 1',
    square: 'e4',
  },
  {
    title: 'Dama',
    description: 'Combina o movimento da torre e do bispo: livre em qualquer direção.',
    fen: '4k3/8/8/8/4Q3/8/8/4K3 w - - 0 1',
    square: 'e4',
  },
  {
    title: 'Rei',
    description:
      'Move-se uma casa em qualquer direção. Nunca pode se mover para uma casa atacada pelo adversário.',
    fen: '8/8/8/4k3/8/4K3/8/8 w - - 0 1',
    square: 'e3',
  },
];

export default function PecasPage() {
  return (
    <main className="min-h-screen max-w-3xl mx-auto p-8 flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Como as peças se movem</h1>
        <p className="text-stone-600 mt-2">
          <Link href="/aprender" className="underline text-sky-700">
            Voltar ao tutorial
          </Link>
        </p>
      </div>
      {DEMOS.map((demo) => {
        const chess = new Chess(demo.fen);
        const legalTargets = chess
          .moves({ square: demo.square, verbose: true })
          .map((m) => m.to as Square);
        return (
          <section key={demo.title} className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-full sm:w-64">
              <ChessBoard
                fen={demo.fen}
                selectedSquare={demo.square}
                legalTargets={legalTargets}
                interactive={false}
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{demo.title}</h2>
              <p className="text-stone-600 mt-1">{demo.description}</p>
            </div>
          </section>
        );
      })}
    </main>
  );
}
```

- [ ] **Step 3: Implement `app/aprender/regras-especiais/page.tsx`**

```tsx
import Link from 'next/link';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';

export default function RegrasEspeciaisPage() {
  return (
    <main className="min-h-screen max-w-3xl mx-auto p-8 flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Regras especiais</h1>
        <p className="text-stone-600 mt-2">
          <Link href="/aprender" className="underline text-sky-700">
            Voltar ao tutorial
          </Link>
        </p>
      </div>

      <section className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-64">
          <ChessBoard fen="r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1" interactive={false} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Roque</h2>
          <p className="text-stone-600 mt-1">
            Um lance especial do rei com uma das torres, feito uma única vez por partida. O rei
            anda duas casas em direção à torre, e a torre salta para o outro lado do rei. Só é
            permitido se nem o rei nem a torre envolvida já se moveram, se não houver peças entre
            eles, e se o rei não estiver em xeque nem passar por uma casa atacada.
          </p>
        </div>
      </section>

      <section className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-64">
          <ChessBoard fen="4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1" interactive={false} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">En passant</h2>
          <p className="text-stone-600 mt-1">
            Se um peão adversário anda duas casas de uma vez e termina do lado de um peão seu,
            você pode capturá-lo como se ele tivesse andado apenas uma casa — mas só no lance
            imediatamente seguinte.
          </p>
        </div>
      </section>

      <section className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-64">
          <ChessBoard fen="4k3/4P3/8/8/8/8/8/4K3 w - - 0 1" interactive={false} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Promoção</h2>
          <p className="text-stone-600 mt-1">
            Quando um peão chega até a última fileira, ele é promovido a qualquer outra peça
            (menos rei) — na grande maioria dos casos, a dama, por ser a peça mais forte.
          </p>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Implement `app/aprender/fim-de-jogo/page.tsx`**

```tsx
import Link from 'next/link';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';

export default function FimDeJogoPage() {
  return (
    <main className="min-h-screen max-w-3xl mx-auto p-8 flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Fim de jogo</h1>
        <p className="text-stone-600 mt-2">
          <Link href="/aprender" className="underline text-sky-700">
            Voltar ao tutorial
          </Link>
        </p>
      </div>

      <section className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-64">
          <ChessBoard fen="6k1/8/6K1/8/8/8/8/7R w - - 0 1" interactive={false} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Xeque</h2>
          <p className="text-stone-600 mt-1">
            O rei está sob ataque direto. Quem está em xeque precisa, no seu próximo lance, sair
            do xeque — movendo o rei, bloqueando o ataque ou capturando a peça que ataca.
          </p>
        </div>
      </section>

      <section className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-64">
          <ChessBoard fen="6k1/8/6K1/8/8/8/8/6R1 w - - 0 1" interactive={false} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Xeque-mate</h2>
          <p className="text-stone-600 mt-1">
            Um xeque do qual não há como escapar — o jogo termina imediatamente e quem deu o mate
            vence.
          </p>
        </div>
      </section>

      <section className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-64">
          <ChessBoard fen="7k/8/6Q1/6K1/8/8/8/8 b - - 0 1" interactive={false} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Afogamento (empate)</h2>
          <p className="text-stone-600 mt-1">
            Quando o jogador da vez não está em xeque, mas não tem nenhum lance legal disponível,
            a partida termina empatada.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Outros empates</h2>
        <p className="text-stone-600 mt-1">
          A partida também empata por repetição tripla da mesma posição, pela regra dos 50 lances
          sem captura ou movimento de peão, ou quando não há material suficiente no tabuleiro para
          dar mate.
        </p>
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Implement `app/aprender/estrategia/page.tsx`**

```tsx
import Link from 'next/link';

const PRINCIPLES = [
  {
    title: 'Controle o centro',
    text: 'As casas centrais (d4, e4, d5, e5) dão às suas peças mais mobilidade e influência sobre o tabuleiro. Ocupe ou controle o centro logo nos primeiros lances.',
  },
  {
    title: 'Desenvolva suas peças',
    text: 'Tire cavalos e bispos de suas casas iniciais cedo, antes de mover a mesma peça várias vezes ou sair caçando peões sem necessidade.',
  },
  {
    title: 'Proteja o rei',
    text: 'Roque cedo para colocar o rei a salvo atrás de uma fileira de peões, especialmente antes de abrir o jogo no centro.',
  },
  {
    title: 'Não perca material de graça',
    text: 'Antes de cada lance, confirme que nenhuma peça sua ficou pendurada (atacada e sem defesa suficiente).',
  },
  {
    title: 'Pense em ameaças antes de atacar',
    text: 'Pergunte-se o que o adversário quer fazer no próximo lance antes de decidir o seu — muitas peças são perdidas por ignorar a resposta do oponente.',
  },
];

export default function EstrategiaPage() {
  return (
    <main className="min-h-screen max-w-2xl mx-auto p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Princípios de estratégia</h1>
        <p className="text-stone-600 mt-2">
          <Link href="/aprender" className="underline text-sky-700">
            Voltar ao tutorial
          </Link>
        </p>
      </div>
      <ul className="flex flex-col gap-4">
        {PRINCIPLES.map((principle) => (
          <li key={principle.title} className="rounded-md border border-stone-200 p-4">
            <p className="font-semibold">{principle.title}</p>
            <p className="text-stone-600 mt-1">{principle.text}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, go to `/aprender`.
Expected: index lists all four topics; each links to a working page; the "Cavalo" demo on `/aprender/pecas` highlights all 8 valid knight moves from e4; "Voltar" links work on every page.

- [ ] **Step 7: Commit**

```bash
git add app/aprender
git commit -m "feat: add /aprender tutorial section"
```

---

### Task 12: Docker packaging, deploy config, and README

**Files:**
- Modify: `next.config.ts` (or `next.config.mjs`, whichever `create-next-app` generated in Task 1 — check with `ls next.config.*`)
- Create: `Dockerfile`
- Create: `.dockerignore`
- Create: `README.md`

- [ ] **Step 1: Add `output: 'standalone'` to the Next.js config**

Open the generated config file and add the `output` key to the exported config object, e.g. for `next.config.ts`:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

(If the file is `next.config.mjs` instead, add the same `output: 'standalone'` key to its existing `nextConfig` object without otherwise changing its structure.)

- [ ] **Step 2: Create `.dockerignore`**

```
node_modules
.next
.git
docs
```

- [ ] **Step 3: Create `Dockerfile`**

```dockerfile
# syntax=docker/dockerfile:1
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

- [ ] **Step 4: Build and run the Docker image**

```bash
docker build -t xadrez-aprendizado .
docker run --rm -d -p 3000:3000 --name xadrez-test xadrez-aprendizado
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
docker logs xadrez-test
docker stop xadrez-test
```

Expected: HTTP status `200`; container logs show Next.js starting with no errors.

- [ ] **Step 5: Create `README.md`**

```markdown
# Xadrez — aprenda jogando

Jogo de xadrez em Next.js, com modo contra o computador (Stockfish, três
níveis de dificuldade) e modo dois jogadores no mesmo dispositivo, além de
um modo aprendizado (lances legais, peças ameaçadas, sugestão de jogada e
avaliação rápida de cada lance) e um tutorial em `/aprender`.

## Desenvolvimento

\`\`\`bash
npm install
npm run dev
\`\`\`

Abra http://localhost:3000.

## Testes

\`\`\`bash
npm test
\`\`\`

## Docker

\`\`\`bash
docker build -t xadrez-aprendizado .
docker run --rm -p 3000:3000 xadrez-aprendizado
\`\`\`

## Deploy no Vercel

Conecte o repositório no Vercel — não há variáveis de ambiente obrigatórias.
```

- [ ] **Step 6: Final full-suite check**

Run: `npm test && npm run build`
Expected: all Vitest suites PASS, Next.js build succeeds.

- [ ] **Step 7: Commit**

```bash
git add next.config.ts Dockerfile .dockerignore README.md
git commit -m "chore: add Docker packaging and README"
```
