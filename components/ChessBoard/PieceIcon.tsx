import type { PieceSymbol } from 'chess.js';
import type { PieceStyle } from '@/lib/settings/settings';
import { PieceShape as ClassicoShape } from './pieceStyles/classico';
import { PieceShape as ModernoShape } from './pieceStyles/moderno';

const SHAPES: Record<PieceStyle, (props: { type: PieceSymbol }) => React.ReactElement | null> = {
  classico: ClassicoShape,
  moderno: ModernoShape,
};

export function PieceIcon({ type, style = 'classico' }: { type: PieceSymbol; style?: PieceStyle }) {
  const Shape = SHAPES[style];
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" className="h-[72%] w-[72%]" aria-hidden="true">
      <Shape type={type} />
    </svg>
  );
}
