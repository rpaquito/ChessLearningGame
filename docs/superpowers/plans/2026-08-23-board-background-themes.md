# Biblioteca de Temas Visuais (Tabuleiro + Fundo) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one more selectable board texture and one more selectable background image, persisted in Settings and chosen via real pickers in `/opcoes`, with the chosen background also applied to `/jogar`.

**Architecture:** Two new fields on the existing `Settings` object (`boardTheme`, `backgroundTheme`), resolved through a new pure asset registry (`lib/settings/themes.ts`) that both the `/opcoes` picker UI and the rendering sites (`ChessBoard.tsx`, `app/page.tsx`, `app/jogar/page.tsx`) read from — no component hardcodes an asset path anymore. New art comes from the local Draw Things HTTP API, following the existing generate → `sips` → `cwebp` vendoring pipeline.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS v4, Vitest + Testing Library, Draw Things local HTTP API (`http://127.0.0.1:7860/sdapi/v1/txt2img`).

**Spec:** `docs/superpowers/specs/2026-08-23-board-background-themes-design.md`

## Global Constraints

- All user-visible text is PT-PT (never PT-BR) — see `CLAUDE.md`'s language section for concrete rules (gerund → "a + infinitivo", 2nd-person "teu/tua", infinitive instructions).
- No new npm dependency — plain CSS/Tailwind and the already-installed `chess.js`/React only.
- `loadSettings()` must keep its field-by-field fallback pattern: one invalid/missing field never invalidates the others.
- `ChessBoard`'s default behavior (no `boardTheme` prop passed) must stay pixel-identical to today, since the four static `/aprender` demo boards never pass it.
- New board images: seamless/tileable, flat lighting (no shadows/vignette), generated then `sips -Z 384` + `cwebp -q 85` (matches the existing `carvalho` pair, ~5-12KB each).
- New background image: `sips -Z 1200` + `cwebp -q 85`, low contrast/soft-focus so foreground content stays legible on top.
- `/jogar`'s board must always fit the visible screen (`min(92vw, 62dvh, 560px)`) — the new background layer there must be `fixed`/out-of-flow so it cannot affect layout or scroll.

---

### Task 1: `Settings` gains `boardTheme` and `backgroundTheme`

**Files:**
- Modify: `lib/settings/settings.ts`
- Test: `lib/settings/settings.test.ts`

**Interfaces:**
- Produces: `export type BoardTheme = 'carvalho' | 'ebano-bordo';`, `export type BackgroundTheme = 'classico' | 'noturno';`, `Settings.boardTheme: BoardTheme`, `Settings.backgroundTheme: BackgroundTheme`, `DEFAULT_SETTINGS.boardTheme === 'carvalho'`, `DEFAULT_SETTINGS.backgroundTheme === 'classico'`.

- [ ] **Step 1: Write the failing tests**

Add to `lib/settings/settings.test.ts` (inside the existing `describe('loadSettings', ...)` block, after the last `it(...)`):

```ts
  it('returns previously saved theme choices', () => {
    saveSettings({ ...DEFAULT_SETTINGS, boardTheme: 'ebano-bordo', backgroundTheme: 'noturno' });
    expect(loadSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      boardTheme: 'ebano-bordo',
      backgroundTheme: 'noturno',
    });
  });

  it('falls back to default theme choices when saved values are invalid', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_SETTINGS, boardTheme: 'nao-existe', backgroundTheme: 42 })
    );
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
```

Also update the two existing tests that construct partial `Settings` objects by hand so they keep compiling and asserting the right thing — replace:

```ts
  it('returns previously saved settings', () => {
    saveSettings({ defaultDifficulty: 'dificil', defaultColor: 'black' });
    expect(loadSettings()).toEqual({ defaultDifficulty: 'dificil', defaultColor: 'black' });
  });
```

with:

```ts
  it('returns previously saved settings', () => {
    saveSettings({ ...DEFAULT_SETTINGS, defaultDifficulty: 'dificil', defaultColor: 'black' });
    expect(loadSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      defaultDifficulty: 'dificil',
      defaultColor: 'black',
    });
  });
```

and in the `describe('saveSettings', ...)` block, replace:

