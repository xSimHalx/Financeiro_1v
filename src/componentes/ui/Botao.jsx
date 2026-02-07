import React from 'react';

/**
 * Botão reutilizável (variantes: primary, secondary, danger, ghost)
 */
export function Botao({
  children,
  tipo = 'button',
  variante = 'primary',
  classeNome = '',
  desabilitado = false,
  aoClicar,
  ...rest
}) {
  const base = 'rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all active:scale-95 disabled:opacity-50';
  const variantes = {
    primary: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white'
  };
  return (
    <button
      type={tipo}
      className={`${base} ${variantes[variante]} ${classeNome}`}
      disabled={desabilitado}
      onClick={aoClicar}
      {...rest}
    >
      {children}
    </button>
  );
}
