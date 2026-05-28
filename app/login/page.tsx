'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Component that uses useSearchParams - must be wrapped in Suspense
function LoginSearchParamsEffects({ onCallbackUrl }: { onCallbackUrl: (url: string) => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    const url = searchParams.get('callbackUrl') || '/';
    onCallbackUrl(url);
  }, [searchParams, onCallbackUrl]);

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated') {
      const url = searchParams.get('callbackUrl') || '/';
      router.push(url);
    }
  }, [status, router, searchParams]);

  return null;
}

function LoginSearchParamsBanner() {
  const searchParams = useSearchParams();

  if (searchParams.get('registered') !== 'true') return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
      animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
      className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-5 py-3.5 rounded-2xl text-sm flex items-center gap-2"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      Cuenta creada exitosamente. Ahora puedes iniciar sesión.
    </motion.div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState('/');
  
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect if already logged in (callbackUrl comes from the Suspense child)
  useEffect(() => {
    if (status === 'authenticated') {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setError('El email o la contraseña son incorrectos. Por favor verifica tus credenciales.');
        } else {
          setError('Ocurrió un error al iniciar sesión. Inténtalo de nuevo.');
        }
        setLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('Error de conexión. Por favor verifica tu red e inténtalo nuevamente.');
      setLoading(false);
    }
  };

  // Don't render form if we're redirecting an already logged in user
  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle tech background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(#1f2937_0.8px,transparent_1px)] bg-[length:4px_4px] opacity-30" />
      
      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="auth-card w-full max-w-md rounded-3xl p-10 relative z-10"
      >
        {/* Premium Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-violet-600 flex items-center justify-center neon-blue">
                <span className="text-white font-bold text-2xl tracking-tighter">P</span>
              </div>
              <div>
                <div className="font-semibold text-3xl tracking-[-1.5px] text-white">PRONT</div>
                <div className="text-[10px] text-blue-400 -mt-1.5 font-medium tracking-[2px]">REVISOR</div>
              </div>
            </div>
          </div>

          <h1 className="auth-title text-4xl font-semibold tracking-tighter mb-2">
            Bienvenido de vuelta
          </h1>
          <p className="text-slate-400 text-[15px]">
            Accede a la plataforma de revisión con IA de última generación
          </p>
        </div>

        {/* Search params effects - must be inside Suspense because of useSearchParams */}
        <Suspense fallback={null}>
          <LoginSearchParamsEffects 
            onCallbackUrl={setCallbackUrl} 
          />
          <LoginSearchParamsBanner />
        </Suspense>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="premium-label block">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input w-full px-5 py-3.5 rounded-2xl text-[15px] placeholder:text-slate-500"
              placeholder="tu@universidad.edu"
              required
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="premium-label block">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input w-full px-5 py-3.5 rounded-2xl text-[15px] pr-12 placeholder:text-slate-500"
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-3 rounded-2xl text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="neon-button w-full py-4 text-white rounded-2xl text-[15px] font-semibold tracking-wide mt-2 disabled:opacity-80 flex items-center justify-center gap-2 active:scale-[0.985] transition-transform"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verificando credenciales...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-9 text-center">
          <p className="text-sm text-slate-400">
            ¿No tienes una cuenta?{' '}
            <a 
              href="/register" 
              className="text-blue-400 hover:text-blue-300 font-medium underline-offset-4 hover:underline transition-colors"
            >
              Regístrate aquí
            </a>
          </p>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Modo demo disponible • Explora sin cuenta usando el selector de roles
            </p>
          </div>
        </div>
      </motion.div>

      {/* Subtle bottom tech line */}
      <div className="absolute bottom-8 text-[10px] text-slate-600 tracking-[3px] font-mono">
        POWERED BY ADVANCED AI ANALYSIS
      </div>
    </div>
  );
}