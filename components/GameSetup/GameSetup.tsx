'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Difficulty } from '@/lib/chess/difficulty';
import type { PlayerColor } from '@/lib/chess/playerColor';
import { clearSavedGame } from '@/lib/chess/useChessGame';
import { useSettings } from '@/lib/settings/useSettings';

const DIFFICULTIES: Difficulty[] = ['facil', 'medio', 'dificil'];
const COLORS: [PlayerColor, string][] = [
  ['white', 'Brancas'],
  ['black', 'Pretas'],
  ['random', 'Aleatório'],
];

// Dificuldade e cor pré-preenchem-se a partir das Definições guardadas,
// mas escolher aqui é só para esta partida — não altera as Definições por
// omissão (isso só acontece em /opcoes).
export function GameSetup() {
  const router = useRouter();
  const { settings } = useSettings();
  const [difficulty, setDifficulty] = useState<Difficulty>(settings.defaultDifficulty);
  const [color, setColor] = useState<PlayerColor>(settings.defaultColor);

  function handleStart() {
    clearSavedGame();
    const params = new URLSearchParams({ mode: 'ai', difficulty, color });
    router.push(`/jogar?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-6 max-w-sm mx-auto w-full">
      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium mb-1">Dificuldade</legend>
        <div className="flex gap-2">
          {DIFFICULTIES.map((level) => (
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
        <legend className="font-medium mb-1">As tuas peças</legend>
        <div className="flex gap-2">
          {COLORS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setColor(value)}
              aria-pressed={color === value}
              className={`flex-1 rounded-md border px-3 py-2 ${
                color === value ? 'bg-emerald-600 text-white border-emerald-600' : 'border-stone-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

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
