# UTL - 测试用例管理系统

基于 MVP 分离架构的测试用例管理系统，支持脑图编辑、UTL脚本编辑、分屏双向同步三种模式。

## 项目特性

| 特性 | 描述 | 状态 |
|------|------|------|
| 三种编辑模式 | 脑图编辑、UTL脚本编辑、分屏双向同步 | ✅ 已实现 |
| 蓝图式连线 | 节点可像蓝图一样拖拽连接，支持包含、继承、引用、依赖四种关系 | ✅ 已实现 |
| 实时同步 | 分屏模式下脑图与UTL脚本双向同步 | ✅ 已实现 |
| 中文语法 | UTL 语言原生支持中文关键字 | ✅ 已实现 |
| 用户认证 | JWT认证，登录状态持久化 | ✅ 已实现 |
| 工作区管理 | 多工作区、多脑图管理 | ✅ 已实现 |
| 节点属性面板 | 编辑节点属性，配置继承关系 | ✅ 已实现 |
| 实时协作 | 多用户同时编辑，WebSocket同步，在线用户，聊天 | ✅ 已实现 |
| 分支管理 | 创建/切换/合并分支 | ✅ 已实现 |
| 版本控制 | 版本历史，快照保存，版本对比，恢复 | ✅ 已实现 |
| 测试结果 | 用例状态标记，通过率统计 | ✅ 已实现 |
| 问题跟踪 | Issue创建/更新/删除，优先级/严重性 | ✅ 已实现 |
| 继承关系 | UTL 支持场景/功能分开定义，声明继承关系 | ✅ 已实现 |
| 导入导出 | UTL文件导入导出，语法验证 | ✅ 已实现 |
| UTL语法验证 | 导入前语法检查，错误提示 | ✅ 已实现 |

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Ant Design + Zustand |
| 后端 | Node.js 20 + Express + Prisma + PostgreSQL |
| 协作 | WebSocket (Socket.io) |
| 协议 | MCP (Model Context Protocol) |
| 语言引擎 | 自定义 UTL Parser (中英文双语支持) |

## 项目结构

```
utl-project/
├── packages/
│   ├── utl-language/     # UTL 语言引擎
│   │   ├── src/lexer/    # 词法分析（中英文双语）
│   │   ├── src/parser/   # 语法分析
│   │   ├── src/ast/      # AST 定义
│   │   └── src/codegen/  # 代码生成与同步
│   │
│   ├── utl-server/       # 后端服务
│   │   ├── prisma/       # 数据库 Schema (14个模型)
│   │   ├── src/api/      # REST API 路由
│   │   ├── src/mcp/      # MCP 协议工具
│   │   └── src/websocket/# WebSocket 协作
│   │
│   └── utl-client/       # 前端应用
│   │   ├── src/components/
│   │   │   ├── Auth/         # 登录页面
│   │   │   ├── Layout/       # 主布局、状态栏
│   │   │   ├── Editor/       # 脑图、脚本、分屏编辑器
│   │   │   └── Sidebar/      # 节点树
│   │   ├── src/stores/       # Zustand 状态管理
│   │   └── src/services/     # API 服务
│   │
├── docs/                 # 设计文档
├── docker-compose.yml    # Docker 配置
└── README.md             # 使用指南
```

---

## 快速开始

### 环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 20.0.0 | LTS 版本 |
| pnpm | >= 9.0.0 | 推荐 |
| PostgreSQL | >= 15.0 | 或使用 Docker |
| Docker | 最新版 | 可选，用于数据库 |

### 1. 启动数据库

```bash
docker compose up -d
```

数据库配置：
- 用户: `utl`
- 密码: `utl123`
- 数据库: `utl`
- 端口: `5432`

### 2. 安装依赖

```bash
npm install -g pnpm
pnpm install
```

### 3. 配置环境变量

```bash
cd packages/utl-server
cp .env.example .env
```

编辑 `.env`：

```env
DATABASE_URL="postgresql://utl:utl123@localhost:5432/utl?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
CLIENT_URL="http://localhost:5173"
PORT=3000
NODE_ENV=development
```

### 4. 初始化数据库

```bash
cd packages/utl-server
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. 启动服务

**重要：首次运行前需构建语言包**

```bash
# 构建语言引擎（首次运行或修改后）
cd packages/utl-language
pnpm build

# 后端
cd packages/utl-server
pnpm dev

# 前端（新终端）
cd packages/utl-client
pnpm dev
```

> **注意**：看到 `npm warn` 配置警告是正常的，不影响运行。

- 后端: `http://localhost:3000`
- 前端: `http://localhost:5173`

### 6. 登录测试

- 用户名: `test`
- 密码: `test123`

---

## 功能使用指南

### 三种编辑模式

底部状态栏提供模式切换按钮：

| 模式 | 功能 |
|------|------|
| 脑图 | 蓝图式节点编辑器，拖拽节点、连线 |
| 脚本 | Monaco编辑器，UTL中文语法高亮 |
| 分屏 | 左侧脑图 + 右侧脚本，双向同步 |

