export type ToastTone = 'info' | 'check';

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
};

/**
 * Cartão de toast puro — sem temporizador, fecho só manual (ver
 * decisão do brainstorming em
 * docs/superpowers/specs/2026-08-27-popup-toast-feedback-design.md).
 * z-[60], acima do z-50 do backdrop do RulesModal/GameEndModal, para
 * nunca ficar escondido atrás de um modal aberto.
 */
export function Toast({ toast, onDismiss }: ToastProps) {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 rounded-xl border-2 ${TONE_ACCENT[toast.tone]} bg-ink-soft px-4 py-2 text-lilac shadow-[3px_3px_0_rgba(0,0,0,0.35)]`}
    >
      <p className="text-sm font-medium">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fechar"
        className="rounded-full h-6 w-6 shrink-0 bg-pink text-[#3A0B1F] font-bold hover:scale-110 transition-transform"
      >
        ✕
      </button>
    </div>
  );
}
