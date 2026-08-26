'use client';

import Link from 'next/link';
import { clearSavedGame } from '@/lib/chess/useChessGame';
import { PageGlow, PageTitle, titleStroke } from '@/components/PageChrome/PageChrome';
import { BACKGROUND_THEMES } from '@/lib/settings/themes';
import { useSettings } from '@/lib/settings/useSettings';

// Sombra "carimbada" (efeito banda-desenhada) + corte diagonal — a mesma
// linguagem visual das ChipButton, só a uma escala maior, para as quatro
// ações principais. vs-cpu.webp/two-players.webp/tutorial.webp/options.webp
// já são a arte anime gerada com Draw Things (substitui o "premium chess
// club" antigo) — a camada de cor por cima (TILE_TINT) mantém a identidade
// de cor de cada tile e garante contraste para o texto sobre qualquer parte
// da ilustração, em vez de depender da própria imagem. "Ver tutorial" e
// "Regras do jogo" (chips secundários por baixo dos tiles, e o RulesModal
// aberto a partir daqui) foram fundidos neste tile — o popup de regras
// agora só existe a meio de uma partida (/jogar), o tutorial em /aprender
// já cobre o resto (ver o tópico "Avaliação e centipawns" acrescentado lá).
const TILE_CLASS =
  'relative flex items-center justify-center h-32 rounded-2xl px-6 overflow-hidden bg-cover bg-center ' +
  'shadow-[4px_4px_0_rgba(0,0,0,0.35)] [clip-path:polygon(0_0,100%_0,100%_88%,96%_100%,0_100%)] ' +
  'transition-transform hover:scale-[1.02]';

const TILE_LABEL_CLASS = 'relative z-10 text-lg font-bold text-center text-white';
const TILE_LABEL_STROKE = titleStroke(1);

export default function HomePage() {
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
      <PageGlow pinkOpacity={0.35} darken={[0.55, 0.85]} />

      <PageTitle size="text-5xl" softDrop={5} className="relative">
        XADREZ
      </PageTitle>

      <div className="relative flex flex-col gap-4 w-full max-w-sm">
        <Link
          href="/configurar"
          className={TILE_CLASS}
          style={{ backgroundImage: 'url(/menu/vs-cpu.webp)' }}
        >
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.55), rgba(78,168,222,0.4))' }}
          />
          <span aria-hidden="true" className="absolute top-3 right-4 text-base z-10">⚔️</span>
          <span className={TILE_LABEL_CLASS} style={{ textShadow: TILE_LABEL_STROKE }}>
            Jogar contra o computador
          </span>
        </Link>

        <Link
          href="/jogar?mode=local"
          onClick={() => clearSavedGame()}
          className={TILE_CLASS}
          style={{ backgroundImage: 'url(/menu/two-players.webp)' }}
        >
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(255,111,165,0.55), rgba(255,154,194,0.4))' }}
          />
          <span aria-hidden="true" className="absolute top-3 right-4 text-base z-10">✨</span>
          <span className={TILE_LABEL_CLASS} style={{ textShadow: TILE_LABEL_STROKE }}>
            Dois jogadores
          </span>
        </Link>

        <Link
          href="/aprender"
          className={TILE_CLASS}
          style={{ backgroundImage: 'url(/menu/tutorial.webp)' }}
        >
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(123,63,160,0.55), rgba(184,138,224,0.4))' }}
          />
          <span aria-hidden="true" className="absolute top-3 right-4 text-base z-10">📖</span>
          <span className={TILE_LABEL_CLASS} style={{ textShadow: TILE_LABEL_STROKE }}>
            Aprender a jogar
          </span>
        </Link>

        <Link
          href="/opcoes"
          className={TILE_CLASS}
          style={{ backgroundImage: 'url(/menu/options.webp)' }}
        >
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(255,214,0,0.5), rgba(255,168,0,0.35))' }}
          />
          <span className={TILE_LABEL_CLASS} style={{ textShadow: TILE_LABEL_STROKE }}>
            Opções
          </span>
        </Link>
      </div>
    </main>
  );
}
