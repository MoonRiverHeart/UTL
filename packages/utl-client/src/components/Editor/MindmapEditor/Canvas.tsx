import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Button, Input, Drawer, Form, Space, Tag, message, Modal, Dropdown, Popconfirm, Select } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, LockOutlined } from '@ant-design/icons';
import { useWorkspaceStore } from '../../../stores/workspaceStore';
import { useEditorStore } from '../../../stores/editorStore';
import { useSocketStore } from '../../../stores/socketStore';
import api from '../../../services/api';

const TYPE_ABBR: Record<string, string> = {
  scenario: 'SC',
  function: 'FN',
  test_point: 'TP',
  attr: 'AT',
  method: 'MT',
  action_factor: 'AF',
  data_factor: 'DF',
  test_case: 'TC',
  precondition: 'PC',
  test_step: 'TS',
  expected_result: 'ER',
};

const NODE_TYPES = [
  { value: 'scenario', label: '场景', color: '#1890ff' },
  { value: 'function', label: '功能', color: '#52c41a' },
  { value: 'test_point', label: '测试点', color: '#faad14' },
  { value: 'attr', label: '属性', color: '#9c27b0' },
  { value: 'method', label: '方法', color: '#00bcd4' },
  { value: 'action_factor', label: '动作因子', color: '#722ed1' },
  { value: 'data_factor', label: '数据因子', color: '#eb2f96' },
  { value: 'test_case', label: '测试用例', color: '#13c2c2' },
  { value: 'precondition', label: '预制条件', color: '#fa8c16' },
  { value: 'test_step', label: '测试步骤', color: '#2f54eb' },
  { value: 'expected_result', label: '预期结果', color: '#f5222d' },
];

const RELATION_TYPES = [
  { value: 'contains', label: '包含' },
  { value: 'extends', label: '继承' },
  { value: 'references', label: '引用' },
  { value: 'depends_on', label: '依赖' },
];

const NODE_WIDTH = 120;
const NODE_HEIGHT = 36;

interface NodeData {
  id: string;
  type: string;
  name: string;
  description?: string;
  x: number;
  y: number;
  position?: { x: number; y: number };
  metadata?: Record<string, unknown>;
}

