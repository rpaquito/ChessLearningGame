# Treinador de aberturas — Modo de estudo — Design

Data: 2026-08-26

## Objetivo

Segundo dos três sub-projetos do "treinador de aberturas" (ver
`docs/superpowers/specs/2026-08-26-opening-trainer-data-design.md`,
sub-projeto 1, já mesclado em `main`). Constrói a UI de navegação/estudo
das 12 aberturas: uma página de lista (`/aprender/aberturas`) e uma página
por abertura (`/aprender/aberturas/[id]`) onde o utilizador escolhe uma
linha (principal ou variação) e avança/recua lance a lance, vendo o
tabuleiro e a explicação de cada lance. Confirma a navegação já combinada
no brainstorming do sub-projeto 1: `Menu → Aprender a jogar → Aberturas →
<abertura> → percorrer linhas`.

## Não-objetivos

- **Sem modo de prática.** O botão "Praticar esta abertura" não é
  construído aqui — fica para o sub-projeto 3, que decide o próprio design
  quando existir.
- **Sem lista de lances clicável.** Navegação é só por botões "Anterior"/
  "Seguinte" — decisão explícita do brainstorming, mais simples do que um
  visualizador de PGN com saltos arbitrários.
- **Sem tabuleiro clicável.** O tabuleiro em modo de estudo não aceita
  cliques do utilizador (ao contrário de `InteractiveDemo`) — quem manda é
  sempre "Anterior"/"Seguinte".
- **Sem persistência do progresso de estudo.** Trocar de linha ou sair da
  página e voltar reinicia sempre no lance 0 — não há `localStorage`
  equivalente ao `STORAGE_KEY` de `useChessGame`.

## Arquitetura e componentes

### 1. Rotas — `app/aprender/aberturas/`

```
app/aprender/aberturas/
  page.tsx        # lista das 12 aberturas
  [id]/page.tsx    # página de estudo de uma abertura
```

**`page.tsx`** — componente de servidor, mesmo padrão do hub `/aprender`
(`app/aprender/page.tsx`), mas os itens vêm de `OPENINGS`
(`lib/openings/data.ts`) em vez de uma lista `TOPICS` fixa:

```tsx
import Link from 'next/link';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { OPENINGS } from '@/lib/openings/data';

export default function AberturasPage() {
  return (
    <main className="relative min-h-screen max-w-2xl mx-auto p-8 flex flex-col gap-6 overflow-hidden bg-ink">
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <div>
        <PageTitle>ABERTURAS</PageTitle>
        <p className="mt-3">
          <ChipButton color="purple" href="/aprender">
            Voltar ao tutorial
          </ChipButton>
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {OPENINGS.map((opening) => (
          <li key={opening.id}>
            <Link
              href={`/aprender/aberturas/${opening.id}`}
              className="block rounded-xl border-2 border-purple/40 bg-ink-soft p-4 transition-colors hover:border-cyan"
            >
              <p className="font-semibold text-white">{opening.name}</p>
              <p className="text-sm text-lilac/80">{opening.description}</p>
              <p className="text-xs text-lilac/60 mt-1">
                {opening.lines.map((line) => line.name).join(' · ')}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

**`[id]/page.tsx`** — componente de servidor, `generateStaticParams` a
partir de `OPENINGS` (todos os 12 `id` são conhecidos em build time, sem
`fetch`, sem API dinâmica — o caso simples da documentação vendorizada
desta versão do Next.js, `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md`,
não precisa de `<Suspense>`). `notFound()` para um `id` desconhecido —
único jeito de lá chegar é editar a URL à mão, já que `page.tsx` só gera
links para `id`s reais.

```tsx
import { notFound } from 'next/navigation';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { OPENINGS } from '@/lib/openings/data';
import { OpeningStudy } from '@/components/OpeningStudy/OpeningStudy';

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
      <div>
        <PageTitle>{opening.name.toUpperCase()}</PageTitle>
        <p className="mt-2 text-lilac/80">{opening.description}</p>
        <p className="mt-3">
          <ChipButton color="purple" href="/aprender/aberturas">
            Voltar às aberturas
          </ChipButton>
        </p>
      </div>
      <OpeningStudy opening={opening} />
    </main>
  );
}
```

Nenhum dos dois ficheiros ganha teste dedicado — mesmo padrão já existente
para `app/aprender/page.tsx` e `app/page.tsx` (menu inicial): páginas de
servidor "finas", só composição, sem lógica própria para testar. Toda a
cobertura de teste real fica em `OpeningStudy.test.tsx` (ver Testes).

### 2. `components/OpeningStudy/OpeningStudy.tsx` — o núcleo interativo

```tsx
'use client';

import { useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { ACTIVE_TOGGLE_STYLE } from '@/lib/ui/activeToggleStyle';
import { useSettings } from '@/lib/settings/useSettings';
import { replayLine, type ReplayedMove } from '@/lib/openings/replayLine';
import { checkedKingSquare } from '@/lib/chess/legalMoves';
import type { Opening } from '@/lib/openings/types';

const START_FEN = new Chess().fen();

/** "1." para o 1º lance (brancas), "1..." para o 2º (pretas), etc. — as
 * linhas de abertura começam sempre pelas brancas, por isso a paridade do
 * índice (1-based) chega para decidir. */
function moveLabel(stepIndex: number): string {
  const fullmove = Math.ceil(stepIndex / 2);
  return stepIndex % 2 === 1 ? `${fullmove}.` : `${fullmove}...`;
}

export function OpeningStudy({ opening }: { opening: Opening }) {
  const { settings } = useSettings();
  const replayedLines = useMemo(() => opening.lines.map((line) => replayLine(line)), [opening]);
  const [lineIndex, setLineIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  const replayed = replayedLines[lineIndex];
  const current: ReplayedMove | null = stepIndex === 0 ? null : replayed[stepIndex - 1];
  const fen = current?.fen ?? START_FEN;
  const lastMove = current ? { from: current.from, to: current.to } : null;
  const checkSquare = checkedKingSquare(fen);

  function selectLine(index: number) {
    setLineIndex(index);
    setStepIndex(0);
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
          lastMove={lastMove}
          checkSquare={checkSquare}
        />

        <div className="flex items-center gap-3">
          <ChipButton color="pink" onClick={() => setStepIndex((s) => Math.max(0, s - 1))} disabled={stepIndex === 0}>
            Anterior
          </ChipButton>
          <span className="text-sm text-lilac/80">
            {stepIndex} / {replayed.length}
          </span>
          <ChipButton
            color="cyan"
            onClick={() => setStepIndex((s) => Math.min(replayed.length, s + 1))}
            disabled={stepIndex === replayed.length}
          >
            Seguinte
          </ChipButton>
        </div>

        <div className="w-full rounded-xl border-2 border-purple/40 bg-ink-soft p-4 text-center">
          {current ? (
            <>
              <p className="font-semibold text-cyan">
                {moveLabel(stepIndex)} {current.san}
              </p>
              <p className="text-lilac/80 mt-1">{current.explanation}</p>
            </>
          ) : (
            <p className="text-lilac/80">Posição inicial — carrega em &quot;Seguinte&quot; para começar.</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

Decisões incorporadas neste componente:

- **Os separadores de linha não usam `ChipButton`** — `CLAUDE.md` já
  documenta porquê: grupos de seleção com estado "ativo/inativo" (
  dificuldade/cor em `GameSetup`/`/opções`) usam botões próprios com
  `aria-pressed`/`ACTIVE_TOGGLE_STYLE`, não `ChipButton` (que não tem
  noção de estado ativo). Este componente segue exatamente esse padrão —
  reutiliza `ACTIVE_TOGGLE_STYLE` (`lib/ui/activeToggleStyle.ts`), que já
  tem 3 consumidores; este é o 4º. Uso de `role="tablist"`/`role="tab"`/
  `aria-selected` em vez de `aria-pressed`: mais correto semanticamente
  aqui porque exatamente uma linha está sempre selecionada (like tabs),
  ao contrário de dificuldade/cor onde `aria-pressed` marca cada opção
  independentemente.
- **`ChipButton` ganha uma prop `disabled?: boolean` nova** (pequena
  adição ao componente partilhado, não um componente novo) — sem isto,
  "Anterior" no lance 0 ou "Seguinte" no último lance ficam clicáveis sem
  efeito visual nenhum de que estão no limite. Ver ponto 3 abaixo.
- **`replayLine` é chamado uma vez por linha, memorizado por `opening`**
  (não recalculado a cada troca de linha nem a cada lance) — o cálculo é
  barato (≤11 lances), mas não há razão para o repetir a cada render.
- Tema do tabuleiro/peças vem de `useSettings()` — ver decisão do
  brainstorming: ao contrário das outras demos de `/aprender`, este
  ecrã usa o tema real do utilizador, tal como `/jogar`. `useSettings`
  já é seguro para hidratação (`useSyncExternalStore`, ver `CLAUDE.md`).
- **Sem risco de hidratação novo**: `OpeningStudy` não lê `localStorage`
  diretamente nem em `useState` nem em `useEffect` — todo o estado
  (`lineIndex`, `stepIndex`) nasce em valores fixos (`0`), iguais em
  servidor e cliente. A única leitura de armazenamento é via
  `useSettings()`, que já trata disso por conta própria.

### 3. `components/ChipButton/ChipButton.tsx` — prop `disabled` nova

```tsx
export interface ChipButtonProps {
  color: ChipColor;
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function ChipButton({ color, children, href, onClick, disabled = false, className = '' }: ChipButtonProps) {
  const style = { background: CHIP_GRADIENT[color], color: CHIP_TEXT[color] };
  const disabledClasses = disabled ? 'opacity-40 pointer-events-none' : '';
  const classes = `${BASE_CLASS} ${disabledClasses} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} style={style} className={classes} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} style={style} className={classes}>
      {children}
    </button>
  );
}
```

`disabled` é opcional com omissão `false` — todos os usos existentes de
`ChipButton` (menu, `/jogar`, `RulesModal`, etc.) continuam
bit-a-bit iguais sem passar a prop nova. `pointer-events-none` cobre o
caso `href` (um `<Link>` não tem `disabled` nativo do HTML); a classe
`opacity-40` dá a pista visual em ambos os casos. `hover:scale-[1.03]`
de `BASE_CLASS` continua a aplicar-se num `<Link>` desativado por CSS —
inofensivo (só um efeito visual sem clique nenhum por trás), não vale a
pena complicar `BASE_CLASS` por essa exceção.

## Testes

`components/OpeningStudy/OpeningStudy.test.tsx` — usa uma abertura real de
`OPENINGS` (não uma fixture inventada, mesmo espírito de
`replayLine.test.ts`), com `fireEvent` (nunca `.click()` cru — ver a
armadilha já documentada em `CLAUDE.md` para cliques que mudam estado):

- Estado inicial: mostra "Posição inicial…", `stepIndex` 0/N, "Anterior"
  desativado.
- Clicar "Seguinte" avança um lance: mostra o `san`/explicação certos do
  1º lance da linha principal, `lastMove` reflete-se no tabuleiro (via
  prop `lastMove` do `ChessBoard`, que já tem os seus próprios testes —
  aqui só confirma que `OpeningStudy` lhe passa o valor certo).
  Testa o rótulo de lance (`moveLabel`): "1." no 1º lance, "1..." no 2º.
- Clicar "Seguinte" repetidamente até ao fim da linha desativa "Seguinte"
  e não avança mais (clique extra é no-op, `stepIndex` não ultrapassa
  `replayed.length`).
- Clicar "Anterior" a partir de meio da linha recua um lance.
- Trocar de separador de linha (para uma abertura com ≥2 linhas — todas
  as 12 têm) reinicia `stepIndex` para 0 e muda o `san`/explicação do 1º
  lance ao avançar, confirmando que a linha nova (não a antiga) está
  ativa.

`components/ChipButton/ChipButton.test.tsx` — um caso novo: `disabled`
impede o `onClick` (o botão) e aplica a classe `opacity-40` (link e
botão); sem `disabled`, o comportamento atual continua idêntico (teste de
regressão implícito, os casos já existentes continuam a passar
inalterados).

## Erros e casos-limite

- **`id` desconhecido na URL** — `notFound()` renderiza a página 404
  standard do Next.js; não há UI própria de erro para escrever aqui.
- **Abertura com só 1 linha** — não acontece com o conteúdo atual (mínimo
  2 linhas por abertura), mas o componente já suporta o caso
  trivialmente: 1 separador sempre ativo, sem problema de estado.
- **`stepIndex` fora dos limites** — impossível de alcançar por UI (os
  dois `ChipButton`s usam `Math.max`/`Math.min` no próprio `setStepIndex`,
  e ficam `disabled` nos limites), mas mesmo que `stepIndex` chegasse a
  `replayed.length + 1` por algum bug futuro, `replayed[stepIndex - 1]`
  seria `undefined` e `current?.fen` cairia em `START_FEN` — falha
  "suave" (tabuleiro volta ao início), não um crash.
