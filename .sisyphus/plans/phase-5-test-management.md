# Phase 5: 测试结果管理

## 目标

实现测试用例执行结果标记、问题跟踪、统计分析。

---

## 前置依赖

- Phase 1完成（节点CRUD、测试用例节点）
- Phase 4完成（版本控制）

---

## 任务分解

### 5.1 测试结果数据模型

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 5.1.1 | TestResult模型定义 | models/TestResult.ts | P0 | 1h |
| 5.1.2 | 测试状态定义 | TestStatus | P0 | 0.5h |
| 5.1.3 | Issue模型定义 | models/Issue.ts | P0 | 1h |
| 5.1.4 | 问题严重级别定义 | IssueSeverity | P0 | 0.5h |
| 5.1.5 | Attachment模型定义 | models/Attachment.ts | P1 | 0.5h |
| 5.1.6 | Prisma Schema更新 | schema.prisma | P0 | 1h |
| 5.1.7 | 数据库迁移 | migration | P0 | 1h |

**产出物**:
```typescript
// models/TestResult.ts
interface TestResult {
  id: string;
  testCaseId: string;          // 关联测试用例节点
  
  status: TestStatus;          // 执行状态
  executedAt?: Date;           // 执行时间
  executedBy?: string;         // 执行人
  
  environment?: EnvironmentInfo; // 执行环境
  duration?: number;           // 执行时长（毫秒）
  
  notes?: string;              // 备注
  
  issues: Issue[];             // 发现的问题
  
  createdAt: Date;
  updatedAt: Date;
}

type TestStatus = 
  | '未测试'    // untested - 默认状态
  | '通过'      // passed
  | '失败'      // failed
  | '阻塞'      // blocked - 无法执行
  | '跳过';     // skipped

interface EnvironmentInfo {
  browser?: string;            // Chrome 120
  os?: string;                 // Windows 11
  version?: string;            // 应用版本
  device?: string;             // 设备信息
}

// models/Issue.ts
interface Issue {
  id: string;
  testCaseId: string;          // 关联测试用例
  testResultId?: string;       // 关联执行结果
  
  title: string;               // 问题标题
  description: string;         // 问题描述
  
  severity: IssueSeverity;     // 严重级别
  priority: IssuePriority;     // 优先级
  
  status: IssueStatus;         // 问题状态
  
  reportedBy: string;          // 报告人
  reportedAt: Date;            // 报告时间
  
  assignedTo?: string;         // 分配给
  resolvedBy?: string;         // 解决人
  resolvedAt?: Date;           // 解决时间
  
  resolution?: string;         // 解决说明
  resolutionType?: ResolutionType; // 解决类型
  
  screenshots?: string[];      // 截图URL列表
  relatedNodes?: string[];     // 关联节点
  
  attachments: Attachment[];   // 附件
  
  createdAt: Date;
  updatedAt: Date;
}

type IssueSeverity = 
  | '致命'     // critical - 系统崩溃、数据丢失
  | '严重'     // major - 功能无法使用
  | '一般'     // minor - 功能受限但可用
  | '建议';    // suggestion - 优化建议

type IssuePriority = 'P0' | 'P1' | 'P2' | 'P3';

type IssueStatus = 
  | '新建'         // open
  | '处理中'       // in_progress
  | '已解决'       // resolved
  | '已关闭'       // closed
  | '重新打开';    // reopened

type ResolutionType = 
  | '已修复'       // fixed
  | '不修复'       // wont_fix
  | '重复'         // duplicate
  | '无效'         // invalid
  | '无法复现';    // cannot_reproduce

// Prisma Schema
model TestResult {
  id          String   @id @default(uuid())
  testCaseId  String
  testCase    Node     @relation(fields: [testCaseId], references: [id])
  status      String   @default("未测试")
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

model Issue {
  id            String   @id @default(uuid())
  testCaseId    String
  testCase      Node     @relation(fields: [testCaseId], references: [id])
  testResultId  String?
  testResult    TestResult? @relation(fields: [testResultId], references: [id])
  title         String
  description   String
  severity      String
  priority      String
  status        String   @default("新建")
  reportedBy    String
  reporter      User     @relation(fields: [reportedBy], references: [id])
  reportedAt    DateTime @default(now())
  assignedTo    String?
  resolvedBy    String?
  resolvedAt    DateTime?
  resolution    String?
  resolutionType String?
  screenshots   String[]
  relatedNodes  String[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  attachments Attachment[]
}

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
```

