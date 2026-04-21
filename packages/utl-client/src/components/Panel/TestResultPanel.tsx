import { Drawer, List, Button, Space, Tag, Typography, Table, Modal, Input, Select, Collapse, Badge, Progress, Statistic, Row, Col, Empty } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, PlusOutlined, BugOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { message } from 'antd';

const { Text, Title } = Typography;

interface TestResult {
  status: string;
  executedAt?: string;
  notes?: string;
}

interface TestCase {
  id: string;
  name: string;
  type: string;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  severity: string;
  priority: string;
  status: string;
  reportedAt: string;
  testCase?: { id: string; name: string };
}

interface TestResultPanelProps {
  open: boolean;
  onClose: () => void;
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  untested: { color: 'default', icon: null, label: '未测试' },
  passed: { color: 'success', icon: <CheckCircleOutlined />, label: '通过' },
  failed: { color: 'error', icon: <CloseCircleOutlined />, label: '失败' },
  blocked: { color: 'warning', icon: <WarningOutlined />, label: '阻塞' },
  skipped: { color: 'processing', icon: null, label: '跳过' },
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'red',
  major: 'orange',
  minor: 'gold',
  suggestion: 'blue',
};

const PRIORITY_COLORS: Record<string, string> = {
  P0: 'red',
  P1: 'orange',
  P2: 'gold',
  P3: 'blue',
};

