export type MoveQuality = 'boa' | 'imprecisao' | 'erro';

/**
 * Diferença entre a avaliação do melhor lance disponível e a
 * avaliação obtida com o lance realmente jogado, ambas na perspectiva
 * de quem jogou. Nunca é negativa: se o lance jogado avaliar melhor
 * que a referência do motor, consideramos perda zero.
 */
export function centipawnLoss(bestEval: number, playedEval: number): number {
  return Math.max(0, bestEval - playedEval);
}

/**
 * Classifica um lance a partir da perda de centipawns em relação ao
 * melhor lance disponível na posição.
 */
export function classifyMove(loss: number): MoveQuality {
  if (loss < 0) {
    throw new RangeError('loss não pode ser negativo');
  }
  if (loss <= 30) return 'boa';
  if (loss <= 100) return 'imprecisao';
  return 'erro';
}
