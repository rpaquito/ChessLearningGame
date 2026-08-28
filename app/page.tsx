'use client';

import Link from 'next/link';
import { clearSavedGame } from '@/lib/chess/useChessGame';
import { PageGlow, PageHeader, titleStroke } from '@/components/PageChrome/PageChrome';
import { BACKGROUND_THEMES } from '@/lib/settings/themes';
import { useSettings } from '@/lib/settings/useSettings';
import { useTranslation } from '@/lib/i18n/useTranslation';

// Sombra "carimbada" (efeito banda-desenhada) + corte diagonal — a mesma
// linguagem visual das ChipButton, só a uma escala maior, para as quatro
// ações principais. vs-cpu.webp/two-players.webp/tutorial.webp/options.webp
// já são a arte anime gerada com Draw Things (substitui o "premium chess
// club" antigo) — a camada de cor por cima (tint de cada tile) mantém a
// identidade de cor de cada tile e garante contraste para o texto sobre
// qualquer parte da ilustração, em vez de depender da própria imagem.
// "Ver tutorial" e "Regras do jogo" (chips secundários por baixo dos
// tiles, e o RulesModal aberto a partir daqui) foram fundidos neste tile
// — o popup de regras agora só existe a meio de uma partida (/jogar), o
// tutorial em /aprender já cobre o resto (ver o tópico "Avaliação e
// centipawns" acrescentado lá).
const TILE_CLASS =
  'relative flex items-center justify-center h-32 rounded-2xl px-6 overflow-hidden bg-cover bg-center ' +
  'shadow-[4px_4px_0_rgba(0,0,0,0.35)] [clip-path:polygon(0_0,100%_0,100%_88%,96%_100%,0_100%)] ' +
  'transition-transform hover:scale-[1.02]';

const TILE_LABEL_CLASS = 'relative z-10 text-lg font-bold text-center text-white';
const TILE_LABEL_STROKE = titleStroke(1);

interface TileData {
  href: string;
  image: string;
  gradient: string;
  emoji?: string;
  label: string;
  onClick?: () => void;
}


function MenuTile({ href, image, gradient, emoji, label, onClick }: TileData) {
  return (
    <Link href={href} onClick={onClick} className={TILE_CLASS} style={{ backgroundImage: `url(${image})` }}>
      <span aria-hidden="true" className="absolute inset-0" style={{ background: gradient }} />
      {emoji && (
        <span aria-hidden="true" className="absolute top-3 right-4 text-base z-10">
          {emoji}
        </span>
      )}
      <span className={TILE_LABEL_CLASS} style={{ textShadow: TILE_LABEL_STROKE }}>
        {label}
      </span>
    </Link>
  );
}

export default function HomePage() {
  const { settings } = useSettings();
  const { t } = useTranslation();

  const TILES: TileData[] = [
    {
      href: '/configurar',
      image: '/menu/vs-cpu.webp',
      gradient: 'linear-gradient(135deg, rgba(0,229,255,0.55), rgba(78,168,222,0.4))',
      emoji: '⚔️',
      label: t.menu.playVsComputer,
    },
    {
      href: '/jogar?mode=local',
      image: '/menu/two-players.webp',
      gradient: 'linear-gradient(135deg, rgba(255,111,165,0.55), rgba(255,154,194,0.4))',
      emoji: '✨',
      label: t.menu.twoPlayers,
      onClick: () => clearSavedGame(),
    },
    {
      href: '/aprender',
      image: '/menu/tutorial.webp',
      gradient: 'linear-gradient(135deg, rgba(123,63,160,0.55), rgba(184,138,224,0.4))',
      emoji: '📖',
      label: t.menu.learnToPlay,
    },
    {
      href: '/opcoes',
      image: '/menu/options.webp',
      gradient: 'linear-gradient(135deg, rgba(255,214,0,0.5), rgba(255,168,0,0.35))',
      label: t.menu.options,
    },
  ];

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

      <PageHeader size="text-5xl" softDrop={5} logoSize="lg" wrapperClassName="w-full max-w-sm">
        {t.menu.title}
      </PageHeader>

      <div className="relative flex flex-col gap-4 w-full max-w-sm">
        {TILES.map((tile) => (
          <MenuTile key={tile.href} {...tile} />
        ))}
      </div>
    </main>
  );
}
