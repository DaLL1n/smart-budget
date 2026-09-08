import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// CRITICAL: Capture beforeinstallprompt BEFORE React renders.
// The event fires very early on page load — if we wait for useEffect it's already gone.
// Store it globally so any component can access it at any time.
declare global {
  interface Window {
    __deferredInstallPrompt: any;
  }
}
window.__deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__deferredInstallPrompt = e;
  // Also dispatch a custom event so components can react if they're already mounted
  window.dispatchEvent(new CustomEvent('pwa-install-ready'));
});

window.addEventListener('appinstalled', () => {
  window.__deferredInstallPrompt = null;
  window.dispatchEvent(new CustomEvent('pwa-installed'));
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
