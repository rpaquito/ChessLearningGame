'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MoveQuality } from '@/lib/chess/moveClassification';

// 'boa'/'imprecisao'/'erro' (MoveQuality) reaproveitados como tons —
// o toast que substitui o antigo bloco "O teu último lance" do
// LearningPanel (ver app/jogar/page.tsx), com a mesma cor semântica
// que o badge já usava lá.
export type ToastTone = 'info' | 'check' | MoveQuality;

export interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

export interface ToastProps {
  toast: ToastState | null;
  onDismiss: () => void;
}

const TONE_ACCENT: Record<ToastTone, string> = {
  info: 'border-cyan',
  check: 'border-gold',
  boa: 'border-emerald-400',
  imprecisao: 'border-amber-400',
  erro: 'border-red-400',
};

/**
 * Cartão de toast puro — sem temporizador, fecho só manual (ver
 * decisão do brainstorming em
 * docs/superpowers/specs/2026-08-27-popup-toast-feedback-design.md).
 * z-[60], acima do z-50 do backdrop do RulesModal/GameEndModal, para
 * nunca ficar escondido atrás de um modal aberto. `top-` usa a mesma
 * fórmula `max(1rem, …)` que `MODAL_BACKDROP_CLASS` (PageChrome.tsx)
 * — mantém a app nativa iOS por baixo do notch/Dynamic Island (ver
 * CLAUDE.md, "App nativa iOS"), sem mudar nada em dispositivos sem
 * notch/no browser normal.
 *
 * O wrapper `role="status"`/`aria-live="polite"` fica sempre montado,
 * mesmo sem nenhum toast — só o cartão lá dentro entra/sai, com
 * `key={toast.id}` a forçar o React a remontar essa subárvore mesmo
 * quando a mensagem é idêntica à anterior (ex.: /opções, clicar
 * fácil → médio → difícil em sequência dispara `toast.show()` com o
 * mesmo texto duas vezes seguidas). Sem isto, mostrar a mesma
 * mensagem duas vezes seguidas não mudava nada no DOM — sem repaint
 * visível, sem reanúncio a leitores de ecrã na segunda chamada.
 */
export function Toast({ toast, onDismiss }: ToastProps) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] left-1/2 -translate-x-1/2 z-[60] w-[min(94vw,32rem)]"
    >
      {toast && (
        <div
          key={toast.id}
          data-testid="toast-card"
          className={`flex items-center gap-4 rounded-xl border-2 ${TONE_ACCENT[toast.tone]} bg-ink-soft px-5 py-4 text-lilac shadow-[3px_3px_0_rgba(0,0,0,0.35)]`}
        >
          <p className="text-base font-medium leading-snug">{toast.message}</p>
          <button
            type="button"
            onClick={onDismiss}
            aria-label={t.common.close}
            className="rounded-full h-8 w-8 shrink-0 bg-pink text-[#3A0B1F] font-bold hover:scale-110 transition-transform"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
