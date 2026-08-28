# Native iOS App (Capacitor) + "Chess Sensei" Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a signed, runnable iOS build of the existing chess app by wrapping its static export in Capacitor, and rebrand the whole product (web PWA + native shell) from "Xadrez" to "Chess Sensei" with a new icon.

**Architecture:** `next.config.ts` gains a `BUILD_TARGET=capacitor` env-gated `output: 'export'` so the Vercel build is untouched; Capacitor wraps that static export (`out/`) in a native iOS shell living in a committed `ios/` directory; a small `lib/native/haptics.ts` wrapper (no-op on web) adds haptic feedback on move/capture/check; the service worker is skipped inside the native shell since the bundle already ships on disk.

**Tech Stack:** Next.js 16 (App Router, static export), Capacitor (`@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/haptics`), Xcode/CocoaPods, existing chess.js/Vitest/Testing Library stack (untouched).

**Spec:** `docs/superpowers/specs/2026-08-28-native-ios-app-capacitor-design.md`

## Global Constraints

- The default `npm run build` (what Vercel runs) MUST stay byte-for-byte behaviorally identical — `output: 'export'` only activates under `BUILD_TARGET=capacitor`.
- No backend/API routes anywhere in the app (unaffected by this work) — no push notifications, since there is nothing to send them from.
- Android and a fully-native rewrite ("Approach C") are explicitly out of scope for this plan — Android later in this repo via the same Capacitor approach; Approach C, if ever justified, only in a separate repository.
- `localStorage` persistence stays as-is — no migration to `@capacitor/preferences` in this plan.
- No CI/automated device or simulator testing in this plan — verification of native behavior is manual.
- Bundle ID is fixed: `pt.rpaquito.chesssensei` (practically permanent once submitted to the App Store — do not change casually).
- App name is "Chess Sensei" everywhere — web manifest/metadata and the native shell both, not just one.
- Maskable icon artwork must keep its content inside a centered circle of 40% radius (80% diameter) of the icon, per the PWA maskable-icon "safe zone" rule.
- This plan produces a signed, runnable build only — the App Store Connect listing, Apple Developer account, and actual submission are the user's own manual steps (see spec's "Assinatura e distribuição" section).

---

### Task 1: Conditional static export build target