### 脑图编辑器操作

| 操作 | 说明 |
|------|------|
| 拖拽节点 | 按住节点拖动移动位置 |
| 点击节点名称 | 快速编辑节点名称（inline编辑） |
| 右侧蓝色圆点 | 拖拽创建连线，默认"包含"关系 |
| 点击连线徽章 | 编辑关系类型或删除连线 |
| 快速添加节点 | 工具栏下拉菜单，选择类型直接创建 |

### 连线关系类型

| 类型 | 说明 | 用途 |
|------|------|------|
| 包含 | 父节点包含子节点 | 场景→功能→测试点→测试用例 |
| 继承 | 功能继承场景属性 | 功能继承场景的动作因子、数据因子 |
| 引用 | 引用其他节点数据 | 跨模块引用 |
| 依赖 | 执行顺序依赖 | 用例执行顺序 |

### UTL脚本编辑器

支持中英文关键字：

```utl
场景 "用户登录" {
  描述 "用户通过多种方式登录系统"
  动作因子 "打开登录页面"
  数据因子 "用户名"
}

功能 "密码登录" 继承 "用户登录" {
  测试点 "登录成功" {
    测试用例 "正常登录" {
      预制条件 "用户已注册"
      测试步骤 "输入用户名"
      预期结果 "登录成功"
    }
  }
}
```

### 分屏模式同步

- 左侧脑图变化 → 右侧脚本自动更新
- 点击"同步到脑图"按钮 → 解析脚本创建节点

### 属性面板

点击工具栏"属性"按钮（选中节点后）：

- 编辑节点名称、描述
- 设置继承关系（功能节点）
- 配置合并策略（覆盖/合并/报错）
- 查看继承的因子列表
- 查看测试用例详情（预制条件/步骤/预期）

### 协作面板

点击工具栏"协作"按钮：

- 查看在线用户列表（带颜色标识）
- 实时聊天功能
- 用户光标位置同步
- 编辑锁定提示

### WebSocket事件

| 事件 | 方向 | 说明 |
|------|------|------|
| `join_mindmap` | 客户端→服务端 | 加入脑图协作 |
| `leave_mindmap` | 客户端→服务端 | 离开协作 |
| `user_joined` | 服务端→客户端 | 用户加入通知 |
| `user_left` | 服务端→客户端 | 用户离开通知 |
| `users_list` | 服务端→客户端 | 在线用户列表 |
| `cursor_move` | 客户端→服务端 | 光标位置同步 |
| `node_update` | 客户端→服务端 | 节点更新广播 |
| `chat_message` | 双向 | 聊天消息 |
| `edit_locked` | 服务端→客户端 | 编辑锁定通知 |

### 导入导出

| 接口 | 说明 |
|------|------|
| `POST /api/import/mindmap/:id/import` | 导入UTL文件创建节点（含语法验证） |
| `GET /api/import/mindmap/:id/export` | 导出UTL文件 |
| `POST /api/import/parse` | 解析UTL源码 |
| `POST /api/import/validate` | 验证UTL语法 |

---

## 功能面板

### 分支版本面板

点击"分支"按钮：

- 创建/切换/合并分支
- 版本历史列表
- 版本对比（选择两个版本）
- 恢复历史版本

### 测试结果面板

点击"测试"按钮：

- 测试用例状态标记（未测试/通过/失败/阻塞/跳过）
- 通过率统计汇总
- 问题跟踪（创建/更新/删除）
- 问题优先级/严重性设置

### 导入导出

- 点击"导入"上传UTL文件
- 点击"导出"下载UTL脚本

---

## API 接口

### 认证模块

| 接口 | 说明 |
|------|------|
| `POST /api/auth/login` | 登录，返回JWT |
| `POST /api/auth/logout` | 登出 |
| `GET /api/auth/me` | 获取当前用户 |

### 工作区模块

| 接口 | 说明 |
|------|------|
| `GET /api/workspaces` | 工作区列表 |
| `POST /api/workspaces` | 创建工作区 |
| `GET /api/workspaces/:id` | 工作区详情 |
| `DELETE /api/workspaces/:id` | 删除工作区 |

### 脑图模块

| 接口 | 说明 |
|------|------|
| `GET /api/mindmaps/workspace/:id` | 工作区下的脑图 |
| `POST /api/mindmaps/workspace/:id` | 创建脑图 |
| `PUT /api/mindmaps/:id` | 更新脑图（含utlSource） |
| `DELETE /api/mindmaps/:id` | 删除脑图 |

### 节点模块

节点类型：`scenario`, `function`, `test_point`, `action_factor`, `data_factor`, `test_case`, `precondition`, `test_step`, `expected_result`

| 接口 | 说明 |
|------|------|
| `GET /api/nodes/mindmap/:id` | 获取节点列表 |
| `POST /api/nodes/mindmap/:id` | 创建节点 |
| `PUT /api/nodes/:id` | 更新节点（位置、名称等） |
| `DELETE /api/nodes/:id` | 删除节点 |

### 关系模块

