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
  sakura: {
    label: 'Sakura',
    light: '/board/sakura-light-square.webp',
    dark: '/board/sakura-dark-square.webp',
  },
  nebulosa: {
    label: 'Nebulosa',
    light: '/board/nebulosa-light-square.webp',
    dark: '/board/nebulosa-dark-square.webp',
  },
  neon: {
    label: 'Néon',
    light: '/board/neon-light-square.webp',
    dark: '/board/neon-dark-square.webp',
  },
};

export const BACKGROUND_THEMES: Record<BackgroundTheme, BackgroundThemeInfo> = {
  templo: { label: 'Templo', image: '/menu/background-templo.webp' },
  dojo: { label: 'Dojo', image: '/menu/background-dojo.webp' },
  cosmico: { label: 'Cósmico', image: '/menu/background-cosmico.webp' },
};
