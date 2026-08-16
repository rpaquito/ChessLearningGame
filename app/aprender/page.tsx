import Link from 'next/link';

const TOPICS = [
  { href: '/aprender/pecas', title: 'Como as peças se movem', description: 'O movimento de cada peça, do peão ao rei.' },
  { href: '/aprender/regras-especiais', title: 'Regras especiais', description: 'Roque, en passant e promoção do peão.' },
  { href: '/aprender/fim-de-jogo', title: 'Fim de jogo', description: 'Xeque, xeque-mate, afogamento e empates.' },
  { href: '/aprender/estrategia', title: 'Princípios de estratégia', description: 'Ideias básicas para jogar melhor desde a abertura.' },
];

export default function AprenderPage() {
  return (
    <main className="min-h-screen max-w-2xl mx-auto p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Aprenda a jogar xadrez</h1>
        <p className="text-stone-600 mt-2">
          <Link href="/" className="underline text-sky-700">
            Voltar para o início
          </Link>
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {TOPICS.map((topic) => (
          <li key={topic.href}>
            <Link
              href={topic.href}
              className="block rounded-md border border-stone-200 p-4 hover:bg-stone-50"
            >
              <p className="font-semibold">{topic.title}</p>
              <p className="text-sm text-stone-600">{topic.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
