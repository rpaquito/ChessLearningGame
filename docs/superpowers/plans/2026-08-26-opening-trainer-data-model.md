# Treinador de aberturas — Modelo de dados Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `lib/openings/` — a hand-authored, ECO-labelled dataset of 12 chess openings (main line + 1-2 named variations each, in PT-PT) plus a pure helper that replays a line move-by-move through `chess.js`, producing the FEN/from/to/explanation sequence that a future study-mode and practice-mode UI will consume.

**Architecture:** Two small pure TypeScript modules, no React, no UI, no backend — `lib/openings/types.ts` + `lib/openings/data.ts` hold the typed content; `lib/openings/replayLine.ts` turns one `OpeningLine` into a step-by-step move list using `chess.js`. Content correctness (every SAN move is legal) is enforced by a test that replays every line in the real dataset, not just hand-picked fixtures.

**Tech Stack:** TypeScript, `chess.js` `^1.4.0` (already a dependency), Vitest (`describe`/`it`/`expect`, already the project's test runner).

**Spec:** `docs/superpowers/specs/2026-08-26-opening-trainer-data-design.md`

## Global Constraints

- All user-visible strings (opening names, line names, move explanations, descriptions) are in **PT-PT**, never PT-BR — gerúndio as "a + infinitivo", "teu/tua" not "seu/sua", infinitive instructions. (spec, `CLAUDE.md`)
- No backend/API routes — this is a static, pure-TS data module, same as `lib/settings/settings.ts`. (spec)
- `id` fields are kebab-case and must stay stable — they'll become route segments (`/aprender/aberturas/[id]`) in a later sub-project, not built here. (spec)
- Each `OpeningLine` is an **independent, complete sequence from move 1** — no branch-point/tree modelling. (spec)
- Each line is 8-12 half-moves (`moves.length`). (spec)
- `chess.js`'s `.move()` throws on an illegal move in this codebase's version (`^1.4.0`) — wrap it in `try/catch`, matching the existing pattern in `lib/chess/useChessGame.ts`'s `makeMove`, not a `null`-return check.
- Test files sit next to the module they test (`*.test.ts`), per every existing module in `lib/chess/` and `lib/settings/`.

---

### Task 1: Opening types + hand-authored content (`lib/openings/types.ts`, `lib/openings/data.ts`)

**Files:**
- Create: `lib/openings/types.ts`
- Create: `lib/openings/data.ts`
- Test: `lib/openings/data.test.ts`

**Interfaces:**
- Produces: `OpeningMove { san: string; explanation: string }`, `OpeningLine { name: string; eco?: string; moves: OpeningMove[] }`, `Opening { id: string; name: string; description: string; lines: OpeningLine[] }`, and `export const OPENINGS: Opening[]` (exactly 12 entries) — Task 2's `replayLine` and its tests consume `OpeningLine` and `OPENINGS` directly from these two files.

- [ ] **Step 1: Write the failing test**

Create `lib/openings/data.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { OPENINGS } from './data';

describe('OPENINGS', () => {
  it('has exactly 12 openings', () => {
    expect(OPENINGS).toHaveLength(12);
  });

  it('has unique kebab-case ids', () => {
    const ids = OPENINGS.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });

  it('gives every opening a non-empty name and description', () => {
    for (const opening of OPENINGS) {
      expect(opening.name.length).toBeGreaterThan(0);
      expect(opening.description.length).toBeGreaterThan(0);
    }
  });

  it('gives every opening 1-3 lines, each with 8-12 moves and a name', () => {
    for (const opening of OPENINGS) {
      expect(opening.lines.length).toBeGreaterThan(0);
      expect(opening.lines.length).toBeLessThanOrEqual(3);
      for (const line of opening.lines) {
        expect(line.name.length).toBeGreaterThan(0);
        expect(line.moves.length).toBeGreaterThanOrEqual(8);
        expect(line.moves.length).toBeLessThanOrEqual(12);
        for (const move of line.moves) {
          expect(move.san.length).toBeGreaterThan(0);
          expect(move.explanation.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/openings/data.test.ts`
Expected: FAIL — `Cannot find module './data'` (neither `types.ts` nor `data.ts` exist yet).

- [ ] **Step 3: Write `lib/openings/types.ts`**

```ts
/**
 * Um lance de uma linha de abertura: a notação e a explicação em PT-PT
 * escrita à mão para esse lance específico nessa linha específica.
 */
export interface OpeningMove {
  san: string;
  explanation: string;
}

/**
 * Uma linha completa e independente desde o lance 1 — a linha
 * principal de uma abertura, ou uma das suas variações nomeadas.
 * Não é um ramo que parte de um ponto da linha principal: mesmo que
 * partilhe os primeiros lances com outra linha da mesma abertura, tem
 * a sua própria sequência completa (ver spec: decisão deliberada, mais
 * simples do que uma árvore de variações).
 */
export interface OpeningLine {
  name: string;
  /** Código ECO, informativo — não validado por nenhuma lógica. */
  eco?: string;
  moves: OpeningMove[];
}

export interface Opening {
  /** Slug kebab-case, estável — vai ser usado como segmento de rota. */
  id: string;
  name: string;
  /** 1-2 frases para uma futura lista/hub de aberturas. */
  description: string;
  /** Linha principal + 1-2 variações nomeadas. */
  lines: OpeningLine[];
}
```

- [ ] **Step 4: Write `lib/openings/data.ts`**

```ts
import type { Opening } from './types';

export const OPENINGS: Opening[] = [
  {
    id: 'abertura-italiana',
    name: 'Abertura Italiana',
    description:
      'Uma das aberturas mais antigas e diretas: o bispo branco mira logo a casa fraca f7, levando a posições ricas em ataque.',
    lines: [
      {
        name: 'Linha principal (Giuoco Piano)',
        eco: 'C50',
        moves: [
          { san: 'e4', explanation: 'Ocupa o centro e abre linha para o bispo e a dama.' },
          { san: 'e5', explanation: 'Resposta simétrica: também disputa o centro imediatamente.' },
          { san: 'Nf3', explanation: 'Desenvolve uma peça, ataca o peão e5 e prepara o roque.' },
          { san: 'Nc6', explanation: 'Defende o peão e5 e desenvolve uma peça em direção ao centro.' },
          { san: 'Bc4', explanation: 'O bispo mira a casa fraca f7, o alvo clássico da Italiana.' },
          { san: 'Bc5', explanation: 'Desenvolve o bispo para a mesma diagonal, espelhando a ideia branca.' },
          { san: 'c3', explanation: 'Prepara d4 para ganhar espaço no centro, apoiado por este peão.' },
          { san: 'Nf6', explanation: 'Desenvolve o último cavalo menor e ataca o peão e4.' },
          { san: 'd3', explanation: 'Protege o peão e4 e mantém a estrutura sólida antes do roque.' },
        ],
      },
      {
        name: 'Gambito Evans',
        eco: 'C51',
        moves: [
          { san: 'e4', explanation: 'Ocupa o centro e abre linha para o bispo e a dama.' },
          { san: 'e5', explanation: 'Resposta simétrica: também disputa o centro imediatamente.' },
          { san: 'Nf3', explanation: 'Desenvolve uma peça, ataca o peão e5 e prepara o roque.' },
          { san: 'Nc6', explanation: 'Defende o peão e5 e desenvolve uma peça em direção ao centro.' },
          { san: 'Bc4', explanation: 'O bispo mira a casa fraca f7, o alvo clássico da Italiana.' },
          { san: 'Bc5', explanation: 'Desenvolve o bispo para a mesma diagonal, espelhando a ideia branca.' },
          { san: 'b4', explanation: 'O Gambito Evans: sacrifica um peão para ganhar tempo e um centro forte.' },
          { san: 'Bxb4', explanation: 'Aceita o peão oferecido — recusar também é possível, mas capturar é a linha principal.' },
          { san: 'c3', explanation: 'Ataca o bispo e prepara d4, construindo um grande centro de peões em troca do material sacrificado.' },
        ],
      },
    ],
  },
  {
    id: 'abertura-espanhola',
    name: 'Abertura Espanhola',
    description:
      'A abertura mais jogada da história ao mais alto nível: o bispo pressiona o cavalo que defende o peão e5, para uma luta longa e rica.',
    lines: [
      {
        name: 'Linha principal (Variante Fechada)',
        eco: 'C84',
        moves: [
          { san: 'e4', explanation: 'Ocupa o centro.' },
          { san: 'e5', explanation: 'Resposta simétrica.' },
          { san: 'Nf3', explanation: 'Desenvolve e ataca o peão e5.' },
          { san: 'Nc6', explanation: 'Defende o peão e5.' },
          { san: 'Bb5', explanation: 'A Espanhola: o bispo pressiona o cavalo que defende e5.' },
          { san: 'a6', explanation: 'Pergunta ao bispo: obriga-o a decidir-se (recuar, trocar ou avançar).' },
          { san: 'Ba4', explanation: 'Mantém a pressão sobre o cavalo, mirando indiretamente o peão e5.' },
          { san: 'Nf6', explanation: 'Desenvolve o último cavalo menor e contra-ataca o peão e4.' },
          { san: 'O-O', explanation: 'Roca, colocando o rei em segurança antes de continuar o plano central.' },
          { san: 'Be7', explanation: 'Desenvolve o bispo e prepara o próprio roque.' },
          { san: 'Re1', explanation: 'Reforça o peão e4 pela coluna, preparando um futuro d4.' },
        ],
      },
      {
        name: 'Variante Berlinense',
        eco: 'C65',
        moves: [
          { san: 'e4', explanation: 'Ocupa o centro.' },
          { san: 'e5', explanation: 'Resposta simétrica.' },
          { san: 'Nf3', explanation: 'Desenvolve e ataca o peão e5.' },
          { san: 'Nc6', explanation: 'Defende o peão e5.' },
          { san: 'Bb5', explanation: 'A Espanhola: pressiona o cavalo que defende e5.' },
          { san: 'Nf6', explanation: 'A Defesa Berlinense: contra-ataca o peão e4 em vez de responder a6.' },
          { san: 'O-O', explanation: 'Ignora a ameaça momentânea a e4 — o peão está tacitamente protegido por uma combinação tática.' },
          { san: 'Nxe4', explanation: 'As pretas capturam o peão e4, a linha principal da Berlinense.' },
          { san: 'd4', explanation: 'Abre o centro para explorar o cavalo avançado e preparar a recuperação do material.' },
          { san: 'Nd6', explanation: 'O cavalo recua, atacando o bispo em b5 e preparando um final de peças característico desta variante.' },
        ],
      },
    ],
  },
  {
    id: 'defesa-siciliana',
    name: 'Defesa Siciliana',
    description:
      'A resposta mais popular e agressiva a 1.e4: as pretas contra-atacam assimetricamente, gerando posições muito ricas para os dois lados.',
    lines: [
      {
        name: 'Linha principal (Aberta)',
        eco: 'B50',
        moves: [
          { san: 'e4', explanation: 'Ocupa o centro.' },
          { san: 'c5', explanation: 'A Siciliana: pretas contra-atacam assimetricamente em vez de responder e5.' },
          { san: 'Nf3', explanation: 'Desenvolve e prepara d4 para abrir o centro.' },
          { san: 'd6', explanation: 'Prepara o desenvolvimento do cavalo para f6 sem o expor a um avanço do peão e.' },
          { san: 'd4', explanation: 'Abre o centro, oferecendo a troca de peões.' },
          { san: 'cxd4', explanation: 'Captura, aceitando a troca central.' },
          { san: 'Nxd4', explanation: 'O cavalo recaptura, centralizando-se e mantendo o controlo do centro.' },
          { san: 'Nf6', explanation: 'Desenvolve o cavalo, atacando o peão e4.' },
          { san: 'Nc3', explanation: 'Defende o peão e4 e desenvolve mais uma peça.' },
        ],
      },
      {
        name: 'Najdorf',
        eco: 'B90',
        moves: [
          { san: 'e4', explanation: 'Ocupa o centro.' },
          { san: 'c5', explanation: 'A Siciliana: pretas contra-atacam assimetricamente em vez de responder e5.' },
          { san: 'Nf3', explanation: 'Desenvolve e prepara d4 para abrir o centro.' },
          { san: 'd6', explanation: 'Prepara o desenvolvimento do cavalo para f6 sem o expor a um avanço do peão e.' },
          { san: 'd4', explanation: 'Abre o centro, oferecendo a troca de peões.' },
          { san: 'cxd4', explanation: 'Captura, aceitando a troca central.' },
          { san: 'Nxd4', explanation: 'O cavalo recaptura, centralizando-se e mantendo o controlo do centro.' },
          { san: 'Nf6', explanation: 'Desenvolve o cavalo, atacando o peão e4.' },
          { san: 'Nc3', explanation: 'Defende o peão e4 e desenvolve mais uma peça.' },
          { san: 'a6', explanation: 'A Najdorf: impede Bb5+/Nb5 e mantém flexibilidade total para o desenvolvimento seguinte (...e5, ...b5, etc.).' },
        ],
      },
      {
        name: 'Dragão',
        eco: 'B70',
        moves: [
          { san: 'e4', explanation: 'Ocupa o centro.' },
          { san: 'c5', explanation: 'A Siciliana: pretas contra-atacam assimetricamente em vez de responder e5.' },
          { san: 'Nf3', explanation: 'Desenvolve e prepara d4 para abrir o centro.' },
          { san: 'd6', explanation: 'Prepara o desenvolvimento do cavalo para f6 sem o expor a um avanço do peão e.' },
          { san: 'd4', explanation: 'Abre o centro, oferecendo a troca de peões.' },
          { san: 'cxd4', explanation: 'Captura, aceitando a troca central.' },
          { san: 'Nxd4', explanation: 'O cavalo recaptura, centralizando-se e mantendo o controlo do centro.' },
          { san: 'Nf6', explanation: 'Desenvolve o cavalo, atacando o peão e4.' },
          { san: 'Nc3', explanation: 'Defende o peão e4 e desenvolve mais uma peça.' },
          { san: 'g6', explanation: 'O Dragão: prepara Bg7, fianchettando o bispo para uma diagonal poderosa apontada ao centro e ao flanco de dama branco.' },
        ],
      },
    ],
  },
  {
    id: 'defesa-francesa',
    name: 'Defesa Francesa',
    description:
      'Uma defesa sólida contra 1.e4, onde as pretas aceitam um bispo temporariamente fechado em troca de uma estrutura de peões robusta.',
    lines: [
      {
        name: 'Linha principal (Variante de Troca)',
        eco: 'C01',
        moves: [
          { san: 'e4', explanation: 'Ocupa o centro.' },
          { san: 'e6', explanation: 'A Francesa: prepara ...d5 sustentando o contra-ataque central antes de desenvolver o bispo de casas claras.' },
          { san: 'd4', explanation: 'Reforça o centro.' },
          { san: 'd5', explanation: 'Desafia diretamente o peão e4.' },
          { san: 'exd5', explanation: 'Variante de Troca: simplifica o centro em vez de manter a tensão.' },
          { san: 'exd5', explanation: 'Recaptura, chegando a uma posição simétrica e mais tranquila.' },
          { san: 'Nf3', explanation: 'Desenvolve, controlando o centro.' },
          { san: 'Nf6', explanation: 'Desenvolve simetricamente.' },
          { san: 'Bd3', explanation: 'Desenvolve o bispo para uma diagonal ativa, visando o flanco do rei.' },
        ],
      },
      {
        name: 'Variante do Avanço',
        eco: 'C02',
        moves: [
          { san: 'e4', explanation: 'Ocupa o centro.' },
          { san: 'e6', explanation: 'A Francesa: prepara ...d5.' },
          { san: 'd4', explanation: 'Reforça o centro.' },
          { san: 'd5', explanation: 'Desafia o peão e4.' },
          { san: 'e5', explanation: 'Variante do Avanço: ganha espaço, fechando o centro e trancando o bispo de casas claras das pretas.' },
          { san: 'c5', explanation: 'Contra-ataca imediatamente a base da cadeia de peões brancos, o plano típico contra o Avanço.' },
          { san: 'c3', explanation: 'Defende o peão d4, mantendo a cadeia central intacta.' },
          { san: 'Nc6', explanation: 'Desenvolve, pressionando ainda mais o peão d4.' },
          { san: 'Nf3', explanation: 'Defende o peão d4 mais uma vez antes de continuar o desenvolvimento.' },
        ],
      },
    ],
  },
  {
    id: 'defesa-caro-kann',
    name: 'Defesa Caro-Kann',
    description:
      'Como a Francesa, mas com o bispo de casas claras livre desde o início — uma escolha sólida e pouco arriscada contra 1.e4.',
    lines: [
      {
        name: 'Linha principal (Variante do Avanço)',
        eco: 'B12',
        moves: [
          { san: 'e4', explanation: 'Ocupa o centro.' },
          { san: 'c6', explanation: 'A Caro-Kann: prepara ...d5.' },
          { san: 'd4', explanation: 'Reforça o centro.' },
          { san: 'd5', explanation: 'Desafia o peão e4.' },
          { san: 'e5', explanation: 'Variante do Avanço: ganha espaço fechando o centro.' },
          { san: 'Bf5', explanation: 'Desenvolve o bispo de casas claras antes de o fechar com ...e6 — a vantagem estrutural clássica da Caro-Kann face à Francesa.' },
          { san: 'Nf3', explanation: 'Desenvolve, evitando por agora que ...Bg4 fixe o cavalo.' },
          { san: 'e6', explanation: 'Abre espaço para o outro bispo e prepara o desenvolvimento do cavalo em direção ao centro.' },
          { san: 'Be2', explanation: 'Desenvolve com solidez, preparando o roque.' },
          { san: 'c5', explanation: 'Contra-ataca a base da cadeia de peões brancos, tal como na Francesa.' },
        ],
      },
      {
        name: 'Variante Clássica',
        eco: 'B18',
        moves: [
          { san: 'e4', explanation: 'Ocupa o centro.' },
          { san: 'c6', explanation: 'A Caro-Kann: prepara ...d5.' },
          { san: 'd4', explanation: 'Reforça o centro.' },
          { san: 'd5', explanation: 'Desafia o peão e4.' },
          { san: 'Nc3', explanation: 'Defende o peão e4 desenvolvendo uma peça.' },
          { san: 'dxe4', explanation: 'Captura o peão central, aceitando a troca.' },
          { san: 'Nxe4', explanation: 'Recaptura, deixando o cavalo centralizado mas atacável.' },
          { san: 'Bf5', explanation: 'Desenvolve o bispo antes de fechar-lhe a saída com ...e6, a ideia-chave da Caro-Kann.' },
          { san: 'Ng3', explanation: 'Ataca o bispo, ganhando tempo.' },
          { san: 'Bg6', explanation: 'Recua mantendo o bispo ativo fora da cadeia de peões.' },
        ],
      },
    ],
  },
  {
    id: 'gambito-da-dama',
    name: 'Gambito da Dama',
    description:
      'A abertura clássica de 1.d4: as brancas oferecem um peão lateral para ganhar espaço e tempo no centro.',
    lines: [
      {
        name: 'Aceite',
        eco: 'D20',
        moves: [
          { san: 'd4', explanation: 'Ocupa o centro pelo lado da dama.' },
          { san: 'd5', explanation: 'Resposta simétrica, disputando o centro.' },
          { san: 'c4', explanation: 'O Gambito da Dama: oferece este peão para desviar o peão d5 e ganhar mais espaço central.' },
          { san: 'dxc4', explanation: 'Aceita o gambito, capturando o peão oferecido.' },
          { san: 'Nf3', explanation: 'Desenvolve antes de recuperar o peão, evitando perder tempo.' },
          { san: 'Nf6', explanation: 'Desenvolve simetricamente.' },
          { san: 'e3', explanation: 'Prepara Bxc4, recuperando o peão em breve.' },
          { san: 'e6', explanation: 'Desenvolve espaço para o bispo de casas claras e prepara o próprio desenvolvimento.' },
          { san: 'Bxc4', explanation: 'Recupera o peão sacrificado, com uma posição de desenvolvimento natural e boa.' },
        ],
      },
      {
        name: 'Recusado',
        eco: 'D30',
        moves: [
          { san: 'd4', explanation: 'Ocupa o centro.' },
          { san: 'd5', explanation: 'Resposta simétrica.' },
          { san: 'c4', explanation: 'Oferece o peão do gambito.' },
          { san: 'e6', explanation: 'Recusa capturar: reforça o centro em vez de ganhar o peão, a ideia da Defesa Recusada.' },
          { san: 'Nc3', explanation: 'Desenvolve, mantendo a pressão sobre d5.' },
          { san: 'Nf6', explanation: 'Desenvolve, defendendo indiretamente d5.' },
          { san: 'Bg5', explanation: 'Prende o cavalo à dama, uma pressão típica desta variante.' },
          { san: 'Be7', explanation: 'Desenvolve o bispo e prepara quebrar a prisão com ...Ne4 ou apenas continuar o roque.' },
          { san: 'e3', explanation: 'Reforça o centro e abre a diagonal para o bispo de casas claras.' },
        ],
      },
    ],
  },
  {
    id: 'defesa-eslava',
    name: 'Defesa Eslava',
    description:
      'Uma resposta sólida ao Gambito da Dama, que reforça o centro sem fechar o bispo de casas claras.',
    lines: [
      {
        name: 'Linha principal',
        eco: 'D10',
        moves: [
          { san: 'd4', explanation: 'Ocupa o centro.' },
          { san: 'd5', explanation: 'Resposta simétrica.' },
          { san: 'c4', explanation: 'Oferece o peão do gambito.' },
          { san: 'c6', explanation: 'A Defesa Eslava: reforça d5 com este peão, mantendo o bispo de casas claras livre (ao contrário da Recusada).' },
          { san: 'Nf3', explanation: 'Desenvolve.' },
          { san: 'Nf6', explanation: 'Desenvolve simetricamente.' },
          { san: 'Nc3', explanation: 'Desenvolve, mantendo a pressão central.' },
          { san: 'dxc4', explanation: 'Captura o peão do gambito, um plano típico da Eslava.' },
          { san: 'a4', explanation: 'Impede ...b5, que defenderia o peão extra, preparando a sua recuperação.' },
        ],
      },
      {
        name: 'Semi-Eslava',
        eco: 'D43',
        moves: [
          { san: 'd4', explanation: 'Ocupa o centro.' },
          { san: 'd5', explanation: 'Resposta simétrica.' },
          { san: 'c4', explanation: 'Oferece o peão do gambito.' },
          { san: 'c6', explanation: 'A Defesa Eslava: reforça d5.' },
          { san: 'Nf3', explanation: 'Desenvolve.' },
          { san: 'Nf6', explanation: 'Desenvolve simetricamente.' },
          { san: 'Nc3', explanation: 'Desenvolve, mantendo a pressão central.' },
          { san: 'e6', explanation: 'A Semi-Eslava: acrescenta este peão, combinando as ideias da Eslava com as da Recusada, ao custo de fechar temporariamente o bispo de casas claras.' },
          { san: 'Bg5', explanation: 'Prende o cavalo à dama, tal como na Recusada, aproveitando que o bispo eslavo ainda não saiu.' },
        ],
      },
    ],
  },
  {
    id: 'abertura-inglesa',
    name: 'Abertura Inglesa',
    description:
      'Uma abertura flexível pelo flanco de dama, que pode transpor para muitas estruturas diferentes.',
    lines: [
      {
        name: 'Linha principal (Simétrica)',
        eco: 'A30',
        moves: [
          { san: 'c4', explanation: 'A Inglesa: ocupa o centro pelo flanco, deixando mais opções de estrutura de peões em aberto.' },
          { san: 'c5', explanation: 'Resposta simétrica, espelhando o plano branco.' },
          { san: 'Nf3', explanation: 'Desenvolve, controlando o centro à distância.' },
          { san: 'Nf6', explanation: 'Desenvolve simetricamente.' },
          { san: 'g3', explanation: 'Prepara o fianchetto do bispo, um plano típico da Inglesa.' },
          { san: 'b6', explanation: 'Espelha o plano com o próprio fianchetto.' },
          { san: 'Bg2', explanation: 'Completa o fianchetto, pressionando a diagonal longa.' },
          { san: 'Bb7', explanation: 'Completa o fianchetto simétrico.' },
          { san: 'O-O', explanation: 'Roca, colocando o rei em segurança numa posição ainda muito flexível.' },
        ],
      },
      {
        name: 'Quatro Cavalos',
        eco: 'A28',
        moves: [
          { san: 'c4', explanation: 'A Inglesa: ocupa o centro pelo flanco.' },
          { san: 'c5', explanation: 'Resposta simétrica.' },
          { san: 'Nf3', explanation: 'Desenvolve.' },
          { san: 'Nc6', explanation: 'Desenvolve, controlando o centro.' },
          { san: 'Nc3', explanation: 'Desenvolve simetricamente, a linha dos Quatro Cavalos.' },
          { san: 'Nf6', explanation: 'Completa o desenvolvimento dos quatro cavalos.' },
          { san: 'g3', explanation: 'Prepara o fianchetto do bispo.' },
          { san: 'd5', explanation: 'Rompe no centro antes que as brancas completem o fianchetto, a ideia principal desta variante.' },
          { san: 'cxd5', explanation: 'Captura, aceitando entrar numa posição mais aberta e tática.' },
        ],
      },
    ],
  },
  {
    id: 'defesa-pirc',
    name: 'Defesa Pirc',
    description:
      'Uma defesa hipermoderna contra 1.e4: as pretas deixam as brancas ocupar o centro, para o atacar depois com peças desenvolvidas em fianchetto.',
    lines: [
      {
        name: 'Linha principal (Ataque Austríaco)',
        eco: 'B09',
        moves: [
          { san: 'e4', explanation: 'Ocupa o centro.' },
          { san: 'd6', explanation: 'A Pirc: adia o contacto central, preparando o fianchetto do bispo em vez de responder ...e5 ou ...c5.' },
          { san: 'd4', explanation: 'Reforça o centro.' },
          { san: 'Nf6', explanation: 'Desenvolve, atacando o peão e4.' },
          { san: 'Nc3', explanation: 'Defende o peão e4.' },
          { san: 'g6', explanation: 'Prepara o fianchetto do bispo, o plano central da Pirc.' },
          { san: 'f4', explanation: 'Ataque Austríaco: constrói um grande centro de peões e prepara um ataque agressivo no flanco do rei.' },
          { san: 'Bg7', explanation: 'Completa o fianchetto, pressionando o centro alargado das brancas.' },
          { san: 'Nf3', explanation: 'Desenvolve, reforçando o centro antes de continuar o plano de ataque.' },
        ],
      },
      {
        name: 'Variante Clássica',
        eco: 'B08',
        moves: [
          { san: 'e4', explanation: 'Ocupa o centro.' },
          { san: 'd6', explanation: 'A Pirc: adia o contacto central, preparando o fianchetto do bispo.' },
          { san: 'd4', explanation: 'Reforça o centro.' },
          { san: 'Nf6', explanation: 'Desenvolve, atacando o peão e4.' },
          { san: 'Nc3', explanation: 'Defende o peão e4.' },
          { san: 'g6', explanation: 'Prepara o fianchetto do bispo.' },
          { san: 'Nf3', explanation: 'Desenvolve com solidez, em vez de avançar já o peão f.' },
          { san: 'Bg7', explanation: 'Completa o fianchetto.' },
          { san: 'Be2', explanation: 'Desenvolve o bispo de forma modesta, mas sólida, preparando o roque.' },
          { san: 'O-O', explanation: 'Roca, completando o desenvolvimento inicial em segurança.' },
        ],
      },
    ],
  },
  {
    id: 'abertura-escocesa',
    name: 'Abertura Escocesa',
    description:
      'Uma alternativa direta à Espanhola: as brancas abrem o centro já no terceiro lance.',
    lines: [
      {
        name: 'Linha principal',
        eco: 'C44',
        moves: [
          { san: 'e4', explanation: 'Ocupa o centro.' },
          { san: 'e5', explanation: 'Resposta simétrica.' },
          { san: 'Nf3', explanation: 'Desenvolve, atacando o peão e5.' },
          { san: 'Nc6', explanation: 'Defende o peão e5.' },
          { san: 'd4', explanation: 'A Escocesa: abre o centro imediatamente em vez de desenvolver o bispo primeiro.' },
          { san: 'exd4', explanation: 'Captura, aceitando a troca central.' },
          { san: 'Nxd4', explanation: 'Recaptura, centralizando o cavalo.' },
          { san: 'Nf6', explanation: 'Desenvolve, atacando o peão e4.' },
          { san: 'Nc3', explanation: 'Defende o peão e4, desenvolvendo mais uma peça.' },
        ],
      },
      {
        name: 'Gambito Göring',
        eco: 'C44',
        moves: [
          { san: 'e4', explanation: 'Ocupa o centro.' },
          { san: 'e5', explanation: 'Resposta simétrica.' },
          { san: 'Nf3', explanation: 'Desenvolve, atacando o peão e5.' },
          { san: 'Nc6', explanation: 'Defende o peão e5.' },
          { san: 'd4', explanation: 'A Escocesa: abre o centro imediatamente.' },
          { san: 'exd4', explanation: 'Captura, aceitando a troca central.' },
          { san: 'c3', explanation: 'O Gambito Göring: oferece mais um peão para acelerar o desenvolvimento e abrir linhas.' },
          { san: 'dxc3', explanation: 'Aceita o segundo peão oferecido.' },
          { san: 'Nxc3', explanation: 'Recaptura, com um grande avanço de desenvolvimento em troca dos peões sacrificados.' },
        ],
      },
    ],
  },
  {
    id: 'defesa-escandinava',
    name: 'Defesa Escandinava',
    description:
      'Uma resposta direta e pouco convencional a 1.e4: as pretas desafiam o peão central logo no primeiro lance.',
    lines: [
      {
        name: 'Linha principal (2...Dxd5)',
        eco: 'B01',
        moves: [
          { san: 'e4', explanation: 'Ocupa o centro.' },
          { san: 'd5', explanation: 'A Escandinava: desafia o peão e4 imediatamente, no primeiro lance.' },
          { san: 'exd5', explanation: 'Captura o peão oferecido.' },
          { san: 'Qxd5', explanation: 'Recaptura com a dama — pouco convencional tão cedo, mas direto.' },
          { san: 'Nc3', explanation: 'Ataca a dama, ganhando tempo de desenvolvimento.' },
          { san: 'Qa5', explanation: 'Recua para uma casa ativa, mantendo pressão sobre e5 e a diagonal para o rei branco.' },
          { san: 'd4', explanation: 'Reforça o centro, aproveitando o tempo ganho.' },
          { san: 'Nf6', explanation: 'Desenvolve mais uma peça, seguindo o plano natural de acabar a mobilização antes de rocar.' },
          { san: 'Nf3', explanation: 'Desenvolve, protegendo o peão d4 e preparando o roque.' },
        ],
      },
      {
        name: 'Variante Moderna (2...Cf6)',
        eco: 'B01',
        moves: [
          { san: 'e4', explanation: 'Ocupa o centro.' },
          { san: 'd5', explanation: 'A Escandinava: desafia o peão e4 imediatamente.' },
          { san: 'exd5', explanation: 'Captura o peão oferecido.' },
          { san: 'Nf6', explanation: 'Variante Moderna: em vez de recapturar já com a dama, desenvolve primeiro este cavalo, que vai recuperar o peão a seguir.' },
          { san: 'd4', explanation: 'Reforça o centro, defendendo o peão extra por agora.' },
          { san: 'Nxd5', explanation: 'Recupera o peão com o cavalo, evitando expor a dama cedo demais.' },
          { san: 'Nf3', explanation: 'Desenvolve, protegendo o centro.' },
          { san: 'Bg4', explanation: 'Desenvolve o bispo antes de lhe fechar a saída, prendendo o cavalo à dama.' },
          { san: 'Be2', explanation: 'Desenvolve com solidez, preparando quebrar a prisão com o roque e ...h3 mais tarde.' },
        ],
      },
    ],
  },
  {
    id: 'sistema-londres',
    name: 'Sistema Londres',
    description:
      'Uma configuração sólida e fácil de aprender para as brancas, jogável com praticamente a mesma ideia contra quase qualquer resposta preta.',
    lines: [
      {
        name: 'Linha principal',
        eco: 'D02',
        moves: [
          { san: 'd4', explanation: 'Ocupa o centro.' },
          { san: 'd5', explanation: 'Resposta simétrica.' },
          { san: 'Nf3', explanation: 'Desenvolve, controlando o centro.' },
          { san: 'Nf6', explanation: 'Desenvolve simetricamente.' },
          { san: 'Bf4', explanation: 'O Sistema Londres: desenvolve o bispo antes de lhe fechar a saída com e3, uma configuração sólida jogável contra quase qualquer resposta preta.' },
          { san: 'e6', explanation: 'Desenvolve espaço para o outro bispo.' },
          { san: 'e3', explanation: 'Reforça o centro e prepara o desenvolvimento do bispo de casas claras.' },
          { san: 'Bd6', explanation: 'Desenvolve o bispo, desafiando o bispo branco na mesma diagonal.' },
          { san: 'Bg3', explanation: 'Evita a troca de bispos, mantendo a peça ativa.' },
        ],
      },
      {
        name: 'Contra a Defesa Eslava',
        eco: 'D02',
        moves: [
          { san: 'd4', explanation: 'Ocupa o centro.' },
          { san: 'd5', explanation: 'Resposta simétrica.' },
          { san: 'Nf3', explanation: 'Desenvolve.' },
          { san: 'Nf6', explanation: 'Desenvolve simetricamente.' },
          { san: 'Bf4', explanation: 'O Sistema Londres: desenvolve o bispo antes de lhe fechar a saída com e3.' },
          { san: 'c6', explanation: 'Pretas respondem com uma estrutura tipo Eslava, reforçando d5 e preparando ...Bf5.' },
          { san: 'e3', explanation: 'Reforça o centro.' },
          { san: 'Bf5', explanation: 'Desenvolve o próprio bispo de casas claras antes de o fechar, espelhando a ideia branca.' },
          { san: 'Bd3', explanation: 'Oferece a troca de bispos, disposto a simplificar para uma posição sólida e fácil de jogar.' },
        ],
      },
    ],
  },
];
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/openings/data.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/openings/types.ts lib/openings/data.ts lib/openings/data.test.ts
git commit -m "feat: opening trainer data — types + 12 ECO-coded openings (PT-PT)"
```

---

### Task 2: `replayLine` — pure line-replay helper (`lib/openings/replayLine.ts`)

**Files:**
- Create: `lib/openings/replayLine.ts`
- Test: `lib/openings/replayLine.test.ts`

**Interfaces:**
- Consumes: `OpeningLine`, `OPENINGS` from `lib/openings/data.ts`/`lib/openings/types.ts` (Task 1).
- Produces: `ReplayedMove { fen: string; from: Square; to: Square; promotion?: string; san: string; explanation: string }` and `export function replayLine(line: OpeningLine): ReplayedMove[]` — the function future study-mode/practice-mode code will call; no other task in this plan consumes it, but it's the deliverable the whole sub-project exists to produce.

- [ ] **Step 1: Write the failing test**

Create `lib/openings/replayLine.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { replayLine } from './replayLine';
import { OPENINGS } from './data';
import type { OpeningLine } from './types';

describe('replayLine', () => {
  it('replays a short line move by move, returning fen/from/to/san/explanation', () => {
    const line: OpeningLine = {
      name: 'Linha de teste',
      moves: [
        { san: 'e4', explanation: 'Ocupa o centro.' },
        { san: 'e5', explanation: 'Resposta simétrica.' },
      ],
    };

    const result = replayLine(line);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
      from: 'e2',
      to: 'e4',
      promotion: undefined,
      san: 'e4',
      explanation: 'Ocupa o centro.',
    });
    expect(result[1].fen).toBe(
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2'
    );
    expect(result[1].from).toBe('e7');
    expect(result[1].to).toBe('e5');
    expect(result[1].explanation).toBe('Resposta simétrica.');
  });

  it('throws a descriptive error for an illegal move', () => {
    const line: OpeningLine = {
      name: 'Linha inválida',
      moves: [{ san: 'e5', explanation: 'Não é um lance legal de abertura.' }],
    };

    expect(() => replayLine(line)).toThrow(/Lance ilegal/);
  });

  it('replays every line of every real opening without throwing', () => {
    for (const opening of OPENINGS) {
      for (const line of opening.lines) {
        const result = replayLine(line);
        expect(result).toHaveLength(line.moves.length);
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/openings/replayLine.test.ts`
Expected: FAIL — `Cannot find module './replayLine'`.

- [ ] **Step 3: Write `lib/openings/replayLine.ts`**

```ts
import { Chess, type Square } from 'chess.js';
import type { OpeningLine } from './types';

export interface ReplayedMove {
  fen: string;
  from: Square;
  to: Square;
  promotion?: string;
  san: string;
  explanation: string;
}

/**
 * Reproduz uma linha de abertura desde a posição inicial, lance a
 * lance, devolvendo o FEN resultante e os campos de que tanto o modo
 * de estudo (desenhar o tabuleiro + mostrar a explicação) como o modo
 * de prática (comparar o lance do utilizador com o {from,to,promotion}
 * esperado) vão precisar — sem nenhum dos dois ter de reimplementar a
 * reprodução da linha.
 *
 * Lança um erro descritivo se algum `san` for ilegal na posição em que
 * é jogado — nunca deve acontecer em produção (ver replayLine.test.ts,
 * que valida todas as linhas reais de `OPENINGS`), mas serve como rede
 * de segurança clara para conteúdo mal escrito.
 */
export function replayLine(line: OpeningLine): ReplayedMove[] {
  const chess = new Chess();

  return line.moves.map(({ san, explanation }) => {
    let move;
    try {
      move = chess.move(san);
    } catch {
      move = null;
    }

    if (!move) {
      throw new Error(
        `Lance ilegal "${san}" na linha "${line.name}" a partir de ${chess.fen()}`
      );
    }

    return {
      fen: chess.fen(),
      from: move.from as Square,
      to: move.to as Square,
      promotion: move.promotion,
      san: move.san,
      explanation,
    };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/openings/replayLine.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npm run test && npx tsc --noEmit`
Expected: all tests pass (existing suite + the 7 new tests across both files), no type errors.

- [ ] **Step 6: Run lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/openings/replayLine.ts lib/openings/replayLine.test.ts
git commit -m "feat: opening trainer — replayLine helper, validates all opening content"
```
