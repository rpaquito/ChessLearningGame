'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Toast, type ToastState, type ToastTone } from './Toast';

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

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
    setToast({ id: Date.now(), message, tone });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  // `show` nunca muda de identidade (useCallback, sem dependências
  // reativas) — memorizar o valor do Context com base nela garante que
  // a sua própria identidade também nunca muda. Sem isto, `{ show }`
  // seria recriado a cada render do provider (ou seja, a cada
  // show()/dismiss()), obrigando toda a app — o ToastProvider envolve
  // `{children}` na raiz — a voltar a renderizar de cada vez que um
  // toast aparece ou desaparece.
  const value = useMemo(() => ({ show }), [show]);

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