| 接口 | 说明 |
|------|------|
| `GET /api/relations/mindmap/:id` | 关系列表 |
| `POST /api/relations` | 创建关系 |
| `PUT /api/relations/:id` | 更新关系类型 |
| `DELETE /api/relations/:id` | 删除关系 |

### 分支模块

| 接口 | 说明 |
|------|------|
| `GET /api/branches/mindmap/:id` | 获取脑图的分支列表 |
| `POST /api/branches/mindmap/:id` | 创建新分支 |
| `GET /api/branches/:id` | 分支详情（含版本历史） |
| `PUT /api/branches/:id` | 更新分支名称/描述 |
| `DELETE /api/branches/:id` | 删除分支（仅active状态） |
| `POST /api/branches/:id/checkout` | 切换到该分支 |
| `POST /api/branches/:id/merge` | 合并分支到目标分支 |

### 版本模块

| 接口 | 说明 |
|------|------|
| `GET /api/versions/branch/:id` | 获取分支的版本历史 |
| `POST /api/versions/branch/:id` | 创建新版本快照 |
| `GET /api/versions/:id` | 版本详情 |
| `POST /api/versions/:id/restore` | 恢复到该版本 |
| `GET /api/versions/:id1/diff/:id2` | 版本对比 |

### 测试结果模块

| 接口 | 说明 |
|------|------|
| `POST /api/results/testcase/:id` | 提交/更新测试结果 |
| `GET /api/results/testcase/:id` | 获取用例测试结果 |
| `GET /api/results/mindmap/:id/summary` | 测试统计汇总 |
| `POST /api/results/issue` | 创建问题 |
| `GET /api/results/issue` | 问题列表（支持筛选） |
| `GET /api/results/issue/:id` | 问题详情 |
| `PUT /api/results/issue/:id` | 更新问题状态 |
| `DELETE /api/results/issue/:id` | 删除问题 |

---

## 节点类型说明

| 类型 | 中文 | 用途 |
|------|------|------|
| scenario | 场景 | 顶层业务场景 |
| function | 功能 | 具体功能模块 |
| test_point | 测试点 | 功能下的测试点 |
| action_factor | 动作因子 | 可复用的操作步骤 |
| data_factor | 数据因子 | 可复用的测试数据 |
| test_case | 测试用例 | 具体测试用例 |
| precondition | 预制条件 | 执行前条件 |
| test_step | 测试步骤 | 操作步骤 |
| expected_result | 预期结果 | 期望结果 |

---

## MCP 工具

系统提供 MCP (Model Context Protocol) 工具，支持 AI Agent 操作：

| 工具名称 | 功能 |
|---------|------|
| `node_create` | 创建节点 |
| `node_update` | 更新节点 |
| `node_delete` | 删除节点 |
| `node_query` | 查询节点 |
| `relation_create` | 创建关系 |
| `relation_delete` | 删除关系 |
| `mindmap_load` | 加载脑图 |
| `mindmap_save` | 保存脑图 |

---

## 开发指南

### 前端组件结构

```
utl-client/src/components/
├── Auth/
│   └── LoginPage.tsx         # 登录页（渐变背景）
├── Layout/
│   ├── Layout.tsx            # 主布局（左侧边栏+主内容）
│   └── StatusBar.tsx         # 状态栏（模式切换+统计）
├── Editor/
│   ├── MindmapEditor/
│   │   └── Canvas.tsx        # 蓝图式节点编辑器
│   ├── ScriptEditor.tsx      # Monaco编辑器+UTL语法
│   ├── SplitEditor.tsx       # 分屏布局
│   └── ModeSwitcher.tsx      # 模式切换按钮
└── Sidebar/
    └── NodeTree.tsx          # 节点树状结构
```

### 状态管理

```typescript
// authStore - 认证状态
{ user, token, isAuthenticated, login, logout }

// workspaceStore - 工作区状态
{ workspaces, currentWorkspace, mindmaps, currentMindmap, loadWorkspaces, selectMindmap }

// editorStore - 编辑器状态
{ mode, nodes, relations, selectedNodes, setNodes, selectNode }
```

---

## 故障排除

### 数据库连接失败

```bash
# 检查 PostgreSQL 是否运行
docker ps

# 检查连接
psql -U utl -d utl -h localhost
```

### 前端编译错误

```bash
# 清理依赖
rm -rf node_modules packages/*/node_modules
pnpm install
```

### 生产构建超时

由于 Monaco Editor 是大型包，生产构建可能需要较长时间。推荐使用开发模式：

```bash
# 开发模式（推荐日常使用）
pnpm dev

# 生产构建（用于部署）
pnpm build
# 如果超时，可尝试：
pnpm --filter @utl/client run build --mode production
```

构建慢的原因：
- Monaco Editor (~3MB) 需要处理大量文件
- 建议部署时使用 CI/CD 缓存机制

### Prisma 迁移失败

```bash
# 授权用户创建数据库权限
psql -U postgres -c "GRANT CREATEDB TO utl;"
npx prisma migrate reset
```

---

## 许可证

MIT License