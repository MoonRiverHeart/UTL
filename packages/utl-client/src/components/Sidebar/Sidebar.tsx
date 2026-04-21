import { Menu, Button } from 'antd';
import { PlusOutlined, FileOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';

export default function Sidebar() {
  const navigate = useNavigate();
  const { currentWorkspace, mindmaps, selectMindmap, createMindmap } = useWorkspaceStore();

  const handleCreateMindmap = async () => {
    if (!currentWorkspace) return;
    const name = prompt('脑图名称');
    if (name) {
      const mindmap = await createMindmap(currentWorkspace.id, name);
      navigate(`/mindmap/${mindmap.id}`);
    }
  };

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ padding: '8px 16px' }}>
        <Button icon={<PlusOutlined />} onClick={handleCreateMindmap} block size="small">
          新建脑图
        </Button>
      </div>

      <Menu
        mode="inline"
        items={mindmaps.map((m) => ({
          key: m.id,
          icon: <FileOutlined />,
          label: m.name,
          onClick: () => {
            selectMindmap(m.id);
            navigate(`/mindmap/${m.id}`);
          },
        }))}
        style={{ border: 'none' }}
      />
    </div>
  );
}