const { Server } = require('socket.io');
const supabase = require('../supabaseClient');
const { ensureUserExists } = require('../controllers/messageController');

const userSockets = new Map();

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    const registerUser = (userId) => {
      if (!userId) {
        return;
      }

      const normalizedUserId = String(userId);

      userSockets.set(normalizedUserId, socket.id);
      socket.join(normalizedUserId);
      socket.userId = normalizedUserId;

      socket.emit('registered', { user_id: normalizedUserId });
      console.log(`Socket ${socket.id} registered as ${normalizedUserId}`);
    };

    const authUserId =
      socket.handshake.auth && socket.handshake.auth.user_id;

    if (authUserId) {
      registerUser(authUserId);
    }

    socket.on('register', registerUser);

    socket.on('send_message', async (payload) => {
      try {
        const { sender_id: senderId, receiver_id: receiverId, content } =
          payload || {};

        if (
          !senderId ||
          !receiverId ||
          !content ||
          !String(content).trim()
        ) {
          return socket.emit('message_error', {
            error: 'sender_id, receiver_id, and content are required.',
          });
        }

        await Promise.all([
          ensureUserExists(senderId),
          ensureUserExists(receiverId),
        ]);

        const newMessage = {
          sender_id: String(senderId),
          receiver_id: String(receiverId),
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
          return socket.emit('message_error', { error: error.message });
        }

        const KNOWN_USERS = {
          'MMC-0001': 'Jasmine Requestor',
          'MMC-1042': 'Juan Dela Cruz',
          'MMC-2015': 'Maria Santos',
          'MMC-3044': 'Pedro Penduko',
          'MMC-3045': 'Adrian Friday',
          'MMC-3046': 'Keizy Lara',
        };

        const senderDisplayName =
          KNOWN_USERS[String(senderId)] || String(senderId);

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

        // Emit to room (all connected sockets for this user)
        io.to(String(receiverId)).emit('receive_message', data);
        io.to(String(receiverId)).emit('new_notification', notifPayload);

        // Also emit directly to mapped socket if tracked
        const receiverSocketId = userSockets.get(String(receiverId));
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', data);
          io.to(receiverSocketId).emit('new_notification', notifPayload);
        }

        socket.emit('message_sent', data);
      } catch (error) {
        socket.emit('message_error', { error: error.message });
      }
    });

    socket.on('disconnect', (reason) => {
      if (socket.userId && userSockets.get(socket.userId) === socket.id) {
        userSockets.delete(socket.userId);
      }

      console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

module.exports = { initSocket };
