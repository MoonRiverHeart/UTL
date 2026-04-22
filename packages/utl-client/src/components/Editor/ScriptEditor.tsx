import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Button, Space, Tag, message, Popconfirm } from 'antd';
import { SaveOutlined, SyncOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import api from '../../services/api';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useEditorStore } from '../../stores/editorStore';

const UTL_LANGUAGE = {
  defaultToken: '',
  tokenPostfix: '.utl',
  keywords: ['场景', 'SCENARIO', '功能', 'FUNCTION', '测试点', 'TEST_POINT', '动作因子', 'ACTION_FACTOR', '数据因子', 'DATA_FACTOR', '属性', 'ATTR', '方法', 'METHOD', '测试用例', 'TEST_CASE', '预制条件', 'PRECONDITION', '测试步骤', 'TEST_STEP', '预期结果', 'EXPECTED_RESULT', '继承', 'EXTENDS', '导入', 'IMPORT', '导出', 'EXPORT', '抽象', 'ABSTRACT', '描述', 'DESCRIPTION', '合并策略', '覆盖', '合并', '报错', '来源', 'FROM', '参数', 'WITH', '测试流程', 'TEST_FLOW', '序列', 'SEQUENCE', '调用', 'CALL', '断言', 'ASSERT'],
  tokenizer: {
    root: [
      [/[a-zA-Z_]\w*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
      [/[\u4e00-\u9fff]+/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
      [/"/, 'string', '@string'],
      [/'/, 'string', '@string2'],
      [/[0-9]+/, 'number'],
      [/[{}()\[\]:,=]/, 'delimiter'],
      [/[\/\/].*$/, 'comment'],
    ],
    string: [[/[^\\"]+/, 'string'], [/\\./, 'string.escape'], [/"/, 'string', '@pop']],
    string2: [[/[^\\']+/, 'string'], [/\\./, 'string.escape'], [/'/, 'string', '@pop']],
  }
};

const TYPE_MAP: Record<string, string> = {
  '场景': 'scenario', 'SCENARIO': 'scenario',
  '功能': 'function', 'FUNCTION': 'function',
  '测试点': 'test_point', 'TEST_POINT': 'test_point',
  '动作因子': 'action_factor', 'ACTION_FACTOR': 'action_factor',
  '数据因子': 'data_factor', 'DATA_FACTOR': 'data_factor',
  '属性': 'attr', 'ATTR': 'attr',
  '方法': 'method', 'METHOD': 'method',
  '测试用例': 'test_case', 'TEST_CASE': 'test_case',
  '预制条件': 'precondition', 'PRECONDITION': 'precondition',
  '测试步骤': 'test_step', 'TEST_STEP': 'test_step',
  '预期结果': 'expected_result', 'EXPECTED_RESULT': 'expected_result',
};

export default function ScriptEditor() {
  const params = useParams();
  const location = useLocation();
  const { currentMindmap } = useWorkspaceStore();
  const { nodes, relations, setNodes, setRelations } = useEditorStore();
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const lastSyncedContent = useRef<string>('');
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isCodeDriven = useRef(false);
  const pendingSyncContent = useRef<string>('');
  const needsSync = useRef(false);

  const mindmapId = params.mindmapId;
  const isSplitMode = location.pathname.includes('/split');
  const initialContentLoaded = useRef(false);
  const sessionKey = `utl-draft-${mindmapId}`;

  const generateUTL = (nodesData: typeof nodes, relationsData: typeof relations, name: string) => {
    let utl = `// UTL 测试脚本 - ${name}\n// ${new Date().toLocaleString()}\n\n`;
    
    const scenarios = nodesData.filter(n => n.type === 'scenario');
    const functions = nodesData.filter(n => n.type === 'function');
    
    // 记录已被场景包含的功能，避免重复生成
    const functionsInScenarios = new Set<string>();
    
    // 查找场景包含功能的连线（语义上应该是继承关系）
    for (const s of scenarios) {
      const containsFns = relationsData.filter(r => 
        r.sourceId === s.id && 
        r.type === 'contains' && 
        nodesData.find(n => n.id === r.targetId)?.type === 'function'
      );
      for (const rel of containsFns) {
        functionsInScenarios.add(rel.targetId);
      }
    }
    
    // 查找功能继承场景的连线
    const functionExtendsScenario = new Map<string, string>();
    for (const fn of functions) {
      const ext = relationsData.find(r => r.sourceId === fn.id && r.type === 'extends');
      if (ext) {
        const target = nodesData.find(n => n.id === ext.targetId);
        if (target?.type === 'scenario') {
          functionExtendsScenario.set(fn.id, target.name);
        }
      }
      // 如果场景包含功能，也当作继承关系
      const containedByScenario = relationsData.find(r => 
        r.targetId === fn.id && 
        r.type === 'contains' && 
        nodesData.find(n => n.id === r.sourceId)?.type === 'scenario'
      );
      if (containedByScenario && !ext) {
        const scenario = nodesData.find(n => n.id === containedByScenario.sourceId);
        if (scenario) {
          functionExtendsScenario.set(fn.id, scenario.name);
          functionsInScenarios.add(fn.id);
        }
      }
    }
    
    for (const s of scenarios) {
      utl += `场景 "${s.name}" {\n`;
      if (s.description) utl += `  描述 "${s.description}"\n`;
      
      // 只生成因子，不生成功能（功能用继承表示）
      const factors = relationsData.filter(r => r.sourceId === s.id && r.type === 'contains');
      for (const fr of factors) {
        const f = nodesData.find(n => n.id === fr.targetId);
        if (f?.type === 'action_factor') utl += `  动作因子 "${f.name}"\n`;
        if (f?.type === 'data_factor') utl += `  数据因子 "${f.name}"\n`;
      }
      utl += `}\n\n`;
    }
    
    for (const fn of functions) {
      // 如果功能已被场景包含，但不是继承关系，跳过独立生成
      if (functionsInScenarios.has(fn.id) && !functionExtendsScenario.has(fn.id)) {
        continue;
      }
      
      const parentName = functionExtendsScenario.get(fn.id);
      utl += `功能 "${fn.name}"${parentName ? ` 继承 "${parentName}"` : ''} {\n`;
      if (fn.description) utl += `  描述 "${fn.description}"\n`;
      
      const children = relationsData.filter(r => r.sourceId === fn.id && r.type === 'contains');
      for (const cr of children) {
        const child = nodesData.find(n => n.id === cr.targetId);
        if (child?.type === 'test_point') {
          utl += `  测试点 "${child.name}" {\n`;
          const tpChildren = relationsData.filter(r => r.sourceId === child.id && r.type === 'contains');
          
          const attrNodes = tpChildren.filter(tcr => {
            const tc = nodesData.find(n => n.id === tcr.targetId);
            return tc?.type === 'attr';
          });
          
          if (attrNodes.length > 0) {
            utl += `    属性 {\n`;
            for (const attrRel of attrNodes) {
              const attrNode = nodesData.find(n => n.id === attrRel.targetId);
              if (attrNode) {
                const attrChildren = relationsData.filter(r => r.sourceId === attrNode.id && r.type === 'contains');
                for (const acr of attrChildren) {
                  const ac = nodesData.find(n => n.id === acr.targetId);
                  if (ac?.type === 'action_factor') utl += `      动作因子 "${ac.name}"\n`;
                  if (ac?.type === 'data_factor') utl += `      数据因子 "${ac.name}"\n`;
                }
              }
            }
            utl += `    }\n`;
          } else {
            const attrFactors = tpChildren.filter(tcr => {
              const tc = nodesData.find(n => n.id === tcr.targetId);
              return tc?.type === 'action_factor' || tc?.type === 'data_factor';
            });
            
            if (attrFactors.length > 0) {
              utl += `    属性 {\n`;
              for (const tcr of attrFactors) {
                const tc = nodesData.find(n => n.id === tcr.targetId);
                if (tc?.type === 'action_factor') utl += `      动作因子 "${tc.name}"\n`;
                if (tc?.type === 'data_factor') utl += `      数据因子 "${tc.name}"\n`;
              }
              utl += `    }\n`;
            }
          }
          
          const methodNodes = tpChildren.filter(tcr => {
            const tc = nodesData.find(n => n.id === tcr.targetId);
            return tc?.type === 'method';
          });
          
          if (methodNodes.length > 0) {
            for (const methodRel of methodNodes) {
              const methodNode = nodesData.find(n => n.id === methodRel.targetId);
              if (methodNode) {
                utl += `    方法 "${methodNode.name}" {\n`;
                const methodChildren = relationsData.filter(r => r.sourceId === methodNode.id && r.type === 'contains');
                for (const mcr of methodChildren) {
                  const mc = nodesData.find(n => n.id === mcr.targetId);
                  if (mc?.type === 'precondition') utl += `      预制条件 "${mc.name}"\n`;
                  if (mc?.type === 'test_step') utl += `      测试步骤 "${mc.name}"\n`;
                  if (mc?.type === 'expected_result') utl += `      预期结果 "${mc.name}"\n`;
                }
                utl += `    }\n`;
              }
            }
          } else {
            const testCases = tpChildren.filter(tcr => {
              const tc = nodesData.find(n => n.id === tcr.targetId);
              return tc?.type === 'test_case';
            });
            
            for (const tcr of testCases) {
              const tc = nodesData.find(n => n.id === tcr.targetId);
              if (tc) {
                utl += `    方法 "${tc.name}" {\n`;
                const tcChildren = relationsData.filter(r => r.sourceId === tc.id && r.type === 'contains');
                for (const ccr of tcChildren) {
                  const c = nodesData.find(n => n.id === ccr.targetId);
                  if (c?.type === 'precondition') utl += `      预制条件 "${c.name}"\n`;
                  if (c?.type === 'test_step') utl += `      测试步骤 "${c.name}"\n`;
                  if (c?.type === 'expected_result') utl += `      预期结果 "${c.name}"\n`;
                }
                utl += `    }\n`;
              }
            }
            
            const otherChildren = tpChildren.filter(tcr => {
              const tc = nodesData.find(n => n.id === tcr.targetId);
              return tc?.type === 'precondition' || tc?.type === 'test_step' || tc?.type === 'expected_result';
            });
            
            if (otherChildren.length > 0) {
              utl += `    方法 "默认测试" {\n`;
              for (const tcr of otherChildren) {
                const tc = nodesData.find(n => n.id === tcr.targetId);
                if (tc?.type === 'precondition') utl += `      预制条件 "${tc.name}"\n`;
                if (tc?.type === 'test_step') utl += `      测试步骤 "${tc.name}"\n`;
                if (tc?.type === 'expected_result') utl += `      预期结果 "${tc.name}"\n`;
              }
              utl += `    }\n`;
            }
          }
          
          utl += `  }\n`;
        }
        if (child?.type === 'action_factor') utl += `  动作因子 "${child.name}"\n`;
        if (child?.type === 'data_factor') utl += `  数据因子 "${child.name}"\n`;
      }
      utl += `}\n\n`;
    }
    
    return utl;
  };

  const parseUTLToNodes = (utlContent: string) => {
    const newNodes: { type: string; name: string; description?: string; x: number; y: number }[] = [];
    const newRelations: { source: string; target: string; type: string }[] = [];
    const lines = utlContent.split('\n');
    let parentStack: { type: string; name: string; index: number }[] = [];
    let yPosition = 100;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      for (const [keyword, type] of Object.entries(TYPE_MAP)) {
        const match = trimmed.match(new RegExp(`^${keyword}\\s+"([^"]+)"`));
        if (match) {
          const name = match[1];
          const index = newNodes.length;
          const node = { type, name, x: 100 + (parentStack.length * 150), y: yPosition };
          yPosition += 60;
          
          if (trimmed.includes('{')) {
            newNodes.push(node);
            parentStack.push({ type, name, index });
            
            if (parentStack.length > 1) {
              const parent = parentStack[parentStack.length - 2];
              newRelations.push({
                source: `parsed-${parent.index}`,
                target: `parsed-${index}`,
                type: 'contains',
              });
            }
          } else if (parentStack.length > 0) {
            newNodes.push(node);
            if (parentStack.length > 0) {
              const parent = parentStack[parentStack.length - 1];
              newRelations.push({
                source: `parsed-${parent.index}`,
                target: `parsed-${index}`,
                type: 'contains',
              });
            }
          }
          break;
        }
      }
      
      if (trimmed === '}') {
        parentStack.pop();
      }
      
      const descMatch = trimmed.match(/^描述\s+"([^"]+)"/);
      if (descMatch && newNodes.length > 0) {
        newNodes[newNodes.length - 1].description = descMatch[1];
      }
      
      const extMatch = trimmed.match(/继承\s+"([^"]+)"/);
      if (extMatch && newNodes.length > 0 && parentStack.length > 0) {
        const parentName = extMatch[1];
        const parentNode = newNodes.find(n => n.name === parentName);
        if (parentNode) {
          const childIndex = parentStack[parentStack.length - 1].index;
          newRelations.push({
            source: `parsed-${childIndex}`,
            target: `parsed-${newNodes.indexOf(parentNode)}`,
            type: 'extends',
          });
        }
      }
    }
    
    return { nodes: newNodes, relations: newRelations };
  };

  const syncToMindmap = async () => {
    if (!mindmapId || !currentMindmap?.workspaceId) return;
    
    const parsed = parseUTLToNodes(content);
    if (parsed.nodes.length === 0) {
      message.warning('未解析到有效节点');
      return;
    }
    
    setSaving(true);
    try {
      const existingNodesRes = await api.get(`/nodes/mindmap/${mindmapId}`);
      const existingNodes = existingNodesRes.data as { id: string; name: string; type: string }[];
      const existingRelationsRes = await api.get(`/relations/mindmap/${mindmapId}`);
      const existingRelations = existingRelationsRes.data as { id: string; sourceId: string; targetId: string; type: string }[];
      
      // 建立节点名称到ID的映射（包括新创建的）
      const nodeNameToId = new Map<string, string>();
      existingNodes.forEach(n => nodeNameToId.set(n.name, n.id));
      
      // 删除代码中不存在的节点
      const parsedNames = new Set(parsed.nodes.map(n => n.name));
      for (const existing of existingNodes) {
        if (!parsedNames.has(existing.name)) {
          await api.delete(`/nodes/${existing.id}`);
        }
      }
      
      // 创建新节点
      let xPos = 100;
      let yPos = 100;
      for (const parsedNode of parsed.nodes) {
        if (!nodeNameToId.has(parsedNode.name)) {
          const response = await api.post(`/nodes/mindmap/${mindmapId}`, {
            type: parsedNode.type,
            name: parsedNode.name,
            description: parsedNode.description || '',
            workspaceId: currentMindmap.workspaceId,
            position: { x: xPos, y: yPos },
            metadata: {},
          });
          nodeNameToId.set(parsedNode.name, response.data.id);
          xPos += 180;
          if (xPos > 600) { xPos = 100; yPos += 80; }
        } else {
          xPos += 180;
          if (xPos > 600) { xPos = 100; yPos += 80; }
        }
      }
      
      // 同步关系：删除不存在的关系，创建新关系
      const parsedRelSet = new Set<string>();
      for (const rel of parsed.relations) {
        const sourceId = nodeNameToId.get(rel.source.replace('parsed-', '').split('-').length > 1 ? parsed.nodes[parseInt(rel.source.replace('parsed-', ''))]?.name : '');
        const targetId = nodeNameToId.get(rel.target.replace('parsed-', '').split('-').length > 1 ? parsed.nodes[parseInt(rel.target.replace('parsed-', ''))]?.name : '');
        
        // 从parsed索引获取节点名
        const sourceIndex = parseInt(rel.source.replace('parsed-', ''));
        const targetIndex = parseInt(rel.target.replace('parsed-', ''));
        const sourceName = parsed.nodes[sourceIndex]?.name;
        const targetName = parsed.nodes[targetIndex]?.name;
        
        if (sourceName && targetName) {
          const actualSourceId = nodeNameToId.get(sourceName);
          const actualTargetId = nodeNameToId.get(targetName);
          
          if (actualSourceId && actualTargetId) {
            parsedRelSet.add(`${actualSourceId}-${actualTargetId}-${rel.type}`);
            
            // 检查关系是否已存在
            const exists = existingRelations.some(er => 
              er.sourceId === actualSourceId && 
              er.targetId === actualTargetId && 
              er.type === rel.type
            );
            
            if (!exists) {
              await api.post('/relations', {
                mindmapId,
                sourceId: actualSourceId,
                targetId: actualTargetId,
                type: rel.type,
              });
            }
          }
        }
      }
      
      // 删除代码中不存在的关系
      for (const existingRel of existingRelations) {
        const key = `${existingRel.sourceId}-${existingRel.targetId}-${existingRel.type}`;
        if (!parsedRelSet.has(key)) {
          await api.delete(`/relations/${existingRel.id}`);
        }
      }
      
      lastSyncedContent.current = content;
      sessionStorage.removeItem(sessionKey);
      needsSync.current = false;
      message.success('已同步到脑图');
      await loadUTL();
    } catch (err) {
      console.error('Sync error:', err);
      message.error('同步失败');
    } finally {
      setSaving(false);
    }
  };

  const loadUTL = useCallback(async () => {
    if (!mindmapId) return;
    
    const savedDraft = sessionStorage.getItem(sessionKey);
    if (savedDraft) {
      setContent(savedDraft);
      lastSyncedContent.current = savedDraft;
      setLoading(false);
      initialContentLoaded.current = true;
      return;
    }
    
    setLoading(true);
    try {
      const mindmapRes = await api.get(`/mindmaps/${mindmapId}`);
      const nodesRes = await api.get(`/nodes/mindmap/${mindmapId}`);
      const relationsRes = await api.get(`/relations/mindmap/${mindmapId}`);
      
      // 转换节点数据，确保x/y有效
      const nodesData = nodesRes.data.map((n: any) => ({
        id: n.id,
        type: n.type,
        name: n.name,
        description: n.description || '',
        x: n.x ?? n.position?.x ?? 100,
        y: n.y ?? n.position?.y ?? 100,
        metadata: n.metadata || {},
      }));
      
      setNodes(nodesData);
      setRelations(relationsRes.data);
      
      const generatedUTL = generateUTL(nodesData, relationsRes.data, mindmapRes.data.name);
      setContent(generatedUTL);
      lastSyncedContent.current = generatedUTL;
    } catch {
      setContent(`// 加载失败\n// 脑图ID: ${mindmapId}`);
    } finally {
      setLoading(false);
    }
  }, [mindmapId, setNodes, setRelations]);

  useEffect(() => { 
    loadUTL(); 
    initialContentLoaded.current = true;
  }, [loadUTL]);

  useEffect(() => {
    if (!isSplitMode && initialContentLoaded.current && content && content !== lastSyncedContent.current) {
      needsSync.current = true;
      pendingSyncContent.current = content;
      sessionStorage.setItem(sessionKey, content);
    }
  }, [isSplitMode, content, sessionKey]);

  // 离开时自动同步（警告提示）
  useEffect(() => {
    return () => {
      if (!isSplitMode && needsSync.current) {
        message.warning('代码有未同步的变更，请手动点击"同步到脑图"');
      }
    };
  }, [isSplitMode]);

  // 分屏模式下：脑图→代码单向同步（显示实时变化）
  useEffect(() => {
    if (isSplitMode && !loading && !isCodeDriven.current) {
      const newUTL = generateUTL(nodes, relations, currentMindmap?.name || '脑图');
      if (newUTL !== lastSyncedContent.current) {
        setContent(newUTL);
        lastSyncedContent.current = newUTL;
      }
    }
  }, [isSplitMode, loading, nodes, relations, currentMindmap?.name]);

  // 分屏模式下：代码→脑图单向同步（更新本地显示，不保存到数据库）
  useEffect(() => {
    if (isSplitMode && !loading && content && content !== lastSyncedContent.current && !isCodeDriven.current) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        const parsed = parseUTLToNodes(content);
        if (parsed.nodes.length > 0) {
          const existingPositions = new Map<string, { x: number; y: number }>();
          nodes.forEach(n => {
            if (!n.id.startsWith('parsed-')) {
              existingPositions.set(n.name, { x: n.x, y: n.y });
            }
          });
          
          const mappedNodes = parsed.nodes.map((n, i) => {
            const existingPos = existingPositions.get(n.name);
            return {
              id: `parsed-${i}`,
              type: n.type,
              name: n.name,
              description: n.description || '',
              x: existingPos?.x ?? (100 + Math.floor(i / 5) * 180),
              y: existingPos?.y ?? (100 + (i % 5) * 80),
              metadata: {},
            };
          });
          const mappedRelations = parsed.relations.map((r, i) => ({
            id: `parsed-rel-${i}`,
            sourceId: r.source,
            targetId: r.target,
            type: r.type,
          }));
          // 只更新本地显示，不覆盖editorStore
          // 脑图Canvas会检测parsed-前缀并显示临时节点
          setNodes(mappedNodes);
          setRelations(mappedRelations);
        }
      }, 500);
    }
  }, [isSplitMode, loading, content, setNodes, setRelations]);

  const handleSave = async () => {
    if (!mindmapId) return;
    setSaving(true);
    try {
      await api.put(`/mindmaps/${mindmapId}`, { utlSource: content });
      sessionStorage.removeItem(sessionKey);
      lastSyncedContent.current = content;
      needsSync.current = false;
      message.success('脚本已保存');
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncFromMindmap = async () => {
    sessionStorage.removeItem(sessionKey);
    await loadUTL();
    message.success('已从脑图同步');
  };
  
  const handleExport = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentMindmap?.name || 'mindmap'}.utl`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>保存</Button>
          <Button icon={<SyncOutlined />} onClick={handleSyncFromMindmap}>从脑图同步</Button>
          <Popconfirm title="将UTL代码解析并同步到脑图？" onConfirm={syncToMindmap}>
            <Button icon={<UploadOutlined />} loading={saving}>同步到脑图</Button>
          </Popconfirm>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>
        </Space>
        <Space><Tag color="green">脚本模式</Tag><span>{currentMindmap?.name}</span><span>节点: {nodes.length}</span></Space>
      </div>
      <div style={{ flex: 1 }}>
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>⏳</div> : (
          <Editor height="100%" language="utl" value={content} onChange={(v) => v && setContent(v)}
            beforeMount={(m) => { m.languages.register({ id: 'utl' }); m.languages.setMonarchTokensProvider('utl', UTL_LANGUAGE as never); }}
            options={{ minimap: { enabled: true }, fontSize: 14, lineNumbers: 'on', wordWrap: 'on' }} />
        )}
      </div>
      <div style={{ padding: '8px 16px', background: '#fafafa', borderTop: '1px solid #e8e8e8', fontSize: 12, color: '#666' }}>
        <Space split={<span>|</span>}><span>支持中英文关键字</span><span>行数: {content.split('\n').length}</span><span>字符: {content.length}</span></Space>
      </div>
    </div>
  );
}