import '@testing-library/jest-dom/vitest';

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
