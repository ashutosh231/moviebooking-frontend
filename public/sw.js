// Dummy service worker to satisfy manifest requirement
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log('Service Worker activated');
});
