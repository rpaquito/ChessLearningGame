'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from './settings';

export interface UseSettingsResult {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
}

/**
 * Store módulo-singleton por trás de useSettings — substitui o antigo
 * useState+useEffect+ref (ver histórico em CLAUDE.md) por
 * useSyncExternalStore, o mecanismo idiomático do React para "sincronizar
 * um valor externo (localStorage) para dentro do React". Isto resolve
 * duas coisas de uma vez:
 *
 * 1. Hidratação seguro: /configurar e /opcoes são páginas pré-renderizadas
 *    (ao contrário de /jogar) — ler logo o valor real do localStorage
 *    produziria HTML de servidor e de cliente diferentes sempre que já
 *    existissem definições guardadas. getServerSnapshot devolve sempre
 *    DEFAULT_SETTINGS (igual em servidor e cliente); só depois da
 *    hidratação o React troca para o valor real via getSnapshot.
 * 2. Nenhuma atualização perdida: como `cache` é um valor de módulo (não
 *    por instância do hook), duas chamadas a updateSettings seguidas —
 *    mesmo antes de um novo render — leem sempre o `cache` mais recente,
 *    sem precisar de um ref à parte para evitar fundir contra um
 *    `settings` desatualizado. Bónus: várias instâncias de useSettings em
 *    simultâneo (ex.: duas páginas) ficam automaticamente consistentes
 *    entre si, o que o padrão antigo não garantia.
 */
let cache: Settings | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): Settings {
  if (cache === null) cache = loadSettings();
  return cache;
}

function getServerSnapshot(): Settings {
  return DEFAULT_SETTINGS;
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function setCache(next: Settings): void {
  cache = next;
  listeners.forEach((listener) => listener());
}

/**
 * Só para os testes: o `cache` é de módulo, por isso sobrevive entre `it`s
 * do mesmo ficheiro de teste (os módulos ES não são reimportados a cada
 * teste) — sem isto, o primeiro teste que montasse o hook "fixava" o
 * cache para sempre, e testes seguintes que escrevessem diretamente no
 * localStorage nunca veriam esse valor refletido.
 */
export function __resetSettingsCacheForTests(): void {
  cache = null;
  listeners.clear();
}

export function useSettings(): UseSettingsResult {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    const next = { ...getSnapshot(), ...partial };
    saveSettings(next);
    setCache(next);
  }, []);

  return { settings, updateSettings };
}
