import { describe, expect, it } from 'vitest';
import { describeGameEnd } from './gameEndMessage';

describe('describeGameEnd', () => {
  it('returns the loss message when the human is checkmated in ai mode', () => {
    expect(describeGameEnd('checkmate', 'ai', 'w', 'w', 'pt')).toBe('Perdeste. Xeque-mate.');
  });

  it('returns the win message when the opponent is checkmated in ai mode', () => {
    expect(describeGameEnd('checkmate', 'ai', 'w', 'b', 'pt')).toBe('Ganhaste! Xeque-mate.');
  });

  it('returns "pretas vencem" when white is checkmated in local mode', () => {
    expect(describeGameEnd('checkmate', 'local', 'w', 'w', 'pt')).toBe(
      'Xeque-mate! Vencem as pretas.'
    );
  });

  it('returns "brancas vencem" when black is checkmated in local mode', () => {
    expect(describeGameEnd('checkmate', 'local', 'w', 'b', 'pt')).toBe(
      'Xeque-mate! Vencem as brancas.'
    );
  });

  it('returns the stalemate message regardless of mode/color', () => {
    expect(describeGameEnd('stalemate', 'ai', 'w', 'w', 'pt')).toBe('Empate por afogamento.');
  });

  it('returns the generic draw message regardless of mode/color', () => {
    expect(describeGameEnd('draw', 'local', 'b', 'b', 'pt')).toBe('Empate.');
  });

  it('returns null for "playing"', () => {
    expect(describeGameEnd('playing', 'ai', 'w', 'w', 'pt')).toBeNull();
  });

  it('returns null for "check" (not a game-ending status)', () => {
    expect(describeGameEnd('check', 'ai', 'w', 'w', 'pt')).toBeNull();
  });

  it('devolve a mensagem certa em inglês para xeque-mate quando ganhas', () => {
    expect(describeGameEnd('checkmate', 'ai', 'w', 'b', 'en')).toBe('You won! Checkmate.');
  });

  it('devolve a mensagem certa em inglês para afogamento', () => {
    expect(describeGameEnd('stalemate', 'ai', 'w', 'w', 'en')).toBe('Draw by stalemate.');
  });

  it('devolve a mensagem certa em inglês para xeque-mate quando perdes', () => {
    expect(describeGameEnd('checkmate', 'ai', 'w', 'w', 'en')).toBe('You lost. Checkmate.');
  });

  it('devolve a mensagem certa em inglês para empate genérico', () => {
    expect(describeGameEnd('draw', 'local', 'b', 'b', 'en')).toBe('Draw.');
  });
});
