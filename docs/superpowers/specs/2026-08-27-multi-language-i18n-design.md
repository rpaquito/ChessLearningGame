# Suporte a múltiplos idiomas (PT-PT / English) — Design

Data: 2026-08-27

## Objetivo

A app é hoje 100% em português de Portugal, hardcoded em cada ficheiro. O
seletor "Idioma" em `/opções` existe só como placeholder desativado
(`ComingSoonSection`, "Brevemente"). Esta entrega torna-o real: suporte
completo a **PT-PT e English**, cobrindo tudo — não só a UI (menus,
botões, painéis, modais, páginas do tutorial), mas também o conteúdo
extenso do treino de aberturas (`lib/openings/data.ts`, ~220 explicações)
e as frases de explicação de lances (`lib/chess/moveExplanation.ts`).

Sem rotas por idioma (`/en/jogar`) — a app é 100% client-side (settings em
`localStorage`, PWA instalável, sem SEO por localidade a otimizar), e a
recomendação oficial de i18n desta versão do Next.js (App Router
`app/[lang]/...` + `proxy.ts`) exigiria reestruturar todo o `app/` e
reintroduzir routing server-side numa app que hoje não precisa disso. Em
vez disso: `language` é um campo de `Settings`, trocável instantaneamente
em runtime, exatamente como `boardTheme`/`pieceStyle` já funcionam hoje.

Decompõe-se em 3 sub-projetos, cobertos nesta única spec (cada um pode
ganhar o seu próprio plano de implementação, tal como aconteceu com o
treino de aberturas):

1. **Mecanismo i18n + tradução da UI** — `lib/i18n/`, campo `language` em
   `Settings`, deteção de idioma no arranque, seletor real em `/opções`,
   e todas as strings visíveis em `app/`/`components/`.
2. **`lib/chess/moveExplanation.ts` bilingue** — módulo gerador de frases
   por composição de fragmentos, parametrizado por idioma.
3. **Conteúdo das aberturas (`lib/openings/data.ts`) bilingue** — ~220
   explicações a escrever em inglês, com a mesma revisão factual
   rigorosa que a versão PT-PT já teve.

## Não-objetivos

- **Sem rotas por idioma / sem SSR de conteúdo traduzido.** Nenhuma URL
  ganha prefixo de idioma; `proxy.ts` não é reintroduzido.
- **Sem terceiro idioma nesta entrega.** Só PT-PT e English — a
  arquitetura (`Locale = 'pt' | 'en'`) não impede acrescentar mais tarde,
  mas não é construída a pensar em N idiomas genéricos agora (YAGNI).
- **`public/manifest.json` fica estático em PT-PT.** É servido pelo
  browser antes de qualquer JavaScript correr — não há forma de o tornar
  dependente da escolha guardada em `localStorage` sem complexidade
  desproporcional (múltiplos manifests + lógica de troca de `<link
  rel="manifest">`, frágil e fora de âmbito).
- **Sem deteção contínua do idioma do browser.** A deteção via
  `navigator.language` só corre uma vez, quando não há `language`
  guardado — depois disso, a escolha (detetada ou explícita) persiste e
  nunca é re-detetada automaticamente.
- **Sem tradução automática/IA em runtime.** Todo o texto em inglês é
  escrito à mão, ao mesmo nível de cuidado do PT-PT existente — nada de
  gerar traduções on-the-fly.
- **Conteúdo futuro (novas aberturas, novas explicações) não é coberto
  aqui.** A partir desta entrega, adicionar uma nova entrada a
  `lib/openings/data.ts` obriga a preencher os dois idiomas (o
  TypeScript força isso), mas isso é trabalho de manutenção contínua, não
  desta spec.

## Arquitetura e componentes

