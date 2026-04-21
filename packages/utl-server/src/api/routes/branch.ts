import { Router, Request, Response } from 'express';
import prisma from '../../db/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/mindmap/:mindmapId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { mindmapId } = req.params;
    const branches = await prisma.branch.findMany({
      where: { mindmapId },
      orderBy: { createdAt: 'desc' },
      include: {
        parentBranch: { select: { id: true, name: true } },
      },
    });
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/mindmap/:mindmapId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { mindmapId } = req.params;
    const userId = (req as any).userId;
    const { name, description, parentBranchId } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Branch name required' });
    }

    const existing = await prisma.branch.findFirst({
      where: { mindmapId, name },
    });

    if (existing) {
      return res.status(400).json({ error: 'Branch name already exists' });
    }

    const mindmap = await prisma.mindmap.findUnique({ where: { id: mindmapId } });
    if (!mindmap) {
      return res.status(404).json({ error: 'Mindmap not found' });
    }

    const branch = await prisma.branch.create({
      data: {
        mindmapId,
        name,
        description,
        parentBranchId: parentBranchId || null,
        authorId: userId,
        status: 'active',
        versions: {
          create: {
            mindmapId,
            versionNumber: 'v0',
            message: 'Initial version',
            authorId: userId,
            snapshot: { nodes: [], relations: [] },
          },
        },
      },
      include: { versions: true },
    });

    const initialVersion = branch.versions[0];
    if (initialVersion) {
      await prisma.branch.update({
        where: { id: branch.id },
        data: { headVersionId: initialVersion.id },
      });
      branch.headVersionId = initialVersion.id;
    }

    res.json(branch);
  } catch (error) {
    console.error('Branch creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { createdAt: 'desc' }, take: 10 },
        author: { select: { id: true, username: true } },
      },
    });

    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    res.json(branch);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const branch = await prisma.branch.update({
      where: { id },
      data: { name, description, status },
    });

    res.json(branch);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const branch = await prisma.branch.findUnique({ where: { id } });

    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    if (branch.status !== 'active') {
      return res.status(400).json({ error: 'Cannot delete non-active branch' });
    }

    await prisma.branch.delete({ where: { id } });
    res.json({ message: 'Branch deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/checkout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { mindmapId } = req.body;

    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    await prisma.mindmap.update({
      where: { id: mindmapId },
      data: { currentBranchId: id },
    });

    let snapshot = { nodes: [], relations: [] };
    
    if (branch.headVersionId) {
      const version = await prisma.version.findUnique({
        where: { id: branch.headVersionId },
      });
      if (version?.snapshot) {
        snapshot = version.snapshot as { nodes: any[]; relations: any[] };
      }
    } else {
      const latestVersion = await prisma.version.findFirst({
        where: { branchId: id },
        orderBy: { createdAt: 'desc' },
      });
      if (latestVersion?.snapshot) {
        snapshot = latestVersion.snapshot as { nodes: any[]; relations: any[] };
      }
    }

    res.json({ branch, snapshot });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/merge', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { targetBranchId } = req.body;
    const userId = (req as any).userId;

    if (!targetBranchId) {
      return res.status(400).json({ error: 'Target branch ID required' });
    }

    const sourceBranch = await prisma.branch.findUnique({ where: { id } });
    const targetBranch = await prisma.branch.findUnique({ where: { id: targetBranchId } });

    if (!sourceBranch || !targetBranch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    // Get snapshot from source branch's latest version
    let snapshot = { nodes: [], relations: [] };
    
    if (sourceBranch.headVersionId) {
      const sourceVersion = await prisma.version.findUnique({
        where: { id: sourceBranch.headVersionId },
      });
      if (sourceVersion?.snapshot) {
        snapshot = sourceVersion.snapshot as { nodes: any[]; relations: any[] };
      }
    } else {
      // Fallback: get latest version if headVersionId is null
      const latestVersion = await prisma.version.findFirst({
        where: { branchId: id },
        orderBy: { createdAt: 'desc' },
      });
      if (latestVersion?.snapshot) {
        snapshot = latestVersion.snapshot as { nodes: any[]; relations: any[] };
      }
    }

    const newVersion = await prisma.version.create({
      data: {
        mindmapId: sourceBranch.mindmapId,
        branchId: targetBranchId,
        versionNumber: `v${Date.now()}`,
        message: `Merge from ${sourceBranch.name}`,
        authorId: userId,
        snapshot,
      },
    });

    await prisma.branch.update({
      where: { id: targetBranchId },
      data: { headVersionId: newVersion.id },
    });

    await prisma.branch.update({
      where: { id },
      data: { status: 'merged', mergedTo: targetBranchId, mergedAt: new Date() },
    });

    res.json({ merged: true, newVersion });
  } catch (error) {
    console.error('Merge error:', error);
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;