---

### 5.2 测试结果API

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 5.2.1 | 提交测试结果API | POST /testcases/:id/result | P0 | 2h |
| 5.2.2 | 更新测试结果API | PUT /testcases/:id/result | P0 | 1h |
| 5.2.3 | 获取测试结果API | GET /testcases/:id/result | P0 | 1h |
| 5.2.4 | 批量更新结果API | POST /mindmaps/:id/results/batch | P0 | 2h |
| 5.2.5 | 获取脑图结果列表API | GET /mindmaps/:id/results | P0 | 1h |
| 5.2.6 | 获取统计汇总API | GET /mindmaps/:id/results/summary | P0 | 3h |

**产出物**:
```typescript
// api/routes/testResult.ts

// 提交测试结果
POST /api/testcases/:id/result
Body: {
  status: TestStatus;
  executedAt?: Date;
  environment?: EnvironmentInfo;
  duration?: number;
  notes?: string;
}
流程:
  1. 验证节点是测试用例类型
  2. 创建或更新TestResult
  3. 如状态为failed，可选创建Issue
Response: TestResult

// 更新测试结果
PUT /api/testcases/:id/result
Body: Partial<TestResult>
Response: TestResult

// 获取测试结果
GET /api/testcases/:id/result
Response: {
  result: TestResult;
  issues: Issue[];
}

// 批量更新结果
POST /api/mindmaps/:id/results/batch
Body: {
  updates: {
    testCaseId: string;
    status: TestStatus;
    notes?: string;
  }[];
}
Response: {
  updated: number;
  results: TestResult[];
}

// 获取脑图所有结果
GET /api/mindmaps/:id/results
Query: {
  status?: TestStatus;  // 按状态过滤
  branchId?: string;    // 按分支过滤
}
Response: {
  results: {
    testCaseId: string;
    testCaseName: string;
    result: TestResult;
  }[];
}

// 获取统计汇总
GET /api/mindmaps/:id/results/summary
Query: {
  branchId?: string;
  versionId?: string;
}
Response: TestResultSummary
```

---

### 5.3 统计汇总计算

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 5.3.1 | 统计数据结构 | TestResultSummary | P0 | 1h |
| 5.3.2 | 状态统计计算 | calculateStatusStats() | P0 | 2h |
| 5.3.3 | 通过率计算 | calculatePassRate() | P0 | 1h |
| 5.3.4 | 问题统计计算 | calculateIssueStats() | P0 | 2h |
| 5.3.5 | 按节点类型统计 | calculateByNodeType() | P0 | 2h |
| 5.3.6 | 按版本对比统计 | compareByVersion() | P1 | 2h |

