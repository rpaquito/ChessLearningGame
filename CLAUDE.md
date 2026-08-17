@AGENTS.md

# Xadrez — aprenda jogando

App Next.js (App Router) de xadrez: jogar contra o Stockfish (3 níveis) ou a
dois no mesmo dispositivo, um "modo de aprendizagem" (lances legais, peças
ameaçadas, sugestão de jogada, avaliação do último lance) e um tutorial em
`/aprender`. Instalável como PWA, funciona offline. Sem backend/API routes —
tudo corre no browser.

## Estrutura

```
app/
  layout.tsx              # <html lang="pt-PT">, metadata/PWA, monta ServiceWorkerRegistration
  page.tsx                 # menu inicial: ModeSelector + link "Regras do jogo"
  jogar/page.tsx            # a partida em si — client component "grande", liga tudo
  aprender/                 # hub do tutorial + 4 subpáginas (pecas, regras-especiais,
                             # fim-de-jogo, estrategia), cada uma com demos ChessBoard
                             # não-interativos
components/
  ChessBoard/                # grelha 8x8 pura: recebe FEN + props de destaque, não
                              # sabe nada de regras — só desenha. PieceIcon.tsx desenha
                              # cada peça como SVG inline (não glifos Unicode — ver secção
                              # própria abaixo)
  LearningPanel/              # painel lateral do modo de aprendizagem (toggle, botão
                               # "sugerir jogada", badge de qualidade do lance)
  ModeSelector/                 # ecrã inicial: modo/dificuldade/cor -> navega para
                                 # /jogar com querystring
  RulesModal/                    # popup fechável com resumo das regras — usado no
                                  # menu inicial e a meio da partida, sem mexer no
                                  # estado do jogo
  ServiceWorkerRegistration.tsx   # regista public/sw.js + lógica de auto-refresh
lib/chess/
  useChessGame.ts        # estado do jogo (wrapper de chess.js), persiste o FEN em
                          # localStorage (STORAGE_KEY)
  stockfishClient.ts      # Web Worker à volta do Stockfish WASM vendorizado;
                           # getBestMove()/evaluate() baseados em Promise
  uciParser.ts              # parsing de output UCI (bestmove, score, readyok)
  difficulty.ts               # Difficulty ('facil'|'medio'|'dificil') -> EngineOptions
  moveClassification.ts        # perda de centipawns -> MoveQuality ('boa'|'imprecisao'|'erro')
  threats.ts                     # peças penduradas/ameaçadas para o modo de aprendizagem
  *.test.ts                       # cada módulo acima tem testes ao lado
public/
  sw.js            # service worker — ver secção própria abaixo
  manifest.json      # lang "pt-PT"
  stockfish/           # binário WASM vendorizado (GPLv3, não modificado — excluído do lint)
```

`app/jogar/page.tsx` é o ponto onde tudo se junta: lê `mode`/`difficulty`/`color`
da querystring, usa `useChessGame` para o estado, cria o `StockfishClient`
quando `mode === 'ai'`, e passa tudo a `ChessBoard` + `LearningPanel`. O
`ChessBoard` em si é "burro" — recebe `fen` e arrays de squares a destacar,
nunca decide regras sozinho.

## Convenções que não são óbvias a partir do código

### Idioma: português de Portugal, nunca do Brasil

Todo o texto visível ao utilizador é PT-PT. Isto foi corrigido a partir de
PT-BR numa sessão anterior — não regredir para hábitos de PT-BR ao escrever
copy nova. Regras concretas já aplicadas no código:

- Gerúndio → "a + infinitivo": "A carregar…", "A pensar…" (nunca "Carregando…")
- Posse na 2ª pessoa: "teu/tua" (nunca "seu/sua", que em PT-PT lê-se como
  3ª pessoa) — exceto quando "seu/sua" já se refere corretamente a um sujeito
  de 3ª pessoa (ex.: "quem está em xeque... no seu próximo lance" está correto)
- Instruções/dicas em infinitivo, não em imperativo "à você": "Controlar o
  centro", não "Controle o centro"
- `<html lang="pt-PT">` (`app/layout.tsx`) e `"lang": "pt-PT"`
  (`public/manifest.json`) devem manter-se assim

### Peças do tabuleiro: SVG inline, nunca glifos Unicode

`components/ChessBoard/PieceIcon.tsx` desenha cada peça como um SVG
desenhado à mão (formas simples: `rect`/`circle`/`path`/`polygon`), com
`fill="currentColor"` — a cor continua a vir só do CSS
(`text-white`/`text-black` em `ChessBoard.tsx`), tal como antes.

