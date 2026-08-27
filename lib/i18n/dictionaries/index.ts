import type { Locale } from '@/lib/i18n/types';
import type { Dictionary } from './types';
import { pt } from './pt';
import { en } from './en';

export type { Dictionary };
export const DICTIONARIES: Record<Locale, Dictionary> = { pt, en };
