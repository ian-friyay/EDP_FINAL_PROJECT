const supabase = require('../supabaseClient');

const getCurrentUserId = (req) =>
  (req.user && (req.user.id || req.user.user_id)) ||
  req.query.userId ||
  req.headers['x-user-id'] ||
  (req.body && (req.body.currentUserId || req.body.sender_id || req.body.senderId)) ||
  null;

const ensureUserExists = async (userId, fallbackName) => {
  if (!userId) return;
  const normalizedId = String(userId);
  try {
    const { data: existing } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', normalizedId)
      .maybeSingle();

    if (!existing) {
      await supabase.from('users').insert([
        {
          user_id: normalizedId,
          first_name: fallbackName || normalizedId,
          last_name: '',
          username:
            normalizedId.toLowerCase().replace(/[^a-z0-9]/g, '') ||
            `user${Date.now()}`,
          email: `${normalizedId.toLowerCase()}@serbisyou.ph`,
          contact_number: '09000000000',
          password: 'password123',
          user_type: 'Requestor',
          is_active: true,
        },
      ]);
    }
  } catch (err) {
    console.error('Error ensuring user exists:', err.message);
  }
};

const getDisplayName = (user, fallbackId) => {
  if (user) {
    const fullName = [user.first_name, user.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (fullName) return fullName;
    if (user.name) return user.name;
    if (user.username) return user.username;
  }

  const KNOWN_USERS = {
    'MMC-0001': 'Jasmine Requestor',
    'MMC-1042': 'Juan Dela Cruz',
    'MMC-2015': 'Maria Santos',
    'MMC-3044': 'Pedro Penduko',
    'MMC-3045': 'Adrian Friday',
    'MMC-3046': 'Keizy Lara',
  };

  if (KNOWN_USERS[fallbackId]) {
    return KNOWN_USERS[fallbackId];
  }

  return fallbackId;
};

const getConversations = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);

    if (!currentUserId) {
      return res.status(400).json({
        error: 'A current user id is required.',
      });
    }

    const normalizedUserId = String(currentUserId);

    const [
      { data: sentMessages, error: sentError },
      { data: receivedMessages, error: receivedError },
    ] = await Promise.all([
      supabase
        .from('messages')
        .select('*')
        .eq('sender_id', normalizedUserId)
        .order('timestamp', { ascending: false }),
      supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', normalizedUserId)
        .order('timestamp', { ascending: false }),
    ]);

    if (sentError) {
      return res.status(500).json({ error: sentError.message });
    }

    if (receivedError) {
      return res.status(500).json({ error: receivedError.message });
    }

    const messages = [...(sentMessages || []), ...(receivedMessages || [])].sort(
      (first, second) =>
        new Date(second.timestamp).getTime() -
        new Date(first.timestamp).getTime()
    );

    const conversationMap = new Map();

    messages.forEach((message) => {
      const partnerId =
        message.sender_id === normalizedUserId
          ? message.receiver_id
          : message.sender_id;

      if (!partnerId) {
        return;
      }

      const isUnread =
        message.receiver_id === normalizedUserId && !message.is_read;
      const existingConversation = conversationMap.get(partnerId);

      if (!existingConversation) {
        conversationMap.set(partnerId, {
          id: partnerId,
          lastMessage: message.content || '',
          timestamp: message.timestamp,
          isUnread,
        });
      } else if (isUnread) {
        existingConversation.isUnread = true;
      }
    });

    const partnerIds = [...conversationMap.keys()];
    const usersById = new Map();

    if (partnerIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .in('user_id', partnerIds);

      if (usersError) {
        return res.status(500).json({ error: usersError.message });
      }

      (users || []).forEach((user) => {
        usersById.set(String(user.user_id), user);
      });
    }

    const conversations = partnerIds
      .map((partnerId) => {
        const conversation = conversationMap.get(partnerId);
        const user = usersById.get(String(partnerId));

        const displayName = getDisplayName(user, partnerId);
        const firstName = user?.first_name || displayName.split(' ')[0] || displayName;
        const lastName = user?.last_name || displayName.split(' ').slice(1).join(' ') || '';

        return {
          ...conversation,
          name: displayName,
          first_name: firstName,
          last_name: lastName,
          profile_picture: (user && user.profile_picture) || null,
          avatar:
            (user &&
              (user.profile_picture || user.avatar || user.profile_picture_url)) ||
            null,
        };
      })
      .sort(
        (first, second) =>
          new Date(second.timestamp).getTime() -
          new Date(first.timestamp).getTime()
      );

    return res.json({ conversations });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const partnerId = req.params.userId;

    if (!currentUserId || !partnerId) {
      return res.status(400).json({
        error: 'Current user id and conversation user id are required.',
      });
    }

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', String(partnerId))
      .eq('receiver_id', String(currentUserId));

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getMessagesWithUser = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const partnerId = req.params.userId;

    if (!currentUserId || !partnerId) {
      return res.status(400).json({
        error: 'Current user id and partner user id are required.',
      });
    }

    const normalizedCurrent = String(currentUserId);
    const normalizedPartner = String(partnerId);

    const [
      { data: sent, error: sentErr },
      { data: received, error: recvErr },
    ] = await Promise.all([
      supabase
        .from('messages')
        .select('*')
        .eq('sender_id', normalizedCurrent)
        .eq('receiver_id', normalizedPartner),
      supabase
        .from('messages')
        .select('*')
        .eq('sender_id', normalizedPartner)
        .eq('receiver_id', normalizedCurrent),
    ]);

    if (sentErr) return res.status(500).json({ error: sentErr.message });
    if (recvErr) return res.status(500).json({ error: recvErr.message });

    const messages = [...(sent || []), ...(received || [])].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return res.json({ messages });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const senderId =
      getCurrentUserId(req) || req.body.sender_id || req.body.senderId;
    const { receiver_id, receiverId, content, receiver_name } = req.body;
    const targetReceiverId = receiver_id || receiverId;

    if (
      !senderId ||
      !targetReceiverId ||
      !content ||
      !String(content).trim()
    ) {
      return res.status(400).json({
        error: 'sender_id, receiver_id, and content are required.',
      });
    }

    await Promise.all([
      ensureUserExists(senderId),
      ensureUserExists(targetReceiverId, receiver_name),
    ]);

    const newMessage = {
      sender_id: String(senderId),
      receiver_id: String(targetReceiverId),
      content: String(content).trim(),
      timestamp: new Date().toISOString(),
      is_read: false,
    };

    const { data, error } = await supabase
      .from('messages')
      .insert([newMessage])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    try {
      const io = req.app && req.app.get('io');
      if (io) {
        const senderDisplayName =
          (KNOWN_USERS && KNOWN_USERS[String(senderId)]) || String(senderId);

        const notifPayload = {
          id: `msg_${data.message_id}`,
          type: 'message',
          title: `New message from ${senderDisplayName}`,
          description: data.content,
          timestamp: data.timestamp,
          read: false,
          link: `/messages/${senderId}`,
          target_id: senderId,
        };

        io.to(String(targetReceiverId)).emit('receive_message', data);
        io.to(String(targetReceiverId)).emit('new_notification', notifPayload);
      }
    } catch (socketErr) {
      console.error('Socket emission error in sendMessage:', socketErr.message);
    }

    return res.status(201).json({ success: true, message: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getConversations,
  getMessagesWithUser,
  sendMessage,
  markAsRead,
  ensureUserExists,
};
