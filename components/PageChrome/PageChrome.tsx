import type { ReactNode } from 'react';

const STROKE_COLOR = '#1A0B33';

/**
 * text-shadow "banda-desenhada" (contorno sólido, sem blur) usado em todos
 * os títulos dourados da app — extraído porque o mesmo valor (só a variar
 * a largura do contorno e a queda de sombra) estava copiado à mão em mais
 * de 8 páginas e no RulesModal. `softDropPx`, quando indicado, acrescenta
 * a sombra projetada a 45° que os `<h1>` de página usam (mas os labels
 * menores das tiles do menu e o `<h2>` do RulesModal não têm).
 */
export function titleStroke(width: 1 | 2, softDropPx?: number): string {
  const corners = [
    `-${width}px -${width}px 0 ${STROKE_COLOR}`,
    `${width}px -${width}px 0 ${STROKE_COLOR}`,
    `-${width}px ${width}px 0 ${STROKE_COLOR}`,
    `${width}px ${width}px 0 ${STROKE_COLOR}`,
  ];
  if (softDropPx) corners.push(`${softDropPx}px ${softDropPx}px 0 rgba(0,0,0,0.35)`);
  return corners.join(', ');
}

export interface PageTitleProps {
  as?: 'h1' | 'h2';
  /** Classe Tailwind de tamanho de fonte, ex. "text-4xl". */
  size?: string;
  strokeWidth?: 1 | 2;
  /** Por omissão 4px quando strokeWidth=2, sem queda quando strokeWidth=1. */
  softDrop?: number;
  className?: string;
  children: ReactNode;
}

/** Título dourado com contorno "banda-desenhada" — ver `titleStroke` acima. */
export function PageTitle({
  as: Tag = 'h1',
  size = 'text-4xl',
  strokeWidth = 2,
  softDrop = strokeWidth === 2 ? 4 : undefined,
  className = '',
  children,
}: PageTitleProps) {
  return (
    <Tag
      className={`font-display tracking-wide text-gold ${size} ${className}`.trim()}
      style={{ textShadow: titleStroke(strokeWidth, softDrop) }}
    >
      {children}
    </Tag>
  );
}

export interface PageGlowProps {
  /**
   * "fixed" para páginas com conteúdo scrollável (não pode entrar no
   * fluxo, por isso ganha `-z-10`); "absolute" para ecrãs de vista única,
   * onde o `<main>` já corta overflow e os irmãos seguintes têm `relative`
   * próprio para ficarem por cima.
   */
  position?: 'fixed' | 'absolute';
  pinkOpacity?: number;
  /** [topo, fundo] — esbatimento adicional para o roxo escuro, só usado
   * onde o fundo por baixo precisa de mais contraste (menu, /jogar). */
  darken?: [number, number];
}

/**
 * Camada de identidade (brilho radial rosa, com esbatimento opcional para
 * o roxo escuro) repetida em quase todas as páginas — ver CLAUDE.md,
 * redesenho "anime".
 */
export function PageGlow({ position = 'absolute', pinkOpacity = 0.2, darken }: PageGlowProps) {
  const layers = [
    `radial-gradient(circle at 50% -10%, rgba(255,111,165,${pinkOpacity}), transparent 55%)`,
  ];
  if (darken) {
    layers.push(
      `linear-gradient(180deg, rgba(26,11,51,${darken[0]}) 0%, rgba(26,11,51,${darken[1]}) 100%)`
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none ${position} inset-0${position === 'fixed' ? ' -z-10' : ''}`}
      style={{ background: layers.join(', ') }}
    />
  );
}
