# Menu e Ecrã de Definições — Redesign — Design

Data: 2026-08-22

## Objetivo

Reestruturar o menu inicial e introduzir um ecrã de Definições (`/opcoes`),
com uma direção visual mais "premium": os dois modos de jogo (computador /
dois jogadores) passam a ser blocos ilustrados grandes no menu; a
dificuldade e a cor só aparecem depois de escolher jogar contra o
computador, num ecrã próprio; um novo ecrã de Definições guarda valores por
omissão (dificuldade, cor) e reserva espaço visível, mas inativo, para
funcionalidades futuras (tema do tabuleiro, estilo das peças, imagem de
fundo, idioma).

Este é o primeiro de quatro sub-projetos identificados a partir de um
pedido maior do utilizador (ver `docs/superpowers/specs/`, memória
`project-backlog.md`): os outros três — biblioteca de temas visuais
(múltiplos tabuleiros/peças/fundos), internacionalização (PT/EN), e o que
mais vier — ficam para depois, e só preenchem as secções "Brevemente" que
este projeto já deixa prontas na interface.

## Não-objetivos

- **Sem biblioteca de temas ainda.** Só a textura de madeira já existente
  (carvalho/nogueira) continua a ser usada — nenhum tabuleiro/peça/fundo
  novo é gerado aqui, além das três imagens ilustrativas dos botões do
  menu e do fundo do próprio ecrã de menu.
- **Sem internacionalização.** Todo o texto novo continua em PT-PT. O
  Idioma aparece só como secção "Brevemente" nas Definições.
- **Sem alterar `/jogar`** — o contrato de querystring
  (`mode`/`difficulty`/`color`) mantém-se exatamente igual; só muda quem
  o constrói e a partir de que ecrã.
- **Sem conta/login necessário para usar as Definições** — dificuldade e
  cor por omissão são só `localStorage`, tal como o FEN da partida.

## Arquitetura e componentes

### 1. `app/page.tsx` (menu inicial) — reescrito

Passa a mostrar três blocos ilustrados grandes, cada um um `<Link>` do
Next.js (navegação real, não `<button onClick={router.push}>` — são
destinos estáticos, um `<Link>` dá semântica de link a sério: abrir em
nova aba, etc.):
- **"Jogar contra o computador"** (`<Link href="/configurar">`).
- **"Dois jogadores"** (`<Link href="/jogar?mode=local" onClick={() => clearSavedGame()}>`)
  — sem ecrã intermédio, não há nada para configurar; o `onClick` corre
  `clearSavedGame()` de forma síncrona antes da navegação do `Link`
  prosseguir.
- **"Opções"** (`<Link href="/opcoes">`).

"Ver tutorial" e "Regras do jogo" mantêm-se como links secundários mais
pequenos por baixo dos três blocos — não viram blocos ilustrados, para não
diluir a hierarquia visual dos dois modos de jogo principais.

O cabeçalho com "Entrar"/`<UserButton/>` mantém-se inalterado.

### 2. `app/configurar/page.tsx` (novo)

Ecrã dedicado só ao modo computador — renderiza `<GameSetup/>` (secção 7):
dificuldade e cor, pré-preenchidas a partir das Definições guardadas
(`useSettings()`), continuando editáveis só para esta partida — escolher
aqui NÃO altera as Definições por omissão, só o valor inicial já vem de
lá. Botão "Começar" (continua `<button onClick>` + `router.push` — o URL
final só se conhece depois da escolha, ao contrário dos blocos do menu)
limpa o FEN guardado e navega para
`/jogar?mode=ai&difficulty=...&color=...`, exatamente como o
`handleStart` de hoje.

### 3. `app/opcoes/page.tsx` (novo)

Duas secções funcionais — "Dificuldade padrão" e "Cor padrão" — que
gravam automaticamente em `localStorage` a cada alteração (sem botão
"Guardar", tal como o resto da app já persiste silenciosamente). Quatro
secções adicionais em estado desativado com badge "Brevemente": tema do
tabuleiro, estilo das peças, imagem de fundo, idioma. Link "Menu inicial"
para voltar.

### 4. `lib/chess/playerColor.ts` (novo) — tipo partilhado

```ts
export type PlayerColor = 'white' | 'black' | 'random';
```

Extraído do `ModeSelector.tsx` atual (onde vivia só localmente) para ser
partilhado entre `lib/settings/settings.ts` e `components/GameSetup/GameSetup.tsx`.

### 5. `lib/settings/settings.ts` (novo) — módulo puro

```ts
export interface Settings {
  defaultDifficulty: Difficulty;
  defaultColor: PlayerColor;
}
export const DEFAULT_SETTINGS: Settings;
export function loadSettings(): Settings;   // localStorage → Settings, com
                                              // validação defensiva (dados
                                              // corrompidos/antigos caem
                                              // nos valores por omissão)
export function saveSettings(settings: Settings): void;
```

