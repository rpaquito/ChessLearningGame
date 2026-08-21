'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Show, UserButton } from '@clerk/nextjs';
import { ModeSelector } from '@/components/ModeSelector/ModeSelector';
import { RulesModal } from '@/components/RulesModal/RulesModal';

export default function HomePage() {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 p-8">
      <div className="w-full max-w-sm flex justify-end text-sm">
        <Show when="signed-out">
          <Link href="/entrar" className="underline text-sky-700">
            Entrar
          </Link>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
      <div className="text-center">
        <h1 className="text-3xl font-bold">Xadrez</h1>
        <p className="text-stone-600 mt-2">
          Joga e aprende a jogar melhor.{' '}
          <Link href="/aprender" className="underline text-sky-700">
            Ver tutorial
          </Link>{' '}
          ·{' '}
          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="underline text-sky-700"
          >
            Regras do jogo
          </button>
        </p>
      </div>
      <ModeSelector />
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </main>
  );
}
