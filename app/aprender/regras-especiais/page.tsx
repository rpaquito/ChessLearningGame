import { ChessBoard } from '@/components/ChessBoard/ChessBoard';
import { ChipButton } from '@/components/ChipButton/ChipButton';

export default function RegrasEspeciaisPage() {
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
          REGRAS ESPECIAIS
        </h1>
        <p className="mt-3">
          <ChipButton color="purple" href="/aprender">
            Voltar ao tutorial
          </ChipButton>
        </p>
      </div>

      <section className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-64">
          <ChessBoard fen="r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1" interactive={false} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-cyan">Roque</h2>
          <p className="text-lilac/80 mt-1">
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
          <h2 className="text-xl font-semibold text-cyan">En passant</h2>
          <p className="text-lilac/80 mt-1">
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
          <h2 className="text-xl font-semibold text-cyan">Promoção</h2>
          <p className="text-lilac/80 mt-1">
            Quando um peão chega à última fileira, é promovido a qualquer outra peça (menos rei) —
            na grande maioria dos casos, a dama, por ser a peça mais forte.
          </p>
        </div>
      </section>
    </main>
  );
}
