import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { LoginForm } from '@/components/auth/login-form';
import { Plane, Globe, MapPin } from 'lucide-react';

export default function AuthPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation('/');
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Panel - Brand & Visual */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[50%] bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 bg-neutral-900">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-emerald-500 opacity-20 blur-[100px]"></div>
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center backdrop-blur-sm">
            <Plane className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-xl font-bold tracking-tight">Roda Bem Turismo</span>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl xl:text-5xl font-semibold tracking-tight leading-tight mb-6 text-white">
            Gestão inteligente para sua agência de turismo
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed mb-8">
            Uma plataforma completa para gerenciar clientes, reservas e frotas com eficiência e simplicidade.
          </p>

          <div className="flex gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                  <span className="sr-only">User {i}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-sm font-medium text-white">Junte-se a 2,000+ usuários</span>
              <span className="text-xs text-slate-400">Otimizando operações diariamente</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex justify-between items-center text-sm text-slate-500">
          <p>© 2024 Roda Bem Turismo</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Termos</span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Privacidade</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-[50%] flex items-center justify-center p-6 bg-white overflow-y-auto">
        <div className="w-full max-w-[400px]">
          <LoginForm onToggleMode={() => { }} />
        </div>
      </div>
    </div>
  );
}