Mesma disciplina defensiva do `useChessGame.ts`: `typeof window !==
'undefined'` + `try/catch`, nunca lança exceção, nunca bloqueia a
navegação se o `localStorage` estiver indisponível (modo privado, quota
cheia, etc.).

### 6. `lib/settings/useSettings.ts` (novo) — hook fino

```ts
export function useSettings(): {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
};
```

Segue exatamente o padrão já usado em `useChessGame` — lê o
`localStorage` dentro do inicializador `useState(() => loadSettings())`,
sem `useEffect`, consistente com o resto da app (este padrão já funciona
aqui sem problemas de hidratação, por a árvore ser inteiramente client-
side a partir de componentes `'use client'`).

### 7. `components/ModeSelector/ModeSelector.tsx` — removido

Substituído por dois componentes mais pequenos e focados, seguindo o
princípio de unidades com uma responsabilidade clara:
- Os três blocos ilustrados vivem diretamente em `app/page.tsx` (são
  puramente navegação, não precisam de estado próprio).
- `components/GameSetup/GameSetup.tsx` (novo) — a lógica de
  dificuldade/cor + botão "Começar", usada só por `app/configurar/page.tsx`.

### 8. `lib/chess/useChessGame.ts` — pequeno acrescento

Nova função exportada `clearSavedGame(): void`, extraindo a lógica de
limpeza do FEN (`localStorage.removeItem(STORAGE_KEY)` com try/catch) que
hoje vive só dentro do `ModeSelector.handleStart`. Passa a ser chamada em
dois sítios (o botão "Começar" de `/configurar`, e o clique direto em
"Dois jogadores" no menu) em vez de um só — extrair evita duplicar a
mesma lógica defensiva duas vezes.

### 9. Imagens ilustradas (geradas via `agy`, mesmo pipeline da textura do tabuleiro)

Três imagens novas, com direção de arte coerente entre si (mesmo estilo,
paleta e iluminação, geradas na mesma sessão para consistência):
- Bloco "Jogar contra o computador" — motivo peça de xadrez + tecnológico/
  circuito, tom escuro e dramático.
- Bloco "Dois jogadores" — duas peças (ex.: rei branco e rei preto)
  frente a frente, tom mais quente/social.
- Bloco "Opções" — engrenagem estilizada, mais neutro.

Mais uma imagem de fundo fixa (não escolhível pelo utilizador — isso fica
para o sub-projeto da biblioteca de temas) para o próprio ecrã do menu
inicial, reforçando a direção "premium" pedida.

Todas seguem o mesmo processo já documentado em `CLAUDE.md` (gerar →
`sips -Z <tamanho>` → `cwebp -q 85` → commitar só o `.webp` final,
originais e intermédios nunca entram no repositório).

## Fluxo de dados

```
app/page.tsx
  ├─ tile "Jogar contra o computador" → <Link href="/configurar">
  ├─ tile "Dois jogadores"            → onClick={clearSavedGame} + <Link href="/jogar?mode=local">
  └─ tile "Opções"                    → <Link href="/opcoes">

app/configurar/page.tsx
  ├─ useSettings() → valores iniciais de dificuldade/cor
  └─ "Começar" → clearSavedGame(); router.push(`/jogar?mode=ai&difficulty=${d}&color=${c}`)

app/opcoes/page.tsx
  └─ useSettings().updateSettings({ defaultDifficulty | defaultColor }) a cada alteração
```

`app/jogar/page.tsx` não muda nada — continua a ler exatamente os mesmos
três parâmetros de querystring que já lê hoje.

## Tratamento de erros

- `localStorage` indisponível: `loadSettings()` devolve `DEFAULT_SETTINGS`,
  `saveSettings()` falha silenciosamente — as Definições simplesmente não
  persistem entre visitas, mas nada na app quebra ou bloqueia.
- Imagem ilustrada de um bloco falha a carregar (raro, mas possível antes
  de o service worker a ter em cache): o bloco mantém uma cor de fundo de
  fallback (tal como as texturas do tabuleiro), e o texto do botão
  continua legível por cima.

## Testes

- `lib/settings/settings.ts` — testes unitários puros (`loadSettings`/
  `saveSettings`), incluindo o caso de dados corrompidos/antigos no
  `localStorage`, seguindo o padrão de `lib/chess/*.test.ts`.
- Sem testes novos para `app/page.tsx`, `app/configurar/page.tsx`,
  `app/opcoes/page.tsx` ou `GameSetup.tsx` — consistente com o
  `ModeSelector.tsx` de hoje, que também nunca teve testes.

## Trabalho futuro (fora de âmbito aqui)

- Biblioteca de temas visuais: mais texturas de tabuleiro, estilos de
  peças, imagens de fundo escolhíveis — preenche as secções "Brevemente"
  correspondentes em `/opcoes`.
- Internacionalização PT/EN — preenche a secção "Idioma".
- Ligar as Definições a uma conta Clerk (sincronizar entre dispositivos)
  em vez de ficarem só em `localStorage` — não pedido, não necessário
  agora.
