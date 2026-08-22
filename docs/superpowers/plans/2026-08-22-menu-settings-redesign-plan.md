# Menu e Ecrã de Definições — Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the main menu into illustrated tiles (vs CPU / 2 players / Opções), move difficulty+color to a dedicated `/configurar` screen only for the CPU mode, and introduce `/opcoes` with working difficulty/color defaults plus visible-but-disabled "coming soon" sections for the three follow-up sub-projects (board theme, piece style, background image, language).

**Architecture:** A small pure `lib/settings/` module (load/save + a thin hook) persists `{ defaultDifficulty, defaultColor }` to `localStorage`, mirroring `useChessGame`'s exact pattern. `ModeSelector.tsx` is retired and split into the three menu tiles (live in `app/page.tsx`) plus a new `GameSetup` component (used only by `/configurar`). Four new generated/compressed images (three tiles + one page background) follow the same `agy` → resize → WebP pipeline already used for the board texture. `/jogar` itself is untouched.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind, Vitest + Testing Library (existing), `agy` (Antigravity CLI) + `sips` + `cwebp` for image generation (existing tooling from the board-texture work).

**Spec:** `docs/superpowers/specs/2026-08-22-menu-settings-redesign-design.md`

## Global Constraints

- All new user-facing copy is PT-PT (2nd person "teu/tua", infinitive instructions — see `CLAUDE.md`).
- `/jogar`'s querystring contract (`mode`/`difficulty`/`color`) does not change at all.
- Settings persistence follows `useChessGame`'s exact defensive pattern: `typeof window !== 'undefined'` guard + `try/catch`, never throws, never blocks navigation if `localStorage` is unavailable. Corrupt/invalid saved data falls back to defaults **field-by-field**, not as an all-or-nothing reject.
- The three main-menu tiles are real `<Link>` elements (not `<button onClick={router.push}>`) — they're static-destination navigation. The "Começar" button on `/configurar` stays a `<button onClick>` since its destination URL depends on in-page state.
- Generated images: use the established pipeline — `agy` generate → `sips -Z <size>` downscale → `cwebp -q 85` → commit only the final `.webp`, never the multi-hundred-KB originals or intermediate PNGs.
- Colocate every new test next to the file it tests (`*.test.ts`), following `lib/chess/*.test.ts`'s pattern (plain `describe`/`it`, Vitest, `renderHook`/`act` for hooks — see `lib/chess/useChessGame.test.ts`).
- No new tests for page-level components (`app/configurar/page.tsx`, `app/opcoes/page.tsx`, `GameSetup.tsx`, the rewritten `app/page.tsx`) — consistent with `ModeSelector.tsx` never having had tests.

---

### Task 1: `PlayerColor` type + `lib/settings/settings.ts`

**Files:**
- Create: `lib/chess/playerColor.ts`
- Create: `lib/settings/settings.ts`
- Test: `lib/settings/settings.test.ts`

**Interfaces:**
- Produces: `export type PlayerColor = 'white' | 'black' | 'random'` (from `lib/chess/playerColor.ts`); `export interface Settings { defaultDifficulty: Difficulty; defaultColor: PlayerColor }`, `export const DEFAULT_SETTINGS: Settings`, `export function loadSettings(): Settings`, `export function saveSettings(settings: Settings): void` (from `lib/settings/settings.ts`). Tasks 2, 4, 6 depend on all of these.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/settings/settings.test.ts
import { describe, expect, it, beforeEach } from 'vitest';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from './settings';

const STORAGE_KEY = 'xadrez-settings';

