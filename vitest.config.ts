import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Espelha o "paths": { "@/*": ["./*"] } do tsconfig.json — o Next.js
    // resolve isso sozinho no build, mas o Vitest corre por cima do Vite
    // puro e precisa do alias explícito.
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
