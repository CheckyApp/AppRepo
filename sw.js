// Checky service worker: lets the app open quickly and show its screens without a connection.
// Accounts and family data (Supabase) are never cached here; they always come live from the server.
const CACHE = 'checky-v22';
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png',
  '/icons/apple-touch-icon.png', '/icons/favicon-32.png'];
const STATIC_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // The app itself: always try the newest version first, fall back to the saved copy when offline
  if (url.origin === self.location.origin) {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || (req.mode === 'navigate' ? caches.match('/') : Response.error()))));
    return;
  }

  // Fonts and the sign-in library: use the saved copy, refresh it in the background
  if (STATIC_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => {
      const fresh = fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || fresh;
    })));
  }
  // Everything else (Supabase) goes straight to the network
});

// ---------- Phone notifications ----------
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: 'Checky', body: e.data ? e.data.text() : '' }; }
  const approval = d.kind === 'approval';
  e.waitUntil(self.registration.showNotification(d.title || 'Checky', {
    body: d.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/favicon-32.png',
    tag: approval ? 'checky-approval' : undefined,
    renotify: approval,
    requireInteraction: approval,
    data: { open: d.kind === 'test' ? null : 'shared' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const open = e.notification.data && e.notification.data.open;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
    for (const w of wins) { if ('focus' in w) { if (open) w.postMessage({ open }); return w.focus(); } }
    return self.clients.openWindow(open ? '/#' + open : '/');
  }));
});
