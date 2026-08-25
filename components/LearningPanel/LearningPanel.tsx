'use client';

import type { MoveQuality } from '@/lib/chess/moveClassification';

export interface LearningPanelProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onRequestSuggestion: () => void;
  suggestionLoading?: boolean;
  hasSuggestion?: boolean;
  suggestionExplanation?: string | null;
  lastMoveQuality?: MoveQuality | null;
  lastMoveExplanation?: string | null;
}

const QUALITY_LABEL: Record<MoveQuality, string> = {
  boa: 'Boa jogada',
  imprecisao: 'Imprecisão',
  erro: 'Erro',
};

// Chips translúcidos sobre o cartão escuro — mantêm a cor semântica
// (verde/âmbar/vermelho) sem os fundos pastel claros que ficavam fora de
// tom ao lado do resto da UI escura.
const QUALITY_CLASS: Record<MoveQuality, string> = {
  boa: 'bg-emerald-900/60 text-emerald-200',
  imprecisao: 'bg-amber-900/60 text-amber-200',
  erro: 'bg-red-900/60 text-red-200',
};

export function LearningPanel({
  enabled,
  onToggle,
  onRequestSuggestion,
  suggestionLoading = false,
  hasSuggestion = false,
  suggestionExplanation = null,
  lastMoveQuality = null,
  lastMoveExplanation = null,
}: LearningPanelProps) {
  return (
    <aside className="flex flex-col gap-4 w-full max-w-xs border border-stone-700 rounded-md p-4 bg-stone-800/95 text-stone-100">
      <label className="flex items-center justify-between gap-2 font-medium">
        Modo de aprendizagem
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onToggle(event.target.checked)}
          className="h-5 w-5"
        />
      </label>

      {enabled && (
        <>
          <p className="text-sm text-stone-300">
            Lances legais e peças ameaçadas aparecem destacados no tabuleiro.
          </p>
          <button
            type="button"
            onClick={onRequestSuggestion}
            disabled={suggestionLoading}
            className="rounded-md bg-sky-600 text-white px-3 py-2 disabled:opacity-50"
          >
            {suggestionLoading ? 'A pensar…' : 'Sugerir jogada'}
          </button>
          {hasSuggestion && (
            <p className="text-sm text-stone-300">
              Jogada sugerida destacada em verde no tabuleiro.
              {suggestionExplanation && ` ${suggestionExplanation}`}
            </p>
          )}
          {lastMoveQuality && (
            <p className={`text-sm rounded-md px-3 py-2 ${QUALITY_CLASS[lastMoveQuality]}`}>
              O teu último lance: {QUALITY_LABEL[lastMoveQuality]}
              {lastMoveExplanation && ` — ${lastMoveExplanation}`}
            </p>
          )}
        </>
      )}
    </aside>
  );
}
