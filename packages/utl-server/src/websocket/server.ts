import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'utl-secret-key';

interface ConnectedUser {
  userId: string;
  username: string;
  color: string;
  mindmapId?: string;
  branchId?: string;
  cursor?: { x: number; y: number };
  selectedNode?: string;
  editingNode?: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  mindmapId: string;
}

const connectedUsers = new Map<string, ConnectedUser>();
const chatHistory = new Map<string, ChatMessage[]>();
const editLocks = new Map<string, { nodeId: string; userId: string; field: string; acquiredAt: Date }>();

const USER_COLORS = [
  '#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', 
  '#13c2c2', '#fa8c16', '#2f54eb', '#f5222d'
];

function getUserColor(userId: string): string {
  const index = connectedUsers.size % USER_COLORS.length;
  return USER_COLORS[index];
}

export function initWebSocket(io: Server) {
  io.use((socket, next) => {
    const auth = socket.handshake.auth;
    
    if (!auth.userId || !auth.username) {
      return next(new Error('Authentication required'));
    }

    (socket as any).userId = auth.userId;
    (socket as any).username = auth.username;
    next();
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId;
    const username = (socket as any).username;
    const color = getUserColor(userId);

    connectedUsers.set(socket.id, { userId, username, color });

    socket.emit('connected', { message: 'Connected to UTL collaboration server', color });

    socket.on('join_mindmap', (data: { mindmapId: string; userId: string; username: string }) => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        user.mindmapId = data.mindmapId;
        user.branchId = 'main';
      }

      socket.join(`mindmap:${data.mindmapId}`);

      const roomUsers = Array.from(connectedUsers.values())
        .filter((u) => u.mindmapId === data.mindmapId)
        .map(u => ({
          userId: u.userId,
          username: u.username,
          color: u.color,
          cursor: u.cursor,
          selectedNode: u.selectedNode,
          editingNode: u.editingNode,
          joinedAt: new Date(),
        }));

      socket.emit('users_list', roomUsers);

      socket.to(`mindmap:${data.mindmapId}`).emit('user_joined', {
        userId,
        username,
        color,
        joinedAt: new Date(),
      });

      const history = chatHistory.get(data.mindmapId) || [];
      socket.emit('chat_history', history.slice(-50));
    });

    socket.on('leave_mindmap', (data: { mindmapId: string }) => {
      const user = connectedUsers.get(socket.id);
      if (user?.mindmapId) {
        socket.leave(`mindmap:${user.mindmapId}`);
        socket.to(`mindmap:${user.mindmapId}`).emit('user_left', { userId });
        user.mindmapId = undefined;
        user.branchId = undefined;
      }
    });

    socket.on('cursor_move', (data: { cursor: { x: number; y: number }; nodeId?: string }) => {
      const user = connectedUsers.get(socket.id);
      if (user?.mindmapId) {
        user.cursor = data.cursor;
        user.selectedNode = data.nodeId;
        socket.to(`mindmap:${user.mindmapId}`).emit('user_cursor', { userId, cursor: data.cursor });
      }
    });

    socket.on('node_select', (data: { nodeId: string }) => {
      const user = connectedUsers.get(socket.id);
      if (user?.mindmapId) {
        user.selectedNode = data.nodeId;
        socket.to(`mindmap:${user.mindmapId}`).emit('user_selecting', { userId, nodeId: data.nodeId });
      }
    });

    socket.on('node_edit_start', (data: { nodeId: string; field: string }) => {
      const user = connectedUsers.get(socket.id);
      if (user?.mindmapId) {
        const lockKey = `${user.mindmapId}:${data.nodeId}:${data.field}`;
        const existingLock = editLocks.get(lockKey);
        
        if (existingLock && existingLock.userId !== userId) {
          socket.emit('edit_locked', { nodeId: data.nodeId, field: data.field, by: existingLock.userId });
          return;
        }
        
        editLocks.set(lockKey, { nodeId: data.nodeId, userId, field: data.field, acquiredAt: new Date() });
        user.editingNode = data.nodeId;
        
        socket.to(`mindmap:${user.mindmapId}`).emit('user_editing', { userId, nodeId: data.nodeId, field: data.field });
      }
    });

    socket.on('node_edit_end', (data: { nodeId: string }) => {
      const user = connectedUsers.get(socket.id);
      if (user?.mindmapId) {
        const lockKey = `${user.mindmapId}:${data.nodeId}`;
        for (const [key, lock] of editLocks) {
          if (key.startsWith(lockKey) && lock.userId === userId) {
            editLocks.delete(key);
          }
        }
        user.editingNode = undefined;
        socket.to(`mindmap:${user.mindmapId}`).emit('edit_unlocked', { nodeId: data.nodeId, userId });
      }
    });

    socket.on('node_update', (data: { nodeId: string; changes: Record<string, unknown> }) => {
      const user = connectedUsers.get(socket.id);
      if (user?.mindmapId) {
        socket.to(`mindmap:${user.mindmapId}`).emit('node_updated', { nodeId: data.nodeId, changes: data.changes, by: userId });
      }
    });

    socket.on('node_create', (data: Record<string, unknown>) => {
      const user = connectedUsers.get(socket.id);
      if (user?.mindmapId) {
        socket.to(`mindmap:${user.mindmapId}`).emit('node_created', { node: data, by: userId });
      }
    });

    socket.on('node_delete', (data: { nodeId: string }) => {
      const user = connectedUsers.get(socket.id);
      if (user?.mindmapId) {
        socket.to(`mindmap:${user.mindmapId}`).emit('node_deleted', { nodeId: data.nodeId, by: userId });
      }
    });

    socket.on('relation_create', (data: Record<string, unknown>) => {
      const user = connectedUsers.get(socket.id);
      if (user?.mindmapId) {
        socket.to(`mindmap:${user.mindmapId}`).emit('relation_created', { relation: data, by: userId });
      }
    });

    socket.on('relation_delete', (data: { relationId: string }) => {
      const user = connectedUsers.get(socket.id);
      if (user?.mindmapId) {
        socket.to(`mindmap:${user.mindmapId}`).emit('relation_deleted', { relationId: data.relationId, by: userId });
      }
    });

    socket.on('branch_checkout', (data: { mindmapId: string; branchId: string; snapshot: { nodes: any[]; relations: any[] } }) => {
      const user = connectedUsers.get(socket.id);
      if (user?.mindmapId === data.mindmapId) {
        user.branchId = data.branchId;
        socket.to(`mindmap:${data.mindmapId}`).emit('branch_changed', {
          by: userId,
          branchId: data.branchId,
          snapshot: data.snapshot,
        });
      }
    });

    socket.on('chat_message', (data: { mindmapId: string; userId: string; username: string; content: string }) => {
      const message: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        userId: data.userId,
        username: data.username,
        content: data.content,
        timestamp: new Date(),
        mindmapId: data.mindmapId,
      };

      const history = chatHistory.get(data.mindmapId) || [];
      history.push(message);
      if (history.length > 100) history.shift();
      chatHistory.set(data.mindmapId, history);

      io.to(`mindmap:${data.mindmapId}`).emit('chat_message', message);
    });

    socket.on('disconnect', () => {
      const user = connectedUsers.get(socket.id);
      if (user?.mindmapId) {
        socket.to(`mindmap:${user.mindmapId}`).emit('user_left', { userId });
        
        for (const [key, lock] of editLocks) {
          if (lock.userId === userId) {
            editLocks.delete(key);
            socket.to(`mindmap:${user.mindmapId}`).emit('edit_unlocked', { nodeId: lock.nodeId, userId });
          }
        }
      }
      connectedUsers.delete(socket.id);
    });
  });
}