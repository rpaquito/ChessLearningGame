'use client';

import { GameSetup } from '@/components/GameSetup/GameSetup';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageHeader } from '@/components/PageChrome/PageChrome';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function ConfigurarPage() {
  const { t } = useTranslation();
  // Sem min-h-dvh de propósito — mesmo raciocínio de /opções (ver o
  // comentário lá): só bg-ink liso, igual à cor de <body>, por isso
  // min-h-dvh não tinha efeito visual nenhum, só espaço livre para um
  // recálculo de dvh abrir um vazio antes do "Menu inicial".
  return (
    <main className="relative flex flex-col items-center justify-start gap-8 p-8 overflow-hidden bg-ink">
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
