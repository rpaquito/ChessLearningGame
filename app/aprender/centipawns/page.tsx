'use client';

import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { useTranslation } from '@/lib/i18n/useTranslation';

// Cores dos badges espelham exatamente QUALITY_BADGE_CLASS em
// components/LearningPanel/LearningPanel.tsx — a ideia é que quem lê esta
// página reconheça de imediato o mesmo badge que vê a jogar.
const QUALITY_BADGE_CLASS: Record<'boa' | 'imprecisao' | 'erro', string> = {
  boa: 'bg-emerald-900/60 text-emerald-200',
  imprecisao: 'bg-amber-900/60 text-amber-200',
  erro: 'bg-red-900/60 text-red-200',
};

export default function CentipawnsPage() {
  const { t } = useTranslation();
  const qualityLevels: { key: 'boa' | 'imprecisao' | 'erro'; label: string; text: string }[] = [
    { key: 'boa', label: t.learningPanel.quality.boa, text: t.centipawnsPage.qualityTexts.boa },
    { key: 'imprecisao', label: t.learningPanel.quality.imprecisao, text: t.centipawnsPage.qualityTexts.imprecisao },
    { key: 'erro', label: t.learningPanel.quality.erro, text: t.centipawnsPage.qualityTexts.erro },
  ];

  return (
    <main className="relative min-h-screen max-w-2xl mx-auto p-8 flex flex-col gap-6 overflow-hidden bg-ink">
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <div>
        <PageTitle>{t.centipawnsPage.title}</PageTitle>
        <p className="mt-3">
          <ChipButton color="purple" href="/aprender">
            {t.common.backToTutorial}
          </ChipButton>
        </p>
      </div>
      <ul className="flex flex-col gap-4">
        {t.centipawnsPage.concepts.map((concept) => (
          <li key={concept.title} className="rounded-xl border-2 border-purple/40 bg-ink-soft p-4">
            <p className="font-semibold text-white">{concept.title}</p>
            <p className="text-lilac/80 mt-1">{concept.text}</p>
          </li>
        ))}
      </ul>
      <div>
        <p className="font-semibold text-white mb-3">{t.centipawnsPage.levelsHeading}</p>
        <ul className="flex flex-col gap-3">
          {qualityLevels.map((level) => (
            <li key={level.key} className="rounded-xl border-2 border-purple/40 bg-ink-soft p-4 flex flex-col gap-2">
              <span className={`self-start rounded-full px-3 py-1 text-sm font-semibold ${QUALITY_BADGE_CLASS[level.key]}`}>
                {level.label}
              </span>
              <p className="text-lilac/80">{level.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
