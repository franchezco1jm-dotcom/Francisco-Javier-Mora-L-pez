/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import {
  Boxes,
  Users,
  Key,
  FileSpreadsheet,
  Download,
  Upload,
  LogOut,
  Plus,
  Search,
  Barcode,
  History,
  ShieldCheck,
  ShieldAlert,
  ShoppingCart,
  Edit3,
  Trash2,
  CheckCircle,
  AlertCircle,
  PackageOpen,
  Image as ImageIcon,
  Wallet,
  TrendingUp,
  Banknote,
  FileText,
  X,
  Layers,
  Tag,
  CheckSquare,
  Square,
  CheckCheck,
  Camera,
  LogIn,
  Share2,
  Compass,
} from 'lucide-react';

import { User, Product, HistoryLog, FilterType, BatchCartItem, InvestmentRecord } from './types';
import { ParsedImportItem } from './utils/importProducts';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { PermissionsBanner } from './components/PermissionsBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { QuickActionModal } from './components/QuickActionModal';
import { ProductFormModal } from './components/ProductFormModal';
import { LandingAuthModal } from './components/LandingAuthModal';
import { HistoryView } from './components/HistoryView';
import { VoiceSearchBar } from './components/VoiceSearchBar';
import { QuickPriceModal } from './components/QuickPriceModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ProductCardSkeleton } from './components/ProductCardSkeleton';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ProductCardItem } from './components/ProductCardItem';
import { shareContent } from './utils/share';
import { lazyWithRetry } from './utils/lazyWithRetry';

// Resilient lazy-loaded modals with auto-retry to prevent crash loops on mobile
const BarcodeScannerModal = lazyWithRetry(() =>
  import('./components/BarcodeScannerModal').then((m) => ({ default: m.BarcodeScannerModal }))
);
const ExportModal = lazyWithRetry(() =>
  import('./components/ExportModal').then((m) => ({ default: m.ExportModal }))
);
const ImportModal = lazyWithRetry(() =>
  import('./components/ImportModal').then((m) => ({ default: m.ImportModal }))
);
const UserManagerModal = lazyWithRetry(() =>
  import('./components/UserManagerModal').then((m) => ({ default: m.UserManagerModal }))
);
const ChangePasswordModal = lazyWithRetry(() =>
  import('./components/ChangePasswordModal').then((m) => ({ default: m.ChangePasswordModal }))
);
const InvestmentManagerModal = lazyWithRetry(() =>
  import('./components/InvestmentManagerModal').then((m) => ({ default: m.InvestmentManagerModal }))
);
const ShareModal = lazyWithRetry(() =>
  import('./components/ShareModal').then((m) => ({ default: m.ShareModal }))
);

const DEFAULT_USERS: User[] = [
  { id: 'usr_admin1', name: 'Admin 1', username: 'admin1', role: 'admin', pass: 'Admin123' },
  { id: 'usr_admin2', name: 'Admin 2', username: 'admin2', role: 'admin', pass: 'Admin123' },
  { id: 'usr_admin3', name: 'Admin 3', username: 'admin3', role: 'admin', pass: 'Admin123' },
  { id: 'usr_user1', name: 'Usuario 1', username: 'vendedor1', role: 'user', pass: '1234' },
  { id: 'usr_user2', name: 'Usuario 2', username: 'vendedor2', role: 'user', pass: '1234' },
  { id: 'usr_user3', name: 'Usuario 3', username: 'vendedor3', role: 'user', pass: '1234' },
  { id: 'usr_user4', name: 'Usuario 4', username: 'vendedor4', role: 'user', pass: '1234' },
  { id: 'usr_user5', name: 'Usuario 5', username: 'vendedor5', role: 'user', pass: '1234' },
  { id: 'usr_user6', name: 'Usuario 6', username: 'vendedor6', role: 'user', pass: '1234' },
  { id: 'usr_user7', name: 'Usuario 7', username: 'vendedor7', role: 'user', pass: '1234' },
  { id: 'usr_user8', name: 'Usuario 8', username: 'vendedor8', role: 'user', pass: '1234' },
  { id: 'usr_user9', name: 'Usuario 9', username: 'vendedor9', role: 'user', pass: '1234' },
  { id: 'usr_user10', name: 'Usuario 10', username: 'vendedor10', role: 'user', pass: '1234' },
  { id: 'usr_user11', name: 'Usuario 11', username: 'vendedor11', role: 'user', pass: '1234' },
  { id: 'usr_user12', name: 'Usuario 12', username: 'vendedor12', role: 'user', pass: '1234' },
  { id: 'usr_user13', name: 'Usuario 13', username: 'vendedor13', role: 'user', pass: '1234' },
];

