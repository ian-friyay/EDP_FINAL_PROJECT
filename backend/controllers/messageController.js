const supabase = require('../supabaseClient');

const getCurrentUserId = (req) =>
  (req.user && (req.user.id || req.user.user_id)) ||
  req.query.userId ||
  req.headers['x-user-id'] ||
  (req.body && req.body.currentUserId) ||
  null;

const getDisplayName = (user, fallbackId) => {
  if (!user) {
    return fallbackId;
  }

  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || user.name || user.username || fallbackId;
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

        return {
          ...conversation,
          name: getDisplayName(user, partnerId),
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

module.exports = {
  getConversations,
  markAsRead,
};