**产出物**:
```typescript
// 统计汇总
interface TestResultSummary {
  // 基础统计
  total: number;               // 总测试用例数
  untested: number;            // 未测试数
  passed: number;              // 通过数
  failed: number;              // 失败数
  blocked: number;             // 阻塞数
  skipped: number;             // 跳过数
  
  // 通过率
  passRate: number;            // 通过率（已测试中通过的百分比）
  
  // 问题统计
  issues: IssueSummary;
  
  // 按节点类型统计
  byNodeType: Record<string, TestResultSummary>;
  
  // 按功能模块统计
  byFunction: Record<string, TestResultSummary>;
  
  // 执行趋势（可选）
  trend?: TrendData;
}

interface IssueSummary {
  total: number;               // 总问题数
  open: number;                // 未解决问题数
  critical: number;            // 致命问题数
  major: number;               // 严重问题数
  minor: number;               // 一般问题数
  suggestion: number;          // 建议数
  
  byPriority: {
    P0: number;
    P1: number;
    P2: number;
    P3: number;
  };
}

interface TrendData {
  dates: Date[];
  passRates: number[];
  executedCounts: number[];
}

// 计算函数
function calculateSummary(
  nodes: Node[],
  results: TestResult[],
  issues: Issue[]
): TestResultSummary {
  const testCaseNodes = nodes.filter(n => n.type === '测试用例');
  
  // 状态统计
  const statusCounts = {
    total: testCaseNodes.length,
    untested: 0,
    passed: 0,
    failed: 0,
    blocked: 0,
    skipped: 0
  };
  
  for (const node of testCaseNodes) {
    const result = results.find(r => r.testCaseId === node.id);
    if (result) {
      statusCounts[result.status]++;
    } else {
      statusCounts.untested++;
    }
  }
  
  // 通过率
  const testedTotal = statusCounts.total - statusCounts.untested - statusCounts.skipped;
  const passRate = testedTotal > 0 
    ? (statusCounts.passed / testedTotal) * 100 
    : 0;
  
  // 问题统计
  const issueSummary = calculateIssueSummary(issues);
  
  // 按节点类型统计
  const byNodeType = calculateByNodeType(nodes, results);
  
  return {
    ...statusCounts,
    passRate,
    issues: issueSummary,
    byNodeType
  };
}
```

---

### 5.4 问题跟踪API

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 5.4.1 | 创建问题API | POST /testcases/:id/issues | P0 | 2h |
| 5.4.2 | 更新问题API | PUT /api/issues/:id | P0 | 1h |
| 5.4.3 | 获取问题详情API | GET /api/issues/:id | P0 | 1h |
| 5.4.4 | 问题列表API | GET /api/issues | P0 | 2h |
| 5.4.5 | 删除问题API | DELETE /api/issues/:id | P1 | 1h |
| 5.4.6 | 附件上传API | POST /api/attachments | P0 | 2h |
| 5.4.7 | 附件删除API | DELETE /api/attachments/:id | P1 | 1h |

**产出物**:
```typescript
// api/routes/issue.ts

// 创建问题
POST /api/testcases/:id/issues
Body: {
  title: string;
  description: string;
  severity: IssueSeverity;
  priority: IssuePriority;
  assignedTo?: string;
  screenshots?: string[];      // 已上传的截图URL
  relatedNodes?: string[];
}
流程:
  1. 验证测试用例节点
  2. 创建Issue记录
  3. 自动设置reportedBy为当前用户
Response: Issue

// 更新问题
PUT /api/issues/:id
Body: Partial<Issue>
限制:
  - status变化记录时间戳
  - resolved时要求resolution和resolutionType
Response: Issue

// 获取问题详情
GET /api/issues/:id
Response: {
  issue: Issue;
  attachments: Attachment[];
  testCase: Node;              // 关联的测试用例
}

// 问题列表
GET /api/issues
Query: {
  mindmapId?: string;
  testCaseId?: string;
  status?: IssueStatus;
  severity?: IssueSeverity;
  priority?: IssuePriority;
  assignedTo?: string;
  sortBy?: 'createdAt' | 'severity' | 'priority';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
Response: {
  issues: Issue[];
  total: number;
}

// 上传附件
POST /api/attachments
Body: FormData { file, issueId }
流程:
  1. 上传文件到存储服务
  2. 创建Attachment记录
Response: Attachment

// 删除附件
DELETE /api/attachments/:id
条件: 上传者或管理员可删除
Response: { success: true }
```

---

