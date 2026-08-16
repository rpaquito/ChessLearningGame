import Link from 'next/link';

const PRINCIPLES = [
  {
    title: 'Controle o centro',
    text: 'As casas centrais (d4, e4, d5, e5) dão às suas peças mais mobilidade e influência sobre o tabuleiro. Ocupe ou controle o centro logo nos primeiros lances.',
  },
  {
    title: 'Desenvolva suas peças',
    text: 'Tire cavalos e bispos de suas casas iniciais cedo, antes de mover a mesma peça várias vezes ou sair caçando peões sem necessidade.',
  },
  {
    title: 'Proteja o rei',
    text: 'Roque cedo para colocar o rei a salvo atrás de uma fileira de peões, especialmente antes de abrir o jogo no centro.',
  },
  {
    title: 'Não perca material de graça',
    text: 'Antes de cada lance, confirme que nenhuma peça sua ficou pendurada (atacada e sem defesa suficiente).',
  },
  {
    title: 'Pense em ameaças antes de atacar',
    text: 'Pergunte-se o que o adversário quer fazer no próximo lance antes de decidir o seu — muitas peças são perdidas por ignorar a resposta do oponente.',
  },
];

export default function EstrategiaPage() {
  return (
    <main className="min-h-screen max-w-2xl mx-auto p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Princípios de estratégia</h1>
        <p className="text-stone-600 mt-2">
          <Link href="/aprender" className="underline text-sky-700">
            Voltar ao tutorial
          </Link>
        </p>
      </div>
      <ul className="flex flex-col gap-4">
        {PRINCIPLES.map((principle) => (
          <li key={principle.title} className="rounded-md border border-stone-200 p-4">
            <p className="font-semibold">{principle.title}</p>
            <p className="text-stone-600 mt-1">{principle.text}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
