import { Router, Request, Response } from 'express';
import prisma from '../../db/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const RELATION_TYPES = ['contains', 'extends', 'references', 'depends_on', 'generates'];

router.get('/mindmap/:mindmapId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { mindmapId } = req.params;
    const relations = await prisma.relation.findMany({
      where: { mindmapId },
      include: { source: true, target: true },
    });
    res.json(relations);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { mindmapId, sourceId, targetId, type, metadata } = req.body;

    if (!mindmapId || !sourceId || !targetId) {
      return res.status(400).json({ error: 'MindmapId, sourceId and targetId required' });
    }

    if (!type || !RELATION_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Valid relation type required' });
    }

    const relation = await prisma.relation.create({
      data: { mindmapId, sourceId, targetId, type, metadata },
    });

    res.json(relation);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.relation.delete({ where: { id } });
    res.json({ message: 'Relation deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, metadata } = req.body;

    if (!type || !RELATION_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Valid relation type required' });
    }

    const relation = await prisma.relation.update({
      where: { id },
      data: { type, metadata },
    });

    res.json(relation);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;