import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

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



createRoot(document.getElementById('root')!).render(<App />);
