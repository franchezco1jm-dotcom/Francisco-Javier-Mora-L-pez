import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Smartphone,
  Download,
  Share2,
  PlusSquare,
  MoreVertical,
  CheckCircle2,
  X,
  HelpCircle,
  Copy,
  Check,
  QrCode,
  Globe,
  Monitor,
} from 'lucide-react';

interface PWAInstallBannerProps {
  onDismiss?: () => void;
  variant?: 'banner' | 'button' | 'compact';
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  variant = 'banner',
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const appUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: 'Blackberry Inventory',
        text: 'Abre Blackberry Inventory en tu teléfono para instalarlo en tu pantalla de inicio',
        url: appUrl,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  // If dismissed in this session and in banner mode
  if (isDismissed && variant === 'banner') {
    return null;
  }

  // Already launched from home screen in standalone mode
  if (isInstalled && variant === 'banner') {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-2.5 mb-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">App instalada en tu pantalla de inicio</span>
        </div>
        <button
          onClick={() => setShowGuideModal(true)}
          className="text-[11px] text-emerald-400/80 hover:text-emerald-300 underline"
        >
          Ver guía
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Banner Mode */}
      {variant === 'banner' && (
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/40 rounded-2xl p-3.5 mb-4 shadow-lg shadow-purple-950/50">
          <button
            onClick={() => setIsDismissed(true)}
            className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-white rounded-lg transition"
            aria-label="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3">
            <img
              src="/logo.jpg"
              alt="Blackberry Inventory Logo"
              className="w-11 h-11 rounded-full border-2 border-purple-500/60 object-cover shadow-md shadow-purple-900/50 shrink-0"
            />

            <div className="flex-1 pr-6">
              <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
                <span>Descargar Blackberry Inventory</span>
                <span className="bg-purple-500/20 text-purple-300 text-[10px] px-1.5 py-0.2 rounded border border-purple-400/30 font-semibold">
                  App Móvil
                </span>
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                Instálala directamente en tu teléfono para abrirla desde la pantalla de inicio a pantalla completa.
              </p>

              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                {isInstallable ? (
                  <button
                    onClick={install}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-md shadow-purple-900/40"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Instalar en Inicio
                  </button>
                ) : (
                  <button
                    onClick={() => setShowGuideModal(true)}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-md shadow-purple-900/40"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Cómo Descargar
                  </button>
                )}

                <button
                  onClick={() => setShowGuideModal(true)}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 transition"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                  Paso a Paso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Header Button */}
      {variant === 'compact' && (
        <button
          onClick={() => (isInstallable ? install() : setShowGuideModal(true))}
          className="p-2 bg-gradient-to-r from-purple-700/60 to-indigo-700/60 hover:from-purple-600 hover:to-indigo-600 text-purple-200 rounded-xl text-xs flex items-center gap-1.5 transition border border-purple-500/40 shadow-sm"
          title="Descargar e Instalar en Pantalla de Inicio"
        >
          <Download className="w-4 h-4 text-purple-200" />
          <span className="hidden sm:inline font-bold text-[11px]">Descargar App</span>
        </button>
      )}

      {/* Step-by-Step Installation Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-60 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-900/70 w-full max-w-sm rounded-3xl p-5 shadow-2xl overflow-y-auto max-h-[92vh] space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.jpg"
                  alt="Blackberry Inventory Logo"
                  className="w-10 h-10 rounded-full border border-purple-500/70 object-cover shadow-sm shrink-0"
                />
                <div>
                  <h3 className="font-black text-sm text-white leading-tight">
                    Descargar en mi Teléfono
                  </h3>
                  <p className="text-[10px] text-purple-400 font-semibold">
                    Blackberry Inventory • Compra • Vende • Encuentra
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Share / Link Box */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[11px] text-slate-400 font-bold block">
                Enlace para abrir en tu teléfono:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={appUrl}
                  className="bg-slate-900 text-purple-300 text-xs px-2.5 py-2 rounded-xl border border-slate-700 flex-1 truncate font-mono select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition"
                >
                  <Share2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Compartir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowQR(!showQR)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition"
                >
                  <QrCode className="w-3.5 h-3.5 text-purple-400" />
                  <span>{showQR ? 'Ocultar QR' : 'Ver QR'}</span>
                </button>
              </div>

              {/* WhatsApp Mass Distribution Button */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `📲 *Blackberry Inventory* — Sistema de Inventario y Ventas\n\nAbre este enlace en tu teléfono:\n${appUrl}\n\n📌 *En Android:* Abre en Chrome > toca los 3 puntos (⋮) > "Instalar aplicación" o "Agregar a inicio".\n📌 *En iPhone (iOS):* Abre en Safari > toca Compartir (cuadro con flecha) > "Agregar al inicio".`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 transition active:scale-95"
              >
                <span>💬 Enviar a Vendedores por WhatsApp</span>
              </a>

              {/* QR Code Viewer */}
              {showQR && (
                <div className="pt-2 text-center animate-fadeIn">
                  <div className="p-3 bg-white rounded-2xl inline-block shadow-lg mx-auto">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                        appUrl
                      )}`}
                      alt="Código QR de la aplicación"
                      className="w-36 h-36 mx-auto"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    Apunta con la cámara de tu celular a este código para abrir la app al instante.
                  </p>
                </div>
              )}
            </div>

            {/* Direct One-Tap Install if available on this browser */}
            {isInstallable && (
              <div className="p-3.5 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/50 rounded-2xl text-center space-y-2">
                <p className="text-xs text-purple-200 font-bold">
                  ¡Tu navegador permite instalación directa en 1 toque!
                </p>
                <button
                  onClick={async () => {
                    await install();
                    setShowGuideModal(false);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-900/50 transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  Instalar en Mi Teléfono Ahora
                </button>
              </div>
            )}

            {/* Platform Guides */}
            <div className="space-y-3 text-xs">
              {/* Android Guide */}
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-2">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center text-[10px] font-black">
                    A
                  </div>
                  <span>En Teléfonos Android (Google Chrome / Brave):</span>
                </div>
                <ol className="text-slate-300 space-y-1.5 pl-1 text-[11px]">
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-700 text-slate-200 text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Abre el enlace en <strong className="text-white">Google Chrome</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-700 text-slate-200 text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Toca el menú de <strong className="text-white">3 puntos (⋮)</strong> en la esquina superior derecha.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-700 text-slate-200 text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Selecciona <strong className="text-purple-300">"Instalar aplicación"</strong> o{' '}
                      <strong className="text-purple-300">"Agregar a la pantalla principal"</strong>.
                    </span>
                  </li>
                </ol>
              </div>

              {/* iOS Safari Guide */}
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-400 mb-2">
                  <div className="w-5 h-5 rounded-md bg-sky-500/20 flex items-center justify-center text-[10px] font-black">
                    iOS
                  </div>
                  <span>En iPhone o iPad (Navegador Safari):</span>
                </div>
                <ol className="text-slate-300 space-y-1.5 pl-1 text-[11px]">
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-700 text-slate-200 text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Abre el enlace en <strong className="text-white">Safari</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-700 text-slate-200 text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Toca el botón <strong className="text-white">Compartir</strong>{' '}
                      <Share2 className="w-3 h-3 inline text-sky-400" /> (cuadrado con flecha hacia arriba).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-700 text-slate-200 text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Desplaza hacia abajo y toca{' '}
                      <strong className="text-sky-300">"Agregar a inicio"</strong>{' '}
                      <PlusSquare className="w-3 h-3 inline text-sky-400" />.
                    </span>
                  </li>
                </ol>
              </div>

              {/* PC / Mac Guide */}
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 mb-2">
                  <Monitor className="w-4 h-4 text-indigo-400" />
                  <span>En Computadora (Chrome / Edge):</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Haz clic en el icono de <strong className="text-white">Instalar</strong> en la barra de direcciones (esquina derecha) o en el menú de 3 puntos &gt; <strong className="text-indigo-300">"Instalar Blackberry Inventory"</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