```
lib/i18n/
  types.ts            # Locale = 'pt' | 'en'; interface Dictionary
  detectLocale.ts        # detectLocale(navigatorLanguage?: string): Locale
  detectLocale.test.ts
  dictionaries/
    pt.ts                # satisfies Dictionary — cópia byte-a-byte do texto atual
    en.ts                 # satisfies Dictionary
  useTranslation.ts        # hook fino sobre useSettings, sem Context novo
components/
  LanguageSync/
    LanguageSync.tsx        # sem UI, mesmo padrão do ServiceWorkerRegistration
  OpeningPageHeader/
    OpeningPageHeader.tsx     # novo — ver secção "Páginas Server Component"
lib/settings/
  settings.ts                 # Settings ganha `language: Locale`
lib/openings/
  types.ts                      # campos de texto passam a Record<Locale,string>
  data.ts                        # PT existente + EN novo, lado a lado
  replayLine.ts                    # ReplayedMove.explanation também bilingue
lib/chess/
  moveExplanation.ts                # fragmentos parametrizados por Locale
```

### 1. `lib/i18n/types.ts` + dicionários

```ts
export type Locale = 'pt' | 'en';

export interface Dictionary {
  menu: { playVsComputer: string; twoPlayers: string; learnToPlay: string; options: string; /* ... */ };
  opcoes: { language: string; portuguese: string; english: string; /* ... */ };
  jogar: { mainMenu: string; restart: string; rules: string; /* ... */ };
  aprender: { openingsCount: (n: number) => string; /* ... */ };
  // uma secção por área da app, espelhando a árvore de app/+components/
}
```

(Esboço ilustrativo, não exaustivo — a lista completa de chaves fica
para o plano de implementação, que precisa de inventariar todas as
strings visíveis em `app/`/`components/` antes de escrever os dois
dicionários.)

`t` **não é uma função de lookup por string** (`t('a.b.c')`) — é o
próprio objeto do dicionário do idioma atual. `dictionaries/pt.ts` e
`dictionaries/en.ts` implementam a mesma `Dictionary`; o TypeScript
obriga as duas a terem exatamente as mesmas chaves, sem risco de uma
chave esquecida devolver `undefined` silenciosamente em runtime — o
mesmo nível de segurança de tipos que o resto do projeto já usa em
todo o lado. Casos com interpolação (ex.: contagem de aberturas) são
funções dentro do próprio dicionário (`t.aprender.openingsCount(12)`),
não um mecanismo de templating à parte.

`dictionaries/pt.ts` é uma cópia **byte-a-byte** do texto que já existe
hoje em cada ficheiro — isto não é só estilo, é o que garante que os 205
testes existentes que fazem asserções sobre texto PT-PT continuam a
passar sem alteração nenhuma (o idioma por omissão continua PT-PT, e o
texto produzido é idêntico ao de antes desta feature).

### 2. `detectLocale.ts`

```ts
export function detectLocale(navigatorLanguage?: string): Locale {
  return navigatorLanguage?.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}
```

Função pura, testada isoladamente — `undefined`/qualquer idioma que não
comece por `pt` cai em `'en'`, incluindo o caso de deteção falhada
(decisão explícita: **inglês é o fallback do fallback**, não PT-PT,
invertendo o resto de `DEFAULT_SETTINGS`).

### 3. `Settings.language` + deteção no arranque

`lib/settings/settings.ts` ganha:

```ts
export type Locale = 'pt' | 'en'; // re-exportado de lib/i18n/types.ts
// Settings.language: Locale
// DEFAULT_SETTINGS.language = 'pt'
```

Dentro de `loadSettings()`, ao contrário dos outros campos (que usam
`pickValid` puro), `language` tem uma regra própria: se a chave não
existir no JSON guardado, ou não for um `Locale` válido, corre
`detectLocale(typeof navigator !== 'undefined' ? navigator.language :
undefined)` **e grava imediatamente** o resultado via `saveSettings`
antes de devolver — para a deteção só acontecer uma vez, mesmo que o
componente monte/desmonte várias vezes antes do utilizador alterar a
escolha em `/opções`. Isto cobre tanto visitantes novos (localStorage
vazio) como instalações antigas de antes desta feature (settings
guardadas, mas sem a chave `language`) — o mesmo tratamento para os dois
casos, sem lógica extra para os distinguir.