interface ConnectionDraft {
  sourceId: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

interface EditingRelationState {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
}

export default function BlueprintEditor() {
  const params = useParams();
  const location = useLocation();
  const { currentMindmap, userRole } = useWorkspaceStore();
  const { nodes, setNodes, relations, setRelations, selectedNodes, selectNode, clearSelection } = useEditorStore();
  const { connect, disconnect, emitNodeUpdate, emitNodeCreate, emitNodeDelete, emitRelationCreate, emitRelationDelete, emitBranchCheckout, socket, onlineUsers, connected } = useSocketStore();
  
  const isViewer = userRole === 'viewer';
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const connectionDraftRef = useRef<{ sourceId: string; sourceX: number; sourceY: number; targetX: number; targetY: number } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<NodeData | null>(null);
  const [relationDrawerOpen, setRelationDrawerOpen] = useState(false);
  const [editingRelation, setEditingRelationState] = useState<EditingRelationState | null>(null);
  const [connectionDraft, setConnectionDraft] = useState<ConnectionDraft | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [quickEditNodeId, setQuickEditNodeId] = useState<string | null>(null);
  const [quickEditValue, setQuickEditValue] = useState('');
  const [form] = Form.useForm();
  const [relationForm] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const mindmapId = params.mindmapId;
  const isSplitMode = location.pathname.includes('/split');

  const loadData = useCallback(async () => {
    if (!mindmapId) return;
    setLoading(true);
    try {
      const nodesRes = await api.get(`/nodes/mindmap/${mindmapId}`);
      const relationsRes = await api.get(`/relations/mindmap/${mindmapId}`);
      
      const nodesData = nodesRes.data.map((n: NodeData) => ({
        ...n,
        x: n.x ?? n.position?.x ?? 100 + Math.random() * 400,
        y: n.y ?? n.position?.y ?? 100 + Math.random() * 300,
      }));
      
      setNodes(nodesData);
      setRelations(relationsRes.data);
      setInitialized(true);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [mindmapId, setNodes, setRelations]);

  useEffect(() => {
    loadData();
    clearSelection();
  }, [loadData, clearSelection]);

  useEffect(() => {
    if (mindmapId) {
      connect(mindmapId);
    }
  }, [mindmapId, connect]);

  useEffect(() => {
    return () => {
      if (connected) {
        disconnect();
      }
    };
  }, [connected, disconnect]);

  useEffect(() => {
    if (!socket) return;

    socket.on('node_updated', (data: { nodeId: string; changes: Record<string, unknown> }) => {
      setNodes(prev => prev.map(n => n.id === data.nodeId ? { ...n, ...data.changes } : n));
    });

    socket.on('node_created', (data: { node: NodeData }) => {
      const newNode = {
        ...data.node,
        x: (data.node.position as any)?.x ?? data.node.x ?? 100,
        y: (data.node.position as any)?.y ?? data.node.y ?? 100,
      };
      setNodes(prev => prev.find(n => n.id === newNode.id) ? prev : [...prev, newNode]);
    });

    socket.on('node_deleted', (data: { nodeId: string }) => {
      setNodes(prev => prev.filter(n => n.id !== data.nodeId));
      setRelations(prev => prev.filter(r => r.sourceId !== data.nodeId && r.targetId !== data.nodeId));
    });

    socket.on('relation_created', (data: { relation: { id: string; sourceId: string; targetId: string; type: string } }) => {
      setRelations(prev => prev.find(r => r.id === data.relation.id) ? prev : [...prev, data.relation]);
    });

    socket.on('relation_deleted', (data: { relationId: string }) => {
      setRelations(prev => prev.filter(r => r.id !== data.relationId));
    });

    return () => {
      socket.off('node_updated');
      socket.off('node_created');
      socket.off('node_deleted');
      socket.off('relation_created');
      socket.off('relation_deleted');
    };
  }, [socket, setNodes, setRelations]);

  const getNodeColor = (type: string) => NODE_TYPES.find(t => t.value === type)?.color || '#666';
  const getNodeAbbr = (type: string) => TYPE_ABBR[type] || type.slice(0, 2).toUpperCase();

const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    selectNode(nodeId);
    
    if (isViewer) return;
    
    setDraggedNode(nodeId);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setDragOffset({ x: e.clientX - node.x, y: e.clientY - node.y });
    setHasDragged(false);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggedNode && !quickEditNodeId) {
      const dx = Math.abs(e.clientX - dragStartPos.x);
      const dy = Math.abs(e.clientY - dragStartPos.y);
      if (dx > 5 || dy > 5) {
        setHasDragged(true);
      }
      
      if (hasDragged || dx > 5 || dy > 5) {
        setHasDragged(true);
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        setNodes(prev => prev.map(n => n.id === draggedNode ? { ...n, x: newX, y: newY } : n));
      }
    }
    
    if (connectionDraft) {
      const rect = canvasRef.current?.getBoundingClientRect();
      setConnectionDraft({
        ...connectionDraft,
        targetX: e.clientX - (rect?.left || 0),
        targetY: e.clientY - (rect?.top || 0),
      });
    }
  }, [draggedNode, dragStartPos, dragOffset, setNodes, connectionDraft, quickEditNodeId, hasDragged]);

