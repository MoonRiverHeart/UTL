# Phase 6: 整合测试与优化

## 目标

完成端到端测试、性能优化、文档完善、部署准备。

---

## 前置依赖

- Phase 1-5全部完成

---

## 任务分解

### 6.1 端到端测试

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 6.1.1 | E2E测试框架配置 | Playwright配置 | P0 | 2h |
| 6.1.2 | 登录流程E2E | login.e2e.ts | P0 | 2h |
| 6.1.3 | 脑图编辑E2E | mindmap.e2e.ts | P0 | 4h |
| 6.1.4 | UTL脚本E2E | utl.e2e.ts | P0 | 3h |
| 6.1.5 | 协作流程E2E | collaboration.e2e.ts | P0 | 4h |
| 6.1.6 | 分支管理E2E | branch.e2e.ts | P0 | 3h |
| 6.1.7 | 测试结果E2E | result.e2e.ts | P0 | 2h |
| 6.1.8 | 完整用户旅程E2E | journey.e2e.ts | P0 | 4h |

**产出物**:
```typescript
// tests/e2e/login.e2e.ts
test('登录流程', async ({ page }) => {
  await page.goto('/');
  
  // 显示登录弹窗
  await expect(page.locator('.login-modal')).toBeVisible();
  
  // 输入账号密码
  await page.fill('[name="username"]', 'testuser');
  await page.fill('[name="password"]', 'testpass');
  
  // 点击登录
  await page.click('[type="submit"]');
  
  // 跳转到主页面
  await expect(page.locator('.layout')).toBeVisible();
  await expect(page.locator('.sidebar')).toBeVisible();
});

// tests/e2e/mindmap.e2e.ts
test('创建测试用例节点', async ({ page }) => {
  // 选择脑图
  await page.click('.mindmap-tree [data-id="mindmap-1"]');
  
  // 等待脑图加载
  await expect(page.locator('.mindmap-canvas')).toBeVisible();
  
  // 点击工具栏创建节点按钮
  await page.click('.toolbar [data-action="create-node"]');
  
  // 选择节点类型
  await page.click('[data-type="测试用例"]');
  
  // 输入节点名称
  await page.fill('[data-field="name"]', '新测试用例');
  
  // 确认创建
  await page.click('[data-action="confirm"]');
  
  // 验证节点出现在画布
  await expect(page.locator(`[data-node-name="新测试用例"]`)).toBeVisible();
});

// tests/e2e/collaboration.e2e.ts
test('多用户协作', async ({ browser }) => {
  // 创建两个浏览器上下文
  const user1 = await browser.newContext();
  const user2 = await browser.newContext();
  
  const page1 = await user1.newPage();
  const page2 = await user2.newPage();
  
  // 两个用户登录
  await login(page1, 'user1', 'pass1');
  await login(page2, 'user2', 'pass2');
  
  // 加入同一脑图
  await page1.click('.mindmap-tree [data-id="mindmap-1"]');
  await page2.click('.mindmap-tree [data-id="mindmap-1"]');
  
  // 验证两个用户都在线
  await expect(page1.locator('.online-users')).toContainText('user2');
  await expect(page2.locator('.online-users')).toContainText('user1');
  
  // user1创建节点
  await page1.click('.toolbar [data-action="create-node"]');
  await page1.fill('[data-field="name"]', '协作节点');
  await page1.click('[data-action="confirm"]');
  
  // user2看到新节点
  await expect(page2.locator(`[data-node-name="协作节点"]`)).toBeVisible({
    timeout: 5000
  });
  
  // user2的光标在user1可见
  await page2.mouse.move(200, 200);
  await expect(page1.locator(`[data-user-cursor="user2"]`)).toBeVisible();
});

// tests/e2e/journey.e2e.ts
test('完整用户旅程', async ({ page }) => {
  // 1. 登录
  await login(page, 'testuser', 'testpass');
  
  // 2. 创建工作区
  await page.click('.workspace-selector [data-action="create"]');
  await page.fill('[data-field="workspace-name"]', '测试工作区');
  await page.click('[data-action="confirm"]');
  
  // 3. 创建脑图
  await page.click('.sidebar [data-action="create-mindmap"]');
  await page.fill('[data-field="mindmap-name"]', '登录功能测试');
  await page.click('[data-action="confirm"]');
  
  // 4. 创建场景节点
  await createNode(page, '场景', '用户登录场景');
  
  // 5. 创建功能节点（继承场景）
  await createNode(page, '功能', '密码登录');
  await page.click('[data-action="set-inheritance"]');
  await page.fill('[data-field="extends"]', '用户登录场景.执行登录');
  
  // 6. 创建测试用例
  await createNode(page, '测试用例', '正常登录');
  await editTestSteps(page, [
    '打开登录页面',
    '输入用户名',
    '输入密码',
    '点击登录'
  ]);
  
  // 7. 创建版本
  await page.click('.toolbar [data-action="create-version"]');
  await page.fill('[data-field="version-message"]', '完成登录测试设计');
  await page.click('[data-action="confirm"]');
  
  // 8. 切换到脚本模式查看UTL
  await page.click('.mode-switcher [data-mode="script"]');
  await expect(page.locator('.monaco-editor')).toContainText('场景');
  await expect(page.locator('.monaco-editor')).toContainText('功能');
  await expect(page.locator('.monaco-editor')).toContainText('测试用例');
  
  // 9. 切换回脑图模式
  await page.click('.mode-switcher [data-mode="mindmap"]');
  
  // 10. 标记测试结果
  await page.click(`[data-node-name="正常登录"]`);
  await page.click('[data-action="mark-result"]');
  await page.click('[data-status="通过"]');
  
  // 11. 查看统计
  await expect(page.locator('.summary-panel .pass-rate')).toContainText('100%');
  
  // 12. 创建分支
  await page.click('.toolbar [data-action="create-branch"]');
  await page.fill('[data-field="branch-name"]', 'feature-异常测试');
  await page.click('[data-action="confirm"]');
  
  // 13. 在分支中添加新测试用例
  await createNode(page, '测试用例', '密码错误');
  
  // 14. 创建合并请求
  await page.click('.toolbar [data-action="create-mr"]');
  await page.fill('[data-field="mr-title"]', '添加异常测试用例');
  await page.click('[data-action="confirm"]');
  
  // 15. 合并分支
  await page.click('.merge-request [data-action="merge"]');
  
  // 16. 验证合并结果
  await expect(page.locator(`[data-node-name="密码错误"]`)).toBeVisible();
});
```

