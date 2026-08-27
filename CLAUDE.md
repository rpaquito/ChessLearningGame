@AGENTS.md

# Xadrez — aprenda jogando

App Next.js (App Router) de xadrez: jogar contra o Stockfish (3 níveis) ou a
dois no mesmo dispositivo, um "modo de aprendizagem" (lances legais, peças
ameaçadas, sugestão de jogada, avaliação do último lance, com explicação de
lances) e um tutorial em `/aprender`. Instalável como PWA, funciona offline.
Sem backend/API routes próprias nem autenticação — tudo corre no browser.

## Estrutura

```
app/
  layout.tsx              # <html lang="pt-PT">, metadata/PWA, monta ServiceWorkerRegistration
  page.tsx                 # menu inicial: três tiles ilustrados ("Jogar contra o
                            # computador", "Dois jogadores", "Opções"), link
                            # "Regras do jogo"
  configurar/page.tsx            # dificuldade e cor para o modo computador, pré-
                                  # preenchidas a partir de lib/settings/ mas só
                                  # para esta partida — escolher aqui não altera as
                                  # definições por omissão, isso só acontece em /opcoes
  opcoes/page.tsx                 # dificuldade/cor por omissão (persistem de facto),
                                  # temas de tabuleiro/fundo/peças, e um placeholder
                                  # "Brevemente" (Idioma) para uma funcionalidade futura
  jogar/page.tsx                # a partida em si — client component "grande", liga tudo
  aprender/                 # hub do tutorial + 4 subpáginas (pecas, regras-especiais,
                             # fim-de-jogo, estrategia). Só /aprender/pecas é jogável —
                             # as outras três continuam com demos ChessBoard fixos,
                             # não-interativos (ver secção "Demo jogável" abaixo)
components/
  ChessBoard/                # grelha 8x8 pura: recebe FEN + props de destaque, não
                              # sabe nada de regras — só desenha. PieceIcon.tsx escolhe
                              # o estilo (prop `style`) e delega a forma de cada peça a
                              # pieceStyles/classico.tsx, moderno.tsx ou anime.tsx, todos
                              # SVG inline (não glifos Unicode — ver secção própria abaixo)
  ChipButton/                 # chip de ação com corte diagonal — substitui texto
                               # sublinhado para qualquer link/ação secundária da app,
                               # ver secção "Identidade visual anime" abaixo
  GameSetup/                    # dificuldade/cor da partida em /configurar — lê
                                 # useSettings() mas nunca chama updateSettings
  LearningPanel/              # painel lateral do modo de aprendizagem (toggle, botão
                               # "sugerir jogada", badge de qualidade do lance, frases
                               # de explicação de lances — tudo gratuito)
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
  moveExplanation.ts               # frases de explicação de lances — ver secção
                                    # própria abaixo
  *.test.ts                       # cada módulo acima tem testes ao lado
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
  board/                # texturas das casas (cor flat + grão) — ver secção própria abaixo
  menu/                 # tiles ilustrados do menu e fundos, estilo anime — ver secção
                        # "Menu redesenhado" abaixo
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
sempre uma fila com três `ChipButton` (ver secção "Identidade visual
anime" abaixo): "Menu inicial" (para `/`), "Reiniciar partida" e
"Regras" (abre o `RulesModal`) — ao acrescentar uma nova ação de nível
de página, é aqui que ela entra. Continua irmã direta de `<main>`,
nunca dentro de um wrapper à volta do tabuleiro — ver a nota sobre o
bug de tamanho do tabuleiro mais abaixo.

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
em `/jogar` e em `/aprender/pecas` (ver secção "Demo jogável" abaixo; as
outras três subpáginas de `/aprender` continuam com um `fen` fixo que
nunca muda depois de montado, por isso não há nada visível para animar aí
ainda, mas o mecanismo já funciona para quando isso mudar).

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
  duration-400 motion-reduce:transition-none` (400ms — era 200ms até
  2026-08-26, aumentado a pedido explícito do utilizador, "mais lento").
  Cada peça mantém uma
  identidade (`id`) estável entre posições — ao mudar `square` no estado
  interno em vez de desmontar/remontar a peça, é a mudança de `left`/`top`
  que a CSS anima, não um salto. No roque, a torre recebe a mesma
  atualização de `square` que o rei, na mesma transição. Uma peça
  capturada não desaparece logo: fica marcada `removing` (fade + encolhe,
  `duration-300`, também aumentada nesse pedido — era `duration-150`) e
  só sai da lista ~300ms depois — a constante `CAPTURE_FADE_MS` tem de
  bater certo com essa duração da classe Tailwind, nos dois sítios ao
  mesmo tempo se voltares a afinar a velocidade.
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

