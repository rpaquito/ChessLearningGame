# Contas e Funcionalidades Premium — Design

Data: 2026-08-21

## Objetivo

Introduzir contas de utilizador (login) na app, para preparar a
monetização futura: algumas funcionalidades do modo de aprendizagem
passam a exigir uma conta "premium", enquanto jogar (contra o
Stockfish ou a dois no mesmo dispositivo) continua totalmente livre e
sem login, tal como hoje.

Funcionalidade concreta a proteger nesta primeira fase: as frases de
explicação de lances introduzidas em `lib/chess/moveExplanation.ts`
(tanto na jogada sugerida como na classificação do último lance). O
destaque a verde da jogada sugerida e o badge de qualidade
(boa/imprecisão/erro) continuam a aparecer para todos, tal como hoje —
só o texto explicativo passa a ser premium.

## Não-objetivos

- **Sem pagamentos nesta fase.** Não há integração com Stripe nem
  qualquer fluxo de cobrança — o estado "premium" é apenas uma flag na
  conta, ativada manualmente (ver secção "Modelo de dados"). Isto fica
  para um design separado, quando houver uma funcionalidade paga real
  a vender (ex.: o treino de aberturas).
- **Sem proteção de rotas completas.** Nada nesta fase exige
  autenticação para aceder a uma página (`/jogar`, `/aprender`, etc.)
  — todas continuam públicas. `clerkMiddleware()` está presente só
  para manter a sessão sincronizada, sem `auth.protect()` em lado
  nenhum.
- **Sem base de dados.** O estado premium vive inteiramente no
  `publicMetadata` do utilizador Clerk — não há Postgres/Neon nem
  qualquer outro armazenamento novo.
- **Sem alterar as funcionalidades que já são gratuitas hoje**: jogar,
  o destaque de peças ameaçadas, a sugestão de jogada (o destaque em
  si) e o badge de qualidade continuam exatamente como estão.

## Stack e integração

- **Clerk** (`@clerk/nextjs`), instalado como integração nativa do
  Vercel Marketplace (`vercel integration add clerk`) — provisiona
  automaticamente `CLERK_SECRET_KEY` e
  `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` como variáveis de ambiente do
  projeto na Vercel; localmente via `vercel env pull`.
- Nenhuma API route própria é necessária — toda a integração é
  client-side (`ClerkProvider`, hooks) mais o `middleware.ts` que o
  Clerk exige para sincronizar sessão.

## Modelo de dados: a flag "premium"

- `user.publicMetadata.premium: boolean`.
- Só pode ser escrita a partir da Clerk Dashboard ou de uma chamada
  de backend autenticada com `CLERK_SECRET_KEY` — nunca pelo próprio
  utilizador. É precisamente essa assimetria (legível no cliente,
  só editável por uma parte de confiança) que permite fazer a
  verificação inteiramente no browser sem precisar de uma rota de
  servidor: o utilizador pode ler a sua própria flag, mas não a pode
  alterar sozinho.
- Para já, ativar premium para um utilizador é um passo manual na
  Clerk Dashboard (Users → editar `publicMetadata`). Quando houver
  pagamentos, o webhook do Stripe passa a escrever esta mesma flag.

## Arquitetura e componentes

### 1. `app/layout.tsx`

Envolve `{children}` em `<ClerkProvider>`, dentro de `<body>` (não à
volta de `<html>`, conforme a recomendação atual do Clerk Core 3).

### 2. `middleware.ts` (novo ficheiro, raiz do projeto)

```ts
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  // Só exclui assets estáticos com hash/ícones — este projeto não tem
  // rotas /api nem tRPC, por isso o matcher não precisa de as referir.
  matcher: ['/((?!_next|.*\\.(?:png|jpg|svg|ico|webmanifest|json)$).*)'],
};
```

