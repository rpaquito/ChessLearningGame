import Link from 'next/link';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { OPENINGS } from '@/lib/openings/data';

export default function AberturasPage() {
  return (
    <main className="relative min-h-screen max-w-2xl mx-auto p-8 flex flex-col gap-6 overflow-hidden bg-ink">
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <div>
        <PageTitle>ABERTURAS</PageTitle>
        <p className="mt-3">
          <ChipButton color="purple" href="/aprender">
            Voltar ao tutorial
          </ChipButton>
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {OPENINGS.map((opening) => (
          <li key={opening.id}>
            <Link
              href={`/aprender/aberturas/${opening.id}`}
              className="block rounded-xl border-2 border-purple/40 bg-ink-soft p-4 transition-colors hover:border-cyan"
            >
              <p className="font-semibold text-white">{opening.name}</p>
              <p className="text-sm text-lilac/80">{opening.description}</p>
              <p className="text-xs text-lilac/60 mt-1">
                {opening.lines.map((line) => line.name).join(' · ')}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
