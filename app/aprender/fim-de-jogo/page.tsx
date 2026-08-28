'use client';

import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageHeader } from '@/components/PageChrome/PageChrome';
import { InteractiveDemo, type PieceDemo } from '@/components/InteractiveDemo/InteractiveDemo';
import { useTranslation } from '@/lib/i18n/useTranslation';

const FENS = {
  check: { fen: '4k3/8/8/8/8/8/8/4R2K b - - 0 1', square: 'e8' as const },
  checkmate: { fen: '4R1k1/5ppp/8/8/8/8/8/6K1 b - - 0 1', square: 'g8' as const },
  stalemate: { fen: '7k/8/6Q1/6K1/8/8/8/8 b - - 0 1', square: 'h8' as const },
};

export default function FimDeJogoPage() {
  const { t } = useTranslation();
  const DEMOS: PieceDemo[] = [
    { title: t.fimDeJogo.check.title, description: t.fimDeJogo.check.desc, ...FENS.check },
    { title: t.fimDeJogo.checkmate.title, description: t.fimDeJogo.checkmate.desc, ...FENS.checkmate },
    { title: t.fimDeJogo.stalemate.title, description: t.fimDeJogo.stalemate.desc, ...FENS.stalemate },
  ];

  return (
    <main className="relative min-h-screen max-w-3xl mx-auto p-8 flex flex-col gap-8 overflow-hidden bg-ink">
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <div>
        <PageHeader>{t.fimDeJogo.title}</PageHeader>
        <p className="mt-3">
          <ChipButton color="purple" href="/aprender">
            {t.common.backToTutorial}
          </ChipButton>
        </p>
      </div>
      {DEMOS.map((demo) => (
        <InteractiveDemo key={demo.title} {...demo} />
      ))}

      <section>
        <h2 className="text-xl font-semibold text-cyan">{t.fimDeJogo.otherDrawsTitle}</h2>
        <p className="text-lilac/80 mt-1">{t.fimDeJogo.otherDrawsText}</p>
      </section>
    </main>
  );
}
