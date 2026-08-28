'use client';

import { GameSetup } from '@/components/GameSetup/GameSetup';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageHeader } from '@/components/PageChrome/PageChrome';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function ConfigurarPage() {
  const { t } = useTranslation();
  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-start gap-8 p-8 overflow-hidden bg-ink">
      <PageGlow pinkOpacity={0.25} />
      <PageHeader size="text-3xl" wrapperClassName="w-full max-w-sm">
        {t.configurar.title}
      </PageHeader>
      <div className="relative w-full max-w-sm">
        <GameSetup />
      </div>
      <ChipButton color="purple" href="/" className="relative">
        {t.common.mainMenu}
      </ChipButton>
    </main>
  );
}
