'use client';

import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageTitle } from '@/components/PageChrome/PageChrome';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { Opening } from '@/lib/openings/types';

/**
 * Extraído do próprio page.tsx porque esse ficheiro exporta
 * generateStaticParams e por isso não pode ganhar 'use client' — este
 * componente é que consome useTranslation(). Desde a Fase 3,
 * opening.name/description já são bilingues (lib/openings/data.ts).
 */
export function OpeningPageHeader({ opening, variant }: { opening: Opening; variant: 'study' | 'practice' }) {
  const { t, locale } = useTranslation();
  const name = opening.name[locale].toUpperCase();
  const title = variant === 'practice' ? `${t.openings.practicePrefix}${name}` : name;

  return (
    <div>
      <PageTitle>{title}</PageTitle>
      {variant === 'study' ? (
        <>
          <p className="mt-2 text-lilac/80">{opening.description[locale]}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <ChipButton color="purple" href="/aprender/aberturas">
              {t.openings.backToOpenings}
            </ChipButton>
            <ChipButton color="gold" href={`/aprender/aberturas/${opening.id}/praticar`}>
              {t.openings.practiceThisOpening}
            </ChipButton>
          </div>
        </>
      ) : (
        <p className="mt-3">
          <ChipButton color="purple" href={`/aprender/aberturas/${opening.id}`}>
            {t.openings.backToStudy}
          </ChipButton>
        </p>
      )}
    </div>
  );
}
