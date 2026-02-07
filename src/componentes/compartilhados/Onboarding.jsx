import React, { useState, useEffect } from 'react';
import { X, Wallet, LayoutDashboard, FileText, ArrowRight } from 'lucide-react';

const ONBOARDING_KEY = 'vertexads_onboarding';

export function Onboarding({ userId, onClose }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const key = `${ONBOARDING_KEY}_${userId}`;
    try {
      const done = localStorage.getItem(key);
      if (!done) setVisible(true);
    } catch (_) {}
  }, [userId]);

  const handleClose = () => {
    if (userId) {
      try {
        localStorage.setItem(`${ONBOARDING_KEY}_${userId}`, '1');
      } catch (_) {}
    }
    setVisible(false);
    onClose?.();
  };

  if (!visible) return null;

  const steps = [
    {
      icon: Wallet,
      title: 'Bem-vindo ao VertexAds',
      text: 'Aqui você controla entradas, saídas, recorrências e acompanha tudo pelo Dashboard.'
    },
    {
      icon: LayoutDashboard,
      title: 'Dashboard e Minhas Contas',
      text: 'No Dashboard você vê resumo, gráficos e insights. Em Minhas Contas, confira o saldo de cada conta.'
    },
    {
      icon: FileText,
      title: 'Livro Caixa',
      text: 'Adicione lançamentos no Livro Caixa. Use filtros por categoria, status e método de pagamento.'
    }
  ];

  const current = steps[step];
  const Icon = current?.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              {Icon && <Icon className="w-8 h-8 text-emerald-500" />}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-slate-500 hover:text-slate-300 p-1 rounded-lg transition-colors"
              aria-label="Fechar"
            >
              <X size={22} />
            </button>
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">
            {current?.title}
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            {current?.text}
          </p>
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full w-6 transition-colors ${
                    i === step ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-colors"
              >
                Próximo <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-colors"
              >
                Começar
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="mt-4 w-full text-slate-500 hover:text-slate-400 text-xs font-bold uppercase tracking-widest transition-colors"
          >
            Pular tour
          </button>
        </div>
      </div>
    </div>
  );
}
