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
  // Serializes every UCI exchange through this shared worker: only one
  // request's message listener is ever active at a time, so a response
  // can never be delivered to the wrong caller. Without this, concurrent
  // getBestMove()/evaluate() calls (e.g. the AI's own-move request racing
  // the human move-quality check) can cross-resolve, handing the wrong
  // caller an answer meant for someone else.
  let queue: Promise<unknown> = Promise.resolve();

  function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = queue.then(task, task);
    queue = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }

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
    return enqueue(async () => {
      await waitForReady();
      return new Promise<string>((resolve) => {
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
    });
  }

  async function evaluate(fen: string, depth: number): Promise<number> {
    return enqueue(async () => {
      await waitForReady();
      return new Promise<number>((resolve) => {
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
    });
  }

  function terminate() {
    worker.terminate();
  }

  return { getBestMove, evaluate, terminate };
}
