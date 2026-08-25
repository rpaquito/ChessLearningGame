'use client';

import { useEffect } from 'react';

export interface RulesModalProps {
  open: boolean;
  onClose: () => void;
}

const SECTIONS: { title: string; items: { title: string; text: string }[] }[] = [
  {
    title: 'Como as peças se movem',
    items: [
      { title: 'Peão', text: 'Anda uma casa em frente (duas no primeiro lance) e captura na diagonal.' },
      { title: 'Cavalo', text: 'Move-se em "L". É a única peça que salta por cima de outras.' },
      { title: 'Bispo', text: 'Move-se livremente na diagonal, sempre na mesma cor de casa.' },
      { title: 'Torre', text: 'Move-se livremente na horizontal ou na vertical.' },
      { title: 'Dama', text: 'Combina o movimento da torre com o do bispo.' },
      {
        title: 'Rei',
        text: 'Move-se uma casa em qualquer direção. Nunca pode ir para uma casa atacada pelo adversário.',
      },
    ],
  },
  {
    title: 'Regras especiais',
    items: [
      {
        title: 'Roque',
        text:
          'O rei e uma torre movem-se em conjunto, uma única vez por partida — só é permitido se nenhuma das ' +
          'duas peças já se tiver mexido, não houver peças entre elas e o rei não estiver em xeque nem passar ' +
          'por uma casa atacada.',
      },
      {
        title: 'En passant',
        text:
          'Se um peão adversário andar duas casas e ficar ao lado de um peão teu, podes capturá-lo como se ' +
          'tivesse andado só uma casa — mas apenas no lance seguinte.',
      },
      {
        title: 'Promoção',
        text:
          'Quando um peão chega à última fileira, é promovido a qualquer peça (exceto rei) — normalmente a dama.',
      },
    ],
  },
  {
    title: 'Fim de jogo',
    items: [
      {
        title: 'Xeque',
        text: 'O rei está sob ataque direto. Tens de sair do xeque logo no lance seguinte.',
      },
      {
        title: 'Xeque-mate',
        text: 'Um xeque sem escapatória — o jogo termina de imediato e quem dá o mate vence.',
      },
      {
        title: 'Afogamento (empate)',
        text: 'Quando não estás em xeque, mas não tens nenhum lance legal disponível.',
      },
      {
        title: 'Outros empates',
        text:
          'Repetição tripla da mesma posição, regra dos 50 lances sem captura nem movimento de peão, ou ' +
          'material insuficiente no tabuleiro para dar mate.',
      },
    ],
  },
  {
    title: 'Modo de aprendizagem',
    items: [
      {
        title: 'Centipawns',
        text:
          'É a unidade que o motor de xadrez usa para avaliar uma posição — 100 centipawns valem cerca de ' +
          'um peão. Perder poucos é normal; perder uma centena ou mais costuma significar que havia uma ' +
          'jogada bastante melhor disponível.',
      },
    ],
  },
];

export function RulesModal({ open, onClose }: RulesModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      data-testid="rules-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      {/* text-stone-900 explícito no próprio painel: sem isto, o `dt` de
          cada item (só "font-medium", sem cor própria) herdava o
          --foreground quase branco que globals.css define sob
          prefers-color-scheme:dark, invisível sobre este bg-white — a
          mesma falha já corrigida em LearningPanel.tsx. Definir a cor
          aqui em vez de em cada elemento protege qualquer texto futuro
          que também se esqueça de a definir. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Regras do xadrez"
        onClick={(event) => event.stopPropagation()}
        className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-md bg-white p-6 text-stone-900"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold text-stone-900">Regras do xadrez</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-md px-2 py-1 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h3 className="mb-2 font-semibold text-stone-800">{section.title}</h3>
              <dl className="flex flex-col gap-2">
                {section.items.map((item) => (
                  <div key={item.title}>
                    <dt className="font-medium">{item.title}</dt>
                    <dd className="text-sm text-stone-600">{item.text}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
