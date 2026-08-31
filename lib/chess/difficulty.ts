export type Difficulty = 'facil' | 'medio' | 'dificil';

export interface EngineOptions {
  // Whether to cap playing strength via UCI_LimitStrength/UCI_Elo. False
  // (dificil) means the engine plays at its full, unrestricted strength —
  // `elo` is then a nominal upper-bound value, ignored by the engine.
  limitStrength: boolean;
  elo: number; // UCI_Elo target, 1320-3190 (only applied when limitStrength is true)
  depth: number; // search depth limit
  moveTimeMs: number; // max thinking time in milliseconds
  multiPv: number; // number of candidate moves to consider (see `randomness`)
  // 0 = always play the engine's best (MultiPV rank 1) move. Above 0, a
  // weighted-random pick among the top `multiPv` candidates — see
  // selectMove.ts — so the engine occasionally plays its 2nd/3rd idea
  // instead of always the objectively best one, closer to a human opponent.
  randomness: number;
}

const DIFFICULTY_OPTIONS: Record<Difficulty, EngineOptions> = {
  facil: { limitStrength: true, elo: 1320, depth: 4, moveTimeMs: 250, multiPv: 4, randomness: 0.9 },
  medio: { limitStrength: true, elo: 1500, depth: 8, moveTimeMs: 700, multiPv: 2, randomness: 0.4 },
  dificil: { limitStrength: false, elo: 3190, depth: 18, moveTimeMs: 2200, multiPv: 1, randomness: 0 },
};

export function difficultyToEngineOptions(difficulty: Difficulty): EngineOptions {
  return DIFFICULTY_OPTIONS[difficulty];
}
