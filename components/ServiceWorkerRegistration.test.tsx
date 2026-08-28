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