Isto é uma pequena impureza deliberada num ficheiro hoje só-leitura
(`loadSettings` passa a escrever, uma vez) — fica assinalada com
comentário no código, no mesmo espírito de outras exceções pragmáticas já
documentadas no projeto.

### 4. `useTranslation()` — sem Context novo

```ts
'use client';
export function useTranslation() {
  const { settings } = useSettings();
  return { t: DICTIONARIES[settings.language], locale: settings.language };
}
```

O único `React.Context` da app continua a ser o do `Toast` (decisão já
registada no `CLAUDE.md` — não é precedente para mais Context). `language`
é só mais um campo lido através do `useSettings()` já existente.

### 5. Ligação à UI

- **`/opções`**: o placeholder "Idioma" (`ComingSoonSection`) é
  substituído por um `ToggleGroup` real (2 opções — Português/English),
  igual ao padrão já usado para dificuldade/cor. Chama
  `updateSettings({ language })` + `toast.show(...)`, como qualquer outra
  opção nesta página.
- **`<html lang>`**: novo `components/LanguageSync/LanguageSync.tsx`
  (mesmo padrão do `ServiceWorkerRegistration.tsx` — sem UI própria,
  montado uma vez em `app/layout.tsx`). Um `useEffect` observa
  `settings.language` e atualiza `document.documentElement.lang`
  (`'pt-PT'`/`'en'`) — acontece sempre **depois** da hidratação, nunca
  durante, por isso não há risco do mismatch que este projeto já viu
  antes com outras leituras de estado client-only.
- **Todas as outras strings visíveis** (menus, `LearningPanel`,
  `GameEndModal`, `Toast`, `RulesModal`, `GameSetup`, `NavCard`,
  `LineTabs`, as páginas estáticas do tutorial) passam a ler `t` de
  `useTranslation()` em vez de texto literal no JSX.

### 6. Páginas Server Component — a exceção que não pode virar Client

`useTranslation()` é client-only (lê `localStorage` via `useSettings`).
Das 13 páginas em `app/`, 10 não têm `'use client'` hoje. Destas:

- **8 podem receber `'use client'` diretamente** — são JSX
  essencialmente estático, sem `generateStaticParams`/`metadata`:
  `aprender/page.tsx`, `configurar/page.tsx`,
  `aprender/regras-especiais/page.tsx`, `aprender/pecas/page.tsx`,
  `aprender/estrategia/page.tsx`, `aprender/fim-de-jogo/page.tsx`,
  `aprender/centipawns/page.tsx`, `aprender/aberturas/page.tsx`.
- **2 não podem** — `aprender/aberturas/[id]/page.tsx` e
  `.../praticar/page.tsx` exportam `generateStaticParams`, que exige
  Server Component. O texto hoje hardcoded nelas (título, descrição da
  abertura, botões "Voltar às aberturas"/"Praticar esta abertura") passa
  para um novo componente Client, `components/OpeningPageHeader/
  OpeningPageHeader.tsx`, que recebe a `Opening` inteira como prop e
  escolhe o idioma certo internamente via `useTranslation()`. O
  `page.tsx` continua Server Component, só delega a parte visível de
  texto.

### 7. Conteúdo bilingue — `lib/openings/`

`lib/openings/types.ts`: `OpeningMove.explanation`, `OpeningLine.name`,
`Opening.name`/`description` passam de `string` a `Record<Locale,
string>`. `replayLine.ts` só muda no formato do output —
`ReplayedMove.explanation` também vira `Record<Locale, string>`; a
lógica de jogo via `chess.js` é inteiramente agnóstica a idioma, não muda
nada aí.

