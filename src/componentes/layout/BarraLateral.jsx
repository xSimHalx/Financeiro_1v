import React from 'react';
import { Wallet, LayoutDashboard, FileText, Repeat, CreditCard, Users, TrendingUp, Trash2, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../store/ProviderAuth.jsx';

const itensMenu = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Livro Caixa', icon: FileText },
  { id: 'recorrentes', label: 'Recorrências', icon: Repeat },
  { id: 'accounts', label: 'Minhas Contas', icon: CreditCard },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'investimentos', label: 'Investimentos', icon: TrendingUp },
  { id: 'trash', label: 'Lixeira', icon: Trash2 },
  { id: 'config', label: 'Configurações', icon: Settings }
];

/**
 * Sidebar de navegação
 */
export function BarraLateral({ visualizacaoAtual, aoMudarVisualizacao, menuAberto, aoFecharMenu }) {
  const { user, logout } = useAuth();
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[60] w-72 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
        menuAberto ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-8 h-full flex flex-col">
        <div className="flex items-center gap-3 text-emerald-500 mb-10">
          <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <Wallet size={28} />
          </div>
          <span className="text-xl font-black tracking-tighter text-white uppercase">
            Vertex<span className="text-emerald-500">Ads</span>
          </span>
        </div>
        <nav className="space-y-1 flex-1">
          {itensMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                aoMudarVisualizacao(item.id);
                aoFecharMenu?.();
              }}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all font-bold text-sm ${
                visualizacaoAtual === item.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                  : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="pt-4 mt-auto border-t border-slate-800">
          {user && (
            <p className="px-5 py-2 text-slate-500 text-xs font-bold truncate" title={user.email}>
              {user.nome || user.email}
            </p>
          )}
          <button
            type="button"
            onClick={() => { aoFecharMenu?.(); logout(); }}
            className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold text-sm text-slate-500 hover:bg-slate-800 hover:text-slate-200 transition-all"
          >
            <LogOut size={20} /> Sair
          </button>
        </div>
      </div>
    </aside>
  );
}
