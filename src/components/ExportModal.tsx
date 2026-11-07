import React from 'react';
import { FileSpreadsheet, FileText, X, Download, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';
import { exportInventoryToExcel, exportInventoryToPDF } from '../utils/exportReport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  globalInvestment: number;
  totalRetailValue: number;
  projectedNetProfit: number;
  totalSold: number;
  userName: string;
  isAdmin: boolean;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  products,
  globalInvestment,
  totalRetailValue,
  projectedNetProfit,
  totalSold,
  userName,
  isAdmin,
  onToast,
}) => {
  if (!isOpen) return null;

  const handleExportExcel = () => {
    const success = exportInventoryToExcel({
      products,
      globalInvestment,
      totalRetailValue,
      projectedNetProfit,
      totalSold,
      userName,
      isAdmin,
    });
    if (success) {
      onToast('Reporte en Excel descargado correctamente');
      onClose();
    } else {
      onToast('No hay productos para exportar', 'error');
    }
  };

  const handleExportPDF = () => {
    const success = exportInventoryToPDF({
      products,
      globalInvestment,
      totalRetailValue,
      projectedNetProfit,
      totalSold,
      userName,
      isAdmin,
    });
    if (success) {
      onToast('Reporte en PDF generado y descargado');
      onClose();
    } else {
      onToast('No hay productos para exportar', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-purple-900/40 w-full max-w-sm rounded-3xl p-5 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Exportar Inventario</h3>
              <p className="text-[10px] text-slate-400">{products.length} productos listos para exportar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 mb-4">
          Selecciona el formato en el que deseas descargar el reporte de inventario:
        </p>

        {/* Export Options */}
        <div className="space-y-3">
          {/* PDF Option */}
          <button
            onClick={handleExportPDF}
            className="w-full p-3.5 bg-gradient-to-r from-purple-950/70 to-slate-900 hover:from-purple-900/80 hover:to-slate-800 border border-purple-500/40 rounded-2xl flex items-center justify-between text-left transition group active:scale-98 shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white group-hover:text-purple-300 transition flex items-center gap-1.5">
                  <span>Documento PDF</span>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-semibold border border-rose-500/30">
                    Recomendado
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Listo para imprimir, enviar por WhatsApp o archivar con membrete oficial.
                </p>
              </div>
            </div>
          </button>

          {/* Excel Option */}
          <button
            onClick={handleExportExcel}
            className="w-full p-3.5 bg-gradient-to-r from-emerald-950/60 to-slate-900 hover:from-emerald-900/70 hover:to-slate-800 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-left transition group active:scale-98 shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white group-hover:text-emerald-300 transition">
                  Hoja de Cálculo Excel (.xlsx)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tabla de datos editable con fórmulas, stock, precios y totales.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-4 p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center gap-2 text-[11px] text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span>Incluye todos los productos en stock, agotados y métricas actualizadas.</span>
        </div>

        <button
          onClick={onClose}
          className="mt-3.5 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
