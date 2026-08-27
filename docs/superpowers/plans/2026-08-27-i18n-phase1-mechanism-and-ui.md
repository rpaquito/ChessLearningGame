# i18n Fase 1 — Mecanismo + Tradução da UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar `language` (`'pt' | 'en'`) uma definição real e persistida, com
deteção do browser no arranque, e traduzir toda a UI estática da app (menus,
botões, painéis, modais, páginas do tutorial) — sem tocar em
`lib/openings/data.ts` nem `lib/chess/moveExplanation.ts`, que ficam para as
Fases 2 e 3.

**Architecture:** `lib/i18n/` novo (tipos, deteção, dicionários PT/EN,
`useTranslation()`), `Settings` ganha um campo `language`, e cada
página/componente com texto visível passa a ler `t` em vez de strings
literais. Sem rotas por idioma, sem Context novo — `useTranslation()` é um
hook fino sobre o `useSettings()` já existente.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest +
Testing Library, sem dependências novas.

**Spec:** `docs/superpowers/specs/2026-08-27-multi-language-i18n-design.md`

## Global Constraints

- Todo o texto em inglês usa ortografia americana (`color`, não `colour`).
- `dictionaries/pt.ts` tem de ser **byte-idêntico** ao texto PT-PT que
  substitui — é o que garante que nenhum teste existente muda de
  comportamento nesta fase.
- Nomes de idiomas no seletor de `/opções` ficam sempre nos próprios
  idiomas ("Português"/"English"), independentemente do idioma ativo.
- `lib/openings/data.ts` e `lib/chess/moveExplanation.ts` **não são tocados
  nesta fase** — `opening.name`/`description`/`line.name`,
  `current.explanation` (em `OpeningStudy`/`OpeningPractice`) e
  `suggestionExplanation`/`lastMoveExplanation` (em `LearningPanel`, vindos
  de `app/jogar/page.tsx`) continuam strings PT-only até às Fases 2/3 — só
  o texto estático à volta deles é traduzido. Isto é uma limitação
  temporária e esperada de entregar as fases em separado.
- Qualquer página que ganhe `'use client'` nesta fase não pode ter
  `generateStaticParams`/`metadata` — confirmar antes de cada tarefa que
  envolva isso (só afeta as duas páginas cobertas explicitamente na Tarefa
  13, que ficam Server Component de propósito).

---

## Task 1: `lib/i18n/types.ts` + `detectLocale.ts`

**Files:**
- Create: `lib/i18n/types.ts`
- Create: `lib/i18n/detectLocale.ts`
- Test: `lib/i18n/detectLocale.test.ts`

**Interfaces:**
- Produces: `export type Locale = 'pt' | 'en';` (de `types.ts`);
  `export function detectLocale(navigatorLanguage?: string): Locale` (de
  `detectLocale.ts`).

- [ ] **Step 1: Escrever `lib/i18n/types.ts`**

```ts
export type Locale = 'pt' | 'en';

export const VALID_LOCALES: readonly Locale[] = ['pt', 'en'];
```

- [ ] **Step 2: Escrever o teste que falha primeiro**

```ts
// lib/i18n/detectLocale.test.ts
import { describe, expect, it } from 'vitest';
import { detectLocale } from './detectLocale';

describe('detectLocale', () => {
  it('deteta português a partir de "pt"', () => {
    expect(detectLocale('pt')).toBe('pt');
  });

  it('deteta português a partir de "pt-PT"', () => {
    expect(detectLocale('pt-PT')).toBe('pt');
  });

  it('deteta português a partir de "pt-BR"', () => {
    expect(detectLocale('pt-BR')).toBe('pt');
  });

  it('é insensível a maiúsculas/minúsculas', () => {
    expect(detectLocale('PT-pt')).toBe('pt');
  });

  it('cai em inglês para qualquer outro idioma', () => {
    expect(detectLocale('en-US')).toBe('en');
    expect(detectLocale('fr')).toBe('en');
    expect(detectLocale('es-ES')).toBe('en');
  });

  it('cai em inglês quando não há deteção nenhuma (undefined)', () => {
    expect(detectLocale(undefined)).toBe('en');
  });

  it('cai em inglês para uma string vazia', () => {
    expect(detectLocale('')).toBe('en');
  });
});
```

- [ ] **Step 3: Confirmar que falha**

Run: `npx vitest run lib/i18n/detectLocale.test.ts`
Expected: FAIL — `detectLocale.ts` ainda não existe.

- [ ] **Step 4: Implementar `lib/i18n/detectLocale.ts`**

```ts
import type { Locale } from './types';

/**
 * Inglês é o fallback do fallback: qualquer idioma do browser que não
 * comece por "pt" (incluindo deteção falhada/undefined) cai em inglês,
 * não em português — decisão explícita, inverte o resto de
 * DEFAULT_SETTINGS. Ver spec i18n, secção 2.
 */
export function detectLocale(navigatorLanguage?: string): Locale {
  return navigatorLanguage?.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}
```

- [ ] **Step 5: Confirmar que passa**

Run: `npx vitest run lib/i18n/detectLocale.test.ts`
Expected: PASS (7/7)

- [ ] **Step 6: Commit**

```bash
git add lib/i18n/types.ts lib/i18n/detectLocale.ts lib/i18n/detectLocale.test.ts
git commit -m "feat(i18n): add Locale type and detectLocale()

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y5poXWqz8nhndfRJvWEbbi"
```

---

## Task 2: `Settings.language` + deteção no arranque

**Files:**
- Modify: `lib/settings/settings.ts`
- Test: `lib/settings/settings.test.ts`

**Interfaces:**
- Consumes: `Locale`, `VALID_LOCALES` (de `lib/i18n/types.ts`),
  `detectLocale` (de `lib/i18n/detectLocale.ts`).
- Produces: `Settings.language: Locale`; `DEFAULT_SETTINGS.language = 'pt'`.
  `loadSettings()` mantém a mesma assinatura, mas passa a poder **escrever**
  em `localStorage` (efeito colateral documentado — ver comentário no
  código).

- [ ] **Step 1: Ler o ficheiro de teste existente para conhecer o padrão**

Run: `cat lib/settings/settings.test.ts`
(Confirma o padrão `beforeEach(() => localStorage.clear())` e o estilo de
asserção por campo — segue o mesmo estilo nos testes novos abaixo.)

- [ ] **Step 2: Escrever os testes novos que falham primeiro**

Acrescentar a `lib/settings/settings.test.ts` (dentro do `describe`
existente, dentro ou ao lado de `loadSettings`):

```ts
import { detectLocale } from '@/lib/i18n/detectLocale';
// ... (junto aos outros imports do ficheiro)

describe('loadSettings — language', () => {
  it('deteta e grava o idioma quando não há nada guardado', () => {
    vi.stubGlobal('navigator', { language: 'en-US' });
    const settings = loadSettings();
    expect(settings.language).toBe('en');
    // gravou logo, para não voltar a detetar no próximo load
    const saved = JSON.parse(window.localStorage.getItem('xadrez-settings')!);
    expect(saved.language).toBe('en');
  });

  it('deteta português quando o browser pede português', () => {
    vi.stubGlobal('navigator', { language: 'pt-PT' });
    expect(loadSettings().language).toBe('pt');
  });

  it('usa o idioma guardado sem voltar a detetar', () => {
    window.localStorage.setItem('xadrez-settings', JSON.stringify({ language: 'en' }));
    vi.stubGlobal('navigator', { language: 'pt-PT' }); // deteção diria 'pt' — não deve ser usada
    expect(loadSettings().language).toBe('en');
  });

  it('trata um idioma guardado inválido como se estivesse em falta', () => {
    window.localStorage.setItem('xadrez-settings', JSON.stringify({ language: 'fr' }));
    vi.stubGlobal('navigator', { language: 'pt-PT' });
    expect(loadSettings().language).toBe('pt');
  });

  it('DEFAULT_SETTINGS.language é "pt"', () => {
    expect(DEFAULT_SETTINGS.language).toBe('pt');
  });
});
```

Nota: `vi` já vem importado no topo do ficheiro (`import { ... vi } from
'vitest'`) — confirmar antes de assumir; se não vier, acrescentar `vi` ao
import existente.

- [ ] **Step 3: Confirmar que falham**

Run: `npx vitest run lib/settings/settings.test.ts`
Expected: FAIL — `Settings` ainda não tem `language`.

- [ ] **Step 4: Implementar em `lib/settings/settings.ts`**

```ts
import type { Difficulty } from '@/lib/chess/difficulty';
import type { PlayerColor } from '@/lib/chess/playerColor';
import type { Locale } from '@/lib/i18n/types';
import { VALID_LOCALES } from '@/lib/i18n/types';
import { detectLocale } from '@/lib/i18n/detectLocale';

export type { Locale }; // re-exportado para quem já importa tipos daqui

export type BoardTheme = 'sakura' | 'nebulosa' | 'neon';
export type BackgroundTheme = 'classico' | 'noturno';
export type PieceStyle = 'classico' | 'moderno' | 'anime';

export interface Settings {
  defaultDifficulty: Difficulty;
  defaultColor: PlayerColor;
  boardTheme: BoardTheme;
  backgroundTheme: BackgroundTheme;
  pieceStyle: PieceStyle;
  language: Locale;
}

export const DEFAULT_SETTINGS: Settings = {
  defaultDifficulty: 'facil',
  defaultColor: 'white',
  boardTheme: 'nebulosa',
  backgroundTheme: 'classico',
  pieceStyle: 'anime',
  language: 'pt',
};
```

(`STORAGE_KEY`, `VALID_DIFFICULTIES`, etc. mantêm-se; acrescentar:)

```ts
function isValidLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (VALID_LOCALES as readonly string[]).includes(value);
}
```

E dentro de `loadSettings()`, depois de montar `candidate` mas antes do
`return`:

```ts
export function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS, language: resolveInitialLocale() };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return { ...DEFAULT_SETTINGS, language: resolveInitialLocale() };
    }
    const candidate = parsed as Record<string, unknown>;

    // `language` tem uma regra diferente dos outros campos: em vez de só
    // cair em DEFAULT_SETTINGS.language quando falta/é inválido, deteta o
    // idioma do browser e GRAVA o resultado logo — para a deteção só
    // acontecer uma vez (visitante novo OU instalação anterior a esta
    // feature, sem a chave `language`). Ver spec i18n, secção 3 — pequena
    // impureza deliberada numa função hoje só-leitura.
    const language = isValidLocale(candidate.language) ? candidate.language : resolveInitialLocale();
    if (!isValidLocale(candidate.language)) {
      saveSettings({ ...loadSettingsFieldsOnly(candidate), language });
    }

    return {
      defaultDifficulty: pickValid(
        candidate.defaultDifficulty,
        VALID_DIFFICULTIES,
        DEFAULT_SETTINGS.defaultDifficulty
      ),
      defaultColor: pickValid(candidate.defaultColor, VALID_COLORS, DEFAULT_SETTINGS.defaultColor),
      boardTheme: pickValid(candidate.boardTheme, VALID_BOARD_THEMES, DEFAULT_SETTINGS.boardTheme),
      backgroundTheme: pickValid(
        candidate.backgroundTheme,
        VALID_BACKGROUND_THEMES,
        DEFAULT_SETTINGS.backgroundTheme
      ),
      pieceStyle: pickValid(candidate.pieceStyle, VALID_PIECE_STYLES, DEFAULT_SETTINGS.pieceStyle),
      language,
    };
  } catch {
    return { ...DEFAULT_SETTINGS, language: resolveInitialLocale() };
  }
}

function resolveInitialLocale(): Locale {
  return detectLocale(typeof navigator !== 'undefined' ? navigator.language : undefined);
}
```

Este `loadSettingsFieldsOnly` extra é desnecessário complicar — mais simples:
em vez de reconstruir o objeto duas vezes, calcula `language` primeiro e só
grava no fim se detetou (não se já vinha válido). Substituir o bloco acima
por esta versão mais direta (usar esta, não a de cima):

```ts
export function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    const candidate: Record<string, unknown> =
      typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};

    const languageWasStored = isValidLocale(candidate.language);
    const language = languageWasStored ? (candidate.language as Locale) : resolveInitialLocale();

    const result: Settings = {
      defaultDifficulty: pickValid(
        candidate.defaultDifficulty,
        VALID_DIFFICULTIES,
        DEFAULT_SETTINGS.defaultDifficulty
      ),
      defaultColor: pickValid(candidate.defaultColor, VALID_COLORS, DEFAULT_SETTINGS.defaultColor),
      boardTheme: pickValid(candidate.boardTheme, VALID_BOARD_THEMES, DEFAULT_SETTINGS.boardTheme),
      backgroundTheme: pickValid(
        candidate.backgroundTheme,
        VALID_BACKGROUND_THEMES,
        DEFAULT_SETTINGS.backgroundTheme
      ),
      pieceStyle: pickValid(candidate.pieceStyle, VALID_PIECE_STYLES, DEFAULT_SETTINGS.pieceStyle),
      language,
    };

    // Só grava se a deteção correu agora (idioma não vinha guardado) — não
    // queremos escrever em cada load quando já havia um valor válido.
    if (!languageWasStored) saveSettings(result);

    return result;
  } catch {
    return { ...DEFAULT_SETTINGS, language: resolveInitialLocale() };
  }
}
```

- [ ] **Step 5: Confirmar que os testes passam**

Run: `npx vitest run lib/settings/settings.test.ts`
Expected: PASS, incluindo os testes já existentes (nenhum deve quebrar).

- [ ] **Step 6: `npx tsc --noEmit`**

Expected: sem erros — todos os call sites de `Settings`/`DEFAULT_SETTINGS`
continuam válidos porque `language` tem sempre um valor por omissão.

- [ ] **Step 7: Commit**

```bash
git add lib/settings/settings.ts lib/settings/settings.test.ts
git commit -m "feat(i18n): add Settings.language with first-run browser detection

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y5poXWqz8nhndfRJvWEbbi"
```