export default function TestResultPanel({ open, onClose }: TestResultPanelProps) {
  const params = useParams();
  const mindmapId = params.mindmapId;

  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [results, setResults] = useState<Map<string, TestResult>>(new Map());
  const [summary, setSummary] = useState<any>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('untested');
  const [newNotes, setNewNotes] = useState('');
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueDesc, setNewIssueDesc] = useState('');
  const [newIssueSeverity, setNewIssueSeverity] = useState('major');
  const [newIssuePriority, setNewIssuePriority] = useState('P1');

  useEffect(() => {
    if (open && mindmapId) {
      loadData();
    }
  }, [open, mindmapId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const nodesRes = await api.get(`/nodes/mindmap/${mindmapId}`);
      const tcNodes = nodesRes.data.filter((n: any) => n.type === 'test_case');
      setTestCases(tcNodes);

      const summaryRes = await api.get(`/results/mindmap/${mindmapId}/summary`);
      setSummary(summaryRes.data);

      const resultsMap = new Map<string, TestResult>();
      for (const tc of tcNodes) {
        try {
          const res = await api.get(`/results/testcase/${tc.id}`);
          resultsMap.set(tc.id, res.data);
        } catch {
          resultsMap.set(tc.id, { status: 'untested' });
        }
      }
      setResults(resultsMap);

      const issuesRes = await api.get(`/results/issue`, { params: { mindmapId } });
      setIssues(issuesRes.data);
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResultModal = (tc: TestCase) => {
    setSelectedTestCase(tc);
    const current = results.get(tc.id);
    setNewStatus(current?.status || 'untested');
    setNewNotes(current?.notes || '');
    setResultModalOpen(true);
  };

  const handleSaveResult = async () => {
    if (!selectedTestCase) return;

    try {
      await api.post(`/results/testcase/${selectedTestCase.id}`, {
        status: newStatus,
        notes: newNotes,
      });
      message.success('测试结果已保存');
      setResultModalOpen(false);
      loadData();
    } catch {
      message.error('保存失败');
    }
  };

  const handleOpenIssueModal = () => {
    setNewIssueTitle('');
    setNewIssueDesc('');
    setNewIssueSeverity('major');
    setNewIssuePriority('P1');
    setIssueModalOpen(true);
  };

  const handleCreateIssue = async () => {
    if (!newIssueTitle.trim()) {
      message.warning('请输入问题标题');
      return;
    }

    try {
      await api.post(`/results/issue`, {
        testCaseId: selectedTestCase?.id,
        title: newIssueTitle,
        description: newIssueDesc,
        severity: newIssueSeverity,
        priority: newIssuePriority,
      });
      message.success('问题已创建');
      setIssueModalOpen(false);
      loadData();
    } catch {
      message.error('创建失败');
    }
  };

  const handleUpdateIssueStatus = async (issueId: string, status: string) => {
    try {
      await api.put(`/results/issue/${issueId}`, { status });
      message.success('状态已更新');
      loadData();
    } catch {
      message.error('更新失败');
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    Modal.confirm({
      title: '删除问题',
      content: '确认删除此问题？',
      onOk: async () => {
        try {
          await api.delete(`/results/issue/${issueId}`);
          message.success('已删除');
          loadData();
        } catch {
          message.error('删除失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '测试用例',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: TestCase) => {
        const result = results.get(record.id);
        const config = STATUS_CONFIG[result?.status || 'untested'];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TestCase) => (
        <Button size="small" onClick={() => handleOpenResultModal(record)}>
          标记结果
        </Button>
      ),
    },
  ];

  return (
    <Drawer
      title={<Space><BugOutlined /> 测试结果管理</Space>}
      placement="right"
      width={500}
      open={open}
      onClose={onClose}
      styles={{ body: { padding: 16 } }}
    >
      {loading ? (
        <Empty />
      ) : (
        <>
          {summary && (
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Statistic title="总计" value={summary.total} />
              </Col>
              <Col span={6}>
                <Statistic title="通过" value={summary.passed} valueStyle={{ color: '#3f8600' }} />
              </Col>
              <Col span={6}>
                <Statistic title="失败" value={summary.failed} valueStyle={{ color: '#cf1322' }} />
              </Col>
              <Col span={6}>
                <Statistic title="通过率" value={summary.passRate} suffix="%" />
              </Col>
            </Row>
          )}

          {summary && summary.total > 0 && (
            <Progress
              percent={summary.passRate}
              status={summary.passRate >= 80 ? 'success' : summary.passRate >= 50 ? 'normal' : 'exception'}
              style={{ marginBottom: 16 }}
            />
          )}

          <Collapse
            items={[
              {
                key: 'testcases',
                label: `测试用例 (${testCases.length})`,
                children: (
                  <Table
                    dataSource={testCases}
                    columns={columns}
                    rowKey="id"
                    size="small"
                    pagination={false}
                  />
                ),
              },
              {
                key: 'issues',
                label: <Space>问题跟踪 <Badge count={issues.length} /></Space>,
                children: (
                  <>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenIssueModal} style={{ marginBottom: 12 }}>
                      创建问题
                    </Button>
                    <List
                      dataSource={issues}
                      renderItem={(issue) => (
                        <List.Item
                          actions={[
                            <Select
                              size="small"
                              value={issue.status}
                              style={{ width: 100 }}
                              onChange={(v) => handleUpdateIssueStatus(issue.id, v)}
                              options={[
                                { value: 'open', label: '开放' },
                                { value: 'in_progress', label: '处理中' },
                                { value: 'resolved', label: '已解决' },
                                { value: 'closed', label: '已关闭' },
                              ]}
                            />,
                            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteIssue(issue.id)} />,
                          ]}
                        >
                          <Space direction="vertical" size="small">
                            <Text strong>{issue.title}</Text>
                            <Space size="small">
                              <Tag color={SEVERITY_COLORS[issue.severity]}>{issue.severity}</Tag>
                              <Tag color={PRIORITY_COLORS[issue.priority]}>{issue.priority}</Tag>
                              <Tag>{issue.testCase?.name}</Tag>
                            </Space>
                          </Space>
                        </List.Item>
                      )}
                    />
                  </>
                ),
              },
            ]}
            defaultActiveKey={['testcases', 'issues']}
          />

          <Modal
            title={`标记测试结果 - ${selectedTestCase?.name}`}
            open={resultModalOpen}
            onOk={handleSaveResult}
            onCancel={() => setResultModalOpen(false)}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Select
                style={{ width: '100%' }}
                value={newStatus}
                onChange={setNewStatus}
                options={Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))}
              />
              <Input.TextArea
                placeholder="备注"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                rows={3}
              />
              <Button icon={<PlusOutlined />} onClick={() => setIssueModalOpen(true)}>
                同时创建问题
              </Button>
            </Space>
          </Modal>

          <Modal
            title="创建问题"
            open={issueModalOpen}
            onOk={handleCreateIssue}
            onCancel={() => setIssueModalOpen(false)}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input placeholder="问题标题" value={newIssueTitle} onChange={(e) => setNewIssueTitle(e.target.value)} />
              <Input.TextArea placeholder="问题描述" value={newIssueDesc} onChange={(e) => setNewIssueDesc(e.target.value)} rows={3} />
              <Select style={{ width: '100%' }} value={newIssueSeverity} onChange={setNewIssueSeverity}>
                <Select.Option value="critical">致命</Select.Option>
                <Select.Option value="major">严重</Select.Option>
                <Select.Option value="minor">一般</Select.Option>
                <Select.Option value="suggestion">建议</Select.Option>
              </Select>
              <Select style={{ width: '100%' }} value={newIssuePriority} onChange={setNewIssuePriority}>
                <Select.Option value="P0">P0 - 最高</Select.Option>
                <Select.Option value="P1">P1 - 高</Select.Option>
                <Select.Option value="P2">P2 - 中</Select.Option>
                <Select.Option value="P3">P3 - 低</Select.Option>
              </Select>
            </Space>
          </Modal>
        </>
      )}
    </Drawer>
  );
}