```ts
  it('persists settings that loadSettings can read back', () => {
    saveSettings({ defaultDifficulty: 'medio', defaultColor: 'random' });
    expect(loadSettings()).toEqual({ defaultDifficulty: 'medio', defaultColor: 'random' });
  });
```

with:

```ts
  it('persists settings that loadSettings can read back', () => {
    saveSettings({ ...DEFAULT_SETTINGS, defaultDifficulty: 'medio', defaultColor: 'random' });
    expect(loadSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      defaultDifficulty: 'medio',
      defaultColor: 'random',
    });
  });
```

(These two edits are required regardless — once `Settings` gains required fields, a hand-built object missing them is a type error, not just a stale assertion.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/settings/settings.test.ts`
Expected: FAIL — `boardTheme`/`backgroundTheme` don't exist yet (either a TypeScript error surfaced through Vitest, or `toEqual` mismatches).

- [ ] **Step 3: Implement**

In `lib/settings/settings.ts`, replace the full file with:

```ts
import type { Difficulty } from '@/lib/chess/difficulty';
import type { PlayerColor } from '@/lib/chess/playerColor';

export type BoardTheme = 'carvalho' | 'ebano-bordo';
export type BackgroundTheme = 'classico' | 'noturno';

export interface Settings {
  defaultDifficulty: Difficulty;
  defaultColor: PlayerColor;
  boardTheme: BoardTheme;
  backgroundTheme: BackgroundTheme;
}

export const DEFAULT_SETTINGS: Settings = {
  defaultDifficulty: 'facil',
  defaultColor: 'white',
  boardTheme: 'carvalho',
  backgroundTheme: 'classico',
};

const STORAGE_KEY = 'xadrez-settings';

const VALID_DIFFICULTIES: readonly Difficulty[] = ['facil', 'medio', 'dificil'];
const VALID_COLORS: readonly PlayerColor[] = ['white', 'black', 'random'];
const VALID_BOARD_THEMES: readonly BoardTheme[] = ['carvalho', 'ebano-bordo'];
const VALID_BACKGROUND_THEMES: readonly BackgroundTheme[] = ['classico', 'noturno'];

function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'string' && (VALID_DIFFICULTIES as readonly string[]).includes(value);
}

function isPlayerColor(value: unknown): value is PlayerColor {
  return typeof value === 'string' && (VALID_COLORS as readonly string[]).includes(value);
}

function isBoardTheme(value: unknown): value is BoardTheme {
  return typeof value === 'string' && (VALID_BOARD_THEMES as readonly string[]).includes(value);
}

