'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Difficulty } from '@/lib/chess/difficulty';
import { STORAGE_KEY } from '@/lib/chess/useChessGame';

type Mode = 'ai' | 'local';
type PlayerColor = 'white' | 'black' | 'random';

export function ModeSelector() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('ai');
  const [difficulty, setDifficulty] = useState<Difficulty>('facil');
  const [color, setColor] = useState<PlayerColor>('white');

  function handleStart() {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // localStorage indisponível — nada para limpar, segue em frente
      }
    }
    const params = new URLSearchParams({ mode });
    if (mode === 'ai') {
      params.set('difficulty', difficulty);
      params.set('color', color);
    }
    router.push(`/jogar?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-6 max-w-sm mx-auto">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('ai')}
          aria-pressed={mode === 'ai'}
          className={`flex-1 rounded-md border px-4 py-3 ${
            mode === 'ai' ? 'bg-sky-600 text-white border-sky-600' : 'border-stone-300'
          }`}
        >
          Jogar contra o computador
        </button>
        <button
          type="button"
          onClick={() => setMode('local')}
          aria-pressed={mode === 'local'}
          className={`flex-1 rounded-md border px-4 py-3 ${
            mode === 'local' ? 'bg-sky-600 text-white border-sky-600' : 'border-stone-300'
          }`}
        >
          Dois jogadores
        </button>
      </div>

      {mode === 'ai' && (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className="font-medium mb-1">Dificuldade</legend>
            <div className="flex gap-2">
              {(['facil', 'medio', 'dificil'] as Difficulty[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  aria-pressed={difficulty === level}
                  className={`flex-1 rounded-md border px-3 py-2 capitalize ${
                    difficulty === level
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-stone-300'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="font-medium mb-1">Suas peças</legend>
            <div className="flex gap-2">
              {(
                [
                  ['white', 'Brancas'],
                  ['black', 'Pretas'],
                  ['random', 'Aleatório'],
                ] as [PlayerColor, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setColor(value)}
                  aria-pressed={color === value}
                  className={`flex-1 rounded-md border px-3 py-2 ${
                    color === value
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-stone-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        </>
      )}

      <button
        type="button"
        onClick={handleStart}
        className="rounded-md bg-stone-900 text-white px-4 py-3 font-semibold"
      >
        Começar
      </button>
    </div>
  );
}