**Files:**
- Modify: `next.config.ts`
- Modify: `package.json`
- Test: `next.config.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `next.config.ts`'s default export now has `output: 'export'` when `process.env.BUILD_TARGET === 'capacitor'`, and is unset otherwise. `npm run build:capacitor` — later tasks (2, 8) invoke this script by name.

- [ ] **Step 1: Write the failing test**

```ts
// next.config.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('next.config.ts — Capacitor export target', () => {
  const originalEnv = process.env.BUILD_TARGET;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.BUILD_TARGET;
    } else {
      process.env.BUILD_TARGET = originalEnv;
    }
    vi.resetModules();
  });

  it('does not set output when BUILD_TARGET is unset (the Vercel/default build)', async () => {
    delete process.env.BUILD_TARGET;
    vi.resetModules();
    const { default: config } = await import('./next.config');
    expect(config.output).toBeUndefined();
  });

  it('sets output to "export" when BUILD_TARGET=capacitor', async () => {
    process.env.BUILD_TARGET = 'capacitor';
    vi.resetModules();
    const { default: config } = await import('./next.config');
    expect(config.output).toBe('export');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run next.config.test.ts`
Expected: FAIL on the second case — `next.config.ts` doesn't read `BUILD_TARGET` yet, so `config.output` is `undefined` in both cases.

- [ ] **Step 3: Implement the conditional config**

```ts
// next.config.ts
import type { NextConfig } from 'next';

const isCapacitorBuild = process.env.BUILD_TARGET === 'capacitor';

const nextConfig: NextConfig = {
  ...(isCapacitorBuild ? { output: 'export' } : {}),
};

export default nextConfig;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run next.config.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Add the `build:capacitor` script**

In `package.json`, add one entry to the existing `"scripts"` object (keep every existing entry untouched):

```json
"build:capacitor": "BUILD_TARGET=capacitor next build",
```

- [ ] **Step 6: Verify the real build still works both ways**

Run: `npm run build` (must succeed exactly as before — no `output: 'export'` involved)
Run: `npm run build:capacitor` (must succeed and produce an `out/` directory — already gitignored, see `.gitignore`'s existing `/out/` entry)
Expected: both commands exit 0; `ls out/index.html` exists after the second one.

- [ ] **Step 7: Commit**

```bash
git add next.config.ts next.config.test.ts package.json
git commit -m "feat: add Capacitor static-export build target

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0168kHc5bxsmspiQU3bUmgz3"
```

---

### Task 2: Capacitor project + iOS platform

**Files:**
- Create: `capacitor.config.ts`
- Modify: `package.json` (two more scripts)
- Modify: `.gitignore`
- Create (via CLI, not by hand): `ios/` — the full Xcode project

**Interfaces:**
- Consumes: `npm run build:capacitor` from Task 1 (must exist and work before `npx cap add ios` runs, since Capacitor copies `webDir` into the new native project at creation time).
- Produces: a committed `ios/` Xcode project; `npm run cap:sync:ios` / `npm run cap:open:ios` — Task 7 depends on `ios/App/App/Assets.xcassets/AppIcon.appiconset/` existing, which this task creates.

- [ ] **Step 1: Install the Capacitor dependencies**

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/haptics
```

- [ ] **Step 2: Create `capacitor.config.ts`**

```ts
// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'pt.rpaquito.chesssensei',
  appName: 'Chess Sensei',
  webDir: 'out',
};

export default config;
```

- [ ] **Step 3: Add the two remaining npm scripts**

In `package.json`'s `"scripts"` object, add:

```json
"cap:sync:ios": "npx cap sync ios",
"cap:open:ios": "npx cap open ios",
```

- [ ] **Step 4: Build the static export**

```bash
npm run build:capacitor
```

Expected: exits 0, `out/` exists and contains `index.html`.

- [ ] **Step 5: Add the iOS platform**

```bash
npx cap add ios
```

Expected: creates `ios/App/App.xcworkspace`, `ios/App/App/public` (a copy of `out/`), and `ios/App/App/Assets.xcassets/AppIcon.appiconset/` (Task 7 needs this path).

- [ ] **Step 6: Extend `.gitignore` for iOS build artifacts**

Add a new section at the end of `.gitignore` (everything else in the file stays untouched):

```gitignore

# Capacitor iOS — generated/build artifacts, never hand-edited
ios/App/App/public
ios/App/Pods
ios/App/build
ios/App/DerivedData
ios/**/xcuserdata/
ios/**/*.xcuserstate
```

(`ios/App/App/public` is a copy of `out/` — regenerated by `cap sync`, not meant to be tracked twice. `Podfile.lock`, if CocoaPods creates one, stays tracked for reproducible native builds — only `Pods/` itself is ignored.)

- [ ] **Step 7: Sync and install native dependencies**

```bash
npx cap sync ios
```

Expected: exits 0; installs CocoaPods dependencies (`ios/App/Podfile.lock` is created/updated).

- [ ] **Step 8: Verify the native project actually compiles**

```bash
xcodebuild -workspace ios/App/App.xcworkspace -scheme App -sdk iphonesimulator -configuration Debug build
```

Expected: `** BUILD SUCCEEDED **`. This requires Xcode and its command-line tools to be installed — if `xcodebuild` isn't found, install Xcode from the App Store first (this is the same Xcode the manual verification in Task 8 will also need).

- [ ] **Step 9: Commit**

```bash
git add capacitor.config.ts package.json .gitignore ios/
git commit -m "feat: add Capacitor iOS project

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0168kHc5bxsmspiQU3bUmgz3"
```

---

### Task 3: Haptics wrapper module

**Files:**
- Create: `lib/native/haptics.ts`
- Test: `lib/native/haptics.test.ts`

**Interfaces:**
- Consumes: `@capacitor/core`'s `Capacitor.isNativePlatform()`, `@capacitor/haptics`'s `Haptics.impact()`/`Haptics.notification()` (installed in Task 2).
- Produces: `hapticMove(): Promise<void>`, `hapticCapture(): Promise<void>`, `hapticCheck(): Promise<void>` — Task 4 imports all three by name from `@/lib/native/haptics`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/native/haptics.test.ts
import { describe, expect, it, vi } from 'vitest';
import { Haptics } from '@capacitor/haptics';
import { hapticCapture, hapticCheck, hapticMove } from './haptics';

vi.mock('@capacitor/haptics', () => ({
  Haptics: { impact: vi.fn(), notification: vi.fn() },
  ImpactStyle: { Light: 'LIGHT', Medium: 'MEDIUM' },
  NotificationType: { Warning: 'WARNING' },
}));

// jsdom has no native Capacitor bridge, so Capacitor.isNativePlatform()
// is false here — this covers the real behavior of every test/SSR/Vercel
// context; the actual native call is only verifiable on-device (see spec).
describe('haptics (no-op branch — every environment except the native shell)', () => {
  it('hapticMove resolves without touching the native bridge', async () => {
    await expect(hapticMove()).resolves.toBeUndefined();
    expect(Haptics.impact).not.toHaveBeenCalled();
  });

  it('hapticCapture resolves without touching the native bridge', async () => {
    await expect(hapticCapture()).resolves.toBeUndefined();
    expect(Haptics.impact).not.toHaveBeenCalled();
  });

  it('hapticCheck resolves without touching the native bridge', async () => {
    await expect(hapticCheck()).resolves.toBeUndefined();
    expect(Haptics.notification).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/native/haptics.test.ts`
Expected: FAIL with "Failed to resolve import './haptics'" (the module doesn't exist yet).

- [ ] **Step 3: Implement the wrapper**

```ts
// lib/native/haptics.ts
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export async function hapticMove(): Promise<void> {
  if (!isNative()) return;
  await Haptics.impact({ style: ImpactStyle.Light });
}

export async function hapticCapture(): Promise<void> {
  if (!isNative()) return;
  await Haptics.impact({ style: ImpactStyle.Medium });
}

export async function hapticCheck(): Promise<void> {
  if (!isNative()) return;
  await Haptics.notification({ type: NotificationType.Warning });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/native/haptics.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/native/haptics.ts lib/native/haptics.test.ts
git commit -m "feat: add haptics wrapper (no-op on web)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0168kHc5bxsmspiQU3bUmgz3"
```

---

### Task 4: Wire haptics into `/jogar`

**Files:**
- Modify: `app/jogar/page.tsx`

**Interfaces:**
- Consumes: `hapticMove`, `hapticCapture`, `hapticCheck` from `@/lib/native/haptics` (Task 3).
- Produces: nothing new consumed by later tasks.

**Scope decision (deliberate, document in Task 8):** haptics fire only on the human player's own move (the click handler below) and on the check-toast transition — **not** on the AI's automatic move in the separate `useEffect` around line 188, and not on `handleRequestSuggestion` (a suggestion is never a played move). This keeps the feedback tied to the player's own actions, not every board change.

- [ ] **Step 1: Import the haptics functions**

Add to the import block near the top of `app/jogar/page.tsx` (alongside the other `@/lib/chess/*` imports):

```ts
import { hapticCapture, hapticCheck, hapticMove } from '@/lib/native/haptics';
```

- [ ] **Step 2: Fire `hapticCheck()` alongside the existing check toast**

In the `useEffect` that watches `state.status` (currently ~line 86-103), change:

```ts
    if (state.status === 'check') {
      showToast(t.jogar.checkToast, 'check');
    } else if (
```

to:

```ts
    if (state.status === 'check') {
      showToast(t.jogar.checkToast, 'check');
      hapticCheck();
    } else if (
```

- [ ] **Step 3: Fire `hapticMove()`/`hapticCapture()` after a played move**

In `handleSquareClick`, right after `setSelectedSquare(null);` (currently line 154) and before the existing `if (moved && previewMove && mode === 'ai' && ...)` engine-evaluation block, insert a new, independent block:

```ts
        const moved = makeMove(selectedSquare, square, 'q');
        setSelectedSquare(null);

        if (moved && previewMove) {
          if (previewMove.isCapture()) {
            hapticCapture();
          } else {
            hapticMove();
          }
        }

        if (moved && previewMove && mode === 'ai' && learningEnabled && engineRef.current) {
```

(`previewMove` is the `chess.js` `Move` object already computed a few lines above via `preview.move(...)` — `isCapture()` is the same method `lib/chess/inferMove.ts` already relies on, so no new chess.js API surface is introduced.)

- [ ] **Step 4: Verify nothing broke**

Run: `npm run test` — expect all tests green (haptics no-ops safely in jsdom, so this file's behavior is unchanged under test).
Run: `npx tsc --noEmit` — expect clean.
Run: `npm run lint` — expect clean.

- [ ] **Step 5: Manual live check (web)**

```bash
npm run dev
```

Open `/jogar` in a browser, play a few moves including at least one capture and one check. Confirm: no console errors, the existing check toast still appears, gameplay is otherwise identical (haptics no-op on the web, so nothing should visibly change).

- [ ] **Step 6: Commit**

```bash
git add app/jogar/page.tsx
git commit -m "feat: fire haptic feedback on move/capture/check in /jogar

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0168kHc5bxsmspiQU3bUmgz3"
```

---

### Task 5: Skip the service worker inside the native shell

**Files:**
- Modify: `components/ServiceWorkerRegistration.tsx`
- Test: `components/ServiceWorkerRegistration.test.tsx`

**Interfaces:**
- Consumes: `Capacitor.isNativePlatform()` from `@capacitor/core` (installed in Task 2).
- Produces: nothing new consumed by later tasks.

- [ ] **Step 1: Write the failing test**

```tsx
// components/ServiceWorkerRegistration.test.tsx
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceWorkerRegistration } from './ServiceWorkerRegistration';

const { isNativePlatformMock } = vi.hoisted(() => ({
  isNativePlatformMock: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: isNativePlatformMock },
}));

describe('ServiceWorkerRegistration — native guard', () => {
  beforeEach(() => {
    isNativePlatformMock.mockReset();
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: vi.fn().mockResolvedValue({}),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
  });

  it('does not register the service worker inside the native Capacitor shell', () => {
    isNativePlatformMock.mockReturnValue(true);
    render(<ServiceWorkerRegistration />);
    expect(navigator.serviceWorker.register).not.toHaveBeenCalled();
  });

  it('still registers the service worker on the web', () => {
    isNativePlatformMock.mockReturnValue(false);
    render(<ServiceWorkerRegistration />);
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/ServiceWorkerRegistration.test.tsx`
Expected: FAIL on the first case — the component doesn't check `isNativePlatform()` yet, so it registers the service worker regardless.

- [ ] **Step 3: Add the native guard**

In `components/ServiceWorkerRegistration.tsx`, add the import:

```ts
import { Capacitor } from '@capacitor/core';
```

And change the top of the `useEffect` from:

```ts
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
```

to:

```ts
  useEffect(() => {
    // Inside the native Capacitor shell, the bundle already ships on disk
    // (webDir: 'out', see capacitor.config.ts) — there's nothing for the
    // service worker to cache, and no reason to risk one behaving oddly
    // inside a WKWebView.
    if (Capacitor.isNativePlatform()) return;
    if (!('serviceWorker' in navigator)) return;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/ServiceWorkerRegistration.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full suite**

Run: `npm run test`
Expected: all tests green (no other file touches this component).

- [ ] **Step 6: Commit**

```bash
git add components/ServiceWorkerRegistration.tsx components/ServiceWorkerRegistration.test.tsx
git commit -m "feat: skip service worker registration inside the native shell

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0168kHc5bxsmspiQU3bUmgz3"
```

---

### Task 6: Rebrand text — "Chess Sensei" everywhere

**Files:**
- Modify: `app/layout.tsx`
- Modify: `public/manifest.json`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new consumed by later tasks (Task 7 touches the icon *files* these two reference, but not this task's text).

- [ ] **Step 1: Rename in `app/layout.tsx`**

Change:

```ts
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
```

to:

```ts
export const metadata: Metadata = {
  title: 'Chess Sensei — aprenda jogando',
  description:
    'Jogue xadrez contra o computador ou com um amigo, com dicas para aprender a jogar melhor.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Chess Sensei',
  },
```

(`description` is untouched — it describes what the app does, not its name.)

- [ ] **Step 2: Rename and fix stale colors in `public/manifest.json`**

Change:

```json
{
  "name": "Xadrez — aprenda jogando",
  "short_name": "Xadrez",
  "description": "Jogue xadrez contra o computador ou com um amigo, com dicas para aprender a jogar melhor.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#fafaf9",
  "theme_color": "#b45309",
  "lang": "pt-PT",
```

to:

```json
{
  "name": "Chess Sensei — aprenda jogando",
  "short_name": "Chess Sensei",
  "description": "Jogue xadrez contra o computador ou com um amigo, com dicas para aprender a jogar melhor.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#1A0B33",
  "theme_color": "#1A0B33",
  "lang": "pt-PT",
```

(`lang: "pt-PT"` stays fixed — unrelated to the app's display name, see `CLAUDE.md`'s existing note on why the manifest's language can't be dynamic. `background_color`/`theme_color` were still the pre-"anime"-redesign amber/wood tones; `#1A0B33` matches `viewport.themeColor` in `app/layout.tsx`, already correct.)

- [ ] **Step 3: Verify the rename is complete and the manifest is still valid JSON**

```bash
grep -rn "Xadrez" app/layout.tsx public/manifest.json
```

Expected: no output (both files fully renamed).

```bash
node -e "JSON.parse(require('fs').readFileSync('public/manifest.json', 'utf8')); console.log('valid JSON')"
```

Expected: prints `valid JSON` (no parse error).

- [ ] **Step 4: Run the full suite**

Run: `npm run test && npx tsc --noEmit && npm run lint`
Expected: all clean (no test asserts on these exact strings today).

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx public/manifest.json
git commit -m "feat: rename app to Chess Sensei, fix stale manifest theme colors

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0168kHc5bxsmspiQU3bUmgz3"
```

---

### Task 7: Produce and wire the new icon

**Files:**
- Create/overwrite: `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/icon-512-maskable.png`, `public/icons/apple-touch-icon.png`
- Overwrite: the PNG(s) referenced by `ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json` (created in Task 2)

**Interfaces:**
- Consumes: `ios/App/App/Assets.xcassets/AppIcon.appiconset/` (Task 2), the local Draw Things HTTP API at `http://127.0.0.1:7860` (see `CLAUDE.md`'s "Geração de imagens" section).
- Produces: nothing new consumed by later tasks.

The brainstorming session locked the concept (ivory pawn silhouette, gold headband with a flowing ribbon, wispy beard, glowing cyan aura, dark `#1A0B33` background) via mockups and two real Draw Things renders. The approved render has rounded corners baked into the image itself (a "card" look) — production art needs the composition to fill the full square edge-to-edge instead, since both iOS and the PWA's `maskable` icon apply their own mask.

- [ ] **Step 1: Confirm Draw Things is reachable**

```bash
curl -s --max-time 5 http://127.0.0.1:7860/ | head -c 200
```

Expected: a JSON config blob (not a connection error). If it fails, open the Draw Things app and enable the HTTP API Server (Definições → Advanced) first.

- [ ] **Step 2: Generate the full-bleed production render**

```bash
curl -s -m 480 -X POST http://127.0.0.1:7860/sdapi/v1/txt2img \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "anime style digital painting app icon, a wise ivory chess pawn character with a golden headband tied in a knot with flowing ribbon tails, a wispy pale beard hanging from its chin, calm closed eyes, a soft glowing cyan aura radiating behind it, centered composition, full-bleed square composition filling the entire frame corner to corner with a solid deep dark indigo purple background, no rounded corners, no border, no frame, no vignette, bold clean flat shapes, high contrast silhouette, stylized poster illustration, no text, no watermark, no signature, no letters",
    "negative_prompt": "photorealistic, photo, camera, 3d render, realistic, muted colors, sepia, text, watermark, signature, blurry, low quality, western comic style, cluttered background, multiple characters, human face, realistic anatomy, rounded corners, border, frame, vignette, card, sticker",
    "width": 1024,
    "height": 1024,
    "steps": 8,
    "sampler_name": "UniPC Trailing",
    "batch_size": 2
  }' -o /tmp/icon_production_response.json
```

- [ ] **Step 3: Decode and inspect the candidates**

```bash
python3 -c "
import json, base64
with open('/tmp/icon_production_response.json') as f:
    data = json.load(f)
for i, b64 in enumerate(data['images']):
    with open(f'/tmp/icon_production_{i}.png', 'wb') as out:
        out.write(base64.b64decode(b64))
    print(f'saved /tmp/icon_production_{i}.png')
"
```

Read both `/tmp/icon_production_0.png` and `/tmp/icon_production_1.png` (with the `Read` tool, or open them) and pick the one that best matches the locked concept **and** genuinely fills the square edge-to-edge with no baked-in rounding. If neither qualifies, adjust the prompt's emphasis on "full-bleed"/"no rounded corners" and regenerate — don't proceed with a candidate that still has a rounded-card look, since every derived size below inherits that flaw.

- [ ] **Step 4: Produce the web icon sizes**

Using the chosen file (call it `/tmp/icon_final.png` below — copy the winning candidate to that name first):

```bash
cp /tmp/icon_production_0.png /tmp/icon_final.png   # adjust index to whichever was chosen

sips -z 192 192 /tmp/icon_final.png --out public/icons/icon-192.png
sips -z 512 512 /tmp/icon_final.png --out public/icons/icon-512.png
sips -z 180 180 /tmp/icon_final.png --out public/icons/apple-touch-icon.png
```

- [ ] **Step 5: Produce the maskable icon with a proper safe zone**

The maskable icon needs padding: content must stay inside a centered circle of 40% radius (80% diameter) of the icon, so the OS's own circular/rounded mask never crops the headband or beard.

```bash
python3 -c "
from PIL import Image

BG = (26, 11, 51)  # #1A0B33, the app's 'ink' token
CANVAS = 512
SAFE_DIAMETER = int(CANVAS * 0.8)  # 80% diameter = 40% radius safe zone

src = Image.open('/tmp/icon_final.png').convert('RGBA')
src = src.resize((SAFE_DIAMETER, SAFE_DIAMETER), Image.LANCZOS)

canvas = Image.new('RGBA', (CANVAS, CANVAS), BG + (255,))
offset = ((CANVAS - SAFE_DIAMETER) // 2, (CANVAS - SAFE_DIAMETER) // 2)
canvas.paste(src, offset, src)
canvas.convert('RGB').save('public/icons/icon-512-maskable.png')
print('saved public/icons/icon-512-maskable.png')
"
```

- [ ] **Step 6: Visually verify the maskable icon against a circular mask**

```bash
python3 -c "
from PIL import Image, ImageDraw

img = Image.open('public/icons/icon-512-maskable.png').convert('RGBA')
overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
draw = ImageDraw.Draw(overlay)
draw.ellipse([0, 0, img.width, img.height], outline=(255, 0, 0, 255), width=6)
preview = Image.alpha_composite(img, overlay)
preview.save('/tmp/maskable_circle_preview.png')
"
```

Read `/tmp/maskable_circle_preview.png` — confirm the pawn, beard, and headband all stay inside the red circle. If anything crosses it, increase the padding (lower `SAFE_DIAMETER`'s percentage in Step 5) and regenerate.

- [ ] **Step 7: Wire the iOS AppIcon**

```bash
cat ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json
```

Note the exact PNG filename(s) it references (Capacitor's default iOS template uses a single 1024×1024 "universal" icon in current Xcode versions — do not edit `Contents.json` itself, just overwrite the image file(s) it already points to):

```bash
sips -z 1024 1024 /tmp/icon_final.png --out ios/App/App/Assets.xcassets/AppIcon.appiconset/<filename-from-Contents.json>
```

If `Contents.json` instead lists several images at different sizes (an older multi-size iconset template rather than the single 1024×1024 universal one), overwrite every referenced file, resizing to each entry's own `size` × `scale` in pixels (e.g. `"size": "60x60"`, `"scale": "2x"` → 120×120) — via `sips -z <px> <px> /tmp/icon_final.png --out <that entry's filename>` — so every resolution matches, not just the largest.

- [ ] **Step 8: Verify file integrity**

```bash
file public/icons/icon-192.png public/icons/icon-512.png public/icons/icon-512-maskable.png public/icons/apple-touch-icon.png
```

Expected: each line reports the correct dimensions (192x192, 512x512, 512x512, 180x180) and PNG format.

- [ ] **Step 9: Re-sync and re-verify the iOS build**

```bash
npx cap sync ios
xcodebuild -workspace ios/App/App.xcworkspace -scheme App -sdk iphonesimulator -configuration Debug build
```

Expected: `** BUILD SUCCEEDED **`.

- [ ] **Step 10: Commit**

```bash
git add public/icons/ ios/App/App/Assets.xcassets/AppIcon.appiconset/
git commit -m "feat: add Chess Sensei icon (web + iOS)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0168kHc5bxsmspiQU3bUmgz3"
```

---

### Task 8: Full verification + document in CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: everything from Tasks 1–7.
- Produces: nothing (final task).

- [ ] **Step 1: Run the full automated verification**

```bash
npm run test
npm run lint
npx tsc --noEmit
npm run build
npm run build:capacitor
npm run cap:sync:ios
```

Expected: every command exits 0. `npm run test` should report more than the pre-existing 267 tests (the new `next.config.test.ts`, `lib/native/haptics.test.ts`, and `components/ServiceWorkerRegistration.test.tsx` add to that count).

- [ ] **Step 2: Manual iOS verification (per spec's "Testes" section)**

```bash
npm run cap:open:ios
```

In Xcode, run the app on an iPhone simulator and confirm:
- the app launches and shows the main menu with the new "Chess Sensei" branding and icon;
- a full game against Stockfish plays start to finish;
- force-quitting the simulator app and relaunching it with the simulator's network disabled (Simulator → Features → Toggle "Network Link Conditioner" or airplane-mode equivalent) still loads and plays a game — confirms the offline-by-default bundling;
- on a physical device (the simulator does not vibrate), a move/capture/check each produce a distinct haptic pulse.

- [ ] **Step 3: Document the feature in `CLAUDE.md`**

Add a new section (placed after the existing "Múltiplos idiomas" section and before "Service worker / PWA", matching the file's chronological-ish ordering of feature write-ups) covering:
- the `BUILD_TARGET=capacitor` conditional in `next.config.ts` and why the Vercel build stays untouched;
- the `lib/native/haptics.ts` wrapper, its no-op-on-web design, and the deliberate scope decision that it only fires on the human player's own move + the check toast, not the AI's automatic move;
- the service worker's native-shell guard in `ServiceWorkerRegistration.tsx`;
- the rebrand to "Chess Sensei" across `app/layout.tsx` and `public/manifest.json`, including the incidental fix of the `background_color`/`theme_color` values that had been stuck on the pre-"anime"-redesign amber palette;
- the new icon's concept and production pipeline (Draw Things → `sips`/Pillow, the maskable "safe zone" math);
- the bundle ID (`pt.rpaquito.chesssensei`) and a note that it's effectively permanent post-submission;
- that App Store Connect signing/listing/submission are manual, user-driven steps outside this codebase's scope;
- the "`out/` goes stale after a `git pull`" pitfall: `cap sync` only reflects whatever is already in `out/` at the moment it runs, so `npm run build:capacitor` must run before `npm run cap:sync:ios` every time, or Xcode opens against old content.

Write this section with the same density and concrete detail as the file's existing sections (e.g., "Toasts e modal de fim de jogo", "Múltiplos idiomas") — file paths, exact constants, and the "why", not just a feature list.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document the native iOS app and Chess Sensei rebrand in CLAUDE.md

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0168kHc5bxsmspiQU3bUmgz3"
```
