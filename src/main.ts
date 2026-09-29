import { createApp } from 'vue';
import './style.css';
import App from './App.vue';

// Register Service Worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('Area Care PWA Service Worker registered:', reg.scope);
    }).catch(err => {
      console.warn('Service Worker registration failed:', err);
    });
  });
}

createApp(App).mount('#app');
