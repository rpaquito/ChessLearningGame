export function parseBestMove(line: string): string | null {
  const match = /^bestmove (\S+)/.exec(line);
  return match ? match[1] : null;
}

export function parseScoreCp(line: string): number | null {
  const match = /score cp (-?\d+)/.exec(line);
  return match ? parseInt(match[1], 10) : null;
}

export function parseScoreMate(line: string): number | null {
  const match = /score mate (-?\d+)/.exec(line);
  return match ? parseInt(match[1], 10) : null;
}

export interface MultiPvInfo {
  multipv: number;
  move: string;
  scoreCp: number | null;
  scoreMate: number | null;
}

export function parseMultiPvInfo(line: string): MultiPvInfo | null {
  const multipvMatch = /\bmultipv (\d+)\b/.exec(line);
  const pvMatch = /\bpv (\S+)/.exec(line);
  if (!multipvMatch || !pvMatch) return null;
  return {
    multipv: parseInt(multipvMatch[1], 10),
    move: pvMatch[1],
    scoreCp: parseScoreCp(line),
    scoreMate: parseScoreMate(line),
  };
}

export function isReadyLine(line: string): boolean {
  return line === 'readyok';
}

export function parseUciMove(uci: string): { from: string; to: string; promotion?: string } {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci[4] : undefined;
  return promotion ? { from, to, promotion } : { from, to };
}
