# Phase 3: 实时协作

## 目标

实现多用户实时协作编辑，WebSocket通信，编辑锁，光标同步，冲突检测与处理。

---

## 前置依赖

- Phase 1完成（后端API、前端脑图渲染）
- Phase 2完成（UTL双向同步）

---

## 任务分解

### 3.1 WebSocket服务端

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 3.1.1 | Socket.io服务器初始化 | ws/server.ts | P0 | 2h |
| 3.1.2 | 认证中间件 | ws/middleware/auth.ts | P0 | 1h |
| 3.1.3 | 心跳检测 | heartbeat机制 | P1 | 1h |
| 3.1.4 | 连接管理 | connectionManager.ts | P0 | 2h |
| 3.1.5 | 房间管理（按脑图+分支） | roomManager.ts | P0 | 2h |

**产出物**:
```typescript
// websocket/server.ts
export class WSServer {
  private io: Server;
  private connectionManager: ConnectionManager;
  private roomManager: RoomManager;
  
  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: { origin: CLIENT_URL }
    });
    
    this.setupMiddleware();
    this.setupHandlers();
  }
  
  private setupMiddleware() {
    // JWT认证
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      const user = verifyJWT(token);
      
      if (!user) {
        return next(new Error('未授权'));
      }
      
      socket.data.user = user;
      next();
    });
  }
  
  private setupHandlers() {
    this.io.on('connection', (socket) => {
      socket.on('join_mindmap', this.handleJoinMindmap);
      socket.on('leave_mindmap', this.handleLeaveMindmap);
      socket.on('cursor_move', this.handleCursorMove);
      socket.on('node_select', this.handleNodeSelect);
      socket.on('node_edit_start', this.handleEditStart);
      socket.on('node_edit_end', this.handleEditEnd);
      socket.on('node_create', this.handleNodeCreate);
      socket.on('node_update', this.handleNodeUpdate);
      socket.on('node_delete', this.handleNodeDelete);
      socket.on('branch_switch', this.handleBranchSwitch);
      socket.on('chat_message', this.handleChat);
      
      socket.on('disconnect', this.handleDisconnect);
    });
  }
}

// 房间命名规则: mindmap:{mindmapId}:branch:{branchId}
// 例: mindmap:abc123:branch:main
```

---

### 3.2 协作状态管理

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 3.2.1 | 协作会话数据模型 | CollaborationSession, Participant | P0 | 1h |
| 3.2.2 | 在线用户追踪 | onlineUsers.ts | P0 | 2h |
| 3.2.3 | 用户颜色分配 | colorAllocator.ts | P0 | 1h |
| 3.2.4 | 光标状态管理 | cursorState.ts | P0 | 2h |
| 3.2.5 | 选择状态管理 | selectionState.ts | P0 | 1h |
| 3.2.6 | 参与者持久化 | participantPersistence.ts | P1 | 1h |

**产出物**:
```typescript
// 在线用户状态
interface OnlineUser {
  id: string;
  username: string;
  color: string;       // 用户标识颜色
  avatar?: string;
  cursor?: Position;   // 光标位置
  selectedNode?: string;
  editingNode?: string;
  editingField?: string;
}

// 房间状态（按脑图+分支）
interface RoomState {
  mindmapId: string;
  branchId: string;
  participants: Map<string, OnlineUser>;
  editLocks: Map<string, EditLock>;  // nodeId -> lock
  operations: Operation[];           // 操作历史（用于同步）
}

// 用户颜色分配
const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
];

function allocateColor(room: RoomState): string {
  const usedColors = room.participants.values().map(p => p.color);
  const available = COLORS.filter(c => !usedColors.includes(c));
  return available[0] || COLORS[Math.floor(Math.random() * COLORS.length)];
}
```

---

### 3.3 编辑锁机制

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 3.3.1 | 编辑锁数据模型 | EditLock | P0 | 1h |
| 3.3.2 | 锁获取逻辑 | acquireLock() | P0 | 2h |
| 3.3.3 | 锁释放逻辑 | releaseLock() | P0 | 1h |
| 3.3.4 | 锁超时自动释放 | lockTimeout.ts | P0 | 1h |
| 3.3.5 | 锁冲突提示 | lockConflict.ts | P0 | 1h |
| 3.3.6 | Redis锁存储 | redisLockStore.ts | P1 | 2h |

