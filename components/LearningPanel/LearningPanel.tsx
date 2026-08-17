'use client';

import type { MoveQuality } from '@/lib/chess/moveClassification';

export interface LearningPanelProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onRequestSuggestion: () => void;
  suggestionLoading?: boolean;
  hasSuggestion?: boolean;
  lastMoveQuality?: MoveQuality | null;
}

const QUALITY_LABEL: Record<MoveQuality, string> = {
  boa: 'Boa jogada',
  imprecisao: 'Imprecisão',
  erro: 'Erro',
};

const QUALITY_CLASS: Record<MoveQuality, string> = {
  boa: 'bg-emerald-100 text-emerald-800',
  imprecisao: 'bg-amber-100 text-amber-800',
  erro: 'bg-red-100 text-red-800',
};

export function LearningPanel({
  enabled,
  onToggle,
  onRequestSuggestion,
  suggestionLoading = false,
  hasSuggestion = false,
  lastMoveQuality = null,
}: LearningPanelProps) {
  return (
    <aside className="flex flex-col gap-4 w-full max-w-xs border border-stone-200 rounded-md p-4">
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
          <p className="text-sm text-stone-600">
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
            <p className="text-sm text-stone-600">
              Jogada sugerida destacada em verde no tabuleiro.
            </p>
          )}
          {lastMoveQuality && (
            <p className={`text-sm rounded-md px-3 py-2 ${QUALITY_CLASS[lastMoveQuality]}`}>
              O teu último lance: {QUALITY_LABEL[lastMoveQuality]}
            </p>
          )}
        </>
      )}
    </aside>
  );
}
