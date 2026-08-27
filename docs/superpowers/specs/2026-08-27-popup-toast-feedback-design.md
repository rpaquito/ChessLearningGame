# Sistema de popups/toasts de feedback — Design

Data: 2026-08-27

## Objetivo

Dar feedback visual explícito para eventos que hoje passam despercebidos
ou são pouco visíveis na app:

- Em `/jogar`: xeque, xeque-mate, vitória/derrota, empate e afogamento —
  hoje só refletidos num rótulo estático (`STATUS_LABEL[state.status]`)
  por cima do tabuleiro, sem qualquer destaque momentâneo.
- Em `/opções`: qualquer alteração de definição (dificuldade/cor por
  omissão, tema do tabuleiro, estilo das peças, imagem de fundo) —
  hoje aplicada silenciosamente via `updateSettings`, sem confirmação
  nenhuma ao utilizador.

Dois tratamentos distintos, decididos no brainstorming:

- **Toast** — pequeno, não bloqueia o jogo, dispensável manualmente
  (sem auto-dismiss). Usado para xeque e para as confirmações de
  `/opções`.
- **Modal de fim de jogo** — bloqueia interação, precisa de ser
  fechado explicitamente. Usado só para xeque-mate/vitória/derrota/
  empate/afogamento.

`/configurar` fica **fora de âmbito**: os seus botões de
dificuldade/cor já mostram o valor selecionado através do próprio
estilo ativo/inativo do toggle, e nunca chamam `updateSettings` (só
`/opções` persiste de facto — ver `CLAUDE.md`, secção "Menu
redesenhado") — não há ali nenhum "silêncio" real a corrigir.

## Não-objetivos

- **Sem auto-dismiss em nada.** Toast e modal fecham só por ação
  explícita do utilizador (botão ✕, ou as ações do modal). Decisão
  explícita do brainstorming — não há temporizador em lado nenhum
  desta entrega.
- **Sem fila/histórico de toasts.** Um único "toast atual" — um novo
  `show()` substitui instantaneamente o anterior, nunca há dois
  visíveis nem uma fila a escoar.
- **Sem popup de "lance ilegal".** Não existe, nesta UI de
  clique-para-mover, um momento real de "tentativa de lance inválido"
  — clicar numa casa não-alvo apenas troca a seleção ou não faz nada
  (`handleSquareClick` em `app/jogar/page.tsx`). Nada a sinalizar aqui.
- **Sem toasts em `/configurar`.** Ver "Objetivo" acima — já tem
  feedback visual suficiente (toggle ativo/inativo), e não persiste
  nada.
- **Sem substituir `STATUS_LABEL`.** O rótulo estático acima do
  tabuleiro em `/jogar` mantém-se exatamente como está — o toast/modal
  é um extra momentâneo, não uma substituição. Continua a ser o único
  sítio com o estado sempre visível (útil, por exemplo, depois de um
  toast de xeque já ter sido fechado).
- **Sem duplicar as ações do modal de fim de jogo nas definições.**
  `/opções` só usa o mecanismo de toast, nunca o modal — não há
  "eventos grandes" nesse ecrã.
- **Sem estilos distintos por resultado no modal.** Vitória, derrota e
  empate/afogamento usam o mesmo cartão visual — só o texto muda. Não
  há verde-para-vitória/vermelho-para-derrota nesta entrega.

## Arquitetura e componentes

Três componentes novos e uma função pura nova, seguindo a separação já
estabelecida no projeto entre `lib/` (lógica pura, testada) e
`components/` (apresentação):

```
components/
  Toast/
    ToastProvider.tsx   # Context global — único, ver secção seguinte
    useToast.ts          # useContext(ToastContext)
    Toast.tsx             # cartão de apresentação puro
  GameEndModal/
    GameEndModal.tsx     # local a /jogar, mesmo padrão do RulesModal
lib/chess/
  gameEndMessage.ts       # describeGameEnd() — função pura
  gameEndMessage.test.ts
```

### 1. `ToastProvider`/`useToast` — o único Context da app

Decisão explícita do brainstorming: em vez de cada página gerir o seu
próprio estado de toast, um único `React.Context` global, montado uma
vez em `app/layout.tsx`, torna `useToast()` chamável a partir de
qualquer componente cliente da árvore (hoje: `/jogar` para xeque,
`/opções` para confirmações de definições) sem prop-drilling. É o
**primeiro** Context da app — até agora todo o estado partilhado vive
em hooks por página (`useChessGame`, `useSettings`) — mas com âmbito
deliberadamente estreito (só o toast atual), não um precedente para
mover mais estado para Context.

```ts
// components/Toast/ToastProvider.tsx
'use client';

export type ToastTone = 'info' | 'check';

interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    // Novo toast substitui instantaneamente o anterior — sem fila.
    setToast({ id: Date.now(), message, tone });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  // `show` nunca muda de identidade (useCallback, sem dependências
  // reativas) — memorizar o objeto do Context com base nela garante
  // que a sua própria identidade também nunca muda. Sem isto, o
  // `{ show }` literal seria recriado a cada render do provider (ou
  // seja, a cada show()/dismiss()), obrigando **toda a app** — o
  // ToastProvider envolve `{children}` na raiz — a voltar a renderizar
  // de cada vez que um toast aparece ou desaparece.
  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast toast={toast} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
```

```ts
// components/Toast/useToast.ts
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast() só pode ser usado dentro de <ToastProvider>.');
  }
  return ctx;
}
```

`app/layout.tsx` (server component) passa a envolver `{children}`:

```tsx
<body className="antialiased">
  <ServiceWorkerRegistration />
  <ToastProvider>{children}</ToastProvider>
</body>
```

(`ToastProvider` é `'use client'`, tal como `ServiceWorkerRegistration`
já é — o `layout.tsx` em si continua a ser um Server Component sem
precisar de mudar.)

### 2. `Toast` — cartão de apresentação

Sem temporizador, sem animação de entrada. Fixo ao topo do ecrã,
`z-[60]` — acima do `z-50` do backdrop do `RulesModal`, para nunca
ficar escondido atrás de um modal aberto.

```tsx
// components/Toast/Toast.tsx
export interface ToastProps {
  toast: { id: number; message: string; tone: 'info' | 'check' } | null;
  onDismiss: () => void;
}

const TONE_ACCENT: Record<'info' | 'check', string> = {
  info: 'border-cyan',
  check: 'border-gold',
};

export function Toast({ toast, onDismiss }: ToastProps) {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3
        rounded-xl border-2 ${TONE_ACCENT[toast.tone]} bg-ink-soft px-4 py-2
        text-lilac shadow-[3px_3px_0_rgba(0,0,0,0.35)]`}
    >
      <p className="text-sm font-medium">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fechar"
        className="rounded-full h-6 w-6 shrink-0 bg-pink text-[#3A0B1F] font-bold hover:scale-110 transition-transform"
      >
        ✕
      </button>
    </div>
  );
}
```

Reutiliza os tokens de cor existentes (`cyan`/`gold`/`ink-soft`/
`lilac`/`pink`) — nenhuma cor nova introduzida. `role="status"` +
`aria-live="polite"` dá um sinal a leitores de ecrã sem interromper
(ao contrário de `aria-live="assertive"`, que seria excessivo para uma
confirmação de tema alterado).

### 3. `describeGameEnd` — função pura

```ts
// lib/chess/gameEndMessage.ts
import type { GameStatus } from './useChessGame';

