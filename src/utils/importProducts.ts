import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import { Product } from '../types';

// Use local worker bundled by Vite
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}


export interface ParsedImportItem {
  id: string;
  title: string;
  category?: string;
  barcode: string;
  stock: number;
  price: number;
  cost?: number;
  isValid: boolean;
  warnings?: string[];
}

/**
 * Downloads a sample Excel template for inventory importing
 */
export function downloadExcelTemplate() {
  const sampleData = [
    {
      'Producto': 'Funda Silicona iPhone 14',
      'Categoría': 'Fundas & Micas',
      'Código de Barras': '750100234001',
      'Stock': 15,
      'Precio de Venta ($)': 12.50,
      'Costo Referencial ($)': 6.00,
    },
    {
      'Producto': 'Audífonos Bluetooth Pro TWS',
      'Categoría': 'Audio',
      'Código de Barras': '750100234002',
      'Stock': 8,
      'Precio de Venta ($)': 28.00,
      'Costo Referencial ($)': 14.00,
    },
    {
      'Producto': 'Cargador Rápido 20W Tipo-C',
      'Categoría': 'Cargadores',
      'Código de Barras': '750100234003',
      'Stock': 20,
      'Precio de Venta ($)': 15.00,
      'Costo Referencial ($)': 7.50,
    },
    {
      'Producto': 'Cable Reforzado Lightning / USB-C',
      'Categoría': 'Accesorios',
      'Código de Barras': '750100234004',
      'Stock': 25,
      'Precio de Venta ($)': 8.00,
      'Costo Referencial ($)': 3.00,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla_Inventario');
  XLSX.writeFile(workbook, 'Plantilla_Inventario_Blackberry.xlsx');
}

/**
 * Parses an Excel or CSV file buffer
 */
export async function parseExcelFile(file: File): Promise<ParsedImportItem[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const items: ParsedImportItem[] = [];

  rawRows.forEach((row, idx) => {
    // Normalize keys to lowercase trimmed
    const normalizedRow: Record<string, any> = {};
    Object.keys(row).forEach((k) => {
      normalizedRow[k.toLowerCase().trim()] = row[k];
    });

    // Match title
    const titleVal =
      normalizedRow['producto'] ||
      normalizedRow['nombre'] ||
      normalizedRow['descripcion'] ||
      normalizedRow['descripción'] ||
      normalizedRow['articulo'] ||
      normalizedRow['artículo'] ||
      normalizedRow['item'] ||
      normalizedRow['title'] ||
      normalizedRow['name'];

    // Match barcode
    const barcodeVal =
      normalizedRow['codigo'] ||
      normalizedRow['código'] ||
      normalizedRow['codigo de barras'] ||
      normalizedRow['código de barras'] ||
      normalizedRow['barcode'] ||
      normalizedRow['cod'] ||
      normalizedRow['upc'] ||
      normalizedRow['ean'] ||
      normalizedRow['sku'];

    // Match stock
    const stockVal =
      normalizedRow['stock'] ||
      normalizedRow['cantidad'] ||
      normalizedRow['cant'] ||
      normalizedRow['unidades'] ||
      normalizedRow['existencias'] ||
      normalizedRow['qty'] ||
      normalizedRow['quantity'];

    // Match price
    const priceVal =
      normalizedRow['precio'] ||
      normalizedRow['precio de venta'] ||
      normalizedRow['precio venta'] ||
      normalizedRow['p. venta'] ||
      normalizedRow['p.venta'] ||
      normalizedRow['pvp'] ||
      normalizedRow['price'] ||
      normalizedRow['valor'];

    // Match cost
    const costVal =
      normalizedRow['costo'] ||
      normalizedRow['cost'] ||
      normalizedRow['precio compra'] ||
      normalizedRow['costo compra'];

    // Match category
    const categoryVal =
      normalizedRow['categoria'] ||
      normalizedRow['categoría'] ||
      normalizedRow['category'] ||
      normalizedRow['rubro'] ||
      normalizedRow['familia'];

    const title = String(titleVal || '').trim();
    if (!title && !barcodeVal) return; // skip empty rows

    const barcode = String(barcodeVal || '').trim();
    const category = String(categoryVal || 'General').trim();
    const stockParsed = parseInt(String(stockVal).replace(/[^0-9]/g, '')) || 1;
    const priceParsed = parseFloat(String(priceVal).replace(/[^0-9.]/g, '')) || 0;
    const costParsed = parseFloat(String(costVal).replace(/[^0-9.]/g, '')) || 0;

    const warnings: string[] = [];
    if (!title) warnings.push('Falta el nombre del producto');
    if (priceParsed <= 0) warnings.push('Precio en $0.00');

    items.push({
      id: `imp_${Date.now()}_${idx}`,
      title: title || `Producto sin nombre #${idx + 1}`,
      category: category || 'General',
      barcode,
      stock: Math.max(0, stockParsed),
      price: Math.max(0, priceParsed),
      cost: Math.max(0, costParsed),
      isValid: !!title,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  });

  return items;
}

/**
 * Parses a PDF file using pdfjs-dist
 */
export async function parsePdfFile(file: File): Promise<ParsedImportItem[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;

  let fullTextLines: string[] = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group items roughly by vertical Y position
    const linesMap = new Map<number, string[]>();
    textContent.items.forEach((item: any) => {
      const str = item.str || '';
      if (!str.trim()) return;
      const y = Math.round(item.transform[5] / 4) * 4; // group close Y coordinates
      if (!linesMap.has(y)) {
        linesMap.set(y, []);
      }
      linesMap.get(y)!.push(str);
    });

    // Sort lines from top to bottom (higher Y to lower Y in PDF coordinates)
    const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a);
    sortedY.forEach((y) => {
      const lineStr = linesMap.get(y)!.join(' ').trim();
      if (lineStr) {
        fullTextLines.push(lineStr);
      }
    });
  }

  return parseTextLines(fullTextLines);
}

/**
 * Parses raw text lines (from PDF, clipboard paste, or text area)
 */
export function parseTextLines(lines: string[]): ParsedImportItem[] {
  const items: ParsedImportItem[] = [];

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line || line.length < 3) return;

    // Ignore headers like "PRODUCTO", "CANTIDAD", "FECHA", "FACTURA", "TOTAL"
    const lower = line.toLowerCase();
    if (
      lower.includes('descripción') &&
      (lower.includes('precio') || lower.includes('cant'))
    ) {
      return;
    }
    if (lower.startsWith('página') || lower.startsWith('page') || lower.startsWith('total:')) {
      return;
    }

    // Try detecting tab or comma separated
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t').map((p) => p.trim()).filter(Boolean);
    } else if (line.includes(';') && line.split(';').length >= 2) {
      parts = line.split(';').map((p) => p.trim()).filter(Boolean);
    } else if (line.includes(' - ') && line.split(' - ').length >= 2) {
      parts = line.split(' - ').map((p) => p.trim()).filter(Boolean);
    } else if (line.includes(',') && line.split(',').length >= 3) {
      parts = line.split(',').map((p) => p.trim()).filter(Boolean);
    }

    let title = '';
    let barcode = '';
    let stock = 1;
    let price = 0;

    if (parts.length >= 2) {
      // First part or second part might be barcode or title
      parts.forEach((part) => {
        // Check if numeric barcode
        const cleanDigits = part.replace(/\s+/g, '');
        if (/^\d{6,14}$/.test(cleanDigits) && !barcode) {
          barcode = cleanDigits;
        } else if (/^\$?\d+(\.\d{1,2})?$/.test(part.replace(/[^0-9.]/g, '')) && price === 0) {
          const num = parseFloat(part.replace(/[^0-9.]/g, ''));
          if (num > 0) price = num;
        } else if (/^\d+$/.test(part) && stock === 1 && !barcode) {
          stock = parseInt(part, 10);
        } else if (!title && part.length > 2) {
          title = part;
        }
      });
    }

    // Fallback: regex search in single line
    if (!title) {
      // Find prices like $15.50 or 15.50
      const priceMatch = line.match(/\$?\s*([0-9]+[.,][0-9]{2})/);
      if (priceMatch) {
        price = parseFloat(priceMatch[1].replace(',', '.'));
      }

      // Find barcode like 750100... (6 to 14 digits)
      const barcodeMatch = line.match(/\b(\d{7,14})\b/);
      if (barcodeMatch) {
        barcode = barcodeMatch[1];
      }

      // Remainder could be title
      let cleaned = line
        .replace(/\$?\s*([0-9]+[.,][0-9]{2})/g, '')
        .replace(/\b(\d{7,14})\b/g, '')
        .replace(/cant(idad)?\s*[:=]?\s*\d+/gi, '')
        .replace(/stock\s*[:=]?\s*\d+/gi, '')
        .replace(/[-|;,]+/g, ' ')
        .trim();

      // Check for standalone stock number: e.g. "x 5" or "5 unid"
      const stockMatch = line.match(/(?:x|\bcant(?:idad)?|\bstock)?\s*(\d{1,4})\s*(?:unid|piezas|pcs|pz)?\b/i);
      if (stockMatch && parseInt(stockMatch[1]) > 0 && parseInt(stockMatch[1]) <= 1000) {
        stock = parseInt(stockMatch[1], 10);
      }

      title = cleaned;
    }

    if (title && title.length >= 2) {
      const warnings: string[] = [];
      if (price <= 0) warnings.push('Precio en $0.00');

      items.push({
        id: `imp_txt_${Date.now()}_${idx}`,
        title,
        category: 'General',
        barcode,
        stock: Math.max(1, stock),
        price: Math.max(0, price),
        isValid: true,
        warnings: warnings.length > 0 ? warnings : undefined,
      });
    }
  });

  return items;
}
