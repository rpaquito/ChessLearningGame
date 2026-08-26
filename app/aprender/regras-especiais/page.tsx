import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { InteractiveDemo, type PieceDemo } from '@/components/InteractiveDemo/InteractiveDemo';

const DEMOS: PieceDemo[] = [
  {
    title: 'Roque',
    description:
      'Um lance especial do rei com uma das torres, feito uma única vez por partida. O rei anda ' +
      'duas casas em direção à torre, e a torre salta para o outro lado do rei. Só é permitido se ' +
      'nem o rei nem a torre envolvida já se moveram, se não houver peças entre eles, e se o rei ' +
      'não estiver em xeque nem passar por uma casa atacada.',
    fen: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
    square: 'e1',
  },
  {
    title: 'En passant',
    description:
      'Se um peão adversário andar duas casas de uma vez e ficar ao lado de um peão teu, podes ' +
      'capturá-lo como se ele tivesse andado apenas uma casa — mas só no lance imediatamente a ' +
      'seguir.',
    fen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1',
    square: 'e5',
  },
  {
    title: 'Promoção',
    description:
      'Quando um peão chega à última fileira, é promovido a qualquer outra peça (menos rei) — na ' +
      'grande maioria dos casos, a dama, por ser a peça mais forte.',
    // O rei preto tem de ficar fora de e8 — nesta demo o peão precisa de
    // conseguir mesmo empurrar até à última fileira e promover (ao
    // contrário da versão estática original, que só ilustrava a ideia
    // sem ninguém alguma vez tentar jogar o lance).
    fen: 'k7/4P3/8/8/8/8/8/4K3 w - - 0 1',
    square: 'e7',
  },
];

export default function RegrasEspeciaisPage() {
  return (
    <main className="relative min-h-screen max-w-3xl mx-auto p-8 flex flex-col gap-8 overflow-hidden bg-ink">
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <div>
        <PageTitle>REGRAS ESPECIAIS</PageTitle>
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