**产出物**:
```typescript
// 编辑锁
interface EditLock {
  nodeId: string;
  userId: string;
  field: string;        // 正在编辑的字段（name, description, metadata等）
  acquiredAt: Date;
  expiresAt: Date;      // 30秒超时
}

// 锁管理器
export class LockManager {
  private locks: Map<string, EditLock> = new Map();
  private redis: RedisClient;
  
  // 获取锁
  async acquireLock(
    nodeId: string,
    userId: string,
    field: string
  ): AcquireResult {
    const key = `lock:${nodeId}:${field}`;
    const existing = this.locks.get(key);
    
    // 检查是否存在锁
    if (existing) {
      // 检查是否过期
      if (existing.expiresAt < new Date()) {
        this.releaseLock(nodeId, field);
      } else if (existing.userId !== userId) {
        // 被其他用户锁定
        return {
          success: false,
          lockedBy: existing.userId,
          expiresAt: existing.expiresAt
        };
      }
    }
    
    // 创建新锁（30秒超时）
    const lock: EditLock = {
      nodeId,
      userId,
      field,
      acquiredAt: new Date(),
      expiresAt: new Date(Date.now() + 30000)
    };
    
    this.locks.set(key, lock);
    await this.redis.setex(key, 30, JSON.stringify(lock));
    
    return { success: true, lock };
  }
  
  // 释放锁
  async releaseLock(nodeId: string, field: string): void {
    const key = `lock:${nodeId}:${field}`;
    this.locks.delete(key);
    await this.redis.del(key);
  }
  
  // 续期锁（编辑过程中）
  async renewLock(nodeId: string, userId: string, field: string): boolean {
    const key = `lock:${nodeId}:${field}`;
    const lock = this.locks.get(key);
    
    if (!lock || lock.userId !== userId) {
      return false;
    }
    
    lock.expiresAt = new Date(Date.now() + 30000);
    await this.redis.setex(key, 30, JSON.stringify(lock));
    
    return true;
  }
}
```

---

### 3.4 操作广播与同步

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 3.4.1 | 操作事件定义 | OperationEvents | P0 | 1h |
| 3.4.2 | 操作广播逻辑 | broadcastOperation() | P0 | 2h |
| 3.4.3 | 新用户同步 | syncNewUser() | P0 | 2h |
| 3.4.4 | 操作历史维护 | operationHistory.ts | P1 | 2h |
| 3.4.5 | 操作确认机制 | operationAck.ts | P1 | 1h |

**产出物**:
```typescript
// 操作事件类型
type OperationEvent = 
  | { type: 'node_created'; node: Node; by: string }
  | { type: 'node_updated'; nodeId: string; changes: Partial<Node>; by: string }
  | { type: 'node_deleted'; nodeId: string; by: string }
  | { type: 'relation_created'; relation: Relation; by: string }
  | { type: 'relation_deleted'; relationId: string; by: string }
  | { type: 'version_created'; version: Version; by: string }
  | { type: 'branch_switched'; branchId: string; by: string };

// 广播操作
function broadcastOperation(
  io: Server,
  room: string,
  event: OperationEvent
): void {
  // 广播给房间内所有用户（排除发起者）
  io.to(room).except(event.by).emit(event.type, event);
  
  // 记录操作历史（用于新用户同步）
  operationHistory.push(room, event);
}

// 新用户加入时同步
async function syncNewUser(
  socket: Socket,
  room: string
): void {
  // 获取当前脑图状态
  const state = await getMindmapState(room);
  
  // 发送完整状态
  socket.emit('sync_state', {
    mindmap: state.mindmap,
    nodes: state.nodes,
    relations: state.relations,
    onlineUsers: getOnlineUsers(room),
    editLocks: getActiveLocks(room)
  });
  
  // 发送最近操作历史（可选，用于理解上下文）
  const recentOps = operationHistory.getRecent(room, 20);
  socket.emit('recent_operations', recentOps);
}
```

---

### 3.5 冲突检测与处理

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 3.5.1 | 冲突类型定义 | ConflictType | P0 | 1h |
| 3.5.2 | 编辑冲突检测 | detectEditConflict() | P0 | 2h |
| 3.5.3 | 删除冲突检测 | detectDeleteConflict() | P0 | 1h |
| 3.5.4 | 操作转换（OT） | operationalTransform.ts | P1 | 4h |
| 3.5.5 | 冲突提示生成 | conflictAlert.ts | P0 | 1h |
| 3.5.6 | 冲突记录 | conflictLog.ts | P1 | 1h |

