import React, { useState } from 'react';
import { User } from '../types';
import { Key, X } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  currentUser: User | null;
  onClose: () => void;
  onUpdatePassword: (currentPass: string, newPass: string) => boolean;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onUpdatePassword,
}) => {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const success = onUpdatePassword(currentPass, newPass);
    if (!success) {
      setErrorMsg('La contraseña actual es incorrecta.');
    } else {
      setCurrentPass('');
      setNewPass('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xs rounded-3xl p-5 shadow-2xl">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" />
            <span>Cambiar Mi Contraseña</span>
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Usuario: <strong className="text-slate-200">{currentUser.name}</strong> ({currentUser.username})
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Contraseña Actual</label>
            <input
              type="password"
              required
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Nueva Contraseña</label>
            <input
              type="password"
              required
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {errorMsg && <p className="text-[11px] text-rose-400 font-semibold">{errorMsg}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2 border border-slate-700 text-slate-300 rounded-xl font-semibold hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold active:scale-95 transition"
            >
              Actualizar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
