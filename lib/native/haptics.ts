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
