# Phase 1: MVP核心

## 目标

搭建可用的单用户脑图编辑器，完成基础CRUD功能。

---

## 任务分解

### 1.1 项目初始化

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 1.1.1 | 创建Monorepo结构 | package.json, tsconfig.json | P0 | 0.5h |
| 1.1.2 | 配置TypeScript | 各包tsconfig.json | P0 | 0.5h |
| 1.1.3 | 配置ESLint + Prettier | .eslintrc, .prettierrc | P1 | 0.5h |
| 1.1.4 | 配置Git | .gitignore, commit规范 | P1 | 0.5h |

**产出物**:
```
utl-project/
├── package.json          # workspaces配置
├── tsconfig.json         # 基础TS配置
├── .eslintrc.js
├── .prettierrc
├── .gitignore
└── packages/             # 空目录结构
    ├── utl-language/
    ├── utl-server/
    └── utl-client/
```

---

### 1.2 后端基础架构

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 1.2.1 | Express服务器搭建 | server.ts | P0 | 1h |
| 1.2.2 | Prisma配置 + 数据库Schema | schema.prisma | P0 | 2h |
| 1.2.3 | 数据库迁移执行 | migrations/ | P0 | 1h |
| 1.2.4 | 基础中间件配置 | auth.ts, errorHandler.ts | P0 | 1h |
| 1.2.5 | 用户认证API | auth.ts路由 | P0 | 2h |
| 1.2.6 | 工作区API | workspace.ts路由 | P0 | 2h |
| 1.2.7 | 脑图API | mindmap.ts路由 | P0 | 2h |
| 1.2.8 | 节点API | node.ts路由 | P0 | 3h |
| 1.2.9 | 关系API | relation.ts路由 | P1 | 2h |

**产出物**:
```
packages/utl-server/src/
├── server.ts
├── db/
│   ├── client.ts
│   ├── schema.prisma        # User, Workspace, Mindmap, Node, Relation
│   └── migrations/
├── api/
│   ├── routes/
│   │   ├── auth.ts          # login, logout, me
│   │   ├── workspace.ts     # CRUD + 协作者
│   │   ├── mindmap.ts       # CRUD
│   │   ├── node.ts          # CRUD + 继承接口
│   │   └── relation.ts      # CRUD
│   └── middleware/
│       ├── auth.ts          # JWT验证
│       └── errorHandler.ts
├── services/
│   ├── authService.ts
│   ├── workspaceService.ts
│   ├── mindmapService.ts
│   ├── nodeService.ts
│   └── relationService.ts
└── models/
    ├── User.ts
    ├── Workspace.ts
    ├── Mindmap.ts
    ├── Node.ts
    └── Relation.ts
```

**API清单**:
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/workspaces
POST   /api/workspaces
PUT    /api/workspaces/:id
DELETE /api/workspaces/:id

GET    /api/workspaces/:wid/mindmaps
POST   /api/workspaces/:wid/mindmaps
GET    /api/mindmaps/:id
PUT    /api/mindmaps/:id
DELETE /api/mindmaps/:id

GET    /api/mindmaps/:mid/nodes
POST   /api/mindmaps/:mid/nodes
GET    /api/nodes/:id
PUT    /api/nodes/:id
DELETE /api/nodes/:id

GET    /api/mindmaps/:mid/relations
POST   /api/mindmaps/:mid/relations
DELETE /api/relations/:id
```

---

### 1.3 前端基础架构

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 1.3.1 | React + Vite项目初始化 | package.json, vite.config.ts | P0 | 1h |
| 1.3.2 | Ant Design集成 | App布局组件 | P0 | 1h |
| 1.3.3 | Axios + API服务层 | api.ts | P0 | 1h |
| 1.3.4 | Zustand状态管理配置 | authStore.ts, workspaceStore.ts | P0 | 2h |
| 1.3.5 | 登录页面 | LoginModal.tsx | P0 | 2h |
| 1.3.6 | Layout布局组件 | Layout.tsx, Sidebar.tsx | P0 | 2h |
| 1.3.7 | 工作区选择组件 | WorkspaceSelector.tsx | P0 | 1h |
| 1.3.8 | 脑图树组件 | MindmapTree.tsx | P0 | 1h |
| 1.3.9 | AntV G6集成与基础配置 | Canvas.tsx | P0 | 3h |
| 1.3.10 | 节点渲染组件 | NodeRenderer.tsx | P0 | 3h |
| 1.3.11 | 关系连线组件 | RelationRenderer.tsx | P0 | 2h |
| 1.3.12 | 节点拖拽交互 | 拖拽逻辑 | P0 | 2h |
| 1.3.13 | 属性编辑面板 | PropertyPanel.tsx | P0 | 2h |
| 1.3.14 | 编辑模式切换器 | ModeSwitcher.tsx | P1 | 1h |

**产出物**:
```
packages/utl-client/src/
├── main.tsx
├── App.tsx
├── components/
│   ├── Layout/
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   └── StatusBar.tsx
│   ├── Editor/
│   │   ├── MindmapEditor/
│   │   │   ├── Canvas.tsx          # AntV G6容器
│   │   │   ├── NodeRenderer.tsx    # 节点类型渲染
│   │   │   ├── RelationRenderer.tsx
│   │   │   └── Toolbar.tsx
│   │   └── ModeSwitcher.tsx        # 脑图/脚本/分屏切换
│   ├── Sidebar/
│   │   ├── WorkspaceSelector.tsx
│   │   ├── MindmapTree.tsx
│   │   └── NodeTree.tsx
│   ├── Panel/
│   │   └── PropertyPanel.tsx       # 节点属性编辑
│   ├── Auth/
│   │   └── LoginModal.tsx
│   └── Common/
│       ├── Button.tsx
│       ├── Input.tsx
│       └── Modal.tsx
├── stores/
│   ├── authStore.ts
│   ├── workspaceStore.ts
│   ├── mindmapStore.ts
│   └── editorStore.ts              # 编辑模式状态
├── services/
│   ├── api.ts                      # Axios实例
│   ├── authService.ts
│   ├── workspaceService.ts
│   ├── mindmapService.ts
│   └── nodeService.ts
├── hooks/
│   ├── useMindmap.ts
│   └── useAuth.ts
├── types/
│   ├── node.ts
│   ├── mindmap.ts
│   └── user.ts
└── utils/
    └── mindmapLayout.ts            # 节点布局算法
