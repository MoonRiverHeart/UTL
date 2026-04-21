# Phase 2: UTL语言引擎

## 目标

实现UTL语言完整解析与生成，支持中文语法，实现脑图-UTL双向同步。

---

## 前置依赖

- Phase 1完成（节点CRUD、脑图渲染）
- Node数据模型已定义

---

## 任务分解

### 2.1 词法分析器（Lexer）

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 2.1.1 | Token类型定义 | tokens.ts | P0 | 1h |
| 2.1.2 | 中文关键字映射 | chineseKeywords.ts | P0 | 1h |
| 2.1.3 | 分词器实现 | tokenizer.ts | P0 | 4h |
| 2.1.4 | UTF-8中文识别 | utf8.ts | P0 | 2h |
| 2.1.5 | Token位置追踪 | tokenizer位置信息 | P1 | 1h |
| 2.1.6 | 错误收集机制 | LexerError | P1 | 1h |

**产出物**:
```typescript
// tokens.ts
enum TokenType {
  // 关键字
  场景, 功能, 测试点, 动作因子, 数据因子, 测试用例,
  预制条件, 测试步骤, 预期结果,
  继承, 导入, 导出, 抽象, 描述, 合并策略,
  覆盖, 合并, 报错, 来源, 参数,
  测试流程, 序列, 调用, 断言,
  
  // 符号
  左大括号, 右大括号,
  左小括号, 右小括号,
  等号, 逗号, 冒号, 引号,
  
  // 基础
  标识符, 字符串, 数字,
  
  // 特殊
  模板变量,  // {变量名}
  
  // 错误
  错误, 结束
}

interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
  position: number;
}
```

**中文关键字映射**:
```typescript
const CHINESE_KEYWORDS = {
  '场景': TokenType.场景,
  '功能': TokenType.功能,
  '测试点': TokenType.测试点,
  '动作因子': TokenType.动作因子,
  '数据因子': TokenType.数据因子,
  '测试用例': TokenType.测试用例,
  '预制条件': TokenType.预制条件,
  '测试步骤': TokenType.测试步骤,
  '预期结果': TokenType.预期结果,
  '继承': TokenType.继承,
  '导入': TokenType.导入,
  '导出': TokenType.导出,
  '抽象': TokenType.抽象,
  '描述': TokenType.描述,
  '合并策略': TokenType.合并策略,
  '覆盖': TokenType.覆盖,
  '合并': TokenType.合并,
  '报错': TokenType.报错,
  '来源': TokenType.来源,
  '参数': TokenType.参数,
  '测试流程': TokenType.测试流程,
  '序列': TokenType.序列,
  '调用': TokenType.调用,
  '断言': TokenType.断言,
};

// 英文关键字兼容映射
const ENGLISH_KEYWORDS = {
  'SCENARIO': TokenType.场景,
  'FUNCTION': TokenType.功能,
  'TEST_POINT': TokenType.测试点,
  // ...
};
```

---

### 2.2 语法分析器（Parser）

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 2.2.1 | 语法定义 | grammar.ts | P0 | 2h |
| 2.2.2 | AST节点类型 | ast/nodes.ts | P0 | 2h |
| 2.2.3 | Parser实现 | parser.ts | P0 | 6h |
| 2.2.4 | 场景解析 | parseScenario() | P0 | 2h |
| 2.2.5 | 功能解析 | parseFunction() | P0 | 2h |
| 2.2.6 | 测试点/用例解析 | parseTestPoint() | P0 | 2h |
| 2.2.7 | 因子解析 | parseFactor() | P1 | 1h |
| 2.2.8 | 导入/导出解析 | parseImport/Export() | P0 | 1h |
| 2.2.9 | 继承解析 | parseExtends() | P0 | 1h |
| 2.2.10 | 错误恢复 | Error recovery | P1 | 2h |

