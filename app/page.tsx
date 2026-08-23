'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Show, UserButton } from '@clerk/nextjs';
import { clearSavedGame } from '@/lib/chess/useChessGame';
import { RulesModal } from '@/components/RulesModal/RulesModal';

export default function HomePage() {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <main
      className="min-h-dvh flex flex-col items-center gap-8 p-8 bg-stone-900 bg-cover bg-center"
      style={{ backgroundImage: 'url(/menu/background.webp)' }}
    >
      <div className="w-full max-w-sm flex justify-end text-sm">
        <Show when="signed-out">
          <Link href="/entrar" className="underline text-sky-200">
            Entrar
          </Link>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>

      <h1 className="text-3xl font-bold text-white">Xadrez</h1>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Link
          href="/configurar"
          className="relative flex items-center justify-center rounded-md overflow-hidden h-32 bg-stone-800 bg-cover bg-center"
          style={{ backgroundImage: 'url(/menu/vs-cpu.webp)' }}
        >
          <span className="relative bg-black/50 text-white text-lg font-semibold px-4 py-2 rounded">
            Jogar contra o computador
          </span>
        </Link>

        <Link
          href="/jogar?mode=local"
          onClick={() => clearSavedGame()}
          className="relative flex items-center justify-center rounded-md overflow-hidden h-32 bg-stone-800 bg-cover bg-center"
          style={{ backgroundImage: 'url(/menu/two-players.webp)' }}
        >
          <span className="relative bg-black/50 text-white text-lg font-semibold px-4 py-2 rounded">
            Dois jogadores
          </span>
        </Link>

        <Link
          href="/opcoes"
          className="relative flex items-center justify-center rounded-md overflow-hidden h-20 bg-stone-700 bg-cover bg-center"
          style={{ backgroundImage: 'url(/menu/options.webp)' }}
        >
          <span className="relative bg-black/50 text-white font-semibold px-4 py-2 rounded">
            Opções
          </span>
        </Link>
      </div>

      <p className="text-stone-200 text-sm text-center">
        <Link href="/aprender" className="underline">
          Ver tutorial
        </Link>{' '}
        ·{' '}
        <button type="button" onClick={() => setRulesOpen(true)} className="underline">
          Regras do jogo
        </button>
      </p>

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </main>
  );
}
