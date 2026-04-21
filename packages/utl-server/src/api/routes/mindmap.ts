import { Router, Request, Response } from 'express';
import prisma from '../../db/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/workspace/:workspaceId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const mindmaps = await prisma.mindmap.findMany({
      where: { workspaceId },
    });
    res.json(mindmaps);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/workspace/:workspaceId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Mindmap name required' });
    }

    const mindmap = await prisma.mindmap.create({
      data: { name, workspaceId },
    });

    res.json(mindmap);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const mindmap = await prisma.mindmap.findUnique({
      where: { id },
      include: { nodes: true, relations: true },
    });

    if (!mindmap) {
      return res.status(404).json({ error: 'Mindmap not found' });
    }

    res.json(mindmap);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, utlSource } = req.body;

    const mindmap = await prisma.mindmap.update({
      where: { id },
      data: { name, utlSource },
    });

    res.json(mindmap);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.mindmap.delete({ where: { id } });
    res.json({ message: 'Mindmap deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;