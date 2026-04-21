import { Router, Request, Response } from 'express';
import prisma from '../../db/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const workspaces = await prisma.workspace.findMany({
      where: { ownerId: userId },
      include: { collaborators: true },
    });
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Workspace name required' });
    }

    const workspace = await prisma.workspace.create({
      data: { name, ownerId: userId },
    });

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: { mindmaps: true, collaborators: true },
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const workspace = await prisma.workspace.update({
      where: { id },
      data: { name },
    });

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.workspace.delete({ where: { id } });
    res.json({ message: 'Workspace deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;