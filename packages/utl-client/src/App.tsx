import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import MindmapEditor from './components/Editor/MindmapEditor/Canvas';
import ScriptEditor from './components/Editor/ScriptEditor';
import SplitEditor from './components/Editor/SplitEditor';
import LoginPage from './components/Auth/LoginPage';
import { useAuthStore } from './stores/authStore';
import { Spin } from 'antd';

function App() {
  const { isAuthenticated, isInitialized, init } = useAuthStore();

  if (!isInitialized) {
    init();
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />} />
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
          <Route index element={<HomePage />} />
          <Route path="workspace/:workspaceId" element={<WorkspacePage />} />
          <Route path="mindmap/:mindmapId" element={<MindmapEditor />} />
          <Route path="mindmap/:mindmapId/script" element={<ScriptEditor />} />
          <Route path="mindmap/:mindmapId/split" element={<SplitEditor />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function HomePage() {
  return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <h2>欢迎使用 UTL 测试用例管理系统</h2>
      <p style={{ color: '#666' }}>请从左侧选择或创建工作区和脑图开始使用</p>
    </div>
  );
}

function WorkspacePage() {
  return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <h2>工作区已选择</h2>
      <p style={{ color: '#666' }}>请从左侧选择或创建脑图</p>
    </div>
  );
}

export default App;