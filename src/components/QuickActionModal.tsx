import React, { useState } from 'react';
import { Product } from '../types';
import {
  ShoppingCart,
  PlusCircle,
  X,
  Image as ImageIcon,
  DollarSign,
  Package,
  Layers,
  Banknote,
  Edit3,
} from 'lucide-react';

interface QuickActionModalProps {
  product: Product | null;
  isAdmin: boolean;
  onClose: () => void;
  onAction: (
    productId: string,
    type: 'sell' | 'add',
    quantity: number,
    batchTotalCost?: number
  ) => void;
  onEditPrice?: (product: Product) => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  product,
  isAdmin,
  onClose,
  onAction,
  onEditPrice,
}) => {
  const [activeTab, setActiveTab] = useState<'sell' | 'add'>('sell');
  const [quantity, setQuantity] = useState<number>(1);
  const [batchTotalCost, setBatchTotalCost] = useState<number | ''>('');
  const [cashReceived, setCashReceived] = useState<number | ''>('');

  if (!product) return null;

  const stock = Number(product.stock) || 0;
  const price = Number(product.price) || 0;
  const unitCost = Number(product.cost) || 0;

  const totalToCharge = price * quantity;
  const changeToReturn =
    typeof cashReceived === 'number' && cashReceived >= totalToCharge
      ? cashReceived - totalToCharge
      : 0;

  const handleSell = () => {
    if (quantity <= 0) return;
    onAction(product.id, 'sell', quantity);
  };

  const handleAdd = () => {
    if (quantity <= 0) return;
    const finalBatchCost = typeof batchTotalCost === 'number' ? batchTotalCost : undefined;
    onAction(product.id, 'add', quantity, finalBatchCost);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-5 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Acción Rápida
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Details Card */}
        <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 mb-3.5">
          <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 shrink-0 border border-slate-700 overflow-hidden">
            {product.media ? (
              product.media.startsWith('data:video') ? (
                <video
                  src={product.media}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                />
              ) : (
                <img
                  src={product.media}
                  className="w-full h-full object-cover"
                  alt={product.title}
                />
              )
            ) : (
              <ImageIcon className="w-6 h-6 text-slate-600" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 justify-between">
              <h4 className="font-bold text-sm text-slate-100 truncate">{product.title}</h4>
              <span className="text-[9px] font-semibold text-purple-300 bg-purple-500/20 px-1.5 py-0.2 rounded border border-purple-500/30 shrink-0">
                {product.category || 'General'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {product.barcode ? `Código: ${product.barcode}` : 'Sin código asignado'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  stock === 0
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                Stock: {stock}
              </span>
              <span className="text-xs font-bold text-slate-200 inline-flex items-center gap-1">
                ${price.toFixed(2)} /u
                {onEditPrice && (
                  <button
                    type="button"
                    onClick={() => onEditPrice(product)}
                    className="p-1 text-slate-400 hover:text-emerald-400 rounded-md hover:bg-slate-700/60 transition"
                    title="Modificar precio de venta"
                  >
                    <Edit3 className="w-3 h-3 text-emerald-400" />
                  </button>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Action Toggle (Sell vs Restock if Admin) */}
        {isAdmin && (
          <div className="flex bg-slate-800/90 p-1 rounded-xl mb-3.5 border border-slate-700 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('sell');
                setQuantity(1);
              }}
              className={`flex-1 py-1.5 rounded-lg text-center transition flex items-center justify-center gap-1.5 ${
                activeTab === 'sell'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Registrar Venta</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('add');
                setQuantity(1);
              }}
              className={`flex-1 py-1.5 rounded-lg text-center transition flex items-center justify-center gap-1.5 ${
                activeTab === 'add'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Sumar Stock</span>
            </button>
          </div>
        )}

        {/* TAB 1: REGISTRAR VENTA */}
        {activeTab === 'sell' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Unidades a Vender
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-11 h-11 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-bold text-xl text-slate-200 flex items-center justify-center active:scale-95"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={stock}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, Math.min(stock, parseInt(e.target.value) || 1)))
                  }
                  className="flex-1 h-11 bg-slate-800 border border-slate-700 rounded-xl text-center text-lg font-bold text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                  className="w-11 h-11 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-bold text-xl text-slate-200 flex items-center justify-center active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            {/* Total a cobrar highlight */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-[11px] text-emerald-300/80 block">Total a Cobrar</span>
                <span className="text-xl font-black text-emerald-400">
                  ${totalToCharge.toFixed(2)}
                </span>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                <span>{quantity} x ${price.toFixed(2)}</span>
                <span className="block text-emerald-400/90 font-medium">
                  {stock - quantity} quedarán en stock
                </span>
              </div>
            </div>

            {/* Calculadora de cambio opcional */}
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5 text-slate-400" />
                  Cliente paga con ($):
                </span>
                <input
                  type="number"
                  step="0.5"
                  placeholder="Ej. 50"
                  value={cashReceived}
                  onChange={(e) =>
                    setCashReceived(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  className="w-24 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-right font-bold text-slate-100 focus:outline-none"
                />
              </div>

              {typeof cashReceived === 'number' && cashReceived >= totalToCharge && (
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-700/60">
                  <span className="font-semibold text-indigo-300">Cambio a devolver:</span>
                  <span className="font-black text-emerald-400 text-sm">
                    ${changeToReturn.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleSell}
              disabled={stock < quantity || stock === 0}
              className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition active:scale-95 ${
                stock < quantity || stock === 0
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Confirmar Venta (${totalToCharge.toFixed(2)})</span>
            </button>
          </div>
        )}

        {/* TAB 2: SUMAR STOCK (ADMIN) */}
        {activeTab === 'add' && isAdmin && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Unidades a Ingresar
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-11 h-11 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-bold text-xl text-slate-200 flex items-center justify-center active:scale-95"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 h-11 bg-slate-800 border border-slate-700 rounded-xl text-center text-lg font-bold text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-11 h-11 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-bold text-xl text-slate-200 flex items-center justify-center active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            <div className="bg-indigo-600/10 border border-indigo-500/30 p-3 rounded-2xl text-xs flex justify-between items-center text-indigo-300">
              <div>
                <span className="text-[11px] text-slate-400 block">Stock Actual: {stock} u</span>
                <span className="font-semibold text-white">Nuevo Stock Resultante:</span>
              </div>
              <strong className="text-white text-base font-black px-3 py-1 bg-indigo-600/40 rounded-xl border border-indigo-400/30">
                {stock + quantity} unid.
              </strong>
            </div>

            <button
              onClick={handleAdd}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Confirmar Ingreso (+{quantity} Unidades)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
