import React, { useState } from 'react';
import { ShieldCheck, Activity, Key, User, Mail, Lock, ArrowRight, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const endpoint = '/api/auth';
      const payload = isRegistering 
        ? { action: 'register', email, username, password, accessCode }
        : { action: 'login', email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error en autenticación');

      // En despliegues distribuidos (Vercel + Modal), las cookies HttpOnly cross-origin
      // pueden ser bloqueadas por navegadores modernos. Usamos localStorage como canal primario.
      if (data.token) {
        localStorage.setItem('biologic_token', data.token);
      }
      onLoginSuccess(data.token || 'cookie-auth', data.user);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center font-sans relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute top-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md px-6 relative z-10">
        
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)] mb-6"
          >
            <Activity className="w-10 h-10 text-emerald-400" />
          </motion.div>
          <h1 className="text-3xl font-black text-white tracking-widest mb-2">BIOLOGIC <span className="text-emerald-500 font-light">OS</span></h1>
          <p className="text-white/40 text-xs font-mono uppercase tracking-widest">Plataforma de Razonamiento Clínico</p>
        </div>

        {/* Main Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
          
          <h2 className="text-xl font-bold text-white mb-6 tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            {isRegistering ? 'Solicitar Acceso' : 'Verificación de Identidad'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Input Email */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-white/30" />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Correo Electrónico" 
                className="w-full bg-black/40 border border-white/10 focus:border-emerald-500/50 rounded-xl py-3 pl-11 pr-4 text-white text-sm font-mono placeholder:text-white/20 outline-none transition-all"
                required
              />
            </div>

            {/* Register specific inputs */}
            <AnimatePresence>
              {isRegistering && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-white/30" />
                    </div>
                    <input 
                      type="text" 
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="Nombre de Usuario / Dr." 
                      className="w-full bg-black/40 border border-white/10 focus:border-emerald-500/50 rounded-xl py-3 pl-11 pr-4 text-white text-sm font-mono placeholder:text-white/20 outline-none transition-all"
                      required={isRegistering}
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Key className="h-4 w-4 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      value={accessCode}
                      onChange={e => setAccessCode(e.target.value.toUpperCase())}
                      placeholder="Código de Autorización (Ej. MED-XXXXX)" 
                      className="w-full bg-emerald-500/5 border border-emerald-500/30 focus:border-emerald-500 rounded-xl py-3 pl-11 pr-4 text-emerald-400 font-bold text-sm font-mono placeholder:text-emerald-500/30 outline-none transition-all uppercase tracking-widest"
                      required={isRegistering}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Password */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-white/30" />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Contraseña Maestra" 
                className="w-full bg-black/40 border border-white/10 focus:border-emerald-500/50 rounded-xl py-3 pl-11 pr-4 text-white text-sm font-mono placeholder:text-white/20 outline-none transition-all"
                required
              />
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-rose-400 text-xs text-center font-mono py-2 bg-rose-500/10 rounded-lg border border-rose-500/20"
              >
                ⚠️ {error}
              </motion.p>
            )}

            {isLoading && (
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-emerald-400 text-[10px] text-center font-mono py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/20 animate-pulse"
              >
                ⚡ Despertando contenedores serverless de alto rendimiento (Modal VPS)... Por favor espere.
              </motion.p>
            )}

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isLoading || !email || !password || (isRegistering && (!username || !accessCode))}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-white/5 disabled:text-white/30 disabled:border-white/10 disabled:cursor-not-allowed border border-emerald-400/50 text-white font-bold uppercase tracking-widest py-4 rounded-xl transition-all flex items-center justify-center gap-3 text-sm mt-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              {isLoading ? <Server className="w-5 h-5 animate-spin" /> : isRegistering ? 'Activar Licencia' : 'Desbloquear Vórtice'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </motion.div>

        {/* Toggle Register/Login */}
        <div className="mt-8 text-center">
          <button 
            type="button"
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="text-white/40 hover:text-white/80 text-xs font-mono uppercase tracking-widest transition-colors border-b border-transparent hover:border-white/30 pb-1"
          >
            {isRegistering ? 'Ya tengo una licencia activa. Iniciar Sesión.' : 'No tengo acceso. Registrar nueva licencia.'}
          </button>
        </div>

      </div>
    </div>
  );
}
