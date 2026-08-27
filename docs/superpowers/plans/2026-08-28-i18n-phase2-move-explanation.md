# i18n Fase 2 — `moveExplanation.ts` bilingue — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar `lib/chess/moveExplanation.ts` bilingue (PT-PT/English) —
`describeMove()`/`explainMoveQuality()` ganham um parâmetro `locale`
obrigatório, e `app/jogar/page.tsx` passa a repassar o `locale` de
`useTranslation()`.

**Architecture:** O ficheiro continua a compor frases a partir de
fragmentos fixos (nunca texto livre), só que agora cada fragmento tem uma
variante PT e uma EN, escolhida em runtime pelo parâmetro `locale`. Inglês
não tem concordância de género (`withArticle` simplifica para `"the
<peça>"` fixo); a composição por cláusulas (até 2, junta por "e"/"and")
mantém-se idêntica nos dois idiomas.

**Tech Stack:** TypeScript, chess.js, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-27-multi-language-i18n-design.md`
(secção "8. Conteúdo bilingue — `lib/chess/moveExplanation.ts`")

## Global Constraints

- Todo o texto em inglês usa ortografia americana.
- `describeMove`/`explainMoveQuality` continuam a nunca gerar texto livre —
  só combinam fragmentos fixos, em qualquer dos dois idiomas.
- As frases PT existentes ficam **byte-idênticas** ao comportamento atual
  — todo o teste PT existente muda só a assinatura da chamada (acrescenta
  `'pt'`), nunca o valor esperado.
- `LearningPanel.tsx` **não muda nesta fase** — já recebe
  `suggestionExplanation`/`lastMoveExplanation` como props de texto simples
  vindas de `app/jogar/page.tsx`; só quem gera essas strings (o próprio
  `app/jogar/page.tsx`, chamando `describeMove`/`explainMoveQuality`)
  precisa de mudar.

---

## Task 1: `moveExplanation.ts` bilingue + testes

**Files:**
- Modify: `lib/chess/moveExplanation.ts`
- Modify: `lib/chess/moveExplanation.test.ts`

**Interfaces:**
- Consumes: `Locale` de `@/lib/i18n/types` (já existe, Fase 1).
- Produces: `describeMove(fenBefore: string, move: MoveInput, locale:
  Locale): string`; `explainMoveQuality(quality: MoveQuality, tagSentence:
  string, loss: number, locale: Locale): string` — ambas ganham um 3º/4º
  parâmetro `locale` obrigatório (assinatura antiga tinha 2 e 3
  parâmetros respetivamente).

- [ ] **Step 1: Reescrever `lib/chess/moveExplanation.test.ts`** — os 15
  testes existentes ganham `'pt'` como último argumento (valor esperado
  **inalterado**), mais 11 novos testes em inglês (mesmos cenários,
  valores esperados novos) e 5 novos testes de `explainMoveQuality` em
  inglês. Substituir o ficheiro inteiro por este conteúdo:

```ts
import { describe, expect, it } from 'vitest';
import { describeMove, explainMoveQuality } from './moveExplanation';

