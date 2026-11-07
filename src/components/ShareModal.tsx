import React, { useState } from 'react';
import { Product } from '../types';
import {
  Share2,
  Copy,
  Check,
  X,
  QrCode,
  Globe,
  MessageCircle,
  Mail,
  Send,
  ShieldCheck,
  Tag,
  Package,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  productToShare?: Product | null;
  onClose: () => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  productToShare = null,
  onClose,
  onToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(true);

  if (!isOpen) return null;

  // The actual URL to share (current location, fallback to origin)
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://catalogo.app';

  const appTitle = productToShare
    ? `${productToShare.title} - Blackberry Inventory`
    : 'Blackberry Inventory - Catálogo en Tiempo Real';

  const shareText = productToShare
    ? `🛍️ *${productToShare.title}*\n💵 *Precio:* $${Number(productToShare.price).toFixed(2)}\n📦 *Stock:* ${
        productToShare.stock
      } unidades disponibles\n🏷️ *Categoría:* ${productToShare.category || 'General'}\n\nRevisa la ficha en vivo aquí:`
    : '¡Hola! Te comparto nuestro catálogo de productos en vivo con precios y stock actualizado:';

  const handleCopyLink = async () => {
    try {
      const textToCopy = `${shareText}\n${currentUrl}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      onToast('Enlace y ficha copiados al portapapeles');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onToast('No se pudo copiar el enlace', 'error');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: appTitle,
          text: shareText,
          url: currentUrl,
        });
        onToast('Compartido con éxito');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const getWhatsAppUrl = () => {
    const fullMessage = `${shareText}\n${currentUrl}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`;
  };

  const getTelegramUrl = () => {
    return `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`;
  };

  const getEmailUrl = () => {
    const subject = encodeURIComponent(
      productToShare ? `Ficha: ${productToShare.title}` : 'Catálogo de Productos - Blackberry Inventory'
    );
    const body = encodeURIComponent(`${shareText}\n\n${currentUrl}`);
    return `mailto:?subject=${subject}&body=${body}`;
  };

  // Safe online QR code image generator using standard reliable API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    currentUrl
  )}&margin=10&color=0f172a&bgcolor=ffffff`;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-purple-500/30 w-full max-w-md rounded-3xl p-5 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {productToShare ? 'Compartir Ficha de Producto' : 'Compartir Catálogo'}
              </h3>
              <p className="text-[11px] text-purple-300">
                {productToShare
                  ? 'Envía precio, stock y detalles por WhatsApp o redes'
                  : 'Acceso público en vivo para clientes y socios'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 overflow-y-auto pr-1 text-xs">
          {/* If sharing a specific product, show product mini card */}
          {productToShare && (
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-purple-500/30 flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 shrink-0 border border-slate-800 overflow-hidden">
                {productToShare.media ? (
                  <img
                    src={productToShare.media}
                    alt={productToShare.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-5 h-5 text-purple-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white text-xs truncate">{productToShare.title}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-extrabold text-emerald-400 text-sm">
                    ${Number(productToShare.price).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Stock: {productToShare.stock} unid.
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-semibold">
                {productToShare.category || 'General'}
              </span>
            </div>
          )}

          {/* Link Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Enlace Directo:</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono select-all truncate focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/40'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Native Web Share Button */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 transition active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir con Menú Nativo del Teléfono (Web Share)</span>
          </button>

          {/* Social Channels */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
              Enviar directamente a:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition"
              >
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                <span>WhatsApp</span>
              </a>

              <a
                href={getTelegramUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-sky-950/50 hover:bg-sky-900/60 border border-sky-500/30 text-sky-300 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition"
              >
                <Send className="w-5 h-5 text-sky-400" />
                <span>Telegram</span>
              </a>

              <a
                href={getEmailUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition"
              >
                <Mail className="w-5 h-5 text-purple-400" />
                <span>Correo</span>
              </a>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-purple-400" />
                <span>Código QR para Escaneo con Cámara</span>
              </span>
              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className="text-[11px] text-purple-400 hover:text-purple-300 underline font-medium"
              >
                {showQr ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>

            {showQr && (
              <div className="flex flex-col items-center justify-center pt-1 pb-1">
                <div className="p-3 bg-white rounded-2xl shadow-xl border-2 border-purple-500/40 inline-block">
                  <img
                    src={qrCodeUrl}
                    alt="Código QR del Catálogo"
                    className="w-40 h-40 object-contain rounded-lg"
                    loading="lazy"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-2 text-center max-w-xs">
                  Apunta con la cámara de cualquier teléfono para abrir el catálogo al instante.
                </p>
              </div>
            )}
          </div>

          {/* Public Access Guide */}
          <div className="bg-indigo-950/30 p-3 rounded-2xl border border-indigo-500/20 text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-indigo-300">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Acceso Público y PWA Formal</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Cualquiera que abra este enlace podrá ver los productos en tiempo real, filtrar y buscar sin necesidad de crear cuenta ni instalar aplicaciones previas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
