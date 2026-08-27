import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameEndModal } from './GameEndModal';

const noop = () => {};

describe('GameEndModal', () => {
  it('renders nothing when closed', () => {
    render(
      <GameEndModal
        open={false}
        status="checkmate"
        mode="ai"
        humanColor="w"
        turn="w"
        onClose={noop}
        onPlayAgain={noop}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders nothing for a non-terminal status even when open', () => {
    render(
      <GameEndModal
        open
        status="check"
        mode="ai"
        humanColor="w"
        turn="w"
        onClose={noop}
        onPlayAgain={noop}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the loss title when the human is checkmated in ai mode', () => {
    render(
      <GameEndModal
        open
        status="checkmate"
        mode="ai"
        humanColor="w"
        turn="w"
        onClose={noop}
        onPlayAgain={noop}
      />
    );
    expect(screen.getByRole('dialog', { name: 'Perdeste. Xeque-mate.' })).toBeInTheDocument();
  });

  it('shows the win title when the opponent is checkmated in ai mode', () => {
    render(
      <GameEndModal
        open
        status="checkmate"
        mode="ai"
        humanColor="w"
        turn="b"
        onClose={noop}
        onPlayAgain={noop}
      />
    );
    expect(screen.getByRole('dialog', { name: 'Ganhaste! Xeque-mate.' })).toBeInTheDocument();
  });

  it('shows the local-mode winner title', () => {
    render(
      <GameEndModal
        open
        status="checkmate"
        mode="local"
        humanColor="w"
        turn="w"
        onClose={noop}
        onPlayAgain={noop}
      />
    );
    expect(
      screen.getByRole('dialog', { name: 'Xeque-mate! Vencem as pretas.' })
    ).toBeInTheDocument();
  });

  it('shows the stalemate title', () => {
    render(
      <GameEndModal
        open
        status="stalemate"
        mode="ai"
        humanColor="w"
        turn="w"
        onClose={noop}
        onPlayAgain={noop}
      />
    );
    expect(screen.getByRole('dialog', { name: 'Empate por afogamento.' })).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <GameEndModal
        open
        status="draw"
        mode="ai"
        humanColor="w"
        turn="w"
        onClose={onClose}
        onPlayAgain={noop}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders the backdrop below the toast layer via z-50', () => {
    render(
      <GameEndModal
        open
        status="draw"
        mode="ai"
        humanColor="w"
        turn="w"
        onClose={noop}
        onPlayAgain={noop}
      />
    );
    expect(screen.getByTestId('game-end-modal-backdrop').className).toContain('z-50');
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <GameEndModal
        open
        status="draw"
        mode="ai"
        humanColor="w"
        turn="w"
        onClose={onClose}
        onPlayAgain={noop}
      />
    );
    fireEvent.click(screen.getByTestId('game-end-modal-backdrop'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose when the dialog panel itself is clicked', () => {
    const onClose = vi.fn();
    render(
      <GameEndModal
        open
        status="draw"
        mode="ai"
        humanColor="w"
        turn="w"
        onClose={onClose}
        onPlayAgain={noop}
      />
    );
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(
      <GameEndModal
        open
        status="draw"
        mode="ai"
        humanColor="w"
        turn="w"
        onClose={onClose}
        onPlayAgain={noop}
      />
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onPlayAgain when "Jogar de novo" is clicked', () => {
    const onPlayAgain = vi.fn();
    render(
      <GameEndModal
        open
        status="draw"
        mode="ai"
        humanColor="w"
        turn="w"
        onClose={noop}
        onPlayAgain={onPlayAgain}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Jogar de novo' }));
    expect(onPlayAgain).toHaveBeenCalledOnce();
  });

  it('renders "Menu inicial" as a real link to /', () => {
    render(
      <GameEndModal
        open
        status="draw"
        mode="ai"
        humanColor="w"
        turn="w"
        onClose={noop}
        onPlayAgain={noop}
      />
    );
    expect(screen.getByRole('link', { name: 'Menu inicial' })).toHaveAttribute('href', '/');
  });
});
