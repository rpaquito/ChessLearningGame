# App nativo iOS (Capacitor) + rebranding "Chess Sensei" — Design

Data: 2026-08-28

## Objetivo

Levar a app a uma primeira loja (App Store), com ganhos concretos face
à PWA já instalável/offline de hoje:

- presença/descoberta na App Store;
- capacidades nativas modestas mas reais: feedback háptico, e arranque
  verdadeiramente offline (sem depender de o service worker já ter
  feito cache numa visita anterior);
- percepção de performance/"feel" — sem ir ao ponto de reescrever a UI.

Decisão de arquitetura (brainstorming, "Approach A" entre 3 opções
avaliadas): **Capacitor a embrulhar o export estático da app Next.js
já existente**, sem reescrever nenhuma UI. Reutiliza 100% do código
React/TS já existente (`lib/`, `components/`, os 267 testes) — a
alternativa de reescrever em React Native ou nativo puro (Swift/
Kotlin) foi conscientemente descartada por implicar, na prática, um
segundo projeto do tamanho do primeiro, para um ganho marginal dado o
que esta entrega realmente precisa (haptics + um shell nativo, não uma
UI 100% nativa).

Aproveitado o mesmo esforço para um **rebranding de produto completo**:
novo nome "Chess Sensei" e novo ícone (peão marfim, bandana dourada com
fita ao vento, barba rala, aura ciano — ver secção 5) em vez do
nome/ícone genéricos atuais ("Xadrez"), aplicado tanto à PWA web como à
app nativa.

## Não-objetivos

- **Android** — sequenciado para depois desta entrega (decisão
  explícita do brainstorming: "iOS primeiro", já que o desenvolvimento
  é feito num Mac e o Xcode/build local iOS já funciona sem
  configuração extra).
- **Reescrita nativa completa** (a "Approach C" avaliada e descartada
  no brainstorming) — só reconsiderada no futuro se a Approach A se
  revelar insuficiente, e nesse caso **num repositório à parte**,
  nunca neste.
- **Notificações push** — a app não tem backend nenhum para as
  disparar (ver `CLAUDE.md`: "Sem backend/API routes próprias"); fora
  de âmbito enquanto isso não mudar.
- **Migração de armazenamento** (`localStorage` →
  `@capacitor/preferences`) — o WKWebView já persiste `localStorage` de
  forma suficientemente fiável para as necessidades atuais da app;
  fica como possível trabalho futuro, não faz parte desta entrega.
- **CI/testes automáticos em dispositivo ou simulador iOS** —
  verificação nesta entrega é manual (Xcode simulator/dispositivo),
  como qualquer outro comportamento nativo.
- **Conteúdo da ficha da App Store** (screenshots, descrição,
  classificação etária, "nutrition label" de privacidade) e o próprio
  processo de assinatura/conta de developer — trabalho humano, fora do
  alcance do agente (ver secção "Assinatura e distribuição").
- **Nenhuma alteração de comportamento de jogo, lógica de xadrez, ou
  qualquer funcionalidade existente** — esta entrega é só "embrulho +
  rebranding", não toca em `lib/chess/`, `lib/openings/`,
  `lib/settings/`, etc., para além do estritamente necessário para os
  hooks de haptics e para o rebranding textual.

## Arquitetura e componentes

### 1. Pipeline de build: export estático condicional

`next.config.ts` ganha um fork mínimo, ativado só por uma variável de
ambiente — o build normal usado pela Vercel (`next build`, sem
variáveis extra) fica bit-a-bit igual ao que é hoje:

```ts
// next.config.ts
import type { NextConfig } from 'next';

const isCapacitorBuild = process.env.BUILD_TARGET === 'capacitor';

const nextConfig: NextConfig = {
  ...(isCapacitorBuild ? { output: 'export' } : {}),
};

export default nextConfig;
```

Compatibilidade confirmada durante o brainstorming: a app não tem
nenhuma API route, nenhum uso de `next/image` (todas as texturas/temas
aplicam-se via `backgroundImage` inline), e a única página com
`useSearchParams()` (`/jogar`) já está dentro de `<Suspense>` — nenhum
obstáculo conhecido a `output: 'export'`.

Novos scripts em `package.json`:

```json
{
  "scripts": {
    "build:capacitor": "BUILD_TARGET=capacitor next build",
    "cap:sync:ios": "npx cap sync ios",
    "cap:open:ios": "npx cap open ios"
  }
}
```

