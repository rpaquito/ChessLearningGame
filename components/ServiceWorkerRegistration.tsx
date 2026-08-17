'use client';

import { useEffect } from 'react';

/**
 * Registers the offline-caching service worker (public/sw.js) once the app
 * has mounted in the browser. Renders nothing — this is a side-effect-only
 * component, meant to be dropped once into the root layout.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration can fail (unsupported browser, private mode
      // restrictions, etc.) — the app works fine online without it, so we
      // simply skip offline support rather than surface an error.
    });
  }, []);

  return null;
}
