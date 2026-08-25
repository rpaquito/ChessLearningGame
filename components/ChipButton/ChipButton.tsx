import type { ReactNode } from 'react';
import Link from 'next/link';

export type ChipColor = 'purple' | 'cyan' | 'pink' | 'gold';

// Mesma linguagem visual das tiles do menu (corte diagonal, sombra
// "carimbada"), só a uma escala secundária — usado para QUALQUER link ou
// ação de nível de página na app, nunca mais texto sublinhado a solo. Ver
// docs/superpowers/specs do redesenho "anime" (2026-08-25).
const CHIP_GRADIENT: Record<ChipColor, string> = {
  purple: 'linear-gradient(135deg, #B87FDB, #7B3FA0)',
  cyan: 'linear-gradient(135deg, #7DE0E6, #3FA9B0)',
  pink: 'linear-gradient(135deg, #FF9AC2, #FF6FA5)',
  gold: 'linear-gradient(135deg, #FFE066, #FFD600)',
};

const CHIP_TEXT: Record<ChipColor, string> = {
  purple: '#FFF6FF',
  cyan: '#0B2E30',
  pink: '#3A0B1F',
  gold: '#3A2A00',
};

export interface ChipButtonProps {
  color: ChipColor;
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

const BASE_CLASS =
  'inline-block font-semibold text-sm px-4 py-2 rounded-lg shadow-[3px_3px_0_rgba(0,0,0,0.35)] ' +
  '[clip-path:polygon(0_0,100%_0,100%_82%,93%_100%,0_100%)] transition-transform hover:scale-[1.03]';

export function ChipButton({ color, children, href, onClick, className = '' }: ChipButtonProps) {
  const style = { background: CHIP_GRADIENT[color], color: CHIP_TEXT[color] };
  const classes = `${BASE_CLASS} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} style={style} className={classes} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} style={style} className={classes}>
      {children}
    </button>
  );
}
