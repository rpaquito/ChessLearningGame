import Link from 'next/link';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';

export default function RegrasEspeciaisPage() {
  return (
    <main className="min-h-screen max-w-3xl mx-auto p-8 flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Regras especiais</h1>
        <p className="text-stone-600 mt-2">
          <Link href="/aprender" className="underline text-sky-700">
            Voltar ao tutorial
          </Link>
        </p>
      </div>

      <section className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-64">
          <ChessBoard fen="r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1" interactive={false} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Roque</h2>
          <p className="text-stone-600 mt-1">
            Um lance especial do rei com uma das torres, feito uma única vez por partida. O rei
            anda duas casas em direção à torre, e a torre salta para o outro lado do rei. Só é
            permitido se nem o rei nem a torre envolvida já se moveram, se não houver peças entre
            eles, e se o rei não estiver em xeque nem passar por uma casa atacada.
          </p>
        </div>
      </section>

      <section className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-64">
          <ChessBoard fen="4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1" interactive={false} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">En passant</h2>
          <p className="text-stone-600 mt-1">
            Se um peão adversário andar duas casas de uma vez e ficar ao lado de um peão teu,
            podes capturá-lo como se ele tivesse andado apenas uma casa — mas só no lance
            imediatamente a seguir.
          </p>
        </div>
      </section>

      <section className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-64">
          <ChessBoard fen="4k3/4P3/8/8/8/8/8/4K3 w - - 0 1" interactive={false} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Promoção</h2>
          <p className="text-stone-600 mt-1">
            Quando um peão chega à última fileira, é promovido a qualquer outra peça (menos rei) —
            na grande maioria dos casos, a dama, por ser a peça mais forte.
          </p>
        </div>
      </section>
    </main>
  );
}
