import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import type { PieceSymbol } from 'chess.js';
import { PieceIcon } from './PieceIcon';

const TYPES: PieceSymbol[] = ['p', 'n', 'b', 'r', 'q', 'k'];

describe('PieceIcon', () => {
  it('renders an SVG with visible shapes for every piece type', () => {
    for (const type of TYPES) {
      const { container, unmount } = render(<PieceIcon type={type} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      // Not an empty icon: at least one drawable shape got through.
      expect(svg?.querySelectorAll('path, rect, circle, polygon').length).toBeGreaterThan(0);
      unmount();
    }
  });

  it('is decorative (hidden from assistive tech), matching the board cell it sits in', () => {
    const { container } = render(<PieceIcon type="k" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('sizes itself relative to its parent instead of a fixed pixel size, so it scales with the board', () => {
    const { container } = render(<PieceIcon type="q" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toMatch(/%/);
  });
});
