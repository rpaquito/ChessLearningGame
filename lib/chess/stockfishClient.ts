import type { EngineOptions } from './difficulty';
import { parseBestMove, parseScoreCp, parseScoreMate, isReadyLine } from './uciParser';

export interface StockfishClient {
  getBestMove: (fen: string, options: EngineOptions) => Promise<string>;
  evaluate: (fen: string, depth: number) => Promise<number>;
  terminate: () => void;
}

// How long we wait for the engine to answer "isready" before treating it as
// unavailable. A worker that fails to load its WASM (blocked, unsupported,
// network error, ...) may never emit 'error' — it can simply stay silent —
// so a timeout is the only reliable way to eventually give up.
const READY_TIMEOUT_MS = 10_000;

// Large enough to dominate any real centipawn-scale comparison, while still
// preferring a faster mate over a slower one (mate in 1 > mate in 5).
const MATE_SENTINEL = 100_000;

export function createStockfishClient(): StockfishClient {
  const worker = new Worker('/stockfish/stockfish-18-lite-single.js');

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

  // The 'error' listener is wired up eagerly (not lazily on first use) so
  // that a worker that fails to load — before anyone ever calls
  // getBestMove()/evaluate() — is still observed. The READY_TIMEOUT_MS
  // countdown, however, must NOT start eagerly: it starts only once
  // waitForReady() actually sends 'uci'/'isready' (see below). Starting it
  // at construction time instead would race against however long the user
  // takes before their first engine call (e.g. thinking time before their
  // first move) and could reject a perfectly healthy engine that was simply
  // never asked "isready" yet within 10s of the page loading.
  let readyReject: ((reason: unknown) => void) | null = null;
  let readyResolve: (() => void) | null = null;
  let readyRequested = false;
  const readyPromise: Promise<void> = new Promise((resolve, reject) => {
    readyResolve = resolve;
    readyReject = reject;
  });

  function handleReadyMessage(event: MessageEvent<string>) {
    if (isReadyLine(event.data)) {
      worker.removeEventListener('message', handleReadyMessage);
      readyResolve?.();
    }
  }
  worker.addEventListener('message', handleReadyMessage);

  worker.addEventListener('error', () => {
    // No-op if readyPromise already settled (resolve/reject on a settled
    // promise is simply ignored) — this only matters for failures that
    // happen before "readyok" ever arrives.
    readyReject?.(new Error('Falha ao carregar o motor de xadrez (Stockfish).'));
  });

  function waitForReady(): Promise<void> {
    if (!readyRequested) {
      readyRequested = true;
      worker.postMessage('uci');
      worker.postMessage('isready');
      setTimeout(() => {
        readyReject?.(new Error('Tempo esgotado ao inicializar o motor de xadrez (Stockfish).'));
      }, READY_TIMEOUT_MS);
    }
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
          const cp = parseScoreCp(event.data);
          if (cp !== null) lastScore = cp;
          const mateIn = parseScoreMate(event.data);
          if (mateIn !== null) {
            lastScore = mateIn > 0 ? MATE_SENTINEL - mateIn : -MATE_SENTINEL - mateIn;
          }
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
