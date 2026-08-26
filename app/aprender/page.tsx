import Link from 'next/link';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';

const TOPICS = [
  { href: '/aprender/pecas', title: 'Como as peças se movem', description: 'O movimento de cada peça, do peão ao rei.' },
  { href: '/aprender/regras-especiais', title: 'Regras especiais', description: 'Roque, en passant e promoção do peão.' },
  { href: '/aprender/fim-de-jogo', title: 'Fim de jogo', description: 'Xeque, xeque-mate, afogamento e empates.' },
  { href: '/aprender/estrategia', title: 'Princípios de estratégia', description: 'Ideias básicas para jogar melhor desde a abertura.' },
];

export default function AprenderPage() {
  return (
    <main className="relative min-h-screen max-w-2xl mx-auto p-8 flex flex-col gap-6 overflow-hidden bg-ink">
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <div>
        <PageTitle>APRENDA A JOGAR XADREZ</PageTitle>
        <p className="mt-3">
          <ChipButton color="purple" href="/">
            Voltar para o início
          </ChipButton>
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {TOPICS.map((topic) => (
          <li key={topic.href}>
            <Link
              href={topic.href}
              className="block rounded-xl border-2 border-purple/40 bg-ink-soft p-4 transition-colors hover:border-cyan"
            >
              <p className="font-semibold text-white">{topic.title}</p>
              <p className="text-sm text-lilac/80">{topic.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
