const { Server } = require('socket.io');
const supabase = require('../supabaseClient');

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

        const receiverSocketId = userSockets.get(String(receiverId));

        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', data);
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
