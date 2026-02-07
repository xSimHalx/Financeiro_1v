import React, { useState, useEffect, useRef } from 'react';

/**
 * Converte YYYY-MM-DD (ISO) para DD/MM/YYYY (exibição BR)
 */
function isoParaBR(iso) {
  if (!iso || iso.length < 10) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
}

/**
 * Converte DD/MM/YYYY (BR) para YYYY-MM-DD (ISO)
 */
function brParaIso(br) {
  if (!br || br.length < 10) return '';
  const partes = br.replace(/\D/g, '').match(/^(\d{2})(\d{2})(\d{4})$/);
  if (!partes) return '';
  const [, d, m, y] = partes;
  const dia = parseInt(d, 10);
  const mes = parseInt(m, 10) - 1;
  const ano = parseInt(y, 10);
  if (mes < 0 || mes > 11 || dia < 1 || dia > 31) return '';
  const data = new Date(ano, mes, dia);
  if (data.getFullYear() !== ano || data.getMonth() !== mes || data.getDate() !== dia) return '';
  return `${y}-${m}-${d}`;
}

/**
 * Aplica máscara DD/MM/YYYY enquanto o usuário digita
 */
function aplicarMascara(valor) {
  const nums = valor.replace(/\D/g, '').slice(0, 8);
  if (nums.length <= 2) return nums;
  if (nums.length <= 4) return `${nums.slice(0, 2)}/${nums.slice(2)}`;
  return `${nums.slice(0, 2)}/${nums.slice(2, 4)}/${nums.slice(4)}`;
}

/**
 * Input de data no formato DD/MM/YYYY (BR).
 * O value e onChange usam YYYY-MM-DD internamente.
 */
export function InputData({ label, value, onChange, required = false, error, className = '', ...rest }) {
  const [display, setDisplay] = useState(() => isoParaBR(value));
  const userTypingRef = useRef(false);

  useEffect(() => {
    if (!userTypingRef.current) setDisplay(isoParaBR(value));
    userTypingRef.current = false;
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value;
    const mascarado = aplicarMascara(raw);
    userTypingRef.current = true;
    setDisplay(mascarado);
    const iso = brParaIso(mascarado);
    onChange({ target: { value: iso } });
  };

  const baseInput =
    'w-full bg-slate-950 border rounded-[1.5rem] p-5 text-white outline-none placeholder:text-slate-600 transition-colors duration-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';
  const errorInput = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-800';

  return (
    <div className="space-y-1">
      {label && (
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-3 block">{label}</label>
      )}
      <input
        type="text"
        value={display}
        onChange={handleChange}
        placeholder="DD/MM/AAAA"
        required={required}
        inputMode="numeric"
        maxLength={10}
        pattern={required ? '\\d{2}/\\d{2}/\\d{4}' : undefined}
        title={required ? 'Informe a data no formato DD/MM/AAAA' : undefined}
        className={`${baseInput} ${errorInput} ${className}`}
        {...rest}
      />
    </div>
  );
}
