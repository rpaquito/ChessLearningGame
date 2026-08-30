'use client';

import { GameSetup } from '@/components/GameSetup/GameSetup';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageHeader } from '@/components/PageChrome/PageChrome';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function ConfigurarPage() {
  const { t } = useTranslation();
  // Sem min-h-dvh de propósito, e mt-8 em vez de gap-8 no <main> — mesmo
  // raciocínio e mesmo bug real de /opções (ver o comentário lá): bg-ink
  // liso não precisa de min-h-dvh, e gap-8 num flex container cujo
  // conteúdo chega via navegação client-side (não o parse inicial do
  // HTML) tem um bug real, reproduzido, só no WebKit do iOS — margin não
  // tem essa categoria de bug.
  return (
    <main className="relative flex flex-col items-center justify-start p-8 overflow-hidden bg-ink">
      <PageGlow pinkOpacity={0.25} />
      <PageHeader size="text-3xl" wrapperClassName="w-full max-w-sm">
        {t.configurar.title}
      </PageHeader>
      <div className="relative w-full max-w-sm mt-8">
        <GameSetup />
      </div>
      <ChipButton color="purple" href="/" className="relative mt-8">
        {t.common.mainMenu}
      </ChipButton>
    </main>
  );
}
