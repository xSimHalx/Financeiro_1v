import React from 'react';

const variantes = {
  default: 'bg-slate-800 text-slate-400',
  success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
};

/**
 * Badge para status e rótulos
 */
export function Etiqueta({ children, variante = 'default' }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-md text-[9px] md:text-[10px] font-black uppercase tracking-wider ${variantes[variante]}`}
    >
      {children}
    </span>
  );
}
