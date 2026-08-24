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
  page.tsx                 # menu inicial: três tiles ilustrados ("Jogar contra o
                            # computador", "Dois jogadores", "Opções"), links
                            # "Regras do jogo" e "Entrar"/<UserButton/>
  entrar/[[...rest]]/page.tsx       # <SignIn/> do Clerk — catch-all: o Clerk exige
                                     # este segmento para os sub-fluxos (verificação
                                     # de email, MFA, callback OAuth)
  criar-conta/[[...rest]]/page.tsx   # <SignUp/> do Clerk — mesma razão
  configurar/page.tsx            # dificuldade e cor para o modo computador, pré-
                                  # preenchidas a partir de lib/settings/ mas só
                                  # para esta partida — escolher aqui não altera as
                                  # definições por omissão, isso só acontece em /opcoes
  opcoes/page.tsx                 # dificuldade/cor por omissão (persistem de facto) e
                                  # quatro placeholders "Brevemente" para
                                  # funcionalidades futuras
  jogar/page.tsx                # a partida em si — client component "grande", liga tudo
  aprender/                 # hub do tutorial + 4 subpáginas (pecas, regras-especiais,
                             # fim-de-jogo, estrategia), cada uma com demos ChessBoard
                             # não-interativos
components/
  ChessBoard/                # grelha 8x8 pura: recebe FEN + props de destaque, não
                              # sabe nada de regras — só desenha. PieceIcon.tsx escolhe
                              # o estilo (prop `style`) e delega a forma de cada peça a
                              # pieceStyles/classico.tsx ou pieceStyles/moderno.tsx, ambos
                              # SVG inline (não glifos Unicode — ver secção própria abaixo)
  LearningPanel/              # painel lateral do modo de aprendizagem (toggle, botão
                               # "sugerir jogada", badge de qualidade do lance); as
                               # frases de explicação de lances são premium — recebe
                               # isPremium como prop simples, não sabe nada de Clerk
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
lib/settings/
  settings.ts             # Settings { defaultDifficulty, defaultColor, boardTheme,
                           # backgroundTheme }, DEFAULT_SETTINGS, loadSettings()/
                           # saveSettings() puros — chave de localStorage é uma
                           # constante interna, não exportada
  useSettings.ts          # hook fino sobre settings.ts — { settings, updateSettings }
  themes.ts                # registo único dos assets de cada tema (BOARD_THEMES,
                            # BACKGROUND_THEMES) — ver secção "Menu redesenhado" abaixo
public/
  sw.js            # service worker — ver secção própria abaixo
  manifest.json      # lang "pt-PT"
  stockfish/           # binário WASM vendorizado (GPLv3, não modificado — excluído do lint)
  board/                # texturas de madeira das casas — ver secção própria abaixo
  menu/                 # tiles ilustrados do menu (vs-cpu.webp, options.webp,
                        # background.webp) — ver secção "Menu redesenhado" abaixo
