'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from './settings';

export interface UseSettingsResult {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
}

/**
 * Ao contrário de useChessGame, esta hook não pode ler o localStorage no
 * inicializador de useState: /configurar e /opcoes são páginas
 * pré-renderizadas (useChessGame só é seguro porque /jogar nunca é
 * pré-renderizada, por estar atrás de useSearchParams dentro de
 * <Suspense>). Ler logo o valor real produziria HTML de servidor e de
 * cliente diferentes sempre que o utilizador já tivesse definições
 * guardadas — um erro de hidratação. Por isso o valor inicial é sempre
 * DEFAULT_SETTINGS (igual em servidor e cliente), e só um useEffect
 * (que corre apenas no cliente, depois de montar) lê o valor real.
 *
 * settingsRef guarda o valor mais recente fora do ciclo de render, para
 * que updateSettings nunca funda contra um `settings` desatualizado —
 * duas chamadas seguidas, mesmo antes de um novo render, acumulam
 * corretamente em vez de a segunda apagar a primeira.
 */
export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const settingsRef = useRef(settings);

  useEffect(() => {
    const loaded = loadSettings();
    settingsRef.current = loaded;
    // Intentional: this is the one-time hand-off from the SSR-safe
    // DEFAULT_SETTINGS placeholder to the real localStorage value, right
    // after mount (empty deps, runs once) — exactly the "sync external
    // system state into React after hydration" case, not a cascading
    // render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(loaded);
  }, []);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    const next = { ...settingsRef.current, ...partial };
    settingsRef.current = next;
    setSettings(next);
    saveSettings(next);
  }, []);

  return { settings, updateSettings };
}