---

## Task 3: Dicionários PT/EN + `useTranslation()`

Esta é a maior tarefa de conteúdo desta fase — define a `Dictionary`
completa e escreve as duas traduções. As tarefas seguintes só fazem *wiring*
(trocar texto literal por `t.xxx`), sem inventar chaves novas depois desta.

**Files:**
- Create: `lib/i18n/dictionaries/types.ts` (interface `Dictionary`)
- Create: `lib/i18n/dictionaries/pt.ts`
- Create: `lib/i18n/dictionaries/en.ts`
- Create: `lib/i18n/dictionaries/index.ts` (`DICTIONARIES: Record<Locale, Dictionary>`)
- Create: `lib/i18n/useTranslation.ts`
- Test: `lib/i18n/dictionaries/dictionaries.test.ts`
- Test: `lib/i18n/useTranslation.test.tsx`

**Interfaces:**
- Consumes: `Locale` (de `lib/i18n/types.ts`), `useSettings` (de
  `lib/settings/useSettings.ts`).
- Produces: `export interface Dictionary { ... }`; `export const
  DICTIONARIES: Record<Locale, Dictionary>`; `export function
  useTranslation(): { t: Dictionary; locale: Locale }`.

- [ ] **Step 1: Escrever `lib/i18n/dictionaries/types.ts`**

```ts
export interface Dictionary {
  common: {
    mainMenu: string;
    close: string;
    backToTutorial: string;
    thinking: string;
  };
  menu: {
    title: string;
    playVsComputer: string;
    twoPlayers: string;
    learnToPlay: string;
    options: string;
  };
  opcoes: {
    title: string;
    defaultDifficultyLegend: string;
    defaultColorLegend: string;
    boardTheme: string;
    pieceStyle: string;
    backgroundImage: string;
    language: string;
    portuguese: string;
    english: string;
    toastDifficultyChanged: string;
    toastColorChanged: string;
    toastBoardThemeChanged: string;
    toastPieceStyleChanged: string;
    toastBackgroundChanged: string;
    toastLanguageChanged: string;
  };
  difficulty: { facil: string; medio: string; dificil: string };
  color: { white: string; black: string; random: string };
  pieceStyleLabel: { classico: string; moderno: string; anime: string };
  configurar: { title: string };
  gameSetup: { difficultyLegend: string; colorLegend: string; start: string };
  jogar: {
    loading: string;
    status: { playing: string; check: string; checkmate: string; stalemate: string; draw: string };
    engineUnavailable: string;
    restart: string;
    rules: string;
  };
  learningPanel: {
    toggleLabel: string;
    description: string;
    suggestMove: string;
    suggestionHint: string;
    lastMoveLabel: string;
    quality: { boa: string; imprecisao: string; erro: string };
  };
  rulesModal: {
    title: string;
    movementTitle: string;
    pawn: { title: string; text: string };
    knight: { title: string; text: string };
    bishop: { title: string; text: string };
    rook: { title: string; text: string };
    queen: { title: string; text: string };
    king: { title: string; text: string };
    specialTitle: string;
    castling: { title: string; text: string };
    enPassant: { title: string; text: string };
    promotion: { title: string; text: string };
    endgameTitle: string;
    check: { title: string; text: string };
    checkmate: { title: string; text: string };
    stalemate: { title: string; text: string };
    otherDraws: { title: string; text: string };
    learningTitle: string;
    centipawns: { title: string; text: string };
  };
  gameEnd: {
    lostCheckmate: string;
    wonCheckmate: string;
    checkmateBlackWins: string;
    checkmateWhiteWins: string;
    stalemateDraw: string;
    draw: string;
    playAgain: string;
  };
  aprenderHub: {
    title: string;
    backToHome: string;
    piecesTitle: string;
    piecesDesc: string;
    specialRulesTitle: string;
    specialRulesDesc: string;
    endgameTitle: string;
    endgameDesc: string;
    strategyTitle: string;
    strategyDesc: string;
    centipawnsTitle: string;
    centipawnsDesc: string;
    openingsTitle: string;
    openingsDesc: (count: number) => string;
  };
  pecas: {
    title: string;
    pawn: { title: string; desc: string };
    knight: { title: string; desc: string };
    bishop: { title: string; desc: string };
    rook: { title: string; desc: string };
    queen: { title: string; desc: string };
    king: { title: string; desc: string };
  };
  regrasEspeciais: {
    title: string;
    castling: { title: string; desc: string };
    enPassant: { title: string; desc: string };
    promotion: { title: string; desc: string };
  };
  fimDeJogo: {
    title: string;
    check: { title: string; desc: string };
    checkmate: { title: string; desc: string };
    stalemate: { title: string; desc: string };
    otherDrawsTitle: string;
    otherDrawsText: string;
  };
  estrategia: {
    title: string;
    principles: { title: string; text: string }[];
  };
  centipawnsPage: {
    title: string;
    concepts: { title: string; text: string }[];
    levelsHeading: string;
  };
  openings: {
    hubTitle: string;
    backToOpenings: string;
    practiceThisOpening: string;
    practicePrefix: string;
    backToStudy: string;
    linesTablistLabel: string;
    previous: string;
    next: string;
    startPosition: string;
    lineComplete: string;
    practiceAgain: string;
    wrongMove: (san: string) => string;
    yourTurn: string;
  };
  interactiveDemo: { reset: string };
}
```

- [ ] **Step 2: Escrever `lib/i18n/dictionaries/pt.ts`** (cópia
  byte-a-byte do texto atual em cada ficheiro — ver lista de origens em
  comentário no topo)

```ts
import type { Dictionary } from './types';

// Cada valor é cópia byte-a-byte do texto já hardcoded no ficheiro
// indicado — é o que garante que os testes existentes continuam a passar
// sem alteração nesta fase (ver spec i18n, secção de testes).
export const pt: Dictionary = {
  common: {
    mainMenu: 'Menu inicial',
    close: 'Fechar',
    backToTutorial: 'Voltar ao tutorial',
    thinking: 'A pensar…',
  },
  menu: {
    title: 'XADREZ',
    playVsComputer: 'Jogar contra o computador',
    twoPlayers: 'Dois jogadores',
    learnToPlay: 'Aprender a jogar',
    options: 'Opções',
  },
  opcoes: {
    title: 'OPÇÕES',
    defaultDifficultyLegend: 'Dificuldade por omissão',
    defaultColorLegend: 'Cor por omissão',
    boardTheme: 'Tema do tabuleiro',
    pieceStyle: 'Estilo das peças',
    backgroundImage: 'Imagem de fundo',
    language: 'Idioma',
    portuguese: 'Português',
    english: 'English',
    toastDifficultyChanged: 'Dificuldade por omissão alterada.',
    toastColorChanged: 'Cor por omissão alterada.',
    toastBoardThemeChanged: 'Tema do tabuleiro alterado.',
    toastPieceStyleChanged: 'Estilo das peças alterado.',
    toastBackgroundChanged: 'Imagem de fundo alterada.',
    toastLanguageChanged: 'Idioma alterado.',
  },
  difficulty: { facil: 'facil', medio: 'medio', dificil: 'dificil' },
  color: { white: 'Brancas', black: 'Pretas', random: 'Aleatório' },
  pieceStyleLabel: { classico: 'Clássico', moderno: 'Moderno', anime: 'Anime' },
  configurar: { title: 'JOGAR CONTRA O COMPUTADOR' },
  gameSetup: { difficultyLegend: 'Dificuldade', colorLegend: 'As tuas peças', start: 'Começar' },
  jogar: {
    loading: 'A carregar…',
    status: {
      playing: 'Em andamento',
      check: 'Xeque',
      checkmate: 'Xeque-mate',
      stalemate: 'Afogamento (empate)',
      draw: 'Empate',
    },
    engineUnavailable:
      'O motor de xadrez não pôde ser carregado. Tenta novamente mais tarde, ou joga no modo Dois jogadores.',
    restart: 'Reiniciar partida',
    rules: 'Regras',
  },
  learningPanel: {
    toggleLabel: 'Modo de aprendizagem',
    description: 'Lances legais e peças ameaçadas aparecem destacados no tabuleiro.',
    suggestMove: 'Sugerir jogada',
    suggestionHint: 'Jogada sugerida destacada em verde no tabuleiro.',
    lastMoveLabel: 'O teu último lance: ',
    quality: { boa: 'Boa jogada', imprecisao: 'Imprecisão', erro: 'Erro' },
  },
  rulesModal: {
    title: 'Regras do xadrez',
    movementTitle: 'Como as peças se movem',
    pawn: { title: 'Peão', text: 'Anda uma casa em frente (duas no primeiro lance) e captura na diagonal.' },
    knight: { title: 'Cavalo', text: 'Move-se em "L". É a única peça que salta por cima de outras.' },
    bishop: { title: 'Bispo', text: 'Move-se livremente na diagonal, sempre na mesma cor de casa.' },
    rook: { title: 'Torre', text: 'Move-se livremente na horizontal ou na vertical.' },
    queen: { title: 'Dama', text: 'Combina o movimento da torre com o do bispo.' },
    king: {
      title: 'Rei',
      text: 'Move-se uma casa em qualquer direção. Nunca pode ir para uma casa atacada pelo adversário.',
    },
    specialTitle: 'Regras especiais',
    castling: {
      title: 'Roque',
      text:
        'O rei e uma torre movem-se em conjunto, uma única vez por partida — só é permitido se nenhuma das ' +
        'duas peças já se tiver mexido, não houver peças entre elas e o rei não estiver em xeque nem passar ' +
        'por uma casa atacada.',
    },
    enPassant: {
      title: 'En passant',
      text:
        'Se um peão adversário andar duas casas e ficar ao lado de um peão teu, podes capturá-lo como se ' +
        'tivesse andado só uma casa — mas apenas no lance seguinte.',
    },
    promotion: {
      title: 'Promoção',
      text: 'Quando um peão chega à última fileira, é promovido a qualquer peça (exceto rei) — normalmente a dama.',
    },
    endgameTitle: 'Fim de jogo',
    check: { title: 'Xeque', text: 'O rei está sob ataque direto. Tens de sair do xeque logo no lance seguinte.' },
    checkmate: {
      title: 'Xeque-mate',
      text: 'Um xeque sem escapatória — o jogo termina de imediato e quem dá o mate vence.',
    },
    stalemate: {
      title: 'Afogamento (empate)',
      text: 'Quando não estás em xeque, mas não tens nenhum lance legal disponível.',
    },
    otherDraws: {
      title: 'Outros empates',
      text:
        'Repetição tripla da mesma posição, regra dos 50 lances sem captura nem movimento de peão, ou ' +
        'material insuficiente no tabuleiro para dar mate.',
    },
    learningTitle: 'Modo de aprendizagem',
    centipawns: {
      title: 'Centipawns',
      text:
        'É a unidade que o motor de xadrez usa para avaliar uma posição — 100 centipawns valem cerca de ' +
        'um peão. Perder poucos é normal; perder uma centena ou mais costuma significar que havia uma ' +
        'jogada bastante melhor disponível.',
    },
  },
  gameEnd: {
    lostCheckmate: 'Perdeste. Xeque-mate.',
    wonCheckmate: 'Ganhaste! Xeque-mate.',
    checkmateBlackWins: 'Xeque-mate! Vencem as pretas.',
    checkmateWhiteWins: 'Xeque-mate! Vencem as brancas.',
    stalemateDraw: 'Empate por afogamento.',
    draw: 'Empate.',
    playAgain: 'Jogar de novo',
  },
  aprenderHub: {
    title: 'APRENDA A JOGAR XADREZ',
    backToHome: 'Voltar para o início',
    piecesTitle: 'Como as peças se movem',
    piecesDesc: 'O movimento de cada peça, do peão ao rei.',
    specialRulesTitle: 'Regras especiais',
    specialRulesDesc: 'Roque, en passant e promoção do peão.',
    endgameTitle: 'Fim de jogo',
    endgameDesc: 'Xeque, xeque-mate, afogamento e empates.',
    strategyTitle: 'Princípios de estratégia',
    strategyDesc: 'Ideias básicas para jogar melhor desde a abertura.',
    centipawnsTitle: 'Avaliação e centipawns',
    centipawnsDesc: 'O que são centipawns e como interpretar "Boa jogada", "Imprecisão" e "Erro".',
    openingsTitle: 'Aberturas',
    openingsDesc: (count: number) => `Estuda ${count} aberturas populares, lance a lance, com explicação em português.`,
  },
  pecas: {
    title: 'COMO AS PEÇAS SE MOVEM',
    pawn: { title: 'Peão', desc: 'Anda uma casa para frente (duas no primeiro lance) e captura na diagonal.' },
    knight: {
      title: 'Cavalo',
      desc: 'Move-se em "L": duas casas numa direção e uma casa perpendicular. É a única peça que salta por cima de outras.',
    },
    bishop: { title: 'Bispo', desc: 'Move-se livremente na diagonal, sempre pela mesma cor de casa.' },
    rook: { title: 'Torre', desc: 'Move-se livremente na horizontal ou na vertical.' },
    queen: { title: 'Dama', desc: 'Combina o movimento da torre e do bispo: livre em qualquer direção.' },
    king: {
      title: 'Rei',
      desc: 'Move-se uma casa em qualquer direção. Nunca se pode mover para uma casa atacada pelo adversário.',
    },
  },
  regrasEspeciais: {
    title: 'REGRAS ESPECIAIS',
    castling: {
      title: 'Roque',
      desc:
        'Um lance especial do rei com uma das torres, feito uma única vez por partida. O rei anda ' +
        'duas casas em direção à torre, e a torre salta para o outro lado do rei. Só é permitido se ' +
        'nem o rei nem a torre envolvida já se moveram, se não houver peças entre eles, e se o rei ' +
        'não estiver em xeque nem passar por uma casa atacada.',
    },
    enPassant: {
      title: 'En passant',
      desc:
        'Se um peão adversário andar duas casas de uma vez e ficar ao lado de um peão teu, podes ' +
        'capturá-lo como se ele tivesse andado apenas uma casa — mas só no lance imediatamente a ' +
        'seguir.',
    },
    promotion: {
      title: 'Promoção',
      desc:
        'Quando um peão chega à última fileira, é promovido a qualquer outra peça (menos rei) — na ' +
        'grande maioria dos casos, a dama, por ser a peça mais forte.',
    },
  },
  fimDeJogo: {
    title: 'FIM DE JOGO',
    check: {
      title: 'Xeque',
      desc:
        'O rei está sob ataque direto. Quem está em xeque precisa, no seu próximo lance, sair do ' +
        'xeque — movendo o rei, bloqueando o ataque ou capturando a peça que ataca.',
    },
    checkmate: {
      title: 'Xeque-mate',
      desc:
        'Um xeque do qual não há como escapar — o jogo termina imediatamente e quem deu o mate ' +
        'vence. Clica no rei: não há nenhuma casa livre, é mesmo o fim da partida.',
    },
    stalemate: {
      title: 'Afogamento (empate)',
      desc:
        'Quando o jogador da vez não está em xeque, mas não tem nenhum lance legal disponível, a ' +
        'partida termina empatada. Clica no rei: também aqui não há para onde ir, mas ninguém o está ' +
        'a atacar.',
    },
    otherDrawsTitle: 'Outros empates',
    otherDrawsText:
      'A partida também empata por repetição tripla da mesma posição, pela regra dos 50 lances ' +
      'sem captura ou movimento de peão, ou quando não há material suficiente no tabuleiro para ' +
      'dar mate.',
  },
  estrategia: {
    title: 'PRINCÍPIOS DE ESTRATÉGIA',
    principles: [
      {
        title: 'Controlar o centro',
        text: 'As casas centrais (d4, e4, d5, e5) dão às tuas peças mais mobilidade e influência sobre o tabuleiro. Ocupar ou controlar o centro logo nos primeiros lances.',
      },
      {
        title: 'Desenvolver as peças',
        text: 'Tirar cavalos e bispos das casas iniciais cedo, antes de mover a mesma peça várias vezes ou sair a caçar peões sem necessidade.',
      },
      {
        title: 'Proteger o rei',
        text: 'Fazer o roque cedo para colocar o rei a salvo atrás de uma fileira de peões, especialmente antes de abrir o jogo no centro.',
      },
      {
        title: 'Não perder material de graça',
        text: 'Antes de cada lance, confirmar que nenhuma peça tua ficou pendurada (atacada e sem defesa suficiente).',
      },
      {
        title: 'Pensar em ameaças antes de atacar',
        text: 'Perguntar-se o que o adversário quer fazer no próximo lance antes de decidir o teu — muitas peças perdem-se por ignorar a resposta do oponente.',
      },
    ],
  },
  centipawnsPage: {
    title: 'AVALIAÇÃO E CENTIPAWNS',
    concepts: [
      {
        title: 'O que é um centipawn',
        text: 'O motor (Stockfish) mede o quão boa é uma posição em centipawns — centésimos do valor de um peão. Uma vantagem de "+100" é, grosso modo, "vales um peão a mais"; "+300" ronda o valor de uma peça menor.',
      },
      {
        title: 'Perda de centipawns',
        text: 'A cada lance, o modo de aprendizagem compara a avaliação do melhor lance possível com a avaliação do lance que jogaste, ambas do teu ponto de vista. A diferença é a "perda" desse lance — nunca é negativa: jogar tão bem como (ou melhor que) a referência do motor conta como perda zero.',
      },
    ],
    levelsHeading: 'Os três níveis que vês durante uma partida',
  },
  openings: {
    hubTitle: 'ABERTURAS',
    backToOpenings: 'Voltar às aberturas',
    practiceThisOpening: 'Praticar esta abertura',
    practicePrefix: 'PRATICAR: ',
    backToStudy: 'Voltar ao estudo',
    linesTablistLabel: 'Linhas desta abertura',
    previous: 'Anterior',
    next: 'Seguinte',
    startPosition: 'Posição inicial — carrega em "Seguinte" para começar.',
    lineComplete: 'Linha completa!',
    practiceAgain: 'Praticar outra vez',
    wrongMove: (san: string) => `Não é esse — o lance da linha é ${san}. Tenta de novo.`,
    yourTurn: 'A tua vez: encontra o lance da linha.',
  },
  interactiveDemo: { reset: 'Reiniciar' },
};
```

