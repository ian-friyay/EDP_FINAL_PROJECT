const fs = require('fs');
const path = require('path');
const supabase = require('../supabaseClient');

const KNOWN_USERS = {
  'MMC-0001': 'Jasmine Requestor',
  'MMC-1042': 'Juan Dela Cruz',
  'MMC-2015': 'Maria Santos',
  'MMC-3044': 'Pedro Penduko',
  'MMC-3045': 'Adrian Friday',
  'MMC-3046': 'Keizy Lara',
};

// Persistent storage for read notification IDs across server restarts
const DATA_DIR = path.join(__dirname, '../data');
const READ_CACHE_FILE = path.join(DATA_DIR, 'read_notifications.json');

const loadReadCache = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(READ_CACHE_FILE)) {
      const raw = fs.readFileSync(READ_CACHE_FILE, 'utf8');
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr);
      }
    }
  } catch (err) {
    console.warn('Could not load persistent read notification cache:', err.message);
  }
  return new Set();
};

const saveReadCache = (cacheSet) => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(READ_CACHE_FILE, JSON.stringify(Array.from(cacheSet)), 'utf8');
  } catch (err) {
    console.warn('Could not save persistent read notification cache:', err.message);
  }
};

const readNotificationIds = loadReadCache();

const getCurrentUserId = (req) =>
  (req.user && (req.user.id || req.user.user_id)) ||
  req.query.userId ||
  req.headers['x-user-id'] ||
  (req.body && req.body.currentUserId) ||
  null;

const createNotification = async (userId, type, title, description, link) => {
  try {
    await supabase.from('notifications').insert([{
      user_id: String(userId),
      type: type || 'system',
      title,
      description,
      link,
      is_read: false,
    }]);
  } catch (err) {
    console.warn('[Notification notice] Could not insert persistent notification:', err.message);
  }
};

