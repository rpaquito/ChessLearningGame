# Jogo de Xadrez com Dicas de Aprendizado — Design

Data: 2026-08-16

## Objetivo

Uma web app de xadrez, em português, para jogar contra o computador ou
contra outra pessoa no mesmo dispositivo, com um "modo aprendizado"
que ajuda quem está jogando a melhorar: lances legais destacados,
peças ameaçadas, sugestão da melhor jogada, e uma avaliação rápida de
cada lance feito. Inclui também uma seção de tutorial separada com as
regras e princípios básicos de estratégia.

## Não-objetivos

- Sem contas de usuário, login ou multiplayer online (rede).
- Sem persistência além de `localStorage` (não há banco de dados).
- Sem análise profunda de partida (tipo relatório completo pós-jogo);
  a análise é lance-a-lance, leve, e opcional (modo aprendizado).

## Stack

- **Next.js (App Router) + TypeScript**, deploy no Vercel e também
  buildável como imagem Docker (`output: 'standalone'`).
- **chess.js** para regras, validação de lances e detecção de
  xeque/xeque-mate/afogamento/empate.
- **Stockfish (WASM) rodando em Web Worker** como motor da IA
  adversária e como fonte das sugestões/avaliações no modo
  aprendizado. Tudo client-side — não precisa de servidor de jogo nem
  de API própria.
- Sem backend, sem banco de dados, sem variáveis de ambiente
  obrigatórias.

## Arquitetura e componentes

### 1. `useChessGame` (hook)

Encapsula uma instância de `chess.js` e expõe:
- posição atual (FEN/PGN), histórico de lances
- de quem é a vez, status da partida (em andamento / xeque / xeque-mate
  / afogamento / empate por repetição ou material insuficiente)
- lances legais para uma casa/peça selecionada
- função `makeMove(from, to, promotion?)` que valida e aplica o lance
- persistência automática do estado em `localStorage` (chave única por
  partida em andamento), restaurada ao recarregar a página

Lógica pura, sem dependência de UI — testável isoladamente.

### 2. Worker do Stockfish (`stockfishWorker`)

Wrapper sobre `stockfish.wasm` rodando num Web Worker dedicado, com
uma API assíncrona simples:
- `getBestMove(fen, level)` → melhor lance para a IA jogar
- `evaluate(fen, depth)` → avaliação em centipawns, usada tanto para
  sugestão de jogada quanto para classificar o lance do jogador

Três níveis de dificuldade (fácil / médio / difícil) mapeados para
combinações de profundidade de busca e "Skill Level" do próprio
Stockfish. O mapeamento fica isolado numa função pura
(`difficultyToEngineOptions`) para ser testável sem subir o worker.

### 3. Tabuleiro (`ChessBoard`)

Componente de tabuleiro construído com grid + peças em SVG (sem
depender de uma lib de tabuleiro pronta, para manter controle total do
visual e dos overlays de dica). Suporta clique-clique e arrastar para
mover. Destaques via props controladas pelo hook/página:
- lances legais da peça selecionada (pontos nas casas de destino)
- último lance (casas de origem/destino sombreadas)
- casa do rei em xeque
- (modo aprendizado) peças ameaçadas — contorno vermelho
- (modo aprendizado) seta apontando a jogada sugerida pelo motor

### 4. Modo Aprendizado (toggle)

Interruptor global na tela de jogo. Quando ligado:
- ativa os destaques de ameaça e o botão "Sugerir jogada"
- após cada lance do jogador humano, compara com o melhor lance do
  motor (profundidade rasa, para não travar a UI) e mostra um selinho
  não-bloqueante: "boa jogada", "imprecisão" ou "erro", com base em
  limiares de perda de centipawns
Quando desligado, a partida roda sem nenhuma ajuda visual — xadrez
"de verdade".

### 5. Seleção de modo / setup (`/`)

Tela inicial com duas opções:
- **Jogar contra o computador**: escolher dificuldade e cor
  (brancas/pretas/aleatório)
- **Dois jogadores**: mesmo dispositivo, passa-e-joga, sem IA

### 6. Tutorial (`/aprender`)

Páginas estáticas de conteúdo (sem estado de jogo real):
- como cada peça se move (mini-tabuleiros interativos e isolados,
  reaproveitando `ChessBoard` em modo "demonstração" com posições
  fixas)
- regras especiais: roque, en passant, promoção
- fim de jogo: xeque, xeque-mate, afogamento, empates
- princípios básicos de estratégia: controle do centro,
  desenvolvimento de peças, segurança do rei, não perder material de
  graça

## Fluxo de dados

```
UI (ChessBoard, painéis) 
   ↕ ações do usuário (clique/drag)
useChessGame (estado da partida via chess.js)
   ↕ pede lance da IA / avaliação
stockfishWorker (Web Worker, stockfish.wasm)
```

A UI nunca fala diretamente com `chess.js` ou com o worker — sempre
através do hook, que é a única fonte de verdade do estado da partida.

## Tratamento de erros

- Lance ilegal tentado pelo usuário: `chess.js` rejeita, hook não
  muda de estado, UI apenas ignora/desfaz a seleção (sem crash).
- Stockfish falhar ao carregar o WASM (ex.: navegador sem suporte a
  Web Worker/WASM): modo vs. IA fica indisponível com aviso; modo
  "Dois jogadores" e o tutorial continuam funcionando normalmente
  (degradação graciosa).
- `localStorage` indisponível (modo privado, quota cheia): falha
  silenciosa — o jogo simplesmente não restaura ao recarregar, sem
  quebrar a partida em andamento.

## Testes

- Unitários (Vitest): `useChessGame` (transições de estado, detecção
  de fim de jogo, validação de lances), `difficultyToEngineOptions`,
  função de classificação de lance (boa jogada/imprecisão/erro).
- Verificação visual manual para `ChessBoard` e para as telas —
  sem testes automatizados de UI nesta primeira versão.

## Deploy

- **Vercel**: deploy direto do repo, sem configuração adicional (sem
  env vars obrigatórias).
- **Docker**: `Dockerfile` multi-stage (deps → build → runner) sobre
  `node:alpine`, usando `next.config` com `output: 'standalone'`,
  expondo a porta 3000.

## Estrutura de diretórios (alto nível)

```
app/
  page.tsx                 # tela de seleção de modo
  jogar/page.tsx           # tela de jogo (vs. IA ou 2 jogadores)
  aprender/page.tsx        # tutorial
  aprender/[topico]/...    # subpáginas do tutorial
components/
  ChessBoard/
  LearningPanel/
  ModeSelector/
lib/
  chess/useChessGame.ts
  chess/stockfishWorker.ts
  chess/difficulty.ts
  chess/moveClassification.ts
public/
  stockfish.wasm, stockfish.js
Dockerfile
next.config.ts
```

## Trabalho futuro (fora de escopo agora)

- Multiplayer online (rede)
- Relatório de análise completo de partida
- Contas de usuário / histórico de partidas salvas
- Modo aprendizado (dicas, ameaças, sugestões, avaliação de lance) disponível
  também no modo Dois jogadores — hoje é exclusivo do modo contra o
  computador, já que depende do motor Stockfish para gerar sugestões e
  avaliações; o modo Dois jogadores é "xadrez de verdade" sem nenhuma ajuda.
