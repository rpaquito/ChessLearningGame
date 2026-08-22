'use client';

import { useCallback, useState } from 'react';
import { loadSettings, saveSettings, type Settings } from './settings';

export interface UseSettingsResult {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
}

/**
 * Mesmo padrão do useChessGame: lê o localStorage dentro do inicializador
 * de useState (nunca em useEffect) — esta árvore é inteiramente
 * client-side a partir daqui, por isso não há problema de hidratação.
 */
export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
