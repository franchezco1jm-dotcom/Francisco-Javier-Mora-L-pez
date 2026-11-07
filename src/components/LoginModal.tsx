import React, { useState } from 'react';
import { User } from '../types';
import { UserCheck, KeyRound, LogIn, ChevronDown } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  users: User[];
  onLogin: (userId: string, pass: string) => boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, users, onLogin }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = selectedUserId || users[0]?.id;
    if (!targetId) return;

    const success = onLogin(targetId, password);
    if (!success) {
      setErrorMsg('Contraseña incorrecta');
    } else {
      setErrorMsg('');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-purple-900/40 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center">
        <div className="relative inline-block mb-3">
          <img
            src="/logo.jpg"
            alt="Blackberry Inventory Logo"
            className="w-20 h-20 rounded-full mx-auto shadow-xl shadow-purple-900/60 border-2 border-purple-500/60 object-cover"
          />
        </div>
        <h3 className="font-black text-xl text-white mb-0.5 tracking-tight">
          Blackberry Inventory
        </h3>
        <p className="text-[11px] font-semibold text-purple-400 mb-4 tracking-wide">
          Compra • Vende • Encuentra
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Usuario</label>
            <div className="relative">
              <select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none appearance-none cursor-pointer"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role === 'admin' ? 'Admin' : 'Vendedor'}) — [{u.username}]
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Ingresa tu contraseña"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
              />
              <KeyRound className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 font-medium text-center">{errorMsg}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-indigo-600/30 mt-2 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Ingresar al Sistema</span>
          </button>
        </form>

        <div className="mt-4 p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50 text-[11px] text-slate-400">
          <p className="font-semibold text-indigo-300 mb-0.5">Clave por defecto Admins:</p>
          <code className="text-amber-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
            Admin123
          </code>
        </div>
      </div>
    </div>
  );
};
