import React, { useState } from 'react';
import { ShieldAlert, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export const LoginView: React.FC = () => {
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
    } catch {
      // Error is stored in zustand store
    }
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    login({ email: quickEmail, password: quickPass }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Tactical Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25" />

      {/* Main Login Card */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Emblem & Station Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 shadow-xl shadow-sky-500/20 border border-sky-400/30 mb-2">
            <ShieldAlert className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight font-heading">
            COMISARÍA PNP LA TINGUIÑA
          </h1>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">
            Centro de Comando, Control y Despacho Digital
          </p>
        </div>

        <Card className="bg-slate-900/90 border-slate-800 shadow-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {error && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center gap-2.5 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Correo Electrónico Institucional"
              type="email"
              required
              placeholder="oficial@policia.gob.pe"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            />

            <Input
              label="Contraseña"
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Acceder al Panel de Guardia <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          {/* Quick Login Helper for Development & Demonstration */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono text-center">
              Acceso Rápido de Prueba (Seeds Locales)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <Button
                variant="outline"
                size="sm"
                className="text-[11px] py-1.5 px-2 border-slate-700 bg-slate-950/60 hover:border-sky-500 hover:text-sky-400"
                onClick={() => handleQuickLogin('admin@comisaria.gob.pe', 'Admin123456!')}
              >
                Admin
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-[11px] py-1.5 px-2 border-slate-700 bg-slate-950/60 hover:border-amber-500 hover:text-amber-400"
                onClick={() =>
                  handleQuickLogin('comisario.tinguina@policia.gob.pe', 'Admin123456!')
                }
              >
                Comisario
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-[11px] py-1.5 px-2 border-slate-700 bg-slate-950/60 hover:border-emerald-500 hover:text-emerald-400"
                onClick={() =>
                  handleQuickLogin('operador.guardia@policia.gob.pe', 'Admin123456!')
                }
              >
                Operador
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-[11px] py-1.5 px-2 border-slate-700 bg-slate-950/60 hover:border-purple-500 hover:text-purple-400"
                onClick={() =>
                  handleQuickLogin('moderador.comunitario@policia.gob.pe', 'Admin123456!')
                }
              >
                Moderador
              </Button>
            </div>
          </div>
        </Card>

        {/* Security Notice */}
        <p className="text-[11px] text-slate-500 text-center font-mono">
          Sistema Oficial PNP • Registro y Auditoría Criptográfica Argon2id
        </p>
      </div>
    </div>
  );
};
