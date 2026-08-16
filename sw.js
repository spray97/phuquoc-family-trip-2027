// 푸꾸옥 2027 가족여행 — 오프라인 캐시
// 현지 와이파이가 끊겨도 일정표(index/island/places/references)와 스타일은 보이도록
// 같은 출처(same-origin) 텍스트 자산만 stale-while-revalidate로 캐싱한다.
// 이미지·폰트·Leaflet 등 외부(cross-origin) 요청은 건드리지 않고 그대로 네트워크로 보낸다.
//
// 버전을 올리면(예: v2) 이전 캐시가 자동 삭제되고 새 자산으로 갱신된다.
const CACHE_NAME = 'phuquoc-2027-v3';
const CORE_ASSETS = [
  './',
  'index.html',
  'island.html',
  'places.html',
  'references.html',
  'lodging-review.html',
  'arrival-review.html',
  'style.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return; // 외부 자산은 SW 개입 없이 그대로

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached); // 오프라인이면 캐시로 대체
      return cached || network; // 캐시 있으면 즉시 응답 + 백그라운드 갱신, 없으면 네트워크 대기
    })
  );
});
