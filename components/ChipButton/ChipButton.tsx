import { forwardRef, type ReactNode } from 'react';
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
  disabled?: boolean;
  className?: string;
}

const BASE_CLASS =
  'inline-block font-semibold text-sm px-4 py-2 rounded-lg shadow-[3px_3px_0_rgba(0,0,0,0.35)] ' +
  '[clip-path:polygon(0_0,100%_0,100%_82%,93%_100%,0_100%)] transition-transform hover:scale-[1.03]';

// `ref` só é reencaminhada para o botão nativo (variante sem `href`) — o
// único caso com consumidores até agora (OpeningStudy, para gerir foco
// manualmente ao desativar um botão perto de um limite). A variante
// `<Link>` ignora a ref recebida; adicionar suporte aí só quando um
// consumidor real precisar.
export const ChipButton = forwardRef<HTMLButtonElement, ChipButtonProps>(function ChipButton(
  { color, children, href, onClick, disabled = false, className = '' },
  ref
) {
  const style = { background: CHIP_GRADIENT[color], color: CHIP_TEXT[color] };
  const disabledClasses = disabled ? ' opacity-40 pointer-events-none' : '';
  const classes = `${BASE_CLASS}${disabledClasses} ${className}`.trim();

  if (href) {
    // <a> não tem `disabled` nativo — `pointer-events-none` (em
    // `disabledClasses`) já bloqueia o clique, mas sem isto o link
    // continua alcançável e ativável por Tab+Enter.
    return (
      <Link
        href={href}
        style={style}
        className={classes}
        onClick={onClick}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
      >
        {children}
      </Link>
    );
  }

  return (
    <button ref={ref} type="button" onClick={onClick} disabled={disabled} style={style} className={classes}>
      {children}
    </button>
  );
});
