/**
 * Estilo do botão "ativo" nos grupos de seleção toggle da app (dificuldade/
 * cor em GameSetup e /opcoes, botão "Sugerir jogada" do LearningPanel) —
 * um só valor partilhado em vez de repetir o mesmo gradiente à mão em cada
 * ficheiro. Inline em vez de bg-gradient-to-br do Tailwind: mais seguro do
 * que depender do nome exato da utility (renomeada nalgumas versões do
 * Tailwind v4).
 */
export const ACTIVE_TOGGLE_STYLE = {
  background: 'linear-gradient(135deg, #00E5FF, #4EA8DE)',
  color: '#0B2E30',
};
