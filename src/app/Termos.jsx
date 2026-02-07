import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

/**
 * Página estática: Termos de Uso
 */
export default function Termos() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-500 text-sm font-bold uppercase tracking-widest mb-8 transition-colors"
        >
          <ArrowLeft size={18} /> Voltar
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <FileText className="w-8 h-8 text-emerald-500" />
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Termos de Uso</h1>
        </div>
        <div className="prose prose-invert prose-slate max-w-none space-y-6 text-sm text-slate-400">
          <p className="text-slate-300">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}.
          </p>
          <section>
            <h2 className="text-slate-200 font-black text-base uppercase tracking-wider mt-8 mb-3">1. Aceitação</h2>
            <p>
              Ao acessar e usar o VertexAds Financeiro (“Serviço”), você concorda com estes Termos de Uso. Se não concordar, não utilize o Serviço.
            </p>
          </section>
          <section>
            <h2 className="text-slate-200 font-black text-base uppercase tracking-wider mt-8 mb-3">2. Uso do Serviço</h2>
            <p>
              O Serviço destina-se à gestão financeira pessoal e empresarial. Você é responsável pela veracidade dos dados informados e pelo uso adequado da plataforma, em conformidade com a legislação aplicável.
            </p>
          </section>
          <section>
            <h2 className="text-slate-200 font-black text-base uppercase tracking-wider mt-8 mb-3">3. Conta e Segurança</h2>
            <p>
              Você deve manter o sigilo de suas credenciais de acesso. Não compartilhe sua senha. A responsabilidade por atividades realizadas em sua conta é sua.
            </p>
          </section>
          <section>
            <h2 className="text-slate-200 font-black text-base uppercase tracking-wider mt-8 mb-3">4. Dados e Privacidade</h2>
            <p>
              O tratamento de dados pessoais está descrito na nossa <Link to="/privacidade" className="text-emerald-500 hover:text-emerald-400 font-bold">Política de Privacidade</Link>.
            </p>
          </section>
          <section>
            <h2 className="text-slate-200 font-black text-base uppercase tracking-wider mt-8 mb-3">5. Alterações</h2>
            <p>
              Podemos alterar estes Termos a qualquer momento. O uso continuado do Serviço após alterações constitui aceitação das novas condições.
            </p>
          </section>
        </div>
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-wrap gap-4">
          <Link to="/" className="text-emerald-500 hover:text-emerald-400 text-xs font-bold uppercase tracking-widest">
            Entrar
          </Link>
          <Link to="/privacidade" className="text-slate-500 hover:text-slate-400 text-xs font-bold uppercase tracking-widest">
            Política de Privacidade
          </Link>
        </div>
      </div>
    </div>
  );
}
