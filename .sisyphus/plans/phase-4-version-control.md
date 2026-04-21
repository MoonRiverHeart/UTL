# Phase 4: 版本控制（含分支）

## 目标

实现Git风格的分支管理系统，版本历史，合并请求，冲突解决。

---

## 前置依赖

- Phase 1完成（节点CRUD）
- Phase 3完成（协作通信基础）

---

## 任务分解

### 4.1 分支数据模型

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 4.1.1 | Branch模型定义 | models/Branch.ts | P0 | 1h |
| 4.1.2 | 分支状态定义 | BranchStatus | P0 | 0.5h |
| 4.1.3 | 分支关系定义 | BranchHierarchy | P0 | 0.5h |
| 4.1.4 | Prisma Schema更新 | schema.prisma | P0 | 1h |
| 4.1.5 | 数据库迁移 | migration | P0 | 1h |

**产出物**:
```typescript
// models/Branch.ts
interface Branch {
  id: string;
  mindmapId: string;
  name: string;              // main, feature-xxx, hotfix-xxx
  description?: string;
  parentBranchId?: string;   // 分支来源
  headVersionId: string;     // 当前HEAD版本
  authorId: string;
  status: BranchStatus;
  mergedTo?: string;         // 合并到的目标分支ID
  mergedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

type BranchStatus = 
  | 'active'    // 活跃分支
  | 'merged'    // 已合并
  | 'archived'; // 已归档

// 分支命名规范
const BRANCH_NAME_RULES = {
  main: 'main',                           // 主分支
  feature: /^feature-[a-z0-9-]+$/,       // 功能分支
  hotfix: /^hotfix-[a-z0-9-]+$/,         // 热修复分支
  release: /^release-v[0-9.]+$/,         // 发布分支
};

// Prisma Schema
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
  status          String   @default("active")
  mergedTo        String?
  mergedAt        DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  versions        Version[]
  
  @@unique([mindmapId, name])
}
```

---

### 4.2 分支管理API

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 4.2.1 | 分支列表API | GET /branches | P0 | 1h |
| 4.2.2 | 创建分支API | POST /branches | P0 | 2h |
| 4.2.3 | 切换分支API | POST /branches/:id/checkout | P0 | 2h |
| 4.2.4 | 分支详情API | GET /branches/:id | P0 | 1h |
| 4.2.5 | 删除分支API | DELETE /branches/:id | P1 | 1h |
| 4.2.6 | 分支归档API | POST /branches/:id/archive | P1 | 1h |

**产出物**:
```typescript
// api/routes/branch.ts

// 获取分支列表
GET /api/mindmaps/:mid/branches
Response: {
  branches: Branch[];
  currentBranchId: string;
}

// 创建分支
POST /api/mindmaps/:mid/branches
Body: {
  name: string;              // 必须符合命名规范
  description?: string;
  parentBranchId?: string;   // 默认从当前分支创建
}
Response: Branch

// 切换分支（checkout）
POST /api/branches/:id/checkout
Response: {
  branch: Branch;
  nodes: Node[];
  relations: Relation[];
}

// 删除分支（仅active状态）
DELETE /api/branches/:id
条件: 
  - 不能删除main分支
  - 不能删除当前所在分支
  - 必须是active状态
Response: { success: true }

// 归档分支
POST /api/branches/:id/archive
条件:
  - 必须是merged或active状态
Response: Branch
```

---

### 4.3 版本数据模型

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 4.3.1 | Version模型定义 | models/Version.ts | P0 | 1h |
| 4.3.2 | 版本快照结构 | VersionSnapshot | P0 | 1h |
| 4.3.3 | 版本号生成规则 | versionNumber.ts | P0 | 1h |
| 4.3.4 | Prisma Schema更新 | schema.prisma | P0 | 0.5h |
| 4.3.5 | 数据库迁移 | migration | P0 | 1h |

**产出物**:
```typescript
// models/Version.ts
interface Version {
  id: string;
  mindmapId: string;
  branchId: string;
  versionNumber: string;      // v1.0.0, v1.1.0
  message: string;            // 版本描述
  authorId: string;
  parentVersionId?: string;   // 同分支内的父版本
  
  snapshot: VersionSnapshot;  // 完整快照
  diff?: VersionDiff;         // 与父版本差异
  
  createdAt: Date;
  tags?: string[];            // release, stable等标签
}

interface VersionSnapshot {
  nodes: Node[];
  relations: Relation[];
  utlSource?: string;
}

interface VersionDiff {
  added: string[];            // 新增节点ID
  modified: string[];         // 修改节点ID
  deleted: string[];          // 删除节点ID
  relationsChanged: number;
}

// 版本号规则（分支内递增）
function generateVersionNumber(branch: Branch): string {
  const lastVersion = branch.versions[branch.versions.length - 1];
  
  if (!lastVersion) {
    return 'v1.0.0';
  }
  
  // 自动递增
  const parts = lastVersion.versionNumber.replace('v', '').split('.');
  const major = parseInt(parts[0]);
  const minor = parseInt(parts[1]);
  const patch = parseInt(parts[2]);
  
  return `v${major}.${minor + 1}.${patch}`;
}
```

