import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { DollarSign, X, CheckCircle2, TrendingUp, Tag } from 'lucide-react';

interface QuickPriceModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePrice: (productId: string, newPrice: number) => void;
}

export const QuickPriceModal: React.FC<QuickPriceModalProps> = ({
  product,
  isOpen,
  onClose,
  onUpdatePrice,
}) => {
  const [newPrice, setNewPrice] = useState<string>('');

  useEffect(() => {
    if (product) {
      setNewPrice(product.price ? product.price.toString() : '');
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const currentPriceNum = Number(product.price) || 0;
  const newPriceNum = parseFloat(newPrice) || 0;
  const difference = newPriceNum - currentPriceNum;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPriceNum < 0) return;
    onUpdatePrice(product.id, newPriceNum);
    onClose();
  };

  const handleAdjust = (delta: number) => {
    const val = Math.max(0, parseFloat((newPriceNum + delta).toFixed(2)));
    setNewPrice(val.toString());
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-emerald-500/40 w-full max-w-xs rounded-3xl p-5 shadow-2xl flex flex-col space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">
                Modificar Precio de Venta
              </h3>
              <p className="text-[10px] text-emerald-400 font-semibold truncate max-w-[180px]">
                {product.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current vs New comparison */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Precio Actual:</span>
            <span className="text-slate-300 font-bold text-sm">
              ${currentPriceNum.toFixed(2)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px]">Stock Disponible:</span>
            <span className="text-indigo-300 font-bold text-xs">
              {product.stock} unidades
            </span>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-emerald-300 mb-1">
              Nuevo Precio de Venta ($) *
            </label>
            <div className="relative flex items-center">
              <DollarSign className="w-5 h-5 absolute left-3 text-emerald-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                required
                autoFocus
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-emerald-500/50 rounded-2xl text-xl font-black text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Quick Adjustment buttons */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleAdjust(-1)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-700"
            >
              -$1
            </button>
            <button
              type="button"
              onClick={() => handleAdjust(1)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-xs font-bold border border-slate-700"
            >
              +$1
            </button>
            <button
              type="button"
              onClick={() => handleAdjust(5)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-xs font-bold border border-slate-700"
            >
              +$5
            </button>
            <button
              type="button"
              onClick={() => handleAdjust(10)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-xs font-bold border border-slate-700"
            >
              +$10
            </button>
          </div>

          {/* Value Difference preview */}
          {difference !== 0 && (
            <div
              className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-between ${
                difference > 0
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
              }`}
            >
              <span>Diferencia por unidad:</span>
              <span>
                {difference > 0 ? '+' : ''}${difference.toFixed(2)}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-2/3 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950 transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Precio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
