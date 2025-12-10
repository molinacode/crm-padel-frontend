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
const CACHE_NAME = 'crm-padel-v0.5.0';
const STATIC_CACHE = 'crm-padel-static-v0.5.0';
const DYNAMIC_CACHE = 'crm-padel-dynamic-v0.5.0';

// Archivos estáticos a cachear
// Precargar solo archivos que existen en producción
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-180px.png',
  '/icon-192px.png',
  '/icon-512px.png',
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

  // Solo cachear requests del mismo origen
  if (url.origin !== location.origin) {
    return;
  }

  // Estrategia: Cache First para archivos estáticos, Network First para datos dinámicos
  if (request.destination === 'document') {
    // Cache First para documentos (index.html)
    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          return response;
        }
        return fetch(request).then(fetchResponse => {
          const responseClone = fetchResponse.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
          return fetchResponse;
        });
      })
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
    // Network First para datos dinámicos (API calls)
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
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
      icon: '/icon-192px.png',
      badge: '/icon-192px.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1,
      },
      actions: [
        {
          action: 'explore',
          title: 'Ver detalles',
          icon: '/icon-192px.png',
        },
        {
          action: 'close',
          title: 'Cerrar',
          icon: '/icon-192px.png',
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
