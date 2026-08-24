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

  it('defaults to the classico style', () => {
    const { container: withDefault } = render(<PieceIcon type="k" />);
    const { container: withExplicit } = render(<PieceIcon type="k" style="classico" />);
    expect(withDefault.querySelector('svg')?.innerHTML).toBe(
      withExplicit.querySelector('svg')?.innerHTML
    );
  });

  it('renders different shapes for classico and moderno', () => {
    for (const type of TYPES) {
      const { container: classico, unmount: unmountClassico } = render(
        <PieceIcon type={type} style="classico" />
      );
      const { container: moderno, unmount: unmountModerno } = render(
        <PieceIcon type={type} style="moderno" />
      );
      expect(classico.querySelector('svg')?.innerHTML).not.toBe(
        moderno.querySelector('svg')?.innerHTML
      );
      unmountClassico();
      unmountModerno();
    }
  });

  it('renders visible shapes for every piece type in the moderno style', () => {
    for (const type of TYPES) {
      const { container, unmount } = render(<PieceIcon type={type} style="moderno" />);
      const svg = container.querySelector('svg');
      expect(svg?.querySelectorAll('path, rect, circle, polygon').length).toBeGreaterThan(0);
      unmount();
    }
  });
});
