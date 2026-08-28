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
