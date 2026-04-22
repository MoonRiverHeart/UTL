# UTL项目设计方案

---

## 实现状态（2025年更新）

### Phase 1 MVP - 已完成 ✅

| 功能 | 状态 | 说明 |
|------|------|------|
| 用户认证 | ✅ | JWT认证，登录状态持久化，退出重登录数据保持，用户注册 |
| 管理员系统 | ✅ | 管理员角色标识（isAdmin字段），权限控制基础 |
| 工作区管理 | ✅ | 创建、选择、切换、重命名、删除工作区 |
| 工作区共享 | ✅ | 邀请成员协作，角色分配（owner/editor/viewer） |
| 权限控制 | ✅ | 基于角色的权限控制，查看者无法编辑节点和连线 |
| 脑图管理 | ✅ | 创建、选择、删除脑图 |
| 节点CRUD | ✅ | 9种节点类型，创建、编辑、删除、拖拽移动 |
| 节点树显示 | ✅ | 左侧边栏显示节点树状结构，每个节点可删除 |
| 蓝图式连线 | ✅ | 拖拽连线，默认"包含"关系，点击修改 |
| UTL脚本编辑 | ✅ | Monaco编辑器（CDN加载），中英文语法高亮 |
| 分屏模式 | ✅ | 左侧脑图+右侧脚本，双向同步 |
| 双向同步 | ✅ | 脑图→代码实时同步，代码→脑图（syncToMindmap） |
| 数据库Schema | ✅ | Prisma，14个模型，完整关系定义 |
| REST API | ✅ | auth/workspaces/mindmaps/nodes/relations/branches/versions |
| MCP工具 | ✅ | nodeTools/relationTools/mindmapTools |
| WebSocket | ✅ | 协作服务器基础架构，节点/关系/分支事件同步 |

### Phase 2 - 已完成 ✅

| 功能 | 状态 | 说明 |
|------|------|------|
| 继承解析引擎 | ✅ | UTL继承关系解析器，合并策略支持 |
| 节点属性面板 | ✅ | 编辑节点属性，配置继承关系，查看因子继承 |
| 继承关系显示 | ✅ | 属性面板显示继承链和合并策略 |
| UTL语法验证 | ✅ | 导入前语法检查，错误提示 |

### Phase 3 - 已完成 ✅

| 功能 | 状态 | 说明 |
|------|------|------|
| WebSocket完善 | ✅ | 光标同步，用户列表，编辑锁定 |
| 协作面板 | ✅ | 在线用户显示，实时聊天，系统消息 |
| 编辑锁 | ✅ | 节点编辑时锁定，防止并发冲突 |
| 实时同步事件 | ✅ | node_create/node_delete/relation_create/relation_delete广播 |

### Phase 4 - 已完成 ✅

| 功能 | 状态 | 说明 |
|------|------|------|
| 分支管理API | ✅ | 创建/切换/合并/删除分支 |
| 分支图谱 | ✅ | 树形视图显示分支层级关系 |
| 分支状态 | ✅ | 活跃/已合并状态标识，已合并分支不可切换 |
| 版本快照 | ✅ | 保存节点状态快照 |
| 版本历史 | ✅ | 版本列表，版本详情 |
| 版本对比 | ✅ | diff两个版本差异 |
| 版本恢复 | ✅ | 恢复到历史版本 |
| 分支WebSocket | ✅ | branch_checkout/branch_changed事件同步 |

### Phase 5 - 已完成 ✅

| 功能 | 状态 | 说明 |
|------|------|------|
| 测试结果API | ✅ | 提交/更新用例状态 |
| 测试统计 | ✅ | 通过率汇总 |
| 问题跟踪 | ✅ | Issue创建/更新/删除 |
| 问题筛选 | ✅ | 按状态/严重性/脑图筛选 |

### Phase 6 - 已完成 ✅

| 功能 | 状态 | 说明 |
|------|------|------|
| 导入导出 | ✅ | UTL文件导入导出，语法验证 |
| 性能优化 | 🚧 | 大规模节点性能优化（待实现） |
| 端到端测试 | 🚧 | 完整测试覆盖（待实现） |

### Phase 7 - 规划中 🚧

| 功能 | 状态 | 说明 |
|------|------|------|
| 合并请求 | 🚧 | MR流程，代码审查 |
| 冲突解决 | 🚧 | 合并冲突检测与解决 |
| 性能优化 | 🚧 | 大规模节点渲染优化 |
| 端到端测试 | 🚧 | 完整测试覆盖 |

---

## 一、项目概述

### 1.1 项目目标

创建一个MVP分离的测试用例管理系统：
- **View层**：浏览器前端，支持脑图编辑、UTL脚本编辑、分屏双向同步三种模式
- **Presenter层**：MCP协议 + RESTful API + WebSocket协作
- **Model层**：UTL语言引擎（原生中文语法）

### 1.2 核心特性

| 特性 | 描述 | 状态 |
|------|------|------|
| 三种编辑模式 | 脑图编辑、UTL脚本编辑、分屏双向同步 | ✅ 已实现 |
| 曲线连接 | 贝塞尔曲线连接，箭头标识方向，避免遮挡 | ✅ 已实现 |
| 约束布局模式 | 自动布局，删除节点后重新排列，紧凑结构 | ✅ 已实现 |
| 蓝图式连线 | 节点拖拽连接，支持包含/继承/引用/依赖关系 | ✅ 已实现 |
| 实时同步 | 分屏模式脑图与脚本双向同步 | ✅ 已实现 |
| 中文语法 | UTL语言原生支持中文关键字 | ✅ 已实现 |
| 用户认证 | JWT认证，登录状态持久化，用户注册 | ✅ 已实现 |
| 管理员系统 | 管理员角色标识，权限控制 | ✅ 已实现 |
| 工作区管理 | 多工作区、多脑图管理，重命名/删除 | ✅ 已实现 |
| 工作区共享 | 邀请成员协作，角色分配（owner/editor/viewer） | ✅ 已实现 |
| 权限控制 | 基于角色的权限控制，查看者无法编辑 | ✅ 已实现 |
| 实时协作 | 多用户同时编辑，WebSocket同步 | ✅ 已实现 |
| 版本控制 | Git风格的分支管理，版本历史，分支图谱 | ✅ 已实现 |
| 继承关系 | UTL支持场景/功能分开定义，声明继承关系 | ✅ 已实现 |
| 测试结果标记 | 用例状态标记，问题跟踪 | ✅ 已实现 |
| 导入导出 | UTL文件导入导出，语法验证 | ✅ 已实现 |

---

## 当前已实现架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    utl-client (React + Vite)                    │
│  ┌──────────────┐  ┌───────────────────────────────────────┐   │
│  │  Layout      │  │           Editor Components           │   │
│  │  - Sidebar   │  │  ┌─────────────────────────────────┐ │   │
│  │    - 工作区  │  │  │ Canvas.tsx (蓝图式编辑器)        │ │   │
│  │    - 脑图    │  │  │   - 单击选中/双击编辑            │ │   │
│  │    - 节点树  │  │  │   - 查看者权限限制              │ │   │
│  │  - StatusBar │  │  │   - parsed-节点支持              │ │   │
│  │              │  │  │ ScriptEditor.tsx (Monaco CDN)    │ │   │
│  │              │  │  │   - 双向同步逻辑                 │ │   │
│  │              │  │  │   - syncToMindmap               │ │   │
│  │              │  │  │ SplitEditor.tsx (分屏)           │ │   │
│  │              │  │  └─────────────────────────────────┘ │   │
│  │              │  │  ┌─────────────────────────────────┐ │   │
│  │              │  │  │ Panel Components                │ │   │
│  │              │  │  │ BranchVersionPanel (分支图谱)   │ │   │
│  │              │  │  │ PropertyPanel (属性编辑)        │ │   │
│  │              │  │  │ CollaborationPanel (协作)       │ │   │
│  │              │  │  └─────────────────────────────────┘ │   │
│  └──────────────┘  └───────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Zustand Stores: authStore | workspaceStore | editorStore │   │
│  │                   socketStore | branchStore               │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────┘
                                │ REST API + WebSocket
┌───────────────────────────────▼─────────────────────────────────┐
│                     utl-server (Express)                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐ │
│  │ REST Routes │ │  WebSocket  │ │ MCP Tools   │ │ Prisma   │ │
│  │ - auth      │ │  Server     │ │ - nodeTools │ │ Client   │ │
│  │   - login   │ │             │ │ - relTools  │ │          │ │
│  │   - register│ │ Events:     │ │ - mapTools  │ │          │ │
│  │ - workspace │ │ - join/leave│ │             │ │          │ │
│  │   - collab  │ │ - cursor    │ │             │ │          │ │
│  │ - mindmap   │ │ - node_*    │ │             │ │          │ │
│  │ - node      │ │ - relation_*│ │             │ │          │ │
│  │ - relation  │ │ - branch_*  │ │             │ │          │ │
│  │ - branch    │ │ - chat      │ │             │ │          │ │
│  │ - version   │ │             │ │             │ │          │ │
│  │ - results   │ │             │ │             │ │          │ │
│  │ - import    │ │             │ │             │ │          │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘ │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Middleware: auth.ts | permission.ts | errorHandler.ts    │   │
│  │  permission.ts: checkWorkspaceAccess | checkNodeAccess    │   │
│  │               owner/editor/viewer role enforcement        │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                    utl-language (Parser)                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐ │
│  │ Lexer       │ │ Parser      │ │ AST         │ │ Codegen  │ │
│  │ (中文识别)  │ │             │ │ Nodes       │ │          │ │
│  │ (双语支持)  │ │             │ │             │ │ generate │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                     PostgreSQL (Prisma)                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Models: User | Workspace | Collaborator | Mindmap        │   │
│  │         Node | Relation | Branch | Version | TestResult │   │
│  │         Issue | Attachment | CollaborationSession       │   │
│  │ User.isAdmin: 管理员标识                                 │   │
│  │ Collaborator.role: owner/editor/viewer                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1.3 用户认证与权限系统

### 用户角色

| 角色 | 标识 | 权限 |
|------|------|------|
| 管理员 | `isAdmin: true` | 系统级管理权限（后续扩展） |
| 工作区所有者 | `role: 'owner'` | 工作区管理、成员管理、脑图管理 |
| 编辑者 | `role: 'editor'` | 节点/连线创建、编辑、删除 |
| 查看者 | `role: 'viewer'` | 仅查看，无法编辑 |

