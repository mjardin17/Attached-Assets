import { createRoot } from 'react-dom/client';

import App from './App';

import './index.css';

// Only register the service worker in production builds. In dev, Vite's HMR
// server and a cache-first SW fight over which bundle is served, which can
// pin a stale/broken build in the browser indefinitely.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const basePath = import.meta.env.BASE_URL || '/';
    navigator.serviceWorker.register(`${basePath}sw.js`)
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
} else if ('serviceWorker' in navigator) {
  // Dev mode: make sure no stale SW/cache from a previous production-like
  // preview keeps serving old bundles.
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.unregister());
  });
  if ('caches' in window) {
    caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
  }
}

createRoot(document.getElementById('root')!).render(<App />);
