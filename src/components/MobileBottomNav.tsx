import React from 'react';
import { Boxes, History, Barcode, FileSpreadsheet, Share2 } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'inventory' | 'history';
  onTabChange: (tab: 'inventory' | 'history') => void;
  historyCount: number;
  onOpenScanner: () => void;
  onOpenExport: () => void;
  onOpenShare: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  historyCount,
  onOpenScanner,
  onOpenExport,
  onOpenShare,
}) => {
  return (
    <nav
      aria-label="Navegación Móvil Principal"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1.5 shadow-2xl safe-area-bottom"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Tab 1: Catálogo */}
        <button
          type="button"
          onClick={() => onTabChange('inventory')}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 transition rounded-xl min-h-[48px] ${
            activeTab === 'inventory'
              ? 'text-purple-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Boxes className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Catálogo</span>
        </button>

        {/* Tab 2: Historial */}
        <button
          type="button"
          onClick={() => onTabChange('history')}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 transition rounded-xl relative min-h-[48px] ${
            activeTab === 'history'
              ? 'text-purple-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <History className="w-5 h-5" />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-[14px] bg-purple-600 text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center">
                {historyCount > 99 ? '99+' : historyCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Historial</span>
        </button>

        {/* Center: Escáner Rápido (Elevated Action) */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            type="button"
            onClick={onOpenScanner}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-500 text-white shadow-xl shadow-purple-900/60 border-2 border-slate-900 flex flex-col items-center justify-center transition active:scale-95 group focus:outline-none focus:ring-2 focus:ring-purple-400"
            title="Escanear Código de Barras"
            aria-label="Abrir Escáner de Códigos"
          >
            <Barcode className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Action 4: Exportar / Reportes */}
        <button
          type="button"
          onClick={onOpenExport}
          className="flex-1 py-1.5 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-200 transition rounded-xl min-h-[48px]"
          title="Exportar Reporte Excel / PDF"
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Reporte</span>
        </button>

        {/* Action 5: Compartir */}
        <button
          type="button"
          onClick={onOpenShare}
          className="flex-1 py-1.5 flex flex-col items-center justify-center gap-1 text-purple-400 hover:text-purple-300 transition rounded-xl min-h-[48px]"
          title="Compartir Catálogo o Ficha"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Compartir</span>
        </button>
      </div>
    </nav>
  );
};