```

---

### 1.4 MCP协议基础

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 1.4.1 | MCP Server初始化 | mcp/server.ts | P0 | 2h |
| 1.4.2 | MCP节点工具 | nodeTools.ts | P0 | 2h |
| 1.4.3 | MCP关系工具 | relationTools.ts | P1 | 1h |
| 1.4.4 | MCP脑图工具 | mindmapTools.ts | P0 | 1h |
| 1.4.5 | MCP资源定义 | mindmapResource.ts | P1 | 1h |

**产出物**:
```
packages/utl-server/src/mcp/
├── server.ts                    # MCP Server实例
├── tools/
│   ├── nodeTools.ts             # 创建节点, 更新节点, 删除节点, 查询节点
│   ├── relationTools.ts         # 创建关系, 删除关系
│   └── mindmapTools.ts          # 加载脑图, 保存脑图
└── resources/
    └── mindmapResource.ts       # mindmap://{id}/nodes
```

**MCP工具清单**:
```json
[
  { "name": "创建节点", "inputSchema": { "type": "object", "properties": { "类型": {}, "名称": {}, "脑图ID": {} } } },
  { "name": "更新节点" },
  { "name": "删除节点" },
  { "name": "查询节点" },
  { "name": "创建关系" },
  { "name": "删除关系" },
  { "name": "加载脑图" },
  { "name": "保存脑图" }
]
```

---

### 1.5 测试

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 1.5.1 | 后端API单元测试 | auth.test.ts等 | P0 | 3h |
| 1.5.2 | 前端组件测试 | Jest + Testing Library | P1 | 2h |
| 1.5.3 | E2E测试骨架 | Playwright配置 | P1 | 1h |

---

## 依赖关系图

```
1.1 项目初始化
    │
    ├── 1.2 后端基础架构 (依赖 1.1)
    │       │
    │       ├── 1.2.1 Express服务器 (依赖 1.1.1)
    │       ├── 1.2.2 Prisma配置 (依赖 1.1.1)
    │       ├── 1.2.3 数据库迁移 (依赖 1.2.2)
    │       ├── 1.2.4 中间件 (依赖 1.2.1)
    │       ├── 1.2.5-1.2.9 API路由 (依赖 1.2.3, 1.2.4)
    │       │
    │       └── 1.4 MCP协议 (依赖 1.2)
    │
    ├── 1.3 前端基础架构 (依赖 1.1)
    │       │
    │       ├── 1.3.1-1.3.4 基础配置 (并行)
    │       ├── 1.3.5 登录页 (依赖 1.3.3, 1.3.4)
    │       ├── 1.3.6-1.3.8 布局组件 (依赖 1.3.4)
    │       ├── 1.3.9-1.3.12 脑图组件 (依赖 1.3.4, 1.3.6)
    │       └── 1.3.13-1.3.14 面板组件 (依赖 1.3.9)
    │
    └── 1.5 测试 (依赖 1.2, 1.3)
```

---

## 并行执行策略

**Week 1 (Day 1-5)**:
```
Day 1: 
  - [单人] 1.1 项目初始化 (全部)
  
Day 2-3:
  - [后端] 1.2.1-1.2.3 Express + Prisma + 迁移
  - [前端] 1.3.1-1.3.4 React + Vite + Zustand
  
Day 4-5:
  - [后端] 1.2.4-1.2.6 中间件 + 认证API + 工作区API
  - [前端] 1.3.5-1.3.6 登录 + Layout
```

**Week 2 (Day 6-10)**:
```
Day 6-7:
  - [后端] 1.2.7-1.2.9 脑图API + 节点API + 关系API
  - [前端] 1.3.7-1.3.8 Sidebar组件
  
Day 8-9:
  - [后端] 1.4 MCP协议基础
  - [前端] 1.3.9-1.3.12 AntV G6 + 节点渲染 + 拖拽
  
Day 10:
  - [全员] 1.3.13-1.3.14 属性面板 + 模式切换
  - [全员] 1.5 测试
  - [全员] 集成验证
```

---

##验收标准

### Phase 1完成条件

| 检查项 | 标准 |
|--------|------|
| 用户认证 | 登录/登出正常，JWT有效 |
| 工作区管理 | 创建/切换/删除工作区正常 |
| 脑图CRUD | 创建/读取/更新/删除脑图正常 |
| 节点CRUD | 创建9种节点类型，拖拽更新位置 |
| 关系连线 | 包含关系、继承关系可创建删除 |
| 脑图渲染 | AntV G6正确渲染节点树 |
| 属性编辑 | 可编辑节点名称、描述、metadata |
| MCP工具 | 8个基础工具可通过MCP调用 |
| API测试 | 所有API端点有单元测试 |
| 无TypeScript错误 | tsc编译通过 |
| 无Lint错误 | ESLint检查通过 |

---

## Phase 1输出总结

**后端可部署**: Express + PostgreSQL + MCP Server
**前端可运行**: React SPA + AntV G6脑图编辑器
**用户可用**: 单用户登录、创建工作区、编辑脑图