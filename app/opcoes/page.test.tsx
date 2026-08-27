import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastProvider } from '@/components/Toast/ToastProvider';
import OpcoesPage from './page';

// Regressão: mudar de pt -> en tem de mostrar o toast de confirmação já no
// INGLÊS (a nova língua), não no português (a língua antiga, ainda ativa no
// `t` capturado pelo closure do handler no momento em que corre). Ver
// CLAUDE.md / relatório desta correção para o porquê exato (updateSettings
// agenda um re-render que só acontece depois de toast.show() correr no
// mesmo handler síncrono).
describe('OpcoesPage — toast do seletor de idioma', () => {
  it('mostra a confirmação em inglês ao mudar de português para inglês', () => {
    render(
      <ToastProvider>
        <OpcoesPage />
      </ToastProvider>
    );

    // vitest.setup.ts semeia 'pt' por omissão — o rótulo "English" é igual
    // nos dois dicionários, por isso o botão existe independentemente do
    // idioma ativo no momento do render.
    fireEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(screen.getByRole('status')).toHaveTextContent('Language changed.');
  });
});
