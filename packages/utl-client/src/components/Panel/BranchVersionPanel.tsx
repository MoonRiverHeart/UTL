import { Drawer, List, Button, Space, Tag, Typography, Input, Modal, Collapse, Timeline, Spin, Empty, Badge, Divider } from 'antd';
import { PlusOutlined, ApartmentOutlined, SwapOutlined, MergeOutlined, HistoryOutlined, DiffOutlined, RollbackOutlined, SaveOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { message } from 'antd';
import { useEditorStore } from '../../stores/editorStore';
import { useSocketStore } from '../../stores/socketStore';

const { Text, Title } = Typography;

interface Branch {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  authorId: string;
}

interface Version {
  id: string;
  versionNumber: string;
  message: string;
  createdAt: string;
  author?: { id: string; username: string };
}

interface BranchVersionPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function BranchVersionPanel({ open, onClose }: BranchVersionPanelProps) {
  const params = useParams();
  const mindmapId = params.mindmapId;
  const { nodes, relations, setNodes, setRelations } = useEditorStore();
  const { socket, emitBranchCheckout } = useSocketStore();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchDesc, setNewBranchDesc] = useState('');
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [diffData, setDiffData] = useState<any>(null);
  const [version1Id, setVersion1Id] = useState('');
  const [version2Id, setVersion2Id] = useState('');
  const [saveVersionModalOpen, setSaveVersionModalOpen] = useState(false);
  const [versionMessage, setVersionMessage] = useState('');

  useEffect(() => {
    if (open && mindmapId) {
      loadBranches();
    }
  }, [open, mindmapId]);

  useEffect(() => {
    if (!socket) return;
    
    const handleBranchChange = (by: string, branchId: string, snapshot: { nodes: any[]; relations: any[] }) => {
      if (by !== useSocketStore.getState().mindmapId) {
        message.info(`其他用户切换了分支，已同步数据`);
        const restoredNodes = snapshot.nodes.map(n => ({
          id: n.id,
          type: n.type,
          name: n.name,
          description: n.description || '',
          x: n.position?.x ?? n.x ?? 100 + Math.random() * 200,
          y: n.position?.y ?? n.y ?? 100 + Math.random() * 200,
          metadata: n.metadata || {},
        }));
        setNodes(restoredNodes);
        setRelations(snapshot.relations || []);
      }
    };

    (socket as any).on('branch_changed', handleBranchChange);
    
    return () => {
      (socket as any).off('branch_changed');
    };
  }, [socket, setNodes, setRelations]);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/branches/mindmap/${mindmapId}`);
      setBranches(res.data);
      if (res.data.length > 0) {
        setCurrentBranch(res.data[0]);
        loadVersions(res.data[0].id);
      }
    } catch {
      message.error('加载分支失败');
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async (branchId: string) => {
    try {
      const res = await api.get(`/versions/branch/${branchId}`);
      setVersions(res.data);
    } catch {
      message.error('加载版本失败');
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) {
      message.warning('请输入分支名称');
      return;
    }

    try {
      const res = await api.post(`/branches/mindmap/${mindmapId}`, {
        name: newBranchName.trim(),
        description: newBranchDesc,
      });
      message.success('分支已创建');
      setCreateModalOpen(false);
      setNewBranchName('');
      setNewBranchDesc('');
      loadBranches();
    } catch {
      message.error('创建失败');
    }
  };

  const handleCheckoutBranch = async (branchId: string) => {
    if (!mindmapId) {
      message.warning('请先选择脑图');
      return;
    }
    
    try {
      const res = await api.post(`/branches/${branchId}/checkout`, { mindmapId });
      message.success('已切换分支');
      
      const snapshot = res.data.snapshot as { nodes: any[]; relations: any[] } | null;
      const branch = res.data.branch;
      
      if (snapshot && snapshot.nodes.length > 0) {
        const restoredNodes = snapshot.nodes.map(n => ({
          id: n.id,
          type: n.type,
          name: n.name,
          description: n.description || '',
          x: n.position?.x ?? n.x ?? 100 + Math.random() * 200,
          y: n.position?.y ?? n.y ?? 100 + Math.random() * 200,
          metadata: n.metadata || {},
        }));
        setNodes(restoredNodes);
        setRelations(snapshot.relations || []);
        message.info(`已加载 ${restoredNodes.length} 个节点`);
        
        emitBranchCheckout(branchId, { nodes: restoredNodes, relations: snapshot.relations || [] });
      } else {
        message.info('该分支暂无数据，请添加节点后保存版本');
        setNodes([]);
        setRelations([]);
        
        emitBranchCheckout(branchId, { nodes: [], relations: [] });
      }
      
      setCurrentBranch(branch);
      loadVersions(branchId);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      message.error(error.response?.data?.error || '切换失败');
    }
  };

  const handleMergeBranch = async (branchId: string) => {
    if (!currentBranch) return;

    Modal.confirm({
      title: '确认合并',
      content: `将此分支合并到 ${currentBranch.name}？`,
      onOk: async () => {
        try {
          await api.post(`/branches/${branchId}/merge`, {
            targetBranchId: currentBranch.id,
            userId: 'system',
          });
          message.success('合并成功');
          loadBranches();
        } catch {
          message.error('合并失败');
        }
      },
    });
  };

  const handleRestoreVersion = async (versionId: string) => {
    Modal.confirm({
      title: '恢复版本',
      content: '恢复到此版本会覆盖当前状态，确认继续？',
      onOk: async () => {
        try {
          const res = await api.post(`/versions/${versionId}/restore`);
          message.success('已恢复版本');
          if (res.data.snapshot) {
            const { nodes: snapshotNodes, relations: snapshotRelations } = res.data.snapshot as { nodes: any[]; relations: any[] };
            const { setNodes, setRelations } = useEditorStore.getState();
            const restoredNodes = snapshotNodes.map(n => ({
              ...n,
              x: n.position?.x ?? n.x ?? 100,
              y: n.position?.y ?? n.y ?? 100,
            }));
            setNodes(restoredNodes);
            setRelations(snapshotRelations);
            message.info('节点数据已更新，请刷新页面查看完整变化');
          }
        } catch {
          message.error('恢复失败');
        }
      },
    });
  };

  const handleCompareVersions = async () => {
    if (!version1Id || !version2Id) {
      message.warning('请选择两个版本');
      return;
    }

    try {
      const res = await api.get(`/versions/${version1Id}/diff/${version2Id}`);
      setDiffData(res.data);
      setDiffModalOpen(true);
    } catch {
      message.error('对比失败');
    }
  };

  const handleSaveVersion = async () => {
    if (!currentBranch) {
      message.warning('请先选择分支');
      return;
    }

    try {
      const snapshot = {
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.type,
          name: n.name,
          description: n.description,
          position: { x: n.x, y: n.y },
          metadata: n.metadata,
        })),
        relations: relations.map(r => ({
          id: r.id,
          sourceId: r.sourceId,
          targetId: r.targetId,
          type: r.type,
        })),
      };

      await api.post(`/versions/branch/${currentBranch.id}`, {
        message: versionMessage || '保存变更',
        snapshot,
      });
      message.success('版本已保存');
      setSaveVersionModalOpen(false);
      setVersionMessage('');
      loadVersions(currentBranch.id);
    } catch {
      message.error('保存失败');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'merged': return 'blue';
      case 'archived': return 'gray';
      default: return 'default';
    }
  };

  return (
    <Drawer
      title={<Space><ApartmentOutlined /> 分支与版本</Space>}
      placement="right"
      width={450}
      open={open}
      onClose={onClose}
      styles={{ body: { padding: 16 } }}
    >
      {loading ? (
        <Spin />
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
                创建分支
              </Button>
              <Button icon={<SaveOutlined />} onClick={() => setSaveVersionModalOpen(true)} disabled={!currentBranch}>
                保存版本快照
              </Button>
            </Space>
          </div>

          {currentBranch && (
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
              <Space>
                <Text strong>当前分支:</Text>
                <Tag color="blue">{currentBranch.name}</Tag>
                <Text type="secondary">节点: {nodes.length} | 连接: {relations.length}</Text>
              </Space>
            </div>
          )}

          <Divider style={{ margin: '12px 0' }} />

          <Collapse
            items={[
              {
                key: 'branches',
                label: <Space><ApartmentOutlined /> 分支列表 ({branches.length})</Space>,
                children: (
                  <List
                    dataSource={branches}
                    renderItem={(branch) => (
                      <List.Item
                        actions={[
                          <Button size="small" icon={<SwapOutlined />} onClick={() => handleCheckoutBranch(branch.id)} disabled={branch.id === currentBranch?.id}>切换</Button>,
                          <Button size="small" icon={<MergeOutlined />} onClick={() => handleMergeBranch(branch.id)} disabled={branch.status !== 'active'}>合并</Button>,
                        ]}
                      >
                        <Space>
                          <Text strong={branch.id === currentBranch?.id}>{branch.name}</Text>
                          <Badge status={branch.status === 'active' ? 'success' : 'default'} />
                          {branch.id === currentBranch?.id && <Tag color="green">当前</Tag>}
                        </Space>
                      </List.Item>
                    )}
                  />
                ),
              },
              {
                key: 'versions',
                label: <Space><HistoryOutlined /> 版本历史 ({versions.length})</Space>,
                children: (
                  <>
                    <Space style={{ marginBottom: 16 }}>
                      <Select placeholder="版本1" style={{ width: 120 }} onChange={setVersion1Id} options={versions.map(v => ({ value: v.id, label: v.versionNumber }))} />
                      <Select placeholder="版本2" style={{ width: 120 }} onChange={setVersion2Id} options={versions.map(v => ({ value: v.id, label: v.versionNumber }))} />
                      <Button size="small" icon={<DiffOutlined />} onClick={handleCompareVersions}>对比</Button>
                    </Space>

                    <Timeline
                      items={versions.map((v) => ({
                        color: 'blue',
                        children: (
                          <div>
                            <Text strong>{v.versionNumber}</Text>
                            <Text type="secondary" style={{ marginLeft: 8 }}>{v.message}</Text>
                            <br />
                            <Text type="secondary">{new Date(v.createdAt).toLocaleString()}</Text>
                            <Button size="small" icon={<RollbackOutlined />} onClick={() => handleRestoreVersion(v.id)} style={{ marginLeft: 8 }}>恢复</Button>
                          </div>
                        ),
                      }))}
                    />
                  </>
                ),
              },
            ]}
            defaultActiveKey={['branches', 'versions']}
          />

          <Modal
            title="保存版本快照"
            open={saveVersionModalOpen}
            onOk={handleSaveVersion}
            onCancel={() => setSaveVersionModalOpen(false)}
            okText="保存"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">将当前脑图状态保存为新版本</Text>
              <Text>节点数: {nodes.length} | 连接数: {relations.length}</Text>
              <Input.TextArea 
                placeholder="版本说明（可选）" 
                value={versionMessage} 
                onChange={(e) => setVersionMessage(e.target.value)} 
                rows={3} 
              />
            </Space>
          </Modal>

          <Modal
            title="创建新分支"
            open={createModalOpen}
            onOk={handleCreateBranch}
            onCancel={() => setCreateModalOpen(false)}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input placeholder="分支名称" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} />
              <Input.TextArea placeholder="分支描述" value={newBranchDesc} onChange={(e) => setNewBranchDesc(e.target.value)} rows={3} />
            </Space>
          </Modal>

          <Modal
            title="版本对比"
            open={diffModalOpen}
            onCancel={() => setDiffModalOpen(false)}
            footer={null}
            width={600}
          >
            {diffData && (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text>从 {diffData.from.versionNumber} 到 {diffData.to.versionNumber}</Text>

                {diffData.diff?.addedNodes?.length > 0 && (
                  <div>
                    <Text strong>新增节点 ({diffData.diff.addedNodes.length})</Text>
                    <List size="small" dataSource={diffData.diff.addedNodes} renderItem={(n: any) => <List.Item><Tag color="green">{n.name}</Tag></List.Item>} />
                  </div>
                )}

                {diffData.diff?.deletedNodes?.length > 0 && (
                  <div>
                    <Text strong>删除节点 ({diffData.diff.deletedNodes.length})</Text>
                    <List size="small" dataSource={diffData.diff.deletedNodes} renderItem={(n: any) => <List.Item><Tag color="red">{n.name}</Tag></List.Item>} />
                  </div>
                )}

                {diffData.diff?.modifiedNodes?.length > 0 && (
                  <div>
                    <Text strong>修改节点 ({diffData.diff.modifiedNodes.length})</Text>
                    <List size="small" dataSource={diffData.diff.modifiedNodes} renderItem={(n: any) => <List.Item><Tag color="orange">{n.name}</Tag></List.Item>} />
                  </div>
                )}

                {diffData.diff?.addedRelations?.length > 0 && (
                  <Text type="secondary">新增连接: {diffData.diff.addedRelations.length}</Text>
                )}

                {diffData.diff?.deletedRelations?.length > 0 && (
                  <Text type="secondary">删除连接: {diffData.diff.deletedRelations.length}</Text>
                )}
              </Space>
            )}
          </Modal>
        </>
      )}
    </Drawer>
  );
}

import { Select } from 'antd';