**产出物**:
```typescript
// ast/nodes.ts
interface UTLModule {
  type: '模块';
  imports: ImportStatement[];
  exports: ExportStatement[];
  definitions: Definition[];
}

interface ImportStatement {
  type: '导入';
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
  template?: string;
}

interface DataFactorDef {
  type: '数据因子';
  name: string;
  defaultValue?: string;
}
```

---

### 2.3 语义分析（Semantic Analysis）

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 2.3.1 | 符号表实现 | symbolTable.ts | P0 | 2h |
| 2.3.2 | 模块加载器 | moduleLoader.ts | P0 | 3h |
| 2.3.3 | 继承解析器 | inheritanceResolver.ts | P0 | 6h |
| 2.3.4 | 单继承解析 | resolveSingleInheritance() | P0 | 2h |
| 2.3.5 | 多继承解析 | resolveMultipleInheritance() | P0 | 3h |
| 2.3.6 | 合并策略实现 | applyMergeStrategy() | P0 | 2h |
| 2.3.7 | 循环继承检测 | detectCircularInheritance() | P1 | 2h |
| 2.3.8 | 未定义引用检查 | checkUndefinedReferences() | P1 | 1h |
| 2.3.9 | 错误收集器 | errorCollector.ts | P0 | 1h |

**产出物**:
```typescript
// semantic/inheritanceResolver.ts
export class InheritanceResolver {
  private symbolTable: SymbolTable;
  private moduleLoader: ModuleLoader;
  
  // 解析继承链
  resolve(node: FunctionDef): ResolvedFunction {
    const chain = this.buildChain(node);
    return this.mergeWithStrategy(node, chain, node.mergeStrategy);
  }
  
  // 构建继承链（支持多继承）
  private buildChain(node: FunctionDef): FunctionDef[] {
    const chain: FunctionDef[] = [];
    for (const parentRef of node.extends) {
      const parent = this.resolveRef(parentRef);
      if (parent) {
        chain.push(...this.buildChain(parent));  // 递归
        chain.push(parent);
      }
    }
    return chain;
  }
  
  // 合并策略
  private mergeWithStrategy(
    node: FunctionDef,
    chain: FunctionDef[],
    strategy: '覆盖' | '合并' | '报错'
  ): ResolvedFunction {
    // ...
  }
}
```

---

### 2.4 代码生成（Code Generation）

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 2.4.1 | AST -> JSON生成 | jsonGenerator.ts | P0 | 3h |
| 2.4.2 | JSON -> AST转换 | astBuilder.ts | P0 | 3h |
| 2.4.3 | AST -> UTL源码生成 | utlGenerator.ts | P0 | 4h |
| 2.4.4 | 中文输出格式化 | chineseFormatter.ts | P0 | 2h |
| 2.4.5 | 格式化配置 | formatOptions | P1 | 1h |