### 权限控制实现

```typescript
// packages/utl-server/src/api/middleware/permission.ts

// 检查工作区访问权限
export const checkWorkspaceAccess = async (req, res, next) => {
  const userId = req.user.id;
  const workspaceId = req.params.workspaceId || req.body.workspaceId;
  
  const collaborator = await prisma.collaborator.findFirst({
    where: { workspaceId, userId }
  });
  
  if (!collaborator) {
    return res.status(403).json({ error: '无权访问此工作区' });
  }
  
  req.userRole = collaborator.role; // owner/editor/viewer
  next();
};

// 检查编辑权限（owner/editor可编辑，viewer不可）
export const checkEditPermission = (req, res, next) => {
  if (req.userRole === 'viewer') {
    return res.status(403).json({ error: '查看者无编辑权限' });
  }
  next();
};

// 检查所有者权限（仅owner可管理成员）
export const checkOwnerPermission = (req, res, next) => {
  if (req.userRole !== 'owner') {
    return res.status(403).json({ error: '仅所有者可执行此操作' });
  }
  next();
};
```

### 前端权限限制

```typescript
// packages/utl-client/src/components/Editor/MindmapEditor/Canvas.tsx

// 根据角色限制编辑操作
const isViewer = userRole === 'viewer';

// 根据布局模式限制拖动
const isConstrained = layoutMode === 'constrained';

// 查看者或约束模式下无法拖拽节点
if (!isViewer && !isConstrained && !nodeId.startsWith('parsed-') && mindmapId) {
  await api.put(`/nodes/${nodeId}`, { position });
}

// 查看者无法创建连线
if (isViewer) {
  // 禁用连线创建功能
}

// 约束模式下新节点自动布局
if (isConstrained) {
  position = getNextAutoPosition();
}
```

---

## 二、整体架构（完整设计）

```
┌─────────────────────────────────────────────────────────────────┐
│                           View Layer                            │
│                      (Browser - React SPA)                     │
│  ┌──────────────┐  ┌───────────────────────────────────────┐   │
│  │  左侧资源树   │  │          右侧编辑区（三模式）         │   │
│  │  - 工作区     │  │  ┌─────────────────────────────────┐ │   │
│  │  - 分支列表   │  │  │ 模式1: 脑图编辑模式              │ │   │
│  │  - 版本历史   │  │  │ 模式2: UTL脚本编辑模式           │ │   │
│  │  - 脑图列表   │  │  │ 模式3: 分屏双向同步模式           │ │   │
│  │  - 节点树     │  │  └─────────────────────────────────┘ │   │
│  └──────────────┘  │  协作面板 │ 属性面板 │ 版本面板        │   │
│                     └───────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  状态栏: 协作用户 | 同步状态 | 当前分支/版本 | 用例统计    │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────┘
                                │ MCP Protocol + WebSocket + REST
┌───────────────────────────────▼─────────────────────────────────┐
│                        Presenter Layer                          │
│                   (MCP Server + REST API + WS Hub)              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐ │
│  │ MCP Handler │ │ REST Router │ │  WS Hub     │ │ Branch   │ │
│  │             │ │             │ │ (协作同步)   │ │ Manager  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘ │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                          Model Layer                            │
│                       (UTL Language Engine)                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐ │
│  │ UTL Parser  │ │ Node Store  │ │ Relation    │ │ Version  │ │
│  │ (中文语法)  │ │             │ │ Engine      │ │ Control  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐ │
│  │ Inheritance │ │ Test Result │ │ Collaborate │ │ Branch   │ │
│  │ Resolver    │ │ Manager     │ │ Lock Mgr    │ │ Manager  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、UTL语言设计（中文语法）

### 3.1 中文关键字

```utl
// UTL中文关键字对照表
场景      = SCENARIO
功能      = FUNCTION
测试点    = TEST_POINT
动作因子  = ACTION_FACTOR
数据因子  = DATA_FACTOR
属性      = ATTR
方法      = METHOD
测试用例  = TEST_CASE
预制条件  = PRECONDITION
测试步骤  = TEST_STEP
预期结果  = EXPECTED_RESULT

继承      = EXTENDS
导入      = IMPORT
导出      = EXPORT
引用      = REF
抽象      = ABSTRACT

合并策略  = MERGE STRATEGY
覆盖      = override
合并      = merge
报错      = error

测试流程  = TEST_FLOW
序列      = SEQUENCE
调用      = CALL
断言      = ASSERT
```

**节点层级结构（新版）：**

| 层级 | 节点类型 | 说明 |
|------|------|------|
| 1 | 场景 (scenario) | 业务场景，可包含功能、因子 |
| 2 | 功能 (function) | 具体功能模块，继承场景 |
| 3 | 测试点 (test_point) | 测试点，类结构 |
| 3.1 | 属性 (attr) | 测试点的属性块，包含因子 |
| 3.1.1 | 数据因子 (data_factor) | 成员变量 |
| 3.1.1 | 动作因子 (action_factor) | 成员变量 |
| 3.2 | 方法 (method) | 测试点的方法块 |
| 3.2.1 | 预制条件 (precondition) | 方法前置条件 |
| 3.2.1 | 测试步骤 (test_step) | 方法执行步骤 |
| 3.2.1 | 预期结果 (expected_result) | 方法期望结果 |

### 3.2 中文语法示例

```utl
// ========== 场景定义（独立文件）==========
// 文件: 场景/登录场景.utl

场景 "用户登录" {
  描述 "用户通过多种方式登录系统"
  
  // 场景级别的动作因子（可被继承）
  动作因子 "打开登录页面"
  动作因子 "关闭登录页面"
  
  // 场景级别的数据因子
  数据因子 "登录用户名"
  数据因子 "登录密码"
  
  // 抽象功能标记（由子模块继承实现）
  抽象 功能 "执行登录"
}

// ========== 功能定义（继承场景）==========
// 文件: 功能/密码登录.utl

导入 场景 "用户登录" 来源 "场景/登录场景.utl"

功能 "密码登录" 继承 "用户登录.执行登录" {
  描述 "使用用户名密码登录"
  
  // 继承场景的动作因子，并添加自己的
  动作因子 "输入用户名: {用户名}"
  动作因子 "输入密码: {密码}"
  动作因子 "点击登录按钮"
  
  // 覆盖/扩展数据因子
  数据因子 "用户名" = "测试用户"
  数据因子 "密码" = "******"
  
  // 测试点（类结构：属性 + 方法）
  测试点 "密码登录测试" {
    属性 {
      数据因子 "测试用户名"
      数据因子 "测试密码"
      动作因子 "打开登录页面"
      动作因子 "输入凭证"
    }
    
    方法 "正常登录" {
      预制条件 "用户已注册"
      测试步骤 "打开登录页面"
      测试步骤 "输入用户名: 测试用户"
      测试步骤 "输入密码: ******"
      测试步骤 "点击登录按钮"
      预期结果 "登录成功，跳转首页"
    }
    
    方法 "密码错误" {
      预制条件 "用户已注册"
      测试步骤 "打开登录页面"
      测试步骤 "输入用户名: 测试用户"
      测试步骤 "输入密码: 错误密码"
      测试步骤 "点击登录按钮"
      预期结果 "提示密码错误"
    }
    
    方法 "用户不存在" {
      预制条件 "用户未注册"
      测试步骤 "打开登录页面"
      测试步骤 "输入用户名: 新用户"
      测试步骤 "输入密码: ******"
      测试步骤 "点击登录按钮"
      预期结果 "提示用户不存在"
    }
  }
}

// ========== 另一个功能（多继承）==========
// 文件: 功能/短信登录.utl

导入 场景 "用户登录" 来源 "场景/登录场景.utl"
导入 功能 "通用验证" 来源 "功能/验证码功能.utl"

功能 "短信验证码登录" 继承 "用户登录.执行登录", "通用验证.获取验证码" {
  合并策略 合并
  
  动作因子 "输入手机号: {手机号}"
  动作因子 "获取验证码"
  动作因子 "输入验证码: {验证码}"
  动作因子 "点击登录按钮"
  
  数据因子 "手机号" = "13800138000"
  数据因子 "验证码" = "123456"
  
  测试点 "验证码登录测试" {
    属性 {
      数据因子 "测试手机号"
      数据因子 "测试验证码"
      动作因子 "获取验证码"
    }
    
    方法 "正常验证码登录" {
      预制条件 "用户已注册"
      预制条件 "手机号有效"
      测试步骤 "打开登录页面"
      测试步骤 "输入手机号: 13800138000"
      测试步骤 "获取验证码"
      测试步骤 "输入验证码: 123456"
      测试步骤 "点击登录按钮"
      预期结果 "登录成功，跳转首页"
    }
    
    方法 "验证码过期" {
      预制条件 "用户已注册"
      测试步骤 "等待验证码过期"
      测试步骤 "输入验证码: 旧验证码"
      预期结果 "提示验证码已过期"
    }
  }
}
    测试用例 "正常验证码登录" {
      预制条件 "用户已注册"
      预制条件 "手机号有效"
      测试步骤 "打开登录页面"
      测试步骤 "输入手机号: 13800138000"
      测试步骤 "获取验证码"
      测试步骤 "输入验证码: 123456"
      测试步骤 "点击登录按钮"
      预期结果 "登录成功，跳转首页"
    }
  }
}

// ========== 模块导出 ==========
导出 场景 "用户登录"
导出 功能 "密码登录", "短信验证码登录"

// ========== 测试流程组合 ==========
// 文件: 流程/用户认证流程.utl

导入 功能 "密码登录" 来源 "功能/密码登录.utl"
导入 功能 "短信验证码登录" 来源 "功能/短信登录.utl"