---

### 4.4 版本管理API

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 4.4.1 | 版本列表API | GET /versions | P0 | 1h |
| 4.4.2 | 创建版本API | POST /versions | P0 | 2h |
| 4.4.3 | 版本详情API | GET /versions/:id | P0 | 1h |
| 4.4.4 | 恢复版本API | POST /versions/:id/restore | P0 | 2h |
| 4.4.5 | 版本对比API | GET /versions/:id1/diff/:id2 | P0 | 3h |
| 4.4.6 | 版本删除API | DELETE /versions/:id | P1 | 1h |

**产出物**:
```typescript
// api/routes/version.ts

// 获取版本列表
GET /api/branches/:bid/versions
Query: {
  limit?: number;
  offset?: number;
}
Response: {
  versions: Version[];
  total: number;
}

// 创建版本（commit）
POST /api/branches/:bid/versions
Body: {
  message: string;    // 版本描述，必填
  tags?: string[];
}
流程:
  1. 获取当前分支所有节点
  2. 创建快照
  3. 计算与上一版本差异
  4. 更新分支headVersionId
Response: Version

// 获取版本详情
GET /api/versions/:id
Response: {
  version: Version;
  snapshot: VersionSnapshot;
}

// 恢复版本（回退）
POST /api/versions/:id/restore
流程:
  1. 获取版本快照
  2. 清空当前分支节点
  3. 从快照恢复节点
  4. 创建新版本记录（标记为restore）
Response: {
  version: Version;  // 新创建的恢复版本
  nodes: Node[];
}

// 版本对比
GET /api/versions/:id1/diff/:id2
Response: {
  fromVersion: Version;
  toVersion: Version;
  diff: DetailedDiff;
}

interface DetailedDiff {
  nodes: {
    added: Node[];
    modified: {
      nodeId: string;
      before: Node;
      after: Node;
      changes: string[];  // changed fields
    }[];
    deleted: Node[];
  };
  relations: {
    added: Relation[];
    deleted: Relation[];
  };
  utlSource?: {
    before: string;
    after: string;
    diffLines: DiffLine[];
  };
}

// 删除版本（仅draft版本）
DELETE /api/versions/:id
条件: 版本必须是draft状态
Response: { success: true }
```

---

### 4.5 合并请求（Merge Request）

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 4.5.1 | MergeRequest模型定义 | models/MergeRequest.ts | P0 | 1h |
| 4.5.2 | 合并请求创建API | POST /merge-requests | P0 | 2h |
| 4.5.3 | 合并请求列表API | GET /merge-requests | P0 | 1h |
| 4.5.4 | 合并请求详情API | GET /merge-requests/:id | P0 | 1h |
| 4.5.5 | 批准合并请求API | POST /merge-requests/:id/approve | P0 | 1h |
| 4.5.6 | 执行合并API | POST /merge-requests/:id/merge | P0 | 4h |
| 4.5.7 | 关闭合并请求API | POST /merge-requests/:id/close | P1 | 1h |

