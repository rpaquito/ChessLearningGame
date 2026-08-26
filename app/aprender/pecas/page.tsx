import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { InteractiveDemo, type PieceDemo } from '@/components/InteractiveDemo/InteractiveDemo';

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
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <div>
        <PageTitle>COMO AS PEÇAS SE MOVEM</PageTitle>
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
