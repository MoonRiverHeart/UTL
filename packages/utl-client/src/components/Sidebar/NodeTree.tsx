import { useEffect, useState } from 'react';
import { Tree, Tag, Empty, Spin, Typography, Button, Popconfirm, Space } from 'antd';
import { FileOutlined, FolderOutlined, AppstoreOutlined, DeleteOutlined } from '@ant-design/icons';
import { useEditorStore } from '../../stores/editorStore';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { message } from 'antd';

const { Text } = Typography;

const TYPE_COLORS: Record<string, string> = {
  scenario: 'blue',
  function: 'green',
  test_point: 'gold',
  action_factor: 'purple',
  data_factor: 'pink',
  test_case: 'cyan',
  precondition: 'orange',
  test_step: 'geekblue',
  expected_result: 'red',
};

const TYPE_LABELS: Record<string, string> = {
  scenario: '场景',
  function: '功能',
  test_point: '测试点',
  action_factor: '动作因子',
  data_factor: '数据因子',
  test_case: '测试用例',
  precondition: '预制条件',
  test_step: '测试步骤',
  expected_result: '预期结果',
};

interface TreeNodeData {
  key: string;
  title: JSX.Element;
  icon: JSX.Element;
  children?: TreeNodeData[];
}

export default function NodeTree() {
  const params = useParams();
  const { selectNode, selectedNodes, nodes: editorNodes, relations: editorRelations, setNodes, setRelations } = useEditorStore();
  const [nodes, setLocalNodes] = useState<{ id: string; type: string; name: string; description?: string; x: number; y: number }[]>([]);
  const [relations, setLocalRelations] = useState<{ id: string; sourceId: string; targetId: string; type: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const mindmapId = params.mindmapId;

  useEffect(() => {
    if (mindmapId) {
      setLoading(true);
      Promise.all([
        api.get(`/nodes/mindmap/${mindmapId}`),
        api.get(`/relations/mindmap/${mindmapId}`)
      ])
        .then(([nodesRes, relationsRes]) => {
          setLocalNodes(nodesRes.data);
          setLocalRelations(relationsRes.data);
          setNodes(nodesRes.data);
          setRelations(relationsRes.data);
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
    
    const buildTreeNode = (node: { id: string; type: string; name: string }): TreeNodeData => {
      const childrenIds = childrenMap.get(node.id) || [];
      const children = childrenIds
        .map(cid => nodes.find(n => n.id === cid))
        .filter(Boolean)
        .map(n => buildTreeNode(n!));
      
      return {
        key: node.id,
        title: (
          <Space size={4} style={{ display: 'flex', alignItems: 'center' }}>
            <Tag 
              color={TYPE_COLORS[node.type] || 'default'} 
              style={{ 
                margin: 0, 
                fontSize: 10, 
                borderRadius: 4,
                minWidth: 48,
                textAlign: 'center'
              }}
            >
              {TYPE_LABELS[node.type] || node.type}
            </Tag>
            <Text style={{ fontSize: 12, color: selectedNodes.includes(node.id) ? '#1890ff' : '#333' }}>
              {node.name}
            </Text>
            <Popconfirm 
              title="确定删除此节点？" 
              onConfirm={() => handleDeleteNode(node.id)}
              placement="right"
            >
              <Button 
                type="text" 
                size="small" 
                icon={<DeleteOutlined style={{ fontSize: 12, color: '#ff4d4f' }} />}
                style={{ marginLeft: 4, padding: '0 4px', height: 20 }}
              />
            </Popconfirm>
          </Space>
        ),
        icon: children.length > 0 ? <FolderOutlined style={{ color: '#1890ff' }} /> : <FileOutlined style={{ color: '#666' }} />,
        children: children.length > 0 ? children : undefined,
      };
    };
    
    return rootNodes.map(n => buildTreeNode(n));
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
          image={<FolderOutlined style={{ fontSize: 40, color: '#bfbfbf' }} />}
          description={<Text type="secondary">暂无节点，请添加</Text>}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ 
        padding: '8px 16px', 
        fontWeight: 600, 
        color: '#722ed1', 
        fontSize: 13,
        borderBottom: '1px solid #f0f0f0',
        marginBottom: 4
      }}>
        <AppstoreOutlined style={{ marginRight: 8 }} />
        节点树 ({nodes.length})
      </div>
      <Tree
        showIcon
        showLine={{ showLeafIcon: false }}
        defaultExpandAll
        selectedKeys={selectedNodes}
        treeData={buildTree()}
        onSelect={handleSelect}
        style={{ fontSize: 12, padding: '8px 12px' }}
      />
    </div>
  );
}