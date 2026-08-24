'use client';

import Link from 'next/link';
import type { MoveQuality } from '@/lib/chess/moveClassification';

export interface LearningPanelProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onRequestSuggestion: () => void;
  isPremium: boolean;
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

const QUALITY_CLASS: Record<MoveQuality, string> = {
  boa: 'bg-emerald-100 text-emerald-800',
  imprecisao: 'bg-amber-100 text-amber-800',
  erro: 'bg-red-100 text-red-800',
};

// Mostra a explicação em si a quem é premium, ou uma chamada para
// se tornar premium a quem não é — usado tanto para a jogada sugerida
// como para a qualidade do último lance, daí ser um componente à parte
// em vez de duplicar a condição nos dois sítios.
function ExplanationOrUpsell({
  text,
  isPremium,
  separator,
}: {
  text: string | null | undefined;
  isPremium: boolean;
  separator: string;
}) {
  if (!text) return null;
  if (isPremium) {
    return (
      <>
        {separator}
        {text}
      </>
    );
  }
  return (
    <>
      {separator}
      <Link href="/entrar" className="underline">
        Entra ou contacta-nos
      </Link>{' '}
      para pedires acesso premium e veres a explicação deste lance.
    </>
  );
}

export function LearningPanel({
  enabled,
  onToggle,
  onRequestSuggestion,
  isPremium,
  suggestionLoading = false,
  hasSuggestion = false,
  suggestionExplanation = null,
  lastMoveQuality = null,
  lastMoveExplanation = null,
}: LearningPanelProps) {
  return (
    <aside className="flex flex-col gap-4 w-full max-w-xs border border-stone-200 rounded-md p-4 bg-white/95">
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
              <ExplanationOrUpsell
                text={suggestionExplanation}
                isPremium={isPremium}
                separator=" "
              />
            </p>
          )}
          {lastMoveQuality && (
            <p className={`text-sm rounded-md px-3 py-2 ${QUALITY_CLASS[lastMoveQuality]}`}>
              O teu último lance: {QUALITY_LABEL[lastMoveQuality]}
              <ExplanationOrUpsell
                text={lastMoveExplanation}
                isPremium={isPremium}
                separator=" — "
              />
            </p>
          )}
        </>
      )}
    </aside>
  );
}