**产出物**:
```typescript
// 冲突类型
interface Conflict {
  id: string;
  type: 'edit_collision' | 'delete_collision' | 'move_collision';
  nodeId: string;
  operations: Operation[];
  detectedAt: Date;
}

// 冲突检测
function detectConflict(
  incomingOp: Operation,
  pendingOps: Operation[]
): Conflict | null {
  // 检查是否有针对同一节点的操作
  const conflictingOps = pendingOps.filter(op => 
    op.nodeId === incomingOp.nodeId &&
    op.timestamp > incomingOp.timestamp - 1000  // 1秒内的操作
  );
  
  if (conflictingOps.length === 0) {
    return null;
  }
  
  // 检测冲突类型
  if (incomingOp.type === 'delete') {
    // 删除冲突：其他用户正在编辑被删除的节点
    const editOps = conflictingOps.filter(op => op.type === 'update');
    if (editOps.length > 0) {
      return {
        id: generateId(),
        type: 'delete_collision',
        nodeId: incomingOp.nodeId,
        operations: [incomingOp, ...editOps],
        detectedAt: new Date()
      };
    }
  }
  
  if (incomingOp.type === 'update') {
    // 编辑冲突：多个用户同时更新同一字段
    const sameFieldOps = conflictingOps.filter(op =>
      op.type === 'update' &&
      Object.keys(op.changes).some(k => k in incomingOp.changes)
    );
    if (sameFieldOps.length > 0) {
      return {
        id: generateId(),
        type: 'edit_collision',
        nodeId: incomingOp.nodeId,
        operations: [incomingOp, ...sameFieldOps],
        detectedAt: new Date()
      };
    }
  }
  
  return null;
}

// 简化OT（操作转换）
function transformOperation(
  original: Operation,
  incoming: Operation
): Operation {
  // 简化策略：后提交者优先（Last-Write-Wins）
  // 对于并发编辑同一字段，取最新值
  
  if (original.type === 'update' && incoming.type === 'update') {
    // 合并不同字段的更新
    const mergedChanges = { ...original.changes };
    
    for (const [key, value] of Object.entries(incoming.changes)) {
      if (!(key in mergedChanges)) {
        mergedChanges[key] = value;
      }
      // 同一字段冲突，取incoming的值（后提交）
    }
    
    return { ...incoming, changes: mergedChanges };
  }
  
  return incoming;
}
```

---

### 3.6 前端协作组件

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 3.6.1 | Socket.io客户端集成 | websocket.ts | P0 | 2h |
| 3.6.2 | 协作状态Store | collaborationStore.ts | P0 | 3h |
| 3.6.3 | 用户光标渲染 | UserCursors.tsx | P0 | 3h |
| 3.6.4 | 用户头像显示 | UserAvatar.tsx | P0 | 1h |
| 3.6.5 | 在线用户列表 | OnlineUsersList.tsx | P0 | 2h |
| 3.6.6 | 编辑锁提示 | LockIndicator.tsx | P0 | 2h |
| 3.6.7 | 冲突提示组件 | ConflictAlert.tsx | P0 | 2h |
| 3.6.8 | 协作聊天面板 | CollaborationChat.tsx | P1 | 3h |
| 3.6.9 | 同步状态指示 | SyncStatusIndicator.tsx | P0 | 1h |

