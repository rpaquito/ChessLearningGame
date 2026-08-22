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
 *
 * A persistência (saveSettings) é chamada como statement separado fora de
 * qualquer functional updater — não dentro, para evitar side effects
 * dentro de funções que React pode invocar duas vezes em Strict Mode.
 */
export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  const updateSettings = useCallback(
    (partial: Partial<Settings>) => {
      const next = { ...settings, ...partial };
      setSettings(next);
      saveSettings(next);
    },
    [settings]
  );

  return { settings, updateSettings };
}
