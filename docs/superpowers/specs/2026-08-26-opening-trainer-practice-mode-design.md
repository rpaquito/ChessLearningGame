# Treinador de aberturas — Modo de prática — Design

Data: 2026-08-26

## Objetivo

Terceiro e último sub-projeto do "treinador de aberturas" (ver
`docs/superpowers/specs/2026-08-26-opening-trainer-data-design.md`,
sub-projeto 1, e `docs/superpowers/specs/2026-08-26-opening-trainer-study-mode-design.md`,
sub-projeto 2, ambos já mesclados em `main`). Constrói o modo de
prática: uma nova rota `/aprender/aberturas/[id]/praticar` onde o
utilizador joga uma linha de abertura contra um adversário que
responde sempre com os lances dessa mesma linha — sem Stockfish, sem
avaliação de centipawns. Um lance errado (fora da linha) não é
aceite: o utilizador tem de encontrar o lance certo para continuar,
com o lance revelado depois de uma tentativa falhada.

Isto acaba por ser **mais simples** do que a ideia original apontada no
backlog do projeto ("prática vs. motor, feedback de desvio reutilizando
moveClassification/moveExplanation") — decisões tomadas neste
brainstorming (adversário determinístico, lances errados bloqueados em
vez de jogados-e-explicados, sem transição para jogo livre no fim)
significam que este sub-projeto **não usa `StockfishClient`,
`moveClassification.ts` nem `moveExplanation.ts`** — só `replayLine`
(sub-projeto 1) e os helpers puros já existentes em
`lib/chess/legalMoves.ts`.

## Não-objetivos

- **Sem Stockfish.** O adversário reproduz sempre os lances da própria
  linha, nunca calcula um lance com o motor.
- **Sem avaliação de qualidade de lance (centipawns).** Um lance do
  utilizador só é "certo" ou "errado" por comparação exata com o
  próximo lance da linha — não há classificação boa/imprecisão/erro
  aqui.
- **Sem transição para jogo livre.** Ao completar a linha, a sessão
  termina com um ecrã de conclusão — não continua como uma partida
  normal. (Ideia descartada explicitamente no brainstorming, em favor
  de manter o âmbito preso à linha estudada.)
- **Sem escolha de cor pelo utilizador.** A cor é derivada do `id` da
  abertura (ver Arquitetura) — sem seletor Branco/Preto/Aleatório.
- **Sem persistência.** Tal como o modo de estudo, sair da página ou
  trocar de linha reinicia sempre a tentativa (lance 0).
- **Sem promoção.** Nenhuma das 25 linhas existentes (sub-projeto 1)
  chega a uma promoção dentro do seu alcance (8-12 meios-lances) — a
  comparação lance-do-utilizador-vs-linha usa só `from`/`to`, não
  `promotion`. Se uma linha futura vier a incluir uma promoção, duas
  escolhas de peça promovida diferentes que aterrem na mesma casa
  ficariam indistinguíveis aqui — aceitável por agora, documentado
  como limitação conhecida, não algo a resolver nesta entrega.

## Arquitetura e componentes

### 1. Derivação da cor do utilizador

```ts
function protagonistColorFor(opening: Opening): 'w' | 'b' {
  return opening.id.startsWith('defesa-') ? 'b' : 'w';
}
```

Verificado contra os 12 `id` reais de `OPENINGS`: `defesa-*` (6
aberturas) → pretas; `abertura-*`/`gambito-da-dama`/`sistema-londres`
(6 aberturas) → brancas. Cobre os 12 casos sem precisar de nenhum
campo novo em `lib/openings/types.ts`/`data.ts` — decisão deliberada do
brainstorming para não tocar no sub-projeto 1 já mesclado. Função pura,
vive dentro de `OpeningPractice.tsx` (só ali é usada).

### 2. `components/OpeningPractice/OpeningPractice.tsx` — o núcleo do modo de prática

Reaproveita a mesma "forma" de dados do modo de estudo
(`replayLine(line)` pré-computado por linha, indexado por um contador
de lances) mas com uma diferença chave: **tanto o lance do adversário
como o lance certo do utilizador avançam o mesmo `plyIndex` sobre o
mesmo array pré-computado** — nunca é preciso chamar `chess.move()`
para aplicar um lance; validar um clique do utilizador é só comparar
`{from, to}` contra `replayed[plyIndex]` e, se bater certo,
avançar o índice (o FEN seguinte já está pré-calculado). `chess.js`
entra só para calcular os alvos legais do clique atual (para o
tabuleiro parecer um tabuleiro real, não "adivinha a única casa
certa") e para `checkedKingSquare`.

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { ACTIVE_TOGGLE_STYLE } from '@/lib/ui/activeToggleStyle';
import { useSettings } from '@/lib/settings/useSettings';
import { replayLine } from '@/lib/openings/replayLine';
import { legalTargetsFrom, checkedKingSquare } from '@/lib/chess/legalMoves';
import type { Opening } from '@/lib/openings/types';

const START_FEN = new Chess().fen();
const OPPONENT_MOVE_DELAY_MS = 500;

function protagonistColorFor(opening: Opening): 'w' | 'b' {
  return opening.id.startsWith('defesa-') ? 'b' : 'w';
}

export function OpeningPractice({ opening }: { opening: Opening }) {
  const { settings } = useSettings();
  const protagonistColor = useMemo(() => protagonistColorFor(opening), [opening]);
  const replayedLines = useMemo(() => opening.lines.map((line) => replayLine(line)), [opening]);

  const [lineIndex, setLineIndex] = useState(0);
  const [plyIndex, setPlyIndex] = useState(0);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [wrongAttempt, setWrongAttempt] = useState(false);

  const replayed = replayedLines[lineIndex];
  const fen = plyIndex === 0 ? START_FEN : replayed[plyIndex - 1].fen;
  const lastMove = plyIndex === 0 ? null : { from: replayed[plyIndex - 1].from, to: replayed[plyIndex - 1].to };
  const checkSquare = checkedKingSquare(fen);
  const completed = plyIndex === replayed.length;
  const nextMoverColor: 'w' | 'b' = plyIndex % 2 === 0 ? 'w' : 'b';
  const isUserTurn = !completed && nextMoverColor === protagonistColor;
  const legalTargets = selectedSquare ? legalTargetsFrom(fen, selectedSquare) : [];
  const expected = completed ? null : replayed[plyIndex];

  function selectLine(index: number) {
    setLineIndex(index);
    setPlyIndex(0);
    setSelectedSquare(null);
    setWrongAttempt(false);
  }

  function restartLine() {
    setPlyIndex(0);
    setSelectedSquare(null);
    setWrongAttempt(false);
  }

  // O adversário joga sempre o lance da própria linha, automaticamente.
  useEffect(() => {
    if (completed || isUserTurn) return;
    const timer = setTimeout(() => {
      setPlyIndex((p) => p + 1);
      setWrongAttempt(false);
    }, OPPONENT_MOVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [completed, isUserTurn, plyIndex]);

  function handleSquareClick(square: Square) {
    if (!isUserTurn || !expected) return;

    if (selectedSquare && legalTargets.includes(square)) {
      if (square === expected.to && selectedSquare === expected.from) {
        setPlyIndex((p) => p + 1);
        setWrongAttempt(false);
      } else {
        setWrongAttempt(true);
      }
      setSelectedSquare(null);
      return;
    }
    setSelectedSquare(square);
    setWrongAttempt(false);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap gap-2 justify-center" role="tablist">
        {opening.lines.map((line, index) => (
          <button
            key={line.name}
            type="button"
            role="tab"
            aria-selected={index === lineIndex}
            onClick={() => selectLine(index)}
            style={index === lineIndex ? ACTIVE_TOGGLE_STYLE : undefined}
            className={`rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-transform hover:scale-[1.02] ${
              index === lineIndex ? 'border-transparent shadow-[3px_3px_0_rgba(0,0,0,0.35)]' : 'border-purple/40 text-lilac'
            }`}
          >
            {line.name}
          </button>
        ))}
      </div>

      <div className="w-[min(98vw,62dvh,560px)] sm:w-[min(92vw,62dvh,560px)] flex flex-col items-center gap-3">
        <ChessBoard
          fen={fen}
          boardTheme={settings.boardTheme}
          pieceStyle={settings.pieceStyle}
          orientation={protagonistColor === 'w' ? 'white' : 'black'}
          selectedSquare={selectedSquare}
          legalTargets={legalTargets}
          lastMove={lastMove}
          checkSquare={checkSquare}
          suggestedMove={wrongAttempt && expected ? { from: expected.from, to: expected.to } : null}
          interactive={isUserTurn}
          onSquareClick={handleSquareClick}
        />

        {completed ? (
          <div className="w-full rounded-xl border-2 border-gold bg-ink-soft p-4 text-center flex flex-col gap-3">
            <p className="font-semibold text-gold">Linha completa!</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <ChipButton color="pink" onClick={restartLine}>
                Praticar outra vez
              </ChipButton>
              <ChipButton color="purple" href="/aprender/aberturas">
                Voltar às aberturas
              </ChipButton>
            </div>
          </div>
        ) : (
          <div className="w-full rounded-xl border-2 border-purple/40 bg-ink-soft p-4 text-center">
            {isUserTurn ? (
              wrongAttempt ? (
                <p className="text-lilac/80">
                  Não é esse — o lance da linha era {expected!.san}. Tenta de novo.
                </p>
              ) : (
                <p className="text-lilac/80">A tua vez: encontra o lance da linha.</p>
              )
            ) : (
              <p className="text-lilac/80">A pensar…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

Decisões incorporadas:

- **Botão "Praticar outra linha" descartado** — o seletor de linhas
  (separadores) já fica sempre visível, incluindo no ecrã de conclusão;
  um botão extra que só cicla para a "próxima" linha por índice seria
  redundante com clicar diretamente no separador desejado. Simplificação
  face ao esboço apresentado no brainstorming.
- **Mensagem de lance errado é texto simples** (sem `<span>` a destacar
  o SAN à parte) — decisão de simplicidade de implementação/teste: o
  texto inteiro fica como filhos diretos do mesmo `<p>`, sem elementos
  aninhados a partir do SAN, o que também torna o texto trivialmente
  verificável num teste (`getByText` com a frase completa).
- **`legalTargets` vem de `legalTargetsFrom(fen, selectedSquare)`**
  (helper puro já existente, usado por `InteractiveDemo`) — mostra
  *todos* os lances legais da peça selecionada, não só o da linha,
  para o tabuleiro parecer um tabuleiro de xadrez real, não um puzzle
  "só esta casa está viva".
- **Tema do tabuleiro/peças vem de `useSettings()`**, tal como
  `OpeningStudy` — mesma decisão, mesmo motivo (só as demos "clássicas"
  de `/aprender` ficam no tema por omissão).
- **Sem risco de hidratação**: mesmo raciocínio do `OpeningStudy` — todo
  o estado nasce em valores fixos, a única leitura de armazenamento é
  via `useSettings()`, já seguro.

### 3. Rota `app/aprender/aberturas/[id]/praticar/page.tsx`

```tsx
import { notFound } from 'next/navigation';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { OPENINGS } from '@/lib/openings/data';
import { OpeningPractice } from '@/components/OpeningPractice/OpeningPractice';

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
      <div>
        <PageTitle>PRATICAR: {opening.name.toUpperCase()}</PageTitle>
        <p className="mt-3">
          <ChipButton color="purple" href={`/aprender/aberturas/${opening.id}`}>
            Voltar ao estudo
          </ChipButton>
        </p>
      </div>
      <OpeningPractice key={opening.id} opening={opening} />
    </main>
  );
}
```

`key={opening.id}` aplicado desde o início (não só depois de uma
descoberta de revisão, como no sub-projeto 2) — mesma razão: garante
que uma futura navegação direta entre páginas de prática de aberturas
diferentes nunca herda estado (`lineIndex`/`plyIndex`) da abertura
anterior.

### 4. `app/aprender/aberturas/[id]/page.tsx` — botão "Praticar esta abertura"

O bloco atual:

```tsx
<p className="mt-3">
  <ChipButton color="purple" href="/aprender/aberturas">
    Voltar às aberturas
  </ChipButton>
</p>
```

passa a:

```tsx
<div className="mt-3 flex flex-wrap gap-3">
  <ChipButton color="purple" href="/aprender/aberturas">
    Voltar às aberturas
  </ChipButton>
  <ChipButton color="gold" href={`/aprender/aberturas/${opening.id}/praticar`}>
    Praticar esta abertura
  </ChipButton>
</div>
```

(troca de `<p>` para `<div>` só porque agora tem dois filhos lado a
lado — `ChipButton` já é `inline-block`, mas o `flex flex-wrap gap-3`
garante o espaçamento entre os dois em vez de depender de quebra de
linha do texto.)

## Testes

`components/OpeningPractice/OpeningPractice.test.tsx` — usa dados reais
de `OPENINGS` para os casos principais (mesmo espírito de
`OpeningStudy.test.tsx`), mais uma linha sintética curta (2 lances) só
para o teste de conclusão, para não ter de escrever 9 lances à mão.
Cliques em casas via `container.querySelector('[data-square="..."]')`
+ `fireEvent.click` (mesmo padrão de `app/aprender/pecas/page.test.tsx`)
— **dois cliques por lance do utilizador** (origem, depois destino),
ao contrário de `InteractiveDemo`/`OpeningStudy`, porque aqui não há
nenhuma peça pré-selecionada. Temporizador do adversário usa
`vi.useFakeTimers()`/`vi.advanceTimersByTime(500)` dentro de `act()`,
com `afterEach(() => vi.useRealTimers())` — mesmo padrão já usado em
`ChessBoard.test.tsx` para o fade de captura.

- Abertura Italiana (`protagonistColor` brancas): renderiza com o
  tabuleiro já interativo (é a vez do utilizador); clicar e2→e4 (o 1º
  lance da linha principal) avança o estado — confirma via `lastMove`/
  mensagem "A tua vez" a desaparecer.
- Mesma abertura: clicar e2→e3 (lance legal mas errado) não avança —
  mostra "Não é esse — o lance da linha era e4. Tenta de novo.", e o
  `suggestedMove` correspondente.
- Mesma abertura: depois de e2→e4 correto, `vi.advanceTimersByTime(500)`
  faz o adversário responder e5 automaticamente — confirma via a
  mensagem "A pensar…" a desaparecer e a vez a voltar ao utilizador.
- Defesa Siciliana (`protagonistColor` pretas): no render inicial, a
  mensagem "A pensar…" aparece e o tabuleiro não está interativo (é a
  vez das brancas, o adversário); depois de `advanceTimersByTime(500)`,
  a vez passa ao utilizador (pretas) e a mensagem muda para "A tua vez".
- Linha sintética curta (`{ name: 'Linha de teste', moves: [{ san: 'e4', ... }, { san: 'e5', ... }] }`,
  passada como a única linha de uma `Opening` de teste com `id` que não
  começa por `defesa-`): completar o único lance do utilizador (e2→e4)
  e avançar o temporizador para o lance automático do adversário (e5)
  mostra "Linha completa!" com os botões "Praticar outra vez"/"Voltar
  às aberturas".
- Trocar de separador de linha (numa abertura com ≥2 linhas reais)
  reinicia `plyIndex`/`selectedSquare`/`wrongAttempt` — o tabuleiro
  volta à posição inicial e a mensagem volta a "A tua vez" ou "A
  pensar…" consoante a cor de quem começa.

## Erros e casos-limite

- **`id` desconhecido na URL** — `notFound()`, igual ao modo de estudo.
- **Clique numa casa vazia ou numa peça do adversário quando não há
  seleção** — `handleSquareClick` só entra no ramo de "tentativa" se
  `selectedSquare` já estiver definido E a casa clicada for um alvo
  legal da peça selecionada; caso contrário, o clique só (re)define
  `selectedSquare` para essa casa — mesmo comportamento que clicar
  numa casa vazia sem nada selecionado teria em `/jogar` (não crasha,
  simplesmente não há alvos legais a partir de uma casa vazia).
- **Trocar de linha ou desmontar o componente a meio de uma tentativa
  falhada** — `wrongAttempt` reinicia para `false` em `selectLine`/
  `restartLine`; o `useEffect` do adversário limpa o próprio
  `setTimeout` pendente no cleanup, por isso trocar de linha durante a
  espera pelo lance automático não deixa um `setPlyIndex` órfão a
  disparar sobre a linha errada mais tarde.
