'use client';

import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import type { GameStatus } from '@/lib/chess/useChessGame';
import { describeGameEnd, type GameEndKind } from '@/lib/chess/gameEndMessage';
import { PageTitle } from '@/components/PageChrome/PageChrome';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { useFocusTrap } from '@/lib/ui/useFocusTrap';
import { useTranslation } from '@/lib/i18n/useTranslation';

/** Ilustração do mascote por resultado — ver public/gameend/. */
const MASCOT_IMAGE: Record<GameEndKind, string> = {
  win: '/gameend/win.webp',
  lose: '/gameend/lose.webp',
  draw: '/gameend/draw.webp',
};

const CONFETTI_COLORS = ['#00E5FF', '#FF6FA5', '#FFD600', '#7B3FA0'];

/** 12 partículas em leque à volta do centro, ângulo/cor/atraso fixos (não
 * Math.random) para o resultado ser determinístico entre renders/testes. */
const CONFETTI_PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const distance = 55 + (i % 3) * 18;
  return {
    x: Math.round(Math.cos(angle) * distance),
    y: Math.round(Math.sin(angle) * distance),
    rotation: (i * 47) % 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: (i % 4) * 60,
  };
});

/** Rebentamento de confettis sobreposto à ilustração de vitória — só
 * decorativo (aria-hidden), some sozinho com prefers-reduced-motion. */
function WinConfetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {CONFETTI_PARTICLES.map((particle, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 h-2 w-2 rounded-sm motion-reduce:hidden animate-confetti-pop"
          style={
            {
              backgroundColor: particle.color,
              animationDelay: `${particle.delay}ms`,
              '--confetti-x': `${particle.x}px`,
              '--confetti-y': `${particle.y}px`,
              '--confetti-r': `${particle.rotation}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

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
  const result = describeGameEnd(status, mode, humanColor, turn, locale);
  if (!result) return null;
  const { title, kind } = result;

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
        <div className="relative mx-auto mb-3 h-32 w-32">
          <div
            data-testid="game-end-mascot"
            aria-hidden="true"
            className="h-32 w-32 rounded-full border-2 border-purple bg-cover bg-center shadow-[3px_3px_0_rgba(0,0,0,0.35)]"
            style={{ backgroundImage: `url(${MASCOT_IMAGE[kind]})` }}
          />
          {kind === 'win' && <WinConfetti />}
        </div>
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
