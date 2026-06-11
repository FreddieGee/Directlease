import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { verifyToken } from '@/lib/jwt';

let io: SocketIOServer | null = null;

export function getSocketIO(httpServer?: HTTPServer): SocketIOServer | null {
  if (io) return io;

  if (httpServer) {
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/api/socketio',
    });

    io.use(async (socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      try {
        const payload = await verifyToken(token as string);
        (socket as any).user = payload;
        next();
      } catch (err) {
        next(new Error('Invalid token'));
      }
    });

    io.on('connection', (socket) => {
      const user = (socket as any).user;
      console.log(`Socket connected: ${user.email} (${user.userId})`);

      // Join user to their own room (for private messages)
      socket.join(`user:${user.userId}`);

      // Join a conversation room
      socket.on('join:conversation', (data: { propertyId: string; otherUserId: string }) => {
        const room = `property:${data.propertyId}:${[user.userId, data.otherUserId].sort().join(':')}`;
        socket.join(room);
        console.log(`User ${user.userId} joined room ${room}`);
      });

      // Leave a conversation room
      socket.on('leave:conversation', (data: { propertyId: string; otherUserId: string }) => {
        const room = `property:${data.propertyId}:${[user.userId, data.otherUserId].sort().join(':')}`;
        socket.leave(room);
      });

      // Send a message
      socket.on('chat:send', async (data: { propertyId: string; receiverId: string; message: string }) => {
        try {
          const { Pool } = await import('pg');
          const pool = new Pool({ connectionString: process.env.DATABASE_URL });
          
          const result = await pool.query(
            `INSERT INTO chat_messages (sender_id, receiver_id, property_id, message)
             VALUES ($1, $2, $3, $4)
             RETURNING id, sender_id, receiver_id, property_id, message, is_read, created_at`,
            [user.userId, data.receiverId, data.propertyId, data.message]
          );

          const message = result.rows[0];
          const room = `property:${data.propertyId}:${[user.userId, data.receiverId].sort().join(':')}`;
          
          // Emit to the conversation room
          io?.to(room).emit('chat:message', message);
          
          // Also emit notification to the receiver's personal room
          io?.to(`user:${data.receiverId}`).emit('chat:notification', {
            message: data.message.substring(0, 100),
            senderId: user.userId,
            propertyId: data.propertyId,
          });
        } catch (error) {
          console.error('Socket message error:', error);
          socket.emit('chat:error', { error: 'Failed to send message' });
        }
      });

      // Mark messages as read
      socket.on('chat:read', async (data: { propertyId: string; senderId: string }) => {
        try {
          const { Pool } = await import('pg');
          const pool = new Pool({ connectionString: process.env.DATABASE_URL });
          
          await pool.query(
            `UPDATE chat_messages SET is_read = TRUE
             WHERE property_id = $1 AND sender_id = $2 AND receiver_id = $3 AND is_read = FALSE`,
            [data.propertyId, data.senderId, user.userId]
          );

          const room = `property:${data.propertyId}:${[user.userId, data.senderId].sort().join(':')}`;
          io?.to(room).emit('chat:read-receipt', {
            readBy: user.userId,
            propertyId: data.propertyId,
          });
        } catch (error) {
          console.error('Socket read error:', error);
        }
      });

      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${user.email}`);
      });
    });

    return io;
  }

  return null;
}

export { SocketIOServer };