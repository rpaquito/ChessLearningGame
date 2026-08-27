'use client';

import { useEffect } from 'react';
import type { GameStatus } from '@/lib/chess/useChessGame';
import { describeGameEnd } from '@/lib/chess/gameEndMessage';
import { PageTitle } from '@/components/PageChrome/PageChrome';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { useFocusTrap } from '@/lib/ui/useFocusTrap';
import { useTranslation } from '@/lib/i18n/useTranslation';

export interface GameEndModalProps {
  open: boolean;
  status: GameStatus;
  mode: 'ai' | 'local';
  humanColor: 'w' | 'b';
  turn: 'w' | 'b';
  onClose: () => void;
  onPlayAgain: () => void;
}

/**
 * Auto-contido como o RulesModal (backdrop, role="dialog", fecho por
 * Escape, botão ✕) em vez de passar pelo ToastProvider — só /jogar o
 * usa e precisa de callbacks próprios da página (onPlayAgain). Ver
 * docs/superpowers/specs/2026-08-27-popup-toast-feedback-design.md.
 */
export function GameEndModal({
  open,
  status,
  mode,
  humanColor,
  turn,
  onClose,
  onPlayAgain,
}: GameEndModalProps) {
  const { t, locale } = useTranslation();
  const panelRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  const title = describeGameEnd(status, mode, humanColor, turn, locale);
  if (!title) return null;

  return (
    <div
      data-testid="game-end-modal-backdrop"
      onClick={onClose}
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
        <div className="mb-4 flex items-start justify-between gap-4">
          <PageTitle as="h2" size="text-xl" strokeWidth={1}>
            {title}
          </PageTitle>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="rounded-full h-8 w-8 shrink-0 bg-pink text-[#3A0B1F] font-bold hover:scale-110 transition-transform"
          >
            ✕
          </button>
        </div>
        <div className="flex gap-3">
          <ChipButton color="pink" onClick={onPlayAgain}>
            {t.gameEnd.playAgain}
          </ChipButton>
          <ChipButton color="purple" href="/">
            {t.common.mainMenu}
          </ChipButton>
        </div>
      </div>
    </div>
  );
}
