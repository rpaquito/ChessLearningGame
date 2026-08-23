# Biblioteca de Temas Visuais (Tabuleiro + Fundo) — Design

Data: 2026-08-23

## Objetivo

Substituir duas das quatro secções "Brevemente" de `/opcoes` — "Tema do
tabuleiro" e "Imagem de fundo" — por escolhas reais e persistentes: mais
uma textura de tabuleiro (além do carvalho já existente) e mais uma
imagem de fundo (além da já existente), com um seletor visual (miniaturas
clicáveis) em `/opcoes`. O fundo escolhido passa a aplicar-se também ao
ecrã de jogo (`/jogar`), que hoje não tem nenhum.

Este é o segundo dos sub-projetos identificados em
`docs/superpowers/specs/2026-08-22-menu-settings-redesign-design.md`
("biblioteca de temas visuais") — mas com o âmbito reduzido a
tabuleiro+fundo (ver Não-objetivos); "estilo das peças" e "idioma"
continuam "Brevemente".

## Não-objetivos

- **Sem estilo de peças novo.** `components/ChessBoard/PieceIcon.tsx`
  não muda — `CLAUDE.md` documenta a razão (SVG desenhado à mão é a
  única forma que já se provou fiável entre dispositivos; arte gerada
  por IA precisaria de ser redesenhada à mão em vetor, não usada
  diretamente). "Estilo das peças" continua "Brevemente".
- **Sem internacionalização.** "Idioma" continua "Brevemente".
- **Sem migração de dados.** `loadSettings()` já valida campo a campo
  com fallback individual — os dois campos novos seguem exatamente o
  mesmo padrão, por isso uma `Settings` guardada antes desta alteração
  continua a carregar sem erros (só sem os campos novos, que caem nos
  valores por omissão).
- **Sem alterar o contrato de `/configurar`** — dificuldade/cor
  continuam a ser as únicas definições pré-preenchidas ali; tema do
  tabuleiro e fundo aplicam-se sempre a partir das Definições guardadas,
  sem equivalente "só para esta partida".

## Arquitetura e componentes

### 1. `lib/settings/settings.ts` — dois campos novos

```ts
export type BoardTheme = 'carvalho' | 'ebano-bordo';
export type BackgroundTheme = 'classico' | 'noturno';

export interface Settings {
  defaultDifficulty: Difficulty;
  defaultColor: PlayerColor;
  boardTheme: BoardTheme;
  backgroundTheme: BackgroundTheme;
}

export const DEFAULT_SETTINGS: Settings = {
  defaultDifficulty: 'facil',
  defaultColor: 'white',
  boardTheme: 'carvalho',
  backgroundTheme: 'classico',
};
```

`loadSettings()` ganha `isBoardTheme()`/`isBackgroundTheme()`, seguindo
exatamente o padrão de `isDifficulty()`/`isPlayerColor()` já existente
(lista de valores válidos, fallback individual por campo). `saveSettings()`
não muda — já serializa o objeto inteiro.

`ebano-bordo` (ébano e bordo/maple) é o novo tema de tabuleiro: um par de
alto contraste (quase preto / quase branco) para contrastar com o
carvalho quente já existente. `noturno` é o novo fundo: mesma direção de
arte "premium chess club" do fundo já existente (`classico`), mas uma
variante de cor/humor diferente — continua "muito subtil, escuro,
desfocado, baixo contraste" (mesma exigência já documentada em
`CLAUDE.md` para o fundo do menu), para que texto/tiles por cima
continuem legíveis.

### 2. `lib/settings/themes.ts` (novo) — registo único de assets

```ts
export interface BoardThemeInfo {
  label: string;
  light: string;
  dark: string;
}
export interface BackgroundThemeInfo {
  label: string;
  image: string;
}

export const BOARD_THEMES: Record<BoardTheme, BoardThemeInfo> = {
  carvalho: {
    label: 'Carvalho',
    light: '/board/light-square.webp',
    dark: '/board/dark-square.webp',
  },
  'ebano-bordo': {
    label: 'Ébano e bordo',
    light: '/board/ebano-bordo-light-square.webp',
    dark: '/board/ebano-bordo-dark-square.webp',
  },
};

export const BACKGROUND_THEMES: Record<BackgroundTheme, BackgroundThemeInfo> = {
  classico: { label: 'Clássico', image: '/menu/background.webp' },
  noturno: { label: 'Noturno', image: '/menu/background-noturno.webp' },
};
```

Módulo puro, sem estado — importado por `/opcoes` (para desenhar o
seletor) e pelos três sítios que hoje resolvem um caminho de imagem
diretamente: `ChessBoard.tsx`, `app/page.tsx`, `app/jogar/page.tsx`. É o
único sítio onde um caminho de asset de tema é escrito — evita que os
caminhos fiquem espalhados/duplicados pelos consumidores.

### 3. `components/ChessBoard/ChessBoard.tsx` — textura configurável

`SQUARE_TEXTURE` (constante fixa) sai; entra uma prop nova:

```ts
boardTheme?: BoardTheme; // default: 'carvalho'
```

