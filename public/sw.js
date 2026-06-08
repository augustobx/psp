self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  if (!event.data) return;
  
  let data;
  try {
    data = JSON.parse(event.data.text());
  } catch (err) {
    // Si no es JSON (ej. pruebas de DevTools), lo mostramos como texto simple
    data = {
      title: 'Notificación del Sistema',
      body: event.data.text(),
      url: '/admin/dashboard'
    };
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/globe.svg',
      badge: '/globe.svg',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/admin/dashboard'
      }
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus if already open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data.url);
      }
    })
  );
});