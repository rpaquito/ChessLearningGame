'use client';

import type { ReactNode } from 'react';
import type { Difficulty } from '@/lib/chess/difficulty';
import type { PlayerColor } from '@/lib/chess/playerColor';
import type { BackgroundTheme, BoardTheme, PieceStyle } from '@/lib/settings/settings';
import { BACKGROUND_THEMES, BOARD_THEMES } from '@/lib/settings/themes';
import { useSettings } from '@/lib/settings/useSettings';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { Locale } from '@/lib/i18n/types';
import { PieceIcon } from '@/components/ChessBoard/PieceIcon';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { ToggleGroup } from '@/components/ToggleGroup/ToggleGroup';
import { useToast } from '@/components/Toast/ToastProvider';

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

export default function OpcoesPage() {
  const { settings, updateSettings } = useSettings();
  const { t } = useTranslation();
  const toast = useToast();

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
  const PIECE_STYLE_OPTIONS: { id: PieceStyle; label: string }[] = [
    { id: 'classico', label: t.pieceStyleLabel.classico },
    { id: 'moderno', label: t.pieceStyleLabel.moderno },
    { id: 'anime', label: t.pieceStyleLabel.anime },
  ];
  const LANGUAGE_OPTIONS: { value: Locale; label: string }[] = [
    { value: 'pt', label: t.opcoes.portuguese },
    { value: 'en', label: t.opcoes.english },
  ];

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-start gap-8 p-8 overflow-hidden bg-ink">
      <PageGlow pinkOpacity={0.25} />
      <PageTitle className="relative">{t.opcoes.title}</PageTitle>
      <div className="relative flex flex-col gap-6 max-w-sm w-full">
        <ToggleGroup
          legend={t.opcoes.defaultDifficultyLegend}
          options={DIFFICULTY_OPTIONS}
          value={settings.defaultDifficulty}
          onChange={(level) => {
            updateSettings({ defaultDifficulty: level });
            toast.show(t.opcoes.toastDifficultyChanged);
          }}
        />

        <ToggleGroup
          legend={t.opcoes.defaultColorLegend}
          options={COLOR_OPTIONS}
          value={settings.defaultColor}
          onChange={(value) => {
            updateSettings({ defaultColor: value });
            toast.show(t.opcoes.toastColorChanged);
          }}
        />

        <OptionPicker
          legend={t.opcoes.boardTheme}
          options={BOARD_THEME_OPTIONS}
          value={settings.boardTheme}
          onChange={(boardTheme) => {
            updateSettings({ boardTheme });
            toast.show(t.opcoes.toastBoardThemeChanged);
          }}
          renderPreview={(opt) => (
            <ThemeSwatch previewImage={opt.previewImage} previewImage2={opt.previewImage2} />
          )}
        />
        <OptionPicker
          legend={t.opcoes.pieceStyle}
          options={PIECE_STYLE_OPTIONS}
          value={settings.pieceStyle}
          onChange={(pieceStyle) => {
            updateSettings({ pieceStyle });
            toast.show(t.opcoes.toastPieceStyleChanged);
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
          legend={t.opcoes.backgroundImage}
          options={BACKGROUND_THEME_OPTIONS}
          value={settings.backgroundTheme}
          onChange={(backgroundTheme) => {
            updateSettings({ backgroundTheme });
            toast.show(t.opcoes.toastBackgroundChanged);
          }}
          renderPreview={(opt) => <ThemeSwatch previewImage={opt.previewImage} />}
        />
        <ToggleGroup
          legend={t.opcoes.language}
          options={LANGUAGE_OPTIONS}
          value={settings.language}
          onChange={(language) => {
            updateSettings({ language });
            toast.show(t.opcoes.toastLanguageChanged);
          }}
        />
      </div>

      <ChipButton color="purple" href="/" className="relative">
        {t.common.mainMenu}
      </ChipButton>
    </main>
  );
}
