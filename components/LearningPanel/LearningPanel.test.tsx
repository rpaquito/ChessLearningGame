import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LearningPanel } from './LearningPanel';

const noop = () => {};

describe('LearningPanel', () => {
  it('shows the suggestion explanation to a premium user', () => {
    render(
      <LearningPanel
        enabled
        onToggle={noop}
        onRequestSuggestion={noop}
        isPremium
        hasSuggestion
        suggestionExplanation="Captura o cavalo e dá xeque."
      />
    );
    expect(screen.getByText(/Captura o cavalo e dá xeque\./)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Entra ou contacta-nos' })).not.toBeInTheDocument();
  });

  it('shows an upsell link instead of the suggestion explanation to a free user', () => {
    render(
      <LearningPanel
        enabled
        onToggle={noop}
        onRequestSuggestion={noop}
        isPremium={false}
        hasSuggestion
        suggestionExplanation="Captura o cavalo e dá xeque."
      />
    );
    expect(screen.queryByText(/Captura o cavalo e dá xeque\./)).not.toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Entra ou contacta-nos' });
    expect(link).toHaveAttribute('href', '/entrar');
  });

  it('shows the move-quality explanation to a premium user', () => {
    render(
      <LearningPanel
        enabled
        onToggle={noop}
        onRequestSuggestion={noop}
        isPremium
        lastMoveQuality="erro"
        lastMoveExplanation="Foi um erro: perdeste cerca de 250 centipawns de vantagem."
      />
    );
    expect(
      screen.getByText(/Foi um erro: perdeste cerca de 250 centipawns de vantagem\./)
    ).toBeInTheDocument();
  });

  it('shows an upsell link instead of the move-quality explanation to a free user', () => {
    render(
      <LearningPanel
        enabled
        onToggle={noop}
        onRequestSuggestion={noop}
        isPremium={false}
        lastMoveQuality="erro"
        lastMoveExplanation="Foi um erro: perdeste cerca de 250 centipawns de vantagem."
      />
    );
    expect(
      screen.queryByText(/Foi um erro: perdeste cerca de 250 centipawns de vantagem\./)
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entra ou contacta-nos' })).toBeInTheDocument();
  });

  it('does not show an upsell when there is no explanation to gate', () => {
    render(
      <LearningPanel
        enabled
        onToggle={noop}
        onRequestSuggestion={noop}
        isPremium={false}
        hasSuggestion
        suggestionExplanation={null}
      />
    );
    expect(screen.queryByRole('link', { name: 'Entra ou contacta-nos' })).not.toBeInTheDocument();
  });
});
