'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Difficulty } from '@/lib/chess/difficulty';
import type { PlayerColor } from '@/lib/chess/playerColor';
import { clearSavedGame } from '@/lib/chess/useChessGame';
import { useSettings } from '@/lib/settings/useSettings';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { ToggleGroup } from '@/components/ToggleGroup/ToggleGroup';

// Dificuldade e cor pré-preenchem-se a partir das Definições guardadas,
// mas escolher aqui é só para esta partida — não altera as Definições por
// omissão (isso só acontece em /opcoes).
export function GameSetup() {
  const router = useRouter();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const [difficulty, setDifficulty] = useState<Difficulty>(settings.defaultDifficulty);
  const [color, setColor] = useState<PlayerColor>(settings.defaultColor);

  const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
    { value: 'facil', label: t.difficulty.facil },
    { value: 'medio', label: t.difficulty.medio },
    { value: 'dificil', label: t.difficulty.dificil },
  ];
  const COLOR_OPTIONS: { value: PlayerColor; label: string }[] = [
    { value: 'white', label: t.color.white },
    { value: 'black', label: t.color.black },
    { value: 'random', label: t.color.random },
  ];

  function handleStart() {
    clearSavedGame();
    const params = new URLSearchParams({ mode: 'ai', difficulty, color });
    router.push(`/jogar?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-6 max-w-sm mx-auto w-full">
      <ToggleGroup legend={t.gameSetup.difficultyLegend} options={DIFFICULTY_OPTIONS} value={difficulty} onChange={setDifficulty} />

      <ToggleGroup legend={t.gameSetup.colorLegend} options={COLOR_OPTIONS} value={color} onChange={setColor} />

      <button
        type="button"
        onClick={handleStart}
        className="rounded-xl px-4 py-3 font-bold text-[#0B2E30] shadow-[4px_4px_0_rgba(0,0,0,0.35)] transition-transform hover:scale-[1.02]"
        style={{ background: 'linear-gradient(135deg, #FFD600, #FFA800)' }}
      >
        {t.gameSetup.start}
      </button>
    </div>
  );
}
