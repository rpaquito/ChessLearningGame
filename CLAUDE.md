@AGENTS.md

# Xadrez — aprenda jogando

App Next.js (App Router) de xadrez: jogar contra o Stockfish (3 níveis) ou a
dois no mesmo dispositivo, um "modo de aprendizagem" (lances legais, peças
ameaçadas, sugestão de jogada, avaliação do último lance, com explicação de
lances premium) e um tutorial em `/aprender`. Instalável como PWA, funciona
offline. Sem backend/API routes próprias — tudo corre no browser, com uma
exceção: autenticação (Clerk), usada só para gate de funcionalidades premium
(ver secção própria abaixo).

## Estrutura

```
proxy.ts                   # clerkMiddleware() — só sincroniza sessão, sem auth.protect()
app/
  layout.tsx              # <html lang="pt-PT">, metadata/PWA, monta ServiceWorkerRegistration
                           # e ClerkProvider
  page.tsx                 # menu inicial: link "Entrar"/<UserButton/>, ModeSelector,
                            # link "Regras do jogo"
  entrar/[[...rest]]/page.tsx       # <SignIn/> do Clerk — catch-all: o Clerk exige
                                     # este segmento para os sub-fluxos (verificação
                                     # de email, MFA, callback OAuth)
  criar-conta/[[...rest]]/page.tsx   # <SignUp/> do Clerk — mesma razão
  jogar/page.tsx                # a partida em si — client component "grande", liga tudo
  aprender/                 # hub do tutorial + 4 subpáginas (pecas, regras-especiais,
                             # fim-de-jogo, estrategia), cada uma com demos ChessBoard
                             # não-interativos
components/
  ChessBoard/                # grelha 8x8 pura: recebe FEN + props de destaque, não
                              # sabe nada de regras — só desenha. PieceIcon.tsx desenha
                              # cada peça como SVG inline (não glifos Unicode — ver secção
                              # própria abaixo)
  LearningPanel/              # painel lateral do modo de aprendizagem (toggle, botão
                               # "sugerir jogada", badge de qualidade do lance); as
                               # frases de explicação de lances são premium — recebe
                               # isPremium como prop simples, não sabe nada de Clerk
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
  moveExplanation.ts               # frases de explicação de lances (premium) — ver
                                    # secção própria abaixo
  *.test.ts                       # cada módulo acima tem testes ao lado
lib/auth/
  isPremiumUser.ts        # lê user.publicMetadata.premium do Clerk — usada em
                          # app/jogar/page.tsx para decidir o que o LearningPanel
                          # mostra
public/
  sw.js            # service worker — ver secção própria abaixo
  manifest.json      # lang "pt-PT"
  stockfish/           # binário WASM vendorizado (GPLv3, não modificado — excluído do lint)
  board/                # texturas de madeira das casas — ver secção própria abaixo
```

`app/jogar/page.tsx` é o ponto onde tudo se junta: lê `mode`/`difficulty`/`color`
da querystring, usa `useChessGame` para o estado, cria o `StockfishClient`
quando `mode === 'ai'`, e passa tudo a `ChessBoard` + `LearningPanel`. O
`ChessBoard` em si é "burro" — recebe `fen` e arrays de squares a destacar,
nunca decide regras sozinho. Por baixo do tabuleiro há sempre uma fila com
três ações: "Menu inicial" (`next/link` para `/`), "Reiniciar partida" e
"Regras" (abre o `RulesModal`) — ao acrescentar uma nova ação de nível de
página, é aqui que ela entra.

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

### Textura das casas do tabuleiro: imagens geradas, vendorizadas

`public/board/light-square.webp` e `public/board/dark-square.webp` são
texturas de madeira (carvalho claro / nogueira escura) geradas com o
Antigravity CLI (`agy`, modelo Gemini "Nano Banana") e vendorizadas no
repositório — tal como o binário do Stockfish, não são geradas em runtime
nem pedidas a um serviço externo. `ChessBoard.tsx` aplica-as via
`backgroundImage` inline (Tailwind não referencia ficheiros de `public/`
por classe), com `background-size: cover`; as classes `bg-amber-100`/
`bg-amber-700` continuam no botão como cor de fallback caso a imagem ainda
não esteja em cache (primeira visita offline).

