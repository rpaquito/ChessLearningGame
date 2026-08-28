import type { Locale } from '@/lib/i18n/types';

/**
 * Um lance de uma linha de abertura: a notação e a explicação, escrita à
 * mão para esse lance específico nessa linha específica, em PT-PT e em
 * inglês.
 */
export interface OpeningMove {
  san: string;
  explanation: Record<Locale, string>;
}

/**
 * Uma linha completa e independente desde o lance 1 — a linha
 * principal de uma abertura, ou uma das suas variações nomeadas.
 * Não é um ramo que parte de um ponto da linha principal: mesmo que
 * partilhe os primeiros lances com outra linha da mesma abertura, tem
 * a sua própria sequência completa (ver spec: decisão deliberada, mais
 * simples do que uma árvore de variações).
 */
export interface OpeningLine {
  name: Record<Locale, string>;
  /** Código ECO, informativo — não validado por nenhuma lógica. */
  eco?: string;
  moves: OpeningMove[];
}

export interface Opening {
  /** Slug kebab-case, estável — vai ser usado como segmento de rota. */
  id: string;
  name: Record<Locale, string>;
  /** 1-2 frases para uma futura lista/hub de aberturas. */
  description: Record<Locale, string>;
  /** Linha principal + 1-2 variações nomeadas. */
  lines: OpeningLine[];
}
