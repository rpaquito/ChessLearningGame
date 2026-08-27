'use client';

import { useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';

const HTML_LANG: Record<'pt' | 'en', string> = { pt: 'pt-PT', en: 'en' };

/**
 * Sem UI própria — mesmo padrão do ServiceWorkerRegistration.tsx. Corre
 * sempre DEPOIS da hidratação (useEffect), nunca durante, por isso não há
 * risco do mismatch servidor/cliente que este projeto já viu antes com
 * outras leituras de estado client-only.
 */
export function LanguageSync() {
  const { locale } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);

  return null;
}
