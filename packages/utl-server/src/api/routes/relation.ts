import { Router, Request, Response } from 'express';
import prisma from '../../db/client';
import { authMiddleware } from '../middleware/auth';
import { checkWorkspacePermission } from '../middleware/permission';

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

const checkRelationPermission = async (req: Request, res: Response, next: Function) => {
  try {
    const userId = (req as any).userId;
    const relationId = req.params.id;
    
    const relation = await prisma.relation.findUnique({
      where: { id: relationId },
      include: { mindmap: { include: { workspace: true } } },
    });

    if (!relation) {
      return res.status(404).json({ error: 'Relation not found' });
    }

    const workspace = relation.mindmap.workspace;

    if (workspace.ownerId === userId) {
      (req as any).userRole = 'owner';
      return next();
    }

    const collaborator = await prisma.collaborator.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId } },
    });

    if (!collaborator) {
      return res.status(403).json({ error: 'Access denied: not a collaborator' });
    }

    if (collaborator.role !== 'owner' && collaborator.role !== 'editor') {
      return res.status(403).json({ error: 'Permission denied: requires owner or editor role' });
    }

    (req as any).userRole = collaborator.role;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { mindmapId, sourceId, targetId, type, metadata } = req.body;

    if (!mindmapId || !sourceId || !targetId) {
      return res.status(400).json({ error: 'MindmapId, sourceId and targetId required' });
    }

    if (!type || !RELATION_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Valid relation type required' });
    }

    const mindmap = await prisma.mindmap.findUnique({
      where: { id: mindmapId },
      include: { workspace: true },
    });

    if (!mindmap) {
      return res.status(404).json({ error: 'Mindmap not found' });
    }

    const workspace = mindmap.workspace;
    
    if (workspace.ownerId !== userId) {
      const collaborator = await prisma.collaborator.findUnique({
        where: { workspaceId_userId: { workspaceId: workspace.id, userId } },
      });

      if (!collaborator || (collaborator.role !== 'owner' && collaborator.role !== 'editor')) {
        return res.status(403).json({ error: 'Permission denied: requires owner or editor role' });
      }
    }

    const relation = await prisma.relation.create({
      data: { mindmapId, sourceId, targetId, type, metadata },
    });

    res.json(relation);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, checkRelationPermission, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.relation.delete({ where: { id } });
    res.json({ message: 'Relation deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, checkRelationPermission, async (req: Request, res: Response) => {
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