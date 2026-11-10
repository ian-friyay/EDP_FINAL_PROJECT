const { Server } = require('socket.io');
const supabase = require('./db');

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.auth && socket.handshake.auth.user_id;

    console.log(`Socket connected: ${socket.id} (user_id: ${userId || 'unknown'})`);

    if (userId) {
      socket.join(String(userId));
      console.log(`Socket ${socket.id} joined room ${userId}`);
    }

    socket.on('send_message', async (payload) => {
      try {
        const { sender_id, receiver_id, content } = payload || {};

        if (!sender_id || !receiver_id || !content || !String(content).trim()) {
          return socket.emit('message_error', {
            error: 'sender_id, receiver_id, and content are required.',
          });
        }

        const newMessage = {
          sender_id,
          receiver_id,
          content: String(content).trim(),
          timestamp: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('messages')
          .insert([newMessage])
          .select()
          .single();

        if (error) {
          return socket.emit('message_error', { error: error.message });
        }

        io.to(String(receiver_id)).emit('receive_message', data);
        socket.emit('message_sent', data);
      } catch (error) {
        socket.emit('message_error', { error: error.message });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

module.exports = { initSocket };
