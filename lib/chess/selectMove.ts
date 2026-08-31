export interface MoveCandidate {
  move: string;
  /** Centipawn score from the perspective of the side to move; higher is better. */
  score: number;
}

// Scales `randomness` (0-1) into a softmax temperature in centipawns. At the
// top of the range (randomness 1), a ~140cp gap between two candidates still
// leaves the weaker one a real (if minority) chance of being picked; near 0,
// even a small gap makes the weaker candidate's weight negligible.
const MAX_TEMPERATURE_CP = 200;

// Picks one move out of the engine's top candidates, weighted toward better
// moves but not always the single best one — this is what makes lower
// difficulties feel like an imperfect human instead of a capped-strength
// engine that still finds its best idea every time. `randomness` 0 always
// returns the top candidate (assumed to be candidates[0], i.e. Stockfish's
// MultiPV rank 1); `random` is injectable for deterministic tests.
export function selectWeightedMove(
  candidates: MoveCandidate[],
  randomness: number,
  random: () => number = Math.random
): string {
  if (candidates.length <= 1 || randomness <= 0) {
    return candidates[0].move;
  }

  const temperature = randomness * MAX_TEMPERATURE_CP;
  const bestScore = Math.max(...candidates.map((c) => c.score));
  const weights = candidates.map((c) => Math.exp((c.score - bestScore) / temperature));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  const draw = random() * totalWeight;
  let cumulative = 0;
  for (let i = 0; i < candidates.length; i++) {
    cumulative += weights[i];
    if (draw < cumulative) return candidates[i].move;
  }
  return candidates[candidates.length - 1].move;
}