describe('describeMove — pt', () => {
  it('describes a capture, naming the piece and the square', () => {
    const fen = '4k3/8/4p3/8/3N4/8/8/4K3 w - - 0 10';
    expect(describeMove(fen, { from: 'd4', to: 'e6' }, 'pt')).toBe('Captura o peão em e6.');
  });

  it('describes a check', () => {
    const fen = '3k4/8/8/8/8/8/8/3RK3 w - - 0 1';
    expect(describeMove(fen, { from: 'd1', to: 'd7' }, 'pt')).toBe('Dá xeque.');
  });

  it('describes checkmate, overriding every other tag', () => {
    const fen = '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1';
    expect(describeMove(fen, { from: 'a1', to: 'a8' }, 'pt')).toBe('Dá xeque-mate.');
  });

  it('describes a promotion, naming the square', () => {
    const fen = '8/4P3/8/8/8/8/8/4K2k w - - 0 1';
    expect(describeMove(fen, { from: 'e7', to: 'e8', promotion: 'q' }, 'pt')).toBe(
      'Promove o peão a dama em e8.'
    );
  });

  it('describes kingside castling', () => {
    const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
    expect(describeMove(fen, { from: 'e1', to: 'g1' }, 'pt')).toBe(
      'Coloca o rei em segurança com o roque pequeno.'
    );
  });

  it('describes queenside castling', () => {
    const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
    expect(describeMove(fen, { from: 'e1', to: 'c1' }, 'pt')).toBe(
      'Coloca o rei em segurança com o roque grande.'
    );
  });

  it('describes escaping a threatened piece, naming the piece', () => {
    const fen = '3rk3/8/8/8/8/8/8/3RK3 w - - 0 1';
    expect(describeMove(fen, { from: 'd1', to: 'a1' }, 'pt')).toBe('Afasta a torre de uma ameaça.');
  });

  it('describes occupying the center, naming the square', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(describeMove(fen, { from: 'e2', to: 'e4' }, 'pt')).toBe('Ocupa o centro em e4.');
  });

  it('describes developing a minor piece in the opening, naming the piece', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(describeMove(fen, { from: 'b1', to: 'c3' }, 'pt')).toBe('Desenvolve o cavalo.');
  });

  it('combines a capture with a check', () => {
    const fen = '3k4/8/2p5/N7/8/8/8/4K3 w - - 0 1';
    expect(describeMove(fen, { from: 'a5', to: 'c6' }, 'pt')).toBe('Captura o peão em c6 e dá xeque.');
  });

  it('falls back to naming the piece and destination when nothing else applies', () => {
    const fen = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
    expect(describeMove(fen, { from: 'e1', to: 'e2' }, 'pt')).toBe('Move o rei para e2.');
  });

  it('throws for an illegal move', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(() => describeMove(fen, { from: 'e2', to: 'e5' }, 'pt')).toThrow();
  });
});

describe('describeMove — en', () => {
  it('describes a capture, naming the piece and the square', () => {
    const fen = '4k3/8/4p3/8/3N4/8/8/4K3 w - - 0 10';
    expect(describeMove(fen, { from: 'd4', to: 'e6' }, 'en')).toBe('Captures the pawn on e6.');
  });

  it('describes a check', () => {
    const fen = '3k4/8/8/8/8/8/8/3RK3 w - - 0 1';
    expect(describeMove(fen, { from: 'd1', to: 'd7' }, 'en')).toBe('Gives check.');
  });

  it('describes checkmate, overriding every other tag', () => {
    const fen = '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1';
    expect(describeMove(fen, { from: 'a1', to: 'a8' }, 'en')).toBe('Delivers checkmate.');
  });

  it('describes a promotion, naming the square', () => {
    const fen = '8/4P3/8/8/8/8/8/4K2k w - - 0 1';
    expect(describeMove(fen, { from: 'e7', to: 'e8', promotion: 'q' }, 'en')).toBe(
      'Promotes the pawn to a queen on e8.'
    );
  });

  it('describes kingside castling', () => {
    const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
    expect(describeMove(fen, { from: 'e1', to: 'g1' }, 'en')).toBe('Castles kingside.');
  });

  it('describes queenside castling', () => {
    const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
    expect(describeMove(fen, { from: 'e1', to: 'c1' }, 'en')).toBe('Castles queenside.');
  });

  it('describes escaping a threatened piece, naming the piece', () => {
    const fen = '3rk3/8/8/8/8/8/8/3RK3 w - - 0 1';
    expect(describeMove(fen, { from: 'd1', to: 'a1' }, 'en')).toBe(
      'Moves the rook away from a threat.'
    );
  });

  it('describes occupying the center, naming the square', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(describeMove(fen, { from: 'e2', to: 'e4' }, 'en')).toBe('Occupies the center on e4.');
  });

  it('describes developing a minor piece in the opening, naming the piece', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(describeMove(fen, { from: 'b1', to: 'c3' }, 'en')).toBe('Develops the knight.');
  });

  it('combines a capture with a check', () => {
    const fen = '3k4/8/2p5/N7/8/8/8/4K3 w - - 0 1';
    expect(describeMove(fen, { from: 'a5', to: 'c6' }, 'en')).toBe(
      'Captures the pawn on c6 and gives check.'
    );
  });

  it('falls back to naming the piece and destination when nothing else applies', () => {
    const fen = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
    expect(describeMove(fen, { from: 'e1', to: 'e2' }, 'en')).toBe('Moves the king to e2.');
  });
});