export function describeGameEnd(
  status: GameStatus,
  mode: 'ai' | 'local',
  humanColor: 'w' | 'b',
  turn: 'w' | 'b'
): string | null {
  if (status === 'checkmate') {
    // `turn` é sempre o lado que está em xeque-mate (a jogar, sem
    // lances legais) — o vencedor é sempre o lado oposto.
    if (mode === 'ai') {
      return turn === humanColor ? 'Perdeste. Xeque-mate.' : 'Ganhaste! Xeque-mate.';
    }
    return turn === 'w' ? 'Xeque-mate! Vencem as pretas.' : 'Xeque-mate! Vencem as brancas.';
  }
  if (status === 'stalemate') return 'Empate por afogamento.';
  if (status === 'draw') return 'Empate.';
  return null;
}
```

Testado exaustivamente em `gameEndMessage.test.ts` sobre o espaço de
entradas pequeno e finito: xeque-mate × (`ai`+vitória, `ai`+derrota,
`local`+brancas vencem, `local`+pretas vencem), `stalemate`, `draw`. É
aqui que vive toda a lógica de qual frase mostrar — nem o modal nem a
página a recalculam.

### 4. `GameEndModal` — local a `/jogar`

Ao contrário do toast, **não** passa pelo Context — só `/jogar` o usa,
precisa de callbacks específicos da página (`onPlayAgain` chama o
`handleReset` já existente), e segue por isso o mesmo padrão
autocontido do `RulesModal` já existente (backdrop, `role="dialog"`,
`aria-modal`, fecho por Escape, botão ✕) em vez de ser globalizado.

```tsx
// components/GameEndModal/GameEndModal.tsx
export interface GameEndModalProps {
  open: boolean;
  status: GameStatus;
  mode: 'ai' | 'local';
  humanColor: 'w' | 'b';
  turn: 'w' | 'b';
  onClose: () => void;
  onPlayAgain: () => void;
}

