import React from 'react';
import {
  ShoppingCart,
  Tag,
  Share2,
  Edit3,
  Trash2,
  CheckSquare,
  Square,
  Barcode,
  Image as ImageIcon,
} from 'lucide-react';
import { Product } from '../types';

interface ProductCardItemProps {
  product: Product;
  isSelected: boolean;
  isSelectionMode: boolean;
  isAdmin: boolean;
  onToggleSelect: (id: string) => void;
  onQuickSell: (product: Product) => void;
  onEditPrice: (product: Product) => void;
  onShare: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export const ProductCardItem: React.FC<ProductCardItemProps> = React.memo(
  ({
    product: p,
    isSelected,
    isSelectionMode,
    isAdmin,
    onToggleSelect,
    onQuickSell,
    onEditPrice,
    onShare,
    onEdit,
    onDelete,
  }) => {
    const stock = Number(p.stock) || 0;
    const price = Number(p.price) || 0;
    const sold = Number(p.soldCount) || 0;

    let stockBadgeClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    let stockText = `${stock} disp.`;
    if (stock === 0) {
      stockBadgeClass = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      stockText = 'Agotado';
    } else if (stock <= 3) {
      stockBadgeClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      stockText = `Bajo: ${stock}`;
    }

    return (
      <div
        onClick={() => {
          if (isSelectionMode) {
            onToggleSelect(p.id);
          }
        }}
        className={`bg-slate-800/90 hover:bg-slate-800 p-3.5 rounded-2xl border shadow-sm flex items-center gap-3 relative transition ${
          isSelected
            ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500/50'
            : 'border-slate-700/60 hover:border-slate-600'
        } ${isSelectionMode ? 'cursor-pointer' : ''}`}
      >
        {/* Selection Checkbox */}
        {isSelectionMode && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(p.id);
            }}
            className="p-1.5 rounded-xl text-indigo-400 hover:text-indigo-300 transition shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
            title={isSelected ? 'Deseleccionar' : 'Seleccionar'}
          >
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-indigo-400 fill-indigo-500/20" />
            ) : (
              <Square className="w-5 h-5 text-slate-500 hover:text-slate-400" />
            )}
          </button>
        )}

        {/* Media Thumbnail */}
        <div className="w-18 h-18 sm:w-20 sm:h-20 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-500 shrink-0 border border-slate-700/60 overflow-hidden shadow-inner">
          {p.media ? (
            p.media.startsWith('data:video') ? (
              <video
                src={p.media}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
              />
            ) : (
              <img
                src={p.media}
                className="w-full h-full object-cover"
                alt={p.title}
                loading="lazy"
                decoding="async"
              />
            )
          ) : (
            <ImageIcon className="w-7 h-7 text-slate-600" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-1 mb-1">
            <h4 className="font-bold text-slate-100 text-sm truncate">
              {p.title}
            </h4>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded-full border shrink-0 ${stockBadgeClass}`}
            >
              {stockText}
            </span>
          </div>

          {/* Metadata row with clean text separators */}
          <div className="flex items-center gap-1.5 mb-2 text-xs text-slate-400 flex-wrap">
            <span className="text-purple-300 font-medium text-[11px]">
              {p.category || 'General'}
            </span>
            {p.barcode && (
              <>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="font-mono text-slate-400 text-[11px] flex items-center gap-1">
                  <Barcode className="w-3 h-3 text-indigo-400" />
                  <span>{p.barcode}</span>
                </span>
              </>
            )}
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Venta:</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditPrice(p);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 transition group cursor-pointer"
                title="Toca para modificar precio de venta"
              >
                <strong className="font-extrabold text-sm font-mono tabular-nums">
                  ${price.toFixed(2)}
                </strong>
                <Edit3 className="w-3 h-3 opacity-60 group-hover:opacity-100 transition" />
              </button>
              <span className="text-[10px] text-slate-400">/unidad</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
              <span>
                Total:{' '}
                <strong className="text-slate-200 font-mono tabular-nums">
                  ${(stock * price).toFixed(2)}
                </strong>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>
                Vendidos:{' '}
                <strong className="text-indigo-300 font-bold font-mono tabular-nums">{sold}</strong>
              </span>
              {isAdmin && sold > 0 && (
                <span className="text-emerald-400/90 font-medium font-mono tabular-nums">
                  (${(sold * price).toFixed(2)} cobrado)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions with tactile touch hitboxes */}
        <div className="flex flex-col gap-1.5 border-l pl-2 border-slate-700/60">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickSell(p);
            }}
            className="w-8 h-8 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 flex items-center justify-center transition active:scale-90"
            title="Vender / Sumar Stock"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditPrice(p);
            }}
            className="w-8 h-8 rounded-xl bg-slate-700/40 hover:bg-slate-700/80 text-slate-300 hover:text-emerald-400 flex items-center justify-center transition active:scale-90"
            title="Modificar Precio de Venta"
          >
            <Tag className="w-3.5 h-3.5" />
          </button>

          {/* Compartir Ficha de Producto */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShare(p);
            }}
            className="w-8 h-8 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 flex items-center justify-center transition active:scale-90"
            title="Compartir Ficha de Producto (WhatsApp, QR, Enlace)"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(p);
                }}
                className="w-8 h-8 rounded-xl bg-slate-700/40 hover:bg-slate-700/80 text-slate-400 hover:text-indigo-400 flex items-center justify-center transition active:scale-90"
                title="Editar Producto"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(p.id);
                }}
                className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 flex items-center justify-center transition active:scale-90"
                title="Eliminar Producto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
);
