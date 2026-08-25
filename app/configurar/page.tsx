import { GameSetup } from '@/components/GameSetup/GameSetup';
import { ChipButton } from '@/components/ChipButton/ChipButton';

export default function ConfigurarPage() {
  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-start gap-8 p-8 overflow-hidden bg-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% -10%, rgba(255,111,165,0.25), transparent 55%)',
        }}
      />
      <h1
        className="relative font-display text-3xl tracking-wide text-gold text-center"
        style={{
          textShadow:
            '-2px -2px 0 #1A0B33, 2px -2px 0 #1A0B33, -2px 2px 0 #1A0B33, 2px 2px 0 #1A0B33, 4px 4px 0 rgba(0,0,0,0.35)',
        }}
      >
        JOGAR CONTRA O COMPUTADOR
      </h1>
      <div className="relative w-full max-w-sm">
        <GameSetup />
      </div>
      <ChipButton color="purple" href="/" className="relative">
        Menu inicial
      </ChipButton>
    </main>
  );
}