export function GameEndModal({
  open,
  status,
  mode,
  humanColor,
  turn,
  onClose,
  onPlayAgain,
}: GameEndModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  const title = describeGameEnd(status, mode, humanColor, turn);
  if (!title) return null;

  return (
    <div
      data-testid="game-end-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border-2 border-purple bg-ink-soft p-6 text-lilac"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <PageTitle as="h2" size="text-xl" strokeWidth={1}>
            {title}
          </PageTitle>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full h-8 w-8 shrink-0 bg-pink text-[#3A0B1F] font-bold hover:scale-110 transition-transform"
          >
            ✕
          </button>
        </div>
        <div className="flex gap-3">
          <ChipButton color="pink" onClick={onPlayAgain}>
            Jogar de novo
          </ChipButton>
          <ChipButton color="purple" href="/">
            Menu inicial
          </ChipButton>
        </div>
      </div>
    </div>
  );
}
```

Fechar com ✕/Escape/clique no backdrop deixa o tabuleiro exatamente
como estava — a fila de `ChipButton` já existente no fundo da página
("Menu inicial"/"Reiniciar partida"/"Regras") continua disponível e
funcional, sem qualquer alteração.

## Ligação em `/jogar`

```ts
const toast = useToast();
const [gameEndOpen, setGameEndOpen] = useState(false);
const prevStatus = useRef<GameStatus>('playing');

useEffect(() => {
  if (state.status === prevStatus.current) return;
  prevStatus.current = state.status;

  if (state.status === 'check') {
    toast.show('Xeque!', 'check');
  } else if (
    state.status === 'checkmate' ||
    state.status === 'stalemate' ||
    state.status === 'draw'
  ) {
    setGameEndOpen(true);
  }
}, [state.status, toast]);
```

`handleReset` ganha duas linhas extra: `setGameEndOpen(false)` e
`prevStatus.current = 'playing'` — sem isto, recomeçar uma partida a
partir de um xeque-mate deixaria `gameEndOpen` preso a `true` (o
`useEffect` só dispara em *mudanças* de `state.status`, e o reset volta
sempre a `'playing'`, que já teria sido o valor anterior a um xeque
nunca disparado, portanto sem transição a detetar).

`GameEndModal` é montado incondicionalmente perto do `RulesModal`
existente:

```tsx
<GameEndModal
  open={gameEndOpen}
  status={state.status}
  mode={mode}
  humanColor={humanColor}
  turn={state.turn}
  onClose={() => setGameEndOpen(false)}
  onPlayAgain={() => {
    handleReset();
  }}
/>
```

(`handleReset` já limpa `gameEndOpen`/`prevStatus`, ver acima — o
`onPlayAgain` não precisa de fazer mais nada além de a chamar.)

## Ligação em `/opções`

Cada `updateSettings(...)` já existente ganha uma linha de toast ao
lado, texto literal por cada um dos 5 pontos — sem abstração extra,
mantendo o estilo plano já usado neste ficheiro:

```ts
const toast = useToast();

// dificuldade
onClick={() => {
  updateSettings({ defaultDifficulty: level });
  toast.show('Dificuldade por omissão alterada.');
}}

// cor
onClick={() => {
  updateSettings({ defaultColor: value });
  toast.show('Cor por omissão alterada.');
}}

// tema do tabuleiro
onChange={(boardTheme) => {
  updateSettings({ boardTheme });
  toast.show('Tema do tabuleiro alterado.');
}}

// estilo das peças
onChange={(pieceStyle) => {
  updateSettings({ pieceStyle });
  toast.show('Estilo das peças alterado.');
}}

// fundo
onChange={(backgroundTheme) => {
  updateSettings({ backgroundTheme });
  toast.show('Imagem de fundo alterada.');
}}
```

## Cópia (PT-PT) — resumo

| Evento | Mecanismo | Texto |
|---|---|---|
| Xeque | Toast (`tone: 'check'`) | "Xeque!" |
| Dificuldade por omissão alterada | Toast (`tone: 'info'`) | "Dificuldade por omissão alterada." |
| Cor por omissão alterada | Toast (`tone: 'info'`) | "Cor por omissão alterada." |
| Tema do tabuleiro alterado | Toast (`tone: 'info'`) | "Tema do tabuleiro alterado." |
| Estilo das peças alterado | Toast (`tone: 'info'`) | "Estilo das peças alterado." |
| Fundo alterado | Toast (`tone: 'info'`) | "Imagem de fundo alterada." |
| Xeque-mate, modo IA, utilizador perde | Modal | "Perdeste. Xeque-mate." |
| Xeque-mate, modo IA, utilizador ganha | Modal | "Ganhaste! Xeque-mate." |
| Xeque-mate, modo local, brancas vencem | Modal | "Xeque-mate! Vencem as brancas." |
| Xeque-mate, modo local, pretas vencem | Modal | "Xeque-mate! Vencem as pretas." |
| Afogamento | Modal | "Empate por afogamento." |
| Empate (outras regras) | Modal | "Empate." |

## Testes

- `lib/chess/gameEndMessage.test.ts` — cobertura exaustiva das 6
  combinações da tabela acima que passam pelo modal.
- `components/Toast/Toast.test.tsx` — renderiza mensagem + acento de
  cor por `tone`; botão ✕ chama `onDismiss`; `toast === null` não
  renderiza nada.
- `components/Toast/ToastProvider.test.tsx` (via um consumidor de
  teste que chama `useToast()`) — `show()` torna o toast visível; uma
  segunda chamada a `show()` enquanto um toast está visível substitui-o
  instantaneamente (nunca dois ao mesmo tempo, nunca uma fila); fechar
  limpa o estado; `useToast()` fora de `<ToastProvider>` lança o erro
  esperado.
- `components/GameEndModal/GameEndModal.test.tsx` — título correto por
  combinação de `status`/`mode`/`humanColor`/`turn`; `open={false}` ou
  `describeGameEnd` a devolver `null` não renderiza nada; ✕/Escape/
  clique no backdrop chamam só `onClose` (nunca `onPlayAgain`); "Jogar
  de novo" chama `onPlayAgain`; "Menu inicial" é um link real para
  `/`. Usar sempre `fireEvent.click()`, nunca `.click()` cru — ver a
  armadilha já documentada em `CLAUDE.md` sobre React 19 e
  atualizações de estado pós-clique.
- **Sem novos ficheiros de teste de página** para `/jogar`/`/opções` —
  nenhuma das duas tem um hoje, e a lógica real (frases, substituição
  de toast, condições de abertura do modal) já fica coberta nos
  testes de componente/lib acima. Verificação final feita ao vivo no
  browser (Chrome DevTools MCP / `claude-in-chrome`): xeque → toast,
  xeque-mate → modal, "Jogar de novo"/"Reiniciar partida" → ambos
  desaparecem, clique numa definição em `/opções` → toast — hábito já
  estabelecido no histórico do projeto de nunca confiar só no diff.

## Erros e casos-limite

- **Troca de linha/reset a meio de um xeque.** `prevStatus.current` é
  reposto para `'playing'` em `handleReset`, tal como `state.status`
  em si — nunca fica dessincronizado.
- **`describeGameEnd` devolve `null`** (status `'playing'` ou
  `'check'` passado por engano) — `GameEndModal` trata isso como "não
  renderizar nada", nunca um cartão vazio.
- **`useToast()` chamado fora do `ToastProvider`** — lança um erro
  explícito em vez de falhar silenciosamente; como o provider é
  montado uma vez no `layout.tsx` raiz, isto só aconteceria por um
  erro de integração (um teste de componente isolado que não envolve
  o consumidor em `<ToastProvider>`), nunca em produção.
- **Toast global entre navegações.** Como o `ToastProvider` vive no
  `layout.tsx`, o seu estado sobrevive a uma navegação client-side
  entre páginas (ex.: `/opções` → `/`) mas **não** a um reload
  completo — comportamento aceitável e não persistido de propósito
  (tal como a UI auxiliar do modo de aprendizagem em `/jogar`, que já
  não sobrevive a um reload do service worker, ver `CLAUDE.md`).
