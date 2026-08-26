import { notFound } from 'next/navigation';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow, PageTitle } from '@/components/PageChrome/PageChrome';
import { OPENINGS } from '@/lib/openings/data';
import { OpeningStudy } from '@/components/OpeningStudy/OpeningStudy';

export async function generateStaticParams() {
  return OPENINGS.map((opening) => ({ id: opening.id }));
}

export default async function OpeningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opening = OPENINGS.find((o) => o.id === id);
  if (!opening) notFound();

  return (
    <main className="relative min-h-screen max-w-2xl mx-auto p-8 flex flex-col gap-6 overflow-hidden bg-ink">
      <PageGlow position="fixed" pinkOpacity={0.2} />
      <div>
        <PageTitle>{opening.name.toUpperCase()}</PageTitle>
        <p className="mt-2 text-lilac/80">{opening.description}</p>
        <p className="mt-3">
          <ChipButton color="purple" href="/aprender/aberturas">
            Voltar às aberturas
          </ChipButton>
        </p>
      </div>
      <OpeningStudy key={opening.id} opening={opening} />
    </main>
  );
}