Sem `auth.protect()` — o único papel deste middleware nesta fase é
manter o token de sessão sincronizado entre pedidos. O matcher exclui
assets estáticos, coerente com o que já é servido cache-first pelo
service worker (`public/sw.js`); não interfere com a estratégia
network-first das navegações/RSC, que continua a correr normalmente,
só que agora passa primeiro pelo middleware do Clerk quando online.

### 3. Rotas novas: `app/entrar/page.tsx` e `app/criar-conta/page.tsx`

Componentes `<SignIn/>` / `<SignUp/>` do Clerk, sem lógica própria.
Nomes de rota em português para consistência com `/jogar` e
`/aprender`.

### 4. `app/page.tsx` (menu inicial)

Nova linha no topo do menu: link "Entrar" quando não autenticado,
`<UserButton/>` do Clerk quando autenticado — ao lado do link "Regras
do jogo" já existente.

### 5. `app/jogar/page.tsx` + `LearningPanel`

- `JogarContent` passa a chamar `useUser()` do Clerk e calcula
  `const isPremium = Boolean(user?.publicMetadata?.premium)`.
- `LearningPanelProps` ganha `isPremium: boolean` — continua um
  componente puramente apresentacional, tal como o `ChessBoard`; não
  sabe nada de Clerk, só recebe um booleano.
- Sempre que `suggestionExplanation`/`lastMoveExplanation` existir e
  `isPremium` for `false`, `LearningPanel` mostra uma frase de
  chamada em vez do texto explicativo, com link para `/entrar`, ex.:
  "Torna-te premium para veres a explicação deste lance."
- Quando `isPremium` é `true`, comporta-se exatamente como descrito no
  design anterior (texto da `describeMove`/`explainMoveQuality`
  normal).

## Tratamento de erros / comportamento offline

Nada disto pode bloquear o jogo em si:

- Se o Clerk falhar a carregar, estiver offline, ou `useUser()` ainda
  não tiver resolvido, `isPremium` assume `false` por omissão — o
  comportamento é idêntico ao de um utilizador gratuito não
  autenticado. Suggerir jogada, o badge de qualidade e o destaque de
  ameaças continuam a funcionar normalmente.
- A garantia "a app funciona sempre offline" mantém-se para tudo
  exceto: (a) autenticar-se pela primeira vez, e (b) ver o texto
  premium da explicação sem já ter uma sessão válida em cache.

## Testes

- `LearningPanel` continua sem depender do Clerk — recebe só um
  booleano, por isso não precisa de mocks novos caso lhe sejam
  adicionados testes no futuro.
- `describeMove`/`explainMoveQuality` (lib/chess/moveExplanation.ts)
  não mudam — a gate acontece só na camada de apresentação.
- Não são adicionados testes novos para `app/jogar/page.tsx` (não tem
  hoje) — a integração do Clerk aí é uma camada fina, consistente com
  o tratamento já dado à ligação ao motor Stockfish no mesmo ficheiro.

## Impacto na documentação

`CLAUDE.md` — a frase "Sem backend/API routes — tudo corre no
browser" precisa de uma ressalva: o middleware do Clerk (autenticação
alojada, não uma rota própria) passa a ser a exceção. Atualizar também
a árvore de `Estrutura` com `middleware.ts`, `app/entrar/`,
`app/criar-conta/`, e acrescentar uma secção curta explicando o
`publicMetadata.premium` e onde é lido (`app/jogar/page.tsx`).

## Trabalho futuro (fora de âmbito aqui)

- Pagamentos reais (Stripe) a escrever `publicMetadata.premium` via
  webhook, quando houver uma funcionalidade paga concreta para vender
  (o treino de aberturas é a candidata óbvia).
- Proteger rotas inteiras com `auth.protect()`, se algum dia existir
  uma página só para premium (em vez de um trecho dentro de
  `/jogar`).
- Estender `isPremium` a outras funcionalidades futuras (treino de
  aberturas) reutilizando a mesma flag — não deve exigir nenhuma
  alteração ao modelo de dados, só mais um local a lê-la.
