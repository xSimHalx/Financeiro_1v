import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

/**
 * Página estática: Política de Privacidade (LGPD/GDPR)
 */
export default function Privacidade() {
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
          <Shield className="w-8 h-8 text-emerald-500" />
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Política de Privacidade</h1>
        </div>
        <div className="prose prose-invert prose-slate max-w-none space-y-6 text-sm text-slate-400">
          <p className="text-slate-300">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}.
          </p>
          <section>
            <h2 className="text-slate-200 font-black text-base uppercase tracking-wider mt-8 mb-3">1. Responsável</h2>
            <p>
              O VertexAds Financeiro é responsável pelo tratamento dos dados pessoais que você nos fornece ao utilizar o Serviço, em conformidade com a LGPD (Lei Geral de Proteção de Dados) e demais normas aplicáveis.
            </p>
          </section>
          <section>
            <h2 className="text-slate-200 font-black text-base uppercase tracking-wider mt-8 mb-3">2. Dados Coletados</h2>
            <p>
              Coletamos: (a) dados de cadastro (nome, e-mail, senha criptografada); (b) dados financeiros que você insere (transações, recorrências, categorias, contas) para oferecer a funcionalidade do produto. Não vendemos seus dados.
            </p>
          </section>
          <section>
            <h2 className="text-slate-200 font-black text-base uppercase tracking-wider mt-8 mb-3">3. Finalidade e Base Legal</h2>
            <p>
              Os dados são utilizados para prestar o Serviço, autenticar usuários, sincronizar informações entre dispositivos e cumprir obrigações legais. A base legal é a execução de contrato e o legítimo interesse.
            </p>
          </section>
          <section>
            <h2 className="text-slate-200 font-black text-base uppercase tracking-wider mt-8 mb-3">4. Compartilhamento</h2>
            <p>
              Seus dados podem ser processados por infraestrutura em nuvem (hospedagem) necessária à operação do Serviço. Exigimos que esses provedores respeitem a confidencialidade e a segurança dos dados.
            </p>
          </section>
          <section>
            <h2 className="text-slate-200 font-black text-base uppercase tracking-wider mt-8 mb-3">5. Seus Direitos</h2>
            <p>
              Você pode solicitar acesso, correção, exclusão ou portabilidade dos seus dados, e revogar consentimentos quando aplicável. Entre em contato pelo e-mail de suporte indicado no Serviço.
            </p>
          </section>
          <section>
            <h2 className="text-slate-200 font-black text-base uppercase tracking-wider mt-8 mb-3">6. Segurança e Retenção</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus dados. Mantemos os dados enquanto sua conta estiver ativa e conforme a lei exigir.
            </p>
          </section>
        </div>
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-wrap gap-4">
          <Link to="/" className="text-emerald-500 hover:text-emerald-400 text-xs font-bold uppercase tracking-widest">
            Entrar
          </Link>
          <Link to="/termos" className="text-slate-500 hover:text-slate-400 text-xs font-bold uppercase tracking-widest">
            Termos de Uso
          </Link>
        </div>
      </div>
    </div>
  );
}