### 5.5 前端测试结果组件

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 5.5.1 | 测试结果Store | testResultStore.ts | P0 | 2h |
| 5.5.2 | 节点状态标记组件 | TestCaseStatusBadge.tsx | P0 | 1h |
| 5.5.3 | 测试结果编辑对话框 | TestResultModal.tsx | P0 | 3h |
| 5.5.4 | 结果统计面板 | TestResultSummaryPanel.tsx | P0 | 3h |
| 5.5.5 | 问题列表组件 | IssueList.tsx | P0 | 2h |
| 5.5.6 | 问题详情对话框 | IssueDetailModal.tsx | P0 | 3h |
| 5.5.7 | 创建问题对话框 | CreateIssueModal.tsx | P0 | 2h |
| 5.5.8 | 附件上传组件 | AttachmentUpload.tsx | P0 | 2h |
| 5.5.9 | 状态栏统计显示 | StatusBarStats.tsx | P0 | 1h |

**产出物**:
```typescript
// stores/testResultStore.ts
interface TestResultStore {
  results: Map<string, TestResult>;
  summary: TestResultSummary | null;
  issues: Issue[];
  currentIssue: Issue | null;
  
  // 结果操作
  submitResult: (testCaseId: string, data: TestResultInput) => Promise<void>;
  updateResult: (testCaseId: string, data: Partial<TestResult>) => Promise<void>;
  batchUpdate: (updates: BatchUpdateInput[]) => Promise<void>;
  loadResults: (mindmapId: string) => Promise<void>;
  loadSummary: (mindmapId: string) => Promise<void>;
  
  // 问题操作
  createIssue: (testCaseId: string, data: IssueInput) => Promise<Issue>;
  updateIssue: (issueId: string, data: Partial<Issue>) => Promise<void>;
  deleteIssue: (issueId: string) => Promise<void>;
  loadIssues: (mindmapId: string) => Promise<void>;
  loadIssueDetail: (issueId: string) => Promise<void>;
  
  // 附件操作
  uploadAttachment: (issueId: string, file: File) => Promise<Attachment>;
  deleteAttachment: (attachmentId: string) => Promise<void>;
}

// 状态徽章组件
function TestCaseStatusBadge({ status }: { status: TestStatus }) {
  const config = {
    '未测试': { color: 'gray', icon: ClockIcon },
    '通过': { color: 'green', icon: CheckIcon },
    '失败': { color: 'red', icon: XIcon },
    '阻塞': { color: 'orange', icon: BlockIcon },
    '跳过': { color: 'blue', icon: SkipIcon },
  };
  
  return (
    <Badge color={config[status].color}>
      <Icon src={config[status].icon} />
      {status}
    </Badge>
  );
}

// 统计面板
function TestResultSummaryPanel({ summary }: { summary: TestResultSummary }) {
  return (
    <div className="summary-panel">
      {/* 进度条 */}
      <ProgressBar 
        total={summary.total}
        passed={summary.passed}
        failed={summary.failed}
        blocked={summary.blocked}
      />
      
      {/* 状态统计 */}
      <StatsGrid>
        <StatItem label="总数" value={summary.total} />
        <StatItem label="通过" value={summary.passed} color="green" />
        <StatItem label="失败" value={summary.failed} color="red" />
        <StatItem label="阻塞" value={summary.blocked} color="orange" />
        <StatItem label="未测试" value={summary.untested} color="gray" />
        <StatItem label="通过率" value={`${summary.passRate}%`} color="blue" />
      </StatsGrid>
      
      {/* 问题统计 */}
      <IssueStats issueSummary={summary.issues} />
      
      {/* 按节点类型 */}
      <NodeTypeStats byNodeType={summary.byNodeType} />
    </div>
  );
}

// 测试结果编辑对话框
function TestResultModal({ testCaseId, onClose }: Props) {
  const [status, setStatus] = useState<TestStatus>('未测试');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState<number>();
  const [showIssueForm, setShowIssueForm] = useState(false);
  
  const handleSubmit = async () => {
    await testResultStore.submitResult(testCaseId, {
      status,
      notes,
      duration,
      executedAt: new Date()
    });
    
    if (status === '失败') {
      setShowIssueForm(true);  // 失败时提示创建问题
    } else {
      onClose();
    }
  };
  
  return (
    <Modal>
      <StatusSelector value={status} onChange={setStatus} />
      <DurationInput value={duration} onChange={setDuration} />
      <NotesTextarea value={notes} onChange={setNotes} />
      
      {showIssueForm && <CreateIssueForm testCaseId={testCaseId} />}
      
      <Button onClick={handleSubmit}>提交</Button>
    </Modal>
  );
}
```

