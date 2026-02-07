import React from 'react';

/**
 * Input reutilizável com label, estados de focus/erro e prefixo opcional
 */
export function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  error,
  prefix,
  inputMode,
  className = '',
  ...rest
}) {
  const baseInput = 'w-full bg-slate-950 border rounded-[1.5rem] p-5 text-white outline-none placeholder:text-slate-600 transition-colors duration-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';
  const errorInput = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-800';
  const inputEl = (
    <input
      type={type}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      inputMode={inputMode}
      className={`${baseInput} ${errorInput} ${prefix ? 'pl-12' : ''} ${className}`}
      {...rest}
    />
  );

  return (
    <div className="space-y-1">
      {label && (
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-3 block">{label}</label>
      )}
      {prefix ? (
        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">{prefix}</span>
          {inputEl}
        </div>
      ) : (
        inputEl
      )}
    </div>
  );
}