**产出物**:
```typescript
// codegen/jsonGenerator.ts
export class JSONGenerator {
  // AST -> 脑图JSON数据
  generate(ast: UTLModule): MindmapData {
    const nodes: Node[] = [];
    const relations: Relation[] = [];
    
    for (const def of ast.definitions) {
      this.processDefinition(def, nodes, relations);
    }
    
    return { nodes, relations, utlSource: this.generateSource(ast) };
  }
  
  private processDefinition(
    def: Definition,
    nodes: Node[],
    relations: Relation[]
  ): void {
    switch (def.type) {
      case '场景':
        this.processScenario(def, nodes, relations);
        break;
      case '功能':
        this.processFunction(def, nodes, relations);
        break;
      // ...
    }
  }
}

// codegen/utlGenerator.ts
export class UTLGenerator {
  // JSON数据 -> UTL源码（中文）
  generate(mindmapData: MindmapData, options: GenerateOptions): string {
    const lines: string[] = [];
    
    // 生成模块头部
    for (const imp of mindmapData.imports) {
      lines.push(`导入 ${imp.kind} "${imp.name}" 来源 "${imp.from}"`);
    }
    
    // 生成定义
    for (const node of mindmapData.nodes) {
      lines.push(this.generateNode(node, options));
    }
    
    // 生成导出
    for (const exp of mindmapData.exports) {
      lines.push(`导出 ${exp.kind} "${exp.names.join(', ')}"`);
    }
    
    return lines.join('\n');
  }
  
  private generateNode(node: Node, options: GenerateOptions): string {
    const lines: string[] = [];
    
    // 中文关键字映射
    const keyword = this.getChineseKeyword(node.type);
    
    // 继承声明
    const extendsClause = node.metadata.extendsNodes?.length
      ? ` 继承 "${node.metadata.extendsNodes.join(', ')}"`
      : '';
    
    lines.push(`${keyword} "${node.name}"${extendsClause} {`);
    
    // 描述
    if (node.description) {
      lines.push(`  描述 "${node.description}"`);
    }
    
    // 合并策略
    if (node.metadata.mergeStrategy) {
      lines.push(`  合并策略 ${node.metadata.mergeStrategy}`);
    }
    
    // 子节点
    for (const child of node.children) {
      lines.push(this.generateNode(child, options));
    }
    
    lines.push('}');
    
    return lines.map(l => '  ' + l).join('\n');
  }
}
```

---

### 2.5 双向同步引擎

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 2.5.1 | 同步引擎骨架 | mindmapSync.ts | P0 | 2h |
| 2.5.2 | UTL -> 脑图同步 | syncFromUTL() | P0 | 4h |
| 2.5.3 | 脑图 -> UTL同步 | syncFromMindmap() | P0 | 4h |
| 2.5.4 | 增量同步设计 | incrementalSync.ts | P0 | 4h |
| 2.5.5 | 源码位置映射 | sourcePositionMap.ts | P1 | 2h |
| 2.5.6 | 差异计算 | diffCalculator.ts | P0 | 3h |
| 2.5.7 | 冲突检测 | syncConflictDetector.ts | P1 | 2h |

**产出物**:
```typescript
// codegen/mindmapSync.ts
export class MindmapSyncEngine {
  private parser: UTLParser;
  private generator: UTLGenerator;
  private positionMap: SourcePositionMap;
  
  // UTL -> 脑图（全量）
  parseToMindmap(utlSource: string): SyncResult {
    try {
      const ast = this.parser.parse(utlSource);
      const resolved = this.parser.resolveInheritance(ast);
      const mindmap = this.generator.toMindmapData(resolved);
      
      // 记录位置映射
      this.positionMap = this.buildPositionMap(ast, mindmap);
      
      return { success: true, mindmap, errors: [] };
    } catch (error) {
      return { success: false, mindmap: null, errors: [error] };
    }
  }
  
  // 脑图 -> UTL（全量）
  generateUTL(mindmapData: MindmapData): string {
    const ast = this.generator.toAST(mindmapData);
    return this.generator.toUTLSource(ast, { language: 'chinese' });
  }
  
  // 增量同步：脑图节点变更 -> UTL源码变更
  syncNodeChange(
    source: string,
    nodeId: string,
    change: NodeChange
  ): UTLChange {
    const position = this.positionMap.getNodePosition(nodeId);
    const newText = this.generateNodeText(change.node);
    
    return {
      start: position.start,
      end: position.end,
      newText: newText
    };
  }
  
  // 增量同步：UTL源码变更 -> 脑图节点变更
  syncSourceChange(
    oldSource: string,
    newSource: string
  ): MindmapChange[] {
    const diff = this.calculateDiff(oldSource, newSource);
    const changes: MindmapChange[] = [];
    
    for (const change of diff) {
      if (change.type === 'insert') {
        // 新增节点
        const ast = this.parser.parseFragment(change.text);
        changes.push({ type: 'create', node: this.toNode(ast) });
      } else if (change.type === 'delete') {
        // 删除节点
        changes.push({ type: 'delete', nodeId: this.findNodeId(change.position) });
      } else if (change.type === 'modify') {
        // 修改节点
        changes.push({ type: 'update', nodeId: this.findNodeId(change.position), changes: this.parseChanges(change) });
      }
    }
    
    return changes;
  }
  
  // 计算差异
  private calculateDiff(oldSource: string, newSource: string): DiffResult[] {
    // 使用行级diff算法
    // ...
  }
}
```

---

### 2.6 脚本编辑器集成

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 2.6.1 | Monaco Editor集成 | UTLScriptEditor.tsx | P0 | 2h |
| 2.6.2 | 中文语法高亮定义 | utlLanguage.ts | P0 | 3h |
| 2.6.3 | 自动补全定义 | utlCompletion.ts | P0 | 3h |
| 2.6.4 | 错误标记集成 | errorMarkers.ts | P0 | 2h |
| 2.6.5 | 实时验证 | liveValidation.ts | P1 | 2h |
| 2.6.6 | 分屏同步控制器 | SyncController.tsx | P0 | 4h |

**产出物**:
```typescript
// Monaco语言定义
monaco.languages.register({ id: 'utl' });

monaco.languages.setMonarchTokensProvider('utl', {
  // 中文关键字
  keywords: [
    '场景', '功能', '测试点', '动作因子', '数据因子', '测试用例',
    '预制条件', '测试步骤', '预期结果', '继承', '导入', '导出',
    '抽象', '描述', '合并策略', '覆盖', '合并', '报错', '来源',
    '参数', '测试流程', '序列', '调用', '断言'
  ],
  
  // 英文关键字（兼容）
  keywords_en: [
    'SCENARIO', 'FUNCTION', 'TEST_POINT', 'ACTION_FACTOR', 'DATA_FACTOR',
    'TEST_CASE', 'PRECONDITION', 'TEST_STEP', 'EXPECTED_RESULT',
    'EXTENDS', 'IMPORT', 'EXPORT', 'ABSTRACT', 'DESCRIPTION',
    'FROM', 'WITH', 'TEST_FLOW', 'SEQUENCE', 'CALL', 'ASSERT'
  ],
  
  // Token规则
  tokenizer: {
    root: [
      // 中文关键字
      [/[场景功能测试点动作因子数据因子测试用例预制条件测试步骤预期结果继承导入导出抽象描述合并策略覆盖合并报错来源参数测试流程序列调用断言]/, 'keyword'],
      
      // 字符串
      [/"([^"]*)"/, 'string'],
      
      // 模板变量
      [/\{([^}]+)\}/, 'variable'],
      
      // 符号
      [/[{}(),:=]/, 'delimiter'],
      
      // 数字
      [/\d+/, 'number'],
      
      // 标识符（中文/英文）
      [/[\u4e00-\u9fa5a-zA-Z_][\u4e00-\u9fa5a-zA-Z0-9_]*/, 'identifier'],
    ]
  }
});

// 自动补全
monaco.languages.registerCompletionItemProvider('utl', {
  provideCompletionItems: (model, position) => {
    const suggestions = [
      {
        label: '场景',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: '场景 "${1:名称}" {\n  ${2}\n}',
        documentation: '定义测试场景'
      },
      {
        label: '功能',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: '功能 "${1:名称}" 继承 "${2:父节点}" {\n  ${3}\n}',
        documentation: '定义功能，可继承场景或其他功能'
      },
      {
        label: '测试用例',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: '测试用例 "${1:名称}" {\n  预制条件 "${2}"\n  测试步骤 "${3}"\n  预期结果 "${4}"\n}',
        documentation: '定义测试用例'
      },
      // ...更多补全项
    ];
    
    return { suggestions };
  }
});
```

---

### 2.7 测试

| 任务ID | 任务描述 | 产出物 | 优先级 | 预估时间 |
|--------|---------|--------|--------|---------|
| 2.7.1 | Lexer单元测试 | lexer.test.ts | P0 | 3h |
| 2.7.2 | Parser单元测试 | parser.test.ts | P0 | 4h |
| 2.7.3 | 继承解析测试 | inheritance.test.ts | P0 | 3h |
| 2.7.4 | 双向同步测试 | sync.test.ts | P0 | 4h |
| 2.7.5 | 中文语法测试 | chinese.test.ts | P0 | 2h |
| 2.7.6 | 错误处理测试 | error.test.ts | P1 | 2h |

---

## 依赖关系图

```
2.1 Lexer
    │
    ├── 2.2 Parser (依赖 2.1)
    │       │
    │       ├── 2.3 Semantic (依赖 2.2)
    │       │       │
    │       │       ├── 2.3.1-2.3.2 符号表 + 模块加载 (并行)
    │       │       └── 2.3.3-2.3.7 继承解析 (依赖 2.3.1, 2.3.2)
    │       │
    │       └── 2.4 CodeGen (依赖 2.2, 2.3)
    │               │
    │               ├── 2.4.1-2.4.2 JSON转换 (并行)
    │               └── 2.4.3-2.4.5 UTL生成 (依赖 2.4.2)
    │
    ├── 2.5 Sync Engine (依赖 2.3, 2.4)
    │       │
    │       ├── 2.5.2-2.5.3 全量同步 (并行)
    │       └── 2.5.4-2.5.7 增量同步 (依赖 2.5.2)
    │
    ├── 2.6 Editor Integration (依赖 2.5)
    │       │
    │       ├── 2.6.1-2.6.4 Monaco配置 (并行)
    │       └── 2.6.5-2.6.6 验证+同步 (依赖 2.6.1)
    │
    └── 2.7 测试 (依赖 2.1-2.6)
```

---

## 并行执行策略

**Week 3 (Day 11-15)**:
```
Day 11-12:
  - [语言] 2.1 Lexer (全部)
  
Day 13-14:
  - [语言] 2.2 Parser (全部)
  
Day 15:
  - [语言] 2.3.1-2.3.2 符号表 + 模块加载
  - [测试] 2.7.1-2.7.2 Lexer + Parser测试
```

**Week 4 (Day 16-20)**:
```
Day 16-17:
  - [语言] 2.3.3-2.3.7 继承解析
  - [语言] 2.4.1-2.4.2 JSON转换
  
Day 18:
  - [语言] 2.4.3-2.4.5 UTL生成
  - [测试] 2.7.3 继承测试
  
Day 19:
  - [语言] 2.5.1-2.5.3 同步引擎
  - [前端] 2.6.1-2.6.2 Monaco集成
  
Day 20:
  - [语言] 2.5.4-2.5.7 增量同步
  - [前端] 2.6.3-2.6.6 补全 + 验证 + 同步
  - [测试] 2.7.4-2.7.6 同步 + 中文测试
  - [全员] 集成验证
```

---

## 验收标准

### Phase 2完成条件

| 检查项 | 标准 |
|--------|------|
| 中文关键字识别 | 所有中文关键字正确识别 |
| 中文标识符支持 | 中文节点名称、描述正常解析 |
| 双语兼容 | 英文关键字同样可用 |
| 场景解析 | 场景定义正确解析为AST |
| 功能解析 | 功能定义、继承声明正确解析 |
| 测试用例解析 | 测试用例完整解析 |
| 单继承解析 | 单继承链正确解析 |
| 多继承解析 | 多继承按策略正确合并 |
| 合并策略 | 覆盖/合并/报错三种策略正确执行 |
| 循环继承检测 | 循环继承报错 |
| JSON生成 | AST正确转换为Node数据 |
| UTL生成 | Node数据正确生成中文UTL |
| 双向同步 | 脑图 <-> UTL双向转换无损 |
| 增量同步 | 单节点变更触发最小源码更新 |
| 语法高亮 | Monaco中文语法高亮正常 |
| 自动补全 | 中文关键字、模板自动补全 |
| 实时验证 | 编辑时实时显示语法错误 |
| Lexer测试 | 100%通过 |
| Parser测试 | 100%通过 |
| 继承测试 | 100%通过 |
| 同步测试 | 100%通过 |

---

## Phase 2输出总结

**语言包可用**: utl-language独立npm包
**解析器可用**: 中文UTL完整解析
**双向同步可用**: 脑图-脚本无缝切换
**编辑器可用**: Monaco中文UTL编辑器