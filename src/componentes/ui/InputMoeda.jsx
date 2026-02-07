import React from 'react';

/** Valida e filtra apenas dígitos, vírgula e ponto */
function filtrarValorMoeda(v) {
  if (typeof v !== 'string') return '';
  return v.replace(/[^\d,.]/g, '').replace(/,/g, '.');
}

/**
 * Input para valores em reais com prefixo R$ e validação
 */
export function InputMoeda({ value, onChange, label, required = false, error, placeholder = '0,00', ...rest }) {
  const handleChange = (e) => {
    const raw = e.target.value;
    const filtrado = filtrarValorMoeda(raw);
    onChange({ target: { value: filtrado } });
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-3 block">{label}</label>
      )}
      <div
        className={`flex items-center bg-slate-950 border rounded-[1.5rem] overflow-hidden transition-colors duration-200 focus-within:ring-2 hover:border-slate-700 ${
          error
            ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20'
            : 'border-slate-800 focus-within:border-emerald-500 focus-within:ring-emerald-500/20'
        }`}
      >
        <span className="pl-5 text-slate-400 text-sm font-medium">R$</span>
        <input
          type="text"
          inputMode="decimal"
          value={value ?? ''}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          className={`flex-1 min-w-0 bg-transparent border-0 p-5 text-base font-black text-white outline-none placeholder:text-slate-600 ${
            error ? 'focus:ring-0' : ''
          }`}
          {...rest}
        />
      </div>
    </div>
  );
}
