const supabase = require('../supabaseClient');

const KNOWN_USERS = {
  'MMC-0001': 'Jasmine Requestor',
  'MMC-1042': 'Juan Dela Cruz',
  'MMC-2015': 'Maria Santos',
  'MMC-3044': 'Pedro Penduko',
  'MMC-3045': 'Adrian Friday',
  'MMC-3046': 'Keizy Lara',
};

// In-memory set of read notification IDs per user (persists during server uptime)
const readNotificationIds = new Set();

const getCurrentUserId = (req) =>
  (req.user && (req.user.id || req.user.user_id)) ||
  req.query.userId ||
  req.headers['x-user-id'] ||
  (req.body && req.body.currentUserId) ||
  null;

const getNotifications = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    if (!currentUserId) {
      return res.status(400).json({ error: 'Current user ID is required.' });
    }

    const normalizedUser = String(currentUserId);

    // 1. Fetch received messages for current user
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('receiver_id', normalizedUser)
      .order('timestamp', { ascending: false })
      .limit(30);

    if (msgError) {
      console.error('Error fetching messages for notifications:', msgError.message);
    }

    // 2. Fetch transactions for current user (as requestor or provider)
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

    // 3. Collect all user IDs and service IDs to get names in one go
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
      const { data: srvData } = await supabase
        .from('services')
        .select('service_id, subcategory, service_category')
        .in('service_id', serviceIds);

      (srvData || []).forEach((s) => {
        servicesMap.set(Number(s.service_id), s.subcategory || s.service_category);
      });
    }

    // 4. Map message notifications
    const messageNotifications = (messages || []).map((msg) => {
      const notifId = `msg_${msg.message_id}`;
      const senderName =
        usersMap.get(String(msg.sender_id)) ||
        KNOWN_USERS[String(msg.sender_id)] ||
        msg.sender_id;

      const isRead = Boolean(msg.is_read) || readNotificationIds.has(notifId);

      return {
        id: notifId,
        type: 'message',
        title: `New message from ${senderName}`,
        description: msg.content,
        timestamp: msg.timestamp,
        read: isRead,
        link: `/messages/${msg.sender_id}`,
        target_id: msg.sender_id,
      };
    });

    // 5. Map transaction/booking notifications (only actionable events)
    const transactionNotifications = transactions.map((tx) => {
      const notifId = `tx_${tx.transaction_id}`;
      const isRead = readNotificationIds.has(notifId);
      const isProvider = String(tx.provider_id) === normalizedUser;
      const partnerId = isProvider ? tx.requestor_id : tx.provider_id;
      const partnerName =
        usersMap.get(String(partnerId)) ||
        KNOWN_USERS[String(partnerId)] ||
        partnerId;
      const serviceTitle = servicesMap.get(Number(tx.service_id)) || `Service #${tx.service_id}`;
      const status = tx.service_status || 'pending';
      const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);

      let title = '';
      let description = '';

      if (isProvider) {
        title = `New Booking Request: ${serviceTitle}`;
        description = `Booking from ${partnerName}. Total: ₱${Number(tx.total_topay || 0).toFixed(2)} (${formattedStatus})`;
      } else {
        title = `Booking ${formattedStatus}: ${serviceTitle}`;
        description = `Booking with ${partnerName}. Total: ₱${Number(tx.total_topay || 0).toFixed(2)}`;
      }

      return {
        id: notifId,
        type: 'transaction',
        title,
        description,
        timestamp: new Date().toISOString(), // Fallback if no created_at
        read: isRead,
        link: '/transactions',
        target_id: tx.transaction_id,
      };
    });

    // 6. Merge and sort
    const allNotifications = [
      ...messageNotifications,
      ...transactionNotifications,
    ].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return res.json({ notifications: allNotifications });
  } catch (err) {
    console.error('getNotifications error:', err);
    return res.status(500).json({ error: err.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    if (!currentUserId) {
      return res.status(400).json({ error: 'Current user ID is required.' });
    }

    const normalizedUser = String(currentUserId);

    // 1. Mark all received messages as read in Supabase
    const { error: msgErr } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', normalizedUser);

    if (msgErr) {
      console.error('Error marking messages as read in Supabase:', msgErr.message);
    }

    // 2. Fetch current notifications to mark their IDs as read in backend memory
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

    if (id.startsWith('msg_')) {
      const messageId = id.replace('msg_', '');
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('message_id', messageId);
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
};