**产出物**:
```typescript
// stores/collaborationStore.ts
interface CollaborationStore {
  // 连接状态
  connected: boolean;
  socket: Socket | null;
  
  // 房间信息
  currentRoom: string | null;
  
  // 在线用户
  onlineUsers: OnlineUser[];
  myColor: string;
  
  // 光标位置
  userCursors: Map<string, Position>;
  
  // 编辑锁
  editLocks: Map<string, EditLock>;
  
  // 同步状态
  syncStatus: 'synced' | 'syncing' | 'offline' | 'conflict';
  
  // 冲突
  conflicts: Conflict[];
  
  // 聊天消息
  chatMessages: ChatMessage[];
  
  // 操作
  connect: (token: string) => void;
  disconnect: () => void;
  joinMindmap: (mindmapId: string, branchId: string) => void;
  leaveMindmap: () => void;
  moveCursor: (position: Position) => void;
  selectNode: (nodeId: string) => void;
  startEdit: (nodeId: string, field: string) => boolean;
  endEdit: (nodeId: string) => void;
  broadcastChange: (change: Change) => void;
  sendChat: (content: string) => void;
  resolveConflict: (conflictId: string, resolution: string) => void;
}

// 使用示例
const useCollaboration = () => {
  const store = useCollaborationStore();
  
  // 发送光标位置
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const position = canvasToMindmapCoords(e.clientX, e.clientY);
      store.moveCursor(position);
    };
    
    canvas.addEventListener('mousemove', handler);
    return () => canvas.removeEventListener('mousemove', handler);
  }, []);
  
  // 尝试锁定节点编辑
  const handleEditStart = (nodeId: string, field: string) => {
    const success = store.startEdit(nodeId, field);
    if (!success) {
      // 显示锁定提示
      const lock = store.editLocks.get(`${nodeId}:${field}`);
      showLockAlert(lock.lockedBy, lock.expiresAt);
    }
    return success;
  };
  
  return store;
};
```

---

### 3.7 测试

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 3.7.1 | WebSocket连接测试 | ws.test.ts | P0 | 2h |
| 3.7.2 | 房间管理测试 | room.test.ts | P0 | 2h |
| 3.7.3 | 编辑锁测试 | lock.test.ts | P0 | 2h |
| 3.7.4 | 操作广播测试 | broadcast.test.ts | P0 | 2h |
| 3.7.5 | 冲突检测测试 | conflict.test.ts | P0 | 2h |
| 3.7.6 | 多用户E2E测试 | collaboration.e2e.ts | P1 | 3h |

---

## WebSocket事件协议

### 客户端 -> 服务端

```typescript
// 加入脑图房间
socket.emit('join_mindmap', { 
  mindmapId: string, 
  branchId: string 
});

// 离开房间
socket.emit('leave_mindmap');

// 光标移动
socket.emit('cursor_move', { 
  position: { x: number, y: number },
  nodeId?: string  // 如果在节点上
});

// 选择节点
socket.emit('node_select', { nodeId: string });

// 开始编辑
socket.emit('node_edit_start', { 
  nodeId: string, 
  field: string  // name, description, metadata.xxx
});

// 结束编辑
socket.emit('node_edit_end', { nodeId: string });

// 创建节点
socket.emit('node_create', { 
  node: {
    type: NodeType,
    name: string,
    parentId?: string,
    position: Position,
    metadata?: object
  }
});

// 更新节点
socket.emit('node_update', { 
  nodeId: string, 
  changes: Partial<Node>
});

// 删除节点
socket.emit('node_delete', { nodeId: string });

// 创建关系
socket.emit('relation_create', { 
  relation: {
    sourceId: string,
    targetId: string,
    type: RelationType,
    metadata?: object
  }
});

// 删除关系
socket.emit('relation_delete', { relationId: string });

// 切换分支
socket.emit('branch_switch', { branchId: string });

// 聊天消息
socket.emit('chat_message', { content: string });
```

### 服务端 -> 客户端

```typescript
// 用户加入
socket.on('user_joined', { 
  userId: string, 
  username: string, 
  color: string 
});

// 用户离开
socket.on('user_left', { userId: string });

// 用户光标
socket.on('user_cursor', { 
  userId: string, 
  position: Position,
  nodeId?: string
});

// 用户选择节点
socket.on('user_selecting', { 
  userId: string, 
  nodeId: string 
});

// 用户编辑状态
socket.on('user_editing', { 
  userId: string, 
  nodeId: string, 
  field: string 
});

// 节点创建广播
socket.on('node_created', { 
  node: Node, 
  by: string 
});

// 节点更新广播
socket.on('node_updated', { 
  nodeId: string, 
  changes: Partial<Node>, 
  by: string 
});

// 节点删除广播
socket.on('node_deleted', { 
  nodeId: string, 
  by: string 
});

// 关系创建广播
socket.on('relation_created', { 
  relation: Relation, 
  by: string 
});

// 关系删除广播
socket.on('relation_deleted', { 
  relationId: string, 
  by: string 
});

// 分支切换广播
socket.on('branch_switched', { 
  branchId: string, 
  by: string 
});

// 同步状态（新用户加入时）
socket.on('sync_state', { 
  mindmap: Mindmap,
  nodes: Node[],
  relations: Relation[],
  onlineUsers: OnlineUser[],
  editLocks: EditLock[]
});

// 冲突检测
socket.on('conflict_detected', { 
  conflict: Conflict 
});

// 聊天消息
socket.on('chat_message', { 
  from: string, 
  fromUsername: string,
  content: string, 
  timestamp: Date 
});

// 锁定失败通知
socket.on('lock_failed', { 
  nodeId: string, 
  field: string,
  lockedBy: string,
  expiresAt: Date
});
```

