import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Select reutilizável com label e estilo consistente com Input
 */
export function Select({
  label,
  value,
  onChange,
  options = [],
  placeholder,
  required = false,
  error,
  className = '',
  ...rest
}) {
  const baseSelect =
    'w-full bg-slate-950 border rounded-[1.5rem] p-5 text-xs text-white outline-none appearance-none cursor-pointer pr-12 transition-colors duration-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 hover:border-slate-700';
  const errorSelect = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-800';

  return (
    <div className="space-y-1">
      {label && (
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-3 block">{label}</label>
      )}
      <div className="relative">
        <select
          value={value ?? ''}
          onChange={onChange}
          required={required}
          className={`${baseSelect} ${errorSelect} ${className}`}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lbl = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={val ?? 'nenhum'} value={val ?? ''}>
                {lbl}
              </option>
            );
          })}
        </select>
        <ChevronDown
          size={18}
          className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"
        />
      </div>
    </div>
  );
}