**产出物**:
```typescript
// models/MergeRequest.ts
interface MergeRequest {
  id: string;
  mindmapId: string;
  sourceBranchId: string;    // 源分支
  sourceBranch: Branch;
  targetBranchId: string;    // 目标分支（通常是main）
  targetBranch: Branch;
  title: string;
  description?: string;
  authorId: string;
  author: User;
  status: MergeRequestStatus;
  reviewers: string[];       // 审核者列表
  approvedBy: string[];      // 已批准的用户
  mergedBy?: string;
  mergedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  conflicts?: MergeConflict[];
}

type MergeRequestStatus = 
  | 'open'      // 待审核
  | 'approved'  // 已批准
  | 'rejected'  // 已拒绝
  | 'merged'    // 已合并
  | 'closed';   // 已关闭

// 创建合并请求
POST /api/mindmaps/:mid/merge-requests
Body: {
  sourceBranchId: string;
  targetBranchId: string;    // 默认main
  title: string;
  description?: string;
  reviewers?: string[];
}
流程:
  1. 验证源分支和目标分支
  2. 预检测冲突
  3. 创建MR记录
Response: MergeRequest

// 批准合并请求
POST /api/merge-requests/:id/approve
Body: {
  userId: string;  // 批准者
}
条件:
  - userId必须在reviewers列表中
Response: MergeRequest

// 执行合并
POST /api/merge-requests/:id/merge
条件:
  - MR状态必须是approved或open（强制合并）
  - 无未解决的冲突
流程:
  1. 获取源分支和目标分支最新版本
  2. 执行合并算法
  3. 处理冲突（如有）
  4. 创建目标分支新版本
  5. 更新源分支状态为merged
  6. 创建合并版本记录
Response: {
  mergeRequest: MergeRequest;
  newVersion: Version;
}
```

---

### 4.6 合并算法与冲突处理

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 4.6.1 | MergeConflict模型 | models/MergeConflict.ts | P0 | 1h |
| 4.6.2 | 冲突检测算法 | detectMergeConflicts() | P0 | 3h |
| 4.6.3 | 两路合并算法 | twoWayMerge() | P0 | 4h |
| 4.6.4 | 冲突解决API | POST /conflicts/:id/resolve | P0 | 2h |
| 4.6.5 | 自动合并策略 | autoMergeStrategy.ts | P1 | 2h |

**产出物**:
```typescript
// 合并冲突
interface MergeConflict {
  id: string;
  mergeRequestId: string;
  nodeId: string;
  
  sourceVersion: Node;       // 源分支版本
  targetVersion: Node;       // 目标分支版本
  
  resolution?: ConflictResolution;
  resolvedBy?: string;
  resolvedAt?: Date;
}

type ConflictResolution = 
  | 'source'    // 采用源分支版本
  | 'target'    // 采用目标分支版本
  | 'manual';   // 手动合并（创建新版本）

// 冲突检测
function detectMergeConflicts(
  sourceNodes: Node[],
  targetNodes: Node[]
): MergeConflict[] {
  const conflicts: MergeConflict[] = [];
  
  for (const sourceNode of sourceNodes) {
    const targetNode = targetNodes.find(n => n.id === sourceNode.id);
    
    if (targetNode) {
      // 同一节点在两个分支都有修改
      const sourceChanged = sourceNode.updatedAt > sourceBranch.headVersion.createdAt;
      const targetChanged = targetNode.updatedAt > targetBranch.headVersion.createdAt;
      
      if (sourceChanged && targetChanged) {
        // 检查修改字段是否冲突
        const changedFields = detectFieldConflicts(sourceNode, targetNode);
        
        if (changedFields.length > 0) {
          conflicts.push({
            id: generateId(),
            nodeId: sourceNode.id,
            sourceVersion: sourceNode,
            targetVersion: targetNode
          });
        }
      }
    }
  }
  
  return conflicts;
}

// 两路合并算法（简化版，无共同祖先）
function twoWayMerge(
  sourceNodes: Node[],
  targetNodes: Node[],
  conflicts: MergeConflict[]
): Node[] {
  const merged: Node[] = [];
  
  // 1. 采用目标分支基础版本
  for (const targetNode of targetNodes) {
    const conflict = conflicts.find(c => c.nodeId === targetNode.id);
    
    if (conflict) {
      // 有冲突，使用已解决的版本
      if (conflict.resolution === 'source') {
        merged.push(conflict.sourceVersion);
      } else if (conflict.resolution === 'manual') {
        merged.push(createManualMerge(conflict));
      } else {
        merged.push(conflict.targetVersion);
      }
    } else {
      // 无冲突，检查源分支是否有新增修改
      const sourceNode = sourceNodes.find(n => n.id === targetNode.id);
      
      if (sourceNode && sourceNode.updatedAt > targetNode.updatedAt) {
        // 源分支有更新，采用源版本
        merged.push(sourceNode);
      } else {
        merged.push(targetNode);
      }
    }
  }
  
  // 2. 添加源分支新增节点
  for (const sourceNode of sourceNodes) {
    if (!targetNodes.find(n => n.id === sourceNode.id)) {
      merged.push(sourceNode);
    }
  }
  
  return merged;
}

// 解决冲突API
POST /api/conflicts/:id/resolve
Body: {
  resolution: 'source' | 'target' | 'manual';
  manualNode?: Node;  // manual时提供合并后的节点
}
Response: MergeConflict
```

