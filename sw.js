// 小金加油 - 离线缓存 Service Worker
// v2：导航/HTML 走 network-first（保证功能更新立即可见），
//     其它静态资源走 stale-while-revalidate（秒开 + 后台更新），离线时回退缓存。
const CACHE = 'xiaojin-v2';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting()) // 安装后立即激活，不等旧页面关闭
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)) // 清掉旧版本缓存
      ))
      .then(() => self.clients.claim()) // 立即接管所有页面
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const req = event.request;
  const url = new URL(req.url);

  // 导航请求（页面 HTML）：network-first，确保拿到最新页面（含新功能/新图标）
  if (req.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return resp;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // 静态资源：stale-while-revalidate（先返回缓存，同时后台更新）
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return resp;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
