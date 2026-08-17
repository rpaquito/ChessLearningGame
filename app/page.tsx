'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ModeSelector } from '@/components/ModeSelector/ModeSelector';
import { RulesModal } from '@/components/RulesModal/RulesModal';

export default function HomePage() {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 p-8">
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