- [ ] **Step 3: Escrever `lib/i18n/dictionaries/en.ts`**

```ts
import type { Dictionary } from './types';

export const en: Dictionary = {
  common: {
    mainMenu: 'Main menu',
    close: 'Close',
    backToTutorial: 'Back to tutorial',
    thinking: 'Thinking…',
  },
  menu: {
    title: 'CHESS',
    playVsComputer: 'Play against the computer',
    twoPlayers: 'Two players',
    learnToPlay: 'Learn to play',
    options: 'Options',
  },
  opcoes: {
    title: 'OPTIONS',
    defaultDifficultyLegend: 'Default difficulty',
    defaultColorLegend: 'Default color',
    boardTheme: 'Board theme',
    pieceStyle: 'Piece style',
    backgroundImage: 'Background image',
    language: 'Language',
    portuguese: 'Português',
    english: 'English',
    toastDifficultyChanged: 'Default difficulty changed.',
    toastColorChanged: 'Default color changed.',
    toastBoardThemeChanged: 'Board theme changed.',
    toastPieceStyleChanged: 'Piece style changed.',
    toastBackgroundChanged: 'Background image changed.',
    toastLanguageChanged: 'Language changed.',
  },
  difficulty: { facil: 'easy', medio: 'medium', dificil: 'hard' },
  color: { white: 'White', black: 'Black', random: 'Random' },
  pieceStyleLabel: { classico: 'Classic', moderno: 'Modern', anime: 'Anime' },
  configurar: { title: 'PLAY AGAINST THE COMPUTER' },
  gameSetup: { difficultyLegend: 'Difficulty', colorLegend: 'Your pieces', start: 'Start' },
  jogar: {
    loading: 'Loading…',
    status: {
      playing: 'In progress',
      check: 'Check',
      checkmate: 'Checkmate',
      stalemate: 'Stalemate (draw)',
      draw: 'Draw',
    },
    engineUnavailable:
      "The chess engine couldn't be loaded. Try again later, or play in Two Players mode.",
    restart: 'Restart game',
    rules: 'Rules',
  },
  learningPanel: {
    toggleLabel: 'Learning mode',
    description: 'Legal moves and threatened pieces are highlighted on the board.',
    suggestMove: 'Suggest a move',
    suggestionHint: 'Suggested move highlighted in green on the board.',
    lastMoveLabel: 'Your last move: ',
    quality: { boa: 'Good move', imprecisao: 'Inaccuracy', erro: 'Mistake' },
  },
  rulesModal: {
    title: 'Chess rules',
    movementTitle: 'How the pieces move',
    pawn: { title: 'Pawn', text: 'Moves one square forward (two on its first move) and captures diagonally.' },
    knight: { title: 'Knight', text: 'Moves in an "L" shape. It\'s the only piece that jumps over others.' },
    bishop: { title: 'Bishop', text: 'Moves freely along diagonals, always staying on the same square color.' },
    rook: { title: 'Rook', text: 'Moves freely horizontally or vertically.' },
    queen: { title: 'Queen', text: "Combines the rook's movement with the bishop's." },
    king: {
      title: 'King',
      text: 'Moves one square in any direction. It can never move to a square attacked by the opponent.',
    },
    specialTitle: 'Special rules',
    castling: {
      title: 'Castling',
      text:
        'The king and a rook move together, once per game — only allowed if neither piece has moved yet, ' +
        'there are no pieces between them, and the king is not in check nor passes through an attacked square.',
    },
    enPassant: {
      title: 'En passant',
      text:
        "If an opponent's pawn moves two squares and lands beside one of yours, you can capture it as if " +
        'it had moved only one square — but only on the very next move.',
    },
    promotion: {
      title: 'Promotion',
      text: 'When a pawn reaches the last rank, it is promoted to any piece except a king — usually a queen.',
    },
    endgameTitle: 'Endgame',
    check: {
      title: 'Check',
      text: 'The king is under direct attack. You must get out of check on your very next move.',
    },
    checkmate: {
      title: 'Checkmate',
      text: 'A check with no way out — the game ends immediately and whoever delivers mate wins.',
    },
    stalemate: {
      title: 'Stalemate (draw)',
      text: 'When you are not in check, but have no legal move available.',
    },
    otherDraws: {
      title: 'Other draws',
      text:
        'Threefold repetition of the same position, the 50-move rule (no capture or pawn move), or ' +
        'insufficient material on the board to deliver mate.',
    },
    learningTitle: 'Learning mode',
    centipawns: {
      title: 'Centipawns',
      text:
        'The unit the chess engine uses to evaluate a position — 100 centipawns is worth about one pawn. ' +
        'Losing a little is normal; losing a hundred or more usually means a much better move was available.',
    },
  },
  gameEnd: {
    lostCheckmate: 'You lost. Checkmate.',
    wonCheckmate: 'You won! Checkmate.',
    checkmateBlackWins: 'Checkmate! Black wins.',
    checkmateWhiteWins: 'Checkmate! White wins.',
    stalemateDraw: 'Draw by stalemate.',
    draw: 'Draw.',
    playAgain: 'Play again',
  },
  aprenderHub: {
    title: 'LEARN TO PLAY CHESS',
    backToHome: 'Back to home',
    piecesTitle: 'How the pieces move',
    piecesDesc: 'The movement of each piece, from pawn to king.',
    specialRulesTitle: 'Special rules',
    specialRulesDesc: 'Castling, en passant, and pawn promotion.',
    endgameTitle: 'Endgame',
    endgameDesc: 'Check, checkmate, stalemate, and draws.',
    strategyTitle: 'Strategy principles',
    strategyDesc: 'Basic ideas to play better from the opening onward.',
    centipawnsTitle: 'Evaluation and centipawns',
    centipawnsDesc: 'What centipawns are and how to interpret "Good move", "Inaccuracy" and "Mistake".',
    openingsTitle: 'Openings',
    openingsDesc: (count: number) => `Study ${count} popular openings, move by move, with explanations in English.`,
  },
  pecas: {
    title: 'HOW THE PIECES MOVE',
    pawn: { title: 'Pawn', desc: 'Moves one square forward (two on its first move) and captures diagonally.' },
    knight: {
      title: 'Knight',
      desc:
        'Moves in an "L" shape: two squares in one direction and one square perpendicular. It\'s the only ' +
        'piece that jumps over others.',
    },
    bishop: { title: 'Bishop', desc: 'Moves freely along diagonals, always on the same square color.' },
    rook: { title: 'Rook', desc: 'Moves freely horizontally or vertically.' },
    queen: { title: 'Queen', desc: "Combines the rook's and bishop's movement: free in any direction." },
    king: {
      title: 'King',
      desc: 'Moves one square in any direction. It can never move to a square attacked by the opponent.',
    },
  },
  regrasEspeciais: {
    title: 'SPECIAL RULES',
    castling: {
      title: 'Castling',
      desc:
        'A special move of the king together with one of the rooks, done once per game. The king moves two ' +
        'squares toward the rook, and the rook jumps to the other side of the king. Only allowed if neither ' +
        'the king nor the rook involved has moved yet, there are no pieces between them, and the king is not ' +
        'in check nor passes through an attacked square.',
    },
    enPassant: {
      title: 'En passant',
      desc:
        "If an opponent's pawn moves two squares at once and lands beside one of yours, you can capture it " +
        'as if it had moved only one square — but only on the very next move.',
    },
    promotion: {
      title: 'Promotion',
      desc:
        'When a pawn reaches the last rank, it is promoted to any other piece (except a king) — in the vast ' +
        "majority of cases, a queen, since it's the strongest piece.",
    },
  },
  fimDeJogo: {
    title: 'ENDGAME',
    check: {
      title: 'Check',
      desc:
        'The king is under direct attack. Whoever is in check must, on their next move, get out of check — ' +
        'by moving the king, blocking the attack, or capturing the attacking piece.',
    },
    checkmate: {
      title: 'Checkmate',
      desc:
        "A check with no way to escape — the game ends immediately and whoever delivered mate wins. Click " +
        "the king: there's no free square, it really is the end of the game.",
    },
    stalemate: {
      title: 'Stalemate (draw)',
      desc:
        'When the player to move is not in check, but has no legal move available, the game ends in a draw. ' +
        "Click the king: there's nowhere to go here either, but nobody is attacking it.",
    },
    otherDrawsTitle: 'Other draws',
    otherDrawsText:
      'The game also ends in a draw by threefold repetition of the same position, the 50-move rule (no ' +
      "capture or pawn move), or when there isn't enough material on the board to deliver mate.",
  },
  estrategia: {
    title: 'STRATEGY PRINCIPLES',
    principles: [
      {
        title: 'Control the center',
        text:
          'The central squares (d4, e4, d5, e5) give your pieces more mobility and influence over the ' +
          'board. Occupy or control the center from the very first moves.',
      },
      {
        title: 'Develop your pieces',
        text:
          'Bring knights and bishops out from their starting squares early, before moving the same piece ' +
          'several times or chasing pawns without real need.',
      },
      {
        title: 'Protect your king',
        text:
          'Castle early to tuck your king safely behind a row of pawns, especially before opening up the ' +
          'center.',
      },
      {
        title: "Don't lose material for free",
        text: "Before every move, check that none of your pieces is hanging (attacked and insufficiently defended).",
      },
      {
        title: 'Think about threats before attacking',
        text:
          "Ask yourself what your opponent wants to do on their next move before deciding on yours — many " +
          "pieces are lost by ignoring the opponent's reply.",
      },
    ],
  },
  centipawnsPage: {
    title: 'EVALUATION AND CENTIPAWNS',
    concepts: [
      {
        title: 'What a centipawn is',
        text:
          'The engine (Stockfish) measures how good a position is in centipawns — hundredths of the value ' +
          'of a pawn. An advantage of "+100" roughly means "you\'re up a pawn"; "+300" is around the value ' +
          'of a minor piece.',
      },
      {
        title: 'Centipawn loss',
        text:
          'On every move, learning mode compares the evaluation of the best possible move with the ' +
          "evaluation of the move you played, both from your point of view. The difference is that move's " +
          '"loss" — never negative: playing as well as (or better than) the engine\'s reference counts as ' +
          'zero loss.',
      },
    ],
    levelsHeading: "The three levels you'll see during a game",
  },
  openings: {
    hubTitle: 'OPENINGS',
    backToOpenings: 'Back to openings',
    practiceThisOpening: 'Practice this opening',
    practicePrefix: 'PRACTICE: ',
    backToStudy: 'Back to study',
    linesTablistLabel: 'Lines of this opening',
    previous: 'Previous',
    next: 'Next',
    startPosition: 'Starting position — press "Next" to begin.',
    lineComplete: 'Line complete!',
    practiceAgain: 'Practice again',
    wrongMove: (san: string) => `Not quite — the line continues with ${san}. Try again.`,
    yourTurn: "Your turn: find the line's move.",
  },
  interactiveDemo: { reset: 'Reset' },
};
```

