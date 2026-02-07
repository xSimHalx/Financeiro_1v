import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ArrowRight, Lock, Mail, Activity, User, Fingerprint } from 'lucide-react';
import { useAuth } from '../store/ProviderAuth.jsx';

const GoogleIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const cardFaceStyle = {
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%'
};

export default function Login() {
  const { login, register } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setErro(err?.message || 'E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErro('');
    if (password !== confirmPassword) {
      setErro('As senhas não coincidem.');
      return;
    }
    if (password.length < 8) {
      setErro('Senha deve ter no mínimo 8 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name);
    } catch (err) {
      setErro(err?.message || 'Cadastro falhou.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setErro('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setErro('Login com Google em breve.');
    }, 800);
  };

  const handleGoogleSignup = () => {
    setErro('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setErro('Cadastro com Google em breve.');
    }, 800);
  };

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-slate-950 relative font-sans selection:bg-emerald-500/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] bg-blue-600/10 rounded-full blur-[100px] animate-pulse-slow animation-delay-1000" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="z-10 w-[90%] max-w-3xl mx-auto flex flex-col flex-1 min-h-0 py-[1.5vh] max-h-[96vh]">
        <div className="relative w-full flex-1 min-h-0" style={{ perspective: '1000px' }}>
          <div
            className="relative w-full h-full"
            style={{
              transform: `rotateY(${showRegister ? 180 : 0}deg)`,
              transition: 'transform 0.6s ease-in-out',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Face 1: Login (frente) */}
            <div
              style={{
                ...cardFaceStyle,
                transform: 'rotateY(0deg)'
              }}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] shadow-2xl shadow-black/50 overflow-hidden flex flex-col h-full"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50 blur-sm z-10" />
              <div className="p-4 sm:p-6 md:p-8 flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="text-center mb-4 sm:mb-6 shrink-0">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 mb-3 sm:mb-4 shadow-lg shadow-emerald-500/10 group">
                    <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500 group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tighter uppercase mb-1">
                    Vertex<span className="text-emerald-500">Ads</span>
                  </h1>
                  <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Gestão Financeira Enterprise</p>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col flex-1 min-h-0 gap-3 sm:gap-4">
                  <div className="flex flex-col gap-3 sm:gap-4">
                    {erro && !showRegister && (
                      <p className="text-red-400 text-xs font-bold text-center bg-red-950/30 border border-red-800/50 rounded-xl py-1.5 px-2">{erro}</p>
                    )}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">E-mail Corporativo</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-2.5 sm:py-3 pl-10 pr-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:bg-slate-950 transition-all"
                          placeholder="nome@empresa.com"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Credencial de Acesso</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                        </div>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-2.5 sm:py-3 pl-10 pr-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:bg-slate-950 transition-all"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="w-3.5 h-3.5 rounded border border-slate-700 bg-slate-950 group-hover:border-emerald-500/50 transition-colors flex items-center justify-center" />
                        <span className="text-[10px] text-slate-500 font-bold group-hover:text-slate-400 transition-colors">Lembrar dispositivo</span>
                      </label>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full group relative flex items-center justify-center gap-2 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                    >
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                      {loading ? <Activity className="animate-spin h-4 w-4" /> : <>Acessar Painel <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" /></>}
                    </button>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
                      <div className="relative flex justify-center text-[10px] uppercase">
                        <span className="bg-slate-900 px-2 text-slate-500 font-black tracking-widest rounded-full">Ou</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 bg-slate-950 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 rounded-xl text-slate-300 font-bold text-[10px] sm:text-xs uppercase tracking-wider transition-all active:scale-95 shadow-lg group"
                    >
                      <GoogleIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Continuar com Google</span>
                    </button>
                  </div>
                  <p className="text-slate-500 text-[10px] font-medium text-center">
                    Não tem conta?{' '}
                    <button type="button" onClick={() => { setErro(''); setShowRegister(true); }} className="text-emerald-500 font-bold hover:text-emerald-400 transition-colors uppercase text-[10px] tracking-wider">
                      Criar conta
                    </button>
                  </p>
                </form>
              </div>
            </div>

            {/* Face 2: Cadastro (verso) */}
            <div
              style={{
                ...cardFaceStyle,
                transform: 'rotateY(180deg)'
              }}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] shadow-2xl shadow-black/50 overflow-hidden flex flex-col h-full"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50 blur-sm z-10" />
              <div className="p-4 sm:p-6 md:p-8 flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="text-center mb-3 sm:mb-4 shrink-0">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 mb-2 shadow-lg shadow-emerald-500/10 group">
                    <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tighter uppercase">Criar Conta</h1>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Junte-se ao Vertex Ads Pro</p>
                </div>

                <form onSubmit={handleRegister} className="flex flex-col flex-1 min-h-0 gap-2 sm:gap-3">
                  <div className="flex flex-col gap-2 sm:gap-3">
                    {erro && showRegister && (
                      <p className="text-red-400 text-xs font-bold text-center bg-red-950/30 border border-red-800/50 rounded-xl py-1.5 px-2">{erro}</p>
                    )}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Nome</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                        </div>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-2 pl-10 pr-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:bg-slate-950 transition-all"
                          placeholder="Seu nome"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">E-mail</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-2 pl-10 pr-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:bg-slate-950 transition-all"
                          placeholder="nome@empresa.com"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Senha</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                          </div>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-2 pl-10 pr-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:bg-slate-950 transition-all"
                            placeholder="••••"
                            required
                            minLength={8}
                            title="Mínimo 8 caracteres"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 ml-3">Mínimo 8 caracteres</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Confirmar</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                          </div>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-2 pl-10 pr-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:bg-slate-950 transition-all"
                            placeholder="••••"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full group relative flex items-center justify-center gap-2 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                    >
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                      {loading ? <Activity className="animate-spin h-4 w-4" /> : <>Cadastrar <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" /></>}
                    </button>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
                      <div className="relative flex justify-center text-[10px] uppercase">
                        <span className="bg-slate-900 px-2 text-slate-500 font-black tracking-widest rounded-full">Ou</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleGoogleSignup}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 bg-slate-950 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 rounded-xl text-slate-300 font-bold text-[10px] sm:text-xs uppercase tracking-wider transition-all active:scale-95 shadow-lg group"
                    >
                      <GoogleIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Cadastrar com Google</span>
                    </button>
                    <div className="text-center pt-1">
                      <p className="text-slate-500 text-[10px] font-medium">
                        Já tem uma conta?{' '}
                        <button type="button" onClick={() => { setErro(''); setShowRegister(false); }} className="text-emerald-500 font-bold hover:text-emerald-400 transition-colors uppercase text-[10px] tracking-wider">
                          Fazer Login
                        </button>
                      </p>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <p className="shrink-0 text-center py-1.5 text-slate-600 text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center justify-center gap-2">
          <Fingerprint size={12} /> Vertex Security System
        </p>
        <div className="shrink-0 flex flex-wrap items-center justify-center gap-3 py-2 text-[10px]">
          <Link to="/termos" className="text-slate-500 hover:text-emerald-500 transition-colors uppercase tracking-wider font-bold">
            Termos de uso
          </Link>
          <span className="text-slate-600">|</span>
          <Link to="/privacidade" className="text-slate-500 hover:text-emerald-500 transition-colors uppercase tracking-wider font-bold">
            Política de privacidade
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes pulse-slow { 0%, 100% { transform: scale(1); opacity: 0.1; } 50% { transform: scale(1.2); opacity: 0.2; } }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        .animate-pulse-slow { animation: pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-shimmer { animation: shimmer 1.5s infinite; }
        .animation-delay-1000 { animation-delay: 1s; }
      `}</style>
    </div>
  );
}
