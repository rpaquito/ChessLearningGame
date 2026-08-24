import type { BackgroundTheme, BoardTheme } from './settings';

export interface BoardThemeInfo {
  label: string;
  light: string;
  dark: string;
}

export interface BackgroundThemeInfo {
  label: string;
  image: string;
}

/**
 * Registo único dos assets de cada tema — o resto da app nunca escreve um
 * caminho de imagem de tema diretamente, só lê daqui (ChessBoard.tsx,
 * app/page.tsx, app/jogar/page.tsx, app/opcoes/page.tsx).
 */
export const BOARD_THEMES: Record<BoardTheme, BoardThemeInfo> = {
  carvalho: {
    label: 'Carvalho',
    light: '/board/light-square.webp',
    dark: '/board/dark-square.webp',
  },
  'ebano-bordo': {
    label: 'Ébano e bordo',
    light: '/board/ebano-bordo-light-square.webp',
    dark: '/board/ebano-bordo-dark-square.webp',
  },
};

export const BACKGROUND_THEMES: Record<BackgroundTheme, BackgroundThemeInfo> = {
  classico: { label: 'Clássico', image: '/menu/background.webp' },
  noturno: { label: 'Noturno', image: '/menu/background-noturno.webp' },
};