---

### 4.7 前端分支组件

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 4.7.1 | 分支Store | branchStore.ts | P0 | 2h |
| 4.7.2 | 分支选择器 | BranchSelector.tsx | P0 | 2h |
| 4.7.3 | 分支创建对话框 | CreateBranchModal.tsx | P0 | 2h |
| 4.7.4 | 分支图形视图 | BranchGraph.tsx | P0 | 3h |
| 4.7.5 | 版本时间线 | VersionTimeline.tsx | P0 | 3h |
| 4.7.6 | 版本对比视图 | VersionDiffView.tsx | P0 | 3h |
| 4.7.7 | 合并请求列表 | MergeRequestList.tsx | P0 | 2h |
| 4.7.8 | 合并请求详情 | MergeRequestDetail.tsx | P0 | 3h |
| 4.7.9 | 冲突解决对话框 | ConflictResolveModal.tsx | P0 | 2h |

**产出物**:
```typescript
// stores/branchStore.ts
interface BranchStore {
  branches: Branch[];
  currentBranch: Branch | null;
  versions: Version[];
  mergeRequests: MergeRequest[];
  conflicts: MergeConflict[];
  
  // 分支操作
  loadBranches: (mindmapId: string) => Promise<void>;
  createBranch: (data: CreateBranchInput) => Promise<Branch>;
  switchBranch: (branchId: string) => Promise<void>;
  deleteBranch: (branchId: string) => Promise<void>;
  
  // 版本操作
  createVersion: (message: string) => Promise<Version>;
  restoreVersion: (versionId: string) => Promise<void>;
  compareVersions: (fromId: string, toId: string) => Promise<DetailedDiff>;
  
  // 合并请求操作
  loadMergeRequests: (mindmapId: string) => Promise<void>;
  createMergeRequest: (data: CreateMRInput) => Promise<MergeRequest>;
  approveMergeRequest: (mrId: string) => Promise<void>;
  mergeMergeRequest: (mrId: string) => Promise<void>;
  
  // 冲突操作
  resolveConflict: (conflictId: string, resolution: ResolutionInput) => Promise<void>;
}

// 分支图形视图（类似Git分支图）
function BranchGraph({ branches }: { branches: Branch[] }) {
  // 计算分支布局
  const layout = calculateBranchLayout(branches);
  
  return (
    <svg width={width} height={height}>
      {layout.branches.map((branch, idx) => (
        <BranchLine 
          key={branch.id}
          branch={branch}
          x={idx * BRANCH_GAP}
          versions={branch.versions}
        />
      ))}
      
      {/* 合并连线 */}
      {layout.merges.map(merge => (
        <MergeLine from={merge.from} to={merge.to} />
      ))}
    </svg>
  );
}

// 版本时间线（单个分支）
function VersionTimeline({ versions }: { versions: Version[] }) {
  return (
    <div className="timeline">
      {versions.map((version, idx) => (
        <TimelineItem key={version.id}>
          <VersionNode 
            version={version}
            isHead={idx === versions.length - 1}
          />
          {idx < versions.length - 1 && <TimelineLine />}
        </TimelineItem>
      ))}
    </div>
  );
}
```

---

### 4.8 WebSocket分支事件

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 4.8.1 | 分支切换事件 | branch_switch事件 | P0 | 1h |
| 4.8.2 | 版本创建事件 | version_created事件 | P0 | 1h |
| 4.8.3 | 合并事件 | branch_merged事件 | P0 | 1h |
| 4.8.4 | 房间隔离（按分支） | branch房间分离 | P0 | 2h |

**产出物**:
```typescript
// WebSocket房间规则更新
// 房间名: mindmap:{mindmapId}:branch:{branchId}
// 不同分支用户在不同房间，互不干扰

// 分支切换
socket.emit('branch_switch', { branchId: string });
// 服务端:
// 1. 用户离开当前房间
// 2. 获取新分支数据
// 3. 用户加入新房间
// 4. 广播切换通知
socket.on('branch_switched', { 
  branchId: string, 
  by: string,
  nodes: Node[],
  relations: Relation[]
});

// 版本创建广播
socket.on('version_created', { 
  version: Version, 
  branchId: string,
  by: string 
});

// 合并完成广播（广播到目标分支房间）
socket.on('branch_merged', { 
  mergeRequest: MergeRequest,
  newVersion: Version,
  by: string
});
```

---

