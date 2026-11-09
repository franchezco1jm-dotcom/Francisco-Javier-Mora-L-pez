import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Purge rogue old cache names that might have been stored by legacy scripts
if (typeof window !== 'undefined' && 'caches' in window) {
  caches.delete('app-cache-v1').catch(() => {});
}

// Safely register PWA Service Worker without auto-reloading
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Blackberry Inventory: Actualización disponible');
  },
  onOfflineReady() {
    console.log('Blackberry Inventory: Listo para uso sin conexión');
  },
});

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
