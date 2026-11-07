import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Upload,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit2,
  RefreshCw,
  Plus,
  HelpCircle,
} from 'lucide-react';
import {
  ParsedImportItem,
  parseExcelFile,
  parsePdfFile,
  parseTextLines,
  downloadExcelTemplate,
} from '../utils/importProducts';
import { Product } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportProducts: (
    items: ParsedImportItem[],
    mode: 'merge' | 'replace'
  ) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportProducts,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [parsedItems, setParsedItems] = useState<ParsedImportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);

    try {
      let results: ParsedImportItem[] = [];
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'pdf') {
        results = await parsePdfFile(file);
      } else if (['xlsx', 'xls', 'csv'].includes(extension || '')) {
        results = await parseExcelFile(file);
      } else {
        onToast('Formato no soportado. Usa .xlsx, .xls, .csv o .pdf', 'error');
        setIsLoading(false);
        return;
      }

      if (results.length === 0) {
        onToast('No se pudieron detectar productos en el archivo', 'error');
      } else {
        setParsedItems(results);
        onToast(`Se detectaron ${results.length} productos listos para importar`);
      }
    } catch (err) {
      console.error('Import error:', err);
      onToast('Error al leer el archivo. Revisa el formato.', 'error');
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      onToast('Pega texto con tu lista de productos', 'error');
      return;
    }
    const lines = pastedText.split('\n');
    const results = parseTextLines(lines);

    if (results.length === 0) {
      onToast('No se encontraron productos en el texto pegado', 'error');
      return;
    }

    setParsedItems(results);
    setFileName('Texto pegado');
    onToast(`Se detectaron ${results.length} productos`);
  };

  const handleUpdateItem = (
    id: string,
    field: 'title' | 'barcode' | 'category' | 'stock' | 'price',
    value: any
  ) => {
    setParsedItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    setParsedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleConfirmImport = () => {
    if (parsedItems.length === 0) return;
    onImportProducts(parsedItems, importMode);
    onToast(
      `¡${parsedItems.length} productos ingresados correctamente al inventario!`
    );
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setParsedItems([]);
    setFileName(null);
    setPastedText('');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-purple-900/60 w-full max-w-xl rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-xl shadow-md shadow-purple-950">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">
                Ingresar Productos (Excel o PDF)
              </h3>
              <p className="text-[11px] text-purple-400 font-semibold">
                Importación masiva rápida al catálogo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {parsedItems.length === 0 ? (
            /* Upload & Source Selection View */
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('file')}
                  className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'file'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Subir Archivo (Excel o PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'paste'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Pegar Lista / Texto</span>
                </button>
              </div>

              {activeTab === 'file' ? (
                /* File Dropzone */
                <div className="space-y-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-purple-500/40 hover:border-purple-400 rounded-3xl p-8 text-center cursor-pointer transition bg-purple-950/10 hover:bg-purple-950/20 flex flex-col items-center justify-center gap-3 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-purple-600/20 text-purple-300 border border-purple-500/30 flex items-center justify-center group-hover:scale-105 transition shadow-lg">
                      {isLoading ? (
                        <RefreshCw className="w-7 h-7 animate-spin text-purple-400" />
                      ) : (
                        <Upload className="w-7 h-7 text-purple-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">
                        {isLoading ? 'Analizando archivo...' : 'Toca para seleccionar tu archivo'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Soporta hojas de cálculo <strong className="text-emerald-400">Excel (.xlsx, .xls, .csv)</strong> y documentos <strong className="text-rose-400">PDF (.pdf)</strong>
                      </p>
                    </div>

                    <span className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-900/40 transition">
                      Explorar en mi dispositivo
                    </span>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Sample template button */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>¿Quieres una plantilla prediseñada para llenar?</span>
                    </div>
                    <button
                      type="button"
                      onClick={downloadExcelTemplate}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white font-bold rounded-xl border border-slate-700 transition"
                    >
                      Descargar Plantilla Excel
                    </button>
                  </div>
                </div>
              ) : (
                /* Paste Text View */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Pega aquí las líneas de tu lista o factura:
                    </label>
                    <textarea
                      rows={6}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder={`Ejemplo:\nFunda iPhone 14 - 15 unidades - $12.50\nAudífonos Bluetooth - 8 unid - $28.00\n750100234003 - Cargador 20W - 20 - $15.00`}
                      className="w-full p-3 bg-slate-950 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleParsePastedText}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-md shadow-purple-900/40 transition"
                  >
                    Detectar Productos del Texto
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* PREVIEW AND ADJUST TABLE VIEW */
            <div className="space-y-3">
              {/* Summary Banner */}
              <div className="flex items-center justify-between p-3 bg-purple-950/40 border border-purple-500/40 rounded-2xl text-xs">
                <div className="flex items-center gap-2 text-purple-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>{parsedItems.length}</strong> productos detectados en{' '}
                    <span className="text-white italic">"{fileName}"</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-rose-300 underline"
                >
                  Cambiar archivo
                </button>
              </div>

              {/* Mode Switch (Merge vs Replace) */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                <span className="font-bold text-slate-300 block">
                  Modo de incorporación al catálogo:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`p-2 rounded-xl border cursor-pointer transition flex items-center gap-2 ${
                      importMode === 'merge'
                        ? 'bg-purple-900/30 border-purple-500/60 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-purple-600"
                    />
                    <span>Sumar / Actualizar inventario</span>
                  </label>
                  <label
                    className={`p-2 rounded-xl border cursor-pointer transition flex items-center gap-2 ${
                      importMode === 'replace'
                        ? 'bg-rose-900/30 border-rose-500/60 text-rose-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-rose-600"
                    />
                    <span>Reemplazar todo el catálogo</span>
                  </label>
                </div>
              </div>

              {/* Editable Preview Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/80">
                  <div className="grid grid-cols-12 gap-2 p-2 bg-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                    <span className="col-span-5">Producto</span>
                    <span className="col-span-3">Código</span>
                    <span className="col-span-2 text-center">Stock</span>
                    <span className="col-span-2 text-right">Precio ($)</span>
                  </div>

                  {parsedItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-2 p-2 items-center text-xs hover:bg-slate-900/50 transition group"
                    >
                      {/* Title */}
                      <div className="col-span-5 min-w-0">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'title', e.target.value)
                          }
                          className="w-full bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-purple-500"
                          placeholder="Nombre del producto"
                        />
                      </div>

                      {/* Barcode */}
                      <div className="col-span-3 min-w-0">
                        <input
                          type="text"
                          value={item.barcode}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'barcode', e.target.value)
                          }
                          className="w-full bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-[11px] text-purple-300 font-mono focus:outline-none focus:border-purple-500"
                          placeholder="Código"
                        />
                      </div>

                      {/* Stock */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          value={item.stock}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.id,
                              'stock',
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full bg-slate-900 px-1 py-1 rounded-lg border border-slate-800 text-xs font-bold text-center text-slate-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* Price & Delete */}
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.price}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.id,
                              'price',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-14 bg-slate-900 px-1 py-1 rounded-lg border border-emerald-500/40 text-xs font-extrabold text-right text-emerald-400 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition"
                          title="Quitar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-between items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            Cancelar
          </button>

          {parsedItems.length > 0 && (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-950 flex items-center gap-1.5 transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Confirmar e Importar ({parsedItems.length} productos)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
