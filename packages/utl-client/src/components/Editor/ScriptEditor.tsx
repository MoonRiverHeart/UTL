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
  keywords: ['场景', 'SCENARIO', '功能', 'FUNCTION', '测试点', 'TEST_POINT', '动作因子', 'ACTION_FACTOR', '数据因子', 'DATA_FACTOR', '测试用例', 'TEST_CASE', '预制条件', 'PRECONDITION', '测试步骤', 'TEST_STEP', '预期结果', 'EXPECTED_RESULT', '继承', 'EXTENDS', '导入', 'IMPORT', '导出', 'EXPORT', '抽象', 'ABSTRACT', '描述', 'DESCRIPTION', '合并策略', '覆盖', '合并', '报错', '来源', 'FROM', '参数', 'WITH', '测试流程', 'TEST_FLOW', '序列', 'SEQUENCE', '调用', 'CALL', '断言', 'ASSERT'],
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

  const mindmapId = params.mindmapId;
  const isSplitMode = location.pathname.includes('/split');

  const generateUTL = (nodesData: typeof nodes, relationsData: typeof relations, name: string) => {
    let utl = `// UTL 测试脚本 - ${name}\n// ${new Date().toLocaleString()}\n\n`;
    
    const scenarios = nodesData.filter(n => n.type === 'scenario');
    const functions = nodesData.filter(n => n.type === 'function');
    const testCases = nodesData.filter(n => n.type === 'test_case');
    
    for (const s of scenarios) {
      utl += `场景 "${s.name}" {\n`;
      if (s.description) utl += `  描述 "${s.description}"\n`;
      const factors = relationsData.filter(r => r.targetId === s.id && r.type === 'contains');
      for (const fr of factors) {
        const f = nodesData.find(n => n.id === fr.sourceId);
        if (f?.type === 'action_factor') utl += `  动作因子 "${f.name}"\n`;
        if (f?.type === 'data_factor') utl += `  数据因子 "${f.name}"\n`;
      }
      utl += `}\n\n`;
    }
    
    for (const fn of functions) {
      const ext = relationsData.find(r => r.sourceId === fn.id && r.type === 'extends');
      utl += `功能 "${fn.name}"${ext ? ` 继承 "${nodesData.find(n => n.id === ext.targetId)?.name}"` : ''} {\n`;
      if (fn.description) utl += `  描述 "${fn.description}"\n`;
      
      const tps = relationsData.filter(r => r.targetId === fn.id && r.type === 'contains').map(r => nodesData.find(n => n.id === r.sourceId)).filter(n => n?.type === 'test_point');
      for (const tp of tps) {
        utl += `  测试点 "${tp!.name}" {\n`;
        const tcs = relationsData.filter(r => r.targetId === tp!.id && r.type === 'contains').map(r => nodesData.find(n => n.id === r.sourceId)).filter(n => n?.type === 'test_case');
        for (const tc of tcs) {
          utl += `    测试用例 "${tc!.name}" {\n`;
          const children = relationsData.filter(r => r.targetId === tc!.id && r.type === 'contains').map(r => nodesData.find(n => n.id === r.sourceId));
          for (const c of children) {
            if (c?.type === 'precondition') utl += `      预制条件 "${c.name}"\n`;
            if (c?.type === 'test_step') utl += `      测试步骤 "${c.name}"\n`;
            if (c?.type === 'expected_result') utl += `      预期结果 "${c.name}"\n`;
          }
          utl += `    }\n`;
        }
        utl += `  }\n`;
      }
      utl += `}\n\n`;
    }
    
    if (!scenarios.length && !functions.length && testCases.length) {
      utl += `场景 "${name}" {\n`;
      for (const tc of testCases) {
        utl += `  功能 "${tc.name}" {\n`;
        utl += `    测试点 "${tc.name}" {\n`;
        utl += `      测试用例 "${tc.name}" {\n`;
        const children = relationsData.filter(r => r.targetId === tc.id && r.type === 'contains').map(r => nodesData.find(n => n.id === r.sourceId));
        for (const c of children) {
          if (c?.type === 'precondition') utl += `        预制条件 "${c.name}"\n`;
          if (c?.type === 'test_step') utl += `        测试步骤 "${c.name}"\n`;
          if (c?.type === 'expected_result') utl += `        预期结果 "${c.name}"\n`;
        }
        utl += `      }\n    }\n  }\n`;
      }
      utl += `}\n`;
    }
    
    return utl;
  };

  const parseUTLToNodes = (utlContent: string) => {
    const newNodes: { type: string; name: string; description?: string }[] = [];
    const lines = utlContent.split('\n');
    let parentStack: { type: string; name: string }[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      for (const [keyword, type] of Object.entries(TYPE_MAP)) {
        const match = trimmed.match(new RegExp(`^${keyword}\\s+"([^"]+)"`));
        if (match) {
          const name = match[1];
          const node = { type, name };
          
          if (trimmed.includes('{')) {
            newNodes.push(node);
            parentStack.push(node);
          } else if (parentStack.length > 0) {
            newNodes.push(node);
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
    }
    
    return newNodes;
  };

  const syncToMindmap = async () => {
    if (!mindmapId || !currentMindmap?.workspaceId) return;
    
    const parsedNodes = parseUTLToNodes(content);
    if (parsedNodes.length === 0) {
      message.warning('未解析到有效节点');
      return;
    }
    
    setSaving(true);
    try {
      const existingNodes = await api.get(`/nodes/mindmap/${mindmapId}`);
      const existingNames = new Map(existingNodes.data.map((n: { name: string; id: string }) => [n.name, n.id]));
      
      let xPos = 100;
      let yPos = 100;
      
      for (const parsedNode of parsedNodes) {
        if (!existingNames.has(parsedNode.name)) {
          await api.post(`/nodes/mindmap/${mindmapId}`, {
            type: parsedNode.type,
            name: parsedNode.name,
            description: parsedNode.description || '',
            workspaceId: currentMindmap.workspaceId,
            x: xPos,
            y: yPos,
            metadata: {},
            versionId: 'v1',
            branchId: 'main',
          });
          xPos += 180;
          if (xPos > 600) { xPos = 100; yPos += 80; }
        } else {
          const existingId = existingNames.get(parsedNode.name);
          if (existingId && parsedNode.description) {
            await api.put(`/nodes/${existingId}`, { description: parsedNode.description });
          }
        }
      }
      
      lastSyncedContent.current = content;
      message.success('已同步到脑图');
      await loadUTL();
    } catch {
      message.error('同步失败');
    } finally {
      setSaving(false);
    }
  };

  const loadUTL = useCallback(async () => {
    if (!mindmapId) return;
    setLoading(true);
    try {
      const mindmapRes = await api.get(`/mindmaps/${mindmapId}`);
      const nodesRes = await api.get(`/nodes/mindmap/${mindmapId}`);
      const relationsRes = await api.get(`/relations/mindmap/${mindmapId}`);
      
      setNodes(nodesRes.data);
      setRelations(relationsRes.data);
      
      const generatedUTL = generateUTL(nodesRes.data, relationsRes.data, mindmapRes.data.name);
      setContent(generatedUTL);
      lastSyncedContent.current = generatedUTL;
    } catch {
      setContent(`// 加载失败\n// 脑图ID: ${mindmapId}`);
    } finally {
      setLoading(false);
    }
  }, [mindmapId, setNodes, setRelations]);

  useEffect(() => { loadUTL(); }, [loadUTL]);

  useEffect(() => {
    if (isSplitMode && !loading && nodes.length > 0) {
      const newUTL = generateUTL(nodes, relations, currentMindmap?.name || '脑图');
      if (newUTL !== lastSyncedContent.current) {
        setContent(newUTL);
        lastSyncedContent.current = newUTL;
      }
    }
  }, [isSplitMode, loading, nodes, relations, currentMindmap?.name]);

  const handleSave = async () => {
    if (!mindmapId) return;
    setSaving(true);
    try {
      await api.put(`/mindmaps/${mindmapId}`, { utlSource: content });
      message.success('脚本已保存');
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncFromMindmap = async () => { await loadUTL(); message.success('已从脑图同步'); };
  
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