import { create } from 'zustand';
import io from 'socket.io-client';
import { useAuthStore } from './authStore';

interface OnlineUser {
  userId: string;
  username: string;
  color: string;
  cursor?: { x: number; y: number };
  selectedNode?: string;
  editingNode?: string;
}

interface SocketState {
  socket: ReturnType<typeof io> | null;
  connected: boolean;
  mindmapId: string | null;
  onlineUsers: OnlineUser[];
  myColor: string;
  
  connect: (mindmapId: string) => void;
  disconnect: () => void;
  emitNodeUpdate: (nodeId: string, changes: Record<string, unknown>) => void;
  emitNodeCreate: (node: Record<string, unknown>) => void;
  emitNodeDelete: (nodeId: string) => void;
  emitRelationCreate: (relation: Record<string, unknown>) => void;
  emitRelationDelete: (relationId: string) => void;
  emitCursorMove: (cursor: { x: number; y: number }, nodeId?: string) => void;
  sendChatMessage: (content: string) => void;
}

const USER_COLORS = [
  '#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96',
  '#13c2c2', '#fa8c16', '#2f54eb', '#f5222d'
];

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connected: false,
  mindmapId: null,
  onlineUsers: [],
  myColor: '#1890ff',

  connect: (mindmapId: string) => {
    const { socket: existingSocket, mindmapId: existingMindmapId } = get();
    
    if (existingSocket && existingMindmapId === mindmapId) {
      return;
    }

    if (existingSocket) {
      existingSocket.disconnect();
    }

    const user = useAuthStore.getState().user;
    if (!user) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    const newSocket = io(socketUrl, {
      auth: { userId: user.id, username: user.username },
      transports: ['websocket'],
    });

    const colorIndex = Math.floor(Math.random() * USER_COLORS.length);
    const myColor = USER_COLORS[colorIndex];

    newSocket.on('connect', () => {
      set({ connected: true, myColor });
      newSocket.emit('join_mindmap', { mindmapId, userId: user.id, username: user.username });
    });

    newSocket.on('disconnect', () => {
      set({ connected: false });
    });

    newSocket.on('users_list', (users: OnlineUser[]) => {
      set({ onlineUsers: users });
    });

    newSocket.on('user_joined', (data: OnlineUser) => {
      set((state) => ({
        onlineUsers: state.onlineUsers.find(u => u.userId === data.userId)
          ? state.onlineUsers
          : [...state.onlineUsers, data],
      }));
    });

    newSocket.on('user_left', (data: { userId: string }) => {
      set((state) => ({
        onlineUsers: state.onlineUsers.filter(u => u.userId !== data.userId),
      }));
    });

    newSocket.on('user_cursor', (data: { userId: string; cursor: { x: number; y: number } }) => {
      set((state) => ({
        onlineUsers: state.onlineUsers.map(u =>
          u.userId === data.userId ? { ...u, cursor: data.cursor } : u
        ),
      }));
    });

    newSocket.on('node_updated', (data: { nodeId: string; changes: Record<string, unknown> }) => {
      const { onNodeUpdate } = get() as any;
      if (onNodeUpdate) {
        onNodeUpdate(data.nodeId, data.changes);
      }
    });

    newSocket.on('node_created', (data: { node: Record<string, unknown> }) => {
      const { onNodeCreate } = get() as any;
      if (onNodeCreate) {
        onNodeCreate(data.node);
      }
    });

    newSocket.on('node_deleted', (data: { nodeId: string }) => {
      const { onNodeDelete } = get() as any;
      if (onNodeDelete) {
        onNodeDelete(data.nodeId);
      }
    });

    newSocket.on('relation_created', (data: { relation: Record<string, unknown> }) => {
      const { onRelationCreate } = get() as any;
      if (onRelationCreate) {
        onRelationCreate(data.relation);
      }
    });

    newSocket.on('relation_deleted', (data: { relationId: string }) => {
      const { onRelationDelete } = get() as any;
      if (onRelationDelete) {
        onRelationDelete(data.relationId);
      }
    });

    set({ socket: newSocket, mindmapId });
  },

  disconnect: () => {
    const { socket, mindmapId } = get();
    if (socket) {
      if (mindmapId) {
        socket.emit('leave_mindmap', { mindmapId });
      }
      socket.disconnect();
    }
    set({ socket: null, connected: false, mindmapId: null, onlineUsers: [] });
  },

  emitNodeUpdate: (nodeId: string, changes: Record<string, unknown>) => {
    const { socket, mindmapId } = get();
    if (socket && mindmapId) {
      socket.emit('node_update', { nodeId, changes });
    }
  },

  emitNodeCreate: (node: Record<string, unknown>) => {
    const { socket, mindmapId } = get();
    if (socket && mindmapId) {
      socket.emit('node_create', node);
    }
  },

  emitNodeDelete: (nodeId: string) => {
    const { socket, mindmapId } = get();
    if (socket && mindmapId) {
      socket.emit('node_delete', { nodeId });
    }
  },

  emitRelationCreate: (relation: Record<string, unknown>) => {
    const { socket, mindmapId } = get();
    if (socket && mindmapId) {
      socket.emit('relation_create', relation);
    }
  },

  emitRelationDelete: (relationId: string) => {
    const { socket, mindmapId } = get();
    if (socket && mindmapId) {
      socket.emit('relation_delete', { relationId });
    }
  },

  emitCursorMove: (cursor: { x: number; y: number }, nodeId?: string) => {
    const { socket, mindmapId } = get();
    if (socket && mindmapId) {
      socket.emit('cursor_move', { cursor, nodeId });
    }
  },

  sendChatMessage: (content: string) => {
    const { socket, mindmapId } = get();
    const user = useAuthStore.getState().user;
    if (socket && mindmapId && user) {
      socket.emit('chat_message', {
        mindmapId,
        userId: user.id,
        username: user.username,
        content,
      });
    }
  },
}));