---

### 5.6 节点状态渲染集成

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 5.6.1 | 节点状态背景色 | 状态颜色映射 | P0 | 1h |
| 5.6.2 | 状态图标渲染 | 状态图标组件 | P0 | 1h |
| 5.6.3 | 节点悬停显示结果 | HoverTooltip | P0 | 2h |
| 5.6.4 | 快捷状态切换 | QuickStatusToggle | P1 | 2h |

**产出物**:
```typescript
// 节点渲染集成
function NodeRenderer({ node }: { node: Node }) {
  const result = testResultStore.results.get(node.id);
  
  // 测试用例节点显示状态
  if (node.type === '测试用例') {
    return (
      <g className={`node node-${node.type} status-${result?.status || '未测试'}`}>
        {/* 状态背景色 */}
        <rect fill={getStatusColor(result?.status)} />
        
        {/* 节点内容 */}
        <text>{node.name}</text>
        
        {/* 状态图标 */}
        {result && <StatusIcon status={result.status} />}
        
        {/* 问题数量徽章 */}
        {result?.issues?.length > 0 && (
          <Badge count={result.issues.length} color="red" />
        )}
      </g>
    );
  }
  
  // 其他节点类型
  return <StandardNodeRenderer node={node} />;
}

// 状态颜色映射
const STATUS_COLORS = {
  '未测试': '#D1D5DB',     // 灰色
  '通过': '#10B981',       // 绿色
  '失败': '#EF4444',       // 红色
  '阻塞': '#F59E0B',       // 橙色
  '跳过': '#3B82F6',       // 蓝色
};

// 悬停显示结果详情
function NodeHoverTooltip({ node, result }: Props) {
  if (node.type !== '测试用例' || !result) return null;
  
  return (
    <Tooltip>
      <div>
        <strong>状态: {result.status}</strong>
      </div>
      <div>执行时间: {formatDate(result.executedAt)}</div>
      <div>执行人: {result.executor?.username}</div>
      {result.duration && <div>耗时: {result.duration}ms</div>}
      {result.notes && <div>备注: {result.notes}</div>}
      {result.issues.length > 0 && (
        <div>问题: {result.issues.length}个</div>
      )}
    </Tooltip>
  );
}
```

---

### 5.7 WebSocket结果同步

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 5.7.1 | 结果更新事件 | result_updated事件 | P0 | 1h |
| 5.7.2 | 问题创建事件 | issue_created事件 | P0 | 1h |
| 5.7.3 | 问题更新事件 | issue_updated事件 | P0 | 1h |
| 5.7.4 | 统计更新事件 | summary_updated事件 | P0 | 1h |

**产出物**:
```typescript
// WebSocket事件

// 结果更新广播
socket.emit('test_result_submit', { 
  testCaseId: string,
  result: TestResult
});
// 服务端广播
socket.on('result_updated', { 
  testCaseId: string, 
  result: TestResult,
  by: string 
});

// 问题创建广播
socket.emit('issue_create', { 
  testCaseId: string,
  issue: IssueInput
});
socket.on('issue_created', { 
  issue: Issue,
  by: string 
});

// 问题更新广播
socket.on('issue_updated', { 
  issueId: string, 
  changes: Partial<Issue>,
  by: string 
});

// 统计更新通知（结果变化后）
socket.on('summary_updated', { 
  summary: TestResultSummary 
});
```

---

### 5.8 测试

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 5.8.1 | 结果API测试 | result.test.ts | P0 | 2h |
| 5.8.2 | 问题API测试 | issue.test.ts | P0 | 2h |
| 5.8.3 | 统计计算测试 | summary.test.ts | P0 | 2h |
| 5.8.4 | 附件测试 | attachment.test.ts | P1 | 1h |
| 5.8.5 | 结果E2E测试 | result.e2e.ts | P1 | 2h |