`lib/openings/data.ts`: as ~220 explicações existentes ficam,
inalteradas, sob a chave `pt`; escreve-se o par `en` para cada uma. Dado
o histórico real desta base de dados (revisão da versão original
encontrou 2 erros factuais em 25 explicações — 2-em-25, taxa que implica
mais por auditar no resto), o inglês recebe o mesmo processo de revisão:
não é tradução literal, é confirmar que cada frase continua factualmente
correta face ao lance real jogado na linha.

### 8. Conteúdo bilingue — `lib/chess/moveExplanation.ts`

Em vez de strings fixas, os fragmentos de frase (`PIECE_NAME`,
`withArticle`, cada `clauses.push(...)`, `centipawnFeel`) passam a
tabelas `Record<Locale, ...>`. `describeMove`/`explainMoveQuality`
ganham um parâmetro novo, `locale: Locale`. Inglês não tem concordância
de género (`withArticle` simplifica para `'a'`/`'the'` fixo em EN), mas a
composição por cláusulas mantém-se idêntica — continua a combinar frases
feitas, nunca texto livre gerado, em qualquer dos dois idiomas.

Consumidores (`LearningPanel`, `OpeningStudy`, `OpeningPractice`) passam
a ler `locale` de `useTranslation()` e a repassá-lo a estas funções, em
vez de assumirem PT-PT implicitamente.

## Testes

- `detectLocale.test.ts` — novo, cobre `pt`/`pt-PT`/`pt-BR` → `'pt'`;
  `en`/`fr`/`undefined`/string vazia → `'en'`.
- `settings.test.ts` — casos novos: JSON guardado sem `language` →
  deteta e grava; JSON guardado com `language` válido → usa tal e qual,
  sem re-detetar; JSON guardado com `language` inválido → mesmo
  tratamento que "sem `language`".
- `useSettings.test.ts` — smoke test de que `updateSettings({ language:
  'en' })` propaga para `useTranslation()` (via `settings.language`).
- `data.test.ts` — novo teste que garante que todo `Record<Locale,
  string>` em `OPENINGS` tem as duas chaves `pt`/`en` preenchidas e
  não-vazias (rede de segurança em runtime, complementar ao que o
  TypeScript já obriga em tempo de compilação).
- `moveExplanation.test.ts` — duplica os casos existentes para os dois
  `locale`, mais casos novos específicos de inglês (ex.: sem
  concordância de género a verificar).
- **Testes existentes que já fazem asserções de texto PT-PT não mudam**
  — só passam a passar pelo dicionário `pt`, cujo conteúdo é
  byte-idêntico ao texto hardcoded que substituem. Qualquer teste que
  precisasse de mudar por causa desta migração seria sinal de que o
  dicionário `pt` divergiu do texto original — não é suposto acontecer.
- Verificação live (Chrome DevTools MCP, não só testes): trocar o idioma
  em `/opções` e confirmar que `/`, `/jogar`, `/aprender` e uma página de
  abertura mudam de texto sem reload; confirmar `document.documentElement
  .lang` a acompanhar a escolha; confirmar que uma instalação com
  settings antigas (sem `language`) deteta corretamente na primeira
  leitura.

## Documentação a atualizar

O `CLAUDE.md` documenta hoje `<html lang="pt-PT">` e `"lang": "pt-PT"`
(`manifest.json`) como convenções que **"devem manter-se assim"** — esta
entrega muda deliberadamente essa invariante para `<html lang>` (passa a
dinâmico via `LanguageSync`), mantendo-a intocada só para o `manifest.json`
(ver "Não-objetivos"). O plano de implementação deve atualizar essa secção
do `CLAUDE.md`, e acrescentar uma secção nova a documentar `lib/i18n/` —
mesmo padrão de todas as outras features desta dimensão já documentadas
lá (treino de aberturas, popup/toast, etc.).
