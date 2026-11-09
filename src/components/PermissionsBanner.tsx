import React, { useState, useEffect } from 'react';
import { Camera, Mic, CheckCircle, ShieldCheck, X, Sparkles } from 'lucide-react';
import { checkMediaPermissions, requestUnifiedPermissions } from '../utils/permissionManager';

interface PermissionsBannerProps {
  onToast?: (message: string, type?: 'success' | 'error') => void;
}

export const PermissionsBanner: React.FC<PermissionsBannerProps> = ({ onToast }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isGranted, setIsGranted] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function evaluate() {
      // Check if user already dismissed for this session or already granted
      const dismissed = sessionStorage.getItem('permissions_banner_dismissed') === 'true';
      const cached = localStorage.getItem('inventory_permissions_granted_v2') === 'true';

      if (dismissed || cached) {
        setIsVisible(false);
        setIsGranted(cached);
        return;
      }

      const status = await checkMediaPermissions();
      if (!isMounted) return;

      if (status.allGranted || status.camera === 'granted') {
        setIsGranted(true);
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    }

    evaluate();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleGrant = async () => {
    setIsRequesting(true);
    try {
      const result = await requestUnifiedPermissions();
      if (result.success) {
        setIsGranted(true);
        setIsVisible(false);
        onToast?.('¡Permisos concedidos con éxito! No se volverán a solicitar.', 'success');
      } else {
        onToast?.(result.error || 'No se pudieron activar los permisos.', 'error');
      }
    } catch (err) {
      console.error('Error requesting permissions:', err);
      onToast?.('Ocurrió un error al solicitar permisos.', 'error');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('permissions_banner_dismissed', 'true');
  };

  if (!isVisible || isGranted) return null;

  return (
    <div className="relative overflow-hidden mb-4 p-4 rounded-3xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/40 shadow-xl shadow-purple-950/30 backdrop-blur-md animate-fadeIn">
      <div className="flex items-start gap-3.5">
        {/* Icon Badge */}
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/40 text-white relative">
          <Camera className="w-5 h-5 -ml-1.5" />
          <Mic className="w-4 h-4 -mr-1.5 -mb-2 text-purple-200 absolute bottom-2 right-2" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-bold text-sm text-slate-100">
              Activar Cámara y Micrófono una sola vez
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              1 Solo Toque
            </span>
          </div>

          <p className="text-xs text-slate-300/90 leading-relaxed">
            Permite el escáner de códigos de barras, la toma de fotos de productos y la búsqueda por voz para utilizarlos al instante sin volver a pedir permisos cada vez.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleGrant}
              disabled={isRequesting}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/40 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isRequesting ? 'Concediendo permisos...' : 'Permitir Cámara y Micrófono'}</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="px-3 py-2 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-800/60 transition"
            >
              Ahora no
            </button>
          </div>
        </div>

        {/* Dismiss X */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition"
          aria-label="Cerrar aviso de permisos"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
