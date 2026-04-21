import { Drawer, List, Avatar, Tag, Space, Button, Input, Select, message, Modal, Divider, Typography } from 'antd';
import { UserOutlined, PlusOutlined, DeleteOutlined, CrownOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import api from '../../services/api';

const { Text } = Typography;

interface Collaborator {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    username: string;
    email?: string;
  };
}

interface WorkspaceSettingsProps {
  open: boolean;
  onClose: () => void;
}

const ROLE_OPTIONS = [
  { value: 'editor', label: '编辑者', desc: '可以编辑节点和脑图' },
  { value: 'viewer', label: '查看者', desc: '只能查看，不能编辑' },
];

export default function WorkspaceSettings({ open, onClose }: WorkspaceSettingsProps) {
  const { currentWorkspace, loadWorkspaces } = useWorkspaceStore();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [addUsername, setAddUsername] = useState('');
  const [addRole, setAddRole] = useState('editor');

  useEffect(() => {
    if (open && currentWorkspace) {
      loadCollaborators();
    }
  }, [open, currentWorkspace]);

  const loadCollaborators = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const res = await api.get(`/workspaces/${currentWorkspace.id}/collaborators`);
      setCollaborators(res.data);
    } catch {
      message.error('加载成员列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollaborator = async () => {
    if (!currentWorkspace || !addUsername.trim()) return;
    
    try {
      await api.post(`/workspaces/${currentWorkspace.id}/collaborators`, {
        username: addUsername.trim(),
        role: addRole,
      });
      message.success('成员已添加');
      setAddUsername('');
      loadCollaborators();
      loadWorkspaces();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      message.error(error.response?.data?.error || '添加失败');
    }
  };

  const handleUpdateRole = async (collaboratorId: string, newRole: string) => {
    if (!currentWorkspace) return;
    
    try {
      await api.put(`/workspaces/${currentWorkspace.id}/collaborators/${collaboratorId}`, {
        role: newRole,
      });
      message.success('角色已更新');
      loadCollaborators();
    } catch {
      message.error('更新失败');
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!currentWorkspace) return;
    
    Modal.confirm({
      title: '确认移除成员',
      content: '确定要移除该成员吗？移除后该成员将无法访问此工作区。',
      okText: '移除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/workspaces/${currentWorkspace.id}/collaborators/${collaboratorId}`);
          message.success('成员已移除');
          loadCollaborators();
          loadWorkspaces();
        } catch {
          message.error('移除失败');
        }
      },
    });
  };

  const getRoleTag = (role: string) => {
    if (role === 'owner') return <Tag color="gold" icon={<CrownOutlined />}>所有者</Tag>;
    if (role === 'editor') return <Tag color="green">编辑者</Tag>;
    return <Tag color="blue">查看者</Tag>;
  };

  return (
    <Drawer
      title={`工作区设置 - ${currentWorkspace?.name || ''}`}
      placement="right"
      width={420}
      open={open}
      onClose={onClose}
    >
      <Divider>成员管理</Divider>
      
      <List
        loading={loading}
        dataSource={collaborators}
        renderItem={(c) => (
          <List.Item
            actions={
              c.role !== 'owner' ? [
                <Select
                  value={c.role}
                  options={ROLE_OPTIONS}
                  size="small"
                  style={{ width: 100 }}
                  onChange={(val) => handleUpdateRole(c.id, val)}
                />,
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveCollaborator(c.id)}
                />,
              ] : undefined
            }
          >
            <List.Item.Meta
              avatar={<Avatar icon={<UserOutlined />} style={{ background: c.role === 'owner' ? '#faad14' : '#1890ff' }} />}
              title={<Space>{c.user.username} {getRoleTag(c.role)}</Space>}
              description={c.user.email}
            />
          </List.Item>
        )}
        style={{ marginBottom: 24 }}
      />

      {currentWorkspace && (collaborators.find(c => c.role === 'owner')?.userId === currentWorkspace.ownerId) && (
        <>
          <Divider>邀请成员</Divider>
          
          <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
            <Input
              placeholder="输入用户名"
              value={addUsername}
              onChange={(e) => setAddUsername(e.target.value)}
              style={{ width: '50%' }}
            />
            <Select
              value={addRole}
              options={ROLE_OPTIONS}
              style={{ width: '30%' }}
              onChange={setAddRole}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ width: '20%' }}
              onClick={handleAddCollaborator}
              disabled={!addUsername.trim()}
            >
              邀请
            </Button>
          </Space.Compact>

          <Text type="secondary" style={{ fontSize: 12 }}>
            邀请的用户需要先注册账号。角色说明：<br />
            • 编辑者：可以创建、编辑、删除节点和脑图<br />
            • 查看者：只能查看内容，无法修改
          </Text>
        </>
      )}

      <Divider>协作测试步骤</Divider>
      
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Text>1. 在此面板邀请其他用户加入工作区</Text>
        <Text>2. 其他用户登录后，左侧边栏会显示协作的工作区</Text>
        <Text>3. 双方进入同一个脑图，点击"协作"按钮</Text>
        <Text>4. 在协作面板中可看到在线用户和实时聊天</Text>
      </Space>
    </Drawer>
  );
}