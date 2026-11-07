import React, { useState } from 'react';
import { User } from '../types';
import { Users, X, Edit, Trash2, Search, UserPlus } from 'lucide-react';

interface UserManagerModalProps {
  isOpen: boolean;
  users: User[];
  currentUserId: string;
  onClose: () => void;
  onSaveUser: (userData: Omit<User, 'id'> & { id?: string }) => void;
  onDeleteUser: (userId: string) => void;
}

export const UserManagerModal: React.FC<UserManagerModalProps> = ({
  isOpen,
  users,
  currentUserId,
  onClose,
  onSaveUser,
  onDeleteUser,
}) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pass, setPass] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const handleStartEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setPass(user.pass);
  };

  const handleReset = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setPass('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !pass.trim()) return;

    onSaveUser({
      id: editingUser ? editingUser.id : undefined,
      name: name.trim(),
      username: username.trim().toLowerCase(),
      role: editingUser ? editingUser.role : 'user',
      pass: pass.trim(),
    });
    handleReset();
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800/90 border-b border-slate-700/60 flex justify-between items-center">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Gestión de Vendedores y Usuarios</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 space-y-3"
          >
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" />
              <span>{editingUser ? 'Editar Vendedor' : 'Nuevo Vendedor'}</span>
            </h4>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Carlos Mendoza"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Usuario (login)
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="carlos1"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="Clave"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              {editingUser && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-1/2 py-1.5 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-800"
                >
                  Cancelar Edición
                </button>
              )}
              <button
                type="submit"
                className={`py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold active:scale-95 transition ${
                  editingUser ? 'w-1/2' : 'w-full'
                }`}
              >
                {editingUser ? 'Actualizar' : 'Guardar Vendedor'}
              </button>
            </div>
          </form>

          {/* List */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Lista de Usuarios ({users.length})
              </h4>
            </div>

            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <p className="text-slate-500 text-center py-4 text-xs">
                  No se encontraron usuarios.
                </p>
              ) : (
                filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-3 bg-slate-900 border border-slate-700/60 rounded-xl flex justify-between items-center text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-100 flex items-center gap-1.5">
                        {u.name}
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            u.role === 'admin'
                              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                              : 'text-slate-400 bg-slate-800 border border-slate-700'
                          }`}
                        >
                          {u.role === 'admin' ? 'Admin' : 'Vendedor'}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Usuario: <strong className="text-indigo-300">{u.username}</strong>
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleStartEdit(u)}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition"
                        title="Editar"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {u.id !== currentUserId && (
                        <button
                          onClick={() => onDeleteUser(u.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
