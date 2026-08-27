'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Toast, type ToastState, type ToastTone } from './Toast';

interface ToastContextValue {
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

/**
 * Único Context da app (decisão explícita do brainstorming — ver
 * docs/superpowers/specs/2026-08-27-popup-toast-feedback-design.md) —
 * montado uma vez em app/layout.tsx para que useToast() esteja
 * disponível em qualquer página cliente (hoje: /jogar e /opções) sem
 * prop-drilling.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    // Novo toast substitui instantaneamente o anterior — nunca há fila.
    setToast({ id: nextToastId++, message, tone });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  // `show`/`dismiss` nunca mudam de identidade (useCallback, sem
  // dependências reativas) — memorizar o objeto do Context com base
  // nelas garante que a sua própria identidade também nunca muda. Isto
  // não poupa a app de voltar a renderizar (React já ignora `{children}`
  // por ser um elemento com identidade estável, memo ou não) — o que
  // isto poupa é `app/jogar/page.tsx`, cujo `useEffect` de xeque/fim de
  // jogo depende do objeto `toast` devolvido por `useToast()`: sem esta
  // memorização, esse array de dependências veria um objeto novo a cada
  // render do provider e o efeito voltaria a correr sem motivo.
  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

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
