import { Space, Tag } from 'antd';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useEditorStore } from '../../stores/editorStore';
import ModeSwitcher from '../Editor/ModeSwitcher';

export default function StatusBar() {
  const { currentMindmap } = useWorkspaceStore();
  const { nodes, selectedNodes } = useEditorStore();

  return (
    <div
      style={{
        padding: '8px 16px',
        borderTop: '1px solid #d9d9d9',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 -2px 4px rgba(0,0,0,0.03)',
      }}
    >
      <Space size="middle">
        <ModeSwitcher />
        {currentMindmap && (
          <Tag 
            color="blue" 
            style={{ 
              borderRadius: 6, 
              padding: '2px 8px',
              fontWeight: 500
            }}
          >
            {currentMindmap.name}
          </Tag>
        )}
      </Space>

      <Space size="middle">
        <span style={{ color: '#666', fontSize: 12 }}>
          节点: <strong style={{ color: '#1890ff' }}>{nodes.length}</strong>
        </span>
        {selectedNodes.length > 0 && (
          <Tag color="orange" style={{ borderRadius: 6 }}>
            选中: {selectedNodes.length}
          </Tag>
        )}
      </Space>
    </div>
  );
}