- [ ] **Step 4: Escrever `lib/i18n/dictionaries/index.ts`**

```ts
import type { Locale } from '@/lib/i18n/types';
import type { Dictionary } from './types';
import { pt } from './pt';
import { en } from './en';

export type { Dictionary };
export const DICTIONARIES: Record<Locale, Dictionary> = { pt, en };
```

- [ ] **Step 5: Escrever o teste estrutural (falha primeiro só por não
  existir o ficheiro — mas serve sobretudo de rede de segurança contínua)**

```ts
// lib/i18n/dictionaries/dictionaries.test.ts
import { describe, expect, it } from 'vitest';
import { DICTIONARIES } from './index';

function leafPaths(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix];
  if (typeof obj === 'function') return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
    typeof value === 'function' ? [`${prefix}${key}`] : leafPaths(value, `${prefix}${key}.`)
  );
}

describe('DICTIONARIES', () => {
  it('pt e en têm exatamente as mesmas chaves', () => {
    expect(leafPaths(DICTIONARIES.pt).sort()).toEqual(leafPaths(DICTIONARIES.en).sort());
  });

  it('nenhum valor de string está vazio', () => {
    function allStrings(obj: unknown): string[] {
      if (typeof obj === 'string') return [obj];
      if (typeof obj === 'function' || obj === null || typeof obj !== 'object') return [];
      if (Array.isArray(obj)) return obj.flatMap(allStrings);
      return Object.values(obj).flatMap(allStrings);
    }
    for (const locale of ['pt', 'en'] as const) {
      for (const value of allStrings(DICTIONARIES[locale])) {
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it('portuguese/english (nomes de idioma) são sempre os mesmos nos dois dicionários', () => {
    expect(DICTIONARIES.pt.opcoes.portuguese).toBe(DICTIONARIES.en.opcoes.portuguese);
    expect(DICTIONARIES.pt.opcoes.english).toBe(DICTIONARIES.en.opcoes.english);
  });
});
```

- [ ] **Step 6: Correr os testes**

Run: `npx vitest run lib/i18n/dictionaries/dictionaries.test.ts`
Expected: PASS (3/3). Se falhar por chaves diferentes, o erro do
`toEqual` aponta exatamente qual chave existe só num dos dois — corrigir
até bater certo.

- [ ] **Step 7: `npx tsc --noEmit`**

Expected: sem erros — `pt`/`en` batem certo com `Dictionary` (o TypeScript
já teria acusado em tempo de compilação qualquer chave em falta antes
mesmo de correr o teste).

- [ ] **Step 8: Escrever `lib/i18n/useTranslation.ts`**

```ts
'use client';

import { useSettings } from '@/lib/settings/useSettings';
import { DICTIONARIES, type Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/types';

export interface UseTranslationResult {
  t: Dictionary;
  locale: Locale;
}

/**
 * Sem Context novo — o único Context da app continua a ser o do Toast
 * (ver CLAUDE.md). `language` é só mais um campo lido através do
 * useSettings() já existente.
 */
export function useTranslation(): UseTranslationResult {
  const { settings } = useSettings();
  return { t: DICTIONARIES[settings.language], locale: settings.language };
}
```

- [ ] **Step 9: Escrever o teste de `useTranslation`**

```tsx
// lib/i18n/useTranslation.test.tsx
import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTranslation } from './useTranslation';
import { useSettings, __resetSettingsCacheForTests } from '@/lib/settings/useSettings';

describe('useTranslation', () => {
  beforeEach(() => {
    window.localStorage.clear();
    __resetSettingsCacheForTests();
  });

  it('devolve o dicionário pt por omissão', () => {
    window.localStorage.setItem('xadrez-settings', JSON.stringify({ language: 'pt' }));
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t.menu.title).toBe('XADREZ');
    expect(result.current.locale).toBe('pt');
  });

  it('acompanha updateSettings({ language: "en" })', () => {
    window.localStorage.setItem('xadrez-settings', JSON.stringify({ language: 'pt' }));
    function Wrapper() {
      const translation = useTranslation();
      const { updateSettings } = useSettings();
      return { translation, updateSettings };
    }
    const { result } = renderHook(() => Wrapper());
    expect(result.current.translation.t.menu.title).toBe('XADREZ');

    act(() => {
      result.current.updateSettings({ language: 'en' });
    });

    const { result: result2 } = renderHook(() => useTranslation());
    expect(result2.current.t.menu.title).toBe('CHESS');
    expect(result2.current.locale).toBe('en');
  });
});
```

- [ ] **Step 10: Correr os testes**

Run: `npx vitest run lib/i18n/useTranslation.test.tsx`
Expected: PASS (2/2)

- [ ] **Step 11: Commit**

```bash
git add lib/i18n/dictionaries lib/i18n/useTranslation.ts lib/i18n/useTranslation.test.tsx
git commit -m "feat(i18n): add pt/en dictionaries and useTranslation() hook

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y5poXWqz8nhndfRJvWEbbi"
```

---

## Task 4: `LanguageSync` (`<html lang>` dinâmico)

