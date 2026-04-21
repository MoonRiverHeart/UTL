import { Router, Request, Response } from 'express';
import prisma from '../../db/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const TEST_STATUS = ['untested', 'passed', 'failed', 'blocked', 'skipped'];
const ISSUE_STATUS = ['open', 'in_progress', 'resolved', 'closed', 'reopened'];
const ISSUE_SEVERITY = ['critical', 'major', 'minor', 'suggestion'];
const ISSUE_PRIORITY = ['P0', 'P1', 'P2', 'P3'];

router.post('/testcase/:testCaseId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { testCaseId } = req.params;
    const userId = (req as any).userId;
    const { status, environment, duration, notes } = req.body;

    if (!TEST_STATUS.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const existing = await prisma.testResult.findFirst({
      where: { testCaseId },
    });

    if (existing) {
      const result = await prisma.testResult.update({
        where: { id: existing.id },
        data: {
          status,
          executedAt: new Date(),
          executedBy: userId,
          environment,
          duration,
          notes,
        },
      });
      res.json(result);
    } else {
      const result = await prisma.testResult.create({
        data: {
          testCaseId,
          status,
          executedAt: new Date(),
          executedBy: userId,
          environment,
          duration,
          notes,
        },
      });
      res.json(result);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/testcase/:testCaseId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { testCaseId } = req.params;
    const result = await prisma.testResult.findFirst({
      where: { testCaseId },
      include: {
        issues: true,
        executor: { select: { id: true, username: true } },
      },
    });
    res.json(result || { status: 'untested' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/mindmap/:mindmapId/summary', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { mindmapId } = req.params;

    const nodes = await prisma.node.findMany({
      where: { mindmapId, type: 'test_case' },
    });

    const testCaseIds = nodes.map(n => n.id);
    const results = await prisma.testResult.findMany({
      where: { testCaseId: { in: testCaseIds } },
    });

    const summary = {
      total: nodes.length,
      untested: nodes.length - results.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      blocked: results.filter(r => r.status === 'blocked').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      passRate: results.length > 0 
        ? Math.round((results.filter(r => r.status === 'passed').length / results.length) * 100)
        : 0,
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/issue', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { testCaseId, title, description, severity, priority, testResultId } = req.body;

    if (!testCaseId || !title) {
      return res.status(400).json({ error: 'testCaseId and title required' });
    }

    if (severity && !ISSUE_SEVERITY.includes(severity)) {
      return res.status(400).json({ error: 'Invalid severity' });
    }

    if (priority && !ISSUE_PRIORITY.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }

    const issue = await prisma.issue.create({
      data: {
        testCaseId,
        testResultId,
        title,
        description: description || '',
        severity: severity || 'major',
        priority: priority || 'P1',
        status: 'open',
        reportedBy: userId,
        relatedNodes: [],
      },
    });

    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/issue', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { mindmapId, status, severity } = req.query;

    const where: any = {};
    
    if (mindmapId) {
      const nodes = await prisma.node.findMany({
        where: { mindmapId: mindmapId as string, type: 'test_case' },
      });
      where.testCaseId = { in: nodes.map(n => n.id) };
    }

    if (status) where.status = status;
    if (severity) where.severity = severity;

    const issues = await prisma.issue.findMany({
      where,
      orderBy: { reportedAt: 'desc' },
      include: {
        testCase: { select: { id: true, name: true } },
        reporter: { select: { id: true, username: true } },
      },
    });

    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/issue/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        testCase: { select: { id: true, name: true } },
        reporter: { select: { id: true, username: true } },
        attachments: true,
      },
    });

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/issue/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, resolution, resolutionType } = req.body;

    if (status && !ISSUE_STATUS.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (resolution) {
      updateData.resolution = resolution;
      updateData.resolutionType = resolutionType;
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = (req as any).userId;
    }

    const issue = await prisma.issue.update({
      where: { id },
      data: updateData,
    });

    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/issue/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.issue.delete({ where: { id } });
    res.json({ message: 'Issue deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;