import { describe, expect, it, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { LanguageSync } from './LanguageSync';
import { __resetSettingsCacheForTests } from '@/lib/settings/useSettings';

describe('LanguageSync', () => {
  beforeEach(() => {
    window.localStorage.clear();
    __resetSettingsCacheForTests();
    document.documentElement.lang = '';
  });

  it('define document.documentElement.lang para "pt-PT" quando o idioma é pt', () => {
    window.localStorage.setItem('xadrez-settings', JSON.stringify({ language: 'pt' }));
    render(<LanguageSync />);
    expect(document.documentElement.lang).toBe('pt-PT');
  });

  it('define document.documentElement.lang para "en" quando o idioma é en', () => {
    window.localStorage.setItem('xadrez-settings', JSON.stringify({ language: 'en' }));
    render(<LanguageSync />);
    expect(document.documentElement.lang).toBe('en');
  });

  it('não renderiza nada visível', () => {
    window.localStorage.setItem('xadrez-settings', JSON.stringify({ language: 'pt' }));
    const { container } = render(<LanguageSync />);
    expect(container).toBeEmptyDOMElement();
  });
});
