'use client';

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
      {DEMOS.map((demo) => {
        const chess = new Chess(demo.fen);
        const legalTargets = chess
          .moves({ square: demo.square, verbose: true })
          .map((m) => m.to as Square);
        return (
          <section key={demo.title} className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-full sm:w-64">
              <ChessBoard
                fen={demo.fen}
                selectedSquare={demo.square}
                legalTargets={legalTargets}
                interactive={false}
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-cyan">{demo.title}</h2>
              <p className="text-lilac/80 mt-1">{demo.description}</p>
            </div>
          </section>
        );
      })}
    </main>
  );
}
