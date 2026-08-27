'use client';

import { useEffect } from 'react';
import { PageTitle } from '@/components/PageChrome/PageChrome';
import { useFocusTrap } from '@/lib/ui/useFocusTrap';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { Dictionary } from '@/lib/i18n/dictionaries';

export interface RulesModalProps {
  open: boolean;
  onClose: () => void;
}

function buildSections(t: Dictionary) {
  return [
    {
      title: t.rulesModal.movementTitle,
      items: [t.rulesModal.pawn, t.rulesModal.knight, t.rulesModal.bishop, t.rulesModal.rook, t.rulesModal.queen, t.rulesModal.king],
    },
    {
      title: t.rulesModal.specialTitle,
      items: [t.rulesModal.castling, t.rulesModal.enPassant, t.rulesModal.promotion],
    },
    {
      title: t.rulesModal.endgameTitle,
      items: [t.rulesModal.check, t.rulesModal.checkmate, t.rulesModal.stalemate, t.rulesModal.otherDraws],
    },
    {
      title: t.rulesModal.learningTitle,
      items: [t.rulesModal.centipawns],
    },
  ];
}

export function RulesModal({ open, onClose }: RulesModalProps) {
  const { t } = useTranslation();
  const panelRef = useFocusTrap(open);
  const SECTIONS = buildSections(t);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      data-testid="rules-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      {/* text-lilac explícito no próprio painel (não só nos elementos
          individuais) — protege qualquer texto futuro que se esqueça de
          definir a própria cor, mesmo agora que a app é sempre escura
          (ver "Cuidado recorrente" em CLAUDE.md: o cartão já foi
          bg-white/prefers-color-scheme, o hábito de nunca confiar só na
          herança do body fica). */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t.rulesModal.title}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-2xl border-2 border-purple bg-ink-soft p-6 text-lilac outline-none"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <PageTitle as="h2" size="text-2xl" strokeWidth={1}>
            {t.rulesModal.title}
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

        <div className="flex flex-col gap-5">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h3 className="mb-2 font-semibold text-cyan">{section.title}</h3>
              <dl className="flex flex-col gap-2">
                {section.items.map((item) => (
                  <div key={item.title}>
                    <dt className="font-medium text-white">{item.title}</dt>
                    <dd className="text-sm text-lilac/80">{item.text}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