### 4.9 测试

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 4.9.1 | 分支API测试 | branch.test.ts | P0 | 2h |
| 4.9.2 | 版本API测试 | version.test.ts | P0 | 2h |
| 4.9.3 | 合并请求测试 | mergeRequest.test.ts | P0 | 2h |
| 4.9.4 | 合并算法测试 | merge.test.ts | P0 | 3h |
| 4.9.5 | 冲突检测测试 | conflict.test.ts | P0 | 2h |
| 4.9.6 | 分支E2E测试 | branch.e2e.ts | P1 | 3h |

---

## 依赖关系图

```
4.1 分支数据模型
    │
    ├── 4.2 分支API (依赖 4.1)
    │       │
    │       └── 4.2.1-4.2.3 核心 API (并行)
    │       └── 4.2.4-4.2.6 辅助 API (依赖 4.2.2)
    │
    ├── 4.3 版本数据模型 (依赖 4.1)
    │       │
    │       └── 4.4 版本API (依赖 4.3)
    │               │
    │               └── 4.4.1-4.4.4 核心 API (并行)
    │               └── 4.4.5-4.4.6 辅助 API (依赖 4.4.4)
    │
    ├── 4.5 合并请求 (依赖 4.1, 4.3)
    │       │
    │       └── 4.5.1-4.5.5 MR基础 (并行)
    │       └── 4.5.6-4.5.7 执行合并 (依赖 4.5.5)
    │
    ├── 4.6 合并算法 (依赖 4.5)
    │       │
    │       └── 4.6.1-4.6.3 核心算法 (并行)
    │       └── 4.6.4-4.6.5 冲突处理 (依赖 4.6.2)
    │
    ├── 4.7 前端组件 (依赖 4.2, 4.4, 4.5)
    │       │
    │       └── 4.7.1 Store
    │       └── 4.7.2-4.7.4 分支UI (依赖 4.7.1)
    │       └── 4.7.5-4.7.6 版本UI (依赖 4.7.1)
    │       └── 4.7.7-4.7.9 MR+冲突UI (依赖 4.7.1)
    │
    ├── 4.8 WebSocket事件 (依赖 4.2, 4.4)
    │
    └── 4.9 测试 (依赖 4.1-4.8)
```

---

## 并行执行策略

**Week 6 (Day 26-30)**:
```
Day 26:
  - [后端] 4.1 分支数据模型 + 迁移
  - [后端] 4.2.1-4.2.3 分支核心API
  
Day 27:
  - [后端] 4.3 版本数据模型 + 迁移
  - [后端] 4.4.1-4.4.4 版本核心API
  - [前端] 4.7.1 分支Store
  
Day 28:
  - [后端] 4.5.1-4.5.5 合并请求基础
  - [前端] 4.7.2-4.7.4 分支UI
  
Day 29:
  - [后端] 4.5.6-4.5.7 执行合并
  - [后端] 4.6.1-4.6.3 合并算法
  - [前端] 4.7.5-4.7.6 版本UI
  
Day 30:
  - [后端] 4.6.4-4.6.5 冲突处理
  - [后端] 4.8 WebSocket事件
  - [前端] 4.7.7-4.7.9 MR+冲突UI
  - [测试] 4.9.1-4.9.5 单元测试
  - [全员] 集成验证
```

---

## 验收标准

### Phase 4完成条件

| 检查项 | 标准 |
|--------|------|
| 分支创建 | 可创建feature/hotfix/release分支 |
| 分支命名规范 | 不符合规范的分支名报错 |
| 分支切换 | checkout后正确加载分支节点 |
| 分支删除 | 仅active分支可删除 |
| 版本创建 | 创建版本生成完整快照 |
| 版本恢复 | 可回退到任意历史版本 |
| 版本对比 | 正确显示两个版本差异 |
| 合并请求创建 | 可创建从feature到main的MR |
| 合并请求批准 | 审核者可批准MR |
| 合并执行 | 无冲突MR正确合并 |
| 冲突检测 | 正确检测节点字段冲突 |
| 冲突解决 | 可选择source/target/manual |
| 分支图形 | 正确显示分支树和合并线 |
| 版本时间线 | 正确显示版本历史 |
| WebSocket隔离 | 不同分支用户在不同房间 |
| 分支测试 | 100%通过 |
| 版本测试 | 100%通过 |
| 合并测试 | 100%通过 |
| 冲突测试 | 100%通过 |

---

## Phase 4输出总结

**分支管理可用**: Git风格分支创建、切换、删除
**版本控制可用**: 版本历史、快照、回退
**合并请求可用**: MR创建、审核、执行
**冲突处理可用**: 冲突检测、解决