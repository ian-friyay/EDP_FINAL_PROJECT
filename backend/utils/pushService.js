const fs = require('fs');
const path = require('path');
const webpush = require('web-push');
const supabase = require('../supabaseClient');

const DATA_DIR = path.join(__dirname, '../data');
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'push_subscriptions.json');

// Initialize WebPush VAPID details
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BMG2rutU1yCj8qDcNp1SvIe8Y3U5F58nGsu4akjo_tbI08ICyh37f2t0DIWHGKwAt0nhkCVukwgCM-GBnr78srk';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'UTTmrtfjTQ8Ay7tag-4K76B1yhOjv5_1R0iXCGje4PU';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:adriandadoviernes@gmail.com';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (err) {
  console.warn('[WebPush VAPID Warning]', err.message);
}

/**
 * File-backed persistence for subscriptions to ensure delivery even if Supabase table isn't migrated
 */
const loadFileSubscriptions = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      const data = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.warn('[Push Service] Could not read push subscriptions file:', err.message);
  }
  return [];
};

const saveFileSubscriptions = (subs) => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2), 'utf8');
  } catch (err) {
    console.warn('[Push Service] Could not save push subscriptions file:', err.message);
  }
};

/**
 * Save / upsert a user's push subscription
 */
const saveSubscription = async (userId, subscription) => {
  if (!userId || !subscription || !subscription.endpoint) return;

  const endpoint = subscription.endpoint;
  const subs = loadFileSubscriptions();
  const existingIdx = subs.findIndex(s => s.endpoint === endpoint);

  const entry = {
    user_id: String(userId),
    subscription,
    endpoint,
    updated_at: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    subs[existingIdx] = entry;
  } else {
    subs.push(entry);
  }
  saveFileSubscriptions(subs);

  // Also attempt Supabase upsert
  try {
    await supabase.from('push_subscriptions').upsert({
      user_id: String(userId),
      endpoint,
      subscription,
      updated_at: new Date().toISOString()
    }, { onConflict: 'endpoint' });
  } catch {
    // Ignore Supabase errors if table does not exist
  }
};

/**
 * Remove a user's push subscription
 */
const removeSubscription = async (endpoint) => {
  if (!endpoint) return;
  const subs = loadFileSubscriptions();
  const filtered = subs.filter(s => s.endpoint !== endpoint);
  saveFileSubscriptions(filtered);

  try {
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  } catch {
    // Ignore
  }
};

/**
 * Send an outside web push notification to a user's subscribed devices
 * @param {string} userId - User ID to send to
 * @param {object} payload - { title, body, icon, url, tag }
 */
const sendPushToUser = async (userId, payload) => {
  if (!userId) return;
  const targetId = String(userId);

  // Load subscriptions for user
  const subs = loadFileSubscriptions().filter(s => String(s.user_id) === targetId);
  if (subs.length === 0) return;

  const payloadString = JSON.stringify({
    title: payload.title || 'SerbisYou Alert',
    body: payload.body || 'You have an update on SerbisYou.',
    icon: payload.icon || '/logo-hands.png',
    badge: payload.badge || '/favicon.png',
    url: payload.url || '/',
    tag: payload.tag || 'serbisyou-notif'
  });

  const sendPromises = subs.map(async (subEntry) => {
    try {
      await webpush.sendNotification(subEntry.subscription, payloadString);
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        // Subscription has expired or user revoked permission
        await removeSubscription(subEntry.endpoint);
      } else {
        console.warn(`[WebPush Send Error for ${targetId}]:`, err.message);
      }
    }
  });

  await Promise.allSettled(sendPromises);
};

module.exports = {
  VAPID_PUBLIC_KEY,
  saveSubscription,
  removeSubscription,
  sendPushToUser
};