resolvida com `BOARD_THEMES[boardTheme]`. O valor por omissão mantém
**exatamente** o comportamento atual para qualquer chamador que não passe
a prop — as quatro demos estáticas em `/aprender` continuam sem alterações
(não precisam de saber que temas existem). `app/jogar/page.tsx` passa
`boardTheme={settings.boardTheme}` a partir de `useSettings()`.

### 4. Fundo em `app/page.tsx` e `app/jogar/page.tsx`

Ambos os ecrãs passam a ler `settings.backgroundTheme` (via
`useSettings()`) e resolver `BACKGROUND_THEMES[tema].image`.

- `app/page.tsx`: já tem um fundo (`background.webp` fixo); passa a ser
  o valor resolvido do tema em vez do caminho fixo — mudança mecânica.
- `app/jogar/page.tsx`: **não tem fundo hoje.** Para não arriscar a
  regra "o tabuleiro tem de caber sempre no ecrã visível"
  (`CLAUDE.md`), o fundo entra como uma camada própria
  `fixed inset-0 -z-10` (posicionamento fora do fluxo do documento,
  atrás de tudo) — não ocupa espaço, não pode empurrar o tabuleiro nem
  introduzir scroll novo. `useSettings()` já trata a leitura seguro-para-
  -hidratação (valor por omissão no primeiro render, valor real só num
  `useEffect`) — reutilizado tal e qual, sem tratamento especial para
  `/jogar`.

### 5. `app/opcoes/page.tsx` — seletores visuais

As duas `<ComingSoonSection title="Tema do tabuleiro" />` e
`<ComingSoonSection title="Imagem de fundo" />` são substituídas por um
novo componente partilhado, `ThemePicker` (definido no próprio
`page.tsx`, não exportado — só usado aqui):

```tsx
function ThemePicker<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { id: T; label: string; previewImage: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-medium mb-1">{legend}</legend>
      <div className="flex gap-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            aria-pressed={value === opt.id}
            className={`flex flex-col items-center gap-1 rounded-md border p-1 ${
              value === opt.id ? 'border-emerald-600 ring-2 ring-emerald-600' : 'border-stone-300'
            }`}
          >
            <span
              className="h-16 w-16 rounded bg-cover bg-center"
              style={{ backgroundImage: `url(${opt.previewImage})` }}
            />
            <span className="text-xs">{opt.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
```

Miniatura do tema de tabuleiro usa `BOARD_THEMES[id].light` como preview
(a casa clara é a mais reconhecível ao ver de relance); tema de fundo usa
`BACKGROUND_THEMES[id].image` diretamente. Mesmo padrão de interação
(`aria-pressed`, destaque emerald) que dificuldade/cor já usam — só troca
o conteúdo do botão de texto por uma miniatura + legenda.

"Estilo das peças" e "Idioma" continuam exatamente como
`ComingSoonSection`.

### 6. Assets novos (via Draw Things — ver `CLAUDE.md`)

- `public/board/ebano-bordo-light-square.webp` /
  `-dark-square.webp` — par de alto contraste (bordo pálido quase
  branco / ébano quase preto), textura de madeira lisa/tileable,
  iluminação plana sem sombras (mesmas exigências já documentadas para
  o par carvalho/nogueira). Pipeline igual: gerar, `sips -Z 384`,
  `cwebp -q 85`.
- `public/menu/background-noturno.webp` — variante de humor/cor do
  fundo "premium chess club" já existente, mantendo baixo contraste e
  desfoque. Pipeline igual ao `background.webp` original: `sips -Z 1200`,
  `cwebp -q 85`.

## Testes

- `lib/settings/settings.test.ts`: casos novos para `boardTheme`/
  `backgroundTheme` — valor válido preservado, valor inválido/ausente
  cai no omisso, sem afetar os outros campos (mesmo padrão dos testes
  já existentes para `defaultDifficulty`/`defaultColor`).
- `lib/settings/themes.test.ts` (novo, pequeno): cada valor do tipo
  `BoardTheme`/`BackgroundTheme` tem uma entrada correspondente em
  `BOARD_THEMES`/`BACKGROUND_THEMES` — evita que os dois fiquem
  dessincronizados no futuro.
- `components/ChessBoard/ChessBoard.test.tsx`: um caso novo confirmando
  que mudar a prop `boardTheme` muda os caminhos de imagem usados pelas
  casas (e que omitir a prop mantém o tema `carvalho` atual).

## Erros e casos-limite

- **Tema desconhecido nos dados** (ex.: `Settings` gravada por uma versão
  futura com um tema que esta versão não conhece): já coberto pelo
  padrão de validação existente — `loadSettings()` rejeita o valor e
  cai no omisso, tal como já acontece hoje para `defaultDifficulty`/
  `defaultColor`.
- **Imagem de tema ainda não em cache** (primeira visita offline): mesma
  rede de segurança que já existe para o tema `carvalho` — classes
  `bg-amber-100`/`bg-amber-700` de fallback em `ChessBoard.tsx`
  continuam a aplicar-se independentemente do tema escolhido, e o fundo
  novo em `/jogar` usa uma cor de fallback equivalente (`bg-stone-900`)
  por baixo da camada de imagem.
