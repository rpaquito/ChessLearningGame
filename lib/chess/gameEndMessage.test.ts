import { describe, expect, it } from 'vitest';
import { describeGameEnd } from './gameEndMessage';

describe('describeGameEnd', () => {
  it('returns the loss message when the human is checkmated in ai mode', () => {
    expect(describeGameEnd('checkmate', 'ai', 'w', 'w')).toBe('Perdeste. Xeque-mate.');
  });

  it('returns the win message when the opponent is checkmated in ai mode', () => {
    expect(describeGameEnd('checkmate', 'ai', 'w', 'b')).toBe('Ganhaste! Xeque-mate.');
  });

  it('returns "pretas vencem" when white is checkmated in local mode', () => {
    expect(describeGameEnd('checkmate', 'local', 'w', 'w')).toBe('Xeque-mate! Vencem as pretas.');
  });

  it('returns "brancas vencem" when black is checkmated in local mode', () => {
    expect(describeGameEnd('checkmate', 'local', 'w', 'b')).toBe('Xeque-mate! Vencem as brancas.');
  });

  it('returns the stalemate message regardless of mode/color', () => {
    expect(describeGameEnd('stalemate', 'ai', 'w', 'w')).toBe('Empate por afogamento.');
  });

  it('returns the generic draw message regardless of mode/color', () => {
    expect(describeGameEnd('draw', 'local', 'b', 'b')).toBe('Empate.');
  });

  it('returns null for "playing"', () => {
    expect(describeGameEnd('playing', 'ai', 'w', 'w')).toBeNull();
  });

  it('returns null for "check" (not a game-ending status)', () => {
    expect(describeGameEnd('check', 'ai', 'w', 'w')).toBeNull();
  });
});
