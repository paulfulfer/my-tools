// Paul's Tools — Service Worker
// Caches all pages for offline use

const CACHE = 'pauls-tools-v1';
const STATIC = [
  '/', '/index.html',
  '/finance.html', '/golf.html', '/life.html',
  '/global_theme.css', '/firebase-config.js', '/firebase-shim.js',
  '/master_summer_2026_planner.html', '/shift_log.html',
  '/expense_log.html', '/roth_ira_tracker.html',
  '/golf_equipment.html', '/round_tracker.html',
  '/practice_log.html', '/club_distances.html',
  '/academic_planner.html', '/class.html',
  '/resume.html', '/job.html', '/network.html', '/workout.html',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network first for Firebase, cache first for everything else
  if(e.request.url.includes('firebase') || e.request.url.includes('google')){
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(res => {
        if(res && res.status === 200 && res.type === 'basic'){
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
