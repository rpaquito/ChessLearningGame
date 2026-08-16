import type { EngineOptions } from './difficulty';
import { parseBestMove, parseScoreCp, isReadyLine } from './uciParser';

export interface StockfishClient {
  getBestMove: (fen: string, options: EngineOptions) => Promise<string>;
  evaluate: (fen: string, depth: number) => Promise<number>;
  terminate: () => void;
}

export function createStockfishClient(): StockfishClient {
  const worker = new Worker('/stockfish/stockfish-18-lite-single.js');
  let readyPromise: Promise<void> | null = null;

  function waitForReady(): Promise<void> {
    if (readyPromise) return readyPromise;
    readyPromise = new Promise((resolve) => {
      const onMessage = (event: MessageEvent<string>) => {
        if (isReadyLine(event.data)) {
          worker.removeEventListener('message', onMessage);
          resolve();
        }
      };
      worker.addEventListener('message', onMessage);
      worker.postMessage('uci');
      worker.postMessage('isready');
    });
    return readyPromise;
  }

  async function getBestMove(fen: string, options: EngineOptions): Promise<string> {
    await waitForReady();
    return new Promise((resolve) => {
      const onMessage = (event: MessageEvent<string>) => {
        const move = parseBestMove(event.data);
        if (move) {
          worker.removeEventListener('message', onMessage);
          resolve(move);
        }
      };
      worker.addEventListener('message', onMessage);
      worker.postMessage(`setoption name Skill Level value ${options.skillLevel}`);
      worker.postMessage('ucinewgame');
      worker.postMessage(`position fen ${fen}`);
      worker.postMessage(`go depth ${options.depth} movetime ${options.moveTimeMs}`);
    });
  }

  async function evaluate(fen: string, depth: number): Promise<number> {
    await waitForReady();
    return new Promise((resolve) => {
      let lastScore = 0;
      const onMessage = (event: MessageEvent<string>) => {
        const score = parseScoreCp(event.data);
        if (score !== null) lastScore = score;
        if (parseBestMove(event.data)) {
          worker.removeEventListener('message', onMessage);
          resolve(lastScore);
        }
      };
      worker.addEventListener('message', onMessage);
      worker.postMessage('ucinewgame');
      worker.postMessage(`position fen ${fen}`);
      worker.postMessage(`go depth ${depth}`);
    });
  }

  function terminate() {
    worker.terminate();
  }

  return { getBestMove, evaluate, terminate };
}
