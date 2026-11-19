// SerbisYou Service Worker for Mobile Push Notifications & Offline Support
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push notifications from server
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'SerbisYou Alert', body: event.data.text() };
    }
  }

  const title = data.title || '🔔 SerbisYou Transaction Alert';
  const options = {
    body: data.body || data.description || 'You have a new transaction update on your SerbisYou account.',
    icon: '/logo-hands.png',
    badge: '/logo-hands.png',
    vibrate: [250, 100, 250, 100, 300],
    data: {
      url: data.url || data.link || '/transactions',
    },
    actions: [
      { action: 'open', title: 'View Transaction' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    tag: data.tag || `serbisyou-tx-${Date.now()}`,
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle user clicking the push notification on their cellphone / screen
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/transactions';

  if (event.action === 'dismiss') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
