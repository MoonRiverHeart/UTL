import { Router, Request, Response } from 'express';
import prisma from '../../db/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/branch/:branchId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;
    const versions = await prisma.version.findMany({
      where: { branchId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, username: true } },
      },
    });
    res.json(versions);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/branch/:branchId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;
    const userId = (req as any).userId;
    const { message, snapshot } = req.body;

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    const existingVersions = await prisma.version.count({ where: { branchId } });
    const versionNumber = `v${existingVersions + 1}`;

    const version = await prisma.version.create({
      data: {
        mindmapId: branch.mindmapId,
        branchId,
        versionNumber,
        message: message || `Version ${versionNumber}`,
        authorId: userId,
        snapshot: snapshot || { nodes: [], relations: [] },
        parentVersionId: branch.headVersionId,
      },
    });

    await prisma.branch.update({
      where: { id: branchId },
      data: { headVersionId: version.id },
    });

    res.json(version);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const version = await prisma.version.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    res.json(version);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/restore', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const version = await prisma.version.findUnique({ where: { id } });

    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    await prisma.branch.update({
      where: { id: version.branchId },
      data: { headVersionId: id },
    });

    res.json({ restored: true, snapshot: version.snapshot });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id1/diff/:id2', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id1, id2 } = req.params;

    const v1 = await prisma.version.findUnique({ where: { id: id1 } });
    const v2 = await prisma.version.findUnique({ where: { id: id2 } });

    if (!v1 || !v2) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const s1 = v1.snapshot as { nodes: { id: string; name: string }[]; relations: { id: string }[] };
    const s2 = v2.snapshot as { nodes: { id: string; name: string }[]; relations: { id: string }[] };

    const addedNodes = s2.nodes.filter(n => !s1.nodes.find(o => o.id === n.id));
    const deletedNodes = s1.nodes.filter(n => !s2.nodes.find(o => o.id === n.id));
    const modifiedNodes = s2.nodes.filter(n => {
      const old = s1.nodes.find(o => o.id === n.id);
      return old && JSON.stringify(old) !== JSON.stringify(n);
    });

    const addedRelations = s2.relations.filter(r => !s1.relations.find(o => o.id === r.id));
    const deletedRelations = s1.relations.filter(r => !s2.relations.find(o => r.id === r.id));

    res.json({
      from: { id: id1, versionNumber: v1.versionNumber },
      to: { id: id2, versionNumber: v2.versionNumber },
      diff: {
        addedNodes,
        deletedNodes,
        modifiedNodes,
        addedRelations,
        deletedRelations,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;