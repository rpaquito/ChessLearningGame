import { describe, expect, it } from 'vitest';
import { describeGameEnd } from './gameEndMessage';

describe('describeGameEnd', () => {
  it('returns the loss message and kind when the human is checkmated in ai mode', () => {
    expect(describeGameEnd('checkmate', 'ai', 'w', 'w', 'pt')).toEqual({
      title: 'Perdeste. Xeque-mate.',
      kind: 'lose',
    });
  });

  it('returns the win message and kind when the opponent is checkmated in ai mode', () => {
    expect(describeGameEnd('checkmate', 'ai', 'w', 'b', 'pt')).toEqual({
      title: 'Ganhaste! Xeque-mate.',
      kind: 'win',
    });
  });

  it('returns the Player 2 win message when white is checkmated in local mode', () => {
    expect(describeGameEnd('checkmate', 'local', 'w', 'w', 'pt')).toEqual({
      title: 'Xeque-mate! Venceu o Jogador 2!',
      kind: 'win',
    });
  });

  it('returns the Player 1 win message when black is checkmated in local mode', () => {
    expect(describeGameEnd('checkmate', 'local', 'w', 'b', 'pt')).toEqual({
      title: 'Xeque-mate! Venceu o Jogador 1!',
      kind: 'win',
    });
  });

  it('returns the stalemate message and draw kind regardless of mode/color', () => {
    expect(describeGameEnd('stalemate', 'ai', 'w', 'w', 'pt')).toEqual({
      title: 'Empate por afogamento.',
      kind: 'draw',
    });
  });

  it('returns the generic draw message and draw kind regardless of mode/color', () => {
    expect(describeGameEnd('draw', 'local', 'b', 'b', 'pt')).toEqual({
      title: 'Empate.',
      kind: 'draw',
    });
  });

  it('returns null for "playing"', () => {
    expect(describeGameEnd('playing', 'ai', 'w', 'w', 'pt')).toBeNull();
  });

  it('returns null for "check" (not a game-ending status)', () => {
    expect(describeGameEnd('check', 'ai', 'w', 'w', 'pt')).toBeNull();
  });

  it('devolve a mensagem e kind certos em inglês para xeque-mate quando ganhas', () => {
    expect(describeGameEnd('checkmate', 'ai', 'w', 'b', 'en')).toEqual({
      title: 'You won! Checkmate.',
      kind: 'win',
    });
  });

  it('devolve a mensagem e kind certos em inglês para afogamento', () => {
    expect(describeGameEnd('stalemate', 'ai', 'w', 'w', 'en')).toEqual({
      title: 'Draw by stalemate.',
      kind: 'draw',
    });
  });

  it('devolve a mensagem e kind certos em inglês para xeque-mate quando perdes', () => {
    expect(describeGameEnd('checkmate', 'ai', 'w', 'w', 'en')).toEqual({
      title: 'You lost. Checkmate.',
      kind: 'lose',
    });
  });

  it('devolve a mensagem e kind certos em inglês para empate genérico', () => {
    expect(describeGameEnd('draw', 'local', 'b', 'b', 'en')).toEqual({
      title: 'Draw.',
      kind: 'draw',
    });
  });

  it('devolve a mensagem de vitória do Jogador 1/2 em inglês no modo local', () => {
    expect(describeGameEnd('checkmate', 'local', 'w', 'b', 'en')).toEqual({
      title: 'Checkmate! Player 1 wins!',
      kind: 'win',
    });
    expect(describeGameEnd('checkmate', 'local', 'w', 'w', 'en')).toEqual({
      title: 'Checkmate! Player 2 wins!',
      kind: 'win',
    });
  });
});