Se voltares a gerar estas imagens: pede explicitamente lisura/tileability
("seamless tileable"), iluminação plana sem sombras/vinheta (uma imagem com
gradiente de luz fica óbvia quando repetida por trás de casas próximas), e
depois **redimensiona e comprime antes de commitar** — os originais saem a
1024×1024 (~0.8-0.9 MB cada); `sips -Z 384` seguido de `cwebp -q 85` reduz
para ~5-12 KB sem perda visível, o que importa porque o tabuleiro nunca
mostra mais do que ~70px por casa (`min(92vw, 62dvh, 560px)` a dividir por
8 colunas).

O destaque de xeque deixou de substituir a cor da casa por
`bg-red-400` sólido (isso escondia a textura) — passou a ser uma camada
`absolute inset-0 bg-red-500/50` translúcida por cima da textura, como os
outros estados (`ring`/`outline` de último lance, seleção, ameaça,
sugestão). Peças pretas ganharam também um `drop-shadow` claro (as brancas
já tinham um escuro) — grão de madeira real tem mais variação de contraste
do que uma cor lisa, por isso as duas cores de peça precisam de contorno
para se manterem legíveis nas duas texturas.

### Autenticação e funcionalidades premium (Clerk)

Login usa o Clerk (`@clerk/nextjs`), instalado como integração nativa
do Vercel Marketplace — `CLERK_SECRET_KEY` e
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` são provisionadas automaticamente
como variáveis de ambiente do projeto na Vercel. `proxy.ts` só
mantém a sessão sincronizada (`clerkMiddleware()`, sem
`auth.protect()`) — nenhuma rota exige autenticação para ser acedida;
`/jogar`, `/aprender`, etc. continuam todas públicas.

O que é premium: as frases de explicação de lances
(`lib/chess/moveExplanation.ts`, mostradas em `LearningPanel`) — tudo o
resto do modo de aprendizagem (destaque de ameaças, sugestão de
jogada, badge de qualidade boa/imprecisão/erro) continua gratuito. A
flag vive em `user.publicMetadata.premium` (booleano) e só é editável
pela Clerk Dashboard ou por uma chamada de backend com
`CLERK_SECRET_KEY` — nunca pelo próprio utilizador — por isso
`lib/auth/isPremiumUser.ts` pode lê-la em segurança no cliente
(`app/jogar/page.tsx`, via `useUser()`) sem precisar de nenhuma API
route própria. Não há pagamentos nem base de dados ainda: ativar
premium para um utilizador é, para já, um passo manual na Clerk
Dashboard.

Importante: isto protege o *valor da flag*, não o conteúdo em si — a
frase de explicação é gerada e enviada ao browser de qualquer forma;
`isPremium` só decide se aparece ou não. Não é uma fronteira de
segurança, é só uma gate de UI — aceitável enquanto não há pagamentos
reais a proteger.

Páginas `/entrar` e `/criar-conta` (não `/sign-in`/`/sign-up`, para
consistência com as restantes rotas em português) usam os componentes
prontos do Clerk (`<SignIn/>`/`<SignUp/>`) sem lógica própria.

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

Desde a introdução do Clerk, o `proxy.ts` (`clerkMiddleware()`) intercepta
as navegações network-first antes de chegarem à app quando há rede — não
muda a estratégia acima, só se interpõe à frente dela. Os pedidos ao
Frontend API do Clerk (usado por `<SignIn/>`/`<SignUp/>`/`<UserButton/>`)
vão para um domínio externo do próprio Clerk e não passam por este service
worker nem pela sua cache — o Clerk gere o seu próprio caching/offline.

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
Vercel é o único alvo de deploy suportado: o self-host via Docker (e o
`output: "standalone"` em `next.config.ts` que existia só para isso) foi
descontinuado quando a autenticação (Clerk) foi introduzida — o Dockerfile
não tinha forma de receber as variáveis de ambiente do Clerk. As variáveis
`CLERK_SECRET_KEY`/`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` são provisionadas
automaticamente pela integração Clerk do Vercel Marketplace (ver secção
"Autenticação e funcionalidades premium" acima) — não há passo manual de
configuração de ambiente para um novo deploy, desde que essa integração
esteja instalada no projeto.

## Ficheiros de contexto de agentes

`AGENTS.md` é regenerado automaticamente por `next dev`/`next build` (só o
bloco entre `<!-- BEGIN/END:nextjs-agent-rules -->` — ver
`node_modules/next/dist/server/lib/generate-agent-files.js`) — não editar à
mão, e não vale a pena documentar o projeto lá. Este ficheiro (`CLAUDE.md`)
é que é o sítio certo: só é regenerado pelo Next.js se `AGENTS.md` deixar de
existir, e está sob controlo de versão de propósito.
