'use client';

import { useEffect, useState, useCallback } from 'react';

interface ServiceWorkerState {
  isInstalled: boolean;
  isInstalling: boolean;
  updateAvailable: boolean;
  error: string | null;
}

export function ServiceWorkerRegistration() {
  const [swState, setSwState] = useState<ServiceWorkerState>({
    isInstalled: false,
    isInstalling: false,
    updateAvailable: false,
    error: null,
  });

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    } else {
      setSwState(prev => ({ 
        ...prev, 
        error: 'Service Workers not supported in this browser' 
      }));
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      setSwState(prev => ({ ...prev, isInstalling: true }));

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });


      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                setSwState(prev => ({ ...prev, updateAvailable: true }));
              } else {
                setSwState(prev => ({ 
                  ...prev, 
                  isInstalled: true, 
                  isInstalling: false 
                }));
              }
            }
          });
        }
      });

      // Check if service worker is already controlling the page
      if (registration.active) {
        setSwState(prev => ({ 
          ...prev, 
          isInstalled: true, 
          isInstalling: false 
        }));
      }

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'CACHE_UPDATED') {
          // Cache update notification received
        }
      });

    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      setSwState(prev => ({ 
        ...prev, 
        error: `Service Worker registration failed: ${error}`,
        isInstalling: false 
      }));
    }
  };

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  };

  const cacheCurrentRoute = useCallback((routeData: unknown) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_ROUTE',
        routeData
      });
    }
  }, []);

  // Expose cache function globally for use in other components
  useEffect(() => {
    (window as { cacheRoute?: (data: unknown) => void }).cacheRoute = cacheCurrentRoute;
  }, [cacheCurrentRoute]);

  return (
    <>
      {swState.updateAvailable && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center space-x-3">
            <div>
              <p className="font-medium">App Update Available</p>
              <p className="text-sm opacity-90">A new version is ready to install</p>
            </div>
            <button
              onClick={handleUpdate}
              className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Update
            </button>
          </div>
        </div>
      )}
      
      {swState.error && process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-600 text-white p-3 rounded-lg text-sm max-w-sm">
          <p className="font-medium">PWA Error:</p>
          <p className="opacity-90">{swState.error}</p>
        </div>
      )}
      
      {swState.isInstalled && process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-50 bg-green-600 text-white p-2 rounded text-xs">
          PWA Ready
        </div>
      )}
    </>
  );
}

// Hook for other components to interact with PWA features
export function usePWA() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const cacheRoute = (routeData: unknown) => {
    const windowWithCache = window as { cacheRoute?: (data: unknown) => void };
    if (windowWithCache.cacheRoute) {
      windowWithCache.cacheRoute(routeData);
    }
  };

  const canInstall = () => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  };

  return {
    isOffline,
    cacheRoute,
    canInstall: canInstall(),
    isInstallable: !!(window as { deferredPrompt?: unknown }).deferredPrompt
  };
}