---

## 依赖关系图

```
3.1 WebSocket服务端
    │
    ├── 3.2 协作状态管理 (依赖 3.1)
    │       │
    │       └── 3.2.1-3.2.3 基础状态 (并行)
    │       └── 3.2.4-3.2.6 状态持久化 (依赖 3.2.1)
    │
    ├── 3.3 编辑锁机制 (依赖 3.1, 3.2)
    │       │
    │       └── 3.3.1-3.3.5 锁逻辑 (并行)
    │       └── 3.3.6 Redis存储 (依赖 3.3.2)
    │
    ├── 3.4 操作广播 (依赖 3.1, 3.2)
    │       │
    │       └── 3.4.1-3.4.3 广播逻辑 (并行)
    │       └── 3.4.4-3.4.5 历史+确认 (依赖 3.4.2)
    │
    ├── 3.5 冲突处理 (依赖 3.3, 3.4)
    │       │
    │       └── 3.5.1-3.5.3 冲突检测 (并行)
    │       └── 3.5.4-3.5.6 OT+提示+记录 (依赖 3.5.2)
    │
    ├── 3.6 前端组件 (依赖 3.1-3.5)
    │       │
    │       └── 3.6.1-3.6.2 客户端+Store
    │       └── 3.6.3-3.6.9 UI组件 (依赖 3.6.2)
    │
    └── 3.7 测试 (依赖 3.1-3.6)
```

---

## 并行执行策略

**Week 5 (Day 21-25)**:
```
Day 21:
  - [后端] 3.1 WebSocket服务端
  - [后端] 3.2.1-3.2.3 协作状态基础
  
Day 22:
  - [后端] 3.2.4-3.2.6 状态管理完成
  - [后端] 3.3.1-3.3.5 编辑锁逻辑
  
Day 23:
  - [后端] 3.3.6 Redis锁存储
  - [后端] 3.4.1-3.4.3 操作广播
  - [前端] 3.6.1 Socket客户端
  
Day 24:
  - [后端] 3.4.4-3.4.5 操作历史
  - [后端] 3.5.1-3.5.3 冲突检测
  - [前端] 3.6.2 协作Store
  
Day 25:
  - [后端] 3.5.4-3.5.6 OT+冲突处理
  - [前端] 3.6.3-3.6.6 用户光标+锁提示
  - [测试] 3.7.1-3.7.4 基础测试
  - [全员] 集成验证
```

---

## 验收标准

### Phase 3完成条件

| 检查项 | 标准 |
|--------|------|
| WebSocket连接 | 客户端可成功连接并认证 |
| 房间加入 | 用户可加入脑图房间（按分支隔离） |
| 房间离开 | 用户离开时正确清理状态 |
| 光标同步 | 多用户光标实时显示（延迟<100ms） |
| 用户颜色 | 每用户分配唯一颜色 |
| 在线用户列表 | 实时显示所有在线用户 |
| 编辑锁获取 | 可成功锁定节点字段 |
| 编辑锁冲突 | 锁冲突时正确提示 |
| 锁自动释放 | 30秒超时自动释放 |
| 节点操作广播 | 创建/更新/删除实时广播 |
| 新用户同步 | 新用户加入时获取完整状态 |
| 冲突检测 | 并发编辑同一字段时检测冲突 |
| 冲突提示 | 冲突时显示Alert组件 |
| 协作聊天 | 可发送接收聊天消息 |
| 同步状态指示 | 显示synced/syncing/offline |
| 连接测试 | 100%通过 |
| 锁测试 | 100%通过 |
| 广播测试 | 100%通过 |
| 冲突测试 | 100%通过 |
| E2E多用户测试 | 2用户同时编辑验证 |

---

## Phase 3输出总结

**协作服务可用**: WebSocket实时通信
**编辑锁可用**: 节点字段级锁定
**光标同步可用**: 多用户光标显示
**冲突处理可用**: 冲突检测+提示