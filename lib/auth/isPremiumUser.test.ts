import { describe, expect, it } from 'vitest';
import { isPremiumUser } from './isPremiumUser';

describe('isPremiumUser', () => {
  it('is false for a null user', () => {
    expect(isPremiumUser(null)).toBe(false);
  });

  it('is false for an undefined user', () => {
    expect(isPremiumUser(undefined)).toBe(false);
  });

  it('is false when publicMetadata is missing', () => {
    expect(isPremiumUser({})).toBe(false);
  });

  it('is false when publicMetadata.premium is missing', () => {
    expect(isPremiumUser({ publicMetadata: {} })).toBe(false);
  });

  it('is false when publicMetadata.premium is falsy or not exactly true', () => {
    expect(isPremiumUser({ publicMetadata: { premium: false } })).toBe(false);
    expect(isPremiumUser({ publicMetadata: { premium: 'true' } })).toBe(false);
  });

  it('is true when publicMetadata.premium is exactly true', () => {
    expect(isPremiumUser({ publicMetadata: { premium: true } })).toBe(true);
  });
});
