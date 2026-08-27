import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LineTabs } from './LineTabs';

const lines = [{ name: 'Linha A' }, { name: 'Linha B' }, { name: 'Linha C' }];

describe('LineTabs', () => {
  it('gives only the active tab tabIndex 0, the rest -1 (roving tabindex)', () => {
    render(
      <LineTabs lines={lines} activeIndex={1} onSelect={() => {}}>
        <p>conteúdo</p>
      </LineTabs>
    );
    expect(screen.getByRole('tab', { name: 'Linha A' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('tab', { name: 'Linha B' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Linha C' })).toHaveAttribute('tabindex', '-1');
  });

  it('moves focus and selection with ArrowRight/ArrowLeft, wrapping at the ends', () => {
    const onSelect = vi.fn();
    render(
      <LineTabs lines={lines} activeIndex={0} onSelect={onSelect}>
        <p>conteúdo</p>
      </LineTabs>
    );

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Linha A' }), { key: 'ArrowRight' });
    expect(onSelect).toHaveBeenCalledWith(1);

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Linha A' }), { key: 'ArrowLeft' });
    expect(onSelect).toHaveBeenCalledWith(2); // wraps para a última
  });

  it('Home/End movem para a primeira/última aba', () => {
    const onSelect = vi.fn();
    render(
      <LineTabs lines={lines} activeIndex={1} onSelect={onSelect}>
        <p>conteúdo</p>
      </LineTabs>
    );

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Linha B' }), { key: 'End' });
    expect(onSelect).toHaveBeenLastCalledWith(2);

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Linha B' }), { key: 'Home' });
    expect(onSelect).toHaveBeenLastCalledWith(0);
  });

  it('associates the tabpanel with the active tab via aria-labelledby', () => {
    render(
      <LineTabs lines={lines} activeIndex={1} onSelect={() => {}}>
        <p>conteúdo</p>
      </LineTabs>
    );
    const panel = screen.getByRole('tabpanel');
    const activeTab = screen.getByRole('tab', { name: 'Linha B' });
    expect(panel).toHaveAttribute('aria-labelledby', activeTab.id);
  });
});
