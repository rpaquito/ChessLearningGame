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
