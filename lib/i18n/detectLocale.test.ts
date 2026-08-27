import { describe, expect, it } from 'vitest';
import { detectLocale } from './detectLocale';

describe('detectLocale', () => {
  it('deteta português a partir de "pt"', () => {
    expect(detectLocale('pt')).toBe('pt');
  });

  it('deteta português a partir de "pt-PT"', () => {
    expect(detectLocale('pt-PT')).toBe('pt');
  });

  it('deteta português a partir de "pt-BR"', () => {
    expect(detectLocale('pt-BR')).toBe('pt');
  });

  it('é insensível a maiúsculas/minúsculas', () => {
    expect(detectLocale('PT-pt')).toBe('pt');
  });

  it('cai em inglês para qualquer outro idioma', () => {
    expect(detectLocale('en-US')).toBe('en');
    expect(detectLocale('fr')).toBe('en');
    expect(detectLocale('es-ES')).toBe('en');
  });

  it('cai em inglês quando não há deteção nenhuma (undefined)', () => {
    expect(detectLocale(undefined)).toBe('en');
  });

  it('cai em inglês para uma string vazia', () => {
    expect(detectLocale('')).toBe('en');
  });
});