`npm run build:capacitor` produz `out/` (HTML/JS/CSS estáticos,
incluindo o binário WASM do Stockfish vendorizado); `cap:sync:ios`
copia esse `out/` para dentro do projeto Xcode (`ios/App/App/public`)
e atualiza dependências nativas.

### 2. Projeto Capacitor (`ios/`)

Novas dependências: `@capacitor/core`, `@capacitor/cli`,
`@capacitor/ios`, `@capacitor/haptics`. `capacitor.config.ts` na raiz
do repositório:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'pt.rpaquito.chesssensei',
  appName: 'Chess Sensei',
  webDir: 'out',
};

export default config;
```

`npx cap add ios` gera o projeto Xcode completo dentro de `ios/`,
commitado como qualquer outro código-fonte do repositório — é o padrão
Capacitor: o projeto nativo vive dentro do próprio repo da app web, não
separado.

### 3. Feedback háptico

Novo módulo puro `lib/native/haptics.ts`, seguindo a mesma separação já
estabelecida entre `lib/` (lógica) e `components/`:

```ts
// lib/native/haptics.ts
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export async function hapticMove(): Promise<void> {
  if (!isNative()) return;
  await Haptics.impact({ style: ImpactStyle.Light });
}

export async function hapticCapture(): Promise<void> {
  if (!isNative()) return;
  await Haptics.impact({ style: ImpactStyle.Medium });
}

export async function hapticCheck(): Promise<void> {
  if (!isNative()) return;
  await Haptics.notification({ type: NotificationType.Warning });
}
```

No web (`isNative()` sempre `false` fora do shell Capacitor), estas
três funções são efetivamente no-ops — chamáveis livremente em
qualquer teste sem precisar de mock do runtime Capacitor.

Ligação em `app/jogar/page.tsx`: `hapticCheck()` no mesmo ponto que já
decide mostrar o toast de xeque (`state.status === 'check'`);
`hapticCapture()`/`hapticMove()` no handler de jogada existente, a
partir do resultado de `chess.move()` (`Move.isCapture()` do
`chess.js`, o mesmo método que `inferMove.ts` já usa) — uma captura
chama `hapticCapture()`, qualquer outro lance chama `hapticMove()`.

### 4. Service worker vs. shell nativo

`components/ServiceWorkerRegistration.tsx` ganha uma guarda no topo:
`if (Capacitor.isNativePlatform()) return;` — dentro do shell nativo, o
bundle já está em disco (`webDir: 'out'`, bundlado no binário), não há
nada para o service worker fazer, e evita qualquer risco de
comportamento estranho de um SW dentro de uma WKWebView.

### 5. Rebranding: "Chess Sensei" + novo ícone

Todo o texto/assets de identidade da app trocam de "Xadrez" para
"Chess Sensei" — na web **e** no shell nativo, decisão do brainstorming
("whole product", não só o shell nativo):

- `app/layout.tsx`: `metadata.title` → `'Chess Sensei — aprenda
  jogando'`, `metadata.appleWebApp.title` → `'Chess Sensei'`.
- `public/manifest.json`: `name` → `'Chess Sensei — aprenda jogando'`,
  `short_name` → `'Chess Sensei'`. Aproveitado para corrigir também
  `background_color`/`theme_color`, ainda presos à paleta pré-redesenho
  "anime" (`#fafaf9`/`#b45309`, tons âmbar de madeira) — trocam para
  `#1A0B33` (`ink`), a condizer com `viewport.themeColor` em
  `layout.tsx`, já correto.
- `capacitor.config.ts`: `appName: 'Chess Sensei'` (secção 2 acima).

Novo ícone — peão marfim com bandana dourada/fita ao vento, barba rala,
aura ciano sobre fundo `ink` — gerado via Draw Things e validado
visualmente durante o brainstorming (mockups + gerações reais
comparadas lado a lado). A arte gerada tem cantos arredondados
desenhados dentro da própria imagem; como tanto o iOS quanto o
`maskable` do PWA aplicam a própria máscara, **a arte de produção final
tem de preencher o quadrado todo, de canto a canto, sem arredondamento
próprio** — acabamento a fazer a partir do render aprovado antes de
gerar os ficheiros finais.

A partir de uma única imagem-fonte 1024×1024:

- **Web** (`public/icons/`): `icon-192.png`, `icon-512.png`,
  `icon-512-maskable.png` (o `maskable` precisa de padding extra — o
  conteúdo tem de caber dentro de um círculo centrado com 40% de raio
  do ícone, a regra "safe zone" de ícones `maskable` do PWA, para a
  máscara do SO não cortar a bandana/barba), `apple-touch-icon.png` —
  mesmo pipeline
  `sips`/`cwebp` já documentado no `CLAUDE.md` para as restantes artes
  do projeto.
- **iOS**: um único `AppIcon` de 1024×1024 no asset catalog
  (`ios/App/App/Assets.xcassets/AppIcon.appiconset`) — versões
  recentes do Xcode já não exigem o conjunto antigo de tamanhos
  múltiplos, geram-nos sozinhas a partir de uma única imagem "any
  appearance".

### 6. Identidade da app

`appId`: `pt.rpaquito.chesssensei` — praticamente permanente após a
primeira submissão à App Store (mudar depois implica perder
histórico/reviews e ser tratado como uma app nova). Confirmado no
brainstorming antes de escrever este documento.

## Assinatura e distribuição (fora do alcance do agente)

Esta entrega termina num **build assinado e corrível**
(simulador, ou `.ipa` para dispositivo/TestFlight) — não numa
submissão publicada. Os passos seguintes ficam por conta do
utilizador, fora do que este spec/plano cobre:

- Conta Apple Developer Program ($99/ano) — necessária antes de
  qualquer assinatura real ou envio a TestFlight.
- Configuração de assinatura/provisioning profile no próprio Xcode,
  associada ao Apple ID.
- Ficha da App Store Connect (screenshots, descrição, classificação
  etária, "nutrition label" de privacidade) e a submissão em si.

Recomendado ter a conta Apple Developer já ativa antes de a
implementação começar, para não haver bloqueio a meio do plano.

## Testes

- Os 267 testes vitest existentes mantêm-se exatamente como estão —
  nenhum toca em código novo desta entrega, nenhum é afetado por ela.
- `lib/native/haptics.test.ts` (novo) — cobre só o ramo no-op
  (`Capacitor.isNativePlatform() === false`, o caso real em qualquer
  ambiente de teste jsdom): as três funções resolvem sem lançar e sem
  chamar `Haptics.*`. O disparo háptico real não é testável em vitest —
  verificado só manualmente no simulador/dispositivo.
- Sem testes automáticos para o projeto Xcode/`ios/` nesta entrega —
  ver "Não-objetivos". Verificação manual mínima antes de considerar a
  entrega concluída: a app abre no simulador, uma partida completa
  contra o Stockfish funciona do início ao fim, um "force quit" +
  reabertura sem rede confirma o arranque offline, e um movimento/
  captura/xeque reais disparam vibração num dispositivo físico (o
  simulador não vibra) ou, no mínimo, não lançam nenhum erro na consola
  do simulador.

## Erros e casos-limite

- **`Capacitor` importado num contexto sem o runtime nativo** (SSR do
  Next.js, testes vitest). `@capacitor/core` está desenhado para
  isto — `Capacitor.isNativePlatform()` devolve `false` de forma
  segura em qualquer ambiente sem o shell nativo, incluindo durante a
  renderização no servidor da build normal da Vercel (que nem sequer
  usa `output: 'export'`, mas importa os mesmos módulos).
- **`out/` desatualizado depois de um `git pull`.** `cap sync` só
  reflete o que estiver em `out/` no momento em que corre — esquecer
  `npm run build:capacitor` antes de `cap:sync:ios` reabre a app Xcode
  com conteúdo antigo. Não há proteção automática contra isto nesta
  entrega (fica documentado aqui e, presumivelmente, no `CLAUDE.md`
  depois da implementação).
- **Ícone `maskable` sem "safe zone" suficiente.** Se o padding do
  ícone `maskable` ficar apertado a mais, máscaras circulares (o
  `manifest.json` já declara este `purpose`, usado sobretudo no
  Android) cortam a bandana/barba — verificar visualmente com uma
  máscara circular sobreposta antes de aceitar o ficheiro final, não só
  o quadrado cru.

## Passos seguintes (fora deste spec)

- Android (mesma abordagem Capacitor, `npx cap add android`,
  sequenciado depois desta entrega).
- Eventual "Approach C" (reescrita nativa completa) — só se algum dia
  for justificada, e nesse caso num repositório novo, não neste.
- Migração de armazenamento para `@capacitor/preferences`, se a
  fiabilidade do `localStorage` no WKWebView se revelar insuficiente na
  prática.
