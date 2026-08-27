'use client';

import { useSettings } from '@/lib/settings/useSettings';
import { DICTIONARIES, type Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/types';

export interface UseTranslationResult {
  t: Dictionary;
  locale: Locale;
}

/**
 * Sem Context novo — o único Context da app continua a ser o do Toast
 * (ver CLAUDE.md). `language` é só mais um campo lido através do
 * useSettings() já existente.
 */
export function useTranslation(): UseTranslationResult {
  const { settings } = useSettings();
  return { t: DICTIONARIES[settings.language], locale: settings.language };
}
