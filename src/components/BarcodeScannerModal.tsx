import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  X,
  AlertTriangle,
  RefreshCw,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Banknote,
  Layers,
  ChevronDown,
  ChevronUp,
  Package,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { Product, BatchCartItem } from '../types';
import { playScannerBeep } from '../utils/audio';
import { getSavedCameraId } from '../utils/permissionManager';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSingle: (barcode: string) => void;
  onConfirmBatchSale?: (
    items: BatchCartItem[],
    batchType: 'sell' | 'restock'
  ) => void;
  products?: Product[];
  initialMode?: 'single' | 'batch' | 'add';
  title?: string;
  isAdmin?: boolean;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSingle,
  onConfirmBatchSale,
  products = [],
  initialMode = 'single',
  title = 'Lector de Códigos',
  isAdmin = false,
}) => {
  // Scanner modes: 'single' (traditional), 'batch' (multi-scan cart), or 'add' (register new product)
  const [mode, setMode] = useState<'single' | 'batch' | 'add'>(initialMode);
  // In batch mode: 'sell' (sales cart) or 'restock' (incoming stock)
  const [batchAction, setBatchAction] = useState<'sell' | 'restock'>('sell');

  const [batchCart, setBatchCart] = useState<BatchCartItem[]>([]);
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Cash change calculator state
  const [cashReceived, setCashReceived] = useState<string>('');

  // Scanner status
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedFeedback, setLastScannedFeedback] = useState<{
    text: string;
    subtext?: string;
    type: 'success' | 'warning' | 'info';
    id: number;
  } | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'barcode-scanner-viewport';
  const lastScannedTimeRef = useRef<{ code: string; time: number }>({
    code: '',
    time: 0,
  });

  // Keep latest mode in a ref for the camera callback
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const batchActionRef = useRef(batchAction);
  batchActionRef.current = batchAction;

  const productsRef = useRef(products);
  productsRef.current = products;

  const batchCartRef = useRef(batchCart);
  batchCartRef.current = batchCart;

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setBatchCart([]);
      setIsCartExpanded(false);
      setIsCheckoutOpen(false);
      setCashReceived('');
      setLastScannedFeedback(null);
      lastScannedTimeRef.current = { code: '', time: 0 };
    }
  }, [isOpen, initialMode]);

  // Camera start / stop lifecycle
  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg(null);
    let isCancelled = false;

    const timer = setTimeout(async () => {
      try {
        const qrCode = new Html5Qrcode(scannerContainerId);
        html5QrCodeRef.current = qrCode;

        const config = {
          fps: 15,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.0,
        };

        const savedCameraId = getSavedCameraId();
        let started = false;

        if (savedCameraId) {
          try {
            await qrCode.start(
              { deviceId: { exact: savedCameraId } },
              config,
              (decodedText) => {
                if (isCancelled) return;
                handleDecodedBarcode(decodedText.trim());
              },
              () => {}
            );
            started = true;
          } catch {
            // fallback below
          }
        }

        if (!started) {
          await qrCode.start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
              if (isCancelled) return;
              handleDecodedBarcode(decodedText.trim());
            },
            () => {}
          );
        }

        // Remember camera ID and permission approval to prevent re-prompts
        try {
          localStorage.setItem('inventory_permissions_granted_v2', 'true');
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            const backCam =
              cameras.find((c) => /back|rear|environment|trasera/i.test(c.label)) ||
              cameras[cameras.length - 1];
            if (backCam?.id) {
              localStorage.setItem('inventory_preferred_camera_id', backCam.id);
            }
          }
        } catch {
          // ignore
        }

        if (!isCancelled) {
          setIsScanning(true);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          console.error('Camera scan error:', err);
          setErrorMsg(
            'No se pudo acceder a la cámara. Verifica los permisos de la cámara en tu navegador.'
          );
        }
      }
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.error('Error stopping scanner:', e);
      }
      html5QrCodeRef.current = null;
    }
    // Explicitly release camera video tracks to avoid memory exhaustion and browser tab restarts
    try {
      const container = document.getElementById(scannerContainerId);
      if (container) {
        const videos = container.getElementsByTagName('video');
        for (let i = 0; i < videos.length; i++) {
          const videoStream = videos[i].srcObject as MediaStream;
          if (videoStream && videoStream.getTracks) {
            videoStream.getTracks().forEach((track) => track.stop());
          }
        }
      }
    } catch {
      // ignore
    }
    setIsScanning(false);
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  // Barcode detection processor
  const handleDecodedBarcode = (code: string) => {
    const currentMode = modeRef.current;

    // Single or Add mode: trigger and finish
    if (currentMode === 'single' || currentMode === 'add') {
      playScannerBeep('success');
      stopScanner();
      onScanSingle(code);
      return;
    }

    // BATCH / MULTI-SCAN MODE
    const now = Date.now();
    // Debounce duplicate scans within 1.2s
    if (
      code === lastScannedTimeRef.current.code &&
      now - lastScannedTimeRef.current.time < 1200
    ) {
      return;
    }
    lastScannedTimeRef.current = { code, time: now };

    const currentProducts = productsRef.current;
    const currentAction = batchActionRef.current;
    const currentCart = batchCartRef.current;

    const matchedProduct = currentProducts.find((p) => p.barcode === code);

    if (!matchedProduct) {
      playScannerBeep('warning');
      setLastScannedFeedback({
        text: `Código no registrado: ${code}`,
        subtext: 'Este artículo no está en el catálogo.',
        type: 'warning',
        id: now,
      });
      return;
    }

    // Check stock if in 'sell' mode
    const existingInCart = currentCart.find(
      (item) => item.product.id === matchedProduct.id
    );
    const currentQtyInCart = existingInCart ? existingInCart.quantity : 0;

    if (currentAction === 'sell') {
      if (currentQtyInCart >= matchedProduct.stock) {
        playScannerBeep('warning');
        setLastScannedFeedback({
          text: `Stock agotado: ${matchedProduct.title}`,
          subtext: `Disponible: ${matchedProduct.stock} unid.`,
          type: 'warning',
          id: now,
        });
        return;
      }
    }

    // Successfully add / increment
    playScannerBeep('success');
    setBatchCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === matchedProduct.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      } else {
        return [...prev, { product: matchedProduct, quantity: 1 }];
      }
    });

    setLastScannedFeedback({
      text: `+1 ${matchedProduct.title}`,
      subtext:
        currentAction === 'sell'
          ? `$${matchedProduct.price.toFixed(2)} c/u • Subtotal: $${(
              (currentQtyInCart + 1) *
              matchedProduct.price
            ).toFixed(2)}`
          : `Stock sumado (+1)`,
      type: 'success',
      id: now,
    });
  };

  // Cart item management
  const updateQuantity = (productId: string, delta: number) => {
    setBatchCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (batchAction === 'sell' && nextQty > item.product.stock) {
              playScannerBeep('warning');
              setLastScannedFeedback({
                text: `Stock máximo alcanzado`,
                subtext: `Solo hay ${item.product.stock} disponibles.`,
                type: 'warning',
                id: Date.now(),
              });
              return item;
            }
            if (nextQty <= 0) {
              playScannerBeep('remove');
              return null;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as BatchCartItem[];
    });
  };

  const removeItem = (productId: string) => {
    playScannerBeep('remove');
    setBatchCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    if (batchCart.length === 0) return;
    playScannerBeep('remove');
    setBatchCart([]);
    setLastScannedFeedback(null);
  };

  // Financial calculations
  const totalItemsCount = batchCart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = batchCart.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0
  );

  const cashNum = parseFloat(cashReceived) || 0;
  const changeDue = Math.max(0, cashNum - totalCartAmount);

  // Confirm final batch sale or restock
  const handleFinalizeBatch = async () => {
    if (batchCart.length === 0) return;

    playScannerBeep('complete');
    await stopScanner();

    if (onConfirmBatchSale) {
      onConfirmBatchSale(batchCart, batchAction);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950 z-[80] flex flex-col justify-between overflow-hidden">
      {/* 1. TOP HEADER WITH MODE SWITCHER */}
      <div className="bg-slate-900/95 border-b border-purple-900/40 px-3.5 py-2.5 z-20">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-white leading-none">
                {title}
              </h3>
              <p className="text-[10px] text-purple-300/80 mt-0.5">
                {mode === 'batch'
                  ? 'Escaneo Múltiple Continuo por Lotes'
                  : mode === 'add'
                  ? 'Escanear para Dar de Alta / Agregar Producto'
                  : 'Escaneo Individual Directo'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition"
            aria-label="Cerrar escáner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 gap-1 text-xs">
          <button
            onClick={() => setMode('single')}
            className={`flex-1 py-1.5 rounded-lg font-bold text-center transition flex items-center justify-center gap-1.5 ${
              mode === 'single'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Buscar / Venta</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setMode('add')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-center transition flex items-center justify-center gap-1.5 ${
                mode === 'add'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/50'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Dar de Alta</span>
            </button>
          )}
          <button
            onClick={() => setMode('batch')}
            className={`flex-1 py-1.5 rounded-lg font-bold text-center transition flex items-center justify-center gap-1.5 ${
              mode === 'batch'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Lotes</span>
            {batchCart.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>

        {/* Batch Action Toggle (Venta vs Reabastecimiento) when in batch mode */}
        {mode === 'batch' && (
          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/80 text-[11px]">
            <span className="text-slate-400 font-medium">Operación del Lote:</span>
            <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setBatchAction('sell')}
                className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 ${
                  batchAction === 'sell'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShoppingCart className="w-3 h-3" />
                <span>Venta</span>
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setBatchAction('restock')}
                  className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 ${
                    batchAction === 'restock'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Package className="w-3 h-3" />
                  <span>Ingreso Stock</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. CAMERA VIEWFINDER VIEWPORT */}
      <div className="relative flex-1 flex flex-col items-center justify-center bg-black min-h-0 overflow-hidden">
        <div id={scannerContainerId} className="w-full h-full object-cover" />

        {/* Targeting Reticle */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
            <div className="w-64 h-36 border-2 border-dashed border-purple-400/70 rounded-2xl relative shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              {/* Corner accents */}
              <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-purple-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-purple-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-purple-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-purple-400 rounded-br-lg" />

              {/* Animated Red Laser Line */}
              <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-pulse" />
            </div>

            <p className="text-[11px] text-white/80 bg-slate-950/70 backdrop-blur-sm px-3 py-1 rounded-full mt-3 border border-slate-700/60 shadow-lg">
              {mode === 'batch'
                ? 'Apunta a cada código consecutivamente'
                : 'Apunta al código para consultar'}
            </p>
          </div>
        )}

        {/* Loading / Error states */}
        {!isScanning && !errorMsg && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-300">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
            <p className="text-xs font-semibold">Activando cámara trasera...</p>
          </div>
        )}

        {errorMsg && (
          <div className="absolute inset-x-4 bg-slate-900/95 p-5 rounded-2xl border border-rose-500/40 text-center z-10">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <p className="text-xs text-rose-200">{errorMsg}</p>
          </div>
        )}

        {/* Real-time Scan Feedback Overlay Badge */}
        {lastScannedFeedback && (
          <div
            key={lastScannedFeedback.id}
            className={`absolute top-4 inset-x-4 z-30 p-2.5 rounded-2xl shadow-2xl backdrop-blur-md border animate-bounce flex items-center justify-between ${
              lastScannedFeedback.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100 shadow-emerald-950/60'
                : lastScannedFeedback.type === 'warning'
                ? 'bg-amber-950/95 border-amber-500/50 text-amber-100 shadow-amber-950/60'
                : 'bg-purple-950/95 border-purple-500/50 text-purple-100 shadow-purple-950/60'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {lastScannedFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <div className="truncate">
                <p className="text-xs font-black truncate">{lastScannedFeedback.text}</p>
                {lastScannedFeedback.subtext && (
                  <p className="text-[10px] opacity-80 truncate">
                    {lastScannedFeedback.subtext}
                  </p>
                )}
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 shrink-0 ml-2">
              Lote ({totalItemsCount})
            </span>
          </div>
        )}
      </div>

      {/* 3. BOTTOM PANEL */}
      {mode === 'single' ? (
        /* Single Mode Simple Bottom Bar */
        <div className="p-3.5 bg-slate-900/95 border-t border-slate-800 text-center flex justify-between items-center z-20">
          <p className="text-xs text-slate-400">Escaneo de un solo producto</p>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            Cancelar
          </button>
        </div>
      ) : (
        /* BATCH / MULTI-SCAN TRAY (LISTA DE VENTA) */
        <div className="bg-slate-900/95 border-t border-purple-900/50 flex flex-col z-20 max-h-[50vh] transition-all duration-300">
          {/* Tray Header Bar (Always visible) */}
          <div
            onClick={() => setIsCartExpanded(!isCartExpanded)}
            className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-xs">
                {totalItemsCount}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white leading-none">
                    {batchAction === 'sell' ? 'Lista de Venta' : 'Lote de Ingreso'}
                  </h4>
                  <span className="text-[10px] text-purple-400 font-semibold">
                    ({batchCart.length} {batchCart.length === 1 ? 'producto' : 'productos'})
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {batchCart.length === 0
                    ? 'Apunta a los códigos de barras para ir sumando'
                    : isCartExpanded
                    ? 'Toca para encoger la lista'
                    : 'Toca para ver el detalle de artículos'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block leading-tight">
                  Total
                </span>
                <span className="text-sm font-black text-emerald-400 leading-none">
                  ${totalCartAmount.toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                {isCartExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Tray Items List (Expandable or scrollable) */}
          {isCartExpanded && (
            <div className="p-3 space-y-2 overflow-y-auto max-h-48 divide-y divide-slate-800/80 bg-slate-900/60">
              {batchCart.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">
                  <ShoppingCart className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                  <p>Aún no hay productos en la lista.</p>
                  <p className="text-[10px] text-slate-600">
                    Apunta la cámara a los productos para agregarlos automáticamente.
                  </p>
                </div>
              ) : (
                batchCart.map((item) => {
                  const subtotal = item.quantity * item.product.price;
                  return (
                    <div
                      key={item.product.id}
                      className="pt-2 first:pt-0 flex items-center justify-between gap-2 text-xs"
                    >
                      {/* Product Info */}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-100 truncate">
                          {item.product.title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="text-emerald-400 font-semibold">
                            ${item.product.price.toFixed(2)} c/u
                          </span>
                          {batchAction === 'sell' && (
                            <span className="text-slate-500">
                              (Stock: {item.product.stock})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stepper Quantity & Subtotal */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="p-1 hover:bg-slate-700 text-slate-300 rounded-l-lg transition"
                            title="Disminuir"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-black text-xs text-white min-w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="p-1 hover:bg-slate-700 text-slate-300 rounded-r-lg transition"
                            title="Aumentar"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-bold text-white text-xs min-w-12 text-right">
                          ${subtotal.toFixed(2)}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeItem(item.product.id)}
                          className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
                          title="Quitar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Action Confirmation Buttons */}
          <div className="p-3 bg-slate-950 flex items-center gap-2 border-t border-slate-800">
            {batchCart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="px-3 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-rose-300 hover:border-rose-500/40 text-xs font-semibold transition"
                title="Vaciar Lista"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              disabled={batchCart.length === 0}
              onClick={() => {
                if (batchAction === 'sell') {
                  setCashReceived(totalCartAmount > 0 ? totalCartAmount.toString() : '');
                  setIsCheckoutOpen(true);
                } else {
                  handleFinalizeBatch();
                }
              }}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg disabled:opacity-40 disabled:pointer-events-none bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/40 active:scale-98"
            >
              {batchAction === 'sell' ? (
                <>
                  <Banknote className="w-4 h-4" />
                  <span>
                    Cobrar Venta ({totalItemsCount} arts. — ${totalCartAmount.toFixed(2)})
                  </span>
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  <span>
                    Confirmar Ingreso ({totalItemsCount} unid.)
                  </span>
                </>
              )}
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>
          </div>
        </div>
      )}

      {/* 4. CHECKOUT SUMMARY & CASH CHANGE MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-60 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-900/60 w-full max-w-sm rounded-3xl p-5 shadow-2xl flex flex-col space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Confirmar Venta</h3>
                  <p className="text-[11px] text-slate-400">
                    {totalItemsCount} artículos en lista de venta
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total Due Banner */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-400">Total a Cobrar:</span>
              <span className="text-xl font-black text-emerald-400">
                ${totalCartAmount.toFixed(2)}
              </span>
            </div>

            {/* Quick cash / change calculator */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Efectivo Recibido ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-lg font-black text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />

              {/* Quick Money Buttons */}
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setCashReceived(totalCartAmount.toFixed(2))}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold border border-slate-700"
                >
                  Exacto
                </button>
                {[50, 100, 200, 500, 1000].map((denomination) => (
                  <button
                    key={denomination}
                    type="button"
                    onClick={() => setCashReceived(denomination.toString())}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg text-[11px] font-bold border border-purple-500/20"
                  >
                    ${denomination}
                  </button>
                ))}
              </div>
            </div>

            {/* Change Result */}
            {cashNum > 0 && (
              <div
                className={`p-3 rounded-2xl border flex justify-between items-center text-xs ${
                  cashNum >= totalCartAmount
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}
              >
                <span className="font-semibold">
                  {cashNum >= totalCartAmount ? 'Cambio a Entregar:' : 'Monto Faltante:'}
                </span>
                <span className="text-base font-black">
                  ${Math.abs(cashNum - totalCartAmount).toFixed(2)}
                </span>
              </div>
            )}

            {/* Final Confirmation Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleFinalizeBatch}
                className="w-2/3 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar y Finalizar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