describe('explainMoveQuality — pt', () => {
  it('returns just the tag sentence for a good move', () => {
    expect(explainMoveQuality('boa', 'Desenvolve o cavalo.', 10, 'pt')).toBe('Desenvolve o cavalo.');
  });

  it('appends the centipawn loss and a plain-language feel for an imprecision', () => {
    expect(explainMoveQuality('imprecisao', 'Ocupa o centro em e4.', 45, 'pt')).toBe(
      'Ocupa o centro em e4. Havia uma jogada melhor: perdeste cerca de 45 centipawns de ' +
        'vantagem (menos do que um peão).'
    );
  });

  it('appends the centipawn loss and a plain-language feel for a mistake', () => {
    expect(explainMoveQuality('erro', 'Move o rei para e2.', 250, 'pt')).toBe(
      'Move o rei para e2. Foi um erro: perdeste cerca de 250 centipawns de vantagem ' +
        '(cerca de um peão).'
    );
  });

  it('describes a large loss as worth more than a minor piece', () => {
    expect(explainMoveQuality('erro', 'Move o rei para e2.', 400, 'pt')).toBe(
      'Move o rei para e2. Foi um erro: perdeste cerca de 400 centipawns de vantagem ' +
        '(cerca de uma peça menor, como um cavalo ou bispo).'
    );
  });

  it('describes a very large loss as worth more than a queen', () => {
    expect(explainMoveQuality('erro', 'Move o rei para e2.', 950, 'pt')).toBe(
      'Move o rei para e2. Foi um erro: perdeste cerca de 950 centipawns de vantagem ' +
        '(mais do que uma dama).'
    );
  });
});

describe('explainMoveQuality — en', () => {
  it('returns just the tag sentence for a good move', () => {
    expect(explainMoveQuality('boa', 'Develops the knight.', 10, 'en')).toBe('Develops the knight.');
  });

  it('appends the centipawn loss and a plain-language feel for an imprecision', () => {
    expect(explainMoveQuality('imprecisao', 'Occupies the center on e4.', 45, 'en')).toBe(
      'Occupies the center on e4. There was a better move: you lost about 45 centipawns of ' +
        'advantage (less than a pawn).'
    );
  });

  it('appends the centipawn loss and a plain-language feel for a mistake', () => {
    expect(explainMoveQuality('erro', 'Moves the king to e2.', 250, 'en')).toBe(
      'Moves the king to e2. That was a mistake: you lost about 250 centipawns of advantage ' +
        '(about a pawn).'
    );
  });

  it('describes a large loss as worth more than a minor piece', () => {
    expect(explainMoveQuality('erro', 'Moves the king to e2.', 400, 'en')).toBe(
      'Moves the king to e2. That was a mistake: you lost about 400 centipawns of advantage ' +
        '(about a minor piece, like a knight or bishop).'
    );
  });

  it('describes a very large loss as worth more than a queen', () => {
    expect(explainMoveQuality('erro', 'Moves the king to e2.', 950, 'en')).toBe(
      'Moves the king to e2. That was a mistake: you lost about 950 centipawns of advantage ' +
        '(more than a queen).'
    );
  });
});
```

- [ ] **Step 2: Confirmar que os testes falham**

Run: `npx vitest run lib/chess/moveExplanation.test.ts`
Expected: FAIL em quase todos — a assinatura antiga só aceitava
2/3 argumentos, `'pt'`/`'en'` extra causa erro de tipo/comportamento
errado antes mesmo de correr.

- [ ] **Step 3: Reescrever `lib/chess/moveExplanation.ts`**

```ts
import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js';
import { findThreatenedSquares } from './threats';
import type { MoveQuality } from './moveClassification';
import type { Locale } from '@/lib/i18n/types';

