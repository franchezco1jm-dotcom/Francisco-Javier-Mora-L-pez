import React, { useState } from 'react';
import { User } from '../types';
import {
  LogIn,
  UserPlus,
  KeyRound,
  Mail,
  User as UserIcon,
  ShieldCheck,
  Eye,
  EyeOff,
  Compass,
  ArrowRight,
  AlertCircle,
  Briefcase,
  X,
} from 'lucide-react';

interface LandingAuthModalProps {
  isOpen: boolean;
  users: User[];
  onLogin: (userIdOrUsername: string, pass: string) => boolean;
  onRegister: (name: string, username: string, role: 'admin' | 'user', pass: string) => boolean;
  onExploreGuest: () => void;
  onClose?: () => void;
  canDismiss?: boolean;
}

export const LandingAuthModal: React.FC<LandingAuthModalProps> = ({
  isOpen,
  users,
  onLogin,
  onRegister,
  onExploreGuest,
  onClose,
  canDismiss = false,
}) => {
  // Tabs: 'login' (Ingresar) or 'register' (Registrarse)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login Form State
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Register extra state
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('admin');

  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (authMode === 'login') {
      const idOrUser = emailOrUsername.trim();
      if (!idOrUser) {
        setErrorMsg('Por favor ingresa tu correo electrónico o usuario');
        return;
      }
      const success = onLogin(idOrUser, password);
      if (!success) {
        setErrorMsg('Credenciales incorrectas. Verifica tu usuario y contraseña.');
      } else {
        setPassword('');
        setErrorMsg('');
      }
    } else {
      // Register Mode
      if (!name.trim()) {
        setErrorMsg('Por favor ingresa tu nombre o nombre de tienda');
        return;
      }
      if (!emailOrUsername.trim()) {
        setErrorMsg('Por favor ingresa un correo electrónico o usuario');
        return;
      }
      if (password.length < 4) {
        setErrorMsg('La contraseña debe tener al menos 4 caracteres');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Las contraseñas no coinciden');
        return;
      }

      const success = onRegister(name.trim(), emailOrUsername.trim(), role, password);
      if (success) {
        setName('');
        setEmailOrUsername('');
        setPassword('');
        setConfirmPassword('');
        setErrorMsg('');
      } else {
        setErrorMsg('Este usuario o correo ya está registrado. Elige otro.');
      }
    }
  };

  const loginWithGoogle = () => {
    // Quick seamless social auth simulation: creates or finds Google demo account
    const existingGoogle = users.find((u) => u.username === 'google_user');
    if (existingGoogle) {
      onLogin(existingGoogle.id, existingGoogle.pass);
    } else {
      onRegister('Usuario Google', 'google_user', 'admin', 'google123');
    }
  };

  const handleQuickDemoLogin = (roleType: 'admin' | 'user') => {
    const demoUser = users.find((u) => u.role === roleType);
    if (demoUser) {
      onLogin(demoUser.id, demoUser.pass);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[85] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Contenedor de Bienvenida y Autenticación */}
      <div
        id="auth-container"
        className="auth-card bg-slate-900 border border-purple-500/30 w-full max-w-sm sm:max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl relative my-auto text-left"
      >
        {/* Close Button if dismissible */}
        {canDismiss && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand Header */}
        <div className="brand-header text-center mb-5">
          <div className="relative inline-block mb-3">
            <img
              src="/pwa-192x192.png"
              onError={(e) => {
                // Fallback to logo.jpg if icon-192 isn't direct
                (e.currentTarget as HTMLImageElement).src = '/logo.jpg';
              }}
              alt="Logo"
              className="app-logo w-20 h-20 rounded-2xl mx-auto shadow-2xl shadow-purple-600/40 border-2 border-purple-500/50 object-cover"
            />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight leading-tight mb-1">
            Bienvenido a Blackberry Inventory
          </h2>
          <p className="subtitle text-xs text-purple-300 font-medium max-w-xs mx-auto">
            Gestiona tu catálogo e inventario en tiempo real
          </p>
        </div>

        {/* Auth Tabs */}
        <div className="auth-tabs flex bg-slate-950/90 p-1 rounded-2xl border border-slate-800 mb-5 text-xs">
          <button
            type="button"
            className={`tab flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              authMode === 'login'
                ? 'active bg-purple-600 text-white shadow-md shadow-purple-900/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => {
              setAuthMode('login');
              setErrorMsg('');
            }}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Ingresar</span>
          </button>
          <button
            type="button"
            className={`tab flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              authMode === 'register'
                ? 'active bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => {
              setAuthMode('register');
              setErrorMsg('');
            }}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Registrarse</span>
          </button>
        </div>

        {/* Auth Form */}
        <form id="auth-form" onSubmit={handleAuth} className="space-y-3.5 text-xs">
          {/* Register-only: Name */}
          {authMode === 'register' && (
            <div className="input-group">
              <label htmlFor="name" className="block font-semibold text-slate-300 mb-1">
                Nombre Completo o Empresa
              </label>
              <input
                type="text"
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Roberto Gómez o Mi Tienda"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          )}

          {/* Email / Username */}
          <div className="input-group">
            <label htmlFor="email" className="block font-semibold text-slate-300 mb-1">
              Correo electrónico
            </label>
            <div className="relative">
              <input
                type="text"
                id="email"
                required
                value={emailOrUsername}
                onChange={(e) => {
                  setEmailOrUsername(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="nombre@ejemplo.com"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <Mail className="w-4 h-4 absolute right-3.5 top-3 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Password */}
          <div className="input-group">
            <label htmlFor="password" className="block font-semibold text-slate-300 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Register-only: Confirm Password & Role */}
          {authMode === 'register' && (
            <>
              <div className="input-group">
                <label htmlFor="confirm-password" className="block font-semibold text-slate-300 mb-1">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="input-group">
                <label className="block font-semibold text-slate-300 mb-1">Rol</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition flex items-center justify-center gap-1.5 ${
                      role === 'admin'
                        ? 'bg-purple-600/30 text-purple-300 border-purple-500 ring-1 ring-purple-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Administrador</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('user')}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition flex items-center justify-center gap-1.5 ${
                      role === 'user'
                        ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500 ring-1 ring-indigo-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Vendedor</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            id="btn-submit"
            className="btn-primary w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 mt-2"
          >
            {authMode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Entrar</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Registrarse</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="divider flex items-center my-4 text-slate-500 text-xs">
          <div className="flex-1 border-t border-slate-800"></div>
          <span className="px-3 uppercase font-semibold text-[11px] text-slate-500">o</span>
          <div className="flex-1 border-t border-slate-800"></div>
        </div>

        {/* Google Auth Button */}
        <button
          type="button"
          onClick={loginWithGoogle}
          className="btn-google w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold flex items-center justify-center gap-2.5 transition active:scale-95 text-xs shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.02h3.87c2.26-2.09 3.67-5.17 3.67-9.11z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.02c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.26v3.12C3.27 21.36 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.27 14.27a7.22 7.22 0 0 1 0-4.54V6.61H1.26a11.97 11.97 0 0 0 0 10.78l4.01-3.12z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.64 1.26 6.61l4.01 3.12c.95-2.85 3.6-4.98 6.73-4.98z"
            />
          </svg>
          <span>Continuar con Google</span>
        </button>

        {/* 1-Click Demo Accounts */}
        <div className="pt-3.5 mt-3.5 border-t border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5 text-center">
            Prueba Rápida 1-Clic:
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin')}
              className="p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition"
              title="Entrar con cuenta de Administrador de prueba"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin Demo</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('user')}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition"
              title="Entrar con cuenta de Vendedor de prueba"
            >
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              <span>Vendedor Demo</span>
            </button>
          </div>
        </div>

        {/* Modo Demostración / Acceso Invitado */}
        <div className="mt-3.5 pt-3 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={onExploreGuest}
            className="w-full py-2.5 px-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs transition flex items-center justify-center gap-2 active:scale-95 group"
          >
            <Compass className="w-4 h-4 text-purple-400 group-hover:rotate-45 transition-transform" />
            <span>Explorar catálogo de prueba (Modo Invitado)</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
