import type { Locale } from './types';

/**
 * Inglês é o fallback do fallback: qualquer idioma do browser que não
 * comece por "pt" (incluindo deteção falhada/undefined) cai em inglês,
 * não em português — decisão explícita, inverte o resto de
 * DEFAULT_SETTINGS. Ver spec i18n, secção 2.
 */
export function detectLocale(navigatorLanguage?: string): Locale {
  return navigatorLanguage?.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}