**Não voltar a usar caracteres Unicode de xadrez** (♔♕♖♗♘♙ / ♚♛♜♝♞♟,
U+2654-265F) — foram tentados duas vezes e falharam de duas formas
diferentes em telemóveis reais: (1) o bloco "preto" tem cobertura de fontes
inconsistente, sobretudo o peão (♟ U+265F), fazendo peças pretas parecerem
diferentes das brancas; (2) ao unificar para um só bloco, esse bloco
renderizou em modo emoji/tamanho fixo maior que a célula do tabuleiro nalgum
telemóvel, deformando a grelha inteira. Nenhum dos dois blocos Unicode é
fiável entre dispositivos — só SVG garante forma e tamanho idênticos em
qualquer browser/SO. A grelha em si também tem `grid-rows-8` explícito e
cada célula `min-h-0 min-w-0 overflow-hidden` como defesa adicional: mesmo
que algum conteúdo futuro tente ficar maior que a célula, não volta a
deformar o tabuleiro.

### O tabuleiro tem de caber sempre no ecrã visível (browser e PWA)

`ChessBoard.tsx` limita a largura a `min(92vw, 62dvh, 560px)` — por largura
**e** por altura visível, não só por largura. `app/jogar/page.tsx` usa
`min-h-dvh` + `justify-start` (não `min-h-screen`/`justify-center`): se o
conteúdo não couber, tem de dar scroll, nunca cortar simetricamente o topo e
o fundo. `dvh` acompanha a barra de endereço do browser móvel e comporta-se
bem tanto a navegar como instalado como PWA — não trocar por `vh` sozinho.

### Service worker / PWA: estratégia de cache e atualização

`public/sw.js` tem duas estratégias, por tipo de pedido:

- **network-first**: pedidos de navegação de página completa
  (`request.mode === 'navigate'`) e os pedidos internos de RSC do Next.js
  (header `RSC: 1`). Estes não podem ser cache-first — já causou uma
  regressão real (navegação interna partida, e uma correção de UI que ficava
  invisível porque a HTML antiga em cache continuava a ser servida primeiro).
- **cache-first**: tudo o resto (assets estáticos com hash, o motor
  Stockfish, ícones, manifest) — seguro porque são ficheiros com hash de
  conteúdo ou genuinamente estáticos.

`CACHE_NAME` **tem de subir de versão** sempre que a lógica de cache deste
ficheiro mudar — é o que faz o `activate` limpar a cache antiga em vez de a
reaproveitar indefinidamente.

`components/ServiceWorkerRegistration.tsx` recarrega a página sozinha quando
um novo service worker assume o controlo (`controllerchange`), e volta a
verificar por atualizações sempre que a app volta a primeiro plano
(`visibilitychange`). O estado do jogo sobrevive a esse reload porque o FEN
já está persistido em `localStorage` (`STORAGE_KEY` em `useChessGame.ts`) —
não persiste UI auxiliar (toggle do modo de aprendizagem, sugestão pendente),
o que é intencional.

### Testes

Vitest + jsdom + Testing Library, ficheiro de teste sempre ao lado do
ficheiro testado (`*.test.ts`/`*.test.tsx`). `vitest.setup.ts` regista
manualmente `afterEach(cleanup)` do `@testing-library/react` — ao contrário
do Jest, o Vitest não faz isto sozinho; sem isto, testes de componentes
"vazam" DOM de um teste para o seguinte no mesmo ficheiro.

```bash
npm run test    # vitest run
npm run lint     # eslint
npx tsc --noEmit  # typecheck (sem script próprio no package.json)
```

## Deploy

Vercel (projeto `chess-learning-game`, equipa `algorithm-cloud`) faz deploy
automático a cada push para `main` via integração com o GitHub
(`rpaquito/ChessLearningGame`) — não é preciso correr `vercel deploy` à mão.
Sem variáveis de ambiente obrigatórias. `next.config.ts` desliga
`output: "standalone"` quando `process.env.VERCEL` está definido (esse modo
é só para o self-host via Docker; conflitua com o build da própria Vercel).

## Ficheiros de contexto de agentes

`AGENTS.md` é regenerado automaticamente por `next dev`/`next build` (só o
bloco entre `<!-- BEGIN/END:nextjs-agent-rules -->` — ver
`node_modules/next/dist/server/lib/generate-agent-files.js`) — não editar à
mão, e não vale a pena documentar o projeto lá. Este ficheiro (`CLAUDE.md`)
é que é o sítio certo: só é regenerado pelo Next.js se `AGENTS.md` deixar de
existir, e está sob controlo de versão de propósito.
