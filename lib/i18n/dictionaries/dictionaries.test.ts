// lib/i18n/dictionaries/dictionaries.test.ts
import { describe, expect, it } from 'vitest';
import { DICTIONARIES } from './index';

function leafPaths(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix];
  if (typeof obj === 'function') return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
    typeof value === 'function' ? [`${prefix}${key}`] : leafPaths(value, `${prefix}${key}.`)
  );
}

describe('DICTIONARIES', () => {
  it('pt e en têm exatamente as mesmas chaves', () => {
    expect(leafPaths(DICTIONARIES.pt).sort()).toEqual(leafPaths(DICTIONARIES.en).sort());
  });

  it('nenhum valor de string está vazio', () => {
    function allStrings(obj: unknown): string[] {
      if (typeof obj === 'string') return [obj];
      if (typeof obj === 'function' || obj === null || typeof obj !== 'object') return [];
      if (Array.isArray(obj)) return obj.flatMap(allStrings);
      return Object.values(obj).flatMap(allStrings);
    }
    for (const locale of ['pt', 'en'] as const) {
      for (const value of allStrings(DICTIONARIES[locale])) {
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it('portuguese/english (nomes de idioma) são sempre os mesmos nos dois dicionários', () => {
    expect(DICTIONARIES.pt.opcoes.portuguese).toBe(DICTIONARIES.en.opcoes.portuguese);
    expect(DICTIONARIES.pt.opcoes.english).toBe(DICTIONARIES.en.opcoes.english);
  });
});
