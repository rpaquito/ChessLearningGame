'use client';

import { ACTIVE_TOGGLE_STYLE } from '@/lib/ui/activeToggleStyle';

export interface ToggleGroupOption<T extends string> {
  value: T;
  label: string;
}

export interface ToggleGroupProps<T extends string> {
  legend: string;
  options: ToggleGroupOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Grupo de botões toggle (dificuldade/cor) — o mesmo bloco existia
 * duplicado byte a byte em GameSetup.tsx e app/opcoes/page.tsx (2 grupos
 * cada, 4 cópias no total), diferindo só na legenda, nas opções, no
 * valor atual e no onChange. Extraído aqui; quem chama continua livre
 * para meter lógica própria (ex.: `/opções` chama `updateSettings` +
 * `toast.show(...)` dentro do seu próprio `onChange`, este componente
 * não sabe nada disso). `capitalize` é seguro sempre — texto já com
 * maiúscula inicial (ex. "Brancas") não muda com este CSS.
 */
export function ToggleGroup<T extends string>({ legend, options, value, onChange }: ToggleGroupProps<T>) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-medium mb-1 text-white">{legend}</legend>
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            style={value === option.value ? ACTIVE_TOGGLE_STYLE : undefined}
            className={`flex-1 rounded-xl border-2 px-3 py-2 capitalize font-semibold transition-transform hover:scale-[1.02] ${
              value === option.value
                ? 'border-transparent shadow-[3px_3px_0_rgba(0,0,0,0.35)]'
                : 'border-purple/40 text-lilac'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
