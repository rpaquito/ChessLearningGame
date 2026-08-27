import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Foco preso dentro de um modal enquanto está aberto — sem dependência
 * externa, usado por RulesModal e GameEndModal (ambos já bloqueiam o
 * `<main>` por trás visualmente via backdrop, mas até aqui não impediam
 * teclado/leitor de ecrã de continuar a navegar o tabuleiro por baixo).
 *
 * Ao abrir: move o foco para o próprio painel (não para o primeiro botão
 * lá dentro — evitar aterrar logo num botão de ação, ex. "Fechar",
 * onde um Enter por engano já fecharia o modal). Tab/Shift+Tab passam a
 * andar em ciclo só pelos elementos focáveis do painel. Ao fechar,
 * devolve o foco a quem o tinha antes de abrir.
 *
 * Não define `inert`/`aria-hidden` no resto da página — nenhum dos dois
 * modais é renderizado via portal, por isso "o resto da página" não tem
 * uma raiz única e simples de marcar a partir daqui; ficou fora do
 * âmbito desta entrega.
 */
export function useFocusTrap(open: boolean) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open]);

  return panelRef;
}
