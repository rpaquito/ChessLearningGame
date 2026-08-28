'use client';

import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageHeader } from '@/components/PageChrome/PageChrome';
import { InteractiveDemo, type PieceDemo } from '@/components/InteractiveDemo/InteractiveDemo';
import { useTranslation } from '@/lib/i18n/useTranslation';

const FENS = {
  pawn: { fen: '4k3/8/8/8/8/3p4/4P3/4K3 w - - 0 1', square: 'e2' as const },
  knight: { fen: '4k3/8/8/8/4N3/8/8/4K3 w - - 0 1', square: 'e4' as const },
  bishop: { fen: '4k3/8/8/8/4B3/8/8/4K3 w - - 0 1', square: 'e4' as const },
  rook: { fen: '4k3/8/8/8/4R3/8/8/4K3 w - - 0 1', square: 'e4' as const },
  queen: { fen: '4k3/8/8/8/4Q3/8/8/4K3 w - - 0 1', square: 'e4' as const },
  king: { fen: '8/8/8/4k3/8/4K3/8/8 w - - 0 1', square: 'e3' as const },
};

export default function PecasPage() {
  const { t } = useTranslation();
  const DEMOS: PieceDemo[] = [
    { title: t.pecas.pawn.title, description: t.pecas.pawn.desc, ...FENS.pawn },
    { title: t.pecas.knight.title, description: t.pecas.knight.desc, ...FENS.knight },
    { title: t.pecas.bishop.title, description: t.pecas.bishop.desc, ...FENS.bishop },
    { title: t.pecas.rook.title, description: t.pecas.rook.desc, ...FENS.rook },
    { title: t.pecas.queen.title, description: t.pecas.queen.desc, ...FENS.queen },
    { title: t.pecas.king.title, description: t.pecas.king.desc, ...FENS.king },
  ];

  return (
    <main className="relative min-h-screen max-w-3xl mx-auto p-8 flex flex-col gap-8 overflow-hidden bg-ink">
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <div>
        <PageHeader>{t.pecas.title}</PageHeader>
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
