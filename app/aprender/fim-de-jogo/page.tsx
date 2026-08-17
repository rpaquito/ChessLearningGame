import Link from 'next/link';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';

export default function FimDeJogoPage() {
  return (
    <main className="min-h-screen max-w-3xl mx-auto p-8 flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Fim de jogo</h1>
        <p className="text-stone-600 mt-2">
          <Link href="/aprender" className="underline text-sky-700">
            Voltar ao tutorial
          </Link>
        </p>
      </div>

      <section className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-64">
          <ChessBoard fen="4k3/8/8/8/8/8/8/4R2K b - - 0 1" checkSquare="e8" interactive={false} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Xeque</h2>
          <p className="text-stone-600 mt-1">
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
          <h2 className="text-xl font-semibold">Xeque-mate</h2>
          <p className="text-stone-600 mt-1">
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
          <h2 className="text-xl font-semibold">Afogamento (empate)</h2>
          <p className="text-stone-600 mt-1">
            Quando o jogador da vez não está em xeque, mas não tem nenhum lance legal disponível,
            a partida termina empatada.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Outros empates</h2>
        <p className="text-stone-600 mt-1">
          A partida também empata por repetição tripla da mesma posição, pela regra dos 50 lances
          sem captura ou movimento de peão, ou quando não há material suficiente no tabuleiro para
          dar mate.
        </p>
      </section>
    </main>
  );
}