  const handleMouseUp = async (e: React.MouseEvent) => {
    if (draggedNode && hasDragged) {
      const node = nodes.find(n => n.id === draggedNode);
      if (node) {
        // parsed-前缀的节点是临时节点，不需要保存到数据库
        if (!draggedNode.startsWith('parsed-') && mindmapId) {
          try {
            await api.put(`/nodes/${draggedNode}`, { position: { x: node.x, y: node.y } });
            emitNodeUpdate(draggedNode, { x: node.x, y: node.y });
          } catch (error) {
            console.error('Failed to save position:', error);
          }
        }
      }
    }
    setDraggedNode(null);
    setHasDragged(false);
    
    if (connectionDraft) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const targetNode = nodes.find(n => 
          x >= n.x - 10 && x <= n.x + NODE_WIDTH + 10 && y >= n.y - 10 && y <= n.y + NODE_HEIGHT + 10 && n.id !== connectionDraft.sourceId
        );
        
        if (targetNode && mindmapId) {
          try {
            const response = await api.post('/relations', {
              mindmapId,
              sourceId: connectionDraft.sourceId,
              targetId: targetNode.id,
              type: 'contains',
            });
            setRelations([...relations, response.data]);
            emitRelationCreate(response.data);
            message.success('连接已创建（包含关系）');
          } catch (error) {
            message.error('创建连接失败');
          }
        }
      }
      setConnectionDraft(null);
    }
  };

  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    if (hasDragged) return;
    e.stopPropagation();
    // 单击选中节点
    selectNode(nodeId);
  };

  const handleStartConnection = (e: React.MouseEvent, nodeId: string) => {
    if (isViewer) {
      message.warning('查看者无法创建连接');
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    setConnectionDraft({
      sourceId: nodeId,
      sourceX: node.x + NODE_WIDTH,
      sourceY: node.y + NODE_HEIGHT / 2,
      targetX: e.clientX - (rect?.left || 0),
      targetY: e.clientY - (rect?.top || 0),
    });
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (quickEditNodeId) {
      handleQuickEditSave();
      return;
    }
    const target = e.target as HTMLElement;
    if (target === canvasRef.current || target.tagName === 'svg' || target.closest('svg') && !target.closest('.relation-badge')) {
      clearSelection();
    }
    setConnectionDraft(null);
  };

  const handleQuickNodeCreate = async (type: string) => {
    if (!mindmapId) {
      message.warning('请先选择脑图');
      return;
    }
    
    const rect = canvasRef.current?.getBoundingClientRect();
    const x = Math.max(50, (rect?.width || 400) / 2 - 80 + Math.random() * 100);
    const y = Math.max(50, (rect?.height || 300) / 2 - 30 + Math.random() * 100);
    
    try {
      const response = await api.post(`/nodes/mindmap/${mindmapId}`, {
        type,
        name: `新${NODE_TYPES.find(t => t.value === type)?.label || type}`,
        description: '',
        workspaceId: currentMindmap?.workspaceId || '',
        position: { x, y },
        metadata: {},
        versionId: 'v1',
        branchId: 'main',
      });
      const newNode = { ...response.data, x, y };
      setNodes(prev => [...prev, newNode]);
      emitNodeCreate(newNode);
      message.success('节点已创建');
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleQuickEditStart = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setQuickEditNodeId(nodeId);
      setQuickEditValue(node.name);
      selectNode(nodeId);
    }
  };

  const handleQuickEditSave = async () => {
    if (!quickEditNodeId) return;
    if (!quickEditValue.trim()) {
      setQuickEditNodeId(null);
      setQuickEditValue('');
      return;
    }
    try {
      await api.put(`/nodes/${quickEditNodeId}`, { name: quickEditValue.trim() });
      setNodes(prev => prev.map(n => n.id === quickEditNodeId ? { ...n, name: quickEditValue.trim() } : n));
      emitNodeUpdate(quickEditNodeId, { name: quickEditValue.trim() });
      message.success('节点名称已更新');
    } catch (error) {
      message.error('更新失败');
    } finally {
      setQuickEditNodeId(null);
      setQuickEditValue('');
    }
  };

  const handleAddNode = () => {
    if (!mindmapId) {
      message.warning('请先选择脑图');
      return;
    }
    
    form.resetFields();
    setEditingNode({
      id: '',
      type: 'test_case',
      name: '',
      description: '',
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
    });
    setDrawerOpen(true);
  };

  const handleEditNode = () => {
    if (selectedNodes.length !== 1) {
      message.warning('请选择一个节点');
      return;
    }
    
    const node = nodes.find(n => n.id === selectedNodes[0]);
    if (node) {
      setEditingNode(node);
      form.setFieldsValue({ type: node.type, name: node.name, description: node.description });
      setDrawerOpen(true);
    }
  };

  const handleDeleteNode = async () => {
    if (selectedNodes.length === 0) {
      message.warning('请选择要删除的节点');
      return;
    }

    try {
      for (const nodeId of selectedNodes) {
        await api.delete(`/nodes/${nodeId}`);
        emitNodeDelete(nodeId);
      }
      setNodes(prev => prev.filter(n => !selectedNodes.includes(n.id)));
      setRelations(prev => prev.filter(r => !selectedNodes.includes(r.sourceId) && !selectedNodes.includes(r.targetId)));
      message.success('节点已删除');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSaveNode = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingNode?.id) {
        await api.put(`/nodes/${editingNode.id}`, { name: values.name, description: values.description });
        setNodes(prev => prev.map(n => n.id === editingNode.id ? { ...n, name: values.name, description: values.description } : n));
        emitNodeUpdate(editingNode.id, { name: values.name, description: values.description });
        message.success('节点已更新');
      } else {
        const response = await api.post(`/nodes/mindmap/${mindmapId}`, {
          type: values.type,
          name: values.name,
          description: values.description,
          workspaceId: currentMindmap?.workspaceId || '',
          position: { x: editingNode?.x || 100, y: editingNode?.y || 100 },
          metadata: {},
          versionId: 'v1',
          branchId: 'main',
        });
        const newNode = { ...response.data, x: editingNode?.x || 100, y: editingNode?.y || 100 };
        setNodes(prev => [...prev, newNode]);
        emitNodeCreate(newNode);
        message.success('节点已创建');
      }
      
      setDrawerOpen(false);
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleRelationClick = (e: React.MouseEvent, rel: EditingRelationState) => {
    e.stopPropagation();
    setEditingRelationState(rel);
    relationForm.setFieldsValue({ type: rel.type });
    setRelationDrawerOpen(true);
  };

  const handleUpdateRelationType = async () => {
    try {
      const values = await relationForm.validateFields();
      if (editingRelation) {
        await api.put(`/relations/${editingRelation.id}`, { type: values.type });
        const updatedRelation = { ...editingRelation, type: values.type };
        setRelations(relations.map(r => r.id === editingRelation.id ? updatedRelation : r));
        message.success('关系类型已更新');
        setRelationDrawerOpen(false);
      }
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleDeleteRelation = async (relationId: string) => {
    try {
      await api.delete(`/relations/${relationId}`);
      setRelations(relations.filter(r => r.id !== relationId));
      emitRelationDelete(relationId);
      message.success('连接已删除');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const renderConnections = () => {
    const lines: JSX.Element[] = [];
    
    // 防御性检查：确保 nodes 和 relations 是数组
    if (!Array.isArray(nodes) || !Array.isArray(relations)) return lines;
    
    relations.forEach(rel => {
      const source = nodes.find(n => n.id === rel.sourceId);
      const target = nodes.find(n => n.id === rel.targetId);
      if (!source || !target) return;
      
      // 安全检查：确保位置有效
      const sourceX = Number.isFinite(source.x) ? source.x : 100;
      const sourceY = Number.isFinite(source.y) ? source.y : 100;
      const targetX = Number.isFinite(target.x) ? target.x : 100;
      const targetY = Number.isFinite(target.y) ? target.y : 100;
      
      const sx = sourceX + NODE_WIDTH;
      const sy = sourceY + NODE_HEIGHT / 2;
      const tx = targetX;
      const ty = targetY + NODE_HEIGHT / 2;
      
      const midX = (sx + tx) / 2;
      const midY = (sy + ty) / 2;
      
      lines.push(
        <g key={rel.id}>
          <line
            x1={sx}
            y1={sy}
            x2={tx}
            y2={ty}
            stroke="#1890ff"
            strokeWidth={2}
            strokeOpacity={0.8}
          />
          <g 
            className="relation-badge"
            style={{ cursor: 'pointer' }}
            onClick={(e) => handleRelationClick(e, rel as EditingRelationState)}
          >
            <rect 
              x={midX - 15} 
              y={midY - 12} 
              width={30} 
              height={24} 
              rx={4}
              fill="#1890ff"
              stroke="#fff"
              strokeWidth={1}
            />
            <text 
              x={midX} 
              y={midY + 4} 
              fontSize={11} 
              fill="#fff" 
              textAnchor="middle"
              fontWeight="bold"
            >
              {RELATION_TYPES.find(t => t.value === rel.type)?.label?.charAt(0) || '包'}
            </text>
          </g>
        </g>
      );
    });
    
    if (connectionDraft) {
      lines.push(
        <line 
          key="draft" 
          x1={connectionDraft.sourceX} 
          y1={connectionDraft.sourceY} 
          x2={connectionDraft.targetX} 
          y2={connectionDraft.targetY} 
          stroke="#52c41a" 
          strokeWidth={2} 
          strokeDasharray="8,4"
        />
      );
    }
    
    return lines;
  };

  const nodeTypeMenuItems = NODE_TYPES.map(t => ({
    key: t.value,
    label: <span><Tag color={t.color}>{t.label}</Tag></span>,
    onClick: () => handleQuickNodeCreate(t.value),
  }));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        padding: '12px 16px', 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', 
        borderBottom: '1px solid #d9d9d9', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <Space size="middle">
          {isViewer && <Tag color="orange" icon={<LockOutlined />}>查看模式</Tag>}
          <Dropdown menu={{ items: nodeTypeMenuItems }} placement="bottomLeft" disabled={isViewer}>
            <Button type="primary" icon={<PlusOutlined />} style={{ borderRadius: 6 }} disabled={isViewer}>快速添加</Button>
          </Dropdown>
          <Button icon={<PlusOutlined />} onClick={handleAddNode} style={{ borderRadius: 6 }} disabled={isViewer}>添加节点</Button>
          <Button icon={<EditOutlined />} onClick={handleEditNode} disabled={selectedNodes.length !== 1 || isViewer} style={{ borderRadius: 6 }}>编辑</Button>
          <Popconfirm title="确定删除选中的节点？" onConfirm={handleDeleteNode}>
            <Button icon={<DeleteOutlined />} danger disabled={selectedNodes.length === 0 || isViewer} style={{ borderRadius: 6 }}>删除</Button>
          </Popconfirm>
        </Space>
        <Space>
          <Tag color="blue" style={{ borderRadius: 6 }}>{currentMindmap?.name || '未选择'}</Tag>
          <span style={{ color: '#666', fontSize: 13 }}>节点: {nodes.length}</span>
          <span style={{ color: '#666', fontSize: 13 }}>连接: {relations.length}</span>
          {isSplitMode && <Tag color="orange" style={{ borderRadius: 6 }}>分屏</Tag>}
        </Space>
      </div>

      <div 
        ref={canvasRef} 
        style={{ 
          flex: 1, 
          overflow: 'auto', 
          background: 'linear-gradient(180deg, #fafbfc 0%, #f0f2f5 100%)', 
          position: 'relative', 
          cursor: connectionDraft ? 'crosshair' : 'default',
          minHeight: 400
        }}
        onClick={handleCanvasClick} 
        onMouseMove={handleMouseMove} 
        onMouseUp={handleMouseUp} 
        onMouseLeave={() => { setDraggedNode(null); setConnectionDraft(null); }}
      >
        {!initialized || loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>加载中...</div>
        ) : (
          <>
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: connectionDraft ? 'none' : 'auto' }}>
              {renderConnections()}
            </svg>
            {nodes.map(node => {
              const isSelected = selectedNodes.includes(node.id);
              const color = getNodeColor(node.type);
              const isQuickEditing = quickEditNodeId === node.id;
              
              // 安全检查：确保位置有效
              const nodeX = Number.isFinite(node.x) ? node.x : 100;
              const nodeY = Number.isFinite(node.y) ? node.y : 100;
              
              return (
                <div 
                  key={node.id} 
                  style={{
                    position: 'absolute', 
                    left: nodeX, 
                    top: nodeY, 
                    width: NODE_WIDTH, 
                    minHeight: NODE_HEIGHT,
                    background: isSelected ? '#e6f7ff' : '#fff',
                    border: `2px solid ${isSelected ? '#1890ff' : color}`,
                    borderRadius: 8, 
                    boxShadow: isSelected 
                      ? '0 4px 16px rgba(24,144,255,0.25), 0 0 0 3px rgba(24,144,255,0.1)' 
                      : '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'box-shadow 0.2s, border-color 0.2s',
                    zIndex: isSelected ? 10 : 1,
                    userSelect: 'none',
                  }} 
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  onClick={(e) => handleNodeClick(e, node.id)}
                  onDoubleClick={(e) => { e.stopPropagation(); handleQuickEditStart(node.id); }}
                >
<div style={{ padding: '6px 8px', cursor: hasDragged ? 'grab' : 'text' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                       <span 
                         style={{ 
                           background: color, 
                           color: '#fff',
                           fontWeight: 700, 
                           fontSize: 9,
                           minWidth: 18,
                           textAlign: 'center',
                           borderRadius: 3,
                           padding: '2px 4px'
                         }}
                       >
                         {getNodeAbbr(node.type)}
                       </span>
                       {isQuickEditing ? (
                         <Input
                           size="small"
                           value={quickEditValue}
                           onChange={(e) => setQuickEditValue(e.target.value)}
                           onPressEnter={() => handleQuickEditSave()}
                           onBlur={() => handleQuickEditSave()}
                           autoFocus
                           style={{ fontWeight: 600, fontSize: 12, borderRadius: 4, flex: 1 }}
                           onClick={(e) => e.stopPropagation()}
                         />
                       ) : (
                         <>
                           <span style={{ fontWeight: 600, fontSize: 12, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{node.name}</span>
                           {node.description && (
                             <span style={{ fontSize: 10, color: '#888', maxWidth: 40, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>…</span>
                           )}
                         </>
                       )}
                     </div>
                   </div>
                  {!isViewer && (
                    <div 
                      style={{ 
                        position: 'absolute', 
                        right: -8, 
                        top: '50%', 
                        marginTop: -8, 
                        width: 16, 
                        height: 16, 
                        background: '#1890ff', 
                        borderRadius: '50%', 
                        cursor: 'crosshair', 
                        border: '2px solid #fff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }}
                      onMouseDown={(e) => handleStartConnection(e, node.id)}
                      title="拖拽创建连接"
                    />
                  )}
                  <div 
                    style={{ 
                      position: 'absolute', 
                      left: -8, 
                      top: '50%', 
                      marginTop: -8, 
                      width: 16, 
                      height: 16, 
                      background: '#52c41a', 
                      borderRadius: '50%', 
                      border: '2px solid #fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }}
                    title="接收连接"
                  />
                </div>
              );
            })}
          </>
        )}
      </div>

      <Drawer 
        title={editingNode?.id ? '编辑节点' : '添加节点'} 
        placement="right" 
        width={400} 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)}
        styles={{ header: { background: '#fafafa' } }}
        footer={<Space style={{ float: 'right' }}><Button onClick={() => setDrawerOpen(false)}>取消</Button><Button type="primary" onClick={handleSaveNode}>保存</Button></Space>}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="type" label="节点类型" rules={[{ required: true }]}>
            <Select options={NODE_TYPES} disabled={!!editingNode?.id} />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="节点名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="节点描述" />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer 
        title="编辑连接关系" 
        placement="right" 
        width={400} 
        open={relationDrawerOpen} 
        onClose={() => setRelationDrawerOpen(false)}
        styles={{ header: { background: '#fafafa' } }}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setRelationDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleUpdateRelationType}>保存</Button>
            <Popconfirm title="删除此连接？" onConfirm={() => { editingRelation && handleDeleteRelation(editingRelation.id); setRelationDrawerOpen(false); }}>
              <Button danger>删除</Button>
            </Popconfirm>
          </Space>
        }
      >
        {editingRelation && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
            <Space direction="vertical" size="small">
              <Tag color={getNodeColor(nodes.find(n => n.id === editingRelation.sourceId)?.type || '')}>
                源: {nodes.find(n => n.id === editingRelation.sourceId)?.name}
              </Tag>
              <Tag color={getNodeColor(nodes.find(n => n.id === editingRelation.targetId)?.type || '')}>
                目标: {nodes.find(n => n.id === editingRelation.targetId)?.name}
              </Tag>
            </Space>
          </div>
        )}
        <Form form={relationForm} layout="vertical">
          <Form.Item name="type" label="连接类型" rules={[{ required: true }]}>
            <Select options={RELATION_TYPES} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}