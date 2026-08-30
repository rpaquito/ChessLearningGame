import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LearningPanel } from './LearningPanel';

const noop = () => {};

describe('LearningPanel', () => {
  it('shows the suggestion explanation', () => {
    render(
      <LearningPanel
        enabled
        onToggle={noop}
        onRequestSuggestion={noop}
        hasSuggestion
        suggestionExplanation="Captura o cavalo e dá xeque."
      />
    );
    expect(screen.getByText(/Captura o cavalo e dá xeque\./)).toBeInTheDocument();
  });

  it('shows nothing extra when there is no explanation yet', () => {
    render(
      <LearningPanel
        enabled
        onToggle={noop}
        onRequestSuggestion={noop}
        hasSuggestion
        suggestionExplanation={null}
      />
    );
    expect(screen.getByText(/Jogada sugerida destacada em verde no tabuleiro\./)).toBeInTheDocument();
  });
});
