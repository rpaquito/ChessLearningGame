'use client';

import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { ACTIVE_TOGGLE_STYLE } from '@/lib/ui/activeToggleStyle';

/**
 * Tablist partilhado por OpeningStudy e OpeningPractice — era markup
 * quase byte-idêntico duplicado nos dois (ver backlog "opening trainer",
 * item extraction candidate). Dona também do `role="tabpanel"` que
 * envolve `children`: o conteúdo passado (tabuleiro + controlos +
 * explicação) É o painel associado à linha selecionada, por isso vive
 * dentro deste componente em vez de o consumidor ter de repetir o
 * `id`/`aria-labelledby` sozinho.
 *
 * Padrão ARIA APG "tabs" com ativação automática: mover o foco com as
 * setas já seleciona a linha (não precisa de Enter/Espaço a seguir),
 * `tabIndex` em rodízio (só o tab ativo é alcançável por Tab, as setas
 * saltam entre os outros) — nenhum dos dois sítios tinha isto antes,
 * só `role="tab"`/`aria-selected` estático.
 */
export function LineTabs({
  lines,
  activeIndex,
  onSelect,
  children,
}: {
  lines: { name: string }[];
  activeIndex: number;
  onSelect: (index: number) => void;
  children: ReactNode;
}) {
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function focusAndSelect(index: number) {
    onSelect(index);
    tabRefs.current[index]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % lines.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + lines.length) % lines.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = lines.length - 1;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    focusAndSelect(nextIndex);
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 justify-center" role="tablist" aria-label="Linhas desta abertura">
        {lines.map((line, index) => (
          <button
            key={line.name}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            id={`${baseId}-tab-${index}`}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-controls={`${baseId}-panel`}
            tabIndex={index === activeIndex ? 0 : -1}
            onClick={() => focusAndSelect(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            style={index === activeIndex ? ACTIVE_TOGGLE_STYLE : undefined}
            className={`rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-transform hover:scale-[1.02] ${
              index === activeIndex ? 'border-transparent shadow-[3px_3px_0_rgba(0,0,0,0.35)]' : 'border-purple/40 text-lilac'
            }`}
          >
            {line.name}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${activeIndex}`}
        tabIndex={-1}
        className="contents"
      >
        {children}
      </div>
    </>
  );
}