export interface MoveInput {
  from: Square;
  to: Square;
  promotion?: string;
}

// Nome de cada peça, por idioma — sem artigo em português (ver
// withArticle), com artigo definido fixo em inglês (sem concordância de
// género nessa língua).
const PIECE_NAME: Record<Locale, Record<PieceSymbol, string>> = {
  pt: { p: 'peão', n: 'cavalo', b: 'bispo', r: 'torre', q: 'dama', k: 'rei' },
  en: { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' },
};

// Torre e dama são femininas em português — precisam de "a", não "o".
const FEMININE_PIECES = new Set<PieceSymbol>(['r', 'q']);

function withArticle(piece: PieceSymbol, locale: Locale): string {
  if (locale === 'en') return `the ${PIECE_NAME.en[piece]}`;
  const article = FEMININE_PIECES.has(piece) ? 'a' : 'o';
  return `${article} ${PIECE_NAME.pt[piece]}`;
}

const CENTER_SQUARES = new Set(['d4', 'd5', 'e4', 'e5']);
const BACK_RANK: Record<Color, string> = { w: '1', b: '8' };
const MINOR_PIECES = new Set<PieceSymbol>(['n', 'b']);

// Fullmove number até ao qual ainda consideramos que estamos "na abertura"
// para efeitos de assinalar desenvolvimento de peças.
const DEVELOPMENT_MOVE_LIMIT = 10;

function capitalize(sentence: string): string {
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

const CONJUNCTION: Record<Locale, string> = { pt: ' e ', en: ' and ' };

/**
 * Descreve um lance a partir de características concretas detetadas na
 * posição — nunca gera texto livre, só combina frases feitas, em
 * qualquer dos dois idiomas. Serve tanto para explicar uma jogada
 * sugerida como para explicar a qualidade do último lance jogado (ver
 * moveClassification.ts).
 */
export function describeMove(fenBefore: string, move: MoveInput, locale: Locale): string {
  const chess = new Chess(fenBefore);
  const color = chess.turn();
  const movingPiece = chess.get(move.from);
  const wasThreatened = findThreatenedSquares(fenBefore, color).includes(move.from);
  const fullmoveNumber = Number(fenBefore.split(' ')[5]);

  const verboseMove = chess.move({
    from: move.from,
    to: move.to,
    promotion: move.promotion ?? 'q',
  });
  if (!verboseMove) {
    throw new Error(`Lance inválido: ${move.from}-${move.to}`);
  }

  if (verboseMove.san.endsWith('#')) {
    return locale === 'en' ? 'Delivers checkmate.' : 'Dá xeque-mate.';
  }

  const clauses: string[] = [];

  if (verboseMove.captured) {
    clauses.push(
      locale === 'en'
        ? `captures ${withArticle(verboseMove.captured, locale)} on ${move.to}`
        : `captura ${withArticle(verboseMove.captured, locale)} em ${move.to}`
    );
  }
  if (verboseMove.san.endsWith('+')) {
    clauses.push(locale === 'en' ? 'gives check' : 'dá xeque');
  }
  if (verboseMove.promotion) {
    clauses.push(
      locale === 'en'
        ? `promotes the pawn to a ${PIECE_NAME.en[verboseMove.promotion]} on ${move.to}`
        : `promove o peão a ${PIECE_NAME.pt[verboseMove.promotion]} em ${move.to}`
    );
  }
  if (verboseMove.flags.includes('k')) {
    clauses.push(
      locale === 'en' ? 'castles kingside' : 'coloca o rei em segurança com o roque pequeno'
    );
  }
  if (verboseMove.flags.includes('q')) {
    clauses.push(
      locale === 'en' ? 'castles queenside' : 'coloca o rei em segurança com o roque grande'
    );
  }
  if (wasThreatened && movingPiece) {
    clauses.push(
      locale === 'en'
        ? `moves ${withArticle(movingPiece.type, locale)} away from a threat`
        : `afasta ${withArticle(movingPiece.type, locale)} de uma ameaça`
    );
  }
  if (CENTER_SQUARES.has(move.to)) {
    clauses.push(
      locale === 'en' ? `occupies the center on ${move.to}` : `ocupa o centro em ${move.to}`
    );
  }
  if (
    movingPiece &&
    MINOR_PIECES.has(movingPiece.type) &&
    move.from.endsWith(BACK_RANK[color]) &&
    fullmoveNumber <= DEVELOPMENT_MOVE_LIMIT
  ) {
    clauses.push(
      locale === 'en'
        ? `develops ${withArticle(movingPiece.type, locale)}`
        : `desenvolve ${withArticle(movingPiece.type, locale)}`
    );
  }

  // Nunca genérico: mesmo sem nenhuma característica notável, nomeia a
  // peça e o destino em vez de um "é um lance posicional" vago.
  if (clauses.length === 0 && movingPiece) {
    clauses.push(
      locale === 'en'
        ? `moves ${withArticle(movingPiece.type, locale)} to ${move.to}`
        : `move ${withArticle(movingPiece.type, locale)} para ${move.to}`
    );
  }

  return `${capitalize(clauses.slice(0, 2).join(CONJUNCTION[locale]))}.`;
}

// Valor aproximado de cada peça em centipawns (convenção universal do
// xadrez: 1 peão = 100 centipawns) — usado só para dar ao número uma
// grandeza intuitiva, não para nenhum cálculo. Ver também a explicação
// de "centipawns" em RulesModal.tsx, que usa a mesma referência.
function centipawnFeel(loss: number, locale: Locale): string {
  if (locale === 'en') {
    if (loss < 100) return 'less than a pawn';
    if (loss < 300) return 'about a pawn';
    if (loss < 500) return 'about a minor piece, like a knight or bishop';
    if (loss < 900) return 'about a rook';
    return 'more than a queen';
  }
  if (loss < 100) return 'menos do que um peão';
  if (loss < 300) return 'cerca de um peão';
  if (loss < 500) return 'cerca de uma peça menor, como um cavalo ou bispo';
  if (loss < 900) return 'cerca de uma torre';
  return 'mais do que uma dama';
}

/**
 * Combina a descrição de características do lance jogado (de
 * `describeMove`) com a classificação de qualidade já calculada em
 * moveClassification.ts, para explicar não só o que aconteceu no tabuleiro
 * mas também porque é que o lance foi bom, impreciso ou um erro. O número
 * de centipawns sozinho não diz nada a quem não é familiar com a unidade —
 * por isso vem sempre acompanhado de uma grandeza em termos de peças reais.
 */
export function explainMoveQuality(
  quality: MoveQuality,
  tagSentence: string,
  loss: number,
  locale: Locale
): string {
  if (quality === 'boa') {
    return tagSentence;
  }
  const feel = centipawnFeel(loss, locale);
  const suffix =
    locale === 'en'
      ? quality === 'erro'
        ? `That was a mistake: you lost about ${loss} centipawns of advantage (${feel}).`
        : `There was a better move: you lost about ${loss} centipawns of advantage (${feel}).`
      : quality === 'erro'
        ? `Foi um erro: perdeste cerca de ${loss} centipawns de vantagem (${feel}).`
        : `Havia uma jogada melhor: perdeste cerca de ${loss} centipawns de vantagem (${feel}).`;
  return `${tagSentence} ${suffix}`;
}
```

- [ ] **Step 4: Confirmar que os testes passam**

Run: `npx vitest run lib/chess/moveExplanation.test.ts`
Expected: PASS (26/26 — 12 PT `describeMove` incl. o teste de erro, 11 EN
`describeMove`, 5 PT `explainMoveQuality`, 5 EN `explainMoveQuality`).

- [ ] **Step 5: `npx tsc --noEmit`**

Expected: sem erros — confirma que não sobra nenhuma chamada com a
assinatura antiga de 2/3 argumentos em nenhum ficheiro (a próxima tarefa
trata do único consumidor real).

- [ ] **Step 6: Commit**

```bash
git add lib/chess/moveExplanation.ts lib/chess/moveExplanation.test.ts
git commit -m "feat(i18n): make moveExplanation bilingual (pt/en)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y5poXWqz8nhndfRJvWEbbi"
```

---

## Task 2: Wire `app/jogar/page.tsx` + `CLAUDE.md`

**Files:**
- Modify: `app/jogar/page.tsx`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: `describeMove(fenBefore, move, locale)`,
  `explainMoveQuality(quality, tagSentence, loss, locale)` (Task 1);
  `useTranslation()` already returns `{ t, locale }` (Fase 1, unchanged).

- [ ] **Step 1: Editar `app/jogar/page.tsx`**

`JogarContent` já chama `useTranslation()` para `t` (Fase 1) — só falta
destructurar também `locale` e passá-lo aos dois call sites existentes.

Mudar:
```tsx
const { t } = useTranslation();
```
para:
```tsx
const { t, locale } = useTranslation();
```

No corpo de `handleSquareClick`, dentro do `.then(([bestEval, replyEval]) => { ... })`:
```tsx
              try {
                const tagSentence = describeMove(fenBefore, {
                  from: selectedSquare,
                  to: square,
                  promotion: 'q',
                }, locale);
                setLastMoveExplanation(explainMoveQuality(quality, tagSentence, loss, locale));
              } catch {
                setLastMoveExplanation(null);
              }
```

E acrescentar `locale` ao array de dependências de `handleSquareClick`:
```tsx
    [isHumanTurn, state.isGameOver, state.fen, selectedSquare, legalMovesFrom, makeMove, mode, learningEnabled, locale]
```

Em `handleRequestSuggestion`:
```tsx
        try {
          setSuggestionExplanation(
            describeMove(fenBefore, { from: from as Square, to: to as Square }, locale)
          );
        } catch {
          setSuggestionExplanation(null);
        }
```

E acrescentar `locale` ao array de dependências de `handleRequestSuggestion`:
```tsx
  }, [state.fen, locale]);
