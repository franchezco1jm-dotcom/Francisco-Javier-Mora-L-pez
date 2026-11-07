import React, { useState } from 'react';
import { HistoryLog } from '../types';
import { History, Search, User, Trash2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface HistoryViewProps {
  logs: HistoryLog[];
  isAdmin: boolean;
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ logs, isAdmin, onClearHistory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/60 p-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            <span>Historial de Movimientos ({logs.length})</span>
          </h3>
          {isAdmin && logs.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-xs text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuario o acción..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* List */}
        <div className="space-y-2 text-xs max-h-[65vh] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <p className="text-slate-500 text-center py-6 text-xs">
              No hay registros que coincidan.
            </p>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 bg-slate-900/80 border border-slate-700/60 rounded-xl space-y-1"
              >
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span className="font-bold text-indigo-400 flex items-center gap-1">
                    <User className="w-3 h-3 text-indigo-400" />
                    <span>{log.user}</span>
                  </span>
                  <span>{log.timestamp}</span>
                </div>
                <p className="font-bold text-slate-200 text-xs">{log.action}</p>
                <p className="text-[11px] text-slate-400">{log.details}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showClearConfirm}
        title="Limpiar Historial"
        message="¿Estás seguro de que deseas borrar todos los registros de movimientos del historial? Esta acción no se puede deshacer."
        confirmText="Sí, Limpiar Todo"
        onConfirm={() => {
          onClearHistory();
          setShowClearConfirm(false);
        }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
};
