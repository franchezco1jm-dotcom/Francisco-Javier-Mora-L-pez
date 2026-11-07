import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  X,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { InvestmentRecord } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface InvestmentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  investments: InvestmentRecord[];
  onAddInvestment: (amount: number, description: string, date: string) => void;
  onDeleteInvestment: (id: string) => void;
  totalRetailValue: number;
}

export const InvestmentManagerModal: React.FC<InvestmentManagerModalProps> = ({
  isOpen,
  onClose,
  investments,
  onAddInvestment,
  onDeleteInvestment,
  totalRetailValue,
}) => {
  const [amountInput, setAmountInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [invToDelete, setInvToDelete] = useState<InvestmentRecord | null>(null);
  const [dateInput, setDateInput] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  if (!isOpen) return null;

  const totalInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const netProjected = totalRetailValue - totalInvestment;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amountInput);
    if (!num || num <= 0) return;

    const desc = descriptionInput.trim() || `Aporte #${investments.length + 1}`;
    onAddInvestment(num, desc, dateInput);

    setAmountInput('');
    setDescriptionInput('');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-sky-500/40 w-full max-w-md rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-600/20 text-sky-400 border border-sky-500/30 rounded-xl shadow-md">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">
                Inversiones y Costos Globales
              </h3>
              <p className="text-[11px] text-sky-400 font-semibold">
                Registra compras y montos de mercancía
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {/* Total Investment Card */}
          <div className="p-4 bg-gradient-to-tr from-sky-950/60 to-slate-900 border border-sky-500/40 rounded-2xl shadow-lg flex justify-between items-center">
            <div>
              <span className="text-xs text-sky-200 font-bold block uppercase tracking-wider">
                Inversión Total Acumulada
              </span>
              <span className="text-2xl font-black text-white block mt-0.5">
                ${totalInvestment.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400">
                {investments.length} {investments.length === 1 ? 'monto registrado' : 'montos registrados'}
              </span>
            </div>

            <div className="text-right border-l border-slate-800 pl-4">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Ganancia Neta
              </span>
              <span
                className={`text-base font-extrabold ${
                  netProjected >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {netProjected >= 0 ? '+' : ''}${netProjected.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 block">
                sobre stock actual
              </span>
            </div>
          </div>

          {/* Form to Add New Investment Amount */}
          <form
            onSubmit={handleSubmit}
            className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
              <Plus className="w-4 h-4" />
              <span>Sumar Nuevo Monto de Inversión</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Monto a Sumar ($) *
                </label>
                <div className="relative flex items-center">
                  <DollarSign className="w-4 h-4 absolute left-2.5 text-sky-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-2 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-black text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Concepto / Detalle (Opcional)
                </label>
                <input
                  type="text"
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  placeholder="Ej: Lote de cargadores, Compra por mayor..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-md shadow-sky-950 transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Monto de Inversión</span>
            </button>
          </form>

          {/* List of Registered Investments */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 block">
              Historial de Inversiones ({investments.length})
            </span>

            {investments.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs bg-slate-950 rounded-2xl border border-slate-800">
                <Wallet className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-sky-400" />
                <p>No hay montos de inversión registrados todavía.</p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  Usa el formulario arriba para ir sumando cada compra de mercancía.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {investments.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white truncate">{inv.description}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-sky-400" />
                        <span>{inv.date}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black text-sm text-sky-300">
                        ${inv.amount.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setInvToDelete(inv)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                        title="Eliminar este monto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
          >
            Listo
          </button>
        </div>
      </div>

      {/* Confirm Delete Investment Modal */}
      <ConfirmModal
        isOpen={!!invToDelete}
        title="Eliminar Inversión"
        message={`¿Estás seguro de que deseas eliminar el registro de inversión "${invToDelete?.description}" por un monto de $${invToDelete?.amount.toFixed(2)}?`}
        confirmText="Sí, Eliminar Inversión"
        onConfirm={() => {
          if (invToDelete) {
            onDeleteInvestment(invToDelete.id);
            setInvToDelete(null);
          }
        }}
        onCancel={() => setInvToDelete(null)}
      />
    </div>
  );
};
