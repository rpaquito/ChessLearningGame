import { GameSetup } from '@/components/GameSetup/GameSetup';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';

export default function ConfigurarPage() {
  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-start gap-8 p-8 overflow-hidden bg-ink">
      <PageGlow pinkOpacity={0.25} />
      <PageTitle size="text-3xl" className="relative text-center">
        JOGAR CONTRA O COMPUTADOR
      </PageTitle>
      <div className="relative w-full max-w-sm">
        <GameSetup />
      </div>
      <ChipButton color="purple" href="/" className="relative">
        Menu inicial
      </ChipButton>
    </main>
  );
}
