// Service worker: ให้เปิดใช้งานได้แม้ไม่มีอินเทอร์เน็ต (ข้อมูลยังเก็บในเบราว์เซอร์เหมือนเดิม)
const CACHE = 'travel-8708-v2';
const CORE = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png', './icons/icon.svg'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // หน้าแอป: ใช้ฉบับล่าสุดจากเครือข่ายก่อน ถ้าออฟไลน์ใช้ฉบับในแคช
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // ไฟล์อื่น (ไอคอน ฟอนต์): ใช้แคชก่อน แล้วค่อยดึงจากเครือข่าย
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
      return r;
    })));
  }
});
