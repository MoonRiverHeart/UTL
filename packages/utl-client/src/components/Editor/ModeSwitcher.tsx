import { Radio } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditorStore } from '../../stores/editorStore';

export default function ModeSwitcher() {
  const { mode, setMode } = useEditorStore();
  const navigate = useNavigate();
  const params = useParams();

  const handleModeChange = (newMode: 'mindmap' | 'script' | 'split') => {
    setMode(newMode);
    if (params.mindmapId) {
      const basePath = `/mindmap/${params.mindmapId}`;
      if (newMode === 'mindmap') {
        navigate(basePath);
      } else {
        navigate(`${basePath}/${newMode}`);
      }
    }
  };

  return (
    <Radio.Group 
      value={mode} 
      onChange={(e) => handleModeChange(e.target.value)} 
      buttonStyle="solid"
      size="small"
    >
      <Radio.Button value="mindmap" style={{ borderRadius: '6px 0 0 6px', fontWeight: 500 }}>脑图</Radio.Button>
      <Radio.Button value="script" style={{ fontWeight: 500 }}>脚本</Radio.Button>
      <Radio.Button value="split" style={{ borderRadius: '0 6px 6px 0', fontWeight: 500 }}>分屏</Radio.Button>
    </Radio.Group>
  );
}