import React from 'react';

/**
 * Card do design system
 */
export function Cartao({ children, classeNome = '' }) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl ${classeNome}`}>
      {children}
    </div>
  );
}
