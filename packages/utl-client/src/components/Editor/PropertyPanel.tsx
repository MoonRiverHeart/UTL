import { Drawer, Form, Input, Select, Space, Button, Tag, Divider, Typography, Collapse, Alert } from 'antd';
import { DeleteOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import api from '../../services/api';
import { message } from 'antd';

const { Text, Title } = Typography;

const NODE_TYPES = [
  { value: 'scenario', label: '场景', color: '#1890ff' },
  { value: 'function', label: '功能', color: '#52c41a' },
  { value: 'test_point', label: '测试点', color: '#faad14' },
  { value: 'action_factor', label: '动作因子', color: '#722ed1' },
  { value: 'data_factor', label: '数据因子', color: '#eb2f96' },
  { value: 'test_case', label: '测试用例', color: '#13c2c2' },
  { value: 'precondition', label: '预制条件', color: '#fa8c16' },
  { value: 'test_step', label: '测试步骤', color: '#2f54eb' },
  { value: 'expected_result', label: '预期结果', color: '#f5222d' },
];

const MERGE_STRATEGIES = [
  { value: 'override', label: '覆盖', desc: '子节点覆盖父节点同名属性' },
  { value: 'merge', label: '合并', desc: '合并父子节点所有属性' },
  { value: 'error', label: '报错', desc: '同名属性冲突时报错' },
];

interface NodePropertyPanelProps {
  open: boolean;
  onClose: () => void;
}

interface NodeData {
  id: string;
  type: string;
  name: string;
  description?: string;
  x: number;
  y: number;
  metadata?: {
    extendsNodes?: string[];
    mergeStrategy?: 'override' | 'merge' | 'error';
    defaultValue?: string;
    preconditions?: string[];
    testSteps?: string[];
    expectedResults?: string[];
    [key: string]: unknown;
  };
}

interface InheritanceInfo {
  parentNode: NodeData | null;
  inheritedFactors: { type: string; name: string; source: string }[];
  mergeStrategy: string;
}

export default function NodePropertyPanel({ open, onClose }: NodePropertyPanelProps) {
  const { nodes, selectedNodes, relations } = useEditorStore();
  const [form] = Form.useForm();
  const [inheritanceInfo, setInheritanceInfo] = useState<InheritanceInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [extendsNode, setExtendsNode] = useState<string>('');

  const selectedNode = selectedNodes.length === 1 
    ? nodes.find(n => n.id === selectedNodes[0]) 
    : null;

  useEffect(() => {
    if (selectedNode) {
      form.setFieldsValue({
        name: selectedNode.name,
        description: selectedNode.description || '',
        mergeStrategy: selectedNode.metadata?.mergeStrategy || 'override',
      });
      
      setExtendsNode(selectedNode.metadata?.extendsNodes?.[0] || '');
      
      loadInheritanceInfo(selectedNode);
    }
  }, [selectedNode, form]);

  const loadInheritanceInfo = async (node: NodeData) => {
    if (node.type !== 'function' || !node.metadata?.extendsNodes?.length) {
      setInheritanceInfo(null);
      return;
    }

    setLoading(true);
    try {
      const parentRef = node.metadata.extendsNodes[0];
      const parentNode = nodes.find(n => n.name === parentRef || n.id === parentRef);
      
      if (parentNode) {
        const inheritedFactors: { type: string; name: string; source: string }[] = [];
        
        const extRelations = relations.filter(r => 
          r.targetId === parentNode.id && r.type === 'extends'
        );
        
        for (const rel of relations.filter(r => r.targetId === parentNode.id && r.type === 'contains')) {
          const childNode = nodes.find(n => n.id === rel.sourceId);
          if (childNode) {
            inheritedFactors.push({
              type: childNode.type,
              name: childNode.name,
              source: parentNode.name,
            });
          }
        }
        
        setInheritanceInfo({
          parentNode,
          inheritedFactors,
          mergeStrategy: node.metadata?.mergeStrategy || 'override',
        });
      } else {
        setInheritanceInfo(null);
      }
    } catch {
      setInheritanceInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedNode) return;
    
    try {
      const values = await form.validateFields();
      
      const metadata = {
        ...selectedNode.metadata,
        mergeStrategy: values.mergeStrategy,
        extendsNodes: extendsNode ? [extendsNode] : [],
      };
      
      await api.put(`/nodes/${selectedNode.id}`, {
        name: values.name,
        description: values.description,
        metadata,
      });
      
      message.success('节点属性已更新');
      onClose();
    } catch {
      message.error('保存失败');
    }
  };

  const handleAddInheritance = async () => {
    if (!selectedNode || !extendsNode) return;
    
    try {
      const parentNode = nodes.find(n => n.name === extendsNode || n.id === extendsNode);
      if (!parentNode) {
        message.error('找不到父节点');
        return;
      }
      
      await api.post('/relations', {
        sourceId: selectedNode.id,
        targetId: parentNode.id,
        type: 'extends',
        mindmapId: selectedNode.mindmapId,
      });
      
      const metadata = {
        ...selectedNode.metadata,
        extendsNodes: [parentNode.name],
        mergeStrategy: form.getFieldValue('mergeStrategy') || 'override',
      };
      
      await api.put(`/nodes/${selectedNode.id}`, { metadata });
      
      message.success('继承关系已添加');
      loadInheritanceInfo(selectedNode);
    } catch {
      message.error('添加继承失败');
    }
  };

  const handleRemoveInheritance = async () => {
    if (!selectedNode || !inheritanceInfo?.parentNode) return;
    
    try {
      const rel = relations.find(r => 
        r.sourceId === selectedNode.id && 
        r.targetId === inheritanceInfo.parentNode.id && 
        r.type === 'extends'
      );
      
      if (rel) {
        await api.delete(`/relations/${rel.id}`);
      }
      
      const metadata = {
        ...selectedNode.metadata,
        extendsNodes: [],
      };
      
      await api.put(`/nodes/${selectedNode.id}`, { metadata });
      
      setExtendsNode('');
      setInheritanceInfo(null);
      message.success('继承关系已移除');
    } catch {
      message.error('移除失败');
    }
  };

  if (!selectedNode) {
    return (
      <Drawer
        title="节点属性"
        placement="right"
        width={400}
        open={open}
        onClose={onClose}
      >
        <Alert type="info" message="请选择一个节点查看属性" />
      </Drawer>
    );
  }

  const nodeTypeLabel = NODE_TYPES.find(t => t.value === selectedNode.type)?.label || selectedNode.type;
  const nodeTypeColor = NODE_TYPES.find(t => t.value === selectedNode.type)?.color || '#666';

  const canHaveInheritance = selectedNode.type === 'function';
  const candidateParents = nodes.filter(n => 
    n.type === 'scenario' || n.type === 'function' && n.id !== selectedNode.id
  );

  return (
    <Drawer
      title={
        <Space>
          <Tag color={nodeTypeColor}>{nodeTypeLabel}</Tag>
          <Text strong>{selectedNode.name}</Text>
        </Space>
      }
      placement="right"
      width={420}
      open={open}
      onClose={onClose}
      styles={{ body: { padding: 16 } }}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSave}>保存</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="名称" rules={[{ required: true }]}>
          <Input placeholder="节点名称" />
        </Form.Item>
        
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={3} placeholder="节点描述" />
        </Form.Item>
        
        <Divider>基本信息</Divider>
        
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text type="secondary">节点ID: <Text copyable>{selectedNode.id}</Text></Text>
          <Text type="secondary">类型: {nodeTypeLabel}</Text>
          <Text type="secondary">位置: ({Math.round(selectedNode.x)}, {Math.round(selectedNode.y)})</Text>
        </Space>
        
        {canHaveInheritance && (
          <>
            <Divider>继承关系</Divider>
            
            <Form.Item name="mergeStrategy" label="合并策略">
              <Select options={MERGE_STRATEGIES.map(s => ({ 
                value: s.value, 
                label: `${s.label} - ${s.desc}` 
              }))} />
            </Form.Item>
            
            <Form.Item label="继承自">
              <Space.Compact style={{ width: '100%' }}>
                <Select
                  style={{ width: 'calc(100% - 80px)' }}
                  value={extendsNode}
                  onChange={setExtendsNode}
                  placeholder="选择父节点"
                  options={candidateParents.map(n => ({ 
                    value: n.name, 
                    label: <><Tag color={NODE_TYPES.find(t => t.value === n.type)?.color}>{NODE_TYPES.find(t => t.value === n.type)?.label}</Tag> {n.name}</>
                  }))}
                />
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={handleAddInheritance}
                  disabled={!extendsNode}
                >
                  添加
                </Button>
              </Space.Compact>
            </Form.Item>
            
            {inheritanceInfo && (
              <Collapse
                items={[
                  {
                    key: 'inheritance',
                    label: <Space><LinkOutlined /> 继承自: <Tag color="blue">{inheritanceInfo.parentNode?.name}</Tag></Space>,
                    children: (
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Alert 
                          type="info" 
                          message={`合并策略: ${MERGE_STRATEGIES.find(s => s.value === inheritanceInfo.mergeStrategy)?.label}`} 
                          style={{ marginBottom: 8 }}
                        />
                        
                        <Text strong>继承的因子:</Text>
                        {inheritanceInfo.inheritedFactors.length > 0 ? (
                          <Space direction="vertical" size="small">
                            {inheritanceInfo.inheritedFactors.map(f => (
                              <Tag key={`${f.type}-${f.name}`} color={NODE_TYPES.find(t => t.value === f.type)?.color}>
                                {NODE_TYPES.find(t => t.value === f.type)?.label}: {f.name}
                              </Tag>
                            ))}
                          </Space>
                        ) : (
                          <Text type="secondary">无继承因子</Text>
                        )}
                        
                        <Button 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={handleRemoveInheritance}
                          block
                          style={{ marginTop: 12 }}
                        >
                          移除继承关系
                        </Button>
                      </Space>
                    ),
                  },
                ]}
              />
            )}
          </>
        )}
        
        {selectedNode.type === 'test_case' && (
          <>
            <Divider>测试用例详情</Divider>
            
            {selectedNode.metadata?.preconditions?.length && (
              <Form.Item label="预制条件">
                <Space direction="vertical">
                  {selectedNode.metadata.preconditions.map((p, i) => (
                    <Tag key={i} color="orange">{p}</Tag>
                  ))}
                </Space>
              </Form.Item>
            )}
            
            {selectedNode.metadata?.testSteps?.length && (
              <Form.Item label="测试步骤">
                <Space direction="vertical">
                  {selectedNode.metadata.testSteps.map((s, i) => (
                    <Tag key={i} color="geekblue">{i + 1}. {s}</Tag>
                  ))}
                </Space>
              </Form.Item>
            )}
            
            {selectedNode.metadata?.expectedResults?.length && (
              <Form.Item label="预期结果">
                <Space direction="vertical">
                  {selectedNode.metadata.expectedResults.map((r, i) => (
                    <Tag key={i} color="red">{r}</Tag>
                  ))}
                </Space>
              </Form.Item>
            )}
          </>
        )}
      </Form>
    </Drawer>
  );
}