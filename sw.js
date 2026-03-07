// ═══════════════════════════════════════
//  UK BAZAR — Service Worker
//  هەر جار نوێترین فایل لە نێتوۆرک دێت
// ═══════════════════════════════════════

const CACHE_NAME = 'ukbazar-v' + Date.now();

// ── INSTALL ──────────────────────────────
self.addEventListener('install', e => {
    self.skipWaiting(); // فەوری بچۆ بۆ activate
});

// ── پەیام وەرگرتن بۆ SKIP_WAITING ──────
self.addEventListener('message', e => {
    if (e.data && e.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// ── ACTIVATE: هەموو کەشە کۆنەکان بسڕەوە ──────
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.map(k => {
                console.log('[SW] کەشی کۆن سڕایەوە:', k);
                return caches.delete(k);
            })))
            .then(() => self.clients.claim())
    );
});

// ── FETCH ──────────────────────────────────────
self.addEventListener('fetch', e => {
    const url = e.request.url;

    // Firebase و Google — هەرگیز کەش مەکە
    if (
        url.includes('firebase') ||
        url.includes('googleapis.com') ||
        url.includes('firebasestorage') ||
        url.includes('firebaseio.com') ||
        url.includes('firebaseapp.com') ||
        url.includes('gstatic.com') ||
        url.includes('cdnjs.cloudflare.com')
    ) {
        return; // بەبێ کەش — ڕاستەوخۆ بچۆ بۆ نێتوۆرک
    }

    // فایلە سەرەکیەکان (html, css, js) — هەمیشە نوێترین نسخە
    if (
        url.endsWith('.html') ||
        url.endsWith('.css') ||
        url.endsWith('.js') ||
        url.endsWith('/') ||
        url.includes('index.html') ||
        url.includes('style.css') ||
        url.includes('app.js') ||
        url.includes('sw.js')
    ) {
        e.respondWith(
            fetch(e.request, { cache: 'no-store' })
                .catch(() => caches.match(e.request))
        );
        return;
    }

    // وێنەکان — کەش بکە بۆ سوورعەت
    if (
        url.endsWith('.png') ||
        url.endsWith('.jpg') ||
        url.endsWith('.jpeg') ||
        url.endsWith('.webp') ||
        url.endsWith('.svg') ||
        url.endsWith('.ico')
    ) {
        e.respondWith(
            caches.match(e.request).then(cached => {
                if (cached) return cached;
                return fetch(e.request).then(res => {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
                    return res;
                });
            })
        );
        return;
    }

    // شتەکانی تر — نێتوۆرک سەرەوە
    e.respondWith(
        fetch(e.request, { cache: 'no-store' })
            .catch(() => caches.match(e.request))
    );
});