### `/aprender/pecas`: demo jogável, não é uma partida real

Desde 2026-08-26 (a pedido do utilizador — "gostava que o tutorial fosse
jogável"), as seis demos de `/aprender/pecas` deixaram de ter um `fen`
fixo — cada `InteractiveDemo` (função interna de `page.tsx`, uma por
peça) mantém o próprio `useState` (`fen`, `square` da peça em destaque,
`lastMove`) e aceita cliques como o `ChessBoard` de `/jogar`: clicar num
alvo destacado a verde move a peça, os alvos legais recalculam a partir
da nova casa, e a animação de deslize (ver secção "Animação de lances"
acima) funciona de graça — o mecanismo já existia, só nunca tinha uma
demo com `fen` a mudar para o exercitar. Um botão "Reiniciar"
(`ChipButton` cor `pink`) por demo volta à posição inicial.

**Não é uma partida a duas** — só a peça branca em destaque de cada demo
se move; o rei preto (e, na demo do peão, também o peão preto) são só
alvos/props fixos, nunca jogam. As outras três subpáginas (regras-
-especiais, fim-de-jogo, estratégia) continuam com demos fixas,
não-interativas — ficou fora do pedido, que era só "o tutorial" no
sentido do hub de movimento das peças.

**Armadilha não óbvia, já apanhada por um teste:** depois de
`chess.move()`, o campo de "vez de jogar" do FEN passa para `"b"` — é o
comportamento normal do `chess.js` para uma partida a duas. Mas aqui não
há segundo jogador: sem corrigir isto, `chess.moves({ square })` no
próximo clique devolve sempre `[]` (chess.js só calcula lances para quem
tem a vez), travando a demo permanentemente ao fim do primeiro lance.
`forceWhiteToMove()` em `page.tsx` corrige o FEN manualmente a seguir a
cada lance (campo de vez para `"w"`, en passant para `"-"`) — assume que
a peça em destaque é sempre branca, o que é verdade nas seis demos
atuais mas quebraria silenciosamente se alguma vier a usar uma peça
preta como protagonista.

**Outra armadilha, desta vez em testes:** `element.click()` direto (sem
`fireEvent`) não é suficiente para observar o resultado de um clique
que despoleta uma atualização de estado em React 19 — o `render()` da
próxima posição só ocorre num microtask a seguir, por isso uma
asserção síncrona logo depois do `.click()` continua a ver o DOM antigo
(apanhado ao depurar `page.test.tsx`: o teste via a peça errada porque
o clique "tinha funcionado" mas o estado ainda não tinha sido aplicado
ao DOM na altura da leitura). `fireEvent.click()` do Testing Library
(que envolve o disparo em `act()`) resolve isto — usar sempre
`fireEvent`, não `.click()` cru, em qualquer teste que precise de ler o
DOM logo a seguir a um clique que muda estado.

### Texturas das casas do tabuleiro: cor flat + grão subtil, geradas

Desde o redesenho "anime" (2026-08-25, ver secção própria abaixo),
`public/board/` deixou de ter texturas de madeira fotorrealistas —
`BOARD_THEMES` (`lib/settings/themes.ts`) tem três temas, cada um com
um par `<tema>-light-square.webp`/`<tema>-dark-square.webp`: `sakura`
(rosa-claro/magenta), `nebulosa` (lilás/roxo profundo — o tema por
omissão, a condizer com o gradiente do herói) e `neon` (ciano-claro/
petróleo escuro). Todas geradas com Draw Things (ver secção "Geração
de imagens" abaixo) com o mesmo prompt-base: cor sólida + "subtle fine
paper grain" — só o suficiente para não ficarem completamente planas,
sem nenhum padrão óbvio que se repita de forma visível entre casas
adjacentes. `ChessBoard.tsx` aplica-as via `backgroundImage` inline
(Tailwind não referencia ficheiros de `public/` por classe), com
`background-size: cover`; as classes `bg-violet-200`/`bg-violet-800`
continuam no botão como cor de fallback caso a imagem ainda não esteja
em cache (primeira visita offline) — combinam com `nebulosa`
especificamente, não com os outros dois temas (a mesma limitação que
já existia com os temas de madeira antigos, só a cor de fallback
mudou).

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
já tinham um escuro) — mesmo com texturas planas, os dois tons de cada
tema (claro/escuro) continuam a exigir contorno próprio para as peças se
manterem legíveis nos dois.

### Estilos de peças: `pieceStyles/`, mesmo convénio SVG

Desde 2026-08-24 (e alargado com um terceiro estilo em 2026-08-25),
`PieceIcon.tsx` deixou de conter as formas das peças diretamente —
passou a escolher entre `pieceStyles/classico.tsx` (as formas
originais), `pieceStyles/moderno.tsx` e `pieceStyles/anime.tsx`, todos
exportando o mesmo `PieceShape({ type })`. A prop `style?: PieceStyle`
percorre a cadeia toda: `PieceIcon` → `ChessBoard` (prop `pieceStyle`,
default `'classico'` — só o `ChessBoard` em si; ver nota sobre o
default da app abaixo) → `app/jogar/page.tsx` (lê
`settings.pieceStyle`). Páginas que não passam `pieceStyle` (as demos
de `/aprender`) continuam no `'classico'` por omissão, tal como já
acontecia com `boardTheme`.

Cada estilo tem uma identidade geométrica própria e deliberadamente
distinta ao relance, não uma variação subtil — mais visível na torre e
no bispo em cada caso:

- `classico`: círculos e curvas Bézier — o original.
- `moderno`: polígonos simples (hexágonos, losangos, zigzags rasos).
- `anime`: silhuetas denteadas/pontiagudas ("cristal/energia" —
  zigzags mais acentuados que `moderno`, losangos afiados em vez de
  círculos) — parte do redesenho "anime", a mesma linguagem visual das
  coroas denteadas e faíscas usadas no resto da identidade nova.

O cavalo é literalmente a mesma forma nos três estilos — já era o
único polígono "anguloso" do clássico, não há o que diferenciar sem
forçar. **Mas a base (`BASE`/`MODERN_BASE`/`ANIME_BASE`) tem de ser
diferente em cada ficheiro mesmo quando a forma principal se repete**
— sem isso, dois estilos produzem exatamente o mesmo SVG para o
cavalo (aconteceu ao adicionar `anime`: reaproveitar o `BASE` simples
do `classico` fazia o teste "estilos produzem HTML diferente" falhar
só para o tipo `n`, porque a base era a única coisa que os
diferenciava para as outras peças).

Antes de desenhar as formas finais de um estilo novo, monta-se sempre
uma página HTML solta (fora do repo, no scratchpad) para comparação
visual lado a lado e inspeção via screenshot — nunca confiar nas
coordenadas de cabeça. Para `anime` isto apanhou o acento (faísca) da
dama a ficar demasiado pequeno para se ver a 70px antes de o aumentar
ligeiramente.

O seletor em `/opcoes` (`PieceStylePicker`) não reutiliza o
`ThemePicker` genérico — este espera `previewImage` como caminho de
ficheiro para `background-image`, mas as peças são SVG desenhado à
mão, não imagens em `public/`. A miniatura de cada opção renderiza o
próprio `PieceIcon` (um rei) sobre um `bg-ink`, em vez de uma imagem.

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

`boardTheme` (`'sakura' | 'nebulosa' | 'neon'`, ver secção de texturas
acima) e `backgroundTheme` (`'classico' | 'noturno'`) são escolhidos em
`/opcoes` e lidos em dois sítios: `ChessBoard` aplica a textura das
casas via a sua prop `boardTheme`, e `app/jogar/page.tsx` desenha o
fundo como uma camada `fixed inset-0 -z-10` (fora do fluxo,
`aria-hidden`) para não poder interferir com a restrição "o tabuleiro
tem de caber no ecrã" abaixo — `main` ganha `relative` só como âncora
de posicionamento, não muda o seu próprio layout. O registo único dos
assets de cada tema — etiquetas e caminhos de imagem, para não
escrever caminhos de ficheiro espalhados pela app — vive em
`lib/settings/themes.ts` (`BOARD_THEMES`, `BACKGROUND_THEMES`), lido
por `ChessBoard.tsx`, `app/page.tsx` (fundo do menu), `app/jogar/
page.tsx` e `app/opcoes/page.tsx` (os seletores).

As imagens dos tiles (`public/menu/vs-cpu.webp`, `public/menu/
options.webp`, `public/menu/two-players.webp`) e o fundo do menu
(`public/menu/background.webp`, `public/menu/background-noturno.webp`)
seguem o mesmo pipeline de redimensionamento/compressão (`sips -Z 800`
para os tiles, `-Z 1200` para o fundo, depois `cwebp -q 85` — dois
comandos separados, não um pipe). Regeneradas por completo em
2026-08-25 como parte do redesenho "anime" (ver secção própria abaixo)
— substituem a arte "premium chess club" anterior (a primeira geração,
via Antigravity/Gemini, mais `two-players.webp` gerada depois com Draw
Things para igualar esse estilo). Os tiles em `app/page.tsx` aplicam a
imagem como `backgroundImage` do próprio `Link`, com uma camada de
gradiente translúcido por cima (`TILE_LABEL_STROKE`/cor de acento por
tile) para o texto se manter legível sobre qualquer parte da
ilustração, em vez de depender do contraste da própria imagem.

Dos quatro espaços originalmente reservados em `/opcoes`, três já têm
seletores reais: tema do tabuleiro e imagem de fundo usam `ThemePicker`
(miniaturas clicáveis lidas de `lib/settings/themes.ts`); estilo das
peças usa `PieceStylePicker`, próprio (ver secção "Estilos de peças"
acima — as peças são SVG desenhado à mão, não imagens, por isso não
cabem no `ThemePicker` genérico). Só "Idioma" continua como
"Brevemente" (`ComingSoonSection`, `opacity-60` + `aria-disabled="true"`)
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

### Sem autenticação (Clerk removido em 2026-08-25)

O projeto teve login via Clerk (`@clerk/nextjs`) — usado só para gate
das frases de explicação de lances (`lib/chess/moveExplanation.ts`)
atrás de uma flag `premium`, sem pagamentos nem base de dados a
proteger de facto. Foi removido por completo a pedido do utilizador
("estava a confundir o projeto"): `proxy.ts` (só existia para
`clerkMiddleware()`), `ClerkProvider` em `app/layout.tsx`, as rotas
`/entrar` e `/criar-conta`, `lib/auth/isPremiumUser.ts`, o botão
"Entrar"/`<UserButton/>` no menu inicial, a dependência
`@clerk/nextjs`, e as variáveis `CLERK_SECRET_KEY`/
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (de `.env.local` — continuam
provisionadas na Vercel pela integração do Marketplace até essa
integração ser desinstalada manualmente lá, passo que fica fora do
alcance do agente). As explicações de lances passaram a ser sempre
gratuitas — `LearningPanel` já não recebe nenhuma prop `isPremium`,
mostra a explicação sempre que existe.

### Identidade visual "anime" (redesenho 2026-08-25)

A app inteira foi redesenhada a pedido explícito do utilizador — a
identidade anterior ("premium chess club": fundo escuro, madeira
realista, tipografia por omissão do browser) foi descrita como
"genérica, sem identidade". Brainstorming feito com o
`superpowers:brainstorming` visual-companion (servidor local que
mostra mockups HTML num separador do browser) — cinco direções foram
exploradas lado a lado (flat cartoon estilo Duolingo, pastel
storybook, candy arcade, kawaii japonês, anime) antes de o utilizador
escolher "anime". Cinco incrementos, cada um commitado e verificado
sozinho antes do seguinte: (1) os três temas de tabuleiro (ver secção
de texturas acima), (2) tipografia + paleta + `ChipButton` + página do
menu, (3) o resto das páginas, (4) arte dos tiles/fundo do menu, (5) o
terceiro estilo de peças. Todo o trabalho ficou num único branch
(`redesign/anime-visual-identity`) em vez de um branch por incremento
— são todos a mesma entrega, só sequenciados.

**Tipografia** (`app/layout.tsx`, via `next/font/google`): **Bangers**
só para títulos de impacto (`font-display`, uma úníca weight 400) —
nunca para texto corrido, é demasiado carregada para se ler bem em
frases longas. **Poppins** (pesos 400-800) é o `font-sans` por
omissão, aplicado a tudo o resto. As duas incluem o subset
`latin-ext`, não só `latin` — o texto é todo PT-PT, precisa dos
acentos (ã, ç, õ, etc.).

**Paleta** (`app/globals.css`, tokens `@theme` do Tailwind v4): `ink`
(#1A0B33, fundo base), `ink-soft` (#241246, cartões), `cyan` (#00E5FF),
`pink` (#FF6FA5), `gold` (#FFD600), `purple` (#7B3FA0), `lilac`
(#E8D9FF, texto secundário sobre fundo escuro). Nomes próprios para
não colidir com a paleta por omissão do Tailwind (stone/sky/emerald/
etc., que alguns badges semânticos — qualidade do lance em
`LearningPanel` — continuam a usar de propósito, ver essa secção). A
app é **sempre escura agora**, sem depender de `prefers-color-scheme`
— ver "Cuidado recorrente" logo a seguir para a razão concreta.

**`ChipButton`** (`components/ChipButton/ChipButton.tsx`): substitui
todo o texto sublinhado da app por um "chip" com corte diagonal
(`clip-path`) e sombra "carimbada" (offset sólido, sem blur) — pedido
explícito: "all the links should have this button feel". Quatro
variantes de cor (`purple`/`cyan`/`pink`/`gold`), renderiza `<Link>`
quando recebe `href` ou `<button>` quando recebe `onClick`. Usado em
todas as páginas para qualquer ação secundária (Menu inicial, Voltar,
Reiniciar partida, Regras, Ver tutorial, etc.) — ao acrescentar uma
nova ação deste tipo nalguma página, usar sempre este componente, não
`underline`/`text-sky-*` à mão.

As três tiles do menu (`app/page.tsx`) e os grupos de seleção
(dificuldade/cor, em `/opcoes` e em `GameSetup.tsx`) partilham a mesma
linguagem visual — corte diagonal + sombra carimbada — mas não usam
`ChipButton` (são maiores, e os grupos de seleção têm lógica de estado
"ativo/inativo" própria); o mesmo `TILE_CLASS`/estilo inline aparece
duplicado nesses três sítios. Não extraído para um componente partilhado
ainda — cada um tem pequenas diferenças suficientes (imagem de fundo
vs. gradiente sólido, `aria-pressed`) para a extração ainda não valer
claramente a pena, mas é candidato óbvio se aparecer um quarto sítio.

### Cuidado recorrente: texto sem cor própria herda quase-branco em dark mode

Histórico do porquê de a app ser **sempre escura** agora (ver secção
de identidade visual acima), não só uma preferência de estilo:
`app/globals.css` costumava definir `--foreground: #ededed` (quase
branco) só sob `@media (prefers-color-scheme: dark)`. Qualquer
elemento sem uma classe de cor de texto explícita herdava essa cor —
inofensivo sobre um fundo escuro, mas invisível sobre um cartão claro
(`bg-white`/`bg-white/95`). Aconteceu duas vezes no mesmo dia
(2026-08-25): o `<label>` "Modo de aprendizagem" em
`LearningPanel.tsx` e o `<h2>`/`<dt>` de `RulesModal.tsx` — os dois
tinham o mesmo padrão, um contentor claro isolado dentro de uma app
maioritariamente escura, com filhos que nunca precisaram de definir a
própria cor porque sempre herdaram bem, até ao dia em que o fundo à
volta escureceu. Corrigidos primeiro pontualmente (cor explícita em
cada painel), depois pela raiz no mesmo redesenho: já não há nenhum
cartão `bg-white` na app — `--foreground` deixou de depender de
`prefers-color-scheme`, é sempre a mesma cor clara. Isto não torna o
cuidado obsoleto: qualquer componente novo com fundo genuinamente
diferente do resto da app (não é claro vs. escuro, é qualquer
contentor cuja cor de fundo não é óbvia por herança) deve continuar a
definir a própria cor de texto explicitamente, em vez de confiar na
herança do `body`.

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

### Toasts e modal de fim de jogo (feedback de eventos, 2026-08-27)

`components/Toast/` (`Toast.tsx`, cartão de apresentação puro; `ToastProvider.tsx`,
que expõe `useToast()`) é o **primeiro e único `React.Context` da app**,
montado uma vez em `app/layout.tsx` a envolver `{children}`. É
deliberadamente estreito — só guarda o toast atual (`show`/`dismiss`) —
e não é precedente para mover mais estado para Context: `useChessGame`
e `useSettings` continuam hooks por página, de propósito.

Sem auto-dismiss em lado nenhum, por decisão de design: todo o toast e
o `GameEndModal` fecham só por ação explícita do utilizador (botão ✕,
Escape, ou — só no modal — clique no backdrop). Não há nenhum
temporizador a procurar se um toast "desaparecer sozinho" parecer
estranho.

`components/GameEndModal/` (xeque-mate/afogamento/empate em `/jogar`)
**não** passa pelo Context do toast — segue o mesmo padrão autocontido
do `RulesModal` (só `/jogar` precisa dele, e precisa de callbacks
próprios da página, como `onPlayAgain` a chamar `handleReset`).

Contrato de camadas: o `Toast` renderiza a `z-[60]`, acima do `z-50`
do backdrop do `RulesModal`/`GameEndModal` — um toast fica sempre
visível mesmo com um modal aberto por cima. `handleReset` em
`app/jogar/page.tsx` chama `toast.dismiss()` (além de limpar
`gameEndOpen`/`prevStatus`) para um toast de xeque não sobreviver a um
"Jogar de novo" nem seguir o utilizador para fora da partida.

A app tem agora três idiomas de feedback — texto inline (estado
sempre visível, contextual, embutido na página, como `STATUS_LABEL`
em `/jogar`), toast (confirmação leve, não bloqueia) e modal
(bloqueia, exige reconhecimento explícito) — usar o mais leve que
resolva o caso antes de subir para o próximo.

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
Vercel é o único alvo de deploy suportado: o self-host via Docker (e o
`output: "standalone"` em `next.config.ts` que existia só para isso) foi
descontinuado quando a autenticação (Clerk) foi introduzida, e não foi
restaurado ao remover o Clerk (ver "Sem autenticação" acima) — ficou
fora do âmbito dessa remoção. Não há nenhuma variável de ambiente
própria da app a configurar para um novo deploy (as únicas que existiam
eram do Clerk).

## Ficheiros de contexto de agentes

`AGENTS.md` é regenerado automaticamente por `next dev`/`next build` (só o
bloco entre `<!-- BEGIN/END:nextjs-agent-rules -->` — ver
`node_modules/next/dist/server/lib/generate-agent-files.js`) — não editar à
mão, e não vale a pena documentar o projeto lá. Este ficheiro (`CLAUDE.md`)
é que é o sítio certo: só é regenerado pelo Next.js se `AGENTS.md` deixar de
existir, e está sob controlo de versão de propósito.
