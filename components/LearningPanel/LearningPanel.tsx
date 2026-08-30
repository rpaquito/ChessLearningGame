'use client';

import { ACTIVE_TOGGLE_STYLE } from '@/lib/ui/activeToggleStyle';
import { useTranslation } from '@/lib/i18n/useTranslation';

export interface LearningPanelProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onRequestSuggestion: () => void;
  suggestionLoading?: boolean;
  hasSuggestion?: boolean;
  suggestionExplanation?: string | null;
}

/**
 * Painel do modo de aprendizagem — só o toggle e a sugestão de jogada
 * (com a explicação da própria sugestão, quando existe). O feedback do
 * último lance (bom/impreciso/erro) deixou de viver aqui — passou a
 * toast (ver app/jogar/page.tsx, tons 'boa'/'imprecisao'/'erro' em
 * components/Toast/Toast.tsx), para o painel ocupar menos espaço no
 * ecrã.
 */
export function LearningPanel({
  enabled,
  onToggle,
  onRequestSuggestion,
  suggestionLoading = false,
  hasSuggestion = false,
  suggestionExplanation = null,
}: LearningPanelProps) {
  const { t } = useTranslation();

  return (
    <aside className="flex flex-col gap-4 w-full max-w-xs border-2 border-cyan rounded-2xl p-4 bg-ink-soft text-lilac">
      <label className="flex items-center justify-between gap-2 font-medium text-white">
        {t.learningPanel.toggleLabel}
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onToggle(event.target.checked)}
          className="h-5 w-5 accent-cyan"
        />
      </label>

      {enabled && (
        <>
          <button
            type="button"
            onClick={onRequestSuggestion}
            disabled={suggestionLoading}
            className="rounded-lg px-3 py-2 font-semibold text-[#0B2E30] shadow-[3px_3px_0_rgba(0,0,0,0.35)] disabled:opacity-50 transition-transform enabled:hover:scale-[1.02]"
            style={{ background: ACTIVE_TOGGLE_STYLE.background }}
          >
            {suggestionLoading ? t.common.thinking : t.learningPanel.suggestMove}
          </button>
          {hasSuggestion && (
            <p className="text-sm text-lilac/80">
              {t.learningPanel.suggestionHint}
              {suggestionExplanation && ` ${suggestionExplanation}`}
            </p>
          )}
        </>
      )}
    </aside>
  );
}
