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

// Mesmo estilo do botão ativo que app/opcoes/page.tsx (grupos de seleção
// idênticos nas duas páginas) — inline em vez de bg-gradient-to-br, ver
// nota lá.
const ACTIVE_TOGGLE_STYLE = { background: 'linear-gradient(135deg, #00E5FF, #4EA8DE)', color: '#0B2E30' };

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
        <legend className="font-medium mb-1 text-white">Dificuldade</legend>
        <div className="flex gap-2">
          {DIFFICULTIES.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setDifficulty(level)}
              aria-pressed={difficulty === level}
              style={difficulty === level ? ACTIVE_TOGGLE_STYLE : undefined}
              className={`flex-1 rounded-xl border-2 px-3 py-2 capitalize font-semibold transition-transform hover:scale-[1.02] ${
                difficulty === level ? 'border-transparent shadow-[3px_3px_0_rgba(0,0,0,0.35)]' : 'border-purple/40 text-lilac'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium mb-1 text-white">As tuas peças</legend>
        <div className="flex gap-2">
          {COLORS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setColor(value)}
              aria-pressed={color === value}
              style={color === value ? ACTIVE_TOGGLE_STYLE : undefined}
              className={`flex-1 rounded-xl border-2 px-3 py-2 font-semibold transition-transform hover:scale-[1.02] ${
                color === value ? 'border-transparent shadow-[3px_3px_0_rgba(0,0,0,0.35)]' : 'border-purple/40 text-lilac'
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
        className="rounded-xl px-4 py-3 font-bold text-[#0B2E30] shadow-[4px_4px_0_rgba(0,0,0,0.35)] transition-transform hover:scale-[1.02]"
        style={{ background: 'linear-gradient(135deg, #FFD600, #FFA800)' }}
      >
        Começar
      </button>
    </div>
  );
}
