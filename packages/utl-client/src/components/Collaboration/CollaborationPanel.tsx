import { Drawer, List, Avatar, Tag, Space, Input, Button, Typography, Badge, Divider, Empty } from 'antd';
import { UserOutlined, SendOutlined, CrownOutlined } from '@ant-design/icons';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import io from 'socket.io-client';

const { Text, Title } = Typography;

interface OnlineUser {
  userId: string;
  username: string;
  color: string;
  cursor?: { x: number; y: number };
  selectedNode?: string;
  editingNode?: string;
  joinedAt: Date;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
}

interface CollaborationPanelProps {
  open: boolean;
  onClose: () => void;
}

const USER_COLORS = [
  '#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', 
  '#13c2c2', '#fa8c16', '#2f54eb', '#f5222d'
];

export default function CollaborationPanel({ open, onClose }: CollaborationPanelProps) {
  const params = useParams();
  const { user } = useAuthStore();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [connected, setConnected] = useState(false);
  const [myColor, setMyColor] = useState('#1890ff');

  const mindmapId = params.mindmapId;

  useEffect(() => {
    if (open && mindmapId && user) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
      const newSocket = io(socketUrl, {
        auth: { userId: user.id, username: user.username },
        transports: ['websocket'],
      });

      newSocket.on('connect', () => {
        setConnected(true);
        newSocket.emit('join_mindmap', { mindmapId, userId: user.id, username: user.username });
        
        const colorIndex = Math.floor(Math.random() * USER_COLORS.length);
        setMyColor(USER_COLORS[colorIndex]);
      });

      newSocket.on('disconnect', () => {
        setConnected(false);
      });

      newSocket.on('user_joined', (data: OnlineUser) => {
        setOnlineUsers(prev => {
          if (prev.find(u => u.userId === data.userId)) return prev;
          return [...prev, data];
        });
        
        setMessages(prev => [...prev, {
          id: `sys-${Date.now()}`,
          userId: 'system',
          username: '系统',
          content: `${data.username} 加入了协作`,
          timestamp: new Date(),
        }]);
      });

      newSocket.on('user_left', (data: { userId: string }) => {
        setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
      });

      newSocket.on('users_list', (users: OnlineUser[]) => {
        setOnlineUsers(users);
      });

      newSocket.on('chat_message', (msg: ChatMessage) => {
        setMessages(prev => [...prev, msg]);
      });

      newSocket.on('user_cursor', (data: { userId: string; cursor: { x: number; y: number } }) => {
        setOnlineUsers(prev => prev.map(u => 
          u.userId === data.userId ? { ...u, cursor: data.cursor } : u
        ));
      });

      setSocket(newSocket);

      return () => {
        newSocket.emit('leave_mindmap', { mindmapId });
        newSocket.disconnect();
      };
    }
  }, [open, mindmapId, user]);

  const sendMessage = useCallback(() => {
    if (!inputMessage.trim() || !socket) return;
    
    socket.emit('chat_message', {
      mindmapId,
      userId: user?.id,
      username: user?.username,
      content: inputMessage.trim(),
    });
    
    setInputMessage('');
  }, [inputMessage, socket, mindmapId, user]);

  const currentUser = onlineUsers.find(u => u.userId === user?.id);
  const otherUsers = onlineUsers.filter(u => u.userId !== user?.id);

  return (
    <Drawer
      title={
        <Space>
          <Title level={5} style={{ margin: 0 }}>协作面板</Title>
          <Badge 
            status={connected ? 'success' : 'error'} 
            text={connected ? '已连接' : '未连接'} 
          />
        </Space>
      }
      placement="right"
      width={380}
      open={open}
      onClose={onClose}
      styles={{ body: { display: 'flex', flexDirection: 'column' } }}
    >
      <Divider>在线用户 ({onlineUsers.length})</Divider>
      
      {onlineUsers.length === 0 ? (
        <Empty description="暂无其他用户" style={{ marginBottom: 16 }} />
      ) : (
        <List
          dataSource={onlineUsers}
          renderItem={(u) => (
            <List.Item>
              <Space>
                <Avatar 
                  size="small" 
                  style={{ background: u.color || '#1890ff' }}
                  icon={<UserOutlined />}
                />
                <Text strong={u.userId === user?.id}>{u.username}</Text>
                {u.userId === user?.id && <Tag color="green">我</Tag>}
                {u.editingNode && <Tag color="orange">编辑中</Tag>}
              </Space>
            </List.Item>
          )}
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Divider>聊天</Divider>
      
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        marginBottom: 16,
        padding: '8px 0',
        background: '#fafafa',
        borderRadius: 8
      }}>
        {messages.length === 0 ? (
          <Empty description="暂无消息" />
        ) : (
          <Space direction="vertical" style={{ width: '100%', padding: 8 }}>
            {messages.map((msg) => (
              <div 
                key={msg.id}
                style={{
                  padding: '8px 12px',
                  background: msg.userId === 'system' ? '#e6f7ff' : '#fff',
                  borderRadius: 8,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                {msg.userId !== 'system' && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {msg.username} • {new Date(msg.timestamp).toLocaleTimeString()}
                  </Text>
                )}
                <div style={{ marginTop: 4 }}>
                  <Text>{msg.content}</Text>
                </div>
              </div>
            ))}
          </Space>
        )}
      </div>
      
      <Space.Compact style={{ width: '100%' }}>
        <Input
          placeholder="输入消息..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onPressEnter={sendMessage}
          disabled={!connected}
        />
        <Button 
          type="primary" 
          icon={<SendOutlined />}
          onClick={sendMessage}
          disabled={!connected || !inputMessage.trim()}
        >
          发送
        </Button>
      </Space.Compact>
      
      <Divider>协作提示</Divider>
      
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Text type="secondary">• 节点拖动和编辑会自动同步给其他用户</Text>
        <Text type="secondary">• 点击节点时，其他用户会看到您的选中状态</Text>
        <Text type="secondary">• 编辑节点时，该节点会被锁定，其他用户无法同时编辑</Text>
      </Space>
    </Drawer>
  );
}