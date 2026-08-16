export type Difficulty = 'facil' | 'medio' | 'dificil';

export interface EngineOptions {
  skillLevel: number; // Stockfish "Skill Level" UCI option, 0-20
  depth: number; // search depth limit
  moveTimeMs: number; // max thinking time in milliseconds
}

const DIFFICULTY_OPTIONS: Record<Difficulty, EngineOptions> = {
  facil: { skillLevel: 2, depth: 4, moveTimeMs: 300 },
  medio: { skillLevel: 10, depth: 8, moveTimeMs: 800 },
  dificil: { skillLevel: 20, depth: 14, moveTimeMs: 1500 },
};

export function difficultyToEngineOptions(difficulty: Difficulty): EngineOptions {
  return DIFFICULTY_OPTIONS[difficulty];
}
