'use client';

import type { MoveQuality } from '@/lib/chess/moveClassification';
import { ACTIVE_TOGGLE_STYLE } from '@/lib/ui/activeToggleStyle';

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

// Pílulas translúcidas — mantêm a cor semântica (verde/âmbar/vermelho)
// de propósito, para não se confundirem com as cores de marca
// (cyan/rosa/dourado/roxo) usadas no resto da identidade nova: aqui a
// cor comunica correção do lance, não estilo.
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
    <aside className="flex flex-col gap-4 w-full max-w-xs border-2 border-cyan rounded-2xl p-4 bg-ink-soft text-lilac">
      <label className="flex items-center justify-between gap-2 font-medium text-white">
        Modo de aprendizagem
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onToggle(event.target.checked)}
          className="h-5 w-5 accent-cyan"
        />
      </label>

      {enabled && (
        <>
          <p className="text-sm text-lilac/80">
            Lances legais e peças ameaçadas aparecem destacados no tabuleiro.
          </p>
          <button
            type="button"
            onClick={onRequestSuggestion}
            disabled={suggestionLoading}
            className="rounded-lg px-3 py-2 font-semibold text-[#0B2E30] shadow-[3px_3px_0_rgba(0,0,0,0.35)] disabled:opacity-50 transition-transform enabled:hover:scale-[1.02]"
            style={{ background: ACTIVE_TOGGLE_STYLE.background }}
          >
            {suggestionLoading ? 'A pensar…' : 'Sugerir jogada'}
          </button>
          {hasSuggestion && (
            <p className="text-sm text-lilac/80">
              Jogada sugerida destacada em verde no tabuleiro.
              {suggestionExplanation && ` ${suggestionExplanation}`}
            </p>
          )}
          {lastMoveQuality && (
            <p className={`text-sm rounded-full px-3 py-2 ${QUALITY_CLASS[lastMoveQuality]}`}>
              O teu último lance: {QUALITY_LABEL[lastMoveQuality]}
              {lastMoveExplanation && ` — ${lastMoveExplanation}`}
            </p>
          )}
        </>
      )}
    </aside>
  );
}
