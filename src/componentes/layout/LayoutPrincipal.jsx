import React from 'react';
import { BarraLateral } from './BarraLateral';
import { Cabecalho } from './Cabecalho';
import { MenuMobile } from './MenuMobile';

/**
 * Layout principal: sidebar + main + header + menu mobile
 */
export function LayoutPrincipal({
  titulo,
  mesAtual,
  aoMudarMes,
  visualizacaoContexto,
  aoMudarContexto,
  visualizacaoAtual,
  aoMudarVisualizacao,
  mesPickerAberto,
  aoAbrirFecharMesPicker,
  menuMobileAberto,
  aoAlterarMenuMobile,
  transacoesPendentes,
  notificacoesAberto,
  aoAbrirNotificacoes,
  aoFecharNotificacoes,
  aoEditarTransacao,
  aoAbrirLancamento,
  children
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row font-sans selection:bg-emerald-500/30 overflow-hidden">
      <BarraLateral
        visualizacaoAtual={visualizacaoAtual}
        aoMudarVisualizacao={aoMudarVisualizacao}
        menuAberto={menuMobileAberto}
        aoFecharMenu={() => aoAlterarMenuMobile(false)}
      />
      {menuMobileAberto && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[55] md:hidden"
          onClick={() => aoAlterarMenuMobile(false)}
          aria-hidden
        />
      )}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Cabecalho
          titulo={titulo}
          mesAtual={mesAtual}
          aoMudarMes={aoMudarMes}
          visualizacaoContexto={visualizacaoContexto}
          aoMudarContexto={aoMudarContexto}
          mesPickerAberto={mesPickerAberto}
          aoAbrirFecharMesPicker={aoAbrirFecharMesPicker}
          transacoesPendentes={transacoesPendentes}
          notificacoesAberto={notificacoesAberto}
          aoAbrirNotificacoes={aoAbrirNotificacoes}
          aoFecharNotificacoes={aoFecharNotificacoes}
          aoEditarTransacao={aoEditarTransacao}
          aoAbrirLancamento={aoAbrirLancamento}
          aoAbrirMenuMobile={() => aoAlterarMenuMobile(true)}
        />
        <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 pb-32 md:pb-12 bg-slate-950">
          {children}
        </div>
      </main>
      <MenuMobile
        visualizacaoAtual={visualizacaoAtual}
        aoMudarVisualizacao={aoMudarVisualizacao}
        aoAbrirLancamento={aoAbrirLancamento}
      />
    </div>
  );
}
