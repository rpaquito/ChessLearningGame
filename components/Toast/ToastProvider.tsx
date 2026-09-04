'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Toast, type ToastState, type ToastTone } from './Toast';

interface ToastContextValue {
  toast: ToastState | null;
  show: (message: string, tone?: ToastTone) => void;
  dismiss: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Contador monótono em vez de Date.now(): duas chamadas a show() no mesmo
// milissegundo (plausível — ex.: /opções, clicar em fácil → médio →
// difícil em sucessão rápida) geravam o mesmo id, o que colidia com o
// key={toast.id} do Toast.tsx e podia silenciosamente deixar de forçar o
// remonte quando a mensagem repetida também coincidia — reintroduzindo o
// próprio bug que esse key existe para evitar.
let nextToastId = 0;

// Toasts "info" (confirmações de /opções: dificuldade, cor, tema, etc.)
// desaparecem sozinhos ao fim deste tempo se ninguém os fechar antes —
// decisão explícita revista em 2026-08-28 (a versão original do
// popup/toast tinha "sem auto-dismiss em nada" como decisão deliberada;
// esta revisão distingue por tom). Toasts "check" (aviso de xeque em
// /jogar) e os três tons de qualidade de lance ("boa"/"imprecisao"/
// "erro", ver Toast.tsx) ficam de fora de propósito: bloqueiam o
// tabuleiro até serem fechados manualmente (ver app/jogar/page.tsx, que
// lê `toast.tone` para decidir `interactive` e para atrasar o lance da
// IA), por isso nunca podem desaparecer sozinhos — desaparecer sozinhos
// desbloquearia o tabuleiro (ou deixaria a IA jogar) antes de o jogador
// ter reconhecido o xeque/feedback do lance.
const AUTO_DISMISS_MS = 4000;
const NO_AUTO_DISMISS_TONES: readonly ToastTone[] = ['check', 'boa', 'imprecisao', 'erro'];

/**
 * Único Context da app (decisão explícita do brainstorming — ver
 * docs/superpowers/specs/2026-08-27-popup-toast-feedback-design.md) —
 * montado uma vez em app/layout.tsx para que useToast() esteja
 * disponível em qualquer página cliente sem prop-drilling.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoDismissTimer = useCallback(() => {
    if (autoDismissTimer.current !== null) {
      clearTimeout(autoDismissTimer.current);
      autoDismissTimer.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearAutoDismissTimer();
    setToast(null);
  }, [clearAutoDismissTimer]);

  const show = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      // Substitui instantaneamente qualquer toast/temporizador anterior —
      // nunca há fila, e um show() novo cancela sempre o auto-dismiss do
      // toast que estava a ser mostrado antes dele.
      clearAutoDismissTimer();
      setToast({ id: nextToastId++, message, tone });
      if (!NO_AUTO_DISMISS_TONES.includes(tone)) {
        autoDismissTimer.current = setTimeout(() => {
          autoDismissTimer.current = null;
          setToast(null);
        }, AUTO_DISMISS_MS);
      }
    },
    [clearAutoDismissTimer]
  );

  // Ao contrário da versão anterior (só `show`/`dismiss`, memorizados para
  // nunca mudar de identidade), `value` agora muda sempre que `toast`
  // muda — de propósito: consumidores como app/jogar/page.tsx precisam de
  // reagir ao toast atual (ex.: bloquear o tabuleiro enquanto
  // `toast?.tone === 'check'`). `show`/`dismiss` continuam estáveis
  // (useCallback sem dependências reativas).
  const value = useMemo(() => ({ toast, show, dismiss }), [toast, show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast toast={toast} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast() só pode ser usado dentro de <ToastProvider>.');
  }
  return ctx;
}