```

`app/jogar/page.tsx` é o ponto onde tudo se junta: lê `mode`/`difficulty`/`color`
da querystring, usa `useChessGame` para o estado, cria o `StockfishClient`
quando `mode === 'ai'`, e passa tudo a `ChessBoard` + `LearningPanel`. O
`ChessBoard` em si é "burro" quanto a regras de jogo — recebe `fen` e arrays
de squares a destacar, nunca decide se um lance é legal nem impede cliques.
A única exceção estreita é a animação de lances (ver secção própria abaixo):
para saber *o que* mudou entre dois FEN consecutivos, o próprio `ChessBoard`
usa o `chess.js` internamente — mas só para desenhar a transição, nunca para
validar ou vetar nada. No fundo da página (desde 2026-08-25; antes ficava
logo abaixo do tabuleiro, entalada entre este e o `LearningPanel`) há
sempre uma fila com três ações: "Menu inicial" (`next/link` para `/`),
"Reiniciar partida" e "Regras" (abre o `RulesModal`) — ao acrescentar
uma nova ação de nível de página, é aqui que ela entra. Continua irmã
direta de `<main>`, nunca dentro de um wrapper à volta do tabuleiro —
ver a nota sobre o bug de tamanho do tabuleiro mais abaixo.

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

### Animação de lances: camada de peças separada da grelha de casas

Desde 2026-08-23, as peças deslizam visualmente da casa de origem até à de
destino em vez de "saltarem" para a nova posição a cada mudança de `fen` —
em `/jogar` e em qualquer futura sequência de posições em `/aprender`
(hoje cada demo do tutorial usa um `fen` fixo que nunca muda depois de
montado, por isso não há nada visível para animar aí ainda, mas o mecanismo
já funciona para quando isso mudar).

Duas peças novas, ambas em `lib/chess/`, tal como os outros módulos puros:

- **`inferMove(prevFen, nextFen)`** — descobre que lance liga duas posições
  consecutivas, testando cada lance legal de `prevFen` até encontrar o que
  produz `nextFen` (comparando só o campo de colocação de peças do FEN).
  Devolve `{ from, to, piece, color, promotion?, capturedSquare?,
  castleRookFrom?, castleRookTo? }`, ou `null` se nenhum lance legal ligar
  as duas posições (reinício de partida, posição carregada do zero) — nesse
  caso quem chama trata como "sem animação, salta direto". Cobre captura,
  *en passant* (a casa capturada não é a casa de destino), roque dos dois
  lados (inclui o lance da torre) e promoção — tudo derivado dos métodos
  `isCapture()`/`isEnPassant()`/`isKingsideCastle()`/etc. do `Move` do
  `chess.js`, sem lógica especial por tipo de lance.
- **`ChessBoard.tsx`** deixou de desenhar a peça dentro do `<button>` de
  cada casa — as 64 casas continuam a ser botões normais (clique, destaque,
  textura), mas as peças passaram a ser uma camada `absolute inset-0
  pointer-events-none` por cima, com uma `<div>` por peça posicionada por
  percentagem (`left`/`top`, 12.5% por coluna/linha) e `transition-all
  duration-200 motion-reduce:transition-none`. Cada peça mantém uma
  identidade (`id`) estável entre posições — ao mudar `square` no estado
  interno em vez de desmontar/remontar a peça, é a mudança de `left`/`top`
  que a CSS anima, não um salto. No roque, a torre recebe a mesma
  atualização de `square` que o rei, na mesma transição. Uma peça
  capturada não desaparece logo: fica marcada `removing` (fade + encolhe,
  `duration-150`) e só sai da lista ~150ms depois — a constante
  `CAPTURE_FADE_MS` tem de bater certo com essa duração da classe Tailwind.
  `motion-reduce:` (Tailwind v4, sem configuração extra) colapsa tudo isto
  para instantâneo quando o utilizador pede menos movimento.
- Promoção é desenhada de forma simplificada: a peça que desliza já mostra
  o tipo promovido do início ao fim do movimento, em vez de trocar de ícone
  a meio do ar — mais simples, aceitável, revisitar só se ficar estranho.
- `vitest.config.ts` ganhou `resolve.alias` para `@/*` (antes só existia em
  `tsconfig.json`, que o Next.js resolve sozinho no build mas o Vitest não)
  — necessário porque `ChessBoard.tsx` importa `inferMove` via `@/lib/...`,
  e nenhum teste tinha exercitado esse alias antes.

**Descoberta durante este trabalho, não relacionada com a animação:**
`useChessGame.ts` lê `window.localStorage` diretamente dentro do
inicializador de `useState` (`useChessGame(persist = true)`), sem o mesmo
cuidado que `useSettings.ts` tem (ver secção de hidratação mais abaixo) —
como `/jogar` é renderizada no servidor a cada pedido (não é estática, mas
também não escapa a SSR só por estar atrás de `useSearchParams`/`Suspense`),
uma partida gravada de uma visita anterior causa um mismatch real de
hidratação ao recarregar a página (confirmado na consola do browser:
"A tree hydrated but some attributes of the server rendered HTML didn't
match"). Não foi corrigido aqui — pré-existia a esta sessão e é ortogonal
à animação — mas está registado no backlog para uma correção futura
(replicar o padrão "só ler localStorage num `useEffect`, depois de montar"
de `useSettings.ts`).

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

### Segundo estilo de peças: `pieceStyles/`, mesmo convénio SVG

Desde 2026-08-24, `PieceIcon.tsx` deixou de conter as formas das peças
diretamente — passou a escolher entre `pieceStyles/classico.tsx` (as
formas originais, movidas sem alteração) e `pieceStyles/moderno.tsx`
(novo), ambos exportando o mesmo `PieceShape({ type })`. A prop nova
`style?: PieceStyle` percorre a cadeia toda: `PieceIcon` → `ChessBoard`
(prop `pieceStyle`, default `'classico'`, mesmo padrão de `boardTheme`)
→ `app/jogar/page.tsx` (lê `settings.pieceStyle`). Páginas que não
passam `pieceStyle` (as demos de `/aprender`) continuam no `'classico'`
por omissão, tal como já acontecia com `boardTheme`.

`moderno` é deliberadamente angular — polígonos (hexágonos, losangos,
zigzags) em vez dos círculos e curvas Bézier do clássico — para se ler
como família visualmente distinta ao relance, não uma variação subtil;
mais visível na torre (coroa em zigzag vs. merlões retos) e no bispo
(topo em losango vs. círculo). O cavalo é literalmente a mesma forma
nos dois estilos: já era o único polígono "anguloso" do clássico, não
havia o que diferenciar sem forçar. Antes de desenhar as formas finais,
foi montada uma página HTML solta (fora do repo, só para comparação
visual lado a lado nos dois temas de tabuleiro) e inspecionada via
screenshot — vale o mesmo cuidado dado às texturas do tabuleiro: a
única forma fiável de validar um desenho geométrico é olhar para ele
renderizado, não confiar nas coordenadas de cabeça.

O seletor em `/opcoes` (`PieceStylePicker`) não reutiliza o
`ThemePicker` genérico — este espera `previewImage` como caminho de
ficheiro para `background-image`, mas as peças são SVG desenhado à
mão, não imagens em `public/`. A miniatura de cada opção renderiza o
próprio `PieceIcon` (um rei) sobre um `bg-stone-700`, em vez de uma
imagem.

### Geração de imagens: Draw Things local (substitui Antigravity/Gemini)

Desde 2026-08-23, novas imagens (texturas, tiles, arte decorativa) são
geradas com a app **Draw Things** (Mac, modelo local `z_image_turbo`)
em vez do Antigravity CLI (`agy`)/Gemini — pedido explícito do
utilizador, para não depender de quota de um serviço externo. Não há
um servidor MCP dedicado instalado neste projeto (`mcp-drawthings`
existe no npm mas não foi adicionado) — em vez disso, invoca-se
diretamente a API HTTP local que a própria app expõe, compatível com o
formato Automatic1111:

1. Abrir a app Draw Things e confirmar que a opção **HTTP API Server**
   está ativa (Definições → Advanced) — fica a ouvir em
   `http://127.0.0.1:7860`. Confirmar com `curl -s http://127.0.0.1:7860/`
   (devolve a configuração atual em JSON, incluindo o `model` carregado).
2. Gerar com `POST /sdapi/v1/txt2img`, corpo JSON com pelo menos
   `prompt`, `negative_prompt`, `width`/`height` (múltiplos de 64;
   mínimo 128), `steps`, `sampler_name` (o valor por omissão da app,
   visto no passo 1, funciona bem — ex.: `"UniPC Trailing"`) e
   `batch_size`. Resposta: `{"images": ["<base64 PNG>", ...]}` — não há
   passo de polling, o pedido bloqueia até a imagem estar pronta.
   Gerações a ~1024×768/8-10 steps no modelo `z_image_turbo` local
   demoraram 2-3 minutos nesta máquina — usar um timeout generoso
   (>=300s) ao chamar via `curl`/Bash.
3. Descodificar o base64 para PNG, inspecionar visualmente (`Read`)
   antes de aceitar — o mesmo prompt pode sair fotorrealista (errado)
   ou estilizado/"digital painting" (certo); comparar sempre contra as
   imagens já vendorizadas para manter o estilo consistente, e iterar o
   prompt se sair na estética errada (aconteceu ao gerar
   `two-players.webp`: 1ª tentativa saiu foto de tabuleiro de madeira
   realista, 2ª tentativa com prompt mais explícito sobre silhueta
   dourada/fundo escuro/bokeh acertou o estilo).
4. Dali em diante o pipeline é o mesmo de sempre:
   redimensionar (`sips -Z <tamanho>`) e comprimir (`cwebp -q 85`)
   antes de commitar — ver exemplos concretos nas secções de textura do
   tabuleiro e do menu.

### Menu redesenhado e configurações persistidas (tiles, /configurar, /opcoes)

`app/page.tsx` deixou de ser um formulário único (`ModeSelector`, removido)
— agora é um menu com três tiles ilustrados: "Jogar contra o computador"
(→ `/configurar`), "Dois jogadores" (→ direto para `/jogar?mode=local`,
sem ecrã intermédio — não há nada para configurar nesse modo), e
"Opções" (→ `/opcoes`). "Ver tutorial" e "Regras do jogo" mantêm-se como
links secundários mais pequenos.

`/configurar` mostra dificuldade e cor pré-preenchidas a partir das
Definições guardadas, mas escolher aqui é só para esta partida —
**não** altera as Definições por omissão (isso só acontece em
`/opcoes`, que grava de facto a cada alteração, sem botão "Guardar").
Este é o ponto central da divisão entre `components/GameSetup/
GameSetup.tsx` (lê `useSettings()`, nunca chama `updateSettings`) e
`app/opcoes/page.tsx` (chama `updateSettings` a cada clique).

O estado persistido — `Settings { defaultDifficulty, defaultColor,
boardTheme, backgroundTheme }`, `DEFAULT_SETTINGS`,
`loadSettings()`/`saveSettings()` — vive em `lib/settings/settings.ts`,
com `lib/settings/useSettings.ts` como wrapper fino em hook. Espelha o
padrão exato de `useChessGame.ts` (`useState(() => loadSettings())`,
sem `useEffect`) **só que este padrão não é seguro aqui** — ver a nota
sobre hidratação abaixo.

`boardTheme` (`'carvalho' | 'ebano-bordo'`) e `backgroundTheme`
(`'classico' | 'noturno'`) são escolhidos em `/opcoes` e lidos em dois
sítios: `ChessBoard` aplica a textura das casas via a sua prop
`boardTheme`, e `app/jogar/page.tsx` desenha o fundo como uma camada
`fixed inset-0 -z-10` (fora do fluxo, `aria-hidden`) para não poder
interferir com a restrição "o tabuleiro tem de caber no ecrã" abaixo —
`main` ganha `relative` só como âncora de posicionamento, não muda o
seu próprio layout. O registo único dos assets de cada tema —
etiquetas e caminhos de imagem, para não escrever caminhos de ficheiro
espalhados pela app — vive em `lib/settings/themes.ts`
(`BOARD_THEMES`, `BACKGROUND_THEMES`), lido por `ChessBoard.tsx`,
`app/page.tsx` (fundo do menu), `app/jogar/page.tsx` e
`app/opcoes/page.tsx` (os seletores).

As imagens dos tiles (`public/menu/vs-cpu.webp`, `public/menu/
options.webp`, `public/menu/two-players.webp`) e o fundo do menu
(`public/menu/background.webp`) seguem o mesmo pipeline de
redimensionamento/compressão (`sips -Z 800` para os tiles, `-Z 1200`
para o fundo, depois `cwebp -q 85` — dois comandos separados, não um
pipe). As três primeiras foram geradas com o Antigravity CLI (`agy`,
Gemini "Nano Banana"); `two-players.webp` foi gerada depois (2026-08-23)
com o Draw Things local — ver secção "Geração de imagens" abaixo — para
igualar o estilo "premium chess club" (fundo escuro, rim light dourado,
bokeh subtil) das outras três. As quatro tiles/fundo do menu estão
completas, nada pendente aqui.

Dos quatro espaços originalmente reservados em `/opcoes`, três já têm
seletores reais: tema do tabuleiro e imagem de fundo usam `ThemePicker`
(miniaturas clicáveis lidas de `lib/settings/themes.ts`); estilo das
peças usa `PieceStylePicker`, próprio (ver secção "Segundo estilo de
peças" acima — as peças são SVG desenhado à mão, não imagens, por isso
não cabem no `ThemePicker` genérico). Só "Idioma" continua como
"Brevemente" (`ComingSoonSection`, `opacity-50` + `aria-disabled="true"`)
— um sub-projeto futuro (i18n completo), não um bug.

**Hidratação:** ao contrário de `useChessGame` (cuja página `/jogar`
nunca é pré-renderizada, por estar atrás de `useSearchParams` dentro de
`<Suspense>`), `/configurar` e `/opcoes` são páginas normais,
pré-renderizadas no servidor. Ler `localStorage` diretamente no
inicializador de `useState` nestas páginas produziria HTML do servidor
com `DEFAULT_SETTINGS` e HTML do cliente com o valor real guardado —
um erro de hidratação sempre que o utilizador já tiver definições não-
-padrão guardadas. `useSettings` evita isto lendo `DEFAULT_SETTINGS` no
render inicial (igual em servidor e cliente) e só lendo o
`localStorage` real dentro de um `useEffect`, depois de montar.

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

`ChessBoard.tsx` limita a largura a `w-full max-w-[min(92vw, 62dvh, 560px)]`
(mobile, abaixo de `sm:`, usa `98vw` em vez de `92vw` — ver secção seguinte)
— por largura **e** por altura visível, não só por largura. `app/jogar/
page.tsx` usa `min-h-dvh` + `justify-start` (não `min-h-screen`/
`justify-center`): se o conteúdo não couber, tem de dar scroll, nunca cortar
simetricamente o topo e o fundo. `dvh` acompanha a barra de endereço do
browser móvel e comporta-se bem tanto a navegar como instalado como PWA —
não trocar por `vh` sozinho.

### Bug descoberto 2026-08-25: o tabuleiro nunca chegava perto do seu
### próprio limite de tamanho, em `/jogar` e em `/aprender`

`max-w-[min(...)]` só funciona se o `w-full` do tabuleiro conseguir
resolver-se contra uma largura **definida** do pai. Em `/jogar`, o
tabuleiro está dentro de um `<div className="flex flex-col items-center
...">`, ele próprio filho direto de `<main>` (também `flex`, com
`items-center` em mobile e `flex-row` a partir de `md:`) — um item flex
sem `width` próprio, cujo cross-size (mobile, coluna, `items-center`) ou
main-size (desktop, linha, `flex-basis: auto`) nenhum dos dois é
"stretch para o espaço disponível": o browser calcula o tamanho do item
via *shrink-to-fit*/`max-content`, e nesse cálculo uma percentagem (o
`width: 100%` do tabuleiro) contra um contentor ainda sem largura
definida conta como `auto` — cai para o tamanho intrínseco do conteúdo
da grelha (peças/células), não para os 92vw/560px pretendidos. O
resultado: o tabuleiro renderizava a uma fração do tamanho documentado
(confirmado com `getBoundingClientRect()`: ~250px em vez de ~560px em
desktop, ~110px em mobile depois de mexer na estrutura à volta) — um
bug que já existia em produção antes desta sessão, não só nas mudanças
de layout feitas aqui, e que também afeta as demos de `/aprender`
(idêntico padrão `flex ... items-center` a envolver `<ChessBoard/>`
diretamente) — não corrigido aí, por ficar fora do âmbito pedido.

A correção em `/jogar`: o `<div>` que envolve o tabuleiro (estado +
`ChessBoard`) ganhou a **mesma fórmula** `w-[min(98vw,62dvh,560px)]
sm:w-[min(92vw,62dvh,560px)]` do próprio `ChessBoard.tsx` — um `width`
definido (não percentagem), resolve-se sozinho contra o viewport sem
depender de nenhum pai, o que dá ao `w-full` do tabuleiro lá dentro uma
base definida para resolver corretamente. Testado com
`getBoundingClientRect()` via Chrome DevTools MCP, não só visualmente:
confirmar sempre o tamanho real em pixels ao mexer nesta cadeia, não
só "parece bem no screenshot" — um colapso de ~50% pode passar
despercebido a olho nu num ecrã pequeno. `md:w-auto` ou `md:flex-1`
foram tentados e descartados: o primeiro reproduz o mesmo colapso em
desktop (linha, `flex-basis:auto` tem o mesmo problema que
`items-center` em coluna); o segundo corrige o tamanho mas faz o
tabuleiro crescer para preencher todo o espaço da linha, empurrando o
`LearningPanel` para a margem direita em vez de ficarem juntos e
centrados como grupo.

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