export default function App() {
  // State
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('inventory_users');
      return saved ? JSON.parse(saved) : DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('inventory_products');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      // Migration fallback for legacy formats
      return parsed.map((p: any) => ({
        ...p,
        category: p.category || 'General',
        stock: p.stock !== undefined ? Number(p.stock) : p.status === 'available' ? 1 : 0,
        soldCount: p.soldCount !== undefined ? Number(p.soldCount) : p.status === 'sold' ? 1 : 0,
      }));
    } catch {
      return [];
    }
  });

  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>(() => {
    try {
      const saved = localStorage.getItem('inventory_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const activeId = localStorage.getItem('inventory_active_user');
      if (activeId) {
        const savedUsers = localStorage.getItem('inventory_users');
        const list = savedUsers ? JSON.parse(savedUsers) : DEFAULT_USERS;
        const found = list.find((u: User) => u.id === activeId);
        if (found) return found;
      }
      return null;
    } catch {
      return null;
    }
  });

  // UI Navigation & Modals
  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique categories from products
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      const c = p.category?.trim();
      if (c) {
        cats.add(c);
      }
    });
    return Array.from(cats).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('inventory_guest_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [productToShare, setProductToShare] = useState<Product | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isUserManagerOpen, setIsUserManagerOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prefilledBarcode, setPrefilledBarcode] = useState('');

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<'search' | 'form' | 'batch' | 'add'>('search');

  const [quickScanProduct, setQuickScanProduct] = useState<Product | null>(null);

  // Multiple Investment Records (Montos de inversión acumulables)
  const [investments, setInvestments] = useState<InvestmentRecord[]>(() => {
    try {
      const saved = localStorage.getItem('inventory_investment_records');
      if (saved) return JSON.parse(saved);
      // Migration from legacy single number
      const legacy = localStorage.getItem('inventory_global_investment');
      if (legacy !== null && parseFloat(legacy) > 0) {
        return [
          {
            id: 'inv_legacy',
            amount: parseFloat(legacy),
            description: 'Inversión Inicial de Mercancía',
            date: new Date().toISOString().slice(0, 10),
            createdAt: Date.now(),
          },
        ];
      }
      return [];
    } catch {
      return [];
    }
  });

  const globalInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0);

  const [isInvestmentManagerOpen, setIsInvestmentManagerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [priceEditProduct, setPriceEditProduct] = useState<Product | null>(null);

  // In-App Confirm Dialog (replaces blocked window.confirm)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  useEffect(() => {
    try {
      localStorage.setItem('inventory_investment_records', JSON.stringify(investments));
      localStorage.setItem('inventory_global_investment', globalInvestment.toString());
    } catch (e) {
      console.error(e);
    }
  }, [investments, globalInvestment]);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('inventory_users', JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('inventory_products', JSON.stringify(products));
    } catch (e) {
      showToast('Memoria local llena al guardar productos', 'error');
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('inventory_history', JSON.stringify(historyLogs));
    } catch (e) {
      console.error(e);
    }
  }, [historyLogs]);

  // Soft loading timer to avoid any blank flashes during hydration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 280);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!currentUser && !isGuestMode) {
      setIsLoginOpen(true);
    } else {
      setIsLoginOpen(false);
    }
  }, [currentUser, isGuestMode]);

  // General Catalog Share handler (Web Share API with fallback)
  const handleShareCatalog = async () => {
    setProductToShare(null);
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const didShare = await shareContent(
      'Catálogo',
      'Mira nuestro catálogo aquí:',
      url,
      showToast
    );
    if (!didShare) {
      setIsShareModalOpen(true);
    }
  };

  // Single Product Share handler (Web Share API with fallback)
  const handleShareProduct = async (product: Product) => {
    setProductToShare(product);
    const shareText = `🛍️ *${product.title}*\n💵 *Precio:* $${Number(product.price).toFixed(2)}\n📦 *Stock:* ${product.stock} disponibles\n🏷️ *Categoría:* ${product.category || 'General'}\n\nRevisa nuestro catálogo en vivo:`;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const didShare = await shareContent(
      `${product.title} - Blackberry Inventory`,
      shareText,
      url,
      showToast
    );
    if (!didShare) {
      setIsShareModalOpen(true);
    }
  };

  // Auth requirement check for actions
  const requireAuth = (actionDescription: string = 'realizar esta acción'): boolean => {
    if (!currentUser) {
      setConfirmDialog({
        isOpen: true,
        title: 'Iniciar Sesión Requerido',
        message: `Estás explorando en Modo Invitado. Para ${actionDescription}, por favor inicia sesión con tu cuenta o crea una nueva.`,
        confirmText: 'Iniciar Sesión / Registro',
        variant: 'info',
        onConfirm: () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          setIsLoginOpen(true);
        },
      });
      return false;
    }
    return true;
  };

  // Log action helper
  const addHistoryLog = (action: string, details: string) => {
    const newLog: HistoryLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      user: currentUser ? currentUser.name : 'Invitado',
      action,
      details,
    };
    setHistoryLogs((prev) => [newLog, ...prev]);
  };

  // Auth Handlers (Supports ID or Username/Email login)
  const handleLogin = (idOrUsername: string, pass: string): boolean => {
    const trimmed = idOrUsername.trim().toLowerCase();
    const user = users.find(
      (u) =>
        u.id === idOrUsername ||
        u.username.toLowerCase() === trimmed ||
        (u.name && u.name.toLowerCase() === trimmed)
    );
    if (!user || user.pass !== pass) return false;

    setCurrentUser(user);
    setIsGuestMode(false);
    try {
      localStorage.setItem('inventory_active_user', user.id);
      localStorage.removeItem('inventory_guest_mode');
    } catch {}
    setIsLoginOpen(false);
    addHistoryLog('Inicio de Sesión', `Usuario ${user.name} ingresó al sistema.`);
    showToast(`Bienvenido, ${user.name}`);
    return true;
  };

  // New User Registration
  const handleRegister = (
    name: string,
    username: string,
    role: 'admin' | 'user',
    pass: string
  ): boolean => {
    const trimmedUser = username.trim().toLowerCase();
    const exists = users.some((u) => u.username.toLowerCase() === trimmedUser);
    if (exists) return false;

    const newUser: User = {
      id: 'usr_' + Date.now(),
      name,
      username: username.trim(),
      role,
      pass,
    };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setIsGuestMode(false);
    try {
      localStorage.setItem('inventory_active_user', newUser.id);
      localStorage.removeItem('inventory_guest_mode');
    } catch {}
    setIsLoginOpen(false);
    addHistoryLog('Cuenta Creada', `Se registró ${name} como ${role === 'admin' ? 'Administrador' : 'Vendedor'}.`);
    showToast(`¡Cuenta creada con éxito! Bienvenido, ${name}`);
    return true;
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('inventory_active_user');
      localStorage.removeItem('inventory_guest_mode');
    } catch {}
    setCurrentUser(null);
    setIsGuestMode(false);
    setIsLoginOpen(true);
    showToast('Sesión cerrada');
  };

  const handleUpdatePassword = (currentPass: string, newPass: string): boolean => {
    if (!currentUser || currentUser.pass !== currentPass) return false;

    const updatedUser = { ...currentUser, pass: newPass };
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    addHistoryLog('Cambio de Contraseña', `El usuario ${currentUser.name} actualizó su clave.`);
    showToast('Contraseña actualizada correctamente');
    return true;
  };

  // User Management
  const handleSaveUser = (userData: Omit<User, 'id'> & { id?: string }) => {
    if (userData.id) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userData.id ? ({ ...u, ...userData } as User) : u))
      );
      addHistoryLog('Usuario Modificado', `Vendedor ${userData.name} actualizado.`);
      showToast('Usuario actualizado con éxito');
    } else {
      const newUser: User = {
        id: 'usr_' + Date.now(),
        name: userData.name,
        username: userData.username,
        role: userData.role || 'user',
        pass: userData.pass,
      };
      setUsers((prev) => [...prev, newUser]);
      addHistoryLog('Nuevo Vendedor Creado', `Se registró al vendedor ${userData.name}.`);
      showToast('Nuevo vendedor agregado');
    }
  };

  const handleDeleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Vendedor',
      message: `¿Estás seguro de que deseas eliminar permanentemente la cuenta de "${target.name}"?`,
      confirmText: 'Sí, Eliminar Vendedor',
      variant: 'danger',
      onConfirm: () => {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        addHistoryLog('Usuario Eliminado', `Se eliminó al vendedor ${target.name}.`);
        showToast('Vendedor eliminado correctamente');
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Product Handlers
  const handleSaveProduct = (productData: Omit<Product, 'id'> & { id?: string }) => {
    if (productData.id) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productData.id ? ({ ...p, ...productData, updatedAt: Date.now() } as Product) : p
        )
      );
      addHistoryLog(
        'Producto Editado',
        `"${productData.title}" actualizado por ${currentUser?.name}. Stock: ${productData.stock}, Inversión: $${productData.totalCost?.toFixed(2)} ($${productData.cost?.toFixed(2)}/u).`
      );
      showToast('Producto actualizado correctamente');
    } else {
      const newProduct: Product = {
        id: 'prod_' + Date.now(),
        barcode: productData.barcode,
        title: productData.title,
        category: productData.category?.trim() || 'General',
        cost: productData.cost,
        totalCost: productData.totalCost,
        price: productData.price,
        stock: productData.stock,
        soldCount: productData.soldCount || 0,
        media: productData.media,
        updatedAt: Date.now(),
      };
      setProducts((prev) => [newProduct, ...prev]);
      addHistoryLog(
        'Nuevo Producto',
        `"${productData.title}" registrado por ${currentUser?.name}. Lote de ${productData.stock} piezas, inversión: $${productData.totalCost?.toFixed(2)} ($${productData.cost?.toFixed(2)}/u).`
      );
      showToast('Producto registrado exitosamente');
    }
    setIsProductModalOpen(false);
    setEditingProduct(null);
    setPrefilledBarcode('');
  };

  const handleDeleteProduct = (productId: string) => {
    const p = products.find((prod) => prod.id === productId);
    if (!p) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Producto',
      message: `¿Estás seguro de que deseas eliminar permanentemente "${p.title}" del inventario?`,
      confirmText: 'Sí, Eliminar Producto',
      variant: 'danger',
      onConfirm: () => {
        setProducts((prev) => prev.filter((prod) => prod.id !== productId));
        addHistoryLog('Producto Eliminado', `"${p.title}" eliminado por ${currentUser?.name}.`);
        showToast('Producto eliminado del inventario');
        setIsProductModalOpen(false);
        setEditingProduct(null);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Bulk Selection & Batch Deletion
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const toggleSelectProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = filteredProducts.map((p) => p.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedProductIds.includes(id));
    if (allSelected) {
      setSelectedProductIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedProductIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleSelectAllCatalog = () => {
    const allIds = products.map((p) => p.id);
    setSelectedProductIds(allIds);
  };

  const handleClearSelection = () => {
    setSelectedProductIds([]);
    setIsSelectionMode(false);
  };

  // Delete Selected Products
  const handleDeleteSelected = () => {
    if (selectedProductIds.length === 0) return;
    const count = selectedProductIds.length;
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Artículos Seleccionados',
      message: `¿Estás seguro de que deseas eliminar permanentemente los ${count} artículos seleccionados del inventario? Esta acción no se puede deshacer.`,
      confirmText: `Sí, Eliminar (${count})`,
      variant: 'danger',
      onConfirm: () => {
        setProducts((prev) => prev.filter((p) => !selectedProductIds.includes(p.id)));
        addHistoryLog(
          'Eliminación por Lote',
          `Se eliminaron ${count} productos seleccionados por ${currentUser?.name}.`
        );
        showToast(`Se eliminaron ${count} artículos`);
        setSelectedProductIds([]);
        setIsSelectionMode(false);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Delete ALL Products in Inventory (Vaciar Catálogo Completo)
  const handleDeleteAllProducts = () => {
    if (products.length === 0) {
      showToast('El catálogo ya se encuentra vacío', 'error');
      return;
    }
    const count = products.length;
    setConfirmDialog({
      isOpen: true,
      title: '⚠️ ¿Borrar TODO el Inventario?',
      message: `ATENCIÓN: Se eliminarán permanentemente los ${count} productos del catálogo. Esta acción borrará todo el stock y no se puede deshacer.`,
      confirmText: `Sí, Borrar Todo (${count} artículos)`,
      variant: 'danger',
      onConfirm: () => {
        setProducts([]);
        setSelectedProductIds([]);
        setIsSelectionMode(false);
        addHistoryLog(
          'Catálogo Vaciado Completo',
          `Se eliminaron todos los productos (${count} artículos) del catálogo por ${currentUser?.name}.`
        );
        showToast('Se han eliminado todos los productos del catálogo');
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Quick Action (Sale or Restock with batch cost support)
  const handleQuickAction = (
    productId: string,
    type: 'sell' | 'add',
    quantity: number,
    batchTotalCost?: number
  ) => {
    const p = products.find((prod) => prod.id === productId);
    if (!p || quantity <= 0) return;

    if (type === 'sell') {
      if (p.stock < quantity) {
        showToast(`Stock insuficiente. Disponible: ${p.stock}`, 'error');
        return;
      }
      const updated = {
        ...p,
        stock: p.stock - quantity,
        soldCount: (p.soldCount || 0) + quantity,
        updatedAt: Date.now(),
      };
      setProducts((prev) => prev.map((item) => (item.id === productId ? updated : item)));
      addHistoryLog(
        'Venta Registrada',
        `Venta de ${quantity} unidad(es) de "${p.title}" por ${currentUser?.name}. Total cobrado: $${(
          quantity * p.price
        ).toFixed(2)}.`
      );
      showToast(`Venta de ${quantity} unidad(es) registrada`);
    } else if (type === 'add') {
      let newCost = p.cost;
      let newTotalCost = p.totalCost || p.cost * p.stock;

      if (typeof batchTotalCost === 'number' && batchTotalCost > 0) {
        newTotalCost += batchTotalCost;
        newCost = (p.stock + quantity) > 0 ? newTotalCost / (p.stock + quantity) : p.cost;
      } else {
        newTotalCost += p.cost * quantity;
      }

      const updated: Product = {
        ...p,
        stock: p.stock + quantity,
        cost: parseFloat(newCost.toFixed(2)),
        totalCost: parseFloat(newTotalCost.toFixed(2)),
        updatedAt: Date.now(),
      };

      setProducts((prev) => prev.map((item) => (item.id === productId ? updated : item)));
      addHistoryLog(
        'Stock Reabastecido',
        `Se sumaron ${quantity} unidad(es) a "${p.title}" por ${currentUser?.name}. Nuevo stock: ${updated.stock} (${batchTotalCost ? `Lote nuevo: $${batchTotalCost.toFixed(2)}` : 'costo previo'}).`
      );
      showToast(`Stock actualizado (+${quantity} unid.)`);
    }

    setQuickScanProduct(null);
  };

  // Barcode Scanner Result
  const handleScanSuccess = (scannedCode: string) => {
    setIsScannerOpen(false);
    const trimmed = scannedCode.trim();

    if (scannerMode === 'form') {
      setPrefilledBarcode(trimmed);
      showToast(`Código escaneado: ${trimmed}`);
      return;
    }

    // Direct Add Product Mode ("Escanear para Agregar")
    if (scannerMode === 'add') {
      const found = products.find((p) => p.barcode === trimmed);
      if (found) {
        setConfirmDialog({
          isOpen: true,
          title: 'Producto ya Registrado',
          message: `El código "${trimmed}" ya pertenece al producto "${found.title}". ¿Deseas editar su información o precio?`,
          confirmText: 'Editar Producto',
          variant: 'info',
          onConfirm: () => {
            setEditingProduct(found);
            setPrefilledBarcode(trimmed);
            setIsProductModalOpen(true);
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          },
        });
      } else {
        setEditingProduct(null);
        setPrefilledBarcode(trimmed);
        setIsProductModalOpen(true);
        showToast(`Código "${trimmed}" capturado. Completa los datos.`);
      }
      return;
    }

    // Search Mode
    const found = products.find((p) => p.barcode === trimmed);
    if (found) {
      setQuickScanProduct(found);
      showToast(`Producto encontrado: ${found.title}`);
    } else {
      showToast(`Código "${trimmed}" no registrado`, 'error');
      if (currentUser?.role === 'admin') {
        setConfirmDialog({
          isOpen: true,
          title: 'Código no Registrado',
          message: `El código "${trimmed}" no se encuentra en el catálogo. ¿Deseas dar de alta este producto ahora?`,
          confirmText: 'Registrar Producto',
          variant: 'info',
          onConfirm: () => {
            setEditingProduct(null);
            setPrefilledBarcode(trimmed);
            setIsProductModalOpen(true);
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          },
        });
      } else {
        setSearchQuery(trimmed);
      }
    }
  };

  // Batch Sale / Restock confirmation from Multi-Scan mode
  const handleConfirmBatchSale = (
    items: BatchCartItem[],
    batchType: 'sell' | 'restock'
  ) => {
    if (items.length === 0) return;

    if (batchType === 'sell') {
      // Validate stock for all items
      for (const item of items) {
        const prod = products.find((p) => p.id === item.product.id);
        if (!prod || prod.stock < item.quantity) {
          showToast(
            `Stock insuficiente para "${item.product.title}". Disponible: ${prod?.stock || 0}`,
            'error'
          );
          return;
        }
      }

      const itemMap = new Map<string, number>();
      items.forEach((i) => itemMap.set(i.product.id, i.quantity));

      setProducts((prev) =>
        prev.map((p) => {
          const qty = itemMap.get(p.id);
          if (qty !== undefined) {
            return {
              ...p,
              stock: p.stock - qty,
              soldCount: (p.soldCount || 0) + qty,
              updatedAt: Date.now(),
            };
          }
          return p;
        })
      );

      const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);
      const totalAmount = items.reduce(
        (acc, i) => acc + i.quantity * i.product.price,
        0
      );
      const itemsSummary = items
        .map((i) => `${i.quantity}x ${i.product.title}`)
        .join(', ');

      addHistoryLog(
        'Venta Múltiple en Lote',
        `Venta por lote (${totalItems} arts.): ${itemsSummary}. Total cobrado: $${totalAmount.toFixed(
          2
        )} por ${currentUser?.name}.`
      );

      showToast(
        `¡Venta múltiple registrada! (${totalItems} artículos por $${totalAmount.toFixed(2)})`
      );
    } else {
      // Restock batch
      const itemMap = new Map<string, number>();
      items.forEach((i) => itemMap.set(i.product.id, i.quantity));

      setProducts((prev) =>
        prev.map((p) => {
          const qty = itemMap.get(p.id);
          if (qty !== undefined) {
            return {
              ...p,
              stock: p.stock + qty,
              updatedAt: Date.now(),
            };
          }
          return p;
        })
      );

      const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);
      const itemsSummary = items
        .map((i) => `+${i.quantity} ${i.product.title}`)
        .join(', ');

      addHistoryLog(
        'Ingreso de Stock en Lote',
        `Reabastecimiento por lote (${totalItems} arts.): ${itemsSummary} por ${currentUser?.name}.`
      );

      showToast(`¡Ingreso de stock en lote registrado! (+${totalItems} unidades)`);
    }

    setIsScannerOpen(false);
  };

  // Investment Management Handlers (Poder poner más montos de inversión)
  const handleAddInvestment = (amount: number, description: string, date: string) => {
    const newRecord: InvestmentRecord = {
      id: `inv_${Date.now()}`,
      amount,
      description,
      date,
      createdAt: Date.now(),
    };
    setInvestments((prev) => [newRecord, ...prev]);
    addHistoryLog(
      'Monto de Inversión Agregado',
      `Se sumaron $${amount.toFixed(2)} ("${description}") por ${currentUser?.name}. Nueva inversión total: $${(
        globalInvestment + amount
      ).toFixed(2)}.`
    );
    showToast(`Inversión de $${amount.toFixed(2)} registrada con éxito`);
  };

  const handleDeleteInvestment = (id: string) => {
    const found = investments.find((i) => i.id === id);
    if (!found) return;
    setInvestments((prev) => prev.filter((i) => i.id !== id));
    addHistoryLog(
      'Monto de Inversión Eliminado',
      `Se eliminó el monto de $${found.amount.toFixed(2)} ("${found.description}") por ${currentUser?.name}.`
    );
    showToast('Monto de inversión eliminado');
  };

  // Bulk Product Import Handler (Excel o PDF)
  const handleImportProducts = (
    importedItems: ParsedImportItem[],
    mode: 'merge' | 'replace'
  ) => {
    if (importedItems.length === 0) return;

    if (mode === 'replace') {
      const newProducts: Product[] = importedItems.map((item, idx) => ({
        id: `prod_${Date.now()}_${idx}`,
        title: item.title,
        barcode: item.barcode || '',
        category: item.category || 'General',
        stock: item.stock,
        price: item.price,
        cost: item.cost || 0,
        totalCost: (item.cost || 0) * item.stock,
        soldCount: 0,
        updatedAt: Date.now(),
      }));
      setProducts(newProducts);
      addHistoryLog(
        'Catálogo Importado y Reemplazado',
        `Se importaron ${newProducts.length} productos reemplazando el catálogo anterior por ${currentUser?.name}.`
      );
    } else {
      // Merge mode
      setProducts((prev) => {
        const next = [...prev];
        importedItems.forEach((item, idx) => {
          const existingIdx = next.findIndex(
            (p) =>
              (item.barcode && p.barcode && p.barcode.trim() === item.barcode.trim()) ||
              p.title.trim().toLowerCase() === item.title.trim().toLowerCase()
          );

          if (existingIdx >= 0) {
            const existing = next[existingIdx];
            next[existingIdx] = {
              ...existing,
              stock: existing.stock + item.stock,
              price: item.price > 0 ? item.price : existing.price,
              barcode: existing.barcode || item.barcode || '',
              category:
                item.category && item.category !== 'General'
                  ? item.category
                  : existing.category || 'General',
              updatedAt: Date.now(),
            };
          } else {
            next.push({
              id: `prod_${Date.now()}_${idx}`,
              title: item.title,
              barcode: item.barcode || '',
              category: item.category || 'General',
              stock: item.stock,
              price: item.price,
              cost: item.cost || 0,
              totalCost: (item.cost || 0) * item.stock,
              soldCount: 0,
              updatedAt: Date.now(),
            });
          }
        });
        return next;
      });

      addHistoryLog(
        'Productos Ingresados por Archivo',
        `Se sumaron/actualizaron ${importedItems.length} productos desde Excel/PDF por ${currentUser?.name}.`
      );
    }
  };

  // Quick Price Update Handler (Modificar precio de venta)
  const handleUpdateProductPrice = (productId: string, newPrice: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const oldPrice = prod.price;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, price: newPrice, updatedAt: Date.now() } : p
      )
    );

    addHistoryLog(
      'Precio de Venta Modificado',
      `Precio de "${prod.title}" modificado de $${oldPrice.toFixed(2)} a $${newPrice.toFixed(
        2
      )} por ${currentUser?.name}.`
    );
    showToast(`Precio actualizado a $${newPrice.toFixed(2)}`);
  };

  // Excel and Backup exports
  const exportToExcel = async () => {
    if (products.length === 0) {
      showToast('No hay productos para exportar', 'error');
      return;
    }

    try {
      const XLSX = await import('xlsx');
      const dataToExport = products.map((p) => {
        const stock = Number(p.stock) || 0;
        const sold = Number(p.soldCount) || 0;
        const price = Number(p.price) || 0;
        const retailValue = stock * price;
        const totalCollected = sold * price;
        return {
          'Código de Barras': p.barcode || 'N/A',
          Nombre: p.title,
          'Stock Disponible': stock,
          'Unidades Vendidas': sold,
          'Precio de Venta ($)': price.toFixed(2),
          'Valor Total en Stock ($)': retailValue.toFixed(2),
          'Total Cobrado en Ventas ($)': totalCollected.toFixed(2),
          Estado: stock === 0 ? 'Agotado' : stock <= 3 ? 'Bajo Stock' : 'En Stock',
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario_Stock');
      XLSX.writeFile(workbook, `Inventario_Stock_${new Date().toISOString().slice(0, 10)}.xlsx`);

      addHistoryLog('Reporte Exportado', 'Se descargó el reporte completo de inventario en Excel.');
      showToast('Archivo Excel descargado con éxito');
    } catch (err) {
      console.error('Error al exportar Excel:', err);
      showToast('Error al exportar archivo Excel', 'error');
    }
  };

  const exportBackupJSON = () => {
    if (products.length === 0) {
      showToast('No hay productos para exportar', 'error');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `inventario_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Copia de respaldo JSON descargada');
  };

  const importBackupJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setProducts(imported);
          addHistoryLog('Backup Restaurado', 'Se importó un archivo de respaldo JSON.');
          showToast('Inventario restaurado correctamente');
        } else {
          showToast('El formato del archivo JSON no es válido', 'error');
        }
      } catch {
        showToast('Error al procesar el archivo JSON', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Memoized Calculations for Admin Financial Metrics (High Performance)
  const isAdmin = currentUser?.role === 'admin';

  const {
    totalRetailValue,
    totalSold,
    countAll,
    countAvailable,
    countLow,
    countOut,
  } = useMemo(() => {
    let retailVal = 0;
    let soldVal = 0;
    let avail = 0;
    let low = 0;
    let out = 0;

    products.forEach((p) => {
      const stock = Number(p.stock) || 0;
      const sold = Number(p.soldCount) || 0;
      const price = Number(p.price) || 0;

      retailVal += price * stock;
      soldVal += price * sold;

      if (stock > 3) avail++;
      else if (stock > 0 && stock <= 3) low++;
      else if (stock === 0) out++;
    });

    return {
      totalRetailValue: retailVal,
      totalSold: soldVal,
      countAll: products.length,
      countAvailable: avail,
      countLow: low,
      countOut: out,
    };
  }, [products]);

  const projectedNetProfit = useMemo(
    () => totalRetailValue - globalInvestment,
    [totalRetailValue, globalInvestment]
  );

  // Memoized Filtered Products
  const filteredProducts = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();
    const catLower = selectedCategory.toLowerCase();

    return products.filter((p) => {
      const stock = Number(p.stock) || 0;
      let matchesFilter = true;
      if (activeFilter === 'available') matchesFilter = stock > 3;
      else if (activeFilter === 'low') matchesFilter = stock > 0 && stock <= 3;
      else if (activeFilter === 'out') matchesFilter = stock === 0;

      const matchesSearch =
        !term ||
        p.title.toLowerCase().includes(term) ||
        (p.barcode && p.barcode.toLowerCase().includes(term));

      const matchesCategory =
        selectedCategory === 'all' ||
        (p.category?.trim().toLowerCase() || 'general') === catLower;

      return matchesFilter && matchesSearch && matchesCategory;
    });
  }, [products, activeFilter, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans antialiased pb-24">
      {/* Offline Alert */}
      <OfflineIndicator />

      {/* Main App Bar Header */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md text-white shadow-xl border-b border-purple-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center gap-4">
          {/* Logo & User Badge */}
          <div className="flex items-center space-x-2.5">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-purple-500/70 shadow-lg shadow-purple-900/50 shrink-0 bg-slate-900">
              <img
                src="/logo.jpg"
                alt="Blackberry Inventory Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="font-black text-sm tracking-tight leading-none text-white">
                Blackberry Inventory
              </h1>
              <p className="text-[10px] text-purple-400 font-semibold tracking-wide mt-0.5">
                Compra • Vende • Encuentra
              </p>
              {currentUser ? (
                <span
                  className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full inline-flex items-center gap-1 mt-0.5 border ${
                    isAdmin
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {isAdmin ? (
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-2.5 h-2.5 text-amber-400" />
                  )}
                  <span>{currentUser.name} ({isAdmin ? 'Admin' : 'Vendedor'})</span>
                </span>
              ) : (
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-0.5 border bg-purple-500/20 text-purple-300 border-purple-500/40">
                  <Compass className="w-2.5 h-2.5 text-purple-400" />
                  <span>Modo Catálogo (Público)</span>
                </span>
              )}
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center space-x-1.5">
            {/* PWA Install Quick Button */}
            <PWAInstallBanner variant="compact" />

            {/* Share Public Catalog Button */}
            <button
              onClick={handleShareCatalog}
              className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs flex items-center gap-1.5 transition border border-purple-400/40 shadow-sm"
              title="Compartir Catálogo Público con Clientes o Socios"
            >
              <Share2 className="w-4 h-4 text-purple-100" />
              <span className="hidden sm:inline text-[11px] font-bold">Compartir</span>
            </button>

            {currentUser ? (
              <>
                {/* Admin User Management */}
                {isAdmin && (
                  <button
                    onClick={() => setIsUserManagerOpen(true)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-xl text-xs flex items-center transition border border-slate-700 shadow-sm"
                    title="Gestión de Vendedores"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                )}

                {/* Change Password */}
                <button
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs flex items-center transition border border-slate-700 shadow-sm"
                  title="Cambiar Mi Contraseña"
                >
                  <Key className="w-4 h-4" />
                </button>

                {/* Escaneo Múltiple / Lotes */}
                <button
                  onClick={() => {
                    setScannerMode('batch');
                    setIsScannerOpen(true);
                  }}
                  className="p-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs flex items-center gap-1.5 transition border border-emerald-400/40 shadow-sm"
                  title="Escaneo Múltiple / Venta por Lotes"
                >
                  <Layers className="w-4 h-4 text-emerald-100" />
                  <span className="hidden sm:inline text-[11px] font-bold">Lotes</span>
                </button>

                {/* Ingresar Productos por Excel / PDF */}
                {isAdmin && (
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="p-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs flex items-center gap-1.5 transition border border-teal-400/40 shadow-sm"
                    title="Ingresar Productos desde Excel o PDF"
                  >
                    <Upload className="w-4 h-4 text-white" />
                    <span className="hidden sm:inline text-[11px] font-bold">Ingresar</span>
                  </button>
                )}

                {/* Exportar Reporte (PDF / Excel) */}
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs flex items-center gap-1.5 transition border border-purple-400/40 shadow-sm"
                  title="Exportar Inventario (PDF / Excel)"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px] font-bold">Exportar</span>
                </button>

                {/* Admin Backup JSON */}
                {isAdmin && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={exportBackupJSON}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-xs flex items-center transition border border-slate-700 shadow-sm"
                      title="Descargar Respaldo JSON"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <label
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-purple-400 rounded-xl text-xs flex items-center cursor-pointer transition border border-slate-700 shadow-sm"
                      title="Importar Respaldo JSON"
                    >
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={importBackupJSON}
                      />
                    </label>
                  </div>
                )}

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="p-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs flex items-center transition border border-rose-400/30 shadow-sm"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              /* Public / Guest Action */
              <button
                onClick={() => setIsLoginOpen(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-950/40 transition active:scale-95"
                title="Iniciar Sesión o Crear Cuenta"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Ingresar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 pb-28 md:pb-16 flex-1 flex flex-col">
        {/* Guest Mode Public Visitor Banner */}
        {!currentUser && (
          <div className="bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border border-purple-500/40 p-3 rounded-2xl mb-3 shadow-lg flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-400/40 flex items-center justify-center font-bold shrink-0">
                <Compass className="w-4 h-4 text-purple-300" />
              </div>
              <div>
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span>Catálogo Público / Modo Invitado</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                    En Vivo
                  </span>
                </p>
                <p className="text-[11px] text-purple-300/80">
                  Explora libremente productos, fotos y precios en tiempo real.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleShareCatalog}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/40 rounded-xl font-bold text-xs flex items-center gap-1 transition"
                title="Compartir enlace o código QR de este catálogo"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compartir</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLoginOpen(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-950/50 transition active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Ingresar</span>
              </button>
            </div>
          </div>
        )}
        {/* PWA Home Screen Installation Guide Banner */}
        <PWAInstallBanner variant="banner" />

        {/* One-Time Camera and Microphone Permission Primer */}
        <PermissionsBanner onToast={showToast} />

        {/* View Tabs */}
        <div className="flex bg-slate-800/80 p-1.5 rounded-2xl mb-4 text-xs font-semibold border border-slate-700/60 shadow-inner">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-2.5 rounded-xl text-center transition flex items-center justify-center gap-1.5 ${
              activeTab === 'inventory'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Inventario</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 rounded-xl text-center transition flex items-center justify-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial ({historyLogs.length})</span>
          </button>
        </div>

        {/* TAB 1: INVENTARIO */}
        {activeTab === 'inventory' && (
          <div>
            {/* Financial metrics for Admins - Global Total Investment View */}
            {isAdmin && (
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {/* 1. Inversión Global (Clickable / Multiple investments manager) */}
                <div
                  onClick={() => setIsInvestmentManagerOpen(true)}
                  className="bg-slate-800/90 hover:bg-slate-800/70 p-3.5 rounded-2xl border border-sky-500/40 shadow-sm cursor-pointer transition flex flex-col justify-between group"
                  title="Toca para ver historial o sumar más montos de inversión"
                >
                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="text-xs font-bold text-sky-200">Inversión Global</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-bold text-[10px] flex items-center gap-0.5">
                      <Plus className="w-2.5 h-2.5" />
                      <span>Sumar</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-lg font-black text-sky-300 block font-mono tabular-nums">
                      ${globalInvestment.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {investments.length > 0
                        ? `${investments.length} compras / montos`
                        : 'Toca para sumar montos'}
                    </span>
                  </div>
                </div>

                {/* 2. Valor Total en Venta del Inventario */}
                <div className="bg-slate-800/90 p-3.5 rounded-2xl border border-slate-700/60 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
                    <Boxes className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-200">Valor en Venta</span>
                  </div>
                  <div>
                    <span className="text-lg font-black text-slate-100 block font-mono tabular-nums">
                      ${totalRetailValue.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Stock actual a la venta
                    </span>
                  </div>
                </div>

                {/* 3. Ganancia Global Proyectada */}
                <div className="bg-slate-800/90 p-3.5 rounded-2xl border border-slate-700/60 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-200">Ganancia Neta</span>
                  </div>
                  <div>
                    <span
                      className={`text-lg font-black block font-mono tabular-nums ${
                        projectedNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {projectedNetProfit >= 0 ? '+' : ''}${projectedNetProfit.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {globalInvestment > 0 ? 'Venta total menos inversión' : 'Fija inversión para calcular'}
                    </span>
                  </div>
                </div>

                {/* 4. Total Cobrado en Ventas */}
                <div className="bg-slate-800/90 p-3.5 rounded-2xl border border-slate-700/60 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
                    <Banknote className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-200">Total Ventas</span>
                  </div>
                  <div>
                    <span className="text-lg font-black text-indigo-300 block font-mono tabular-nums">
                      ${totalSold.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Dinero cobrado en caja
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* Seller Mode Notice (Only for logged-in non-admins) */}
            {currentUser && !isAdmin && (
              <section className="mb-4">
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex items-center gap-3 text-xs text-amber-200">
                  <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0" />
                  <div>
                    <p className="font-bold">Modo Vendedor Activo</p>
                    <p className="text-[11px] text-amber-300/80">
                      Consulta inventario en tiempo real, escanea códigos y registra ventas.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Search and Filters with Voice Search (Web Speech API) */}
            <section className="mb-4 space-y-2.5">
              <VoiceSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onScanClick={() => {
                  setScannerMode('search');
                  setIsScannerOpen(true);
                }}
                onToast={showToast}
                placeholder="Buscar por nombre o código..."
              />

              {/* Acciones Rápidas Frontales: Escanear para Agregar & Selección Múltiple */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!requireAuth('escanear y registrar productos')) return;
                    setScannerMode('add');
                    setIsScannerOpen(true);
                  }}
                  className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white shadow-lg shadow-emerald-950/40 border border-emerald-400/40 font-bold text-xs flex items-center justify-center gap-2 transition"
                  title="Abrir cámara directamente para escanear y registrar un nuevo artículo"
                >
                  <Camera className="w-4 h-4 text-emerald-100" />
                  <span>Escanear y Agregar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!requireAuth('seleccionar y borrar artículos')) return;
                    const nextMode = !isSelectionMode;
                    setIsSelectionMode(nextMode);
                    if (!nextMode) {
                      setSelectedProductIds([]);
                    }
                  }}
                  className={`py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg active:scale-95 border ${
                    isSelectionMode || selectedProductIds.length > 0
                      ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400/50 shadow-purple-950/50 ring-2 ring-purple-400/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border-purple-500/30'
                  }`}
                  title="Activar o desactivar casillas de selección múltiple para borrar artículos"
                >
                  <CheckSquare className="w-4 h-4 text-purple-300" />
                  <span>
                    {isSelectionMode
                      ? `Seleccionando (${selectedProductIds.length})`
                      : 'Selección Múltiple'}
                  </span>
                </button>
              </div>

              {/* Category Filter Strip */}
              <div className="bg-slate-800/60 p-2 rounded-2xl border border-slate-700/60 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] px-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-300">
                    <Tag className="w-3.5 h-3.5 text-purple-400" />
                    <span>Filtrar por Categoría:</span>
                    {selectedCategory !== 'all' && (
                      <span className="text-purple-300 font-semibold bg-purple-500/20 px-2 py-0.2 rounded-md border border-purple-500/40 text-[10px]">
                        {selectedCategory}
                      </span>
                    )}
                  </div>
                  {selectedCategory !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold underline cursor-pointer"
                    >
                      Ver todas
                    </button>
                  )}
                </div>

                <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition active:scale-95 flex items-center gap-1.5 ${
                      selectedCategory === 'all'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40 border border-purple-400/40'
                        : 'bg-slate-900/90 text-slate-300 border border-slate-700/70 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>Todas</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        selectedCategory === 'all'
                          ? 'bg-purple-900/80 text-purple-200'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {products.length}
                    </span>
                  </button>

                  {(availableCategories.length > 0
                    ? availableCategories
                    : ['Smartphones', 'Accesorios', 'Cargadores', 'Audio', 'General']
                  ).map((cat) => {
                    const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                    const count = products.filter(
                      (p) => (p.category?.trim().toLowerCase() || 'general') === cat.toLowerCase()
                    ).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition active:scale-95 flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40 border border-purple-400/40'
                            : 'bg-slate-900/90 text-slate-300 border border-slate-700/70 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span>{cat}</span>
                        {count > 0 && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                              isSelected
                                ? 'bg-purple-900/80 text-purple-200'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shadow-sm transition ${
                    activeFilter === 'all'
                      ? 'bg-purple-600 text-white shadow-purple-900/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  Todos ({countAll})
                </button>
                <button
                  onClick={() => setActiveFilter('available')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shadow-sm transition ${
                    activeFilter === 'available'
                      ? 'bg-purple-600 text-white shadow-purple-900/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  En Stock ({countAvailable})
                </button>
                <button
                  onClick={() => setActiveFilter('low')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shadow-sm transition ${
                    activeFilter === 'low'
                      ? 'bg-purple-600 text-white shadow-purple-900/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  Bajo Stock ({countLow})
                </button>
                <button
                  onClick={() => setActiveFilter('out')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shadow-sm transition ${
                    activeFilter === 'out'
                      ? 'bg-purple-600 text-white shadow-purple-900/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  Agotados ({countOut})
                </button>
                <button
                  onClick={() => {
                    setScannerMode('batch');
                    setIsScannerOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm transition bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/40 flex items-center gap-1.5 shadow-emerald-950/40"
                  title="Escanear múltiples productos consecutivamente y sumarlos a una lista de venta"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-100" />
                  <span>Escaneo Múltiple / Lotes</span>
                </button>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shadow-sm transition bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/40 flex items-center gap-1.5"
                  title="Ingresar productos desde archivo Excel o PDF"
                >
                  <Upload className="w-3.5 h-3.5 text-teal-400" />
                  <span>Ingresar (Excel / PDF)</span>
                </button>
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shadow-sm transition bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/40 flex items-center gap-1.5"
                  title="Descargar inventario en PDF o Excel"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  <span>Exportar (PDF / Excel)</span>
                </button>

                {/* Seleccionar artículos para borrar en lote */}
                <button
                  onClick={() => {
                    const nextMode = !isSelectionMode;
                    setIsSelectionMode(nextMode);
                    if (!nextMode) {
                      setSelectedProductIds([]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shadow-sm transition flex items-center gap-1.5 ${
                    isSelectionMode || selectedProductIds.length > 0
                      ? 'bg-indigo-600 text-white shadow-indigo-900/40 border border-indigo-400/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/40'
                  }`}
                  title="Activar selección múltiple para borrar artículos"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-300" />
                  <span>
                    {isSelectionMode ? `Seleccionando (${selectedProductIds.length})` : 'Seleccionar Artículos'}
                  </span>
                </button>

                {/* Borrar Todo el Catálogo (Admin) */}
                {isAdmin && products.length > 0 && (
                  <button
                    onClick={handleDeleteAllProducts}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shadow-sm transition bg-rose-950/70 hover:bg-rose-900/90 text-rose-300 border border-rose-800/70 flex items-center gap-1.5"
                    title="Borrar permanentemente todos los artículos del catálogo"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Borrar Todo</span>
                  </button>
                )}
              </div>
            </section>

            {/* Selection Actions Bar (Visible when selecting or items are selected) */}
            {(isSelectionMode || selectedProductIds.length > 0) && (
              <div className="bg-slate-800/95 border border-indigo-500/50 rounded-2xl p-3 shadow-lg shadow-black/40 mb-4 backdrop-blur-md sticky top-16 z-20">
                <div className="flex items-center justify-between flex-wrap gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0">
                      <CheckSquare className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>
                          {selectedProductIds.length}{' '}
                          {selectedProductIds.length === 1
                            ? 'artículo seleccionado'
                            : 'artículos seleccionados'}
                        </span>
                        <span className="text-slate-400 font-normal">
                          (de {products.length} total)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Marca los artículos que deseas eliminar
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={handleSelectAllVisible}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600/70 transition flex items-center gap-1"
                      title="Seleccionar o deseleccionar los artículos visibles actualmente"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Visibles ({filteredProducts.length})</span>
                    </button>

                    {products.length > 0 && (
                      <button
                        onClick={handleSelectAllCatalog}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600/70 transition"
                        title="Seleccionar todos los artículos de todo el inventario"
                      >
                        Todo ({products.length})
                      </button>
                    )}

                    {selectedProductIds.length > 0 && (
                      <button
                        onClick={() => setSelectedProductIds([])}
                        className="px-2 py-1 text-xs rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                        title="Quitar selección"
                      >
                        Limpiar
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        disabled={selectedProductIds.length === 0}
                        onClick={handleDeleteSelected}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 shadow-sm ${
                          selectedProductIds.length > 0
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40 cursor-pointer'
                            : 'bg-rose-950/40 text-rose-500/50 border border-rose-900/40 cursor-not-allowed'
                        }`}
                        title="Eliminar permanentemente los productos seleccionados"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar ({selectedProductIds.length})</span>
                      </button>
                    )}

                    {isAdmin && products.length > 0 && (
                      <button
                        onClick={handleDeleteAllProducts}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 transition flex items-center gap-1"
                        title="Borrar todo el inventario"
                      >
                        <Trash2 className="w-3 h-3 text-rose-400" />
                        <span>Borrar Todo</span>
                      </button>
                    )}

                    <button
                      onClick={handleClearSelection}
                      className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-700/50 transition ml-1"
                      title="Cerrar modo de selección"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Product List Header */}
            <div className="flex items-center justify-between mb-2 px-1 flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-purple-400" />
                <span>Catálogo de Productos ({filteredProducts.length})</span>
              </span>

              {products.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isSelectionMode;
                      setIsSelectionMode(next);
                      if (!next) setSelectedProductIds([]);
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-xl transition flex items-center gap-1 border ${
                      isSelectionMode
                        ? 'bg-purple-600 text-white border-purple-400/60 shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                    title="Activar selección múltiple para eliminar artículos en lote"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span>{isSelectionMode ? 'Finalizar Selección' : 'Seleccionar para Borrar'}</span>
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleDeleteAllProducts}
                      className="px-2 py-1 text-xs font-semibold rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 transition flex items-center gap-1"
                      title="Borrar todos los artículos del catálogo"
                    >
                      <Trash2 className="w-3 h-3 text-rose-400" />
                      <span>Borrar Todo</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Product List */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-8">
              {isInitialLoading ? (
                <ProductCardSkeleton count={6} />
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-slate-800/60 rounded-3xl border border-slate-700/60 p-6">
                  <PackageOpen className="w-12 h-12 text-slate-600 mx-auto mb-2.5" />
                  <p className="text-slate-300 font-semibold text-sm">No hay productos registrados</p>
                  <p className="text-slate-500 text-xs mt-1">
                    {isAdmin
                      ? 'Toca el botón flotante "+" o el escáner para dar de alta el primer producto.'
                      : 'Intenta buscar con otro término o escanear un código.'}
                  </p>
                </div>
              ) : (
                filteredProducts.map((p) => (
                  <ProductCardItem
                    key={p.id}
                    product={p}
                    isSelected={selectedProductIds.includes(p.id)}
                    isSelectionMode={isSelectionMode}
                    isAdmin={isAdmin}
                    onToggleSelect={toggleSelectProduct}
                    onQuickSell={(prod) => {
                      if (!requireAuth('registrar ventas o sumar stock')) return;
                      setQuickScanProduct(prod);
                    }}
                    onEditPrice={(prod) => {
                      if (!requireAuth('modificar el precio')) return;
                      setPriceEditProduct(prod);
                      setIsPriceModalOpen(true);
                    }}
                    onShare={(prod) => {
                      handleShareProduct(prod);
                    }}
                    onEdit={(prod) => {
                      setEditingProduct(prod);
                      setIsProductModalOpen(true);
                    }}
                    onDelete={(id) => handleDeleteProduct(id)}
                  />
                ))
              )}
            </section>
          </div>
        )}

        {/* TAB 2: HISTORIAL */}
        {activeTab === 'history' && (
          <HistoryView
            logs={historyLogs}
            isAdmin={isAdmin}
            onClearHistory={() => {
              setHistoryLogs([]);
              addHistoryLog('Historial Limpiado', `Borrado por el administrador ${currentUser?.name}.`);
              showToast('Historial limpiado');
            }}
          />
        )}
      </main>

      {/* Floating Add Product Buttons (Admin Only) */}
      {isAdmin && activeTab === 'inventory' && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 flex flex-col items-center gap-2.5 z-30">
          <button
            onClick={() => {
              setScannerMode('add');
              setIsScannerOpen(true);
            }}
            className="w-12 h-12 bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-95 text-white rounded-full shadow-xl shadow-emerald-950/60 flex items-center justify-center transition-all border border-emerald-400/40 relative group"
            title="Escanear Código y Dar de Alta Producto"
            aria-label="Escanear y Dar de Alta"
          >
            <Camera className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-300 text-slate-950 flex items-center justify-center text-[10px] font-black shadow-sm">
              +
            </span>
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setPrefilledBarcode('');
              setIsProductModalOpen(true);
            }}
            className="w-13 h-13 sm:w-14 sm:h-14 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-full shadow-2xl shadow-indigo-600/50 flex items-center justify-center text-2xl transition-all border border-indigo-400/40"
            aria-label="Agregar Producto Manualmente"
            title="Agregar Producto Manualmente"
          >
            <Plus className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </div>
      )}

      {/* MODALS */}
      <Suspense fallback={null}>
        {/* 1. Barcode Scanner Modal with Multi-Scan & Batch Entry */}
        {isScannerOpen && (
          <BarcodeScannerModal
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            onScanSingle={handleScanSuccess}
            onConfirmBatchSale={handleConfirmBatchSale}
            products={products}
            initialMode={
              scannerMode === 'batch'
                ? 'batch'
                : scannerMode === 'add'
                ? 'add'
                : 'single'
            }
            title={
              scannerMode === 'batch'
                ? 'Escaneo Múltiple de Venta'
                : scannerMode === 'add'
                ? 'Escanear para Dar de Alta Producto'
                : scannerMode === 'form'
                ? 'Escanear Código para Formulario'
                : 'Lector de Códigos de Barras'
            }
            isAdmin={isAdmin}
          />
        )}
      </Suspense>

      {/* 2. Quick Action Modal (Sell / Add Stock) */}
      <QuickActionModal
        product={quickScanProduct}
        isAdmin={isAdmin}
        onClose={() => setQuickScanProduct(null)}
        onAction={handleQuickAction}
        onEditPrice={(p) => {
          setPriceEditProduct(p);
          setIsPriceModalOpen(true);
        }}
      />

      {/* 3. Product Add / Edit Modal */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        initialProduct={editingProduct}
        prefilledBarcode={prefilledBarcode}
        existingCategories={availableCategories}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
          setPrefilledBarcode('');
        }}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
        onRequestScan={() => {
          setScannerMode('form');
          setIsScannerOpen(true);
        }}
        onToast={showToast}
      />

      <Suspense fallback={null}>
        {/* 4. User Management Modal */}
        {isUserManagerOpen && (
          <UserManagerModal
            isOpen={isUserManagerOpen}
            users={users}
            currentUserId={currentUser?.id || ''}
            onClose={() => setIsUserManagerOpen(false)}
            onSaveUser={handleSaveUser}
            onDeleteUser={handleDeleteUser}
          />
        )}

        {/* 5. Change Password Modal */}
        {isChangePasswordOpen && (
          <ChangePasswordModal
            isOpen={isChangePasswordOpen}
            currentUser={currentUser}
            onClose={() => setIsChangePasswordOpen(false)}
            onUpdatePassword={handleUpdatePassword}
          />
        )}
      </Suspense>

      {/* 6. Landing Page & Authentication Modal */}
      <LandingAuthModal
        isOpen={isLoginOpen}
        users={users}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onExploreGuest={() => {
          setIsGuestMode(true);
          try {
            localStorage.setItem('inventory_guest_mode', 'true');
          } catch {}
          setIsLoginOpen(false);
          showToast('Explorando en Modo Invitado (Catálogo público)');
        }}
        onClose={() => {
          if (currentUser || isGuestMode) {
            setIsLoginOpen(false);
          }
        }}
        canDismiss={!!currentUser || isGuestMode}
      />

      <Suspense fallback={null}>
        {/* Share Modal */}
        {isShareModalOpen && (
          <ShareModal
            isOpen={isShareModalOpen}
            productToShare={productToShare}
            onClose={() => {
              setIsShareModalOpen(false);
              setProductToShare(null);
            }}
            onToast={showToast}
          />
        )}

        {/* 7. Investment Manager Modal (Múltiples Inversiones / Sumar Más Montos) */}
        {isInvestmentManagerOpen && (
          <InvestmentManagerModal
            isOpen={isInvestmentManagerOpen}
            onClose={() => setIsInvestmentManagerOpen(false)}
            investments={investments}
            onAddInvestment={handleAddInvestment}
            onDeleteInvestment={handleDeleteInvestment}
            totalRetailValue={totalRetailValue}
          />
        )}

        {/* 8. Export Modal (PDF / Excel) */}
        {isExportModalOpen && (
          <ExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            products={products}
            globalInvestment={globalInvestment}
            totalRetailValue={totalRetailValue}
            projectedNetProfit={projectedNetProfit}
            totalSold={totalSold}
            userName={currentUser?.name || 'Usuario'}
            isAdmin={isAdmin}
            onToast={showToast}
          />
        )}

        {/* 9. Bulk Import Modal (Excel / PDF) */}
        {isImportModalOpen && (
          <ImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImportProducts={handleImportProducts}
            onToast={showToast}
          />
        )}
      </Suspense>

      {/* 10. Quick Price Modification Modal (Modificar Precio de Venta) */}
      <QuickPriceModal
        isOpen={isPriceModalOpen}
        product={priceEditProduct}
        onClose={() => {
          setIsPriceModalOpen(false);
          setPriceEditProduct(null);
        }}
        onUpdatePrice={handleUpdateProductPrice}
      />

      {/* 11. Global In-App Confirmation Modal (Replaces blocked window.confirm) */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Mobile Bottom Navigation Dock */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        historyCount={historyLogs.length}
        onOpenScanner={() => {
          setScannerMode('search');
          setIsScannerOpen(true);
        }}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenShare={handleShareCatalog}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-24 md:bottom-20 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-2xl shadow-2xl border text-xs font-medium z-50 flex items-center space-x-2.5 backdrop-blur-md transition-all animate-bounce ${
            toast.type === 'error'
              ? 'bg-rose-950/95 text-rose-200 border-rose-500/50 shadow-rose-950/50'
              : 'bg-slate-900/95 text-slate-100 border-indigo-500/40 shadow-indigo-950/50'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
