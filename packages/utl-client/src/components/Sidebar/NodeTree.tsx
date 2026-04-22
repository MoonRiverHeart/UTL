import { useEffect, useState } from 'react';
import { Tree, Empty, Spin, Typography, Popconfirm } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { useEditorStore } from '../../stores/editorStore';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { message } from 'antd';

const { Text } = Typography;

const TYPE_COLORS: Record<string, string> = {
  scenario: '#1890ff',
  function: '#52c41a',
  test_point: '#faad14',
  attr: '#9c27b0',
  method: '#00bcd4',
  action_factor: '#722ed1',
  data_factor: '#eb2f96',
  test_case: '#13c2c2',
  precondition: '#fa8c16',
  test_step: '#2f54eb',
  expected_result: '#f5222d',
};

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

interface TreeNodeData {
  key: string;
  title: JSX.Element;
  children?: TreeNodeData[];
}

export default function NodeTree() {
  const params = useParams();
  const { selectNode, selectedNodes, nodes: editorNodes, relations: editorRelations, setNodes, setRelations } = useEditorStore();
  const [nodes, setLocalNodes] = useState<{ id: string; type: string; name: string; description?: string; x: number; y: number }[]>([]);
  const [relations, setLocalRelations] = useState<{ id: string; sourceId: string; targetId: string; type: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  const mindmapId = params.mindmapId;

  useEffect(() => {
    if (mindmapId) {
      setLoading(true);
      Promise.all([
        api.get(`/nodes/mindmap/${mindmapId}`),
        api.get(`/relations/mindmap/${mindmapId}`)
      ])
        .then(([nodesRes, relationsRes]) => {
          const nodesData = Array.isArray(nodesRes.data) ? nodesRes.data : [];
          const relationsData = Array.isArray(relationsRes.data) ? relationsRes.data : [];
          setLocalNodes(nodesData);
          setLocalRelations(relationsData);
          setNodes(nodesData);
          setRelations(relationsData);
          setExpandedKeys(nodesData.map((n: any) => n.id));
        })
        .catch(() => {
          setLocalNodes([]);
          setLocalRelations([]);
        })
        .finally(() => setLoading(false));
    } else {
      setLocalNodes([]);
      setLocalRelations([]);
    }
  }, [mindmapId, setNodes, setRelations]);

  useEffect(() => {
    if (editorNodes.length > 0 && !editorNodes[0].id.startsWith('parsed-')) {
      setLocalNodes(editorNodes);
      setLocalRelations(editorRelations);
    }
  }, [editorNodes, editorRelations]);

  const handleDeleteNode = async (nodeId: string) => {
    try {
      await api.delete(`/nodes/${nodeId}`);
      const newNodes = nodes.filter(n => n.id !== nodeId);
      const newRelations = relations.filter(r => r.sourceId !== nodeId && r.targetId !== nodeId);
      setLocalNodes(newNodes);
      setLocalRelations(newRelations);
      setNodes(newNodes);
      setRelations(newRelations);
      message.success('节点已删除');
    } catch {
      message.error('删除失败');
    }
  };

  const buildTree = () => {
    const containsRelations = relations.filter(r => r.type === 'contains');
    const childrenMap = new Map<string, string[]>();
    const hasParent = new Set<string>();
    
    for (const rel of containsRelations) {
      const children = childrenMap.get(rel.targetId) || [];
      children.push(rel.sourceId);
      childrenMap.set(rel.targetId, children);
      hasParent.add(rel.sourceId);
    }
    
    const rootNodes = nodes.filter(n => !hasParent.has(n.id));
    
    const leafTypes = ['action_factor', 'data_factor', 'precondition', 'test_step', 'expected_result', 'attr', 'method'];
    
    const buildTreeNode = (node: { id: string; type: string; name: string }, parentType?: string): TreeNodeData | null => {
      if (leafTypes.includes(node.type) && parentType !== 'test_case' && parentType !== 'attr' && parentType !== 'method') {
        return null;
      }
      
      const childrenIds = childrenMap.get(node.id) || [];
      const children = childrenIds
        .map(cid => nodes.find(n => n.id === cid))
        .filter(Boolean)
        .map(n => buildTreeNode(n!, node.type))
        .filter(Boolean) as TreeNodeData[];
      
      return {
        key: node.id,
        title: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
            <span 
              style={{ 
                background: TYPE_COLORS[node.type] || '#666',
                color: '#fff',
                fontWeight: 600,
                fontSize: 9,
                minWidth: 18,
                textAlign: 'center',
                borderRadius: 3,
                padding: '1px 3px'
              }}
            >
              {TYPE_ABBR[node.type] || node.type.slice(0, 2).toUpperCase()}
            </span>
            <span style={{ 
              color: selectedNodes.includes(node.id) ? '#1890ff' : '#333',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 120
            }}>
              {node.name}
            </span>
            <Popconfirm 
              title="确定删除此节点？" 
              onConfirm={() => handleDeleteNode(node.id)}
              placement="right"
            >
              <span 
                style={{ 
                  marginLeft: 'auto',
                  color: '#ff4d4f',
                  cursor: 'pointer',
                  fontSize: 10,
                  opacity: 0.6
                }}
                onClick={(e) => e.stopPropagation()}
              >
                ✕
              </span>
            </Popconfirm>
          </div>
        ),
        children: children.length > 0 ? children : undefined,
      };
    };
    
    return rootNodes.map(n => buildTreeNode(n)).filter(Boolean) as TreeNodeData[];
  };

  const handleSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      selectNode(selectedKeys[0] as string);
    }
  };

  if (!mindmapId) {
    return (
      <div style={{ padding: '24px 16px' }}>
        <Empty 
          image={<AppstoreOutlined style={{ fontSize: 40, color: '#bfbfbf' }} />}
          description={<Text type="secondary">请先选择脑图</Text>}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="small" />
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div style={{ padding: '24px 16px' }}>
        <Empty 
          image={<AppstoreOutlined style={{ fontSize: 40, color: '#bfbfbf' }} />}
          description={<Text type="secondary">暂无节点，请添加</Text>}
        />
      </div>
    );
  }

  return (
    <div>
      <div style={{ 
        padding: '8px 12px', 
        fontWeight: 600, 
        color: '#722ed1', 
        fontSize: 12,
        borderBottom: '1px solid #f0f0f0',
        background: '#fafafa'
      }}>
        <AppstoreOutlined style={{ marginRight: 6, fontSize: 12 }} />
        节点树 ({nodes.length})
      </div>
      <Tree
        showLine={{ showLeafIcon: false }}
        expandedKeys={expandedKeys}
        onExpand={setExpandedKeys}
        selectedKeys={selectedNodes}
        treeData={buildTree()}
        onSelect={handleSelect}
        style={{ 
          fontSize: 11, 
          padding: '4px 8px',
          background: '#fff'
        }}
      />
    </div>
  );
}