import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OpeningPageHeader } from './OpeningPageHeader';
import type { Opening } from '@/lib/openings/types';

const opening: Opening = {
  id: 'italiana',
  name: 'Abertura Italiana',
  description: 'Uma abertura clássica.',
  lines: [],
};

// Sem beforeEach próprio: o hook global de vitest.setup.ts já limpa o
// localStorage, reseta a cache de settings e semeia language: 'pt' antes de
// cada teste — repetir esse clear aqui apagaria a semente de 'pt' sem a
// repor, fazendo detectLocale() cair em 'en' (fallback do fallback, ver
// lib/i18n/detectLocale.ts) dentro do jsdom.
describe('OpeningPageHeader', () => {
  it('mostra o nome/descrição da abertura e os dois botões, variante "study"', () => {
    render(<OpeningPageHeader opening={opening} variant="study" />);
    expect(screen.getByText('ABERTURA ITALIANA')).toBeInTheDocument();
    expect(screen.getByText('Uma abertura clássica.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar às aberturas' })).toHaveAttribute(
      'href',
      '/aprender/aberturas'
    );
    expect(screen.getByRole('link', { name: 'Praticar esta abertura' })).toHaveAttribute(
      'href',
      '/aprender/aberturas/italiana/praticar'
    );
  });

  it('mostra o botão "Voltar ao estudo", variante "practice"', () => {
    render(<OpeningPageHeader opening={opening} variant="practice" />);
    expect(screen.getByText('PRATICAR: ABERTURA ITALIANA')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao estudo' })).toHaveAttribute(
      'href',
      '/aprender/aberturas/italiana'
    );
  });
});
