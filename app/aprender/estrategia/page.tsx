import Link from 'next/link';

const PRINCIPLES = [
  {
    title: 'Controlar o centro',
    text: 'As casas centrais (d4, e4, d5, e5) dão às tuas peças mais mobilidade e influência sobre o tabuleiro. Ocupar ou controlar o centro logo nos primeiros lances.',
  },
  {
    title: 'Desenvolver as peças',
    text: 'Tirar cavalos e bispos das casas iniciais cedo, antes de mover a mesma peça várias vezes ou sair a caçar peões sem necessidade.',
  },
  {
    title: 'Proteger o rei',
    text: 'Fazer o roque cedo para colocar o rei a salvo atrás de uma fileira de peões, especialmente antes de abrir o jogo no centro.',
  },
  {
    title: 'Não perder material de graça',
    text: 'Antes de cada lance, confirmar que nenhuma peça tua ficou pendurada (atacada e sem defesa suficiente).',
  },
  {
    title: 'Pensar em ameaças antes de atacar',
    text: 'Perguntar-se o que o adversário quer fazer no próximo lance antes de decidir o teu — muitas peças perdem-se por ignorar a resposta do oponente.',
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