测试流程 "用户认证流程" {
  序列 {
    调用 "密码登录" 参数 {
      "用户名": "管理员",
      "密码": "admin123"
    }
    
    断言 "登录成功"
    
    调用 "登出"
    
    调用 "短信验证码登录" 参数 {
      "手机号": "13800138000",
      "验证码": "666666"
    }
    
    断言 "登录成功"
  }
}
```

### 3.3 双语关键字支持

UTL引擎同时支持中文和英文关键字，解析器自动识别：

```typescript
// lexer/tokenKeywords.ts
const KEYWORDS = {
  // 中文关键字
  '场景': TokenType.SCENARIO,
  '功能': TokenType.FUNCTION,
  '测试点': TokenType.TEST_POINT,
  '动作因子': TokenType.ACTION_FACTOR,
  '数据因子': TokenType.DATA_FACTOR,
  '测试用例': TokenType.TEST_CASE,
  '预制条件': TokenType.PRECONDITION,
  '测试步骤': TokenType.TEST_STEP,
  '预期结果': TokenType.EXPECTED_RESULT,
  '继承': TokenType.EXTENDS,
  '导入': TokenType.IMPORT,
  '导出': TokenType.EXPORT,
  '抽象': TokenType.ABSTRACT,
  '描述': TokenType.DESCRIPTION,
  '合并策略': TokenType.MERGE_STRATEGY,
  '覆盖': TokenType.OVERRIDE,
  '合并': TokenType.MERGE,
  '报错': TokenType.ERROR,
  '来源': TokenType.FROM,
  '参数': TokenType.WITH,
  '测试流程': TokenType.TEST_FLOW,
  '序列': TokenType.SEQUENCE,
  '调用': TokenType.CALL,
  '断言': TokenType.ASSERT,
  
  // 英文关键字（兼容）
  'SCENARIO': TokenType.SCENARIO,
  'FUNCTION': TokenType.FUNCTION,
  'TEST_POINT': TokenType.TEST_POINT,
  'ACTION_FACTOR': TokenType.ACTION_FACTOR,
  'DATA_FACTOR': TokenType.DATA_FACTOR,
  'TEST_CASE': TokenType.TEST_CASE,
  'PRECONDITION': TokenType.PRECONDITION,
  'TEST_STEP': TokenType.TEST_STEP,
  'EXPECTED_RESULT': TokenType.EXPECTED_RESULT,
  'EXTENDS': TokenType.EXTENDS,
  'IMPORT': TokenType.IMPORT,
  'EXPORT': TokenType.EXPORT,
  'ABSTRACT': TokenType.ABSTRACT,
  'DESCRIPTION': TokenType.DESCRIPTION,
  'FROM': TokenType.FROM,
  'WITH': TokenType.WITH,
  'AS': TokenType.AS,
};
```

### 3.4 UTL文件组织

```
workspace/
├── 场景/                    # 场景模块（中文目录名）
│   ├── 登录场景.utl
│   ├── 注册场景.utl
│   └── 支付场景.utl
│
├── 功能/                    # 功能模块
│   ├── 认证/
│   │   ├── 密码登录.utl
│   │   ├── 短信登录.utl
│   │   └── 登出.utl
│   └── 订单/
│       ├── 创建订单.utl
│       └── 取消订单.utl
│
├── 因子/                    # 可复用因子
│   ├── 通用动作.utl
│   └── 测试数据.utl
│
├── 流程/                    # 测试流程
│   └── 用户旅程.utl
│
└── 主入口.utl              # 主入口文件
```

### 3.5 AST结构

```typescript
interface UTLModule {
  type: 'module';
  imports: ImportStatement[];
  exports: ExportStatement[];
  definitions: DefinitionNode[];
}

interface ImportStatement {
  type: 'import';
  kind: '场景' | '功能' | '因子' | '流程';
  name: string;
  from: string;
  alias?: string;
}

interface ScenarioDef {
  type: '场景';
  name: string;
  description?: string;
  abstractFunctions: string[];
  actionFactors: ActionFactorDef[];
  dataFactors: DataFactorDef[];
}

interface FunctionDef {
  type: '功能';
  name: string;
  description?: string;
  extends: string[];
  mergeStrategy: '覆盖' | '合并' | '报错';
  actionFactors: ActionFactorDef[];
  dataFactors: DataFactorDef[];
  testPoints: TestPointDef[];
}

interface TestPointDef {
  type: '测试点';
  name: string;
  testCases: TestCaseDef[];
}

interface TestCaseDef {
  type: '测试用例';
  name: string;
  preconditions: string[];
  testSteps: string[];
  expectedResults: string[];
}

interface ActionFactorDef {
  type: '动作因子';
  name: string;
  template?: string;  // 如 "输入用户名: {用户名}"
}

interface DataFactorDef {
  type: '数据因子';
  name: string;
  defaultValue?: string;
}

interface InheritanceRelation {
  id: string;
  childId: string;
  parentId: string;
  type: '继承' | '实现' | '引用';
  mergeStrategy: '覆盖' | '合并' | '报错';
  resolvedFields: string[];
}
```

---

## 四、数据模型

### 4.1 用户与工作区

```typescript
interface User {
  id: string;
  username: string;
  passwordHash: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  collaborators: Collaborator[];
  createdAt: Date;
  updatedAt: Date;
}

