'use client';

import { useState } from 'react';
import { Chess, type Square } from 'chess.js';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';
import { ChipButton } from '@/components/ChipButton/ChipButton';

interface PieceDemo {
  title: string;
  description: string;
  fen: string;
  square: Square;
}

const DEMOS: PieceDemo[] = [
  {
    title: 'Peão',
    description: 'Anda uma casa para frente (duas no primeiro lance) e captura na diagonal.',
    fen: '4k3/8/8/8/8/3p4/4P3/4K3 w - - 0 1',
    square: 'e2',
  },
  {
    title: 'Cavalo',
    description:
      'Move-se em "L": duas casas numa direção e uma casa perpendicular. É a única peça que salta por cima de outras.',
    fen: '4k3/8/8/8/4N3/8/8/4K3 w - - 0 1',
    square: 'e4',
  },
  {
    title: 'Bispo',
    description: 'Move-se livremente na diagonal, sempre pela mesma cor de casa.',
    fen: '4k3/8/8/8/4B3/8/8/4K3 w - - 0 1',
    square: 'e4',
  },
  {
    title: 'Torre',
    description: 'Move-se livremente na horizontal ou na vertical.',
    fen: '4k3/8/8/8/4R3/8/8/4K3 w - - 0 1',
    square: 'e4',
  },
  {
    title: 'Dama',
    description: 'Combina o movimento da torre e do bispo: livre em qualquer direção.',
    fen: '4k3/8/8/8/4Q3/8/8/4K3 w - - 0 1',
    square: 'e4',
  },
  {
    title: 'Rei',
    description:
      'Move-se uma casa em qualquer direção. Nunca se pode mover para uma casa atacada pelo adversário.',
    fen: '8/8/8/4k3/8/4K3/8/8 w - - 0 1',
    square: 'e3',
  },
];

function legalTargetsFrom(fen: string, square: Square): Square[] {
  return new Chess(fen).moves({ square, verbose: true }).map((m) => m.to as Square);
}

// Depois de chess.js aplicar o lance, o campo de "vez de jogar" do FEN
// passa a "b" (é a regra normal do jogo) — mas aqui não há um segundo
// jogador, é sempre a mesma peça branca em destaque a mover-se sozinha
// pela demo. Sem forçar de volta a "w", `legalTargetsFrom` no próximo
// clique devolveria sempre uma lista vazia (chess.js só calcula lances
// para quem tem a vez), travando a demo ao fim do primeiro lance.
function forceWhiteToMove(fen: string): string {
  const parts = fen.split(' ');
  parts[1] = 'w';
  parts[3] = '-'; // en passant deixa de fazer sentido depois de "voltar a vez" a branco
  return parts.join(' ');
}

// Demo jogável (2026-08-26, a pedido do utilizador): mantém o próprio
// estado (fen + casa da peça em destaque) e usa chess.js só para
// validar/aplicar o lance clicado. Não é uma partida real — só a peça
// em destaque desta demo se move, nunca as peças pretas — mas usa a
// mesma interação de clicar-na-peça-depois-no-destino do modo de jogo,
// e reaproveita a animação de deslize do ChessBoard de graça (o slide
// já funciona para qualquer mudança de fen, não só em /jogar).
function InteractiveDemo({ title, description, fen: initialFen, square: initialSquare }: PieceDemo) {
  const [fen, setFen] = useState(initialFen);
  const [square, setSquare] = useState<Square>(initialSquare);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const legalTargets = legalTargetsFrom(fen, square);

  function handleSquareClick(target: Square) {
    if (!legalTargets.includes(target)) return;
    const chess = new Chess(fen);
    chess.move({ from: square, to: target, promotion: 'q' });
    setFen(forceWhiteToMove(chess.fen()));
    setLastMove({ from: square, to: target });
    setSquare(target);
  }

  function handleReset() {
    setFen(initialFen);
    setSquare(initialSquare);
    setLastMove(null);
  }

  return (
    <section className="flex flex-col sm:flex-row gap-4 items-center">
      <div className="w-full sm:w-64 flex flex-col items-center gap-3">
        <ChessBoard
          fen={fen}
          selectedSquare={square}
          legalTargets={legalTargets}
          lastMove={lastMove}
          interactive
          onSquareClick={handleSquareClick}
        />
        <ChipButton color="pink" onClick={handleReset}>
          Reiniciar
        </ChipButton>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-cyan">{title}</h2>
        <p className="text-lilac/80 mt-1">{description}</p>
      </div>
    </section>
  );
}

export default function PecasPage() {
  return (
    <main className="relative min-h-screen max-w-3xl mx-auto p-8 flex flex-col gap-8 overflow-hidden bg-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: 'radial-gradient(circle at 50% -10%, rgba(255,111,165,0.2), transparent 55%)',
        }}
      />
      <div>
        <h1
          className="font-display text-4xl tracking-wide text-gold"
          style={{
            textShadow:
              '-2px -2px 0 #1A0B33, 2px -2px 0 #1A0B33, -2px 2px 0 #1A0B33, 2px 2px 0 #1A0B33, 4px 4px 0 rgba(0,0,0,0.35)',
          }}
        >
          COMO AS PEÇAS SE MOVEM
        </h1>
        <p className="mt-3">
          <ChipButton color="purple" href="/aprender">
            Voltar ao tutorial
          </ChipButton>
        </p>
      </div>
      {DEMOS.map((demo) => (
        <InteractiveDemo key={demo.title} {...demo} />
      ))}
    </main>
  );
}
