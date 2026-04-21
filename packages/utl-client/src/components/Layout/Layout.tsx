import { Layout as AntLayout, Button, Dropdown, Select, Divider, Avatar, Upload, message } from 'antd';
import { UserOutlined, LogoutOutlined, PlusOutlined, FileOutlined, FolderOutlined, AppstoreOutlined, SettingOutlined, GitBranchOutlined, BugOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import StatusBar from './StatusBar';
import NodeTree from '../Sidebar/NodeTree';
import NodePropertyPanel from '../Editor/PropertyPanel';
import CollaborationPanel from '../Collaboration/CollaborationPanel';
import BranchVersionPanel from '../Panel/BranchVersionPanel';
import TestResultPanel from '../Panel/TestResultPanel';
import { useAuthStore } from '../../stores/authStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useEditorStore } from '../../stores/editorStore';
import { useEffect, useState } from 'react';
import api from '../../services/api';

const { Sider, Content } = AntLayout;

export default function Layout() {
  const navigate = useNavigate();
  const params = useParams();
  const { user, logout } = useAuthStore();
  const { loadWorkspaces, workspaces, currentWorkspace, selectWorkspace, createWorkspace, clearWorkspace, loadMindmaps, mindmaps, currentMindmap, selectMindmap, createMindmap } =
    useWorkspaceStore();
  const { mode, selectedNodes } = useEditorStore();
  const [propertyPanelOpen, setPropertyPanelOpen] = useState(false);
  const [collaborationPanelOpen, setCollaborationPanelOpen] = useState(false);
  const [branchPanelOpen, setBranchPanelOpen] = useState(false);
  const [testResultPanelOpen, setTestResultPanelOpen] = useState(false);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    if (params.workspaceId) {
      selectWorkspace(params.workspaceId);
      loadMindmaps(params.workspaceId);
    }
  }, [params.workspaceId, selectWorkspace, loadMindmaps]);

  useEffect(() => {
    if (params.mindmapId) {
      selectMindmap(params.mindmapId);
    }
  }, [params.mindmapId, selectMindmap]);

  const handleCreateWorkspace = async () => {
    const name = prompt('工作区名称', '我的工作区');
    if (name?.trim()) {
      const workspace = await createWorkspace(name.trim());
      await loadWorkspaces();
      selectWorkspace(workspace.id);
      navigate(`/workspace/${workspace.id}`);
    }
  };

  const handleCreateMindmap = async () => {
    if (!currentWorkspace) return;
    const name = prompt('脑图名称', '测试脑图');
    if (name?.trim()) {
      const mindmap = await createMindmap(currentWorkspace.id, name.trim());
      await loadMindmaps(currentWorkspace.id);
      selectMindmap(mindmap.id);
      navigate(`/mindmap/${mindmap.id}`);
    }
  };

  const handleWorkspaceChange = (workspaceId: string) => {
    selectWorkspace(workspaceId);
    loadMindmaps(workspaceId);
    navigate(`/workspace/${workspaceId}`);
  };

  const handleMindmapChange = (mindmapId: string) => {
    selectMindmap(mindmapId);
    const basePath = mode === 'script' ? 'script' : mode === 'split' ? 'split' : '';
    navigate(`/mindmap/${mindmapId}${basePath ? '/' + basePath : ''}`);
  };

  const handleLogout = () => {
    clearWorkspace();
    logout();
    navigate('/login');
  };

  const handleExportUTL = async () => {
    if (!params.mindmapId) {
      message.warning('请先选择脑图');
      return;
    }
    try {
      const res = await api.get(`/import/mindmap/${params.mindmapId}/export`, { params: { format: 'file' } });
      const blob = new Blob([res.data], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentMindmap?.name || 'mindmap'}.utl`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('UTL文件已导出');
    } catch {
      message.error('导出失败');
    }
  };

  const handleImportUTL = async (file: File) => {
    if (!params.mindmapId || !currentWorkspace) {
      message.warning('请先选择脑图');
      return false;
    }
    try {
      const text = await file.text();
      await api.post(`/import/mindmap/${params.mindmapId}/import`, {
        utlSource: text,
        workspaceId: currentWorkspace.id,
      });
      message.success('UTL文件已导入');
      window.location.reload();
      return false;
    } catch {
      message.error('导入失败');
      return false;
    }
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <AntLayout style={{ height: '100vh', background: '#f0f2f5' }}>
      <Sider 
        width={260} 
        theme="light" 
        style={{ 
          borderRight: '1px solid #d9d9d9',
          background: '#fff',
          boxShadow: '2px 0 8px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ 
          padding: '16px 12px', 
          borderBottom: '1px solid #f0f0f0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          marginBottom: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AppstoreOutlined style={{ fontSize: 24, color: '#fff', marginRight: 8 }} />
            <span style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>UTL 测试系统</span>
          </div>
        </div>

        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomLeft">
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px 12px', background: '#f5f5f5', borderRadius: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} style={{ background: '#1890ff', marginRight: 8 }} />
              <span style={{ fontWeight: 500, color: '#333' }}>{user?.username || '用户'}</span>
            </div>
          </Dropdown>
        </div>

        <div style={{ padding: '12px 16px' }}>
          <div style={{ marginBottom: 8, fontWeight: 600, color: '#1890ff', fontSize: 13 }}>
            <FolderOutlined style={{ marginRight: 8 }} />
            工作区
          </div>
          <Select
            style={{ width: '100%' }}
            placeholder="选择工作区"
            value={currentWorkspace?.id}
            onChange={handleWorkspaceChange}
            options={workspaces.map(w => ({ value: w.id, label: w.name }))}
            variant="borderless"
          />
          <Button 
            type="primary"
            icon={<PlusOutlined />} 
            onClick={handleCreateWorkspace} 
            block 
            size="small"
            style={{ marginTop: 8, borderRadius: 6 }}
          >
            新建工作区
          </Button>
        </div>

        {currentWorkspace && (
          <>
            <Divider style={{ margin: '8px 16px', borderColor: '#e8e8e8' }} />
            <div style={{ padding: '12px 16px' }}>
              <div style={{ marginBottom: 8, fontWeight: 600, color: '#52c41a', fontSize: 13 }}>
                <FileOutlined style={{ marginRight: 8 }} />
                脑图
              </div>
              <Select
                style={{ width: '100%' }}
                placeholder="选择脑图"
                value={currentMindmap?.id}
                onChange={handleMindmapChange}
                options={mindmaps.map(m => ({ value: m.id, label: m.name }))}
                variant="borderless"
              />
              <Button 
                type="default"
                icon={<PlusOutlined />} 
                onClick={handleCreateMindmap} 
                block 
                size="small"
                style={{ marginTop: 8, borderRadius: 6, borderColor: '#52c41a', color: '#52c41a' }}
              >
                新建脑图
              </Button>
            </div>
            <Divider style={{ margin: '8px 16px', borderColor: '#e8e8e8' }} />
            <div style={{ flex: 1, overflow: 'auto' }}>
              <NodeTree />
            </div>
          </>
        )}
      </Sider>

      <Content style={{ display: 'flex', flexDirection: 'column', background: '#fafbfc' }}>
        <div style={{ 
          padding: '8px 16px', 
          background: '#fff', 
          borderBottom: '1px solid #d9d9d9',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 8
        }}>
          <Upload
            accept=".utl"
            beforeUpload={handleImportUTL}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />} size="small">导入</Button>
          </Upload>
          <Button 
            icon={<DownloadOutlined />}
            onClick={handleExportUTL}
            size="small"
          >
            导出
          </Button>
          <Button 
            icon={<GitBranchOutlined />}
            onClick={() => setBranchPanelOpen(true)}
            size="small"
          >
            分支
          </Button>
          <Button 
            icon={<BugOutlined />}
            onClick={() => setTestResultPanelOpen(true)}
            size="small"
          >
            测试
          </Button>
          <Button 
            icon={<SettingOutlined />}
            onClick={() => setPropertyPanelOpen(true)}
            disabled={selectedNodes.length !== 1}
            size="small"
          >
            属性
          </Button>
          <Button 
            icon={<UserOutlined />}
            onClick={() => setCollaborationPanelOpen(true)}
            size="small"
          >
            协作
          </Button>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Outlet />
        </div>
        <StatusBar />
      </Content>
      
      <NodePropertyPanel 
        open={propertyPanelOpen} 
        onClose={() => setPropertyPanelOpen(false)} 
      />
      
      <CollaborationPanel 
        open={collaborationPanelOpen} 
        onClose={() => setCollaborationPanelOpen(false)} 
      />

      <BranchVersionPanel 
        open={branchPanelOpen} 
        onClose={() => setBranchPanelOpen(false)} 
      />

      <TestResultPanel 
        open={testResultPanelOpen} 
        onClose={() => setTestResultPanelOpen(false)} 
      />
    </AntLayout>
  );
}