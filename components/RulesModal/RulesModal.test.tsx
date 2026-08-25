import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RulesModal } from './RulesModal';

describe('RulesModal', () => {
  it('renders nothing when closed', () => {
    render(<RulesModal open={false} onClose={() => {}} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the rules when open', () => {
    render(<RulesModal open onClose={() => {}} />);
    expect(screen.getByRole('dialog', { name: 'Regras do xadrez' })).toBeInTheDocument();
  });

  it('explains what centipawns are', () => {
    render(<RulesModal open onClose={() => {}} />);
    expect(screen.getByText('Centipawns')).toBeInTheDocument();
    expect(screen.getByText(/100 centipawns valem cerca de um peão/)).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<RulesModal open onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<RulesModal open onClose={onClose} />);
    fireEvent.click(screen.getByTestId('rules-modal-backdrop'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose when the dialog panel itself is clicked', () => {
    const onClose = vi.fn();
    render(<RulesModal open onClose={onClose} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<RulesModal open onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