const getNotifications = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    if (!currentUserId) {
      return res.status(400).json({ error: 'Current user ID is required.' });
    }

    const normalizedUser = String(currentUserId);

    // 1. Try fetching from persistent 'notifications' table first
    try {
      const { data: dbNotifs, error: dbErr } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', normalizedUser)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!dbErr && Array.isArray(dbNotifs) && dbNotifs.length > 0) {
        return res.json({
          notifications: dbNotifs.map((n) => ({
            id: n.notification_id,
            type: n.type,
            title: n.title,
            description: n.description,
            timestamp: n.created_at,
            read: n.is_read || readNotificationIds.has(String(n.notification_id)),
            link: n.link,
          })),
        });
      }
    } catch {
      // Table may not exist yet, continue with live synthesizer fallback
    }

    // 2. Fallback live synthesis: Fetch received messages
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('receiver_id', normalizedUser)
      .order('timestamp', { ascending: false })
      .limit(30);

    if (msgError) {
      console.error('Error fetching messages for notifications:', msgError.message);
    }

    // 3. Fetch transactions for current user (as requestor or provider)
    let transactions = [];
    try {
      const { data: txList, error: txErr } = await supabase
        .from('transactions')
        .select('*')
        .or(`requestor_id.eq.${normalizedUser},provider_id.eq.${normalizedUser}`)
        .order('transaction_id', { ascending: false })
        .limit(20);

      if (!txErr && Array.isArray(txList)) {
        transactions = txList;
      }
    } catch (err) {
      console.error('Error fetching transactions for notifications:', err.message);
    }

    // 4. Collect user IDs and service IDs to get names in one go
    const userIds = new Set();
    (messages || []).forEach((m) => m.sender_id && userIds.add(String(m.sender_id)));
    transactions.forEach((tx) => {
      if (tx.requestor_id) userIds.add(String(tx.requestor_id));
      if (tx.provider_id) userIds.add(String(tx.provider_id));
    });

    const serviceIds = [...new Set(transactions.map((tx) => tx.service_id).filter(Boolean))];

    const usersMap = new Map();
    if (userIds.size > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('user_id, first_name, last_name, username')
        .in('user_id', Array.from(userIds));

      (usersData || []).forEach((u) => {
        const fullName =
          [u.first_name, u.last_name].filter(Boolean).join(' ').trim() ||
          u.username;
        usersMap.set(String(u.user_id), fullName);
      });
    }

    const servicesMap = new Map();
    if (serviceIds.length > 0) {
      const { data: servicesData } = await supabase
        .from('services')
        .select('service_id, subcategory, service_category')
        .in('service_id', serviceIds);

      (servicesData || []).forEach((s) => {
        servicesMap.set(
          String(s.service_id),
          s.subcategory || s.service_category || 'Service'
        );
      });
    }

    const synthesizedNotifications = [];

    // Message notifications
    (messages || []).forEach((msg) => {
      const senderName =
        usersMap.get(String(msg.sender_id)) ||
        KNOWN_USERS[String(msg.sender_id)] ||
        `User ${msg.sender_id}`;

      const notifId = `msg_${msg.message_id}`;
      synthesizedNotifications.push({
        id: notifId,
        type: 'message',
        title: `Message from ${senderName}`,
        description: msg.content || 'Sent you a message.',
        timestamp: msg.timestamp,
        read: msg.is_read || readNotificationIds.has(notifId),
        link: `/messages/${msg.sender_id}`,
        target_id: msg.sender_id,
      });
    });

    // Transaction notifications
    transactions.forEach((tx) => {
      const isRequestor = String(tx.requestor_id) === normalizedUser;
      const partnerId = isRequestor ? tx.provider_id : tx.requestor_id;
      const partnerName =
        usersMap.get(String(partnerId)) ||
        KNOWN_USERS[String(partnerId)] ||
        `User ${partnerId}`;
      const serviceName =
        servicesMap.get(String(tx.service_id)) || 'Marketplace Service';

      const notifId = `tx_${tx.transaction_id}`;
      let title = `Transaction #${tx.transaction_id}`;
      let description = '';

      const status = (tx.transaction_status || '').toLowerCase();
      if (status === 'completed') {
        title = `Transaction #${tx.transaction_id} Completed`;
        description = isRequestor
          ? `Service for "${serviceName}" with ${partnerName} has been completed.`
          : `You completed "${serviceName}" for ${partnerName}.`;
      } else if (status === 'cancelled') {
        title = `Transaction #${tx.transaction_id} Cancelled`;
        description = `Booking for "${serviceName}" was cancelled.`;
      } else {
        title = `Booking Accepted`;
        description = isRequestor
          ? `Your booking for "${serviceName}" has been placed with ${partnerName}.`
          : `New booking request from ${partnerName} for "${serviceName}".`;
      }

      synthesizedNotifications.push({
        id: notifId,
        type: 'transaction',
        title,
        description,
        timestamp: tx.created_at || new Date().toISOString(),
        read: readNotificationIds.has(notifId),
        link: `/transactions/${tx.transaction_id}/qr`,
        target_id: tx.transaction_id,
      });
    });

    synthesizedNotifications.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return res.json({ notifications: synthesizedNotifications });
  } catch (err) {
    console.error('getNotifications error:', err);
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    if (!currentUserId) {
      return res.status(400).json({ error: 'Current user ID is required.' });
    }

    const normalizedUser = String(currentUserId);

    // 1. Mark in notifications table
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', normalizedUser);
    } catch {
      // ignore
    }

    // 2. Mark in messages table
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', normalizedUser);
    } catch {
      // ignore
    }

    // 3. Mark in-memory fallback
    const { data: messages } = await supabase
      .from('messages')
      .select('message_id')
      .eq('receiver_id', normalizedUser);

    (messages || []).forEach((m) => readNotificationIds.add(`msg_${m.message_id}`));

    const { data: txList } = await supabase
      .from('transactions')
      .select('transaction_id')
      .or(`requestor_id.eq.${normalizedUser},provider_id.eq.${normalizedUser}`);

    (txList || []).forEach((t) => readNotificationIds.add(`tx_${t.transaction_id}`));
    saveReadCache(readNotificationIds);

    return res.json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const markOneAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Notification ID is required.' });
    }

    readNotificationIds.add(String(id));
    saveReadCache(readNotificationIds);

    if (id.startsWith('msg_')) {
      const messageId = id.replace('msg_', '');
      try {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('message_id', messageId);
      } catch {
        // ignore
      }
    } else {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('notification_id', id);
      } catch {
        // ignore
      }
    }

    return res.json({ success: true, message: `Notification ${id} marked as read.` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getNotifications,
  markAllAsRead,
  markOneAsRead,
  createNotification,
};
