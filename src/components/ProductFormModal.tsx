import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import {
  Camera,
  X,
  Trash2,
  DollarSign,
  Upload,
  Barcode,
  Layers,
  ChevronDown,
  ChevronUp,
  Tag,
} from 'lucide-react';
import { CameraCaptureModal } from './CameraCaptureModal';
import { compressImage } from '../utils/imageCompressor';

interface ProductFormModalProps {
  isOpen: boolean;
  initialProduct?: Product | null;
  prefilledBarcode?: string;
  existingCategories?: string[];
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id'> & { id?: string }) => void;
  onDelete?: (productId: string) => void;
  onRequestScan: () => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

const DEFAULT_CATEGORIES = [
  'Smartphones',
  'Accesorios',
  'Cargadores',
  'Audio',
  'Fundas & Micas',
  'Gaming',
  'Smartwatches',
  'General',
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  initialProduct,
  prefilledBarcode = '',
  existingCategories = [],
  onClose,
  onSave,
  onDelete,
  onRequestScan,
  onToast,
}) => {
  const [barcode, setBarcode] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('General');
  const [stock, setStock] = useState<number>(1);
  const [price, setPrice] = useState<number | ''>('');
  const [soldCount, setSoldCount] = useState<number>(0);
  const [media, setMedia] = useState<string>('');

  // Optional cost override (collapsed by default)
  const [showOptionalCost, setShowOptionalCost] = useState(false);
  const [optionalCost, setOptionalCost] = useState<number | ''>('');

  // Live in-app camera modal state
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (initialProduct) {
      setBarcode(prefilledBarcode || initialProduct.barcode || '');
      setTitle(initialProduct.title || '');
      setCategory(initialProduct.category || 'General');
      setStock(initialProduct.stock ?? 1);
      setPrice(initialProduct.price ?? '');
      setSoldCount(initialProduct.soldCount ?? 0);
      setMedia(initialProduct.media || '');

      if (initialProduct.cost && initialProduct.cost > 0) {
        setOptionalCost(initialProduct.cost);
        setShowOptionalCost(true);
      } else {
        setOptionalCost('');
        setShowOptionalCost(false);
      }
    } else {
      // New product: initialize if form is fresh
      if (prefilledBarcode && !barcode) {
        setBarcode(prefilledBarcode);
      } else if (!barcode && !title && !price) {
        setBarcode(prefilledBarcode || '');
        setTitle('');
        setCategory('General');
        setStock(1);
        setPrice('');
        setSoldCount(0);
        setMedia('');
        setOptionalCost('');
        setShowOptionalCost(false);
      }
    }
  }, [isOpen, initialProduct]);

  // When a barcode is scanned while form is already open
  useEffect(() => {
    if (prefilledBarcode) {
      setBarcode(prefilledBarcode);
    }
  }, [prefilledBarcode]);

  if (!isOpen) return null;

  const priceNum = Number(price) || 0;
  const stockNum = Math.max(1, Number(stock) || 1);
  const totalRetailValue = priceNum * stockNum;

  // Combine default categories with any existing ones without duplicates
  const categorySuggestions = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...existingCategories.filter(Boolean)])
  );

  const handleGalleryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 600, 600, 0.78);
      setMedia(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setMedia(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = async (photoBase64: string) => {
    try {
      const compressed = await compressImage(photoBase64, 600, 600, 0.78);
      setMedia(compressed);
    } catch {
      setMedia(photoBase64);
    }
    onToast('Foto capturada correctamente con la cámara');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onToast('El nombre del producto es obligatorio', 'error');
      return;
    }

    const costValue = typeof optionalCost === 'number' && optionalCost > 0 ? optionalCost : 0;

    onSave({
      id: initialProduct?.id,
      barcode: barcode.trim(),
      title: title.trim(),
      category: category.trim() || 'General',
      cost: costValue,
      totalCost: costValue * stockNum,
      price: priceNum,
      stock: stockNum,
      soldCount: Number(soldCount) || 0,
      media,
      updatedAt: Date.now(),
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-5 py-3.5 bg-slate-800/95 border-b border-slate-700/60 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>{initialProduct ? 'Editar Producto' : 'Nuevo Producto'}</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Ingresa nombre, categoría, stock y precio de venta
              </p>
            </div>
            <div className="flex items-center gap-1">
              {initialProduct && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(initialProduct.id)}
                  className="text-rose-400 hover:text-rose-300 p-1.5 rounded-xl hover:bg-rose-950/40 border border-rose-500/20 transition"
                  title="Eliminar este producto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
            {/* 1. Nombre del Producto */}
            <div>
              <label className="block font-semibold text-slate-200 mb-1">
                Nombre del Producto / Descripción *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. iPhone 14 Pro, Funda Silicona, Cargador 20W..."
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
              />
            </div>

            {/* 2. Categoría del Producto */}
            <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-purple-400" />
                  <span>Categoría del Producto</span>
                </label>
                <span className="text-[10px] text-purple-400 font-medium">
                  {category || 'General'}
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  list="category-suggestions"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Selecciona o escribe una categoría..."
                  className="w-full px-3 py-2 bg-slate-900 border border-purple-500/30 rounded-xl text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:outline-none text-xs"
                />
                <datalist id="category-suggestions">
                  {categorySuggestions.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              {/* Quick Category Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {categorySuggestions.slice(0, 8).map((cat) => {
                  const isSelected = category.toLowerCase().trim() === cat.toLowerCase().trim();
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition active:scale-95 ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/50 border border-purple-400/50'
                          : 'bg-slate-900/80 text-slate-300 border border-slate-700/60 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Código de Barras (Opcional con escáner) */}
            <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Barcode className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Código de Barras / QR</span>
                </label>
                <button
                  type="button"
                  onClick={onRequestScan}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-emerald-950/40"
                  title="Abrir cámara y escanear código"
                >
                  <Camera className="w-4 h-4" />
                  <span>Escanear con Cámara</span>
                </button>
              </div>
              <div className="relative">
                <Barcode className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Escanea con la cámara o escribe manualmente..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                />
              </div>
            </div>

            {/* 3. Cantidad en Stock & Precio de Venta */}
            <div className="grid grid-cols-2 gap-3 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
              <div>
                <label className="block font-semibold text-slate-200 mb-1">
                  Cantidad en Stock *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={stock}
                  onChange={(e) => setStock(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-center text-base font-bold text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-emerald-300 mb-1">
                  Precio de Venta ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-900 border border-emerald-500/50 rounded-xl text-base font-bold text-emerald-400 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {priceNum > 0 && (
                <div className="col-span-2 bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-700/60 flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Total en venta de este producto:</span>
                  <strong className="text-emerald-300 font-bold text-xs">
                    ${totalRetailValue.toFixed(2)} ({stockNum} x ${priceNum.toFixed(2)})
                  </strong>
                </div>
              )}
            </div>

            {/* 4. FOTO DEL PRODUCTO DIRECTA CON CÁMARA */}
            <div className="space-y-2">
              <label className="block font-semibold text-slate-200">
                Foto del Producto
              </label>

              {media ? (
                /* Preview when photo exists */
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 max-h-48 bg-black flex items-center justify-center">
                  {media.startsWith('data:video') ? (
                    <video
                      src={media}
                      className="max-h-48 w-full object-contain"
                      controls
                      autoPlay
                      loop
                      muted
                    />
                  ) : (
                    <img
                      src={media}
                      className="max-h-48 w-full object-contain"
                      alt="Foto del producto"
                    />
                  )}
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsCameraModalOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-lg flex items-center gap-1 transition"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Retomar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMedia('')}
                      className="bg-rose-600 hover:bg-rose-500 text-white w-7 h-7 rounded-xl flex items-center justify-center shadow-lg transition"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Buttons to capture photo */
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCameraModalOpen(true)}
                    className="py-3 px-3 bg-gradient-to-tr from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 active:scale-95 text-white rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition border border-indigo-400/30"
                  >
                    <Camera className="w-6 h-6 text-white" />
                    <span>Tomar Foto con Cámara</span>
                  </button>

                  <label className="py-3 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-2xl font-semibold text-xs flex flex-col items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition">
                    <Upload className="w-6 h-6 text-slate-400" />
                    <span>Elegir de Galería</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleGalleryFile}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Opcional: Asignar costo unitario específico si el usuario lo desea */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowOptionalCost((prev) => !prev)}
                className="text-[11px] text-slate-400 hover:text-slate-300 flex items-center gap-1 font-medium transition"
              >
                {showOptionalCost ? (
                  <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span>¿Deseas asignar un costo individual a este producto? (Opcional)</span>
              </button>

              {showOptionalCost && (
                <div className="mt-2 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                    Costo individual de compra ($) (Opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={optionalCost}
                    onChange={(e) =>
                      setOptionalCost(e.target.value === '' ? '' : parseFloat(e.target.value))
                    }
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    No es obligatorio: puedes manejar tu inversión global desde el panel principal.
                  </p>
                </div>
              )}
            </div>

            {/* Unidades vendidas (solo si ya se está editando un producto existente) */}
            {initialProduct && (
              <div className="flex items-center justify-between bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                <label className="text-slate-300 font-semibold">Unidades ya vendidas:</label>
                <input
                  type="number"
                  min="0"
                  value={soldCount}
                  onChange={(e) => setSoldCount(parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-center font-bold text-slate-100"
                />
              </div>
            )}

            {/* Botones de acción */}
            <div className="pt-2 space-y-2">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-2.5 border border-slate-700 text-slate-300 rounded-xl font-semibold hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/30 transition text-xs flex items-center justify-center gap-1.5"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Guardar Producto</span>
                </button>
              </div>

              {initialProduct && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(initialProduct.id)}
                  className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-semibold transition text-xs flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Eliminar este producto del inventario</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Cámara en vivo directa */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraCapture}
      />
    </>
  );
};
