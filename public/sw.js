const CACHE_NAME = 'alpine-route-optimizer-v1';
const STATIC_CACHE_NAME = 'static-v1';
const DYNAMIC_CACHE_NAME = 'dynamic-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard/',
  '/gallery/',
  '/manifest.json',
  // Core JavaScript and CSS will be added by Next.js automatically
];

// API endpoints that should be cached
const API_CACHE_PATTERNS = [
  /^https:\/\/api\.open-meteo\.com\//, // Elevation API
  /^https:\/\/overpass-api\.de\//, // Trail data API
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE_NAME));
  } else if (isAPIRequest(request)) {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE_NAME));
  } else if (isNavigationRequest(request)) {
    event.respondWith(navigationStrategy(request));
  } else {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE_NAME));
  }
});

// Cache-first strategy for static assets
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }
    
    console.log('[SW] Fetching and caching:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first strategy failed:', error);
    return new Response('Offline content not available', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Network-first strategy for API requests and dynamic content
async function networkFirstStrategy(request, cacheName) {
  try {
    console.log('[SW] Network-first for:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && isAPIRequest(request)) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
      console.log('[SW] API response cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', request.url);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving stale content from cache:', request.url);
      return cachedResponse;
    }
    
    // For API requests, return meaningful offline response
    if (isAPIRequest(request)) {
      return new Response(JSON.stringify({
        error: 'Network unavailable',
        message: 'This feature requires an internet connection',
        cached: false
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Navigation strategy for page requests
async function navigationStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation offline, serving cached page');
    
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedPage = await cache.match('/');
    
    if (cachedPage) {
      return cachedPage;
    }
    
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Alpine Route Optimizer - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              text-align: center; 
              padding: 2rem;
              background: #0f172a;
              color: #e2e8f0;
            }
            .offline-icon { 
              font-size: 4rem; 
              margin-bottom: 1rem; 
            }
          </style>
        </head>
        <body>
          <div class="offline-icon">🏔️</div>
          <h1>Alpine Route Optimizer</h1>
          <p>You're currently offline. Please check your internet connection and try again.</p>
          <button onclick="window.location.reload()">Retry</button>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2|ttf)$/);
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return API_CACHE_PATTERNS.some(pattern => pattern.test(request.url)) ||
         url.pathname.startsWith('/api/');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

// Background sync for route saving when back online
self.addEventListener('sync', (event) => {
  if (event.tag === 'save-route') {
    console.log('[SW] Background sync: save-route');
    event.waitUntil(processPendingRoutes());
  }
});

async function processPendingRoutes() {
  try {
    // This would integrate with your Supabase route saving
    // For now, just log that we're ready for background sync
    console.log('[SW] Ready to process pending route saves');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Message handling for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_ROUTE') {
    // Cache a specific route for offline access
    const { routeData } = event.data;
    cacheRouteData(routeData);
  }
});

async function cacheRouteData(routeData) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const response = new Response(JSON.stringify(routeData), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(`/cached-route/${routeData.id}`, response);
    console.log('[SW] Route data cached for offline access');
  } catch (error) {
    console.error('[SW] Failed to cache route data:', error);
  }
}