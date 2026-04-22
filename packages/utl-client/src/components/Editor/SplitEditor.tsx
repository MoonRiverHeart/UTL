import { useState, useRef, useCallback } from 'react';
import BlueprintEditor from './MindmapEditor/Canvas';
import ScriptEditor from './ScriptEditor';
import { Button, Space, Tag, Switch, message } from 'antd';
import { SyncOutlined, LockOutlined, UnlockOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useEditorStore } from '../../stores/editorStore';

export default function SplitEditor() {
  const { currentMindmap } = useWorkspaceStore();
  const { nodes, relations } = useEditorStore();
  
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [splitRatio, setSplitRatio] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSync = () => {
    if (syncEnabled) {
      message.success('双向同步已启用，编辑将自动同步');
    } else {
      message.warning('同步已禁用，两侧独立编辑');
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitRatio(Math.min(80, Math.max(20, newRatio)));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useState(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Button icon={<SyncOutlined />} onClick={handleSync} type={syncEnabled ? 'primary' : 'default'}>{syncEnabled ? '同步开启' : '同步关闭'}</Button>
          <span>同步:<Switch checked={syncEnabled} onChange={setSyncEnabled} style={{ marginLeft: 8 }} /></span>
          {syncEnabled ? <Tag color="green" icon={<UnlockOutlined />}>实时同步</Tag> : <Tag color="orange" icon={<LockOutlined />}>独立编辑</Tag>}
        </Space>
        <Space>
          <span>脑图占比: {splitRatio}%</span>
          <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => setSplitRatio(Math.max(20, splitRatio - 10))} />
          <Button size="small" icon={<ArrowRightOutlined />} onClick={() => setSplitRatio(Math.min(80, splitRatio + 10))} />
        </Space>
        <Space><Tag color="purple">分屏模式</Tag><span>{currentMindmap?.name}</span></Space>
      </div>
      <div 
        ref={containerRef}
        style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}
        onMouseMove={isDragging ? (e) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
            setSplitRatio(Math.min(80, Math.max(20, newRatio)));
          }
        } : undefined}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        <div style={{ width: `${splitRatio}%`, height: '100%', overflow: 'hidden' }}><BlueprintEditor /></div>
        <div 
          style={{ 
            width: 6, 
            background: isDragging ? '#1890ff' : '#e8e8e8',
            cursor: 'col-resize',
            transition: 'background 0.2s',
            zIndex: 10
          }}
          onMouseDown={handleMouseDown}
        />
        <div style={{ width: `${100 - splitRatio}%`, height: '100%', overflow: 'hidden' }}><ScriptEditor /></div>
      </div>
      <div style={{ padding: '8px 16px', background: '#fafafa', borderTop: '1px solid #e8e8e8', display: 'flex', justifyContent: 'center', fontSize: 12, color: '#666' }}>
        <Space split={<span>|</span>}><span>左: 脑图编辑（拖拽连线）</span><span>右: UTL脚本</span><span>节点: {nodes.length}</span><span>连接: {relations.length}</span></Space>
      </div>
    </div>
  );
}