---

### 6.2 性能优化

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 6.2.1 | 前端性能分析 | Lighthouse报告 | P0 | 2h |
| 6.2.2 | 节点渲染优化 | 节点虚拟化 | P0 | 3h |
| 6.2.3 | WebSocket消息压缩 | 消息压缩 | P1 | 2h |
| 6.2.4 | API响应缓存 | Redis缓存 | P0 | 3h |
| 6.2.5 | 数据库查询优化 | 查询索引 | P0 | 2h |
| 6.2.6 | 大数据量测试 | 1000+节点性能 | P0 | 3h |
| 6.2.7 | 前端包体积优化 | 代码分割 | P1 | 2h |

**产出物**:
```typescript
// 节点虚拟化（仅渲染可见区域）
function VirtualizedMindmap({ nodes }: { nodes: Node[] }) {
  const [viewport, setViewport] = useState({ x: 0, y: 0, width: 800, height: 600 });
  const zoom = useZoom();
  
  // 计算可见节点
  const visibleNodes = nodes.filter(node => 
    isInViewport(node.position, viewport, zoom)
  );
  
  // 仅渲染可见节点
  return (
    <div className="mindmap-container" onScroll={handleScroll}>
      {visibleNodes.map(node => (
        <NodeRenderer key={node.id} node={node} />
      ))}
    </div>
  );
}

function isInViewport(
  position: Position,
  viewport: Viewport,
  zoom: number
): boolean {
  const nodeSize = 100 * zoom;
  return (
    position.x * zoom + nodeSize >= viewport.x &&
    position.x * zoom - nodeSize <= viewport.x + viewport.width &&
    position.y * zoom + nodeSize >= viewport.y &&
    position.y * zoom - nodeSize <= viewport.y + viewport.height
  );
}

// API缓存策略
const cacheConfig = {
  // 脑图数据缓存5分钟
  'mindmap:get': { ttl: 300, invalidateOn: ['node:*', 'relation:*'] },
  
  // 节点列表缓存1分钟
  'nodes:list': { ttl: 60, invalidateOn: ['node:create', 'node:delete'] },
  
  // 统计汇总缓存30秒
  'summary': { ttl: 30, invalidateOn: ['result:*'] },
  
  // 分支列表缓存10分钟
  'branches:list': { ttl: 600 },
};

// 数据库索引
CREATE INDEX idx_nodes_mindmap_branch ON nodes(mindmap_id, branch_id);
CREATE INDEX idx_nodes_type_position ON nodes(type, position);
CREATE INDEX idx_versions_branch_created ON versions(branch_id, created_at DESC);
CREATE INDEX idx_issues_status_severity ON issues(status, severity);
CREATE INDEX idx_test_results_status ON test_results(status);
```

