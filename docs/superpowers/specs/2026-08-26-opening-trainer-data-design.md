# Treinador de aberturas — Modelo de dados e conteúdo — Design

Data: 2026-08-26

## Objetivo

Primeiro dos três sub-projetos do "treinador de aberturas" (ver
`MEMORY.md`/backlog do projeto): um conjunto de aberturas de xadrez
ECO-codificadas, escritas à mão em português de Portugal, com
explicação lance a lance — a base de dados de que os outros dois
sub-projetos (modo de estudo, modo de prática) vão depender. Este
design cobre **só** o modelo de dados, o conteúdo e um helper puro de
reprodução de linha — sem nenhuma página nova nem componente de UI.

## Não-objetivos

- **Sem UI.** Nem a página `/aprender/aberturas` (lista), nem
  `/aprender/aberturas/[id]` (modo de estudo), nem o botão "Praticar
  esta abertura" (modo de prática) são construídos aqui — ficam para
  os dois sub-projetos seguintes, cada um com o próprio design.
- **Sem árvore de variações.** Cada linha (principal ou variação) é uma
  sequência independente e completa desde o lance 1, não um ramo que
  parte de um ponto da linha principal — decisão já tomada no
  brainstorming: mais simples de tratar (nenhuma lógica de árvore),
  com alguma duplicação de texto nos lances iniciais partilhados.
- **Sem importação automática de uma base ECO externa.** As 12
  aberturas e as suas linhas são escolhidas e escritas à mão nesta
  sessão — não há parsing de PGN nem scraping de uma base de dados.
- **Códigos ECO são metadados informativos, não validados.** Servem só
  de referência (mostrados eventualmente numa UI futura); não há lógica
  nenhuma que dependa do valor estar correto ao dígito.

## Contexto: onde isto vai aparecer (confirmado, fora do âmbito desta entrega)

Confirmado no brainstorming, para as `id` das aberturas já nascerem
estáveis: `Menu → Aprender a jogar → Aberturas → <abertura> → (percorrer
linhas) / botão "Praticar esta abertura"`. Ou seja, um 6º item na lista
`TOPICS` de `app/aprender/page.tsx` ("Aberturas" → `/aprender/aberturas`),
uma página de estudo por abertura, e o modo de prática a arrancar a
partir de `/jogar` já posicionado na linha escolhida.

## Arquitetura e componentes

### 1. `lib/openings/types.ts`

```ts
export interface OpeningMove {
  san: string;          // "Nf3" — notação algébrica standard
  explanation: string;  // frase em PT-PT, escrita à mão
}

export interface OpeningLine {
  name: string;    // "Najdorf"
  eco?: string;     // "B90" — informativo, não validado
  moves: OpeningMove[];
}

export interface Opening {
  id: string;              // slug kebab-case, estável — "defesa-siciliana"
  name: string;             // "Defesa Siciliana"
  description: string;      // 1-2 frases, para a futura lista/hub
  lines: OpeningLine[];      // linha principal + 1-2 variações nomeadas
}
```

### 2. `lib/openings/data.ts`

Módulo puro exportando `export const OPENINGS: Opening[]` — as 12
aberturas abaixo, cada uma com a linha principal e 1-2 variações,
~8-12 meios-lances por linha, cada lance com a sua explicação em PT-PT
(estilo "livro de aberturas", não geradas por regra — ver decisão do
brainstorming). Nenhuma lógica neste ficheiro, só dados.

### 3. `lib/openings/replayLine.ts`

```ts
export interface ReplayedMove {
  fen: string;              // posição depois deste lance
  from: Square;
  to: Square;
  promotion?: string;
  san: string;
  explanation: string;
}

export function replayLine(line: OpeningLine): ReplayedMove[];
```

Usa `chess.js` para jogar cada `san` da linha, a partir da posição
inicial, e devolve uma entrada por lance com o FEN resultante mais os
campos de que o modo de estudo (desenhar o tabuleiro + mostrar a
explicação) e o modo de prática (comparar o lance do utilizador com o
`{from,to,promotion}` esperado) vão precisar — sem qualquer um dos dois
terem de reimplementar a reprodução da linha. Lança um erro descritivo
se algum `san` for ilegal na posição em que é jogado (nunca deve
acontecer em produção — ver Testes).

## Conteúdo: as 12 aberturas

Nomes e códigos ECO em português de Portugal / notação standard;
código ECO por linha é aproximado, a afinar durante a escrita do
conteúdo se necessário — não bloqueia nada.

1. **Abertura Italiana** — Linha principal (Giuoco Piano, C50); Gambito
   Evans (C51)
2. **Abertura Espanhola** (Ruy López) — Linha principal, Variante
   Fechada (C84); Variante Berlinense (C65)
3. **Defesa Siciliana** — Linha principal, Aberta (B50); Najdorf (B90);
   Dragão (B70)
4. **Defesa Francesa** — Linha principal, Variante de Troca (C01);
   Variante do Avanço (C02)
5. **Defesa Caro-Kann** — Linha principal (B12); Variante Clássica
   (B18)
6. **Gambito da Dama** — Aceite (D20); Recusado (D30)
7. **Defesa Eslava** — Linha principal (D10); Variante Semi-Eslava
   (D43)
8. **Abertura Inglesa** — Linha principal, Simétrica (A30); Quatro
   Cavalos (A28)
9. **Defesa Pirc** — Linha principal (B07); Variante Clássica (B08)
10. **Abertura Escocesa** — Linha principal (C44); Gambito Göring
    (C44)
11. **Defesa Escandinava** — Linha principal, `2...Qxd5` (B01);
    Variante Moderna, `2...Nf6` (B01)
12. **Sistema Londres** — Linha principal (D02); contra a Defesa
    Eslava (D02)

Total aproximado: 12 aberturas × ~2.3 linhas × ~9 lances ≈ **~250
explicações a escrever à mão** — o grosso do esforço real desta
entrega, não o código.

## Testes

- `lib/openings/replayLine.test.ts` — para **cada linha de cada
  abertura em `OPENINGS`**, chama `replayLine()` e confirma que não
  lança erro e que devolve uma entrada por lance da linha. Esta é, na
  prática, a validação do conteúdo: um `san` mal escrito ou uma
  sequência ilegal falha aqui como um teste normal, não como um bug
  silencioso descoberto só quando a UI futura tentar desenhar a
  posição.
- Um teste adicional, pequeno: todos os `id` em `OPENINGS` são únicos e
  em kebab-case — protege a estabilidade das rotas futuras
  (`/aprender/aberturas/[id]`) desde já, mesmo sem essas rotas
  existirem ainda.

## Erros e casos-limite

- **Lance ilegal no conteúdo** — coberto pelo teste de `replayLine`
  acima; em produção, `replayLine` lançar um erro é um sinal de dados
  corrompidos, não algo para que os consumidores futuros (estudo/
  prática) precisem de ter um caminho de recuperação silencioso.
- **Idioma:** todas as explicações e nomes seguem as convenções PT-PT
  já documentadas em `CLAUDE.md` (gerúndio → "a + infinitivo",
  "teu/tua", instruções em infinitivo) — mesmo cuidado que
  `moveExplanation.ts` já tem.