```

- [ ] **Step 2: `npx tsc --noEmit`**

Expected: sem erros.

- [ ] **Step 3: Correr a suite completa**

Run: `npm run test`
Expected: tudo verde — nenhum teste existente de `app/jogar` deveria
quebrar (o `locale` por omissão continua `'pt'`, produzindo o mesmo texto
de sempre).

- [ ] **Step 4: Verificação manual**

Com `npm run dev`: jogar uma partida contra o computador com o modo de
aprendizagem ativo, pedir uma sugestão, confirmar que a explicação sai em
português; trocar para inglês em `/opções`, repetir, confirmar que a
explicação agora sai em inglês (ex.: "Develops the knight." em vez de
"Desenvolve o cavalo.").

- [ ] **Step 5: Atualizar `CLAUDE.md`**

Na secção "Múltiplos idiomas (`lib/i18n/`, ...)" já existente (criada na
Fase 1), acrescentar um parágrafo curto a fechar o capítulo da Fase 2:

> **Fase 2 (2026-08-28) — `lib/chess/moveExplanation.ts` bilingue:**
> `describeMove`/`explainMoveQuality` ganharam um parâmetro `locale`
> obrigatório — cada fragmento de frase (nome de peça, cláusula de
> captura/xeque/roque/etc., a grandeza de perda de centipawns em
> `centipawnFeel`) tem agora uma variante PT e uma EN, nunca texto livre
> gerado. Inglês não tem concordância de género, por isso `withArticle`
> simplifica para `"the <peça>"` fixo do lado inglês. Único consumidor,
> `app/jogar/page.tsx`, já lia `locale` de `useTranslation()` desde a Fase
> 1 (só não o usava ainda) — passou a repassá-lo aos dois call sites.
> `lib/openings/data.ts` (as explicações das aberturas) continua PT-only —
> essa é a Fase 3, ainda não construída.

- [ ] **Step 6: Commit**

```bash
git add app/jogar/page.tsx CLAUDE.md
git commit -m "feat(i18n): wire app/jogar/page.tsx to bilingual moveExplanation

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y5poXWqz8nhndfRJvWEbbi"
```
