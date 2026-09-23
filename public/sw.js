// Service Worker para CRM Pádel
// Silenciar logs en producción (el SW no pasa por minificación de Vite)
const IS_DEV = ['localhost', '127.0.0.1'].includes(self.location.hostname);
const swLog = (...args) => {
  if (IS_DEV) console.log(...args);
};
const swError = (...args) => {
  if (IS_DEV) console.error(...args);
};
// Bump de versión para invalidar cachés antiguos
const CACHE_NAME = 'crm-padel-v1.0.3';
const STATIC_CACHE = 'crm-padel-static-v1.0.3';
const DYNAMIC_CACHE = 'crm-padel-dynamic-v1.0.3';

// Archivos estáticos a cachear
// Precargar solo archivos que existen en producción
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/favicon-48x48.png',
  '/apple-touch-icon.png',
  '/icon-512x512.png',
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  swLog('🔧 Service Worker instalándose...');

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => {
        swLog('📦 Cacheando archivos estáticos...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        swLog('✅ Service Worker instalado correctamente');
        return self.skipWaiting();
      })
      .catch(error => {
        swError('❌ Error instalando Service Worker:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  swLog('🚀 Service Worker activándose...');

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              swLog('🗑️ Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        swLog('✅ Service Worker activado correctamente');
        return self.clients.claim();
      })
  );
});

// Interceptar requests
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo cachear requests del mismo origen y lecturas
  if (url.origin !== location.origin || request.method !== 'GET') {
    return;
  }

  // La API nunca se cachea: son datos de sesión y respuestas que caducan al instante.
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Estrategia: Network First para documentos, Cache First para estáticos con hash
  if (request.destination === 'document') {
    // Network First: si se cachea el index.html, tras cada despliegue el navegador
    // sigue pidiendo assets con hashes que ya no existen y la app queda en blanco.
    event.respondWith(
      fetch(request)
        .then(fetchResponse => {
          const responseClone = fetchResponse.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
          return fetchResponse;
        })
        .catch(() =>
          caches.match(request).then(
            cached => cached || caches.match('/index.html') || new Response('Sin conexión', { status: 503 })
          )
        )
    );
  } else if (
    request.destination === 'script' ||
    request.destination === 'style'
  ) {
    // Cache First para scripts/styles en móviles (mejor rendimiento)
    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          return response;
        }
        return fetch(request).then(fetchResponse => {
          if (
            fetchResponse &&
            fetchResponse.ok &&
            fetchResponse.headers.get('content-type') &&
            !fetchResponse.headers.get('content-type').includes('text/html')
          ) {
            const responseClone = fetchResponse.clone();
            caches
              .open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, responseClone));
          }
          return fetchResponse;
        });
      })
    );
  } else {
    // Network First para el resto (imágenes, manifest, iconos)
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || new Response('', { status: 504 })))
    );
  }
});

// Manejar mensajes del cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notificaciones push (para futuras funcionalidades)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/apple-touch-icon.png',
      badge: '/favicon-48x48.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1,
      },
      actions: [
        {
          action: 'explore',
          title: 'Ver detalles',
          icon: '/favicon-48x48.png',
        },
        {
          action: 'close',
          title: 'Cerrar',
          icon: '/favicon-48x48.png',
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(self.clients.openWindow('/'));
  }
});
