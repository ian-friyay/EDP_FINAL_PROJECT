import api from '../api/axios';

// Utility to convert VAPID base64 key to Uint8Array
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('serbisyou_push_permission_help'));
    }
    return { status: 'unsupported' };
  }

  // Request permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('serbisyou_push_permission_help'));
    }
    return { status: 'denied', reason: 'blocked' };
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

// Synthesize pleasant mobile notification chime using Web Audio API
export const playNotificationChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.15); // D6

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.05);
    osc1.stop(ctx.currentTime + 0.4);
    osc2.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // Audio autoplay restrictions handled
  }
};

// Vibrate cellphone hardware if supported
export const triggerCellphoneVibration = (pattern = [250, 100, 250, 100, 300]) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // ignore
    }
  }
};

// Register Service Worker for Mobile PWA Push
export const initServiceWorkerPush = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return registration;
  } catch (err) {
    console.warn('[Push ServiceWorker] registration notice:', err.message);
    return null;
  }
};

// Request Notification Permission on device / mobile
export const requestPushPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    return Notification.permission;
  }
};

// Dispatch real push notification straight to receiver's cellphone
export const dispatchCellphonePushNotification = async ({
  title = '🔔 SerbisYou Transaction Alert',
  description = 'You have a new transaction update on your SerbisYou account.',
  body,
  link = '/transactions',
  tag,
}) => {
  const contentBody = body || description;

  // 1. Play real-time audio chime
  playNotificationChime();

  // 2. Trigger cellphone hardware vibration
  triggerCellphoneVibration([250, 100, 250, 100, 300]);

  // 3. Dispatch real-time floating in-app push toast banner (works 100% of the time)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('serbisyou_realtime_push', {
        detail: {
          title,
          description: contentBody,
          link,
          tag: tag || `serbisyou-tx-${Date.now()}`,
        },
      })
    );
  }

  // 4. Dispatch native device push notification if browser allows
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  const notificationOptions = {
    body: contentBody,
    icon: '/logo-hands.png',
    badge: '/logo-hands.png',
    vibrate: [250, 100, 250, 100, 300],
    renotify: true,
    tag: tag || `serbisyou-tx-${Date.now()}`,
    data: { url: link },
  };

  try {
    if (Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, notificationOptions);
          return;
        }
      }
      new Notification(title, notificationOptions);
    } else if (Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification(title, notificationOptions);
      }
    }
  } catch (err) {
    console.warn('[Device Push Notification notice]:', err.message);
  }
};
