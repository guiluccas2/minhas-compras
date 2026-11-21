// Funcionamento sem internet: guarda o app (e o Firebase) no aparelho.
// Ao publicar versão nova, suba o número de CACHE.
const CACHE = "minhas-compras-v5";
const ARQUIVOS = [
  "./", "index.html", "manifest.webmanifest", "css/app.css?v=1.3.0", "js/app.js?v=1.3.0",
  "js/util.js", "js/extras.js", "js/catalogo.js", "js/dados.js", "js/nuvem.js", "js/config.js", "js/ui.js", "js/telas.js", "js/compra.js", "js/mais.js",
  "icons/icon-192.png", "icons/icon-180.png",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Firebase (bibliotecas) e fontes: guarda a primeira cópia e usa sempre a guardada
  if (url.hostname === "cdn.jsdelivr.net" || url.hostname === "www.gstatic.com" || url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const r = await c.match(req);
      if (r) return r;
      const n = await fetch(req);
      if (n.ok) c.put(req, n.clone());
      return n;
    }));
    return;
  }
  if (url.origin !== location.origin) return; // banco de dados e login vão direto
  // Arquivos do app: tenta a rede (versão nova) e cai para a cópia guardada sem internet
  e.respondWith(fetch(req).then(r => {
    if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return r;
  }).catch(() => caches.match(req, { ignoreSearch: false }).then(r => r || caches.match("index.html"))));
});
