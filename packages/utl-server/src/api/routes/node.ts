import { Router, Request, Response } from 'express';
import prisma from '../../db/client';
import { authMiddleware } from '../middleware/auth';
import { checkWorkspacePermission, checkNodePermission } from '../middleware/permission';

const router = Router();

const NODE_TYPES = [
  'scenario',
  'function',
  'test_point',
  'action_factor',
  'data_factor',
  'test_case',
  'precondition',
  'test_step',
  'expected_result',
];

router.get('/mindmap/:mindmapId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { mindmapId } = req.params;
    const nodes = await prisma.node.findMany({
      where: { mindmapId },
      include: {
        relationsAsSource: true,
        relationsAsTarget: true,
      },
    });
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/mindmap/:mindmapId', authMiddleware, checkWorkspacePermission(['owner', 'editor']), async (req: Request, res: Response) => {
  try {
    const { mindmapId } = req.params;
    const { type, name, description, parentId, position, metadata } = req.body;

    if (!type || !NODE_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Valid node type required' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Node name required' });
    }

    const node = await prisma.node.create({
      data: {
        type,
        name,
        description,
        mindmapId,
        parentId,
        workspaceId: '',
        position: position || { x: 0, y: 0 },
        metadata: metadata || {},
        versionId: 'v1',
        branchId: 'main',
      },
    });

    res.json(node);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const node = await prisma.node.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        relationsAsSource: true,
        relationsAsTarget: true,
      },
    });

    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    res.json(node);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, checkNodePermission(['owner', 'editor']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, position, metadata } = req.body;

    const node = await prisma.node.update({
      where: { id },
      data: { name, description, position, metadata },
    });

    res.json(node);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, checkNodePermission(['owner', 'editor']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.node.delete({ where: { id } });
    res.json({ message: 'Node deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;