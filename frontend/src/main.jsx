import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { Provider } from 'react-redux'
import store from './store/index.js'
import { HelmetProvider } from 'react-helmet-async'
import { GlobalColorProvider } from './contexts/GlobalColorProvider.jsx'
import { fetchLcsCities } from './store/lcsCitiesSlice'
import { getBanners } from './functions/banner'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <HelmetProvider>
        <GlobalColorProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </GlobalColorProvider>
      </HelmetProvider>
    </Provider>
  </React.StrictMode>,
)

// Boot preloader: load light, critical resources during splash, then signal 'app-ready'
;(function boot(){
  const idle = (cb) => (window.requestIdleCallback || ((fn)=>setTimeout(fn,0)))(cb)
  const tasks = []
  try {
    // Preload city list (used in admin modal); cached with TTL in slice
    tasks.push(
      store.dispatch(fetchLcsCities()).unwrap().catch(()=>{})
    )
  } catch {}
  // Preload homepage banners and stash globally
  try {
    tasks.push(
      getBanners()
        .then((response) => {
          const list = Array.isArray(response) ? response : (response?.banners || response?.data || [])
          if (Array.isArray(list) && list.length) {
            window.__PRELOADED_BANNERS = list
            // Preload first 2 banner images at all responsive sizes
            const makeUrl = (imageUrl, w, h) => {
              if (!imageUrl) return null;
              if (imageUrl.startsWith('/')) return imageUrl; // local assets as-is
              const sep = imageUrl.includes('?') ? '&' : '?';
              return `${imageUrl}${sep}f_auto&q_80&w=${w}&h=${h}&c=fill`;
            }
            const firstTwo = list.slice(0, 2);
            const urls = [];
            for (const b of firstTwo) {
              urls.push(makeUrl(b.image, 800, 250));   // mobile
              urls.push(makeUrl(b.image, 1200, 400));  // tablet
              urls.push(makeUrl(b.image, 1920, 550));  // desktop
            }
            const imagePromises = urls.filter(Boolean).map(u => new Promise((resolve) => {
              const img = new Image();
              img.onload = img.onerror = () => resolve();
              img.src = u;
            }));
            return Promise.allSettled(imagePromises);
          }
        })
        .catch(()=>{})
    )
  } catch {}
  // Wait for fonts to be ready (improves first paint with correct metrics)
  if (document && document.fonts && document.fonts.ready) {
    tasks.push(document.fonts.ready.catch(()=>{}))
  }
  Promise.allSettled(tasks).then(() => idle(() => {
    try { window.dispatchEvent(new Event('app-ready')) } catch {}
  }))
})()

// Register Service Worker for performance optimization
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        // console.log('SW registration failed: ', registrationError);
      });
  });
}
