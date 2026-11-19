import api from '../api/axios';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const isPushSupported = () => {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};

export const getNotificationPermissionState = () => {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission; // 'default', 'granted', 'denied'
};

export const subscribeUserToPush = async (userId) => {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported on this browser.');
  }

  // Request permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was denied.');
  }

  // Get active Service Worker registration
  const registration = await navigator.serviceWorker.ready;

  // Fetch VAPID Public Key from backend
  const res = await api.get('/notifications/vapid-key');
  const vapidPublicKey = res.data?.publicKey;
  if (!vapidPublicKey) {
    throw new Error('Failed to retrieve server push key.');
  }

  const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

  // Subscribe with PushManager
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey
    });
  }

  // Send subscription to backend
  await api.post('/notifications/subscribe', {
    subscription,
    currentUserId: userId
  }, {
    headers: { 'x-user-id': String(userId) }
  });

  return subscription;
};

export const unsubscribeUserFromPush = async () => {
  if (!isPushSupported()) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await api.post('/notifications/unsubscribe', {
      endpoint: subscription.endpoint
    });
    await subscription.unsubscribe();
  }
};