interface Collaborator {
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: Date;
}
```

### 4.2 脑图与节点

```typescript
interface Mindmap {
  id: string;
  name: string;
  workspaceId: string;
  rootNodeId?: string;
  utlSource?: string;
  currentBranchId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Node {
  id: string;
  type: NodeType;
  name: string;
  description?: string;
  workspaceId: string;
  mindmapId: string;
  parentId?: string;
  position: { x: number; y: number };
  metadata: NodeMetadata;
  versionId: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

enum NodeType {
  场景 = 'scenario',
  功能 = 'function',
  测试点 = 'test_point',
  动作因子 = 'action_factor',
  数据因子 = 'data_factor',
  测试用例 = 'test_case',
  预制条件 = 'precondition',
  测试步骤 = 'test_step',
  预期结果 = 'expected_result'
}

interface NodeMetadata {
  extendsNodes?: string[];
  mergeStrategy?: '覆盖' | '合并' | '报错';
  defaultValue?: string;
  preconditions?: string[];
  testSteps?: TestStep[];
  expectedResults?: string[];
  testResult?: TestResult;
  [key: string]: any;
}
```

### 4.3 版本控制（含分支）

```typescript
interface Branch {
  id: string;
  mindmapId: string;
  name: string;
  description?: string;
  parentBranchId?: string;      // 分支来源
  headVersionId: string;        // 当前HEAD版本
  authorId: string;
  status: 'active' | 'merged' | 'archived';
  mergedTo?: string;            // 合并到的目标分支ID
  mergedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Version {
  id: string;
  mindmapId: string;
  branchId: string;
  versionNumber: string;        // 如 "v1.0.0", "v1.1.0"
  message: string;
  authorId: string;
  parentVersionId?: string;     // 父版本（同一分支内）
  
  // 快照
  snapshot: VersionSnapshot;
  
  // 变更统计
  diff?: VersionDiff;
  
  createdAt: Date;
  tags?: string[];
}

interface VersionSnapshot {
  nodes: Node[];
  relations: Relation[];
  utlSource?: string;
}

interface VersionDiff {
  added: string[];
  modified: string[];
  deleted: string[];
  relationsChanged: number;
}

// 分支合并
interface MergeRequest {
  id: string;
  sourceBranchId: string;
  targetBranchId: string;
  title: string;
  description?: string;
  authorId: string;
  status: 'open' | 'approved' | 'rejected' | 'merged' | 'closed';
  reviewers: string[];
  approvedBy?: string[];
  mergedBy?: string;
  mergedAt?: Date;
  createdAt: Date;
}

interface MergeConflict {
  id: string;
  nodeId: string;
  sourceVersion: Node;
  targetVersion: Node;
  resolution?: 'source' | 'target' | 'manual';
  resolvedBy?: string;
  resolvedAt?: Date;
}
```

### 4.4 实时协作

```typescript
interface CollaborationSession {
  id: string;
  mindmapId: string;
  branchId: string;
  participants: Participant[];
  createdAt: Date;
}

interface Participant {
  userId: string;
  color: string;
  cursor: Position;
  selectedNode?: string;
  editingNode?: string;
  editingField?: string;
  joinedAt: Date;
  lastActiveAt: Date;
}

interface EditLock {
  nodeId: string;
  userId: string;
  field: string;
  acquiredAt: Date;
  expiresAt: Date;
}

interface Operation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move';
  userId: string;
  nodeId?: string;
  payload: any;
  timestamp: Date;
  applied: boolean;
}
```

### 4.5 测试结果

```typescript
interface TestResult {
  testCaseId: string;
  status: '未测试' | '通过' | '失败' | '阻塞' | '跳过';
  executedAt?: Date;
  executedBy?: string;
  environment?: EnvironmentInfo;
  duration?: number;
  issues: Issue[];
  attachments?: Attachment[];
  notes?: string;
}

interface Issue {
  id: string;
  testCaseId: string;
  title: string;
  description: string;
  severity: '致命' | '严重' | '一般' | '建议';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: '新建' | '处理中' | '已解决' | '已关闭' | ' reopened';
  reportedBy: string;
  reportedAt: Date;
  assignedTo?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
  resolutionType?: '已修复' | '不修复' | '重复' | '无效';
  screenshots?: string[];
  relatedNodes?: string[];
}

interface TestResultSummary {
  total: number;
  untested: number;
  passed: number;
  failed: number;
  blocked: number;
  skipped: number;
  passRate: number;
  issues: {
    total: number;
    open: number;
    critical: number;
    major: number;
  };
  byNodeType: Record<string, TestResultSummary>;
}
```

---

## 五、API设计

### 5.1 RESTful API

```
认证模块
├── POST   /api/auth/login              # 登录，返回JWT
├── POST   /api/auth/register           # 注册新用户 ✅ 已实现
├── POST   /api/auth/logout             # 登出
└── GET    /api/auth/me                 # 当前用户信息

工作区模块
├── GET    /api/workspaces              # 工作区列表（含用户角色信息） ✅ 已实现
├── POST   /api/workspaces              # 创建工作区
├── GET    /api/workspaces/:id          # 工作区详情
├── PUT    /api/workspaces/:id          # 更新工作区名称（仅所有者） ✅ 已实现
├── DELETE /api/workspaces/:id          # 删除工作区（仅所有者）
├── GET    /api/workspaces/:id/collaborators  # 获取协作者列表 ✅ 已实现
├── POST   /api/workspaces/:id/collaborators  # 邀请成员（仅所有者） ✅ 已实现
├── PUT    /api/workspaces/:id/collaborators/:uid  # 更新成员角色 ✅ 已实现
└── DELETE /api/workspaces/:id/collaborators/:uid # 移除成员（仅所有者） ✅ 已实现

脑图模块
├── GET    /api/mindmaps/workspace/:id  # 工作区下的脑图 ✅ 已实现
├── POST   /api/mindmaps/workspace/:id  # 创建脑图
├── GET    /api/mindmaps/:id            # 脑图详情（含节点和关系）
├── PUT    /api/mindmaps/:id            # 更新脑图（含utlSource）
├── DELETE /api/mindmaps/:id            # 删除脑图
├── POST   /api/mindmaps/:id/export     # 导出UTL ✅ 已实现
├── POST   /api/mindmaps/:id/import     # 导入UTL（含语法验证） ✅ 已实现

导入导出模块 ✅ 已实现
├── POST   /api/import/mindmap/:id/import  # 导入UTL文件创建节点
├── GET    /api/import/mindmap/:id/export  # 导出UTL文件
├── POST   /api/import/parse              # 解析UTL源码
├── POST   /api/import/validate           # 验证UTL语法

节点模块
├── GET    /api/nodes/mindmap/:id       # 获取节点列表 ✅ 已实现
├── POST   /api/nodes/mindmap/:id       # 创建节点 ✅ 已实现
├── GET    /api/nodes/:id               # 节点详情
├── PUT    /api/nodes/:id               # 更新节点（位置、名称等） ✅ 已实现
├── DELETE /api/nodes/:id               # 删除节点 ✅ 已实现
├── POST   /api/nodes/:id/extend        # 设置继承
├── GET    /api/nodes/:id/inheritance   # 获取继承链

关系模块
├── GET    /api/relations/mindmap/:id   # 关系列表 ✅ 已实现
├── POST   /api/relations               # 创建关系 ✅ 已实现
├── PUT    /api/relations/:id           # 更新关系类型 ✅ 已实现
├── DELETE /api/relations/:id           # 删除关系 ✅ 已实现

分支模块
├── GET    /api/branches/mindmap/:id    # 获取脑图的分支列表 ✅ 已实现
├── POST   /api/branches/mindmap/:id    # 创建新分支 ✅ 已实现
├── GET    /api/branches/:id            # 分支详情（含版本历史） ✅ 已实现
├── PUT    /api/branches/:id            # 更新分支名称/描述
├── DELETE /api/branches/:id            # 删除分支（仅active状态）
├── POST   /api/branches/:id/checkout   # 切换到该分支 ✅ 已实现
├── POST   /api/branches/:id/merge      # 合并分支到当前分支 ✅ 已实现
├── GET    /api/branches/:id/conflicts  # 获取冲突

版本模块
├── GET    /api/versions/branch/:id     # 获取分支的版本历史 ✅ 已实现
├── POST   /api/versions/branch/:id     # 创建新版本快照 ✅ 已实现
├── GET    /api/versions/:id            # 版本详情 ✅ 已实现
├── POST   /api/versions/:id/restore    # 恢复到该版本 ✅ 已实现
├── GET    /api/versions/:id1/diff/:id2 # 版本对比 ✅ 已实现
├── DELETE /api/versions/:id            # 删除版本（仅draft）

合并请求模块（待实现）
├── GET    /api/mindmaps/:mid/merge-requests    # MR列表
├── POST   /api/mindmaps/:mid/merge-requests    # 创建MR
├── GET    /api/merge-requests/:id              # MR详情
├── PUT    /api/merge-requests/:id              # 更新MR
├── POST   /api/merge-requests/:id/approve      # 批准MR
├── POST   /api/merge-requests/:id/merge        # 执行合并
├── POST   /api/merge-requests/:id/close        # 关闭MR

测试结果模块
├── POST   /api/results/testcase/:id   # 提交/更新测试结果 ✅ 已实现
├── GET    /api/results/testcase/:id   # 获取用例测试结果 ✅ 已实现
├── GET    /api/results/mindmap/:id/summary  # 测试统计汇总 ✅ 已实现
├── POST   /api/results/issue          # 创建问题 ✅ 已实现
├── GET    /api/results/issue          # 问题列表（支持筛选） ✅ 已实现
├── GET    /api/results/issue/:id      # 问题详情 ✅ 已实现
├── PUT    /api/results/issue/:id      # 更新问题状态 ✅ 已实现
├── DELETE /api/results/issue/:id      # 删除问题 ✅ 已实现
├── POST   /api/attachments            # 上传附件
├── DELETE /api/attachments/:id        # 删除附件
```

### 5.2 WebSocket事件

```typescript
// 客户端 -> 服务端
type ClientEvent =
  | { type: 'join_mindmap'; mindmapId: string; branchId: string }
  | { type: 'leave_mindmap' }
  | { type: 'cursor_move'; position: Position; nodeId?: string }
  | { type: 'node_select'; nodeId: string }
  | { type: 'node_edit_start'; nodeId: string; field: string }
  | { type: 'node_edit_end'; nodeId: string }
  | { type: 'node_create'; node: NodeCreateInput }
  | { type: 'node_update'; nodeId: string; changes: Partial<Node> }
  | { type: 'node_delete'; nodeId: string }
  | { type: 'relation_create'; relation: RelationCreateInput }
  | { type: 'relation_delete'; relationId: string }
  | { type: 'version_create'; message: string }
  | { type: 'branch_checkout'; branchId: string }  // 新增：分支切换
  | { type: 'branch_changed'; branchId: string }   // 新增：分支变化通知
  | { type: 'chat_message'; content: string };

// 服务端 -> 客户端
type ServerEvent =
  | { type: 'user_joined'; userId: string; username: string; color: string }
  | { type: 'user_left'; userId: string }
  | { type: 'users_list'; users: OnlineUser[] }           // 新增：在线用户列表
  | { type: 'user_cursor'; userId: string; position: Position }
  | { type: 'user_selecting'; userId: string; nodeId: string }
  | { type: 'user_editing'; userId: string; nodeId: string; field: string }
  | { type: 'node_created'; node: Node; by: string }
  | { type: 'node_updated'; nodeId: string; changes: Partial<Node>; by: string }
  | { type: 'node_deleted'; nodeId: string; by: string }
  | { type: 'relation_created'; relation: Relation; by: string }
  | { type: 'relation_deleted'; relationId: string; by: string }
  | { type: 'version_created'; version: Version; by: string }
  | { type: 'branch_switched'; branchId: string; by: string }
  | { type: 'branch_changed'; branchId: string; by: string }  // 新增：广播分支变化
  | { type: 'sync_state'; state: MindmapState }
  | { type: 'conflict_detected'; conflict: ConflictInfo }
  | { type: 'edit_locked'; nodeId: string; userId: string }   // 新增：编辑锁定通知
  | { type: 'chat_message'; from: string; content: string; timestamp: Date };
```

**已实现的WebSocket事件：**

| 事件 | 方向 | 说明 |
|------|------|------|
| `join_mindmap` | 客户端→服务端 | 加入脑图协作房间 |
| `leave_mindmap` | 客户端→服务端 | 离开协作房间 |
| `user_joined` | 服务端→客户端 | 用户加入通知 |
| `user_left` | 服务端→客户端 | 用户离开通知 |
| `users_list` | 服务端→客户端 | 当前在线用户列表 |
| `cursor_move` | 客户端→服务端 | 光标位置同步 |
| `node_update` | 客户端→服务端 | 节点更新广播 |
| `node_create` | 客户端→服务端 | 节点创建广播 |
| `node_delete` | 客户端→服务端 | 节点删除广播 |
| `relation_create` | 客户端→服务端 | 关系创建广播 |
| `relation_delete` | 客户端→服务端 | 关系删除广播 |
| `branch_checkout` | 客户端→服务端 | 分支切换广播 |
| `branch_changed` | 服务端→客户端 | 分支变化通知 |
| `chat_message` | 双向 | 聊天消息 |
| `edit_locked` | 服务端→客户端 | 编辑锁定通知 |

### 5.3 MCP工具

```json
{
  "tools": [
    // 节点操作
    { "name": "创建节点" },
    { "name": "更新节点" },
    { "name": "删除节点" },
    { "name": "查询节点" },
    
    // 继承操作
    { "name": "设置继承" },
    { "name": "解析继承链" },
    
    // 关系操作
    { "name": "创建关系" },
    { "name": "删除关系" },
    
    // 脑图操作
    { "name": "加载脑图" },
    { "name": "保存脑图" },
    
    // UTL操作
    { "name": "解析UTL" },
    { "name": "生成UTL" },
    { "name": "验证UTL" },
    
    // 分支操作
    { "name": "创建分支" },
    { "name": "切换分支" },
    { "name": "合并分支" },
    { "name": "获取分支列表" },
    { "name": "获取冲突" },
    { "name": "解决冲突" },
    
    // 版本操作
    { "name": "创建版本" },
    { "name": "获取版本列表" },
    { "name": "恢复版本" },
    { "name": "版本对比" },
    
    // 协作操作
    { "name": "加入协作" },
    { "name": "离开协作" },
    { "name": "锁定节点" },
    { "name": "解锁节点" },
    
    // 测试结果
    { "name": "提交测试结果" },
    { "name": "查询测试结果" },
    { "name": "创建问题" },
    { "name": "更新问题" },
    { "name": "获取测试统计" }
  ]
}
```

---

## 六、前端架构

### 6.1 技术栈

| 技术 | 选型 | 说明 |
|------|------|------|
| 框架 | React 18 + TypeScript | 主流稳定 |
| 状态管理 | Zustand | 轻量高效 |
| 脑图渲染 | AntV G6 | 支持复杂关系图 |
| 代码编辑 | Monaco Editor | 支持自定义语法高亮 |
| UI组件 | Ant Design | 企业级组件库 |
| HTTP | Axios | 主流HTTP客户端 |
| WebSocket | Socket.io-client | 实时通信 |
| MCP | @modelcontextprotocol/sdk | 官方SDK |

### 6.2 页面结构

```
App
├── AuthProvider               # 认证上下文
├── CollaborationProvider      # 协作上下文
├── VersionProvider            # 版本/分支上下文
│
├── Layout
│   ├── Sidebar（左侧）
│   │   ├── WorkspaceSelector     # 工作区选择
│   │   ├── BranchSelector        # 分支选择
│   │   ├── VersionHistory        # 版本历史
│   │   ├── MindmapTree           # 脑图树
│   │   └── NodeTree              # 节点树
│   │
│   └── MainContent（右侧）
│       ├── EditorToolbar
│       │   ├── ModeSwitcher         # 三模式切换
│       │   ├── BranchActions        # 分支操作
│       │   ├── VersionActions       # 版本操作
│       │   └── CollaborationStatus  # 协作状态
│       │
│       ├── EditorArea
│       │   ├── MindmapEditor        # 脑图模式
│       │   │   ├── Canvas
│       │   │   ├── NodeRenderer
│       │   │   ├── RelationRenderer
│       │   │   ├── InheritanceLines # 继承连线
│       │   │   └── UserCursors      # 协作光标
│       │   │
│       │   ├── UTLScriptEditor      # 脚本模式
│       │   │   ├── MonacoEditor
│       │   │   ├── ChineseSyntaxHL  # 中文语法高亮
│       │   │   └── ErrorMarkers
│       │   │
│       │   └── SplitEditor          # 分屏模式
│       │       ├── MindmapPanel
│       │       ├── ScriptPanel
│       │       └── SyncController   # 双向同步
│       │
│       ├── RightPanel
│       │   ├── PropertyPanel        # 属性编辑
│       │   ├── InheritanceView      # 继承关系
│       │   ├── TestResultPanel      # 测试结果
│       │   └── IssuePanel           # 问题管理
│       │
│       └── BottomPanel
│       │   ├── BranchGraph          # 分支图形
│       │   ├── VersionTimeline      # 版本时间线
│       │   ├── MergeRequestList     # 合并请求
│       │   ├── IssueList            # 问题列表
│       │   └── CollaborationChat    # 协作聊天
│       │
│       └── StatusBar
│       │   ├── OnlineUsers          # 在线用户
│       │   ├── SyncStatus           # 同步状态
│       │   ├── CurrentBranch        # 当前分支
│       │   ├── CurrentVersion       # 当前版本
│       │   └── TestResultStats      # 测试统计
│       │
└── Modals
    ├── LoginModal                 # 登录
    ├── CreateBranchModal          # 创建分支
    ├── MergeRequestModal          # 合并请求
    ├── CreateVersionModal         # 创建版本
    ├── TestResultModal            # 测试结果
    ├── IssueModal                 # 问题详情
    └── ConflictResolveModal       # 冲突解决
```

### 6.3 状态管理

```typescript
// stores/authStore.ts
interface AuthStore {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// stores/workspaceStore.ts
interface WorkspaceStore {
  currentWorkspace: Workspace | null;
  mindmaps: Mindmap[];
  currentMindmap: Mindmap | null;
  selectWorkspace: (id: string) => void;
  selectMindmap: (id: string) => void;
}

// stores/editorStore.ts
interface EditorStore {
  mode: 'mindmap' | 'script' | 'split';
  layoutMode: 'free' | 'constrained';
  mindmapState: {
    canvas: CanvasState;
    selectedNodes: string[];
    zoom: number;
    pan: Position;
  };
  scriptState: {
    content: string;
    cursor: Position;
    errors: ParseError[];
  };
  splitState: {
    ratio: number;
    syncEnabled: boolean;
  };
  switchMode: (mode: EditorMode) => void;
  setLayoutMode: (mode: 'free' | 'constrained') => void;
  syncFromMindmap: () => void;
  syncFromScript: () => void;
}

// stores/branchStore.ts
interface BranchStore {
  branches: Branch[];
  currentBranch: Branch | null;
  mergeRequests: MergeRequest[];
  conflicts: MergeConflict[];
  
  createBranch: (name: string, parentBranchId?: string) => Promise<Branch>;
  switchBranch: (branchId: string) => Promise<void>;
  mergeBranch: (sourceId: string, targetId: string) => Promise<void>;
  createMergeRequest: (data: MergeRequestInput) => Promise<MergeRequest>;
  resolveConflict: (conflictId: string, resolution: string) => Promise<void>;
}

// stores/versionStore.ts
interface VersionStore {
  versions: Version[];
  currentVersion: Version | null;
  diffResult: VersionDiff | null;
  
  createVersion: (message: string) => Promise<Version>;
  restoreVersion: (versionId: string) => Promise<void>;
  compareVersions: (fromId: string, toId: string) => Promise<VersionDiff>;
}

// stores/collaborationStore.ts
interface CollaborationStore {
  onlineUsers: OnlineUser[];
  userCursors: Map<string, CursorState>;
  editLocks: Map<string, EditLock>;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'conflict';
  chatMessages: ChatMessage[];
  
  joinMindmap: (mindmapId: string, branchId: string) => void;
  leaveMindmap: () => void;
  broadcastChange: (change: Change) => void;
  lockNode: (nodeId: string, field: string) => boolean;
  unlockNode: (nodeId: string) => void;
  sendChat: (content: string) => void;
}

// stores/testResultStore.ts
interface TestResultStore {
  results: Map<string, TestResult>;
  summary: TestResultSummary | null;
  issues: Issue[];
  
  submitResult: (testCaseId: string, result: TestResultInput) => Promise<void>;
  createIssue: (testCaseId: string, issue: IssueInput) => Promise<Issue>;
  updateIssue: (issueId: string, updates: Partial<Issue>) => Promise<void>;
  loadSummary: (mindmapId: string) => Promise<void>;
}
```

---

## 七、后端架构

### 7.1 技术栈

| 技术 | 选型 | 说明 |
|------|------|------|
| 运行时 | Node.js 20 LTS | 稳定版本 |
| 框架 | Express | 主流Web框架 |
| 数据库 | PostgreSQL | 关系型数据库 |
| 缓存 | Redis | 会话/缓存/协作锁 |
| ORM | Prisma | 类型安全 |
| WebSocket | Socket.io | 实时通信 |
| MCP | @modelcontextprotocol/sdk | 官方SDK |

### 7.2 服务模块结构

```
packages/utl-server/src/
├── server.ts                    # 入口
│
├── mcp/                         # MCP协议层
│   ├── server.ts               # MCP Server实例
│   └── tools/
│   │   ├── nodeTools.ts        # 节点工具
│   │   ├── relationTools.ts    # 关系工具
│   │   ├── branchTools.ts      # 分支工具
│   │   ├── versionTools.ts     # 版本工具
│   │   ├── utlTools.ts         # UTL工具
│   │   ├── collaborationTools.ts # 协作工具
│   │   └── testResultTools.ts  # 测试结果工具
│   └── resources/
│   │   ├── mindmapResource.ts
│   │   └── branchResource.ts
│
├── api/                         # REST API层
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── workspace.ts
│   │   ├── mindmap.ts
│   │   ├── node.ts
│   │   ├── relation.ts
│   │   ├── branch.ts
│   │   ├── version.ts
│   │   ├── mergeRequest.ts
│   │   ├── collaboration.ts
│   │   └── testResult.ts
│   └── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│
├── websocket/                   # WebSocket层
│   ├── server.ts
│   └── handlers/
│   │   ├── mindmapHandler.ts
│   │   └── collaborationHandler.ts
│   └── middleware/
│   │   ├── auth.ts
│   │   └── rateLimiter.ts
│
├── services/                    # 业务逻辑
│   ├── authService.ts
│   ├── workspaceService.ts
│   ├── mindmapService.ts
│   ├── nodeService.ts
│   ├── relationService.ts
│   ├── branchService.ts
│   ├── mergeService.ts
│   ├── versionService.ts
│   ├── collaborationService.ts
│   ├── testResultService.ts
│   ├── inheritanceResolver.ts  # 继承解析
│   └── utlSyncService.ts       # UTL同步
│
├── models/                      # 数据模型
│   ├── User.ts
│   ├── Workspace.ts
│   ├── Mindmap.ts
│   ├── Node.ts
│   ├── Relation.ts
│   ├── Branch.ts
│   ├── Version.ts
│   ├── MergeRequest.ts
│   ├── MergeConflict.ts
│   ├── CollaborationSession.ts
│   ├── TestResult.ts
│   └── Issue.ts
│
└── db/                          # 数据库
    ├── client.ts
    ├── schema.prisma
    └── migrations/
```

---

## 八、UTL语言引擎

### 8.1 模块结构

```
packages/utl-language/src/
├── lexer/                       # 词法分析
│   ├── tokenizer.ts            # 分词器
│   ├── tokens.ts               # Token定义（含中文关键字）
│   └── chineseSupport.ts       # 中文识别支持
│
├── parser/                      # 语法分析
│   ├── parser.ts               # 解析器
│   ├── grammar.ts              # 语法定义
│   └── astBuilder.ts           # AST构建
│
├── ast/                         # AST定义
│   ├── nodes.ts                # AST节点类型
│   ├── visitor.ts              # 访问者模式
│   └── transformer.ts          # AST转换
│
├── semantic/                    # 语义分析
│   ├── analyzer.ts             # 语义分析器
│   ├── inheritanceResolver.ts  # 继承解析器
│   ├── moduleLoader.ts         # 模块加载器
│   ├── symbolTable.ts          # 符号表
│   └── errorCollector.ts       # 错误收集
│
├── codegen/                     # 代码生成
│   ├── jsonGenerator.ts        # AST -> JSON
│   ├── utlGenerator.ts         # JSON -> UTL（中文输出）
│   └── mindmapSync.ts          # 双向同步引擎
│
├── utils/
│   ├── utf8.ts                 # UTF-8处理
│   └── chineseTextUtils.ts     # 中文文本工具
│
└── index.ts                     # 入口导出
```

### 8.2 词法分析器（中文支持）

```typescript
// lexer/tokenizer.ts
export class UTLTokenizer {
  private source: string;
  private position: number;
  private tokens: Token[];
  
  // 中文关键字映射
  private chineseKeywords: Map<string, TokenType>;
  private englishKeywords: Map<string, TokenType>;
  
  constructor(source: string) {
    this.source = source;
    this.chineseKeywords = this.buildChineseKeywords();
    this.englishKeywords = this.buildEnglishKeywords();
  }
  
  // 判断是否为中文字符
  private isChineseChar(char: string): boolean {
    const code = char.charCodeAt(0);
    return code >= 0x4E00 && code <= 0x9FFF;
  }
  
  // 读取中文标识符/关键字
  private readChineseToken(): Token {
    let value = '';
    while (this.isChineseChar(this.currentChar)) {
      value += this.currentChar;
      this.advance();
    }
    
    // 检查是否为关键字
    const type = this.chineseKeywords.get(value) || TokenType.IDENTIFIER;
    return { type, value, position: this.position };
  }
  
  // 双语关键字识别
  tokenize(): Token[] {
    while (!this.isEOF()) {
      const char = this.currentChar;
      
      if (this.isChineseChar(char)) {
        this.tokens.push(this.readChineseToken());
      } else if (this.isAlpha(char)) {
        this.tokens.push(this.readEnglishToken());
      } else if (this.isDigit(char)) {
        this.tokens.push(this.readNumber());
      } else if (char === '"') {
        this.tokens.push(this.readString());
      } else {
        this.tokens.push(this.readSymbol());
      }
    }
    
    return this.tokens;
  }
}
```

### 8.3 继承解析器

```typescript
// semantic/inheritanceResolver.ts
export class InheritanceResolver {
  private symbolTable: SymbolTable;
  private moduleLoader: ModuleLoader;
  
  // 解析继承链
  resolveInheritance(node: FunctionDef): ResolvedFunction {
    const inheritanceChain = this.buildInheritanceChain(node);
    
    // 根据合并策略处理字段
    const resolved = this.mergeWithStrategy(
      node,
      inheritanceChain,
      node.mergeStrategy
    );
    
    return resolved;
  }
  
  // 构建继承链（支持多继承）
  private buildInheritanceChain(node: FunctionDef): FunctionDef[] {
    const chain: FunctionDef[] = [];
    
    for (const parentRef of node.extends) {
      const parent = this.resolveReference(parentRef);
      if (parent) {
        // 递归解析父节点的继承
        chain.push(...this.buildInheritanceChain(parent));
        chain.push(parent);
      }
    }
    
    return chain;
  }
  
  // 合并策略处理
  private mergeWithStrategy(
    node: FunctionDef,
    chain: FunctionDef[],
    strategy: '覆盖' | '合并' | '报错'
  ): ResolvedFunction {
    switch (strategy) {
      case '覆盖':
        // 子节点覆盖父节点字段
        return this.applyOverride(node, chain);
        
      case '合并':
        // 合并父子节点字段（去重）
        return this.applyMerge(node, chain);
        
      case '报错':
        // 检查冲突，有冲突则报错
        return this.applyWithError(node, chain);
    }
  }
  
  // 覆盖策略：子节点优先
  private applyOverride(node: FunctionDef, chain: FunctionDef[]): ResolvedFunction {
    const merged = { ...node };
    
    for (const parent of chain) {
      // 父节点字段作为基础
      for (const field of Object.keys(parent)) {
        if (!(field in merged)) {
          merged[field] = parent[field];
        }
      }
    }
    
    return merged;
  }
  
  // 合并策略：数组字段合并，其他覆盖
  private applyMerge(node: FunctionDef, chain: FunctionDef[]): ResolvedFunction {
    const merged = { ...node };
    
    for (const parent of chain) {
      // 数组字段合并
      merged.actionFactors = [...parent.actionFactors, ...merged.actionFactors];
      merged.dataFactors = [...parent.dataFactors, ...merged.dataFactors];
      
      // 非数组字段覆盖
      for (const field of Object.keys(parent)) {
        if (!Array.isArray(parent[field]) && !(field in merged)) {
          merged[field] = parent[field];
        }
      }
    }
    
    return merged;
  }
}
```

### 8.4 双向同步引擎

```typescript
// codegen/mindmapSync.ts
export class MindmapSyncEngine {
  private parser: UTLParser;
  private generator: UTLGenerator;
  
  // UTL -> 脑图数据
  parseToMindmap(utlSource: string): MindmapData {
    const tokens = this.parser.tokenize(utlSource);
    const ast = this.parser.parse(tokens);
    const resolved = this.parser.resolveInheritance(ast);
    
    return this.generator.toMindmapData(resolved);
  }
  
  // 脑图数据 -> UTL（中文输出）
  generateUTL(mindmapData: MindmapData): string {
    const ast = this.generator.toAST(mindmapData);
    return this.generator.toUTLSource(ast, { language: 'chinese' });
  }
  
  // 增量同步：脑图操作 -> UTL源码变更
  syncFromMindmapChange(
    oldSource: string,
    node: Node,
    change: NodeChange
  ): UTLChange {
    const position = this.findNodePositionInSource(oldSource, node.id);
    const newText = this.generateNodeSource(node, change);
    
    return {
      start: position.start,
      end: position.end,
      newText: newText
    };
  }
  
  // 增量同步：UTL编辑 -> 脑图变更
  syncFromUTLChange(
    oldSource: string,
    newSource: string
  ): MindmapChange[] {
    const oldData = this.parseToMindmap(oldSource);
    const newData = this.parseToMindmap(newSource);
    
    return this.diffMindmapData(oldData, newData);
  }
  
  // 脑图数据差异计算
  private diffMindmapData(
    oldData: MindmapData,
    newData: MindmapData
  ): MindmapChange[] {
    const changes: MindmapChange[] = [];
    
    // 检查新增节点
    for (const node of newData.nodes) {
      if (!oldData.nodes.find(n => n.id === node.id)) {
        changes.push({ type: 'create', node });
      }
    }
    
    // 检查删除节点
    for (const node of oldData.nodes) {
      if (!newData.nodes.find(n => n.id === node.id)) {
        changes.push({ type: 'delete', nodeId: node.id });
      }
    }
    
    // 检查修改节点
    for (const newNode of newData.nodes) {
      const oldNode = oldData.nodes.find(n => n.id === newNode.id);
      if (oldNode && !this.nodesEqual(oldNode, newNode)) {
        changes.push({ type: 'update', nodeId: newNode.id, changes: newNode });
      }
    }
    
    return changes;
  }
}
```

---

## 九、数据库设计

### 9.1 Schema（Prisma）

```prisma
// db/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 用户
model User {
  id            String    @id @default(uuid())
  username      String    @unique
  passwordHash  String
  email         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  workspaces    Workspace[]
  collaborations Collaborator[]
  testResults   TestResult[]
  issues        Issue[]
  branches      Branch[]
  versions      Version[]
  mergeRequests MergeRequest[]
}

// 工作区
model Workspace {
  id        String   @id @default(uuid())
  name      String
  ownerId   String
  owner     User     @relation(fields: [ownerId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  mindmaps   Mindmap[]
  collaborators Collaborator[]
}

// 协作者
model Collaborator {
  id          String   @id @default(uuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  role        String   @default("viewer") // owner, admin, editor, viewer
  joinedAt    DateTime @default(now())
  
  @@unique([workspaceId, userId])
}

// 脑图
model Mindmap {
  id            String   @id @default(uuid())
  name          String
  workspaceId   String
  workspace     Workspace @relation(fields: [workspaceId], references: [id])
  rootNodeId    String?
  utlSource     String?
  currentBranchId String @default("main")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  nodes         Node[]
  branches      Branch[]
  relations     Relation[]
  mergeRequests MergeRequest[]
}

// 分支
model Branch {
  id              String   @id @default(uuid())
  mindmapId       String
  mindmap         Mindmap  @relation(fields: [mindmapId], references: [id])
  name            String
  description     String?
  parentBranchId  String?
  parentBranch    Branch?  @relation("BranchHierarchy", fields: [parentBranchId], references: [id])
  childBranches   Branch[] @relation("BranchHierarchy")
  headVersionId   String
  authorId        String
  author          User     @relation(fields: [authorId], references: [id])
  status          String   @default("active") // active, merged, archived
  mergedTo        String?
  mergedAt        DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  versions        Version[]
  mergeRequests   MergeRequest[] @relation("SourceBranch")
  targetMRs       MergeRequest[] @relation("TargetBranch")
  
  @@unique([mindmapId, name])
}

// 版本
model Version {
  id              String   @id @default(uuid())
  mindmapId       String
  branchId        String
  branch          Branch   @relation(fields: [branchId], references: [id])
  versionNumber   String
  message         String
  authorId        String
  author          User     @relation(fields: [authorId], references: [id])
  parentVersionId String?
  parentVersion   Version? @relation("VersionHistory", fields: [parentVersionId], references: [id])
  childVersions   Version[] @relation("VersionHistory")
  
  snapshot        Json     // { nodes, relations, utlSource }
  diff            Json?
  
  createdAt       DateTime @default(now())
  tags            String[]
  
  @@unique([branchId, versionNumber])
}

// 合并请求
model MergeRequest {
  id            String   @id @default(uuid())
  mindmapId     String
  mindmap       Mindmap  @relation(fields: [mindmapId], references: [id])
  sourceBranchId String
  sourceBranch  Branch   @relation("SourceBranch", fields: [sourceBranchId], references: [id])
  targetBranchId String
  targetBranch  Branch   @relation("TargetBranch", fields: [targetBranchId], references: [id])
  title         String
  description   String?
  authorId      String
  author        User     @relation(fields: [authorId], references: [id])
  status        String   @default("open") // open, approved, rejected, merged, closed
  reviewers     String[]
  approvedBy    String[]
  mergedBy      String?
  mergedAt      DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  conflicts     MergeConflict[]
}

// 合并冲突
model MergeConflict {
  id              String   @id @default(uuid())
  mergeRequestId  String
  mergeRequest    MergeRequest @relation(fields: [mergeRequestId], references: [id])
  nodeId          String
  sourceVersion   Json
  targetVersion   Json
  resolution      String? // source, target, manual
  resolvedBy      String?
  resolvedAt      DateTime?
}

// 节点
model Node {
  id          String   @id @default(uuid())
  type        String   // scenario, function, test_point, etc.
  name        String
  description String?
  workspaceId String
  mindmapId   String
  mindmap     Mindmap  @relation(fields: [mindmapId], references: [id])
  parentId    String?
  parent      Node?    @relation("NodeHierarchy", fields: [parentId], references: [id])
  children    Node[]   @relation("NodeHierarchy")
  position    Json     // { x, y }
  metadata    Json     // { extendsNodes, mergeStrategy, defaultValue, ... }
  versionId   String
  branchId    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  relationsAsSource Relation[] @relation("RelationSource")
  relationsAsTarget Relation[] @relation("RelationTarget")
  testResults  TestResult[]
  issues       Issue[]
}

// 关系
model Relation {
  id        String   @id @default(uuid())
  sourceId  String
  source    Node     @relation("RelationSource", fields: [sourceId], references: [id])
  targetId  String
  target    Node     @relation("RelationTarget", fields: [targetId], references: [id])
  type      String   // contains, extends, references, depends_on, generates
  metadata  Json?
  createdAt DateTime @default(now())
}

// 测试结果
model TestResult {
  id          String   @id @default(uuid())
  testCaseId  String
  testCase    Node     @relation(fields: [testCaseId], references: [id])
  status      String   // untested, passed, failed, blocked, skipped
  executedAt  DateTime?
  executedBy  String?
  executor    User?    @relation(fields: [executedBy], references: [id])
  environment Json?
  duration    Int?
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  issues      Issue[]
}

// 问题
model Issue {
  id            String   @id @default(uuid())
  testCaseId    String
  testCase      Node     @relation(fields: [testCaseId], references: [id])
  testResultId  String?
  testResult    TestResult? @relation(fields: [testResultId], references: [id])
  title         String
  description   String
  severity      String   // critical, major, minor, suggestion
  priority      String   // P0, P1, P2, P3
  status        String   // open, in_progress, resolved, closed, reopened
  reportedBy    String
  reporter      User     @relation(fields: [reportedBy], references: [id])
  reportedAt    DateTime @default(now())
  assignedTo    String?
  resolvedBy    String?
  resolvedAt    DateTime?
  resolution    String?
  resolutionType String? // fixed, wont_fix, duplicate, invalid
  screenshots   String[]
  relatedNodes  String[]
  
  attachments Attachment[]
}

// 附件
model Attachment {
  id        String   @id @default(uuid())
  issueId   String
  issue     Issue    @relation(fields: [issueId], references: [id])
  name      String
  type      String   // image, video, log, file
  url       String
  uploadedBy String
  uploadedAt DateTime @default(now())
}

// 协作会话
model CollaborationSession {
  id        String   @id @default(uuid())
  mindmapId String
  branchId  String
  createdAt DateTime @default(now())
  
  participants Participant[]
}

// 参与者
model Participant {
  id              String   @id @default(uuid())
  sessionId       String
  session         CollaborationSession @relation(fields: [sessionId], references: [id])
  userId          String
  color           String
  cursor          Json?
  selectedNode    String?
  editingNode     String?
  editingField    String?
  joinedAt        DateTime @default(now())
  lastActiveAt    DateTime @default(now())
  
  @@unique([sessionId, userId])
}

// 编辑锁
model EditLock {
  id        String   @id @default(uuid())
  nodeId    String
  userId    String
  field     String
  acquiredAt DateTime @default(now())
  expiresAt DateTime
}
```

---

## 十、项目结构

```
utl-project/
├── packages/
│   ├── utl-language/              # UTL语言引擎
│   │   ├── src/
│   │   │   ├── lexer/
│   │   │   │   ├── tokenizer.ts
│   │   │   │   ├── tokens.ts
│   │   │   │   └── chineseSupport.ts
│   │   │   ├── parser/
│   │   │   │   ├── parser.ts
│   │   │   │   ├── grammar.ts
│   │   │   │   └── astBuilder.ts
│   │   │   ├── ast/
│   │   │   │   ├── nodes.ts
│   │   │   │   ├── visitor.ts
│   │   │   │   └── transformer.ts
│   │   │   ├── semantic/
│   │   │   │   ├── analyzer.ts
│   │   │   │   ├── inheritanceResolver.ts
│   │   │   │   ├── moduleLoader.ts
│   │   │   │   ├── symbolTable.ts
│   │   │   │   └── errorCollector.ts
│   │   │   ├── codegen/
│   │   │   │   ├── jsonGenerator.ts
│   │   │   │   ├── utlGenerator.ts
│   │   │   │   └── mindmapSync.ts
│   │   │   ├── utils/
│   │   │   │   ├── utf8.ts
│   │   │   │   └── chineseTextUtils.ts
│   │   │   └── index.ts
│   │   ├── tests/
│   │   │   ├── lexer.test.ts
│   │   │   ├── parser.test.ts
│   │   │   ├── inheritance.test.ts
│   │   │   └── sync.test.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── utl-server/                # 后端服务
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── mcp/
│   │   │   │   ├── server.ts
│   │   │   │   ├── tools/
│   │   │   │   └── resources/
│   │   │   ├── api/
│   │   │   │   ├── routes/
│   │   │   │   └── middleware/
│   │   │   ├── websocket/
│   │   │   │   ├── server.ts
│   │   │   │   └── handlers/
│   │   │   │   └── middleware/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   └── db/
│   │   │   │   ├── client.ts
│   │   │   │   ├── schema.prisma
│   │   │   │   └── migrations/
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── utl-client/                # 前端应用
│       ├── src/
│       │   ├── components/
│       │   │   ├── Layout/
│       │   │   ├── Editor/
│       │   │   ├── Sidebar/
│       │   │   ├── Panel/
│       │   │   ├── Collaboration/
│       │   │   ├── Version/
│       │   │   ├── Branch/
│       │   │   ├── TestResult/
│       │   │   └── Common/
│       │   ├── stores/
│       │   ├── hooks/
│       │   ├── services/
│       │   ├── types/
│       │   ├── utils/
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── public/
│       ├── tests/
│       ├── package.json
│       ├── vite.config.ts
│       └── tsconfig.json
│
├── docs/
│   ├── design.md                  # 本文档
│   ├── utl-language-spec.md       # UTL语言规范
│   ├── api-reference.md           # API文档
│   └── architecture.md            # 架构文档
│
├── .sisyphus/plans/
│   ├── 00-overview.md             # 总览
│   ├── phase-1-mvp-core.md        # Phase 1
│   ├── phase-2-utl-language.md    # Phase 2
│   ├── phase-3-collaboration.md   # Phase 3
│   ├── phase-4-version-control.md # Phase 4
│   ├── phase-5-test-management.md # Phase 5
│   ├── phase-6-integration.md     # Phase 6
│
├── package.json                   # Monorepo配置
├── tsconfig.json                  # TypeScript配置
├── .gitignore
├── .env.example
└── README.md
```

---

## 十一、开发计划

详见 `.sisyphus/plans/` 目录下的各Phase计划文档。

| Phase | 内容 | 预计周期 |
|-------|------|---------|
| Phase 1 | MVP核心：认证、工作区、节点CRUD、脑图渲染 | 2周 |
| Phase 2 | UTL语言引擎：词法/语法/语义分析、双向同步 | 2周 |
| Phase 3 | 实时协作：WebSocket、编辑锁、冲突处理 | 1周 |
| Phase 4 | 版本控制：分支管理、版本历史、合并请求 | 1周 |
| Phase 5 | 测试管理：结果标记、问题跟踪 | 1周 |
| Phase 6 | 整合测试：端到端测试、性能优化 | 1周 |

---

## 十二、技术栈汇总

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React + TypeScript | 18.x / 5.x |
| 状态管理 | Zustand | 4.x |
| 脑图渲染 | AntV G6 | 4.x |
| 代码编辑 | Monaco Editor | 0.45+ |
| UI组件 | Ant Design | 5.x |
| HTTP | Axios | 1.x |
| WebSocket | Socket.io-client | 4.x |
| 后端运行时 | Node.js | 20 LTS |
| Web框架 | Express | 4.x |
| 数据库 | PostgreSQL | 15+ |
| 缓存 | Redis | 7.x |
| ORM | Prisma | 5.x |
| WebSocket服务 | Socket.io | 4.x |
| MCP | @modelcontextprotocol/sdk | latest |

---

## 十三、Phase 1-6 已实现细节

### 13.1 前端组件实现

```
utl-client/src/components/
├── Auth/
│   └── LoginPage.tsx
│       - 渐变背景设计
│       - 登录成功后自动跳转
│       - 支持退出重登录数据保持
│       - 用户注册入口 ✅
│
├── Layout/
│   ├── Layout.tsx
│       - 左侧边栏：渐变色头部、用户头像
│       - 工作区选择器、脑图选择器
│       - 节点树组件嵌入
│       - 管理员标识显示 ✅
│   └── StatusBar.tsx
│       - 渐变背景、模式切换按钮
│       - 节点/连接统计、选中状态显示
│
├── Editor/
│   ├── MindmapEditor/Canvas.tsx
│       - 蓝图式节点编辑器
│       - 单击选中节点 ✅
│       - 双击节点：inline快速编辑 ✅
│       - 拖拽移动节点（5px阈值判断）
│       - 查看者权限限制：无法拖拽/连线 ✅
│       - parsed-节点支持（临时节点可拖动） ✅
│       - 右侧蓝色圆点：拖拽创建连线
│       - 连线默认"包含"关系
│       - 点击连线徽章：修改关系类型或删除
│       - SVG连线：节点右侧→目标节点左侧
│       - 工具栏：快速添加节点下拉菜单、删除按钮 ✅
│       - Popconfirm删除确认 ✅
│   │
│   ├── ScriptEditor.tsx
│       - Monaco编辑器（CDN加载） ✅
│       - UTL中英文语法高亮
│       - "从脑图同步"按钮（generateUTL）
│       - "同步到脑图"按钮（syncToMindmap） ✅
│       - 实时预览临时节点（parsed-前缀） ✅
│       - 分屏模式自动同步
│       - 关系同步（sourceId/targetId修正） ✅
│   │
│   ├── SplitEditor.tsx
│       - 左右分栏布局
│       - 同步开关控制
│       - 分屏比例调节
│   │
│   └── ModeSwitcher.tsx
│       - 脑图/脚本/分屏模式切换
│       - 自动路由跳转
│
├── Sidebar/
│   └── NodeTree.tsx
│       - 节点树状结构显示
│       - 按包含关系构建树
│       - 类型标签+节点名称
│       - 点击选中对应节点
│       - 每个节点右侧删除按钮 ✅
│       - 删除后同步editorStore ✅
│       - 空状态提示
│
├── Panel/
│   ├── BranchVersionPanel.tsx ✅
│       - 分支图谱树形视图
│       - 分支状态标识（活跃/已合并）
│       - 当前分支高亮显示
│       - 已合并分支不可切换
│       - 版本历史列表
│       - 版本对比功能
│       - 恢复历史版本
│       - 保存版本快照
│   │
│   ├── PropertyPanel.tsx
│       - 编辑节点属性
│       - 配置继承关系
│       - 查看因子继承
│   │
│   └── CollaborationPanel.tsx
│       - 在线用户显示
│       - 实时聊天
│       - 光标位置同步
│
└── Modals/
    ├── CreateBranchModal.tsx
    ├── MergeBranchModal.tsx
    └── SaveVersionModal.tsx
```

### 13.2 状态管理实现

```typescript
// authStore.ts - 认证状态
interface AuthState {
  user: User | null;  // 含isAdmin字段
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (username, password) => Promise<void>;
  logout: () => void;
  init: () => Promise<void>;
}
// 实现：persist中间件，退出时token保留但状态重置

// workspaceStore.ts - 工作区状态
interface WorkspaceState {
  workspaces: Workspace[];  // 含用户角色信息
  currentWorkspace: Workspace | null;
  userRole: 'owner' | 'editor' | 'viewer' | null;  // 当前用户角色 ✅
  mindmaps: Mindmap[];
  currentMindmap: Mindmap | null;
  loadWorkspaces: () => Promise<void>;
  selectWorkspace: (id) => void;
  createWorkspace: (name) => Promise<Workspace>;
  clearWorkspace: () => void;
  loadMindmaps: (workspaceId) => Promise<void>;
  selectMindmap: (id) => void;
  createMindmap: (workspaceId, name) => Promise<Mindmap>;
}

// editorStore.ts - 编辑器状态
interface EditorState {
  mode: 'mindmap' | 'script' | 'split';
  nodes: Node[];
  relations: Relation[];
  selectedNodes: string[];
  zoom: number;
  pan: { x, y };
  setMode: (mode) => void;
  setNodes: (nodes) => void;
  setRelations: (relations) => void;
  selectNode: (id) => void;
  clearSelection: () => void;
  deleteNode: (id) => void;  // 新增 ✅
}

// socketStore.ts - WebSocket状态 ✅
interface SocketState {
  socket: Socket | null;
  onlineUsers: OnlineUser[];
  isConnected: boolean;
  joinMindmap: (mindmapId, branchId) => void;
  leaveMindmap: () => void;
  emitNodeUpdate: (nodeId, changes) => void;
  emitNodeCreate: (node) => void;
  emitNodeDelete: (nodeId) => void;
  emitRelationCreate: (relation) => void;
  emitRelationDelete: (relationId) => void;
  emitBranchCheckout: (branchId) => void;
  sendChat: (content) => void;
}

// branchStore.ts - 分支状态 ✅
interface BranchState {
  branches: Branch[];
  currentBranch: Branch | null;
  versions: Version[];
  loadBranches: (mindmapId) => Promise<void>;
  checkoutBranch: (branchId) => Promise<void>;
  mergeBranch: (sourceId) => Promise<void>;
  createVersion: (message) => Promise<void>;
  restoreVersion: (versionId) => Promise<void>;
}
```

### 13.3 后端API实现

```
utl-server/src/api/routes/
├── auth.ts
│   POST /login     - 验证用户，返回JWT
│   POST /register  - 注册新用户 ✅
│   POST /logout    - 无操作（前端清除token）
│   GET  /me        - 返回当前用户信息（含isAdmin）
│
├── workspace.ts
│   GET    /        - 返回用户的工作区列表（含角色）
│   POST   /        - 创建工作区
│   PUT    /:id     - 更新名称（仅所有者） ✅
│   DELETE /:id     - 删除（仅所有者）
│   GET    /:id/collaborators  - 协作者列表 ✅
│   POST   /:id/collaborators  - 邀请成员 ✅
│   PUT    /:id/collaborators/:uid  - 更新角色 ✅
│   DELETE /:id/collaborators/:uid  - 移除成员 ✅
│
├── mindmap.ts
│   GET  /workspace/:id  - 工作区下的脑图
│   POST /workspace/:id  - 创建脑图
│   GET  /:id            - 脑图详情（含节点和关系）
│   PUT  /:id            - 更新（含utlSource）
│   DELETE /:id          - 删除
│
├── node.ts
│   GET  /mindmap/:id    - 获取节点列表
│   POST /mindmap/:id    - 创建节点
│   GET  /:id            - 节点详情
│   PUT  /:id            - 更新（位置、名称等）
│   DELETE /:id          - 删除节点
│
├── relation.ts
│   GET  /mindmap/:id    - 关系列表
│   POST /               - 创建关系
│   PUT  /:id            - 更新关系类型
│   DELETE /:id          - 删除关系
│
├── branch.ts ✅
│   GET  /mindmap/:id    - 分支列表（含层级关系）
│   POST /mindmap/:id    - 创建分支
│   GET  /:id            - 分支详情（含版本）
│   POST /:id/checkout   - 切换分支
│   POST /:id/merge      - 合并分支（使用auth用户ID）
│
├── version.ts ✅
│   GET  /branch/:id     - 版本列表
│   POST /branch/:id     - 创建版本快照
│   GET  /:id            - 版本详情
│   POST /:id/restore    - 恢复版本
│   GET  /:id1/diff/:id2 - 版本对比
│
├── results.ts ✅
│   POST /testcase/:id   - 提交测试结果
│   GET  /testcase/:id   - 获取结果
│   GET  /mindmap/:id/summary  - 统计汇总
│   POST /issue          - 创建问题
│   GET  /issue          - 问题列表
│   PUT  /issue/:id      - 更新问题
│   DELETE /issue/:id    - 删除问题
│
└── import.ts ✅
│   POST /mindmap/:id/import  - 导入UTL
│   GET  /mindmap/:id/export  - 导出UTL
│   POST /parse            - 解析UTL源码
│   POST /validate         - 验证UTL语法

middleware/
├── auth.ts
│   - JWT验证
│   - req.user设置
│
├── permission.ts ✅
│   - checkWorkspaceAccess: 检查工作区访问权限
│   - checkNodeAccess: 检查节点访问权限
│   - checkEditPermission: 检查编辑权限（viewer不可）
│   - checkOwnerPermission: 检查所有者权限
│   - req.userRole设置
```

### 13.4 数据库Schema实现

```prisma
// 已实现的14个模型
model User {
  id, username, passwordHash, email, isAdmin, createdAt, updatedAt
  // isAdmin: 管理员标识 ✅
  workspaces Workspace[]
  collaborations Collaborator[]
}

model Workspace {
  id, name, ownerId, createdAt, updatedAt
  mindmaps Mindmap[]
  collaborators Collaborator[]
}

model Collaborator {
  id, workspaceId, userId, role, joinedAt
  // role: owner/editor/viewer ✅
}

model Mindmap {
  id, name, workspaceId, utlSource, currentBranchId, createdAt, updatedAt
  nodes Node[]
  relations Relation[]
  branches Branch[]
}

model Node {
  id, type, name, description, workspaceId, mindmapId, parentId
  x, y (position) ✅
  position Json?, metadata Json?
  relationsAsSource Relation[]
  relationsAsTarget Relation[]
}

model Relation {
  id, sourceId, targetId, mindmapId, type, createdAt
  // type: contains/extends/references/depends_on
  source Node, target Node
}

model Branch ✅ 已实现
  id, mindmapId, name, description, parentBranchId
  headVersionId, authorId, status, mergedTo, mergedAt
  // status: active/merged

model Version ✅ 已实现
  id, mindmapId, branchId, versionNumber, message, authorId
  parentVersionId, snapshot (nodes/relations), diff
  // 快照包含完整节点和关系数据

model MergeRequest  // 待实现
model MergeConflict // 待实现

model TestResult ✅ 已实现
  id, testCaseId, status, executedAt, executedBy
  // status: untested/passed/failed/blocked/skipped

model Issue ✅ 已实现
  id, testCaseId, title, description, severity, priority
  status, reportedBy, assignedTo, resolvedBy
  // severity: critical/major/minor/suggestion

model Attachment  // 待实现
```

### 13.5 MCP工具实现

```typescript
// utl-server/src/mcp/tools/

// nodeTools.ts
node_create: { mindmapId, type, name, position }
node_update: { nodeId, changes }
node_delete: { nodeId }
node_query:  { mindmapId, filters }

// relationTools.ts
relation_create: { mindmapId, sourceId, targetId, type }
relation_delete: { relationId }

// mindmapTools.ts
mindmap_load: { mindmapId }
mindmap_save: { mindmapId, nodes, relations }
```

### 13.6 关键技术决策

| 决策点 | 选择 | 原因 |
|------|------|------|
| 节点渲染 | 自定义SVG | AntV G6 v5 API大改，自定义更灵活 |
| 连线方式 | SVG line | 简单直接，便于点击交互 |
| 拖拽判断 | 5px阈值 | 区分拖拽和点击编辑 |
| 节点选中 | 单击选中，双击编辑 | 更符合常见UI交互模式 ✅ |
| Monaco加载 | CDN方式 | vite-plugin-monaco-editor不兼容，CDN更稳定 ✅ |
| 状态持久化 | Zustand persist | 只存token，不存敏感数据 |
| 退出登录 | 清空workspaceStore | 确保重新登录数据刷新 |
| Prisma版本 | 5.22.0 | 7.x配置方式改变，锁定稳定版 |
| 包管理 | pnpm | npm 11 + Node 25兼容问题 |
| 权限控制 | 中间件+前端检查 | 双重保障，viewer无法编辑 ✅ |
| 分支合并 | 使用auth用户ID | 合并操作需要真实用户标识 ✅ |
| 双向同步 | syncToMindmap函数 | 代码→脑图需要显式触发 ✅ |
| 关系方向 | sourceId=父节点 | generateUTL时修正关系方向 ✅ |

### 13.7 已修复问题

| 问题 | 原因 | 解决方案 |
|------|------|------|
| Popconfirm未定义 | 缺少Antd导入 | 添加Popconfirm/Select导入 ✅ |
| WebSocket连接失败 | 连接时机过早 | 优化socketStore连接逻辑 ✅ |
| 分支合并使用system | 未使用auth用户ID | 从req.user获取真实用户 ✅ |
| 节点位置NaN | 数据库字段为null | 添加Number.isFinite安全检查 ✅ |
| 关系方向错误 | sourceId/targetId混淆 | generateUTL修正为sourceId=父节点 ✅ |
| Monaco插件报错 | ESM兼容问题 | 回退使用CDN加载 ✅ |
| Safari跟踪防护 | CDN资源访问限制 | 不影响功能，仅警告 ✅ |
| 分支图谱线性显示 | 未显示层级关系 | BranchVersionPanel改为树形视图 ✅ |
| 查看者可编辑 | 前端无权限检查 | Canvas添加isViewer判断 ✅ |

---

## 十四、后续开发路线

| Phase | 内容 | 依赖 | 优先级 |
|------|------|------|--------|
| Phase 2 | UTL继承解析引擎 | Phase 1 ✅ | 高 |
| Phase 3 | 多用户协作同步 | Phase 1 ✅ | 高 |
| Phase 4 | 分支版本控制 | Phase 2, 3 | 中 |
| Phase 5 | 测试结果管理 | Phase 1 ✅ | 中 |
| Phase 6 | 导入导出/性能优化 | Phase 1-5 | 低 |