'use client';

import type { ReactNode } from 'react';
import type { Difficulty } from '@/lib/chess/difficulty';
import type { PlayerColor } from '@/lib/chess/playerColor';
import type { BackgroundTheme, BoardTheme, PieceStyle } from '@/lib/settings/settings';
import { BACKGROUND_THEMES, BOARD_THEMES } from '@/lib/settings/themes';
import { useSettings } from '@/lib/settings/useSettings';
import { PieceIcon } from '@/components/ChessBoard/PieceIcon';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { useToast } from '@/components/Toast/ToastProvider';
import { ACTIVE_TOGGLE_STYLE } from '@/lib/ui/activeToggleStyle';

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

// Shell de botão partilhado por todos os seletores de opção desta página
// (tema do tabuleiro, imagem de fundo, estilo das peças) — só a miniatura
// lá dentro muda de um para o outro (imagem de fundo vs. PieceIcon
// desenhado), por isso é o único bocado que cada chamador personaliza via
// `renderPreview`.
function OptionPicker<T extends string, Opt extends { id: T; label: string }>({
  legend,
  options,
  value,
  onChange,
  renderPreview,
}: {
  legend: string;
  options: Opt[];
  value: T;
  onChange: (id: T) => void;
  renderPreview: (opt: Opt) => ReactNode;
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
            {renderPreview(opt)}
            <span className="text-xs text-lilac">{opt.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ThemeSwatch({ previewImage, previewImage2 }: { previewImage: string; previewImage2?: string }) {
  if (previewImage2) {
    return (
      <span className="grid h-16 w-16 grid-cols-2 grid-rows-2 overflow-hidden rounded">
        <span style={{ backgroundImage: `url(${previewImage})`, backgroundSize: 'cover' }} />
        <span style={{ backgroundImage: `url(${previewImage2})`, backgroundSize: 'cover' }} />
        <span style={{ backgroundImage: `url(${previewImage2})`, backgroundSize: 'cover' }} />
        <span style={{ backgroundImage: `url(${previewImage})`, backgroundSize: 'cover' }} />
      </span>
    );
  }
  return (
    <span
      className="h-16 w-16 rounded bg-cover bg-center"
      style={{ backgroundImage: `url(${previewImage})` }}
    />
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

export default function OpcoesPage() {
  const { settings, updateSettings } = useSettings();
  const toast = useToast();

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-start gap-8 p-8 overflow-hidden bg-ink">
      <PageGlow pinkOpacity={0.25} />
      <PageTitle className="relative">OPÇÕES</PageTitle>
      <div className="relative flex flex-col gap-6 max-w-sm w-full">
        <fieldset className="flex flex-col gap-2">
          <legend className="font-medium mb-1 text-white">Dificuldade padrão</legend>
          <div className="flex gap-2">
            {DIFFICULTIES.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => {
                  updateSettings({ defaultDifficulty: level });
                  toast.show('Dificuldade por omissão alterada.');
                }}
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
                onClick={() => {
                  updateSettings({ defaultColor: value });
                  toast.show('Cor por omissão alterada.');
                }}
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

        <OptionPicker
          legend="Tema do tabuleiro"
          options={BOARD_THEME_OPTIONS}
          value={settings.boardTheme}
          onChange={(boardTheme) => {
            updateSettings({ boardTheme });
            toast.show('Tema do tabuleiro alterado.');
          }}
          renderPreview={(opt) => (
            <ThemeSwatch previewImage={opt.previewImage} previewImage2={opt.previewImage2} />
          )}
        />
        <OptionPicker
          legend="Estilo das peças"
          options={PIECE_STYLE_OPTIONS}
          value={settings.pieceStyle}
          onChange={(pieceStyle) => {
            updateSettings({ pieceStyle });
            toast.show('Estilo das peças alterado.');
          }}
          renderPreview={(opt) => (
            <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-ink">
              <span className="h-12 w-12 text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.9)]">
                <PieceIcon type="k" style={opt.id} />
              </span>
            </span>
          )}
        />
        <OptionPicker
          legend="Imagem de fundo"
          options={BACKGROUND_THEME_OPTIONS}
          value={settings.backgroundTheme}
          onChange={(backgroundTheme) => {
            updateSettings({ backgroundTheme });
            toast.show('Imagem de fundo alterada.');
          }}
          renderPreview={(opt) => <ThemeSwatch previewImage={opt.previewImage} />}
        />
        <ComingSoonSection title="Idioma" />
      </div>

      <ChipButton color="purple" href="/" className="relative">
        Menu inicial
      </ChipButton>
    </main>
  );
}
