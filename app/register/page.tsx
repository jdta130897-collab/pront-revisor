'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, GraduationCap, UserCheck, Users, Shield, Check, ChevronDown } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('estudiante');
  const [advisorId, setAdvisorId] = useState('');
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Custom premium advisor dropdown state
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const advisorRef = useRef<HTMLDivElement>(null);

  // ORCID verification state
  const [orcid, setOrcid] = useState('');
  const [orcidVerified, setOrcidVerified] = useState(false);
  const [orcidName, setOrcidName] = useState('');
  const [verifyingOrcid, setVerifyingOrcid] = useState(false);
  const [orcidError, setOrcidError] = useState('');
  
  const router = useRouter();
  const { status } = useSession();

  // Premium role definitions with modern descriptions
  const roles = [
    { 
      value: 'estudiante', 
      label: 'Estudiante', 
      icon: GraduationCap, 
      desc: 'Sube avances de tesis y recibe análisis IA de última generación' 
    },
    { 
      value: 'asesor', 
      label: 'Asesor', 
      icon: UserCheck, 
      desc: 'Revisa, califica y guía los avances de tus estudiantes asignados' 
    },
    { 
      value: 'coordinador', 
      label: 'Coordinador', 
      icon: Users, 
      desc: 'Supervisa el progreso de múltiples asesores y sus equipos' 
    },
    { 
      value: 'admin', 
      label: 'Administrador', 
      icon: Shield, 
      desc: 'Control total del sistema, usuarios y configuración avanzada' 
    },
  ];

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Load list of advisors when student role is selected (real data from DB)
  useEffect(() => {
    if (role === 'estudiante') {
      fetch('/api/users?role=asesor')
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setAdvisors(data.filter((u: any) => u.role === 'asesor'));
          } else {
            // No advisors registered yet — student can still register (advisor optional)
            setAdvisors([]);
          }
        })
        .catch(() => {
          setAdvisors([]);
        });
    }
  }, [role]);

  // Close advisor dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (advisorRef.current && !advisorRef.current.contains(event.target as Node)) {
        setAdvisorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          name, 
          role, 
          ...(role === 'estudiante' && advisorId ? { advisorId } : {}),
          ...(orcid && role !== 'estudiante' ? { orcid } : {})
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al crear la cuenta. Por favor intenta nuevamente.');
        setLoading(false);
        return;
      }

      // Successful registration → redirect to login with success message
      router.push('/login?registered=true');
    } catch (err) {
      setError('Error de conexión. Por favor verifica tu red e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ORCID verification using public ORCID API
  const verifyOrcid = async () => {
    setOrcidError('');
    setOrcidVerified(false);
    setOrcidName('');

    const cleanOrcid = orcid.replace(/[^0-9X]/g, '').replace(/(\d{4})(?=\d)/g, '$1-');

    // Basic format validation (0000-0000-0000-0000)
    const orcidRegex = /^\d{4}-\d{4}-\d{4}-[\dX]{4}$/;
    if (!orcidRegex.test(cleanOrcid)) {
      setOrcidError('Formato inválido. Debe ser 0000-0000-0000-0000');
      return;
    }

    setVerifyingOrcid(true);

    try {
      const response = await fetch(`https://pub.orcid.org/v3.0/${cleanOrcid}/record`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('No se encontró el ORCID o es inválido');
      }

      const data = await response.json();
      const person = data.person || {};
      const nameInfo = person.name || {};
      const fullName = [nameInfo['given-names']?.value, nameInfo['family-name']?.value]
        .filter(Boolean)
        .join(' ');

      setOrcid(cleanOrcid);
      setOrcidVerified(true);
      setOrcidName(fullName || 'ORCID verificado correctamente');

      // Auto-fill name if it's empty and we got a good name from ORCID (nice UX for advisors)
      if (!name && fullName) {
        // Only suggest, don't overwrite if user already typed something
        // We can leave this as optional behavior
      }
    } catch (err: any) {
      setOrcidError(err.message || 'No se pudo verificar el ORCID. Verifica que sea correcto.');
    } finally {
      setVerifyingOrcid(false);
    }
  };

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="auth-container min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle tech background */}
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
            Crear tu cuenta
          </h1>
          <p className="text-slate-400 text-[15px]">
            Únete a la plataforma de revisión académica con IA de última generación
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre completo */}
          <div className="space-y-2">
            <label className="premium-label block">Nombre completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input w-full px-5 py-3.5 rounded-2xl text-[15px]"
              placeholder="María González"
              required
              disabled={loading}
            />
          </div>

          {/* Correo institucional */}
          <div className="space-y-2">
            <label className="premium-label block">Correo institucional</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input w-full px-5 py-3.5 rounded-2xl text-[15px]"
              placeholder="tu@universidad.edu"
              required
              disabled={loading}
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-2">
            <label className="premium-label block">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input w-full px-5 py-3.5 rounded-2xl text-[15px] pr-12"
                placeholder="Mínimo 6 caracteres"
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

          {/* Confirmar contraseña */}
          <div className="space-y-2">
            <label className="premium-label block">Confirmar contraseña</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input w-full px-5 py-3.5 rounded-2xl text-[15px] pr-12"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          {/* Premium Role Selection Cards - Última generación */}
          <div className="space-y-2">
            <label className="premium-label block">Selecciona tu rol</label>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((r) => {
                const Icon = r.icon;
                const isSelected = role === r.value;
                return (
                  <motion.button
                    key={r.value}
                    type="button"
                    onClick={() => {
                      setRole(r.value);
                      if (r.value !== 'estudiante') setAdvisorId('');
                    }}
                    disabled={loading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.985 }}
                    className={`group relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-200 disabled:opacity-60 ${
                      isSelected 
                        ? 'border-blue-500/60 bg-blue-500/5 ring-1 ring-blue-500/30' 
                        : 'border-white/10 bg-white/[0.015] hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${isSelected ? 'bg-gradient-to-br from-blue-600 to-violet-600' : 'bg-white/5'}`}>
                        <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                      </div>
                      {isSelected && (
                        <motion.div 
                          initial={{ scale: 0.6, opacity: 0 }} 
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500"
                        >
                          <Check className="h-3 w-3 text-white" />
                        </motion.div>
                      )}
                    </div>
                    <div>
                      <div className={`font-semibold tracking-tight ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {r.label}
                      </div>
                      <div className="mt-1 text-[11px] leading-snug text-slate-500 line-clamp-2">
                        {r.desc}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Premium Custom Advisor Dropdown - Dark Glassmorphism Style */}
          {role === 'estudiante' && (
            <div className="space-y-2">
              <label className="premium-label block">Asesor asignado</label>
              
              <div className="relative" ref={advisorRef}>
                {/* Trigger Button - matches auth-input style */}
                <button
                  type="button"
                  onClick={() => !loading && setAdvisorOpen(!advisorOpen)}
                  disabled={loading}
                  className="auth-input w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-[15px] text-left disabled:opacity-60 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                >
                  <span className={advisorId ? "text-slate-100" : "text-slate-500"}>
                    {advisorId 
                      ? advisors.find((a: any) => a.id === advisorId)?.name || "Asesor seleccionado"
                      : advisors.length > 0 
                        ? "Selecciona un asesor (opcional)" 
                        : "Sin asignar por ahora (puedes elegir después)"}
                  </span>
                  <ChevronDown 
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${advisorOpen ? "rotate-180" : ""}`} 
                  />
                </button>

                {/* Beautiful Custom Dropdown Panel */}
                <AnimatePresence>
                  {advisorOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                      className="absolute z-50 mt-2 w-full rounded-2xl border border-white/10 bg-[#0f0f19] backdrop-blur-2xl shadow-2xl shadow-black/60 overflow-hidden"
                    >
                      <div className="max-h-[220px] overflow-y-auto auth-scroll py-1">
                        {/* No advisor option */}
                        <button
                          type="button"
                          onClick={() => {
                            setAdvisorId('');
                            setAdvisorOpen(false);
                          }}
                          className={`w-full px-5 py-3 text-left text-[14px] transition-colors flex items-center gap-3 hover:bg-white/5 ${
                            !advisorId ? "bg-blue-500/10 text-blue-400" : "text-slate-300"
                          }`}
                        >
                          <span>Sin asignar por ahora</span>
                        </button>

                        {advisors.length > 0 && (
                          <div className="my-1 border-t border-white/10" />
                        )}

                        {advisors.map((adv: any) => {
                          const isSelected = advisorId === adv.id;
                          return (
                            <button
                              key={adv.id}
                              type="button"
                              onClick={() => {
                                setAdvisorId(adv.id);
                                setAdvisorOpen(false);
                              }}
                              className={`w-full px-5 py-3 text-left text-[14px] transition-all flex items-center justify-between hover:bg-white/5 ${
                                isSelected 
                                  ? "bg-blue-500/10 text-blue-400" 
                                  : "text-slate-200 hover:text-white"
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{adv.name}</span>
                                {adv.orcid && (
                                  <span className="text-[11px] text-blue-400 font-mono mt-0.5">
                                    ORCID: {adv.orcid}
                                  </span>
                                )}
                              </div>
                              {isSelected && <Check className="w-4 h-4" />}
                            </button>
                          );
                        })}

                        {advisors.length === 0 && (
                          <div className="px-5 py-4 text-center text-xs text-slate-500">
                            Aún no hay asesores registrados.<br />
                            Puedes continuar sin asignar uno.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <p className="text-xs text-slate-500 mt-1">
                {advisors.length > 0 
                  ? 'Tu asesor podrá ver y calificar tus avances de tesis automáticamente.'
                  : 'Cuando un asesor se registre en la plataforma, podrás elegirlo aquí.'}
              </p>
            </div>
          )}

          {/* ORCID Verification - For academic roles (asesor, coordinador, admin) */}
          {role !== 'estudiante' && (
            <div className="space-y-2">
              <label className="premium-label block">ORCID iD (Opcional pero recomendado)</label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={orcid}
                  onChange={(e) => {
                    setOrcid(e.target.value);
                    setOrcidVerified(false);
                    setOrcidError('');
                  }}
                  placeholder="0000-0000-0000-0000"
                  className="auth-input flex-1 px-5 py-3.5 rounded-2xl text-[15px]"
                  disabled={loading || verifyingOrcid}
                />
                <button
                  type="button"
                  onClick={verifyOrcid}
                  disabled={loading || verifyingOrcid || !orcid}
                  className="px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {verifyingOrcid ? 'Verificando...' : 'Verificar ORCID'}
                </button>
              </div>

              {orcidVerified && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  ✓ ORCID verificado correctamente
                  {orcidName && <span className="text-emerald-300">({orcidName})</span>}
                </div>
              )}
              {orcidError && (
                <div className="text-red-400 text-xs">{orcidError}</div>
              )}

              <p className="text-xs text-slate-500">
                Los asesores y coordinadores pueden vincular su ORCID para mayor credibilidad académica. 
                Una vez verificado, aparecerá visible para los estudiantes al elegir asesor.
              </p>
            </div>
          )}

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
                Creando cuenta...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-9 text-center">
          <p className="text-sm text-slate-400">
            ¿Ya tienes una cuenta?{' '}
            <a 
              href="/login" 
              className="text-blue-400 hover:text-blue-300 font-medium underline-offset-4 hover:underline transition-colors"
            >
              Inicia sesión
            </a>
          </p>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Selecciona el rol que mejor represente tu función en la plataforma
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