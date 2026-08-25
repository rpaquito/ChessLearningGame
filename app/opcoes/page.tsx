'use client';

import type { Difficulty } from '@/lib/chess/difficulty';
import type { PlayerColor } from '@/lib/chess/playerColor';
import type { BackgroundTheme, BoardTheme, PieceStyle } from '@/lib/settings/settings';
import { BACKGROUND_THEMES, BOARD_THEMES } from '@/lib/settings/themes';
import { useSettings } from '@/lib/settings/useSettings';
import { PieceIcon } from '@/components/ChessBoard/PieceIcon';
import { ChipButton } from '@/components/ChipButton/ChipButton';

// Estilo do botão ativo nos dois grupos de seleção (dificuldade/cor) —
// inline em vez de bg-gradient-to-br: mais seguro do que depender do
// nome exato da utility de gradiente do Tailwind v4 (renomeada nalgumas
// versões), e já é o padrão usado no resto deste redesenho.
const ACTIVE_TOGGLE_STYLE = { background: 'linear-gradient(135deg, #00E5FF, #4EA8DE)', color: '#0B2E30' };

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
    <fieldset className="flex flex-col gap-2 opacity-60" aria-disabled="true">
      <legend className="font-medium mb-1 flex items-center gap-2 text-white">
        {title}
        <span className="text-xs rounded-full bg-purple/40 text-lilac px-2 py-0.5 font-normal">
          Brevemente
        </span>
      </legend>
      <div className="rounded-xl border border-dashed border-purple/50 px-3 py-4 text-sm text-lilac/70">
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
  options: { id: T; label: string; previewImage: string; previewImage2?: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-medium mb-1 text-white">{legend}</legend>
      <div className="flex gap-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            aria-pressed={value === opt.id}
            className={`flex flex-col items-center gap-1 rounded-xl border-2 p-1 transition-transform hover:scale-[1.03] ${
              value === opt.id ? 'border-cyan ring-2 ring-cyan' : 'border-purple/40'
            }`}
          >
            {opt.previewImage2 ? (
              <span className="grid h-16 w-16 grid-cols-2 grid-rows-2 overflow-hidden rounded">
                <span style={{ backgroundImage: `url(${opt.previewImage})`, backgroundSize: 'cover' }} />
                <span style={{ backgroundImage: `url(${opt.previewImage2})`, backgroundSize: 'cover' }} />
                <span style={{ backgroundImage: `url(${opt.previewImage2})`, backgroundSize: 'cover' }} />
                <span style={{ backgroundImage: `url(${opt.previewImage})`, backgroundSize: 'cover' }} />
              </span>
            ) : (
              <span
                className="h-16 w-16 rounded bg-cover bg-center"
                style={{ backgroundImage: `url(${opt.previewImage})` }}
              />
            )}
            <span className="text-xs text-lilac">{opt.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const BOARD_THEME_OPTIONS: { id: BoardTheme; label: string; previewImage: string; previewImage2: string }[] = (
  Object.keys(BOARD_THEMES) as BoardTheme[]
).map((id) => ({
  id,
  label: BOARD_THEMES[id].label,
  previewImage: BOARD_THEMES[id].light,
  previewImage2: BOARD_THEMES[id].dark,
}));

const BACKGROUND_THEME_OPTIONS: { id: BackgroundTheme; label: string; previewImage: string }[] = (
  Object.keys(BACKGROUND_THEMES) as BackgroundTheme[]
).map((id) => ({ id, label: BACKGROUND_THEMES[id].label, previewImage: BACKGROUND_THEMES[id].image }));

const PIECE_STYLE_OPTIONS: { id: PieceStyle; label: string }[] = [
  { id: 'classico', label: 'Clássico' },
  { id: 'moderno', label: 'Moderno' },
  { id: 'anime', label: 'Anime' },
];

// Picker próprio em vez de reutilizar ThemePicker: as peças são SVG
// desenhado à mão (ver PieceIcon.tsx), não imagens em public/ — a
// miniatura tem de renderizar o próprio componente, não um background-image.
function PieceStylePicker({
  value,
  onChange,
}: {
  value: PieceStyle;
  onChange: (id: PieceStyle) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-medium mb-1 text-white">Estilo das peças</legend>
      <div className="flex gap-3">
        {PIECE_STYLE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            aria-pressed={value === opt.id}
            className={`flex flex-col items-center gap-1 rounded-xl border-2 p-1 transition-transform hover:scale-[1.03] ${
              value === opt.id ? 'border-cyan ring-2 ring-cyan' : 'border-purple/40'
            }`}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-ink">
              <span className="h-12 w-12 text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.9)]">
                <PieceIcon type="k" style={opt.id} />
              </span>
            </span>
            <span className="text-xs text-lilac">{opt.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function OpcoesPage() {
  const { settings, updateSettings } = useSettings();

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-start gap-8 p-8 overflow-hidden bg-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% -10%, rgba(255,111,165,0.25), transparent 55%)',
        }}
      />
      <h1
        className="relative font-display text-4xl tracking-wide text-gold"
        style={{
          textShadow:
            '-2px -2px 0 #1A0B33, 2px -2px 0 #1A0B33, -2px 2px 0 #1A0B33, 2px 2px 0 #1A0B33, 4px 4px 0 rgba(0,0,0,0.35)',
        }}
      >
        OPÇÕES
      </h1>
      <div className="relative flex flex-col gap-6 max-w-sm w-full">
        <fieldset className="flex flex-col gap-2">
          <legend className="font-medium mb-1 text-white">Dificuldade padrão</legend>
          <div className="flex gap-2">
            {DIFFICULTIES.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => updateSettings({ defaultDifficulty: level })}
                aria-pressed={settings.defaultDifficulty === level}
                style={settings.defaultDifficulty === level ? ACTIVE_TOGGLE_STYLE : undefined}
                className={`flex-1 rounded-xl border-2 px-3 py-2 capitalize font-semibold transition-transform hover:scale-[1.02] ${
                  settings.defaultDifficulty === level
                    ? 'border-transparent shadow-[3px_3px_0_rgba(0,0,0,0.35)]'
                    : 'border-purple/40 text-lilac'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="font-medium mb-1 text-white">Cor padrão</legend>
          <div className="flex gap-2">
            {COLORS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => updateSettings({ defaultColor: value })}
                aria-pressed={settings.defaultColor === value}
                style={settings.defaultColor === value ? ACTIVE_TOGGLE_STYLE : undefined}
                className={`flex-1 rounded-xl border-2 px-3 py-2 font-semibold transition-transform hover:scale-[1.02] ${
                  settings.defaultColor === value
                    ? 'border-transparent shadow-[3px_3px_0_rgba(0,0,0,0.35)]'
                    : 'border-purple/40 text-lilac'
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
        <PieceStylePicker
          value={settings.pieceStyle}
          onChange={(pieceStyle) => updateSettings({ pieceStyle })}
        />
        <ThemePicker
          legend="Imagem de fundo"
          options={BACKGROUND_THEME_OPTIONS}
          value={settings.backgroundTheme}
          onChange={(backgroundTheme) => updateSettings({ backgroundTheme })}
        />
        <ComingSoonSection title="Idioma" />
      </div>

      <ChipButton color="purple" href="/" className="relative">
        Menu inicial
      </ChipButton>
    </main>
  );
}
