import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChipButton } from './ChipButton';

describe('ChipButton', () => {
  it('renders as a link when given an href', () => {
    render(
      <ChipButton color="purple" href="/aprender">
        Ver tutorial
      </ChipButton>
    );
    const link = screen.getByRole('link', { name: 'Ver tutorial' });
    expect(link).toHaveAttribute('href', '/aprender');
  });

  it('renders as a button when given onClick instead of href', () => {
    const onClick = vi.fn();
    render(
      <ChipButton color="cyan" onClick={onClick}>
        Regras do jogo
      </ChipButton>
    );
    const button = screen.getByRole('button', { name: 'Regras do jogo' });
    button.click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies a distinct background per color so chips never look identical', () => {
    const { rerender, container } = render(
      <ChipButton color="purple" onClick={() => {}}>
        A
      </ChipButton>
    );
    const purpleBg = (container.firstChild as HTMLElement).style.background;

    rerender(
      <ChipButton color="cyan" onClick={() => {}}>
        A
      </ChipButton>
    );
    const cyanBg = (container.firstChild as HTMLElement).style.background;

    expect(purpleBg).not.toBe(cyanBg);
  });
});
