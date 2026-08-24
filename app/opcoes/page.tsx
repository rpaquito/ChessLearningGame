'use client';

import Link from 'next/link';
import type { Difficulty } from '@/lib/chess/difficulty';
import type { PlayerColor } from '@/lib/chess/playerColor';
import type { BackgroundTheme, BoardTheme } from '@/lib/settings/settings';
import { BACKGROUND_THEMES, BOARD_THEMES } from '@/lib/settings/themes';
import { useSettings } from '@/lib/settings/useSettings';

const DIFFICULTIES: Difficulty[] = ['facil', 'medio', 'dificil'];
const COLORS: [PlayerColor, string][] = [
  ['white', 'Brancas'],
  ['black', 'Pretas'],
  ['random', 'Aleatório'],
];

// Secção ainda sem funcionalidade — reserva o lugar na interface para os
// sub-projetos seguintes (biblioteca de temas, i18n) sem os implementar
// aqui. Ver docs/superpowers/specs/2026-08-22-menu-settings-redesign-design.md.
function ComingSoonSection({ title }: { title: string }) {
  return (
    <fieldset className="flex flex-col gap-2 opacity-50" aria-disabled="true">
      <legend className="font-medium mb-1 flex items-center gap-2">
        {title}
        <span className="text-xs rounded-full bg-stone-200 text-stone-600 px-2 py-0.5 font-normal">
          Brevemente
        </span>
      </legend>
      <div className="rounded-md border border-dashed border-stone-300 px-3 py-4 text-sm text-stone-500">
        Ainda não disponível.
      </div>
    </fieldset>
  );
}

function ThemePicker<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { id: T; label: string; previewImage: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-medium mb-1">{legend}</legend>
      <div className="flex gap-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            aria-pressed={value === opt.id}
            className={`flex flex-col items-center gap-1 rounded-md border p-1 ${
              value === opt.id ? 'border-emerald-600 ring-2 ring-emerald-600' : 'border-stone-300'
            }`}
          >
            <span
              className="h-16 w-16 rounded bg-cover bg-center"
              style={{ backgroundImage: `url(${opt.previewImage})` }}
            />
            <span className="text-xs">{opt.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const BOARD_THEME_OPTIONS: { id: BoardTheme; label: string; previewImage: string }[] = (
  Object.keys(BOARD_THEMES) as BoardTheme[]
).map((id) => ({ id, label: BOARD_THEMES[id].label, previewImage: BOARD_THEMES[id].light }));

const BACKGROUND_THEME_OPTIONS: { id: BackgroundTheme; label: string; previewImage: string }[] = (
  Object.keys(BACKGROUND_THEMES) as BackgroundTheme[]
).map((id) => ({ id, label: BACKGROUND_THEMES[id].label, previewImage: BACKGROUND_THEMES[id].image }));

export default function OpcoesPage() {
  const { settings, updateSettings } = useSettings();

  return (
    <main className="min-h-dvh flex flex-col items-center justify-start gap-8 p-8">
      <h1 className="text-2xl font-bold">Opções</h1>
      <div className="flex flex-col gap-6 max-w-sm w-full">
        <fieldset className="flex flex-col gap-2">
          <legend className="font-medium mb-1">Dificuldade padrão</legend>
          <div className="flex gap-2">
            {DIFFICULTIES.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => updateSettings({ defaultDifficulty: level })}
                aria-pressed={settings.defaultDifficulty === level}
                className={`flex-1 rounded-md border px-3 py-2 capitalize ${
                  settings.defaultDifficulty === level
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
          <legend className="font-medium mb-1">Cor padrão</legend>
          <div className="flex gap-2">
            {COLORS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => updateSettings({ defaultColor: value })}
                aria-pressed={settings.defaultColor === value}
                className={`flex-1 rounded-md border px-3 py-2 ${
                  settings.defaultColor === value
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-stone-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <ThemePicker
          legend="Tema do tabuleiro"
          options={BOARD_THEME_OPTIONS}
          value={settings.boardTheme}
          onChange={(boardTheme) => updateSettings({ boardTheme })}
        />
        <ComingSoonSection title="Estilo das peças" />
        <ThemePicker
          legend="Imagem de fundo"
          options={BACKGROUND_THEME_OPTIONS}
          value={settings.backgroundTheme}
          onChange={(backgroundTheme) => updateSettings({ backgroundTheme })}
        />
        <ComingSoonSection title="Idioma" />
      </div>

      <Link href="/" className="underline text-stone-600 text-sm">
        Menu inicial
      </Link>
    </main>
  );
}
