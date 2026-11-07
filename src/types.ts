export interface User {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'user';
  pass: string;
}

export interface Product {
  id: string;
  barcode: string;
  title: string;
  category?: string; // Categoría del producto (ej: Smartphones, Accesorios, Audio, etc.)
  cost: number; // Costo por unidad
  totalCost?: number; // Monto total invertido en la compra/lote
  price: number; // Precio de venta por unidad
  stock: number;
  soldCount: number;
  media?: string;
  updatedAt?: number;
}

export interface HistoryLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export type FilterType = 'all' | 'available' | 'low' | 'out';

export interface BatchCartItem {
  product: Product;
  quantity: number;
}

export interface InvestmentRecord {
  id: string;
  amount: number;
  description: string;
  date: string;
  createdAt: number;
}