function isBackgroundTheme(value: unknown): value is BackgroundTheme {
  return (
    typeof value === 'string' && (VALID_BACKGROUND_THEMES as readonly string[]).includes(value)
  );
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
      boardTheme: isBoardTheme(candidate.boardTheme)
        ? candidate.boardTheme
        : DEFAULT_SETTINGS.boardTheme,
      backgroundTheme: isBackgroundTheme(candidate.backgroundTheme)
        ? candidate.backgroundTheme
        : DEFAULT_SETTINGS.backgroundTheme,
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
Expected: PASS (7 tests: 5 existing + 2 new).

- [ ] **Step 5: Fix `lib/settings/useSettings.test.ts`'s hand-built `Settings` objects**

`Settings` now requires `boardTheme`/`backgroundTheme`, so the partial objects this file builds by hand no longer match what `loadSettings()`/`updateSettings()` actually return (both now always include the two new fields, defaulted). Replace the four affected tests:

```ts
  it('starts from whatever was already saved', () => {
    window.localStorage.setItem(
      'xadrez-settings',
      JSON.stringify({ ...DEFAULT_SETTINGS, defaultDifficulty: 'dificil', defaultColor: 'black' })
    );
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual({
      ...DEFAULT_SETTINGS,
      defaultDifficulty: 'dificil',
      defaultColor: 'black',
    });
  });

  it('updateSettings merges a partial change and persists it', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.updateSettings({ defaultColor: 'black' });
    });
    expect(result.current.settings).toEqual({ ...DEFAULT_SETTINGS, defaultColor: 'black' });
    // Persisted for real, not just in local React state — a fresh load
    // from storage sees the same value.
    expect(loadSettings()).toEqual({ ...DEFAULT_SETTINGS, defaultColor: 'black' });
  });

  it('two separate updateSettings calls both persist (no lost update)', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.updateSettings({ defaultDifficulty: 'medio' });
    });
    act(() => {
      result.current.updateSettings({ defaultColor: 'random' });
    });
    expect(result.current.settings).toEqual({
      ...DEFAULT_SETTINGS,
      defaultDifficulty: 'medio',
      defaultColor: 'random',
    });
  });

  it('does not lose an update when two updateSettings calls happen before a re-render settles', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.updateSettings({ defaultDifficulty: 'medio' });
      result.current.updateSettings({ defaultColor: 'random' });
    });
    expect(result.current.settings).toEqual({
      ...DEFAULT_SETTINGS,
      defaultDifficulty: 'medio',
      defaultColor: 'random',
    });
  });
```

(The first test in the file, `'starts from the defaults when nothing is saved'`, already compares against `DEFAULT_SETTINGS` directly and needs no change.)

- [ ] **Step 6: Run typecheck and the full suite**

Run: `npx tsc --noEmit && npm run test`
Expected: both clean. (`app/opcoes/page.tsx` only ever calls `updateSettings({ defaultDifficulty: level })`-style partial updates, never constructs a full `Settings` object by hand, so it needs no change here.)

- [ ] **Step 7: Commit**

```bash
git add lib/settings/settings.ts lib/settings/settings.test.ts lib/settings/useSettings.test.ts
git commit -m "feat: add boardTheme/backgroundTheme to Settings

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01D3ouVfnGwXBGQSenGVajhg"
```

---

### Task 2: Theme asset registry (`lib/settings/themes.ts`)

**Files:**
- Create: `lib/settings/themes.ts`
- Test: `lib/settings/themes.test.ts`

**Interfaces:**
- Consumes: `BoardTheme`, `BackgroundTheme` (Task 1).
- Produces: `BOARD_THEMES: Record<BoardTheme, { label: string; light: string; dark: string }>`, `BACKGROUND_THEMES: Record<BackgroundTheme, { label: string; image: string }>`.

- [ ] **Step 1: Write the failing test**

Create `lib/settings/themes.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { BOARD_THEMES, BACKGROUND_THEMES } from './themes';
import type { BoardTheme, BackgroundTheme } from './settings';

const ALL_BOARD_THEMES: BoardTheme[] = ['carvalho', 'ebano-bordo'];
const ALL_BACKGROUND_THEMES: BackgroundTheme[] = ['classico', 'noturno'];

describe('BOARD_THEMES', () => {
  it('has a registry entry for every BoardTheme value', () => {
    for (const theme of ALL_BOARD_THEMES) {
      expect(BOARD_THEMES[theme]).toBeDefined();
      expect(BOARD_THEMES[theme].light).toMatch(/^\/board\//);
      expect(BOARD_THEMES[theme].dark).toMatch(/^\/board\//);
      expect(BOARD_THEMES[theme].label.length).toBeGreaterThan(0);
    }
  });
});

describe('BACKGROUND_THEMES', () => {
  it('has a registry entry for every BackgroundTheme value', () => {
    for (const theme of ALL_BACKGROUND_THEMES) {
      expect(BACKGROUND_THEMES[theme]).toBeDefined();
      expect(BACKGROUND_THEMES[theme].image).toMatch(/^\/menu\//);
      expect(BACKGROUND_THEMES[theme].label.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/settings/themes.test.ts`
Expected: FAIL — `./themes` doesn't exist yet.

- [ ] **Step 3: Implement**

Create `lib/settings/themes.ts`:

```ts
import type { BackgroundTheme, BoardTheme } from './settings';

export interface BoardThemeInfo {
  label: string;
  light: string;
  dark: string;
}

export interface BackgroundThemeInfo {
  label: string;
  image: string;
}

/**
 * Registo único dos assets de cada tema — o resto da app nunca escreve um
 * caminho de imagem de tema diretamente, só lê daqui (ChessBoard.tsx,
 * app/page.tsx, app/jogar/page.tsx, app/opcoes/page.tsx).
 */
export const BOARD_THEMES: Record<BoardTheme, BoardThemeInfo> = {
  carvalho: {
    label: 'Carvalho',
    light: '/board/light-square.webp',
    dark: '/board/dark-square.webp',
  },
  'ebano-bordo': {
    label: 'Ébano e bordo',
    light: '/board/ebano-bordo-light-square.webp',
    dark: '/board/ebano-bordo-dark-square.webp',
  },
};

export const BACKGROUND_THEMES: Record<BackgroundTheme, BackgroundThemeInfo> = {
  classico: { label: 'Clássico', image: '/menu/background.webp' },
  noturno: { label: 'Noturno', image: '/menu/background-noturno.webp' },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/settings/themes.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full suite, typecheck, and lint**

Run: `npm run test && npx tsc --noEmit && npm run lint`
Expected: all clean.

- [ ] **Step 6: Commit**

```bash
git add lib/settings/themes.ts lib/settings/themes.test.ts
git commit -m "feat: add board/background theme asset registry

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01D3ouVfnGwXBGQSenGVajhg"
```

---

### Task 3: Generate the two new image assets (Draw Things)

**Files:**
- Create: `public/board/ebano-bordo-light-square.webp`
- Create: `public/board/ebano-bordo-dark-square.webp`
- Create: `public/menu/background-noturno.webp`

**Interfaces:** none — static assets. Task 2's registry already references these exact paths; Task 4/6/7 render them.

> **This task is controller-executed, not delegated to an implementer subagent** — it's a sequence of interactive/slow Draw Things API calls best judged by eye (same as the original board-texture and menu-tile work). If running under subagent-driven-development, the controller does this step itself and skips the task-reviewer dispatch for it (there's no code diff to review, only images to judge).

- [ ] **Step 1: Confirm Draw Things is reachable**

Run: `curl -s -m 3 http://127.0.0.1:7860/ -o /dev/null -w "%{http_code}\n"`
Expected: `200`. If not, open the Draw Things app and enable Settings → Advanced → HTTP API Server, then retry.

- [ ] **Step 2: Generate the light board square (bordo/maple)**

```bash
curl -s -X POST http://127.0.0.1:7860/sdapi/v1/txt2img \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "seamless tileable pale maple wood texture, light cream color, flat even lighting, no shadows, no vignette, top-down view, subtle wood grain detail, photorealistic",
    "negative_prompt": "text, watermark, signature, shadow, vignette, dark, blurry",
    "width": 1024,
    "height": 1024,
    "steps": 8,
    "sampler_name": "UniPC Trailing",
    "batch_size": 1
  }' -o /tmp/bordo-light-raw.json
python3 -c "
import json, base64
d = json.load(open('/tmp/bordo-light-raw.json'))
open('public/board/ebano-bordo-light-square-original.png', 'wb').write(base64.b64decode(d['images'][0]))
"
```

Budget 2-3 minutes for the request. Then inspect the result (Read the PNG) — it must look like a plain, evenly-lit pale wood texture with no shadow gradient (a lit corner/vignette will look obviously wrong when tiled behind repeated board squares). If it doesn't, adjust the prompt to push harder on "flat lighting, no shadows" and regenerate.

- [ ] **Step 3: Generate the dark board square (ébano/ebony)**

```bash
curl -s -X POST http://127.0.0.1:7860/sdapi/v1/txt2img \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "seamless tileable dark ebony wood texture, deep near-black color, flat even lighting, no shadows, no vignette, top-down view, subtle wood grain detail, photorealistic",
    "negative_prompt": "text, watermark, signature, shadow, vignette, light, blurry",
    "width": 1024,
    "height": 1024,
    "steps": 8,
    "sampler_name": "UniPC Trailing",
    "batch_size": 1
  }' -o /tmp/ebano-dark-raw.json
python3 -c "
import json, base64
d = json.load(open('/tmp/ebano-dark-raw.json'))
open('public/board/ebano-bordo-dark-square-original.png', 'wb').write(base64.b64decode(d['images'][0]))
"
```

Same inspection as Step 2, plus: check the two textures read as clearly distinct from each other in contrast/brightness (they'll sit on the same board) and clearly distinct from the existing `carvalho` pair (the whole point is a second, different-looking option).

- [ ] **Step 4: Generate the "noturno" background variant**

```bash
curl -s -X POST http://127.0.0.1:7860/sdapi/v1/txt2img \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a very subtle, dark, softly-blurred chess-themed backdrop, deep midnight blue-teal color palette, out-of-focus chess pieces and board, low contrast, premium elegant digital painting style, no text, no watermark",
    "negative_prompt": "text, watermark, signature, sharp focus, high contrast, bright, warm gold, busy",
    "width": 1024,
    "height": 1024,
    "steps": 8,
    "sampler_name": "UniPC Trailing",
    "batch_size": 1
  }' -o /tmp/background-noturno-raw.json
python3 -c "
import json, base64
d = json.load(open('/tmp/background-noturno-raw.json'))
open('public/menu/background-noturno-original.png', 'wb').write(base64.b64decode(d['images'][0]))
"
```

Inspect: must stay low-contrast/soft enough that white text and the menu tiles would stay legible on top (compare side-by-side against the existing `public/menu/background.webp`), and read as a distinct mood (cooler/blue) rather than a near-duplicate of the existing warm one.

- [ ] **Step 5: Downscale and compress, matching the existing pipelines**

```bash
cd public/board
sips -Z 384 ebano-bordo-light-square-original.png --out ebano-bordo-light-square-384.png
sips -Z 384 ebano-bordo-dark-square-original.png --out ebano-bordo-dark-square-384.png
cwebp -q 85 ebano-bordo-light-square-384.png -o ebano-bordo-light-square.webp
cwebp -q 85 ebano-bordo-dark-square-384.png -o ebano-bordo-dark-square.webp
rm -f ebano-bordo-light-square-original.png ebano-bordo-dark-square-original.png \
      ebano-bordo-light-square-384.png ebano-bordo-dark-square-384.png

cd ../menu
sips -Z 1200 background-noturno-original.png --out background-noturno-1200.png
cwebp -q 85 background-noturno-1200.png -o background-noturno.webp
rm -f background-noturno-original.png background-noturno-1200.png
```

- [ ] **Step 6: Sanity-check file sizes and visually inspect the final files**

Run: `ls -la public/board/ebano-bordo-*.webp public/menu/background-noturno.webp`
Expected: each well under 100KB (board-texture precedent: 5-12KB at 384px; background precedent similar order at 1200px). Read each final `.webp` to confirm it still looks right after compression (no visible banding/artifacts).

- [ ] **Step 7: Commit**

```bash
git add public/board/ebano-bordo-light-square.webp public/board/ebano-bordo-dark-square.webp public/menu/background-noturno.webp
git commit -m "feat: generate ebano-bordo board texture and noturno background (Draw Things)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01D3ouVfnGwXBGQSenGVajhg"
```

---

### Task 4: `ChessBoard.tsx` gains a `boardTheme` prop

**Files:**
- Modify: `components/ChessBoard/ChessBoard.tsx`
- Test: `components/ChessBoard/ChessBoard.test.tsx`

**Interfaces:**
- Consumes: `BOARD_THEMES` (Task 2), `BoardTheme` (Task 1).
- Produces: `ChessBoardProps.boardTheme?: BoardTheme` (default `'carvalho'`).

- [ ] **Step 1: Write the failing test**

Add to `components/ChessBoard/ChessBoard.test.tsx`, inside the `describe('ChessBoard', ...)` block:

```tsx
  it('uses the carvalho texture by default', () => {
    const { container } = render(<ChessBoard fen={START_FEN} />);
    const square = container.querySelector('button[data-square="a8"]') as HTMLButtonElement;
    expect(square.style.backgroundImage).toContain('/board/light-square.webp');
  });

  it('uses the given boardTheme texture', () => {
    const { container } = render(<ChessBoard fen={START_FEN} boardTheme="ebano-bordo" />);
    const dark = container.querySelector('button[data-square="a1"]') as HTMLButtonElement;
    expect(dark.style.backgroundImage).toContain('/board/ebano-bordo-dark-square.webp');
  });
```

(Under white orientation and the existing `isLight = (fileIdx + rankIdx) % 2 === 0` logic, `a8` is a light square and `a1` is a dark square — standard chess board coloring, verified against the actual `FILES`/`RANKS` arrays before writing this, not assumed.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run components/ChessBoard/ChessBoard.test.tsx`
Expected: FAIL — `boardTheme` prop doesn't exist, texture is always the hardcoded `carvalho` pair (second test fails).

- [ ] **Step 3: Implement**

In `components/ChessBoard/ChessBoard.tsx`:

Replace:

```ts
export interface ChessBoardProps {
  fen: string;
  orientation?: 'white' | 'black';
```

with:

```ts
export interface ChessBoardProps {
  fen: string;
  boardTheme?: BoardTheme;
  orientation?: 'white' | 'black';
```

Replace the import line:

```ts
import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js';
```

with:

```ts
import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js';
import { BOARD_THEMES } from '@/lib/settings/themes';
import type { BoardTheme } from '@/lib/settings/settings';
```

Replace the hardcoded constant:

```ts
// Texturas de madeira geradas — vendorizadas em public/board/, cache-first
// pelo service worker como qualquer outro asset estático. As classes
// bg-amber-* continuam no botão como cor de fallback: se a imagem ainda não
// estiver em cache (primeira visita offline), a cor plana aparece em vez de
// um quadrado em branco.
const SQUARE_TEXTURE = {
  light: '/board/light-square.webp',
  dark: '/board/dark-square.webp',
};
```

with (delete it entirely — the texture now comes from `BOARD_THEMES`):

```ts
```

Update the function signature — replace:

```ts
export function ChessBoard({
  fen,
  orientation = 'white',
```

with:

```ts
export function ChessBoard({
  fen,
  boardTheme = 'carvalho',
  orientation = 'white',
```

And inside the component body, right after `const board = new Chess(fen).board();`, add:

```ts
  const texture = BOARD_THEMES[boardTheme];
```

Finally, replace the two `SQUARE_TEXTURE.light`/`SQUARE_TEXTURE.dark` references in the `style={{ backgroundImage: ... }}` of the square `<button>` with `texture.light`/`texture.dark`:

```ts
                backgroundImage: `url(${isLight ? texture.light : texture.dark})`,
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run components/ChessBoard/ChessBoard.test.tsx`
Expected: PASS (all tests, including the two new ones).

- [ ] **Step 5: Run the full suite, typecheck, and lint**

Run: `npm run test && npx tsc --noEmit && npm run lint`
Expected: all clean.

- [ ] **Step 6: Commit**

```bash
git add components/ChessBoard/ChessBoard.tsx components/ChessBoard/ChessBoard.test.tsx
git commit -m "feat: make ChessBoard's texture configurable via boardTheme prop

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01D3ouVfnGwXBGQSenGVajhg"
```

---

### Task 5: `/opcoes` gets real board/background pickers

**Files:**
- Modify: `app/opcoes/page.tsx`

**Interfaces:**
- Consumes: `BOARD_THEMES`, `BACKGROUND_THEMES` (Task 2), `useSettings()` (existing, now returns the two new fields per Task 1).
- Produces: nothing new consumed elsewhere — this is a leaf page.

There is no dedicated test file for this page today (`app/opcoes/` has none); this task doesn't introduce one, consistent with the existing pattern — verification here is the manual dev-server check in Step 4.

- [ ] **Step 1: Replace the two "Brevemente" sections with real pickers**

In `app/opcoes/page.tsx`, replace the imports:

```tsx
import Link from 'next/link';
import type { Difficulty } from '@/lib/chess/difficulty';
import type { PlayerColor } from '@/lib/chess/playerColor';
import { useSettings } from '@/lib/settings/useSettings';
```

with:

```tsx
import Link from 'next/link';
import type { Difficulty } from '@/lib/chess/difficulty';
import type { PlayerColor } from '@/lib/chess/playerColor';
import type { BackgroundTheme, BoardTheme } from '@/lib/settings/settings';
import { BACKGROUND_THEMES, BOARD_THEMES } from '@/lib/settings/themes';
import { useSettings } from '@/lib/settings/useSettings';
```

Add a new `ThemePicker` component right after the existing `ComingSoonSection` function:

```tsx
function ThemePicker<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { id: T; label: string; previewImage: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-medium mb-1">{legend}</legend>
      <div className="flex gap-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            aria-pressed={value === opt.id}
            className={`flex flex-col items-center gap-1 rounded-md border p-1 ${
              value === opt.id ? 'border-emerald-600 ring-2 ring-emerald-600' : 'border-stone-300'
            }`}
          >
            <span
              className="h-16 w-16 rounded bg-cover bg-center"
              style={{ backgroundImage: `url(${opt.previewImage})` }}
            />
            <span className="text-xs">{opt.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const BOARD_THEME_OPTIONS: { id: BoardTheme; label: string; previewImage: string }[] = (
  Object.keys(BOARD_THEMES) as BoardTheme[]
).map((id) => ({ id, label: BOARD_THEMES[id].label, previewImage: BOARD_THEMES[id].light }));

const BACKGROUND_THEME_OPTIONS: { id: BackgroundTheme; label: string; previewImage: string }[] = (
  Object.keys(BACKGROUND_THEMES) as BackgroundTheme[]
).map((id) => ({ id, label: BACKGROUND_THEMES[id].label, previewImage: BACKGROUND_THEMES[id].image }));
```

Finally, replace:

```tsx
        <ComingSoonSection title="Tema do tabuleiro" />
        <ComingSoonSection title="Estilo das peças" />
        <ComingSoonSection title="Imagem de fundo" />
        <ComingSoonSection title="Idioma" />
```

with:

```tsx
        <ThemePicker
          legend="Tema do tabuleiro"
          options={BOARD_THEME_OPTIONS}
          value={settings.boardTheme}
          onChange={(boardTheme) => updateSettings({ boardTheme })}
        />
        <ComingSoonSection title="Estilo das peças" />
        <ThemePicker
          legend="Imagem de fundo"
          options={BACKGROUND_THEME_OPTIONS}
          value={settings.backgroundTheme}
          onChange={(backgroundTheme) => updateSettings({ backgroundTheme })}
        />
        <ComingSoonSection title="Idioma" />
```

- [ ] **Step 2: Run typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 3: Run the full test suite**

Run: `npm run test`
Expected: all still passing (no test targets this page, so this just confirms nothing else broke).

- [ ] **Step 4: Manual verification in the dev server**

Run: `npm run dev`, open `http://localhost:3000/opcoes`. Confirm: two new pickers show a small thumbnail + label per option; clicking "Ébano e bordo" highlights it (emerald ring) and clicking "Carvalho" again switches back; the choice survives a page reload (it's persisted via `updateSettings`). Stop the dev server when done.

- [ ] **Step 5: Commit**

```bash
git add app/opcoes/page.tsx
git commit -m "feat: add board/background theme pickers to /opcoes

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01D3ouVfnGwXBGQSenGVajhg"
```

---

### Task 6: Main menu (`app/page.tsx`) uses the chosen background theme

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `BACKGROUND_THEMES` (Task 2), `useSettings()` (Task 1's new fields).

- [ ] **Step 1: Wire up the setting**

In `app/page.tsx`, replace the import block:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Show, UserButton } from '@clerk/nextjs';
import { clearSavedGame } from '@/lib/chess/useChessGame';
import { RulesModal } from '@/components/RulesModal/RulesModal';
```

with:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Show, UserButton } from '@clerk/nextjs';
import { clearSavedGame } from '@/lib/chess/useChessGame';
import { RulesModal } from '@/components/RulesModal/RulesModal';
import { BACKGROUND_THEMES } from '@/lib/settings/themes';
import { useSettings } from '@/lib/settings/useSettings';
```

Add the hook call inside `HomePage`, replacing:

```tsx
export default function HomePage() {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <main
      className="min-h-dvh flex flex-col items-center gap-8 p-8 bg-stone-900 bg-cover bg-center"
      style={{ backgroundImage: 'url(/menu/background.webp)' }}
    >
```

with:

```tsx
export default function HomePage() {
  const [rulesOpen, setRulesOpen] = useState(false);
  const { settings } = useSettings();

  return (
    <main
      className="min-h-dvh flex flex-col items-center gap-8 p-8 bg-stone-900 bg-cover bg-center"
      style={{ backgroundImage: `url(${BACKGROUND_THEMES[settings.backgroundTheme].image})` }}
    >
```

(`useSettings()` already defaults to `DEFAULT_SETTINGS` on first render and only swaps in the real saved value inside a `useEffect` after mount — this page was already hydration-safe for `defaultDifficulty`/`defaultColor`, and the new field follows the identical path, so no new hydration risk here.)

- [ ] **Step 2: Run typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 3: Run the full test suite**

Run: `npm run test`
Expected: all still passing.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, open `http://localhost:3000/`, confirm the menu background renders (still `classico` by default). Go to `/opcoes`, switch "Imagem de fundo" to "Noturno", go back to `/`, confirm the background changed. Stop the dev server when done.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat: menu background follows the backgroundTheme setting

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01D3ouVfnGwXBGQSenGVajhg"
```

---

### Task 7: `/jogar` uses `boardTheme` and gets a background layer

**Files:**
- Modify: `app/jogar/page.tsx`

**Interfaces:**
- Consumes: `BACKGROUND_THEMES` (Task 2), `useSettings()` (Task 1's new fields), `ChessBoard`'s `boardTheme` prop (Task 4).

- [ ] **Step 1: Import the theme registry and settings hook**

In `app/jogar/page.tsx`, add to the import block (after the existing `useChessGame` import):

```tsx
import { useChessGame } from '@/lib/chess/useChessGame';
import { BACKGROUND_THEMES } from '@/lib/settings/themes';
import { useSettings } from '@/lib/settings/useSettings';
```

- [ ] **Step 2: Read settings inside `JogarContent`**

Right after the existing line:

```tsx
  const { state, legalMovesFrom, makeMove, reset } = useChessGame(true);
```

add:

```tsx
  const { settings } = useSettings();
```

- [ ] **Step 3: Add the background layer and pass `boardTheme` to `ChessBoard`**

Replace:

```tsx
  return (
    <main className="min-h-dvh flex flex-col md:flex-row items-center md:items-start justify-start md:justify-center gap-4 sm:gap-8 p-4 sm:p-8">
      <div className="flex flex-col items-center gap-4">
        <p className="font-medium">{STATUS_LABEL[state.status]}</p>
        <ChessBoard
          fen={state.fen}
          orientation={humanColor === 'w' ? 'white' : 'black'}
```

with:

```tsx
  return (
    <main className="relative min-h-dvh flex flex-col md:flex-row items-center md:items-start justify-start md:justify-center gap-4 sm:gap-8 p-4 sm:p-8">
      <div
        className="fixed inset-0 -z-10 bg-stone-900 bg-cover bg-center"
        style={{ backgroundImage: `url(${BACKGROUND_THEMES[settings.backgroundTheme].image})` }}
        aria-hidden="true"
      />
      <div className="flex flex-col items-center gap-4">
        <p className="font-medium">{STATUS_LABEL[state.status]}</p>
        <ChessBoard
          fen={state.fen}
          boardTheme={settings.boardTheme}
          orientation={humanColor === 'w' ? 'white' : 'black'}
```

(`main` gains `relative` only so the `-z-10` background layer has a positioning context to size against via `fixed inset-0` — `fixed` itself already positions relative to the viewport regardless, so this doesn't change `main`'s own layout/flow. The background `div` is `aria-hidden` and carries no content, so it can't affect the "board must fit the visible screen" sizing math at all.)

- [ ] **Step 4: Run typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 5: Run the full test suite**

Run: `npm run test`
Expected: all still passing.

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, open `http://localhost:3000/jogar?mode=local`. Confirm: a background is now visible behind the board (default `classico`), the board still fits fully on screen with no new scrollbar, and switching "Tema do tabuleiro" to "Ébano e bordo" in `/opcoes` then returning to `/jogar` shows the new board texture. Stop the dev server when done.

- [ ] **Step 7: Commit**

```bash
git add app/jogar/page.tsx
git commit -m "feat: /jogar uses boardTheme and backgroundTheme settings

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01D3ouVfnGwXBGQSenGVajhg"
```

---

## Post-plan documentation update (not a task — do this after Task 7)

Update `CLAUDE.md`'s "Menu redesenhado e configurações persistidas" section to mention the two new `Settings` fields and the `lib/settings/themes.ts` registry, and mark the "Visual design" backlog entry in `memory/project-backlog.md` as done (board+background), leaving piece-style and language as the still-open sub-projects.
