import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';

// Cores dos badges espelham exatamente QUALITY_BADGE_CLASS em
// components/LearningPanel/LearningPanel.tsx — a ideia é que quem lê esta
// página reconheça de imediato o mesmo badge que vê a jogar.
const CONCEPTS = [
  {
    title: 'O que é um centipawn',
    text: 'O motor (Stockfish) mede o quão boa é uma posição em centipawns — centésimos do valor de um peão. Uma vantagem de "+100" é, grosso modo, "vales um peão a mais"; "+300" ronda o valor de uma peça menor.',
  },
  {
    title: 'Perda de centipawns',
    text: 'A cada lance, o modo de aprendizagem compara a avaliação do melhor lance possível com a avaliação do lance que jogaste, ambas do teu ponto de vista. A diferença é a "perda" desse lance — nunca é negativa: jogar tão bem como (ou melhor que) a referência do motor conta como perda zero.',
  },
];

const QUALITY_LEVELS = [
  {
    label: 'Boa jogada',
    badgeClass: 'bg-emerald-900/60 text-emerald-200',
    text: 'Perda até 30 centipawns — praticamente ao nível do melhor lance disponível.',
  },
  {
    label: 'Imprecisão',
    badgeClass: 'bg-amber-900/60 text-amber-200',
    text: 'Perda entre 31 e 100 centipawns — um lance que cede uma pequena vantagem, sem ser grave.',
  },
  {
    label: 'Erro',
    badgeClass: 'bg-red-900/60 text-red-200',
    text: 'Perda acima de 100 centipawns — um lance que troca uma vantagem real, por exemplo perder material ou uma posição muito melhor.',
  },
];

export default function CentipawnsPage() {
  return (
    <main className="relative min-h-screen max-w-2xl mx-auto p-8 flex flex-col gap-6 overflow-hidden bg-ink">
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <div>
        <PageTitle>AVALIAÇÃO E CENTIPAWNS</PageTitle>
        <p className="mt-3">
          <ChipButton color="purple" href="/aprender">
            Voltar ao tutorial
          </ChipButton>
        </p>
      </div>
      <ul className="flex flex-col gap-4">
        {CONCEPTS.map((concept) => (
          <li key={concept.title} className="rounded-xl border-2 border-purple/40 bg-ink-soft p-4">
            <p className="font-semibold text-white">{concept.title}</p>
            <p className="text-lilac/80 mt-1">{concept.text}</p>
          </li>
        ))}
      </ul>
      <div>
        <p className="font-semibold text-white mb-3">Os três níveis que vês durante uma partida</p>
        <ul className="flex flex-col gap-3">
          {QUALITY_LEVELS.map((level) => (
            <li key={level.label} className="rounded-xl border-2 border-purple/40 bg-ink-soft p-4 flex flex-col gap-2">
              <span className={`self-start rounded-full px-3 py-1 text-sm font-semibold ${level.badgeClass}`}>
                {level.label}
              </span>
              <p className="text-lilac/80">{level.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