**Files:**
- Create: `components/LanguageSync/LanguageSync.tsx`
- Test: `components/LanguageSync/LanguageSync.test.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `useTranslation()` (só o `locale`).
- Produces: componente sem UI, montado uma vez em `app/layout.tsx`.

- [ ] **Step 1: Escrever o teste que falha primeiro**

```tsx
// components/LanguageSync/LanguageSync.test.tsx
import { describe, expect, it, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { LanguageSync } from './LanguageSync';
import { __resetSettingsCacheForTests } from '@/lib/settings/useSettings';

describe('LanguageSync', () => {
  beforeEach(() => {
    window.localStorage.clear();
    __resetSettingsCacheForTests();
    document.documentElement.lang = '';
  });

  it('define document.documentElement.lang para "pt-PT" quando o idioma é pt', () => {
    window.localStorage.setItem('xadrez-settings', JSON.stringify({ language: 'pt' }));
    render(<LanguageSync />);
    expect(document.documentElement.lang).toBe('pt-PT');
  });

  it('define document.documentElement.lang para "en" quando o idioma é en', () => {
    window.localStorage.setItem('xadrez-settings', JSON.stringify({ language: 'en' }));
    render(<LanguageSync />);
    expect(document.documentElement.lang).toBe('en');
  });

  it('não renderiza nada visível', () => {
    window.localStorage.setItem('xadrez-settings', JSON.stringify({ language: 'pt' }));
    const { container } = render(<LanguageSync />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Confirmar que falha**

Run: `npx vitest run components/LanguageSync/LanguageSync.test.tsx`
Expected: FAIL — o ficheiro ainda não existe.

- [ ] **Step 3: Implementar `components/LanguageSync/LanguageSync.tsx`**

```tsx
'use client';

import { useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';

const HTML_LANG: Record<'pt' | 'en', string> = { pt: 'pt-PT', en: 'en' };

/**
 * Sem UI própria — mesmo padrão do ServiceWorkerRegistration.tsx. Corre
 * sempre DEPOIS da hidratação (useEffect), nunca durante, por isso não há
 * risco do mismatch servidor/cliente que este projeto já viu antes com
 * outras leituras de estado client-only.
 */
export function LanguageSync() {
  const { locale } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);

  return null;
}
```

- [ ] **Step 4: Confirmar que os testes passam**

Run: `npx vitest run components/LanguageSync/LanguageSync.test.tsx`
Expected: PASS (3/3)

- [ ] **Step 5: Montar em `app/layout.tsx`**

Ler primeiro `app/layout.tsx` para confirmar onde `ServiceWorkerRegistration`
já está montado (`{children}` deve ficar dentro do mesmo nível). Acrescentar
junto:

```tsx
import { LanguageSync } from '@/components/LanguageSync/LanguageSync';
// ...
<LanguageSync />
<ServiceWorkerRegistration />
{children}
```

(manter `<html lang="pt-PT">` tal como está no JSX estático — é o valor
inicial correto para o primeiro render do servidor; `LanguageSync` só o
substitui depois de montar, se o idioma guardado for diferente.)

- [ ] **Step 6: Correr toda a suite para confirmar que nada quebrou**

Run: `npm run test`
Expected: PASS em tudo.

- [ ] **Step 7: Commit**

```bash
git add components/LanguageSync app/layout.tsx
git commit -m "feat(i18n): sync <html lang> to the active language

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y5poXWqz8nhndfRJvWEbbi"
```

---

## Task 5: `/opções` — seletor real de Idioma + toda a página traduzida

**Files:**
- Modify: `app/opcoes/page.tsx`

**Interfaces:**
- Consumes: `useTranslation()`, `t.opcoes.*`, `t.difficulty.*`, `t.color.*`,
  `t.pieceStyleLabel.*`, `t.common.mainMenu`.

- [ ] **Step 1: Editar `app/opcoes/page.tsx`**

Substituir o import de `useSettings` para incluir também `useTranslation`,
remover `ComingSoonSection` (fica morta, apagar a função) e trocar todo o
texto literal:

```tsx
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { Locale } from '@/lib/i18n/types';
// ... resto dos imports mantém-se

export default function OpcoesPage() {
  const { settings, updateSettings } = useSettings();
  const { t } = useTranslation();
  const toast = useToast();

  const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
    { value: 'facil', label: t.difficulty.facil },
    { value: 'medio', label: t.difficulty.medio },
    { value: 'dificil', label: t.difficulty.dificil },
  ];
  const COLOR_OPTIONS: { value: PlayerColor; label: string }[] = [
    { value: 'white', label: t.color.white },
    { value: 'black', label: t.color.black },
    { value: 'random', label: t.color.random },
  ];
  const PIECE_STYLE_OPTIONS: { id: PieceStyle; label: string }[] = [
    { id: 'classico', label: t.pieceStyleLabel.classico },
    { id: 'moderno', label: t.pieceStyleLabel.moderno },
    { id: 'anime', label: t.pieceStyleLabel.anime },
  ];
  const LANGUAGE_OPTIONS: { value: Locale; label: string }[] = [
    { value: 'pt', label: t.opcoes.portuguese },
    { value: 'en', label: t.opcoes.english },
  ];

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-start gap-8 p-8 overflow-hidden bg-ink">
      <PageGlow pinkOpacity={0.25} />
      <PageTitle className="relative">{t.opcoes.title}</PageTitle>
      <div className="relative flex flex-col gap-6 max-w-sm w-full">
        <ToggleGroup
          legend={t.opcoes.defaultDifficultyLegend}
          options={DIFFICULTY_OPTIONS}
          value={settings.defaultDifficulty}
          onChange={(level) => {
            updateSettings({ defaultDifficulty: level });
            toast.show(t.opcoes.toastDifficultyChanged);
          }}
        />

        <ToggleGroup
          legend={t.opcoes.defaultColorLegend}
          options={COLOR_OPTIONS}
          value={settings.defaultColor}
          onChange={(value) => {
            updateSettings({ defaultColor: value });
            toast.show(t.opcoes.toastColorChanged);
          }}
        />

        <OptionPicker
          legend={t.opcoes.boardTheme}
          options={BOARD_THEME_OPTIONS}
          value={settings.boardTheme}
          onChange={(boardTheme) => {
            updateSettings({ boardTheme });
            toast.show(t.opcoes.toastBoardThemeChanged);
          }}
          renderPreview={(opt) => (
            <ThemeSwatch previewImage={opt.previewImage} previewImage2={opt.previewImage2} />
          )}
        />
        <OptionPicker
          legend={t.opcoes.pieceStyle}
          options={PIECE_STYLE_OPTIONS}
          value={settings.pieceStyle}
          onChange={(pieceStyle) => {
            updateSettings({ pieceStyle });
            toast.show(t.opcoes.toastPieceStyleChanged);
          }}
          renderPreview={(opt) => (
            <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-ink">
              <span className="h-12 w-12 text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.9)]">
                <PieceIcon type="k" style={opt.id} />
              </span>
            </span>
          )}
        />
        <OptionPicker
          legend={t.opcoes.backgroundImage}
          options={BACKGROUND_THEME_OPTIONS}
          value={settings.backgroundTheme}
          onChange={(backgroundTheme) => {
            updateSettings({ backgroundTheme });
            toast.show(t.opcoes.toastBackgroundChanged);
          }}
          renderPreview={(opt) => <ThemeSwatch previewImage={opt.previewImage} />}
        />
        <ToggleGroup
          legend={t.opcoes.language}
          options={LANGUAGE_OPTIONS}
          value={settings.language}
          onChange={(language) => {
            updateSettings({ language });
            toast.show(t.opcoes.toastLanguageChanged);
          }}
        />
      </div>

      <ChipButton color="purple" href="/" className="relative">
        {t.common.mainMenu}
      </ChipButton>
    </main>
  );
}
```

Notas: `DIFFICULTY_OPTIONS`/`COLOR_OPTIONS`/`PIECE_STYLE_OPTIONS` deixam de
ser constantes de módulo (precisam de `t`, que só existe dentro do
componente) — passam a ser recalculadas a cada render, o que é aceitável
(arrays pequenos, sem custo percetível). `BOARD_THEME_OPTIONS`/
`BACKGROUND_THEME_OPTIONS` continuam constantes de módulo — os seus
`label`s vêm de `BOARD_THEMES`/`BACKGROUND_THEMES` (nomes de temas visuais
como "Sakura"/"Nebulosa"/"Néon"/"Clássico"/"Noturno"), que ficam **fora de
âmbito desta fase** (são nomes próprios de tema, não frases — decisão a
confirmar separadamente se algum dia se quiser traduzir, não presumir
aqui). `ComingSoonSection` fica sem nenhum consumidor — apagar a função
inteira.

- [ ] **Step 2: `npx tsc --noEmit`**

Expected: sem erros.

- [ ] **Step 3: Correr `npm run lint`**

Expected: sem avisos novos (a função `ComingSoonSection` removida não deixa
imports órfãos — confirmar).

- [ ] **Step 4: Verificação manual (`npm run dev`, Chrome DevTools MCP ou
  browser normal)**

Abrir `/opções`, confirmar que aparecem 5 grupos (dificuldade, cor, tema do
tabuleiro, estilo das peças, imagem de fundo) + o novo grupo "Idioma" com
"Português"/"English", e que trocar para "English" muda o título da página
para "OPTIONS" e todos os textos.

- [ ] **Step 5: Commit**

```bash
git add app/opcoes/page.tsx
git commit -m "feat(i18n): wire /opções to real translations + language toggle

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y5poXWqz8nhndfRJvWEbbi"
```

---

## Task 6: Menu principal (`app/page.tsx`)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Editar**

`TILES` deixa de ser uma constante de módulo (precisa de `t`, só existe
dentro do componente):

```tsx
import { useTranslation } from '@/lib/i18n/useTranslation';
// ...

export default function HomePage() {
  const { settings } = useSettings();
  const { t } = useTranslation();

  const TILES: TileData[] = [
    {
      href: '/configurar',
      image: '/menu/vs-cpu.webp',
      gradient: 'linear-gradient(135deg, rgba(0,229,255,0.55), rgba(78,168,222,0.4))',
      emoji: '⚔️',
      label: t.menu.playVsComputer,
    },
    {
      href: '/jogar?mode=local',
      image: '/menu/two-players.webp',
      gradient: 'linear-gradient(135deg, rgba(255,111,165,0.55), rgba(255,154,194,0.4))',
      emoji: '✨',
      label: t.menu.twoPlayers,
      onClick: () => clearSavedGame(),
    },
    {
      href: '/aprender',
      image: '/menu/tutorial.webp',
      gradient: 'linear-gradient(135deg, rgba(123,63,160,0.55), rgba(184,138,224,0.4))',
      emoji: '📖',
      label: t.menu.learnToPlay,
    },
    {
      href: '/opcoes',
      image: '/menu/options.webp',
      gradient: 'linear-gradient(135deg, rgba(255,214,0,0.5), rgba(255,168,0,0.35))',
      label: t.menu.options,
    },
  ];

  return (
    <main /* ... inalterado ... */>
      <PageGlow pinkOpacity={0.35} darken={[0.55, 0.85]} />
      <PageTitle size="text-5xl" softDrop={5} className="relative">
        {t.menu.title}
      </PageTitle>
      <div className="relative flex flex-col gap-4 w-full max-w-sm">
        {TILES.map((tile) => (
          <MenuTile key={tile.href} {...tile} />
        ))}
      </div>
    </main>
  );
}
```

(`MenuTile` e `TileData` ficam tal como estão — só recebem `label` já
traduzida.)

- [ ] **Step 2: `npx tsc --noEmit` + verificação manual**

Abrir `/`, confirmar as 4 tiles e o título "XADREZ"/"CHESS" a mudarem com o
seletor de `/opções`.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat(i18n): wire main menu to translations

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y5poXWqz8nhndfRJvWEbbi"
```

---

## Task 7: `/configurar` + `GameSetup`

**Files:**
- Modify: `app/configurar/page.tsx`
- Modify: `components/GameSetup/GameSetup.tsx`

- [ ] **Step 1: Editar `app/configurar/page.tsx`**

Ganha `'use client'` (precisa de `useTranslation`):

```tsx
'use client';

import { GameSetup } from '@/components/GameSetup/GameSetup';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function ConfigurarPage() {
  const { t } = useTranslation();
  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-start gap-8 p-8 overflow-hidden bg-ink">
      <PageGlow pinkOpacity={0.25} />
      <PageTitle size="text-3xl" className="relative text-center">
        {t.configurar.title}
      </PageTitle>
      <div className="relative w-full max-w-sm">
        <GameSetup />
      </div>
      <ChipButton color="purple" href="/" className="relative">
        {t.common.mainMenu}
      </ChipButton>
    </main>
  );
}
```

- [ ] **Step 2: Editar `components/GameSetup/GameSetup.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Difficulty } from '@/lib/chess/difficulty';
import type { PlayerColor } from '@/lib/chess/playerColor';
import { clearSavedGame } from '@/lib/chess/useChessGame';
import { useSettings } from '@/lib/settings/useSettings';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { ToggleGroup } from '@/components/ToggleGroup/ToggleGroup';

export function GameSetup() {
  const router = useRouter();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const [difficulty, setDifficulty] = useState<Difficulty>(settings.defaultDifficulty);
  const [color, setColor] = useState<PlayerColor>(settings.defaultColor);

  const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
    { value: 'facil', label: t.difficulty.facil },
    { value: 'medio', label: t.difficulty.medio },
    { value: 'dificil', label: t.difficulty.dificil },
  ];
  const COLOR_OPTIONS: { value: PlayerColor; label: string }[] = [
    { value: 'white', label: t.color.white },
    { value: 'black', label: t.color.black },
    { value: 'random', label: t.color.random },
  ];

  function handleStart() {
    clearSavedGame();
    const params = new URLSearchParams({ mode: 'ai', difficulty, color });
    router.push(`/jogar?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-6 max-w-sm mx-auto w-full">
      <ToggleGroup legend={t.gameSetup.difficultyLegend} options={DIFFICULTY_OPTIONS} value={difficulty} onChange={setDifficulty} />
      <ToggleGroup legend={t.gameSetup.colorLegend} options={COLOR_OPTIONS} value={color} onChange={setColor} />
      <button
        type="button"
        onClick={handleStart}
        className="rounded-xl px-4 py-3 font-bold text-[#0B2E30] shadow-[4px_4px_0_rgba(0,0,0,0.35)] transition-transform hover:scale-[1.02]"
        style={{ background: 'linear-gradient(135deg, #FFD600, #FFA800)' }}
      >
        {t.gameSetup.start}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: `npx tsc --noEmit` + verificação manual em `/configurar`**

- [ ] **Step 3: Commit**

```bash
git add app/configurar/page.tsx components/GameSetup/GameSetup.tsx
git commit -m "feat(i18n): wire /configurar and GameSetup to translations

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y5poXWqz8nhndfRJvWEbbi"
```

---

## Task 8: `/jogar` — chrome estático (não a explicação de lances)

**Files:**
- Modify: `app/jogar/page.tsx`

**Constraints:** `suggestionExplanation`/`lastMoveExplanation` continuam a
vir de `describeMove()`/`explainMoveQuality()` (PT-only até à Fase 2) — não
mudar essa parte.

- [ ] **Step 1: Editar**

```tsx
import { useTranslation } from '@/lib/i18n/useTranslation';
// ...

function JogarContent() {
  const { t } = useTranslation();
  // ... resto do estado inalterado

  const STATUS_LABEL: Record<string, string> = {
    playing: t.jogar.status.playing,
    check: t.jogar.status.check,
    checkmate: t.jogar.status.checkmate,
    stalemate: t.jogar.status.stalemate,
    draw: t.jogar.status.draw,
  };

  useEffect(() => {
    if (state.status === prevStatus.current) return;
    prevStatus.current = state.status;

    if (state.status === 'check') {
      toast.show(t.jogar.status.check + '!', 'check'); // ver nota abaixo
    } else if (/* ... inalterado ... */) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGameEndOpen(true);
    }
  }, [state.status, toast, t]);

  // ... resto inalterado até ao JSX final
```

Nota sobre o toast de xeque: o texto original é `'Xeque!'`, uma string
própria (não `t.jogar.status.check` + "!", que ficaria `'Xeque!'` em PT mas
`'Check!'` em EN — na verdade coincide de propósito). Usar antes uma chave
dedicada em vez de concatenar, para não depender desta coincidência:
acrescentar a `Dictionary.jogar` um campo `checkToast: string` (`'Xeque!'`
em pt, `'Check!'` em en) na Task 3 seria o ideal — como a Task 3 já foi
escrita antes de reparar nisto, resolver aqui: reabrir
`lib/i18n/dictionaries/types.ts`/`pt.ts`/`en.ts` e acrescentar
`jogar.checkToast: 'Xeque!'` / `'Check!'` a cada um, atualizar o teste de
`dictionaries.test.ts` (corre automaticamente, não precisa de novo caso), e
usar `toast.show(t.jogar.checkToast, 'check')` aqui. Fazer esta pequena
correção retroativa à Task 3 como parte desta tarefa, antes de continuar.

Continuar o resto de `app/jogar/page.tsx`:

```tsx
  return (
    <main /* ... */>
      {/* ... */}
      <div className="flex flex-col items-center gap-4 w-[min(98vw,62dvh,560px)] sm:w-[min(92vw,62dvh,560px)]">
        <p className="font-semibold text-gold">{STATUS_LABEL[state.status]}</p>
        <ChessBoard /* ... inalterado ... */ />
        {mode === 'ai' && engineUnavailable && (
          <p className="max-w-sm rounded-2xl border-2 border-gold bg-ink-soft px-4 py-3 text-sm text-lilac">
            {t.jogar.engineUnavailable}
          </p>
        )}
      </div>

      {/* LearningPanel inalterado nesta tarefa — ver Task 9 */}

      <div className="flex items-center gap-3 flex-wrap justify-center md:w-full">
        <ChipButton color="purple" href="/">
          {t.common.mainMenu}
        </ChipButton>
        <ChipButton color="pink" onClick={handleReset}>
          {t.jogar.restart}
        </ChipButton>
        <ChipButton color="cyan" onClick={() => setRulesOpen(true)}>
          {t.jogar.rules}
        </ChipButton>
      </div>

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <GameEndModal /* ... inalterado — ver Task 11 ... */ />
    </main>
  );
}
```

`JogarPage` (o wrapper com `Suspense`) também tem um fallback literal:

```tsx
export default function JogarPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <JogarContent />
    </Suspense>
  );
}

// Componente à parte porque precisa de useTranslation(), e o próprio
// Suspense boundary não pode chamar hooks que dependam de dados ainda a
// carregar dentro do fallback — mas useTranslation() não depende de
// nenhum dado assíncrono, só de useSettings() (síncrono), por isso isto
// funciona sem problema.
function LoadingFallback() {
  const { t } = useTranslation();
  return <p className="p-8">{t.jogar.loading}</p>;
}
```

- [ ] **Step 2: `npx tsc --noEmit`**

- [ ] **Step 3: Verificação manual em `/jogar` (ambos os modos)**

Confirmar rótulo de estado, mensagem de motor indisponível (pode simular
bloqueando `public/stockfish/` no DevTools Network), e os 3 `ChipButton`.

- [ ] **Step 4: Commit**

```bash
git add app/jogar/page.tsx lib/i18n/dictionaries
git commit -m "feat(i18n): wire /jogar static chrome to translations

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y5poXWqz8nhndfRJvWEbbi"
```

---

## Task 9: `LearningPanel`

**Files:**
- Modify: `components/LearningPanel/LearningPanel.tsx`
- Test: `components/LearningPanel/LearningPanel.test.tsx` (não deve
  precisar de alteração — confirmar que continua a passar)

**Constraints:** `suggestionExplanation`/`lastMoveExplanation` continuam
props externas PT-only (Fase 2) — só os rótulos fixos do painel mudam.

- [ ] **Step 1: Editar**

```tsx
'use client';

import type { MoveQuality } from '@/lib/chess/moveClassification';
import { ACTIVE_TOGGLE_STYLE } from '@/lib/ui/activeToggleStyle';
import { useTranslation } from '@/lib/i18n/useTranslation';

export interface LearningPanelProps {
  /* inalterado */
}

export function LearningPanel({
  enabled,
  onToggle,
  onRequestSuggestion,
  suggestionLoading = false,
  hasSuggestion = false,
  suggestionExplanation = null,
  lastMoveQuality = null,
  lastMoveExplanation = null,
}: LearningPanelProps) {
  const { t } = useTranslation();
  const QUALITY_LABEL: Record<MoveQuality, string> = t.learningPanel.quality;

  return (
    <aside className="flex flex-col gap-4 w-full max-w-xs border-2 border-cyan rounded-2xl p-4 bg-ink-soft text-lilac">
      <label className="flex items-center justify-between gap-2 font-medium text-white">
        {t.learningPanel.toggleLabel}
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onToggle(event.target.checked)}
          className="h-5 w-5 accent-cyan"
        />
      </label>

      {enabled && (
        <>
          <p className="text-sm text-lilac/80">{t.learningPanel.description}</p>
          <button
            type="button"
            onClick={onRequestSuggestion}
            disabled={suggestionLoading}
            className="rounded-lg px-3 py-2 font-semibold text-[#0B2E30] shadow-[3px_3px_0_rgba(0,0,0,0.35)] disabled:opacity-50 transition-transform enabled:hover:scale-[1.02]"
            style={{ background: ACTIVE_TOGGLE_STYLE.background }}
          >
            {suggestionLoading ? t.common.thinking : t.learningPanel.suggestMove}
          </button>
          {hasSuggestion && (
            <p className="text-sm text-lilac/80">
              {t.learningPanel.suggestionHint}
              {suggestionExplanation && ` ${suggestionExplanation}`}
            </p>
          )}
          {lastMoveQuality && (
            <p className={`text-sm rounded-full px-3 py-2 ${QUALITY_CLASS[lastMoveQuality]}`}>
              {t.learningPanel.lastMoveLabel}
              {QUALITY_LABEL[lastMoveQuality]}
              {lastMoveExplanation && ` — ${lastMoveExplanation}`}
            </p>
          )}
        </>
      )}
    </aside>
  );
}
```

(`QUALITY_CLASS` — as cores semânticas — mantém-se exatamente como estava,
não é texto.)

- [ ] **Step 2: Confirmar que `LearningPanel.test.tsx` continua a passar**

Run: `npx vitest run components/LearningPanel/LearningPanel.test.tsx`
Expected: PASS, sem alteração ao ficheiro de teste (os textos PT-PT
continuam byte-idênticos).

- [ ] **Step 3: Commit**

```bash
git add components/LearningPanel/LearningPanel.tsx
git commit -m "feat(i18n): wire LearningPanel labels to translations

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y5poXWqz8nhndfRJvWEbbi"
```

---

## Task 10: `RulesModal`

**Files:**
- Modify: `components/RulesModal/RulesModal.tsx`
- Test: `components/RulesModal/RulesModal.test.tsx` (confirmar que continua
  a passar sem alteração)

- [ ] **Step 1: Editar**

`SECTIONS` deixa de ser constante de módulo (precisa de `t`):

```tsx
'use client';

import { useEffect } from 'react';
import { PageTitle } from '@/components/PageChrome/PageChrome';
import { useFocusTrap } from '@/lib/ui/useFocusTrap';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { Dictionary } from '@/lib/i18n/dictionaries';

export interface RulesModalProps {
  open: boolean;
  onClose: () => void;
}

function buildSections(t: Dictionary) {
  return [
    {
      title: t.rulesModal.movementTitle,
      items: [t.rulesModal.pawn, t.rulesModal.knight, t.rulesModal.bishop, t.rulesModal.rook, t.rulesModal.queen, t.rulesModal.king],
    },
    {
      title: t.rulesModal.specialTitle,
      items: [t.rulesModal.castling, t.rulesModal.enPassant, t.rulesModal.promotion],
    },
    {
      title: t.rulesModal.endgameTitle,
      items: [t.rulesModal.check, t.rulesModal.checkmate, t.rulesModal.stalemate, t.rulesModal.otherDraws],
    },
    {
      title: t.rulesModal.learningTitle,
      items: [t.rulesModal.centipawns],
    },
  ];
}

export function RulesModal({ open, onClose }: RulesModalProps) {
  const { t } = useTranslation();
  const panelRef = useFocusTrap(open);
  const SECTIONS = buildSections(t);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div data-testid="rules-modal-backdrop" onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t.rulesModal.title}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-2xl border-2 border-purple bg-ink-soft p-6 text-lilac outline-none"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <PageTitle as="h2" size="text-2xl" strokeWidth={1}>
            {t.rulesModal.title}
          </PageTitle>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="rounded-full h-8 w-8 shrink-0 bg-pink text-[#3A0B1F] font-bold hover:scale-110 transition-transform"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h3 className="mb-2 font-semibold text-cyan">{section.title}</h3>
              <dl className="flex flex-col gap-2">
                {section.items.map((item) => (
                  <div key={item.title}>
                    <dt className="font-medium text-white">{item.title}</dt>
                    <dd className="text-sm text-lilac/80">{item.text}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Confirmar que `RulesModal.test.tsx` continua a passar**

Run: `npx vitest run components/RulesModal/RulesModal.test.tsx`
Expected: PASS sem alteração ao ficheiro de teste.

- [ ] **Step 3: Commit**

```bash
git add components/RulesModal/RulesModal.tsx
git commit -m "feat(i18n): wire RulesModal to translations

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y5poXWqz8nhndfRJvWEbbi"
```

---

## Task 11: `GameEndModal` + `gameEndMessage.ts` bilingue

`lib/chess/gameEndMessage.ts` não estava listado na spec original (pequena
lacuna, corrigida aqui) — é pequeno o suficiente (5 frases-modelo, sem
composição por cláusulas como `moveExplanation.ts`) para entrar nesta fase
em vez de esperar pela Fase 2.

**Files:**
- Modify: `lib/chess/gameEndMessage.ts`
- Modify: `lib/chess/gameEndMessage.test.ts`
- Modify: `components/GameEndModal/GameEndModal.tsx`
- Test: `components/GameEndModal/GameEndModal.test.tsx` (verificar depois)

- [ ] **Step 1: Ler o teste existente**

Run: `cat lib/chess/gameEndMessage.test.ts`

- [ ] **Step 2: Atualizar `gameEndMessage.test.ts` para passar `locale` e
  cobrir os dois idiomas**

Adaptar cada `describeGameEnd(status, mode, humanColor, turn)` existente
para `describeGameEnd(status, mode, humanColor, turn, 'pt')`, e duplicar
pelo menos 2 casos representativos para `'en'`:

```ts
it('devolve a mensagem certa em inglês para xeque-mate quando ganhas', () => {
  expect(describeGameEnd('checkmate', 'ai', 'w', 'b', 'en')).toBe('You won! Checkmate.');
});

it('devolve a mensagem certa em inglês para afogamento', () => {
  expect(describeGameEnd('stalemate', 'ai', 'w', 'w', 'en')).toBe('Draw by stalemate.');
});
```

- [ ] **Step 3: Confirmar que falha**

Run: `npx vitest run lib/chess/gameEndMessage.test.ts`
Expected: FAIL — a assinatura ainda não aceita `locale`.

- [ ] **Step 4: Implementar `lib/chess/gameEndMessage.ts`**

```ts
import type { GameStatus } from './useChessGame';
import type { Locale } from '@/lib/i18n/types';
import { DICTIONARIES } from '@/lib/i18n/dictionaries';

export function describeGameEnd(
  status: GameStatus,
  mode: 'ai' | 'local',
  humanColor: 'w' | 'b',
  turn: 'w' | 'b',
  locale: Locale
): string | null {
  const t = DICTIONARIES[locale].gameEnd;
  if (status === 'checkmate') {
    if (mode === 'ai') {
      return turn === humanColor ? t.lostCheckmate : t.wonCheckmate;
    }
    return turn === 'w' ? t.checkmateBlackWins : t.checkmateWhiteWins;
  }
  if (status === 'stalemate') return t.stalemateDraw;
  if (status === 'draw') return t.draw;
  return null;
}
```

- [ ] **Step 5: Confirmar que os testes passam**

Run: `npx vitest run lib/chess/gameEndMessage.test.ts`
Expected: PASS.

- [ ] **Step 6: Editar `components/GameEndModal/GameEndModal.tsx`**

```tsx
'use client';

import { useEffect } from 'react';
import type { GameStatus } from '@/lib/chess/useChessGame';
import { describeGameEnd } from '@/lib/chess/gameEndMessage';
import { PageTitle } from '@/components/PageChrome/PageChrome';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { useFocusTrap } from '@/lib/ui/useFocusTrap';
import { useTranslation } from '@/lib/i18n/useTranslation';

export interface GameEndModalProps {
  /* inalterado */
}

export function GameEndModal({ open, status, mode, humanColor, turn, onClose, onPlayAgain }: GameEndModalProps) {
  const { t, locale } = useTranslation();
  const panelRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  const title = describeGameEnd(status, mode, humanColor, turn, locale);
  if (!title) return null;

  return (
    <div data-testid="game-end-modal-backdrop" onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-2xl border-2 border-purple bg-ink-soft p-6 text-lilac outline-none">
        <div className="mb-4 flex items-start justify-between gap-4">
          <PageTitle as="h2" size="text-xl" strokeWidth={1}>
            {title}
          </PageTitle>
          <button type="button" onClick={onClose} aria-label={t.common.close} className="rounded-full h-8 w-8 shrink-0 bg-pink text-[#3A0B1F] font-bold hover:scale-110 transition-transform">
            ✕
          </button>
        </div>
        <div className="flex gap-3">
          <ChipButton color="pink" onClick={onPlayAgain}>
            {t.gameEnd.playAgain}
          </ChipButton>
          <ChipButton color="purple" href="/">
            {t.common.mainMenu}
          </ChipButton>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Confirmar que `GameEndModal.test.tsx` continua a passar**

Run: `npx vitest run components/GameEndModal/GameEndModal.test.tsx`
Expected: PASS sem alteração ao ficheiro de teste (o dicionário `pt` é
byte-idêntico ao texto anterior, e o idioma por omissão continua `pt`).

- [ ] **Step 8: Commit**

```bash
git add lib/chess/gameEndMessage.ts lib/chess/gameEndMessage.test.ts components/GameEndModal/GameEndModal.tsx
git commit -m "feat(i18n): make gameEndMessage bilingual, wire GameEndModal

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y5poXWqz8nhndfRJvWEbbi"
```

---

## Task 12: Hub `/aprender` + lista `/aprender/aberturas`

**Files:**
- Modify: `app/aprender/page.tsx`
- Modify: `app/aprender/aberturas/page.tsx`

**Constraints:** `opening.name`/`opening.description`/`line.name` (vindos
de `OPENINGS`) continuam PT-only até à Fase 3 — não tocar.

- [ ] **Step 1: Editar `app/aprender/page.tsx`**

Ganha `'use client'`:

```tsx
'use client';

import { ChipButton } from '@/components/ChipButton/ChipButton';
import { NavCard } from '@/components/NavCard/NavCard';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { OPENINGS } from '@/lib/openings/data';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function AprenderPage() {
  const { t } = useTranslation();

  const TOPICS = [
    { href: '/aprender/pecas', title: t.aprenderHub.piecesTitle, description: t.aprenderHub.piecesDesc },
    { href: '/aprender/regras-especiais', title: t.aprenderHub.specialRulesTitle, description: t.aprenderHub.specialRulesDesc },
    { href: '/aprender/fim-de-jogo', title: t.aprenderHub.endgameTitle, description: t.aprenderHub.endgameDesc },
    { href: '/aprender/estrategia', title: t.aprenderHub.strategyTitle, description: t.aprenderHub.strategyDesc },
    { href: '/aprender/centipawns', title: t.aprenderHub.centipawnsTitle, description: t.aprenderHub.centipawnsDesc },
    { href: '/aprender/aberturas', title: t.aprenderHub.openingsTitle, description: t.aprenderHub.openingsDesc(OPENINGS.length) },
  ];

  return (
    <main className="relative min-h-screen max-w-2xl mx-auto p-8 flex flex-col gap-6 overflow-hidden bg-ink">
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <div>
        <PageTitle>{t.aprenderHub.title}</PageTitle>
        <p className="mt-3">
          <ChipButton color="purple" href="/">
            {t.aprenderHub.backToHome}
          </ChipButton>
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {TOPICS.map((topic) => (
          <li key={topic.href}>
            <NavCard href={topic.href} title={topic.title} description={topic.description} />
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 2: Editar `app/aprender/aberturas/page.tsx`**

Ganha `'use client'`:

```tsx
'use client';

import { ChipButton } from '@/components/ChipButton/ChipButton';
import { NavCard } from '@/components/NavCard/NavCard';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { OPENINGS } from '@/lib/openings/data';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function AberturasPage() {
  const { t } = useTranslation();
  return (
    <main className="relative min-h-screen max-w-2xl mx-auto p-8 flex flex-col gap-6 overflow-hidden bg-ink">
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <div>
        <PageTitle>{t.openings.hubTitle}</PageTitle>
        <p className="mt-3">
          <ChipButton color="purple" href="/aprender">
            {t.common.backToTutorial}
          </ChipButton>
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {OPENINGS.map((opening) => (
          <li key={opening.id}>
            <NavCard
              href={`/aprender/aberturas/${opening.id}`}
              title={opening.name}
              description={opening.description}
              meta={opening.lines.map((line) => line.name).join(' · ')}
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 3: `npx tsc --noEmit` + verificação manual**

- [ ] **Step 4: Commit**

```bash
git add app/aprender/page.tsx app/aprender/aberturas/page.tsx
git commit -m "feat(i18n): wire /aprender hub and openings list to translations

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y5poXWqz8nhndfRJvWEbbi"
```

---

## Task 13: `OpeningPageHeader` (novo) + as 2 páginas Server Component

**Files:**
- Create: `components/OpeningPageHeader/OpeningPageHeader.tsx`
- Test: `components/OpeningPageHeader/OpeningPageHeader.test.tsx`
- Modify: `app/aprender/aberturas/[id]/page.tsx`
- Modify: `app/aprender/aberturas/[id]/praticar/page.tsx`

**Constraints:** estas 2 páginas exportam `generateStaticParams` —
**não podem** ganhar `'use client'`. `opening.name`/`description`
continuam PT-only (Fase 3).

- [ ] **Step 1: Escrever o teste que falha primeiro**

```tsx
// components/OpeningPageHeader/OpeningPageHeader.test.tsx
import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OpeningPageHeader } from './OpeningPageHeader';
import { __resetSettingsCacheForTests } from '@/lib/settings/useSettings';
import type { Opening } from '@/lib/openings/types';

const opening: Opening = {
  id: 'italiana',
  name: 'Abertura Italiana',
  description: 'Uma abertura clássica.',
  lines: [],
};

describe('OpeningPageHeader', () => {
  beforeEach(() => {
    window.localStorage.clear();
    __resetSettingsCacheForTests();
  });

  it('mostra o nome/descrição da abertura e os dois botões, variante "study"', () => {
    render(<OpeningPageHeader opening={opening} variant="study" />);
    expect(screen.getByText('ABERTURA ITALIANA')).toBeInTheDocument();
    expect(screen.getByText('Uma abertura clássica.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar às aberturas' })).toHaveAttribute(
      'href',
      '/aprender/aberturas'
    );
    expect(screen.getByRole('link', { name: 'Praticar esta abertura' })).toHaveAttribute(
      'href',
      '/aprender/aberturas/italiana/praticar'
    );
  });

  it('mostra o botão "Voltar ao estudo", variante "practice"', () => {
    render(<OpeningPageHeader opening={opening} variant="practice" />);
    expect(screen.getByText('PRATICAR: ABERTURA ITALIANA')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao estudo' })).toHaveAttribute(
      'href',
      '/aprender/aberturas/italiana'
    );
  });
});
```

- [ ] **Step 2: Confirmar que falha**

Run: `npx vitest run components/OpeningPageHeader/OpeningPageHeader.test.tsx`
Expected: FAIL — o ficheiro ainda não existe.

- [ ] **Step 3: Implementar `components/OpeningPageHeader/OpeningPageHeader.tsx`**

```tsx
'use client';

import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageTitle } from '@/components/PageChrome/PageChrome';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { Opening } from '@/lib/openings/types';

/**
 * Extraído do próprio page.tsx porque esse ficheiro exporta
 * generateStaticParams e por isso não pode ganhar 'use client' — este
 * componente é que consome useTranslation(). opening.name/description
 * continuam strings PT-only até à Fase 3 (lib/openings/data.ts bilingue).
 */
export function OpeningPageHeader({ opening, variant }: { opening: Opening; variant: 'study' | 'practice' }) {
  const { t } = useTranslation();
  const title = variant === 'practice' ? `${t.openings.practicePrefix}${opening.name.toUpperCase()}` : opening.name.toUpperCase();

  return (
    <div>
      <PageTitle>{title}</PageTitle>
      {variant === 'study' ? (
        <>
          <p className="mt-2 text-lilac/80">{opening.description}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <ChipButton color="purple" href="/aprender/aberturas">
              {t.openings.backToOpenings}
            </ChipButton>
            <ChipButton color="gold" href={`/aprender/aberturas/${opening.id}/praticar`}>
              {t.openings.practiceThisOpening}
            </ChipButton>
          </div>
        </>
      ) : (
        <p className="mt-3">
          <ChipButton color="purple" href={`/aprender/aberturas/${opening.id}`}>
            {t.openings.backToStudy}
          </ChipButton>
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Confirmar que os testes passam**

Run: `npx vitest run components/OpeningPageHeader/OpeningPageHeader.test.tsx`
Expected: PASS (2/2)

- [ ] **Step 5: Editar `app/aprender/aberturas/[id]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { PageGlow } from '@/components/PageChrome/PageChrome';
import { OPENINGS } from '@/lib/openings/data';
import { OpeningStudy } from '@/components/OpeningStudy/OpeningStudy';
import { OpeningPageHeader } from '@/components/OpeningPageHeader/OpeningPageHeader';

export async function generateStaticParams() {
  return OPENINGS.map((opening) => ({ id: opening.id }));
}

export default async function OpeningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opening = OPENINGS.find((o) => o.id === id);
  if (!opening) notFound();

  return (
    <main className="relative min-h-screen max-w-2xl mx-auto p-8 flex flex-col gap-6 overflow-hidden bg-ink">
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <OpeningPageHeader opening={opening} variant="study" />
      <OpeningStudy key={opening.id} opening={opening} />
    </main>
  );
}
```

- [ ] **Step 6: Editar `app/aprender/aberturas/[id]/praticar/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { PageGlow } from '@/components/PageChrome/PageChrome';
import { OPENINGS } from '@/lib/openings/data';
import { OpeningPractice } from '@/components/OpeningPractice/OpeningPractice';
import { OpeningPageHeader } from '@/components/OpeningPageHeader/OpeningPageHeader';

export async function generateStaticParams() {
  return OPENINGS.map((opening) => ({ id: opening.id }));
}

export default async function PraticarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opening = OPENINGS.find((o) => o.id === id);
  if (!opening) notFound();

  return (
    <main className="relative min-h-screen max-w-2xl mx-auto p-8 flex flex-col gap-6 overflow-hidden bg-ink">
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <OpeningPageHeader opening={opening} variant="practice" />
      <OpeningPractice key={opening.id} opening={opening} />
    </main>
  );
}
```

- [ ] **Step 7: `npx tsc --noEmit` + `npm run build`**

Run: `npm run build`
Expected: build sem erros — confirma que as duas páginas continuam a gerar
estaticamente (`generateStaticParams` intacto) e que `OpeningPageHeader`
não introduziu nenhum problema de Server/Client boundary.

- [ ] **Step 8: Verificação manual**

Abrir uma página de abertura (ex.: `/aprender/aberturas/italiana`) e a de
prática, trocar idioma em `/opções`, confirmar que título/botões mudam mas
`opening.description` continua em português (esperado até à Fase 3).

- [ ] **Step 9: Commit**

```bash
git add components/OpeningPageHeader "app/aprender/aberturas/[id]/page.tsx" "app/aprender/aberturas/[id]/praticar/page.tsx"
git commit -m "feat(i18n): add OpeningPageHeader for the two static-params pages

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y5poXWqz8nhndfRJvWEbbi"
```

---

## Task 14: `LineTabs`, `OpeningStudy`, `OpeningPractice`

**Files:**
- Modify: `components/LineTabs/LineTabs.tsx`
- Modify: `components/OpeningStudy/OpeningStudy.tsx`
- Modify: `components/OpeningPractice/OpeningPractice.tsx`
- Test: `components/LineTabs/LineTabs.test.tsx`,
  `components/OpeningStudy/OpeningStudy.test.tsx`,
  `components/OpeningPractice/OpeningPractice.test.tsx` (confirmar que
  continuam a passar)

**Constraints:** `current.explanation`/`expected.san` continuam vindos de
`replayLine` (PT-only, Fase 3) — só rótulos fixos mudam.

- [ ] **Step 1: Editar `components/LineTabs/LineTabs.tsx`**

Só o `aria-label` estático precisa de `t`:

```tsx
'use client';

import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { ACTIVE_TOGGLE_STYLE } from '@/lib/ui/activeToggleStyle';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function LineTabs({ lines, activeIndex, onSelect, children }: {
  lines: { name: string }[];
  activeIndex: number;
  onSelect: (index: number) => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /* focusAndSelect/handleKeyDown inalterados */

  return (
    <>
      <div className="flex flex-wrap gap-2 justify-center" role="tablist" aria-label={t.openings.linesTablistLabel}>
        {/* resto inalterado — line.name continua PT-only (vem de OPENINGS) */}
      </div>
      {/* resto inalterado */}
    </>
  );
}
```

- [ ] **Step 2: Editar `components/OpeningStudy/OpeningStudy.tsx`**

```tsx
'use client';

import { useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { LineTabs } from '@/components/LineTabs/LineTabs';
import { useSettings } from '@/lib/settings/useSettings';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { replayLine, type ReplayedMove } from '@/lib/openings/replayLine';
import { checkedKingSquare } from '@/lib/chess/legalMoves';
import type { Opening } from '@/lib/openings/types';

const START_FEN = new Chess().fen();

function moveLabel(stepIndex: number): string {
  const fullmove = Math.ceil(stepIndex / 2);
  return stepIndex % 2 === 1 ? `${fullmove}. ` : `${fullmove}...`;
}

export function OpeningStudy({ opening }: { opening: Opening }) {
  const { settings } = useSettings();
  const { t } = useTranslation();
  /* resto do estado inalterado */

  return (
    <div className="flex flex-col items-center gap-4">
      <LineTabs lines={opening.lines} activeIndex={lineIndex} onSelect={selectLine}>
        <div className="w-[min(98vw,62dvh,560px)] sm:w-[min(92vw,62dvh,560px)] flex flex-col items-center gap-3">
          <ChessBoard fen={fen} boardTheme={settings.boardTheme} pieceStyle={settings.pieceStyle} lastMove={lastMove} checkSquare={checkSquare} interactive={false} />

          <div className="flex items-center gap-3">
            <ChipButton ref={prevButtonRef} color="pink" onClick={() => goToStep(Math.max(0, stepIndex - 1))} disabled={stepIndex === 0}>
              {t.openings.previous}
            </ChipButton>
            <span className="text-sm text-lilac/80">{stepIndex} / {replayed.length}</span>
            <ChipButton ref={nextButtonRef} color="cyan" onClick={() => goToStep(Math.min(replayed.length, stepIndex + 1))} disabled={stepIndex === replayed.length}>
              {t.openings.next}
            </ChipButton>
          </div>

          <div className="w-full rounded-xl border-2 border-purple/40 bg-ink-soft p-4 text-center" aria-live="polite">
            {current ? (
              <>
                <p className="font-semibold text-cyan">{moveLabel(stepIndex)}{current.san}</p>
                <p className="text-lilac/80 mt-1">{current.explanation}</p>
              </>
            ) : (
              <p className="text-lilac/80">{t.openings.startPosition}</p>
            )}
          </div>
        </div>
      </LineTabs>
    </div>
  );
}
```

- [ ] **Step 3: Editar `components/OpeningPractice/OpeningPractice.tsx`**

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { LineTabs } from '@/components/LineTabs/LineTabs';
import { useSettings } from '@/lib/settings/useSettings';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { replayLine } from '@/lib/openings/replayLine';
import { legalTargetsFrom, checkedKingSquare } from '@/lib/chess/legalMoves';
import type { Opening } from '@/lib/openings/types';

/* START_FEN, OPPONENT_MOVE_DELAY_MS, protagonistColorFor inalterados */

export function OpeningPractice({ opening }: { opening: Opening }) {
  const { settings } = useSettings();
  const { t } = useTranslation();
  /* resto do estado/efeitos inalterado */

  return (
    <div className="flex flex-col items-center gap-4">
      <LineTabs lines={opening.lines} activeIndex={lineIndex} onSelect={selectLine}>
        <div className="w-[min(98vw,62dvh,560px)] sm:w-[min(92vw,62dvh,560px)] flex flex-col items-center gap-3">
          <ChessBoard /* inalterado */ />

          {completed ? (
            <div className="w-full rounded-xl border-2 border-gold bg-ink-soft p-4 text-center flex flex-col gap-3" aria-live="polite">
              <p className="font-semibold text-gold">{t.openings.lineComplete}</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <ChipButton color="pink" onClick={restartLine}>
                  {t.openings.practiceAgain}
                </ChipButton>
                <ChipButton color="purple" href="/aprender/aberturas">
                  {t.openings.backToOpenings}
                </ChipButton>
              </div>
            </div>
          ) : (
            <div className="w-full rounded-xl border-2 border-purple/40 bg-ink-soft p-4 text-center" aria-live="polite">
              {isUserTurn ? (
                wrongAttempt ? (
                  <p className="text-lilac/80">{t.openings.wrongMove(expected!.san)}</p>
                ) : (
                  <p className="text-lilac/80">{t.openings.yourTurn}</p>
                )
              ) : (
                <p className="text-lilac/80">{t.common.thinking}</p>
              )}
            </div>
          )}
        </div>
      </LineTabs>
    </div>
  );
}
```

- [ ] **Step 4: Confirmar que os 3 ficheiros de teste continuam a passar**

Run: `npx vitest run components/LineTabs components/OpeningStudy components/OpeningPractice`
Expected: PASS em todos, sem alteração aos ficheiros de teste.

- [ ] **Step 5: Commit**

```bash
git add components/LineTabs components/OpeningStudy components/OpeningPractice
git commit -m "feat(i18n): wire LineTabs, OpeningStudy, OpeningPractice labels

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y5poXWqz8nhndfRJvWEbbi"
```

---

## Task 15: `/aprender/estrategia`

**Files:**
- Modify: `app/aprender/estrategia/page.tsx`

- [ ] **Step 1: Editar** (ganha `'use client'`)

```tsx
'use client';

import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function EstrategiaPage() {
  const { t } = useTranslation();
  return (
    <main className="relative min-h-screen max-w-2xl mx-auto p-8 flex flex-col gap-6 overflow-hidden bg-ink">
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <div>
        <PageTitle>{t.estrategia.title}</PageTitle>
        <p className="mt-3">
          <ChipButton color="purple" href="/aprender">
            {t.common.backToTutorial}
          </ChipButton>
        </p>
      </div>
      <ul className="flex flex-col gap-4">
        {t.estrategia.principles.map((principle) => (
          <li key={principle.title} className="rounded-xl border-2 border-purple/40 bg-ink-soft p-4">
            <p className="font-semibold text-white">{principle.title}</p>
            <p className="text-lilac/80 mt-1">{principle.text}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 2: `npx tsc --noEmit` + verificação manual**

- [ ] **Step 3: Commit**

```bash
git add app/aprender/estrategia/page.tsx
git commit -m "feat(i18n): wire /aprender/estrategia to translations

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y5poXWqz8nhndfRJvWEbbi"
```

---

## Task 16: `/aprender/centipawns`

**Files:**
- Modify: `app/aprender/centipawns/page.tsx`

- [ ] **Step 1: Acrescentar os textos dos 3 níveis de qualidade ao
  dicionário** (faltavam da Task 3 — o rótulo já existia em
  `learningPanel.quality`, mas o texto explicativo desta página é novo;
  corrigir retroativamente `lib/i18n/dictionaries/types.ts`/`pt.ts`/
  `en.ts`)

Em `types.ts`, dentro de `centipawnsPage`, acrescentar:

```ts
qualityTexts: { boa: string; imprecisao: string; erro: string };
```

Em `pt.ts`:

```ts
qualityTexts: {
  boa: 'Perda até 30 centipawns — praticamente ao nível do melhor lance disponível.',
  imprecisao: 'Perda entre 31 e 100 centipawns — um lance que cede uma pequena vantagem, sem ser grave.',
  erro: 'Perda acima de 100 centipawns — um lance que troca uma vantagem real, por exemplo perder material ou uma posição muito melhor.',
},
```

Em `en.ts`:

```ts
qualityTexts: {
  boa: 'Loss of up to 30 centipawns — practically at the level of the best available move.',
  imprecisao: 'Loss between 31 and 100 centipawns — a move that gives up a small advantage, without being serious.',
  erro: 'Loss above 100 centipawns — a move that trades away a real advantage, for example losing material or a much better position.',
},
```

Run: `npx vitest run lib/i18n/dictionaries/dictionaries.test.ts`
Expected: PASS — confirma que `pt`/`en` continuam com as mesmas chaves.

- [ ] **Step 2: Editar `app/aprender/centipawns/page.tsx`** (ganha
  `'use client'`)

```tsx
'use client';

import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { useTranslation } from '@/lib/i18n/useTranslation';

const QUALITY_BADGE_CLASS: Record<'boa' | 'imprecisao' | 'erro', string> = {
  boa: 'bg-emerald-900/60 text-emerald-200',
  imprecisao: 'bg-amber-900/60 text-amber-200',
  erro: 'bg-red-900/60 text-red-200',
};

export default function CentipawnsPage() {
  const { t } = useTranslation();
  const qualityLevels: { key: 'boa' | 'imprecisao' | 'erro'; label: string; text: string }[] = [
    { key: 'boa', label: t.learningPanel.quality.boa, text: t.centipawnsPage.qualityTexts.boa },
    { key: 'imprecisao', label: t.learningPanel.quality.imprecisao, text: t.centipawnsPage.qualityTexts.imprecisao },
    { key: 'erro', label: t.learningPanel.quality.erro, text: t.centipawnsPage.qualityTexts.erro },
  ];

  return (
    <main className="relative min-h-screen max-w-2xl mx-auto p-8 flex flex-col gap-6 overflow-hidden bg-ink">
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <div>
        <PageTitle>{t.centipawnsPage.title}</PageTitle>
        <p className="mt-3">
          <ChipButton color="purple" href="/aprender">
            {t.common.backToTutorial}
          </ChipButton>
        </p>
      </div>
      <ul className="flex flex-col gap-4">
        {t.centipawnsPage.concepts.map((concept) => (
          <li key={concept.title} className="rounded-xl border-2 border-purple/40 bg-ink-soft p-4">
            <p className="font-semibold text-white">{concept.title}</p>
            <p className="text-lilac/80 mt-1">{concept.text}</p>
          </li>
        ))}
      </ul>
      <div>
        <p className="font-semibold text-white mb-3">{t.centipawnsPage.levelsHeading}</p>
        <ul className="flex flex-col gap-3">
          {qualityLevels.map((level) => (
            <li key={level.key} className="rounded-xl border-2 border-purple/40 bg-ink-soft p-4 flex flex-col gap-2">
              <span className={`self-start rounded-full px-3 py-1 text-sm font-semibold ${QUALITY_BADGE_CLASS[level.key]}`}>
                {level.label}
              </span>
              <p className="text-lilac/80">{level.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: `npx tsc --noEmit` + verificação manual**

- [ ] **Step 4: Commit**

```bash
git add app/aprender/centipawns/page.tsx lib/i18n/dictionaries
git commit -m "feat(i18n): wire /aprender/centipawns to translations

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y5poXWqz8nhndfRJvWEbbi"
```

---

## Task 17: `InteractiveDemo` + `pecas`/`regras-especiais`/`fim-de-jogo`

**Files:**
- Modify: `components/InteractiveDemo/InteractiveDemo.tsx`
- Modify: `app/aprender/pecas/page.tsx`
- Modify: `app/aprender/regras-especiais/page.tsx`
- Modify: `app/aprender/fim-de-jogo/page.tsx`
- Test: `app/aprender/pecas/page.test.tsx`,
  `app/aprender/regras-especiais/page.test.tsx`,
  `app/aprender/fim-de-jogo/page.test.tsx` (confirmar que continuam a
  passar — usam `title`/`description` das próprias `DEMOS`, que continuam
  vindas de fora do componente)

- [ ] **Step 1: Editar `components/InteractiveDemo/InteractiveDemo.tsx`**
  (só o botão "Reiniciar")

```tsx
'use client';

import { useState } from 'react';
import { Chess, type Square } from 'chess.js';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { legalTargetsFrom, forceTurnFor, checkedKingSquare } from '@/lib/chess/legalMoves';
import { useTranslation } from '@/lib/i18n/useTranslation';

export interface PieceDemo {
  title: string;
  description: string;
  fen: string;
  square: Square;
}

export function InteractiveDemo({ title, description, fen: initialFen, square: initialSquare }: PieceDemo) {
  const { t } = useTranslation();
  /* resto do estado/handlers inalterado */

  return (
    <section className="flex flex-col sm:flex-row gap-4 items-center">
      <div className="w-full sm:w-64 shrink-0 flex flex-col items-center gap-3">
        <ChessBoard fen={fen} selectedSquare={square} legalTargets={legalTargets} lastMove={lastMove} checkSquare={checkSquare} interactive onSquareClick={handleSquareClick} />
        <ChipButton color="pink" onClick={handleReset}>
          {t.interactiveDemo.reset}
        </ChipButton>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-cyan">{title}</h2>
        <p className="text-lilac/80 mt-1">{description}</p>
      </div>
    </section>
  );
}
```

(`title`/`description` continuam props externas — vêm de cada `DEMOS[]`,
que passam a ler do dicionário nos 3 ficheiros abaixo.)

- [ ] **Step 2: Editar `app/aprender/pecas/page.tsx`** (ganha `'use client'`)

```tsx
'use client';

import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { InteractiveDemo, type PieceDemo } from '@/components/InteractiveDemo/InteractiveDemo';
import { useTranslation } from '@/lib/i18n/useTranslation';

const FENS = {
  pawn: { fen: '4k3/8/8/8/8/3p4/4P3/4K3 w - - 0 1', square: 'e2' as const },
  knight: { fen: '4k3/8/8/8/4N3/8/8/4K3 w - - 0 1', square: 'e4' as const },
  bishop: { fen: '4k3/8/8/8/4B3/8/8/4K3 w - - 0 1', square: 'e4' as const },
  rook: { fen: '4k3/8/8/8/4R3/8/8/4K3 w - - 0 1', square: 'e4' as const },
  queen: { fen: '4k3/8/8/8/4Q3/8/8/4K3 w - - 0 1', square: 'e4' as const },
  king: { fen: '8/8/8/4k3/8/4K3/8/8 w - - 0 1', square: 'e3' as const },
};

export default function PecasPage() {
  const { t } = useTranslation();
  const DEMOS: PieceDemo[] = [
    { title: t.pecas.pawn.title, description: t.pecas.pawn.desc, ...FENS.pawn },
    { title: t.pecas.knight.title, description: t.pecas.knight.desc, ...FENS.knight },
    { title: t.pecas.bishop.title, description: t.pecas.bishop.desc, ...FENS.bishop },
    { title: t.pecas.rook.title, description: t.pecas.rook.desc, ...FENS.rook },
    { title: t.pecas.queen.title, description: t.pecas.queen.desc, ...FENS.queen },
    { title: t.pecas.king.title, description: t.pecas.king.desc, ...FENS.king },
  ];

  return (
    <main className="relative min-h-screen max-w-3xl mx-auto p-8 flex flex-col gap-8 overflow-hidden bg-ink">
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <div>
        <PageTitle>{t.pecas.title}</PageTitle>
        <p className="mt-3">
          <ChipButton color="purple" href="/aprender">
            {t.common.backToTutorial}
          </ChipButton>
        </p>
      </div>
      {DEMOS.map((demo) => (
        <InteractiveDemo key={demo.title} {...demo} />
      ))}
    </main>
  );
}
```

- [ ] **Step 3: Confirmar que `app/aprender/pecas/page.test.tsx` continua a
  passar**

Run: `npx vitest run app/aprender/pecas/page.test.tsx`
Expected: PASS sem alteração ao ficheiro de teste — mas ler primeiro o
ficheiro de teste para confirmar que nenhuma asserção depende de `DEMOS`
como constante de módulo importável diretamente (se depender, ajustar o
teste para usar os textos PT esperados diretamente, já que `DEMOS` deixou
de ser exportável do módulo da página).

- [ ] **Step 4: Repetir o mesmo padrão para
  `app/aprender/regras-especiais/page.tsx`**

```tsx
'use client';

import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { InteractiveDemo, type PieceDemo } from '@/components/InteractiveDemo/InteractiveDemo';
import { useTranslation } from '@/lib/i18n/useTranslation';

const FENS = {
  castling: { fen: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', square: 'e1' as const },
  enPassant: { fen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', square: 'e5' as const },
  promotion: { fen: 'k7/4P3/8/8/8/8/8/4K3 w - - 0 1', square: 'e7' as const },
};

export default function RegrasEspeciaisPage() {
  const { t } = useTranslation();
  const DEMOS: PieceDemo[] = [
    { title: t.regrasEspeciais.castling.title, description: t.regrasEspeciais.castling.desc, ...FENS.castling },
    { title: t.regrasEspeciais.enPassant.title, description: t.regrasEspeciais.enPassant.desc, ...FENS.enPassant },
    { title: t.regrasEspeciais.promotion.title, description: t.regrasEspeciais.promotion.desc, ...FENS.promotion },
  ];

  return (
    <main className="relative min-h-screen max-w-3xl mx-auto p-8 flex flex-col gap-8 overflow-hidden bg-ink">
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <div>
        <PageTitle>{t.regrasEspeciais.title}</PageTitle>
        <p className="mt-3">
          <ChipButton color="purple" href="/aprender">
            {t.common.backToTutorial}
          </ChipButton>
        </p>
      </div>
      {DEMOS.map((demo) => (
        <InteractiveDemo key={demo.title} {...demo} />
      ))}
    </main>
  );
}
```

- [ ] **Step 5: Confirmar que `regras-especiais/page.test.tsx` continua a
  passar** (mesma verificação do Step 3)

- [ ] **Step 6: Repetir para `app/aprender/fim-de-jogo/page.tsx`**

```tsx
'use client';

import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { InteractiveDemo, type PieceDemo } from '@/components/InteractiveDemo/InteractiveDemo';
import { useTranslation } from '@/lib/i18n/useTranslation';

const FENS = {
  check: { fen: '4k3/8/8/8/8/8/8/4R2K b - - 0 1', square: 'e8' as const },
  checkmate: { fen: '4R1k1/5ppp/8/8/8/8/8/6K1 b - - 0 1', square: 'g8' as const },
  stalemate: { fen: '7k/8/6Q1/6K1/8/8/8/8 b - - 0 1', square: 'h8' as const },
};

export default function FimDeJogoPage() {
  const { t } = useTranslation();
  const DEMOS: PieceDemo[] = [
    { title: t.fimDeJogo.check.title, description: t.fimDeJogo.check.desc, ...FENS.check },
    { title: t.fimDeJogo.checkmate.title, description: t.fimDeJogo.checkmate.desc, ...FENS.checkmate },
    { title: t.fimDeJogo.stalemate.title, description: t.fimDeJogo.stalemate.desc, ...FENS.stalemate },
  ];

  return (
    <main className="relative min-h-screen max-w-3xl mx-auto p-8 flex flex-col gap-8 overflow-hidden bg-ink">
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <div>
        <PageTitle>{t.fimDeJogo.title}</PageTitle>
        <p className="mt-3">
          <ChipButton color="purple" href="/aprender">
            {t.common.backToTutorial}
          </ChipButton>
        </p>
      </div>
      {DEMOS.map((demo) => (
        <InteractiveDemo key={demo.title} {...demo} />
      ))}

      <section>
        <h2 className="text-xl font-semibold text-cyan">{t.fimDeJogo.otherDrawsTitle}</h2>
        <p className="text-lilac/80 mt-1">{t.fimDeJogo.otherDrawsText}</p>
      </section>
    </main>
  );
}
```

- [ ] **Step 7: Confirmar que `fim-de-jogo/page.test.tsx` continua a
  passar** (mesma verificação do Step 3)

- [ ] **Step 8: `npm run test` completo + `npm run lint` + `npx tsc --noEmit`
  + `npm run build`**

Expected: tudo verde — esta é a última tarefa da fase, corre a suite
inteira antes de fechar.

- [ ] **Step 9: Verificação manual completa**

Percorrer, com o idioma trocado para inglês em `/opções`: `/`, `/configurar`,
`/opcoes`, `/jogar` (ambos os modos), `/aprender` e as 9 subpáginas,
`/aprender/aberturas` + uma abertura + a sua prática. Confirmar que todo o
texto estático mudou, e que `opening.name/description`,
`suggestionExplanation`/`lastMoveExplanation`, e `current.explanation`
continuam (esperadamente) em português — isso só muda nas Fases 2/3.

- [ ] **Step 10: Atualizar `CLAUDE.md`**

Acrescentar uma secção nova "Múltiplos idiomas (`lib/i18n/`)" com a mesma
profundidade das outras secções de features grandes (padrão do
`useTranslation()`, deteção no arranque, a limitação temporária de
`opening.name`/`moveExplanation` ainda serem PT-only até às Fases 2/3), e
atualizar a nota existente sobre `<html lang="pt-PT">` "deve manter-se
assim" para refletir que agora é dinâmico via `LanguageSync` (`manifest.json`
continua fixo).

- [ ] **Step 11: Commit final da fase**

```bash
git add app/aprender/pecas/page.tsx app/aprender/regras-especiais/page.tsx app/aprender/fim-de-jogo/page.tsx components/InteractiveDemo/InteractiveDemo.tsx CLAUDE.md
git commit -m "feat(i18n): wire tutorial demo pages to translations, document lib/i18n in CLAUDE.md

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y5poXWqz8nhndfRJvWEbbi"
```
