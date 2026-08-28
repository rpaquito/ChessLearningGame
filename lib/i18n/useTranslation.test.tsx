// lib/i18n/useTranslation.test.tsx
import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTranslation } from './useTranslation';
import { useSettings, __resetSettingsCacheForTests } from '@/lib/settings/useSettings';

describe('useTranslation', () => {
  beforeEach(() => {
    window.localStorage.clear();
    __resetSettingsCacheForTests();
  });

  it('devolve o dicionário pt por omissão', () => {
    window.localStorage.setItem('xadrez-settings', JSON.stringify({ language: 'pt' }));
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t.menu.title).toBe('CHESS SENSEI');
    expect(result.current.locale).toBe('pt');
  });

  it('acompanha updateSettings({ language: "en" })', () => {
    window.localStorage.setItem('xadrez-settings', JSON.stringify({ language: 'pt' }));
    function Wrapper() {
      const translation = useTranslation();
      const { updateSettings } = useSettings();
      return { translation, updateSettings };
    }
    const { result } = renderHook(() => Wrapper());
    expect(result.current.translation.t.menu.title).toBe('CHESS SENSEI');

    act(() => {
      result.current.updateSettings({ language: 'en' });
    });

    const { result: result2 } = renderHook(() => useTranslation());
    expect(result2.current.t.menu.title).toBe('CHESS SENSEI');
    expect(result2.current.locale).toBe('en');
  });
});
