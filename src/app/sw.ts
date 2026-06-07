import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "@serwist/precaching";
import { Serwist } from "@serwist/sw";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

self.addEventListener('push', function (event: any) {
  const data = JSON.parse(event.data.text());
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/globe.svg', // Icono básico, cambiar a logo en el futuro
      badge: '/globe.svg',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/admin/dashboard'
      }
    })
  );
});

self.addEventListener('notificationclick', function (event: any) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data.url);
      }
    })
  );
});