---

## 依赖关系图

```
5.1 数据模型
    │
    ├── 5.2 测试结果API (依赖 5.1)
    │       │
    │       └── 5.2.1-5.2.3 核心 API (并行)
    │       └── 5.2.4-5.2.6 辅助 API (依赖 5.2.1)
    │
    ├── 5.3 统计汇总 (依赖 5.1)
    │       │
    │       └── 5.3.1-5.3.4 基础统计 (并行)
    │       └── 5.3.5-5.3.6 分组统计 (依赖 5.3.2)
    │
    ├── 5.4 问题跟踪API (依赖 5.1)
    │       │
    │       └── 5.4.1-5.4.5 问题操作 (并行)
    │       └── 5.4.6-5.4.7 附件操作 (依赖 5.4.1)
    │
    ├── 5.5 前端组件 (依赖 5.2, 5.3, 5.4)
    │       │
    │       └── 5.5.1 Store
    │       └── 5.5.2-5.5.4 结果UI (依赖 5.5.1)
    │       └── 5.5.5-5.5.8 问题UI (依赖 5.5.1)
    │       └── 5.5.9 状态栏 (依赖 5.5.1)
    │
    ├── 5.6 节点集成 (依赖 5.5)
    │       │
    │       └── 5.6.1-5.6.4 视觉集成 (并行)
    │
    ├── 5.7 WebSocket同步 (依赖 5.2, 5.4)
    │
    └── 5.8 测试 (依赖 5.1-5.7)
```

---

## 并行执行策略

**Week 7 (Day 31-35)**:
```
Day 31:
  - [后端] 5.1 数据模型 + 迁移
  - [后端] 5.2.1-5.2.3 结果核心API
  - [前端] 5.5.1 测试结果Store
  
Day 32:
  - [后端] 5.3.1-5.3.4 统计计算
  - [后端] 5.4.1-5.4.5 问题API
  - [前端] 5.5.2-5.5.4 结果UI
  
Day 33:
  - [后端] 5.2.4-5.2.6 结果辅助API
  - [后端] 5.3.5-5.3.6 分组统计
  - [前端] 5.5.5-5.5.7 问题UI
  
Day 34:
  - [后端] 5.4.6-5.4.7 附件API
  - [后端] 5.7 WebSocket同步
  - [前端] 5.5.8-5.5.9 附件+状态栏
  - [前端] 5.6.1-5.6.4 节点集成
  
Day 35:
  - [测试] 5.8.1-5.8.5 单元+E2E测试
  - [全员] 集成验证
```

---

## 验收标准

### Phase 5完成条件

| 检查项 | 标准 |
|--------|------|
| 状态提交 | 可提交通过/失败/阻塞/跳过状态 |
| 状态更新 | 可更新已提交的结果 |
| 批量更新 | 可批量更新多个用例状态 |
| 统计汇总 | 正确计算总数/通过率/问题数 |
| 按类型统计 | 正确按节点类型分组统计 |
| 问题创建 | 失败时可创建问题 |
| 问题更新 | 可更新问题状态、分配、解决 |
| 问题列表 | 可按条件筛选问题 |
| 严重级别 | 正确标记致命/严重/一般/建议 |
| 优先级 | 正确标记P0-P3 |
| 附件上传 | 可上传截图等附件 |
| 节点状态色 | 测试用例节点显示状态颜色 |
| 状态徽章 | 正确显示状态徽章 |
| 悬停提示 | 悬停显示执行详情 |
| 结果同步 | 多用户结果实时同步 |
| 统计更新 | 结果变化后统计实时更新 |
| 结果API测试 | 100%通过 |
| 问题API测试 | 100%通过 |
| 统计测试 | 100%通过 |

---

## Phase 5输出总结

**结果标记可用**: 测试用例状态标记
**问题跟踪可用**: 问题创建、更新、分配、解决
**统计分析可用**: 通过率、问题统计、分组统计
**视觉集成可用**: 节点状态显示