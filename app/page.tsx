'use client';

import { useState } from 'react';
import Link from 'next/link';
import { clearSavedGame } from '@/lib/chess/useChessGame';
import { RulesModal } from '@/components/RulesModal/RulesModal';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { BACKGROUND_THEMES } from '@/lib/settings/themes';
import { useSettings } from '@/lib/settings/useSettings';

// Sombra "carimbada" (efeito banda-desenhada) + corte diagonal — a mesma
// linguagem visual das ChipButton, só a uma escala maior, para as três
// ações principais. Cores flat por agora: a arte ilustrada de cada tile
// (vs-cpu.webp/two-players.webp/options.webp, estilo "premium chess club"
// antigo) fica para a próxima fase do redesenho (gerar arte nova a
// condizer, via Draw Things) — ver CLAUDE.md.
const TILE_CLASS =
  'relative flex items-center justify-center h-32 rounded-2xl px-6 text-lg font-bold text-center ' +
  'shadow-[4px_4px_0_rgba(0,0,0,0.35)] [clip-path:polygon(0_0,100%_0,100%_88%,96%_100%,0_100%)] ' +
  'transition-transform hover:scale-[1.02]';

export default function HomePage() {
  const [rulesOpen, setRulesOpen] = useState(false);
  const { settings } = useSettings();

  return (
    <main
      className="relative min-h-dvh flex flex-col items-center gap-8 p-8 overflow-hidden bg-ink bg-cover bg-center"
      style={{ backgroundImage: `url(${BACKGROUND_THEMES[settings.backgroundTheme].image})` }}
    >
      {/* Camada de identidade por cima da imagem de fundo escolhida em
          /opcoes: brilho radial rosa + esbatimento para o roxo escuro,
          para o cromo novo (título, tiles, chips) ficar coerente mesmo
          antes de a própria imagem de fundo ganhar arte nova (fase
          seguinte do redesenho). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% -10%, rgba(255,111,165,0.35), transparent 55%), ' +
            'linear-gradient(180deg, rgba(26,11,51,0.55) 0%, rgba(26,11,51,0.85) 100%)',
        }}
      />

      <h1
        className="relative font-display text-5xl tracking-wide text-gold"
        style={{
          textShadow:
            '-2px -2px 0 #1A0B33, 2px -2px 0 #1A0B33, -2px 2px 0 #1A0B33, 2px 2px 0 #1A0B33, 5px 5px 0 rgba(0,0,0,0.35)',
        }}
      >
        XADREZ
      </h1>

      <div className="relative flex flex-col gap-4 w-full max-w-sm">
        <Link
          href="/configurar"
          className={TILE_CLASS}
          style={{ background: 'linear-gradient(135deg, #00E5FF, #4EA8DE)', color: '#0B2E30' }}
        >
          <span aria-hidden="true" className="absolute top-3 right-4 text-base">⚔️</span>
          Jogar contra o computador
        </Link>

        <Link
          href="/jogar?mode=local"
          onClick={() => clearSavedGame()}
          className={TILE_CLASS}
          style={{ background: 'linear-gradient(135deg, #FF6FA5, #FF9AC2)', color: '#3A0B1F' }}
        >
          <span aria-hidden="true" className="absolute top-3 right-4 text-base">✨</span>
          Dois jogadores
        </Link>

        <Link
          href="/opcoes"
          className={TILE_CLASS}
          style={{ background: 'linear-gradient(135deg, #FFD600, #FFA800)', color: '#3A2A00' }}
        >
          Opções
        </Link>
      </div>

      <div className="relative flex items-center gap-3 flex-wrap justify-center">
        <ChipButton color="purple" href="/aprender">
          Ver tutorial
        </ChipButton>
        <ChipButton color="cyan" onClick={() => setRulesOpen(true)}>
          Regras do jogo
        </ChipButton>
      </div>

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </main>
  );
}
