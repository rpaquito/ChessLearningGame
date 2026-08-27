import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { __resetSettingsCacheForTests } from '@/lib/settings/useSettings';

// @testing-library/react only auto-registers its afterEach(cleanup) hook in
// a Jest environment; under Vitest it must be wired up explicitly, or DOM
// from one test in a file leaks into the next.
afterEach(cleanup);

// Node 22+ ships an experimental global `localStorage`/`sessionStorage` that,
// without --localstorage-file, resolves to `undefined`. Vitest's jsdom
// environment only overrides globals that are not already own/inherited
// properties of `globalThis`, so this native stub shadows jsdom's real
// Storage implementation and `window.localStorage` ends up `undefined`.
// Restore the real jsdom-backed storage explicitly so tests can use it.
// (Read `jsdomGlobal.window.localStorage` directly rather than probing
// `window.localStorage` first — probing would trigger Node's own
// getter and print its ExperimentalWarning.)
const jsdomGlobal = (globalThis as unknown as { jsdom?: { window: Window } }).jsdom;
if (typeof window !== 'undefined' && jsdomGlobal) {
  Object.defineProperty(window, 'localStorage', {
    value: jsdomGlobal.window.localStorage,
    configurable: true,
  });
  Object.defineProperty(window, 'sessionStorage', {
    value: jsdomGlobal.window.sessionStorage,
    configurable: true,
  });
}

// Set Portuguese as the default language for all tests to match the app's
// default locale. Each test can override this by setting localStorage before
// rendering. This ensures components using useTranslation() render with PT
// dictionary by default, making tests match the hardcoded PT text they verify.
beforeEach(() => {
  window.localStorage.clear();
  __resetSettingsCacheForTests();
  window.localStorage.setItem('xadrez-settings', JSON.stringify({ language: 'pt' }));
});