describe('loadSettings', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns the defaults when nothing is saved', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('returns previously saved settings', () => {
    saveSettings({ defaultDifficulty: 'dificil', defaultColor: 'black' });
    expect(loadSettings()).toEqual({ defaultDifficulty: 'dificil', defaultColor: 'black' });
  });

  it('falls back to defaults field-by-field when one field is invalid', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ defaultDifficulty: 'impossivel', defaultColor: 'black' })
    );
    expect(loadSettings()).toEqual({
      defaultDifficulty: DEFAULT_SETTINGS.defaultDifficulty,
      defaultColor: 'black',
    });
  });

  it('falls back to defaults entirely when the saved data is not valid JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, 'not json{{{');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('falls back to defaults when the saved value is not an object', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify('a string, not an object'));
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe('saveSettings', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persists settings that loadSettings can read back', () => {
    saveSettings({ defaultDifficulty: 'medio', defaultColor: 'random' });
    expect(loadSettings()).toEqual({ defaultDifficulty: 'medio', defaultColor: 'random' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/settings/settings.test.ts`
Expected: FAIL — "Failed to resolve import './settings'" (the file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

```ts
// lib/chess/playerColor.ts
export type PlayerColor = 'white' | 'black' | 'random';
```

```ts
// lib/settings/settings.ts
import type { Difficulty } from '@/lib/chess/difficulty';
import type { PlayerColor } from '@/lib/chess/playerColor';

export interface Settings {
  defaultDifficulty: Difficulty;
  defaultColor: PlayerColor;
}

export const DEFAULT_SETTINGS: Settings = {
  defaultDifficulty: 'facil',
  defaultColor: 'white',
};

const STORAGE_KEY = 'xadrez-settings';

const VALID_DIFFICULTIES: readonly Difficulty[] = ['facil', 'medio', 'dificil'];
const VALID_COLORS: readonly PlayerColor[] = ['white', 'black', 'random'];

function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'string' && (VALID_DIFFICULTIES as readonly string[]).includes(value);
}

function isPlayerColor(value: unknown): value is PlayerColor {
  return typeof value === 'string' && (VALID_COLORS as readonly string[]).includes(value);
}

/**
 * Lê as definições guardadas em localStorage. Dados em falta, corrompidos,
 * ou de um formato antigo caem nos valores por omissão campo a campo — uma
 * só definição inválida não deve rebentar a app inteira nem apagar as
 * outras definições ainda válidas.
 */
export function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_SETTINGS;
    const candidate = parsed as Record<string, unknown>;
    return {
      defaultDifficulty: isDifficulty(candidate.defaultDifficulty)
        ? candidate.defaultDifficulty
        : DEFAULT_SETTINGS.defaultDifficulty,
      defaultColor: isPlayerColor(candidate.defaultColor)
        ? candidate.defaultColor
        : DEFAULT_SETTINGS.defaultColor,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage indisponível (modo privado, quota cheia) — as escolhas
    // simplesmente não persistem entre visitas, mas nada na app quebra.
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/settings/settings.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Run the full test suite, typecheck, and lint**

Run: `npm run test && npx tsc --noEmit && npm run lint`
Expected: all pass — nothing else in the app references these new files yet, so no other errors should appear.

- [ ] **Step 6: Commit**

```bash
git add lib/chess/playerColor.ts lib/settings/settings.ts lib/settings/settings.test.ts
git commit -m "feat: add lib/settings — pure load/save for user preferences

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01KZV2vNQV2E66GMTXiHMQer"
```

---

### Task 2: `useSettings` hook

**Files:**
- Create: `lib/settings/useSettings.ts`
- Test: `lib/settings/useSettings.test.ts`

**Interfaces:**
- Consumes: `loadSettings`, `saveSettings`, `Settings`, `DEFAULT_SETTINGS` from `lib/settings/settings.ts` (Task 1).
- Produces: `export interface UseSettingsResult { settings: Settings; updateSettings: (partial: Partial<Settings>) => void }`, `export function useSettings(): UseSettingsResult`. Tasks 4 and 6 depend on this exact shape.

- [ ] **Step 1: Write the failing test**

```ts
// lib/settings/useSettings.test.ts
import { describe, expect, it, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSettings } from './useSettings';
import { DEFAULT_SETTINGS, loadSettings } from './settings';

describe('useSettings', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts from the defaults when nothing is saved', () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('starts from whatever was already saved', () => {
    window.localStorage.setItem(
      'xadrez-settings',
      JSON.stringify({ defaultDifficulty: 'dificil', defaultColor: 'black' })
    );
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual({ defaultDifficulty: 'dificil', defaultColor: 'black' });
  });

  it('updateSettings merges a partial change and persists it', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.updateSettings({ defaultColor: 'black' });
    });
    expect(result.current.settings).toEqual({
      defaultDifficulty: DEFAULT_SETTINGS.defaultDifficulty,
      defaultColor: 'black',
    });
    // Persisted for real, not just in local React state — a fresh load
    // from storage sees the same value.
    expect(loadSettings()).toEqual({
      defaultDifficulty: DEFAULT_SETTINGS.defaultDifficulty,
      defaultColor: 'black',
    });
  });

  it('two separate updateSettings calls both persist (no lost update)', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.updateSettings({ defaultDifficulty: 'medio' });
    });
    act(() => {
      result.current.updateSettings({ defaultColor: 'random' });
    });
    expect(result.current.settings).toEqual({ defaultDifficulty: 'medio', defaultColor: 'random' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/settings/useSettings.test.ts`
Expected: FAIL — "Failed to resolve import './useSettings'" (the file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

```ts
// lib/settings/useSettings.ts
'use client';

import { useCallback, useState } from 'react';
import { loadSettings, saveSettings, type Settings } from './settings';

export interface UseSettingsResult {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
}

/**
 * Mesmo padrão do useChessGame: lê o localStorage dentro do inicializador
 * de useState (nunca em useEffect) — esta árvore é inteiramente
 * client-side a partir daqui, por isso não há problema de hidratação.
 */
export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/settings/useSettings.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Run the full test suite, typecheck, and lint**

Run: `npm run test && npx tsc --noEmit && npm run lint`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add lib/settings/useSettings.ts lib/settings/useSettings.test.ts
git commit -m "feat: add useSettings hook

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01KZV2vNQV2E66GMTXiHMQer"
```

---

### Task 3: `clearSavedGame()` in `useChessGame.ts`

**Files:**
- Modify: `lib/chess/useChessGame.ts`
- Modify: `lib/chess/useChessGame.test.ts`

**Interfaces:**
- Produces: `export function clearSavedGame(): void`. Tasks 4 and 8 depend on this exact name/signature.

- [ ] **Step 1: Write the failing test**

Read the current `lib/chess/useChessGame.test.ts` first, then add this test at the end of its `describe('useChessGame', ...)` block:

```ts
  it('clearSavedGame removes any persisted FEN', () => {
    const { result } = renderHook(() => useChessGame(true));
    act(() => {
      result.current.makeMove('e2', 'e4');
    });
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    clearSavedGame();

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
```

And update the top import line from:
```ts
import { useChessGame } from './useChessGame';
```
to:
```ts
import { useChessGame, clearSavedGame, STORAGE_KEY } from './useChessGame';
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/chess/useChessGame.test.ts`
Expected: FAIL — `clearSavedGame` is not exported yet (TypeScript error / undefined is not a function).

- [ ] **Step 3: Add the export**

Read the current `lib/chess/useChessGame.ts` first, then add this function (placed near the top-level exports, after `export const STORAGE_KEY = ...`):

```ts
/**
 * Limpa o FEN guardado, sem precisar de montar o hook. Usado antes de
 * começar uma partida nova (tanto no botão "Começar" de /configurar como
 * no clique direto em "Dois jogadores" no menu) — extraído para aqui em
 * vez de duplicar a mesma lógica defensiva de try/catch nos dois sítios.
 */
export function clearSavedGame(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage indisponível — nada para limpar, segue em frente
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/chess/useChessGame.test.ts`
Expected: PASS (8 tests — the 7 existing plus the new one).

- [ ] **Step 5: Run the full test suite, typecheck, and lint**

Run: `npm run test && npx tsc --noEmit && npm run lint`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add lib/chess/useChessGame.ts lib/chess/useChessGame.test.ts
git commit -m "feat: extract clearSavedGame() out of ModeSelector's handleStart

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01KZV2vNQV2E66GMTXiHMQer"
```

---

### Task 4: `GameSetup` component

**Files:**
- Create: `components/GameSetup/GameSetup.tsx`

**Interfaces:**
- Consumes: `useSettings()` (Task 2), `clearSavedGame()` (Task 3), `Difficulty` from `lib/chess/difficulty.ts`, `PlayerColor` from `lib/chess/playerColor.ts` (Task 1).
- Produces: `export function GameSetup()` — a full self-contained component (state + UI + navigation). Task 5 renders it.

- [ ] **Step 1: Write the component**

No test for this component (matches the project's `ModeSelector.tsx` precedent — never had a test file).

```tsx
// components/GameSetup/GameSetup.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Difficulty } from '@/lib/chess/difficulty';
import type { PlayerColor } from '@/lib/chess/playerColor';
import { clearSavedGame } from '@/lib/chess/useChessGame';
import { useSettings } from '@/lib/settings/useSettings';

const DIFFICULTIES: Difficulty[] = ['facil', 'medio', 'dificil'];
const COLORS: [PlayerColor, string][] = [
  ['white', 'Brancas'],
  ['black', 'Pretas'],
  ['random', 'Aleatório'],
];

// Dificuldade e cor pré-preenchem-se a partir das Definições guardadas,
// mas escolher aqui é só para esta partida — não altera as Definições por
// omissão (isso só acontece em /opcoes).
export function GameSetup() {
  const router = useRouter();
  const { settings } = useSettings();
  const [difficulty, setDifficulty] = useState<Difficulty>(settings.defaultDifficulty);
  const [color, setColor] = useState<PlayerColor>(settings.defaultColor);

  function handleStart() {
    clearSavedGame();
    const params = new URLSearchParams({ mode: 'ai', difficulty, color });
    router.push(`/jogar?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-6 max-w-sm mx-auto w-full">
      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium mb-1">Dificuldade</legend>
        <div className="flex gap-2">
          {DIFFICULTIES.map((level) => (
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
        <legend className="font-medium mb-1">As tuas peças</legend>
        <div className="flex gap-2">
          {COLORS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setColor(value)}
              aria-pressed={color === value}
              className={`flex-1 rounded-md border px-3 py-2 ${
                color === value ? 'bg-emerald-600 text-white border-emerald-600' : 'border-stone-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

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

- [ ] **Step 2: Run the full test suite, typecheck, and lint**

Run: `npm run test && npx tsc --noEmit && npm run lint`
Expected: all pass. `ModeSelector.tsx` still exists at this point (removed in Task 8) and is unaffected — this task only adds a new, unreferenced-so-far component.

- [ ] **Step 3: Commit**

```bash
git add components/GameSetup/GameSetup.tsx
git commit -m "feat: add GameSetup component (difficulty/color, pre-filled from settings)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01KZV2vNQV2E66GMTXiHMQer"
```

---

### Task 5: `/configurar` page

**Files:**
- Create: `app/configurar/page.tsx`

**Interfaces:**
- Consumes: `GameSetup` from `components/GameSetup/GameSetup.tsx` (Task 4).

- [ ] **Step 1: Write the page**

No test (page-level component, matches project precedent).

```tsx
// app/configurar/page.tsx
import Link from 'next/link';
import { GameSetup } from '@/components/GameSetup/GameSetup';

export default function ConfigurarPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-start gap-8 p-8">
      <h1 className="text-2xl font-bold">Jogar contra o computador</h1>
      <GameSetup />
      <Link href="/" className="underline text-stone-600 text-sm">
        Menu inicial
      </Link>
    </main>
  );
}
```

- [ ] **Step 2: Run the full test suite, typecheck, lint, and build**

Run: `npm run test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all pass, `/configurar` appears as a new static route in the build output.

- [ ] **Step 3: Commit**

```bash
git add app/configurar/page.tsx
git commit -m "feat: add /configurar page for CPU game setup

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01KZV2vNQV2E66GMTXiHMQer"
```

---

### Task 6: `/opcoes` page

**Files:**
- Create: `app/opcoes/page.tsx`

**Interfaces:**
- Consumes: `useSettings()` (Task 2), `Difficulty` (`lib/chess/difficulty.ts`), `PlayerColor` (Task 1).

- [ ] **Step 1: Write the page**

No test (page-level component, matches project precedent).

```tsx
// app/opcoes/page.tsx
'use client';

import Link from 'next/link';
import type { Difficulty } from '@/lib/chess/difficulty';
import type { PlayerColor } from '@/lib/chess/playerColor';
import { useSettings } from '@/lib/settings/useSettings';

const DIFFICULTIES: Difficulty[] = ['facil', 'medio', 'dificil'];
const COLORS: [PlayerColor, string][] = [
  ['white', 'Brancas'],
  ['black', 'Pretas'],
  ['random', 'Aleatório'],
];

// Secção ainda sem funcionalidade — reserva o lugar na interface para os
// sub-projetos seguintes (biblioteca de temas, i18n) sem os implementar
// aqui. Ver docs/superpowers/specs/2026-08-22-menu-settings-redesign-design.md.
function ComingSoonSection({ title }: { title: string }) {
  return (
    <fieldset className="flex flex-col gap-2 opacity-50" aria-disabled="true">
      <legend className="font-medium mb-1 flex items-center gap-2">
        {title}
        <span className="text-xs rounded-full bg-stone-200 text-stone-600 px-2 py-0.5 font-normal">
          Brevemente
        </span>
      </legend>
      <div className="rounded-md border border-dashed border-stone-300 px-3 py-4 text-sm text-stone-500">
        Ainda não disponível.
      </div>
    </fieldset>
  );
}

export default function OpcoesPage() {
  const { settings, updateSettings } = useSettings();

  return (
    <main className="min-h-dvh flex flex-col items-center justify-start gap-8 p-8">
      <h1 className="text-2xl font-bold">Opções</h1>
      <div className="flex flex-col gap-6 max-w-sm w-full">
        <fieldset className="flex flex-col gap-2">
          <legend className="font-medium mb-1">Dificuldade padrão</legend>
          <div className="flex gap-2">
            {DIFFICULTIES.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => updateSettings({ defaultDifficulty: level })}
                aria-pressed={settings.defaultDifficulty === level}
                className={`flex-1 rounded-md border px-3 py-2 capitalize ${
                  settings.defaultDifficulty === level
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
          <legend className="font-medium mb-1">Cor padrão</legend>
          <div className="flex gap-2">
            {COLORS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => updateSettings({ defaultColor: value })}
                aria-pressed={settings.defaultColor === value}
                className={`flex-1 rounded-md border px-3 py-2 ${
                  settings.defaultColor === value
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-stone-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <ComingSoonSection title="Tema do tabuleiro" />
        <ComingSoonSection title="Estilo das peças" />
        <ComingSoonSection title="Imagem de fundo" />
        <ComingSoonSection title="Idioma" />
      </div>

      <Link href="/" className="underline text-stone-600 text-sm">
        Menu inicial
      </Link>
    </main>
  );
}
```

- [ ] **Step 2: Run the full test suite, typecheck, lint, and build**

Run: `npm run test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all pass, `/opcoes` appears as a new route in the build output.

- [ ] **Step 3: Commit**

```bash
git add app/opcoes/page.tsx
git commit -m "feat: add /opcoes settings page with coming-soon sections

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01KZV2vNQV2E66GMTXiHMQer"
```

---

### Task 7: Generate the four illustrated menu images

**Files:**
- Create: `public/menu/vs-cpu.webp`
- Create: `public/menu/two-players.webp`
- Create: `public/menu/options.webp`
- Create: `public/menu/background.webp`

**Interfaces:** none — static assets. Task 8 references these four paths.

> **This task is controller-executed, not delegated to an implementer subagent** — it's a sequence of interactive/slow `agy` calls best driven directly (same as the board-texture work), not a code-writing task. If running under subagent-driven-development, the controller does this step itself and skips the task-reviewer dispatch for it (there's no code diff to review, only images to judge by eye) — it still gets a ledger entry.

- [ ] **Step 1: Generate all four images in one style-consistent session**

`mkdir -p public/menu` first. Run each of these with `agy -p "..." --dangerously-skip-permissions`, telling `agy` the **exact absolute output path** in the prompt itself (this worked reliably for the board texture — don't leave the filename for `agy` to decide, to avoid ambiguity about what it actually produced). Prompt for a cohesive, moody, "premium chess club" art direction across all four — same lighting/palette description repeated in each prompt so they read as a matched set. Source images can be generated at whatever resolution `agy` defaults to (e.g. 1024×1024 square, as the board textures were) — a wide landscape or portrait composition is preferred per image below, but since these are applied via CSS `background-size: cover`, the exact aspect ratio doesn't need to match the final tile precisely; cover-cropping handles the difference.

- `/Users/rpaquito/Documents/Projects/ChessLearningGame/public/menu/vs-cpu-original.png` — a chess knight piece rendered with a subtle circuit-board/glowing-tech motif, dark background, dramatic rim lighting, warm gold accent color, digital painting style, no text or watermark, wide landscape composition.
- `/Users/rpaquito/Documents/Projects/ChessLearningGame/public/menu/two-players-original.png` — a white king and a black king facing off across a board, warm dramatic lighting, same "premium chess club" style as the CPU image, no text or watermark, wide landscape composition.
- `/Users/rpaquito/Documents/Projects/ChessLearningGame/public/menu/options-original.png` — a stylized gear intertwined with a small chess pawn silhouette, more neutral/muted tone than the other two but same overall art style, no text or watermark, wide landscape composition.
- `/Users/rpaquito/Documents/Projects/ChessLearningGame/public/menu/background-original.png` — a very subtle, dark, softly-blurred chess-themed backdrop (out-of-focus pieces/board), portrait orientation, low contrast so foreground text/tiles stay legible on top of it, same "premium chess club" style, no text or watermark.

Confirm all four exist before continuing: `ls public/menu/*-original.png` should list exactly these four files. If `agy` saved any of them to a different path despite the explicit instruction (it has done this before), locate the actual file and move it to the expected path rather than improvising a different pipeline.

- [ ] **Step 2: Downscale and compress each, matching the board-texture pipeline**

Menu tiles are shown at roughly `max-w-sm` (≈384px) wide by ~80-128px tall in the final design — downscale accordingly, generously above that for retina headroom:

```bash
cd public/menu
sips -Z 800 vs-cpu-original.png --out vs-cpu-800.png
sips -Z 800 two-players-original.png --out two-players-800.png
sips -Z 800 options-original.png --out options-800.png
sips -Z 1200 background-original.png --out background-1200.png   # portrait, larger since it covers the whole viewport

cwebp -q 85 vs-cpu-800.png -o vs-cpu.webp
cwebp -q 85 two-players-800.png -o two-players.webp
cwebp -q 85 options-800.png -o options.webp
cwebp -q 85 background-1200.png -o background.webp
```

- [ ] **Step 3: Clean up intermediates**

```bash
cd public/menu
rm -f *-original.png *-800.png *-1200.png
ls -la   # should show only the four final .webp files
```

- [ ] **Step 4: Sanity-check file sizes and visually inspect**

Confirm none is absurdly large (each should land well under 100KB given the board-texture precedent of 5-12KB at similar dimensions — photographic/illustrated content with more detail may run larger, but flag anything over ~150KB as worth re-compressing at a lower quality setting). View each file to confirm it looks right and the four share a consistent style before moving on.

- [ ] **Step 5: Commit**

```bash
git add public/menu/
git commit -m "feat: generate illustrated menu images (agy, downscaled to WebP)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01KZV2vNQV2E66GMTXiHMQer"
```

---

### Task 8: Rewrite `app/page.tsx`, remove `ModeSelector`

**Files:**
- Modify: `app/page.tsx`
- Delete: `components/ModeSelector/ModeSelector.tsx`

**Interfaces:**
- Consumes: `clearSavedGame()` (Task 3), the four images from `public/menu/` (Task 7). Depends on Task 7 completing first — do not dispatch until the images exist.

- [ ] **Step 1: Confirm the menu images exist**

Run: `ls public/menu/vs-cpu.webp public/menu/two-players.webp public/menu/options.webp public/menu/background.webp`
Expected: all four files listed. If any are missing, stop — Task 7 isn't done yet.

- [ ] **Step 2: Read the current `app/page.tsx`, then replace its full contents**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Show, UserButton } from '@clerk/nextjs';
import { clearSavedGame } from '@/lib/chess/useChessGame';
import { RulesModal } from '@/components/RulesModal/RulesModal';

export default function HomePage() {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <main
      className="min-h-dvh flex flex-col items-center gap-8 p-8 bg-stone-900 bg-cover bg-center"
      style={{ backgroundImage: 'url(/menu/background.webp)' }}
    >
      <div className="w-full max-w-sm flex justify-end text-sm">
        <Show when="signed-out">
          <Link href="/entrar" className="underline text-sky-200">
            Entrar
          </Link>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>

      <h1 className="text-3xl font-bold text-white">Xadrez</h1>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Link
          href="/configurar"
          className="relative flex items-center justify-center rounded-md overflow-hidden h-32 bg-stone-800 bg-cover bg-center"
          style={{ backgroundImage: 'url(/menu/vs-cpu.webp)' }}
        >
          <span className="relative bg-black/50 text-white text-lg font-semibold px-4 py-2 rounded">
            Jogar contra o computador
          </span>
        </Link>

        <Link
          href="/jogar?mode=local"
          onClick={() => clearSavedGame()}
          className="relative flex items-center justify-center rounded-md overflow-hidden h-32 bg-stone-800 bg-cover bg-center"
          style={{ backgroundImage: 'url(/menu/two-players.webp)' }}
        >
          <span className="relative bg-black/50 text-white text-lg font-semibold px-4 py-2 rounded">
            Dois jogadores
          </span>
        </Link>

        <Link
          href="/opcoes"
          className="relative flex items-center justify-center rounded-md overflow-hidden h-20 bg-stone-700 bg-cover bg-center"
          style={{ backgroundImage: 'url(/menu/options.webp)' }}
        >
          <span className="relative bg-black/50 text-white font-semibold px-4 py-2 rounded">
            Opções
          </span>
        </Link>
      </div>

      <p className="text-stone-200 text-sm text-center">
        <Link href="/aprender" className="underline">
          Ver tutorial
        </Link>{' '}
        ·{' '}
        <button type="button" onClick={() => setRulesOpen(true)} className="underline">
          Regras do jogo
        </button>
      </p>

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </main>
  );
}
```

- [ ] **Step 3: Delete the retired component**

```bash
rm -rf components/ModeSelector
```

- [ ] **Step 4: Run the full test suite, typecheck, lint, and build**

Run: `npm run test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all pass. Confirm no leftover references to `ModeSelector` anywhere:

Run: `grep -rl "ModeSelector" --include="*.tsx" --include="*.ts" . | grep -v node_modules`
Expected: no output (empty).

- [ ] **Step 5: Manual visual check (not automatable — do this once, by hand, or via a Playwright screenshot as done for the board texture)**

`npm run dev`, open `/`, confirm the three tiles render with their images and readable labels, tapping each navigates correctly ("Dois jogadores" straight to `/jogar?mode=local`, "Jogar contra o computador" to `/configurar`, "Opções" to `/opcoes`). Confirm the signed-in/signed-out header still works.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx
git rm -r components/ModeSelector
git commit -m "feat: rewrite the main menu as illustrated tiles, retire ModeSelector

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01KZV2vNQV2E66GMTXiHMQer"
```

---

### Task 9: Update `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:** none — documentation only.

- [ ] **Step 1: Read the current `CLAUDE.md`, then update the Estrutura tree**

Find the `app/` block (should currently show `page.tsx`, `entrar/[[...rest]]/page.tsx`, `criar-conta/[[...rest]]/page.tsx`, `jogar/page.tsx`, `aprender/`) and add two new lines for `configurar/page.tsx` and `opcoes/page.tsx`, and update the `page.tsx` comment to reflect the new tile-based menu instead of "ModeSelector". Add a new `lib/settings/` block (mirroring the existing `lib/auth/` block's format) listing `settings.ts` and `useSettings.ts`. Add a `public/menu/` line under the existing `public/` block, alongside `public/board/`.

- [ ] **Step 2: Add a new subsection**

Insert a new `###` subsection under "Convenções que não são óbvias a partir do código" (near the board-texture subsection, since it shares the same generation pipeline), explaining: the menu restructure (tiles vs the old single-screen `ModeSelector`), where `/configurar` and `/opcoes` fit, that `lib/settings/` mirrors `useChessGame`'s exact localStorage pattern, and that the four new images reused the exact same `agy` → `sips` → `cwebp` pipeline already documented for the board texture (point there instead of repeating the steps). Explicitly note the "Brevemente" sections in `/opcoes` are placeholders for the three follow-up sub-projects tracked in the `project-backlog` memory — not because that memory is in the repo, but so a future reader understands why disabled UI ships intentionally.

- [ ] **Step 3: Verify and commit**

Run: `npm run test && npx tsc --noEmit && npm run lint` (docs-only change, but confirm nothing else broke).

```bash
git add CLAUDE.md
git commit -m "docs: document the menu/settings redesign

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01KZV2vNQV2E66GMTXiHMQer"
```
