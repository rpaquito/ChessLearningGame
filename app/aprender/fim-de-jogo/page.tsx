import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { InteractiveDemo, type PieceDemo } from '@/components/InteractiveDemo/InteractiveDemo';

// As três demos abaixo têm o rei preto como protagonista (não o branco,
// como em pecas/regras-especiais) — é o lado em xeque/mate/afogamento
// que faz sentido destacar aqui. InteractiveDemo lê a cor diretamente da
// posição inicial, por isso isto não precisa de nenhuma prop extra.
const DEMOS: PieceDemo[] = [
  {
    title: 'Xeque',
    description:
      'O rei está sob ataque direto. Quem está em xeque precisa, no seu próximo lance, sair do ' +
      'xeque — movendo o rei, bloqueando o ataque ou capturando a peça que ataca.',
    fen: '4k3/8/8/8/8/8/8/4R2K b - - 0 1',
    square: 'e8',
  },
  {
    title: 'Xeque-mate',
    description:
      'Um xeque do qual não há como escapar — o jogo termina imediatamente e quem deu o mate ' +
      'vence. Clica no rei: não há nenhuma casa livre, é mesmo o fim da partida.',
    fen: '4R1k1/5ppp/8/8/8/8/8/6K1 b - - 0 1',
    square: 'g8',
  },
  {
    title: 'Afogamento (empate)',
    description:
      'Quando o jogador da vez não está em xeque, mas não tem nenhum lance legal disponível, a ' +
      'partida termina empatada. Clica no rei: também aqui não há para onde ir, mas ninguém o está ' +
      'a atacar.',
    fen: '7k/8/6Q1/6K1/8/8/8/8 b - - 0 1',
    square: 'h8',
  },
];

export default function FimDeJogoPage() {
  return (
    <main className="relative min-h-screen max-w-3xl mx-auto p-8 flex flex-col gap-8 overflow-hidden bg-ink">
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <div>
        <PageTitle>FIM DE JOGO</PageTitle>
        <p className="mt-3">
          <ChipButton color="purple" href="/aprender">
            Voltar ao tutorial
          </ChipButton>
        </p>
      </div>
      {DEMOS.map((demo) => (
        <InteractiveDemo key={demo.title} {...demo} />
      ))}

      <section>
        <h2 className="text-xl font-semibold text-cyan">Outros empates</h2>
        <p className="text-lilac/80 mt-1">
          A partida também empata por repetição tripla da mesma posição, pela regra dos 50 lances
          sem captura ou movimento de peão, ou quando não há material suficiente no tabuleiro para
          dar mate.
        </p>
      </section>
    </main>
  );
}
