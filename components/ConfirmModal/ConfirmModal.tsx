'use client';

import { useEffect } from 'react';
import { PageTitle } from '@/components/PageChrome/PageChrome';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { useFocusTrap } from '@/lib/ui/useFocusTrap';

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Popup de confirmação genérico — mesmo padrão auto-contido do
 * RulesModal/GameEndModal (backdrop, role="dialog", focus trap, fecho por
 * Escape), mas sem o botão ✕: com só duas ações (confirmar/cancelar), um
 * terceiro sítio para dizer "não" seria redundante. Escape e o clique no
 * backdrop contam como cancelar, tal como o clique explícito em
 * `cancelLabel`. Usado hoje só em app/jogar/page.tsx (confirmar
 * "Reiniciar partida"/"Menu inicial" quando há progresso a perder), mas
 * fica genérico o suficiente para outros sítios precisarem no futuro.
 */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const panelRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      data-testid="confirm-modal-backdrop"
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border-2 border-purple bg-ink-soft p-6 text-lilac outline-none"
      >
        <PageTitle as="h2" size="text-xl" strokeWidth={1} className="mb-2">
          {title}
        </PageTitle>
        <p className="text-sm text-lilac/80 mb-5">{message}</p>
        <div className="flex gap-3">
          <ChipButton color="pink" onClick={onConfirm}>
            {confirmLabel}
          </ChipButton>
          <ChipButton color="purple" onClick={onCancel}>
            {cancelLabel}
          </ChipButton>
        </div>
      </div>
    </div>
  );
}
