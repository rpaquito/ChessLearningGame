import { ChessBoard } from '@/components/ChessBoard/ChessBoard';
import { ChipButton } from '@/components/ChipButton/ChipButton';

export default function FimDeJogoPage() {
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
          FIM DE JOGO
        </h1>
        <p className="mt-3">
          <ChipButton color="purple" href="/aprender">
            Voltar ao tutorial
          </ChipButton>
        </p>
      </div>

      <section className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-64">
          <ChessBoard fen="4k3/8/8/8/8/8/8/4R2K b - - 0 1" checkSquare="e8" interactive={false} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-cyan">Xeque</h2>
          <p className="text-lilac/80 mt-1">
            O rei está sob ataque direto. Quem está em xeque precisa, no seu próximo lance, sair
            do xeque — movendo o rei, bloqueando o ataque ou capturando a peça que ataca.
          </p>
        </div>
      </section>

      <section className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-64">
          <ChessBoard fen="4R1k1/5ppp/8/8/8/8/8/6K1 b - - 0 1" checkSquare="g8" interactive={false} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-cyan">Xeque-mate</h2>
          <p className="text-lilac/80 mt-1">
            Um xeque do qual não há como escapar — o jogo termina imediatamente e quem deu o mate
            vence.
          </p>
        </div>
      </section>

      <section className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-64">
          <ChessBoard fen="7k/8/6Q1/6K1/8/8/8/8 b - - 0 1" interactive={false} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-cyan">Afogamento (empate)</h2>
          <p className="text-lilac/80 mt-1">
            Quando o jogador da vez não está em xeque, mas não tem nenhum lance legal disponível,
            a partida termina empatada.
          </p>
        </div>
      </section>

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