---

### 6.3 文档完善

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 6.3.1 | README.md | 项目介绍 | P0 | 2h |
| 6.3.2 | UTL语言规范文档 | utl-language-spec.md | P0 | 3h |
| 6.3.3 | API参考文档 | api-reference.md | P0 | 4h |
| 6.3.4 | MCP工具文档 | mcp-tools.md | P0 | 2h |
| 6.3.5 | 用户手册 | user-guide.md | P1 | 4h |
| 6.3.6 | 架构文档 | architecture.md | P1 | 2h |
| 6.3.7 | 部署文档 | deployment.md | P0 | 2h |

**产出物**:
```markdown
# README.md 结构

## 项目简介
- UTL是什么
- 核心特性
- 技术栈

## 快速开始
- 环境要求
- 安装步骤
- 运行开发环境

## 项目结构
- Monorepo结构说明
- 各包功能说明

## 开发指南
- 开发环境配置
- 代码规范
- 测试运行

## 部署指南
- 生产环境配置
- Docker部署
- 环境变量说明

## 文档链接
- [UTL语言规范](docs/utl-language-spec.md)
- [API参考](docs/api-reference.md)
- [用户手册](docs/user-guide.md)

## 贡献指南
- 如何贡献
- 提交规范

## 许可证
```

```markdown
# utl-language-spec.md 结构

## 语言概述
- UTL语言定位
- 中文语法特性

## 基础语法
- 关键字列表（中英对照）
- 标识符规则
- 注释语法

## 节点定义
- 场景定义语法
- 功能定义语法
- 测试点定义语法
- 测试用例定义语法
- 因子定义语法

## 继承机制
- 单继承语法
- 多继承语法
- 合并策略

## 模块系统
- 导入语法
- 导出语法
- 模块路径规则

## 测试流程
- 流程定义语法
- 序列与并发
- 调用与断言

## 示例代码
- 完整示例
- 最佳实践
```

```markdown
# api-reference.md 结构

## 认证API
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

## 工作区API
- 所有端点详细说明

## 脑图API
- ...

## 节点API
- ...

## 分支API
- ...

## 版本API
- ...

## 测试结果API
- ...

## WebSocket事件
- 所有事件类型说明
```

---

### 6.4 部署准备

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 6.4.1 | Dockerfile编写 | Dockerfile | P0 | 2h |
| 6.4.2 | docker-compose配置 | docker-compose.yml | P0 | 2h |
| 6.4.3 | 环境变量配置 | .env.example | P0 | 1h |
| 6.4.4 | CI/CD配置 | GitHub Actions | P0 | 3h |
| 6.4.5 | 生产环境配置 | production配置 | P0 | 2h |
| 6.4.6 | 数据库迁移脚本 | 迁移脚本 | P0 | 1h |
| 6.4.7 | 健康检查端点 | /health | P0 | 1h |

