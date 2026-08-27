'use client';

import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { InteractiveDemo, type PieceDemo } from '@/components/InteractiveDemo/InteractiveDemo';
import { useTranslation } from '@/lib/i18n/useTranslation';

const FENS = {
  castling: { fen: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', square: 'e1' as const },
  enPassant: { fen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', square: 'e5' as const },
  promotion: { fen: 'k7/4P3/8/8/8/8/8/4K3 w - - 0 1', square: 'e7' as const },
};

export default function RegrasEspeciaisPage() {
  const { t } = useTranslation();
  const DEMOS: PieceDemo[] = [
    { title: t.regrasEspeciais.castling.title, description: t.regrasEspeciais.castling.desc, ...FENS.castling },
    { title: t.regrasEspeciais.enPassant.title, description: t.regrasEspeciais.enPassant.desc, ...FENS.enPassant },
    { title: t.regrasEspeciais.promotion.title, description: t.regrasEspeciais.promotion.desc, ...FENS.promotion },
  ];

  return (
    <main className="relative min-h-screen max-w-3xl mx-auto p-8 flex flex-col gap-8 overflow-hidden bg-ink">
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <div>
        <PageTitle>{t.regrasEspeciais.title}</PageTitle>
        <p className="mt-3">
          <ChipButton color="purple" href="/aprender">
            {t.common.backToTutorial}
          </ChipButton>
        </p>
      </div>
      {DEMOS.map((demo) => (
        <InteractiveDemo key={demo.title} {...demo} />
      ))}
    </main>
  );
}