**产出物**:
```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
COPY packages/utl-language/package*.json ./packages/utl-language/
COPY packages/utl-server/package*.json ./packages/utl-server/
COPY packages/utl-client/package*.json ./packages/utl-client/

RUN npm ci

# 构建各包
COPY . .
RUN npm run build:language
RUN npm run build:server
RUN npm run build:client

# 生产镜像
FROM node:20-alpine AS production

WORKDIR /app

# 仅复制必要文件
COPY --from=builder /app/packages/utl-language/dist ./packages/utl-language/dist
COPY --from=builder /app/packages/utl-server/dist ./packages/utl-server/dist
COPY --from=builder /app/packages/utl-client/dist ./packages/utl-client/dist
COPY --from=builder /app/package*.json ./

# 安装生产依赖
RUN npm ci --production

EXPOSE 3000
EXPOSE 8080

CMD ["npm", "run", "start:prod"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: utl
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: utl
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U utl"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  utl-server:
    build: .
    ports:
      - "3000:3000"   # REST API
      - "8080:8080"   # WebSocket
    environment:
      DATABASE_URL: postgresql://utl:${DB_PASSWORD}@postgres:5432/utl
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

volumes:
  postgres_data:
  redis_data:
```

```yaml
# GitHub Actions CI/CD
name: UTL CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      - run: npm run test:unit
      
      - run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
      
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
      
      - # 部署到生产环境...
```

---

### 6.5 代码质量检查

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 6.5.1 | TypeScript严格检查 | 修复类型错误 | P0 | 3h |
| 6.5.2 | ESLint清理 | 修复Lint错误 | P0 | 2h |
| 6.5.3 | 代码覆盖率检查 | 覆盖率报告 | P0 | 2h |
| 6.5.4 | AI代码味道清理 | AI Slop移除 | P1 | 3h |
| 6.5.5 | 依赖版本检查 | 检查依赖安全 | P0 | 1h |

---

### 6.6 最终验收

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 6.6.1 | 功能验收测试 | 验收报告 | P0 | 4h |
| 6.6.2 | 性能验收测试 | 性能报告 | P0 | 2h |
| 6.6.3 | 安全检查 | 安全报告 | P0 | 2h |
| 6.6.4 | 文档验收 | 文档完整性检查 | P0 | 1h |

---

## 验收清单

### 功能验收

| 功能模块 | 验收项 | 状态 |
|----------|--------|------|
| 用户认证 | 登录/登出正常 | ✅ |
| 工作区管理 | 创建/切换/删除正常 | ✅ |
| 脑图编辑 | 节点创建/编辑/删除正常 | ✅ |
| 三编辑模式 | 脑图/脚本/分屏切换正常 | ✅ |
| UTL中文语法 | 中文关键字解析正常 | ✅ |
| 双向同步 | 脑图-脚本同步无损 | ✅ |
| 继承关系 | 单继承/多继承解析正常 | ✅ |
| 实时协作 | 多用户编辑同步正常 | ✅ |
| 编辑锁 | 锁定/释放/冲突提示正常 | ✅ |
| 分支管理 | 创建/切换/删除分支正常 | ✅ |
| 版本控制 | 版本创建/恢复/对比正常 | ✅ |
| 合并请求 | MR创建/批准/执行正常 | ✅ |
| 冲突解决 | 冲突检测/解决正常 | ✅ |
| 测试结果 | 状态标记/统计正常 | ✅ |
| 问题跟踪 | 创建/更新/解决正常 | ✅ |

### 性能验收

| 性能指标 | 目标值 | 实测值 |
|----------|--------|--------|
| 页面加载时间 | < 3s | - |
| 节点渲染（100节点） | < 1s | - |
| 节点渲染（1000节点） | < 5s | - |
| WebSocket消息延迟 | < 100ms | - |
| API响应时间 | < 500ms | - |
| 内存占用（前端） | < 100MB | - |

### 安全验收

| 安全项 | 状态 |
|--------|------|
| JWT认证 | ✅ |
| 密码加密存储 | ✅ |
| SQL注入防护 | ✅ |
| XSS防护 | ✅ |
| CSRF防护 | ✅ |
| 输入验证 | ✅ |
| 权限检查 | ✅ |

---

## Phase 6输出总结

**E2E测试覆盖**: 所有核心流程有E2E测试
**性能达标**: 大数据量下性能良好
**文档完整**: 用户手册、API文档、部署文档齐全
**部署就绪**: Docker、CI/CD配置完成
**代码质量**: 无类型错误、无Lint错误
**生产可用**: 可部署到生产环境