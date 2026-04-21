import { Request, Response, NextFunction } from 'express';
import prisma from '../../db/client';

export const checkWorkspacePermission = (requiredRoles: string[] = ['owner', 'editor']) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const mindmapId = req.params.mindmapId || req.body.mindmapId;
      
      if (!mindmapId) {
        return res.status(400).json({ error: 'MindmapId required' });
      }

      const mindmap = await prisma.mindmap.findUnique({
        where: { id: mindmapId },
        include: { workspace: true },
      });

      if (!mindmap) {
        return res.status(404).json({ error: 'Mindmap not found' });
      }

      const workspace = mindmap.workspace;

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

      if (!requiredRoles.includes(collaborator.role)) {
        return res.status(403).json({ error: `Permission denied: requires ${requiredRoles.join(' or ')} role` });
      }

      (req as any).userRole = collaborator.role;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

export const checkNodePermission = (requiredRoles: string[] = ['owner', 'editor']) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const nodeId = req.params.id;

      if (!nodeId) {
        return res.status(400).json({ error: 'NodeId required' });
      }

      const node = await prisma.node.findUnique({
        where: { id: nodeId },
        include: { mindmap: { include: { workspace: true } } },
      });

      if (!node) {
        return res.status(404).json({ error: 'Node not found' });
      }

      const workspace = node.mindmap.workspace;

      console.log('Permission check:', {
        userId,
        ownerId: workspace.ownerId,
        workspaceId: workspace.id,
        isOwner: workspace.ownerId === userId,
      });

      if (workspace.ownerId === userId) {
        (req as any).userRole = 'owner';
        return next();
      }

      const collaborator = await prisma.collaborator.findUnique({
        where: { workspaceId_userId: { workspaceId: workspace.id, userId } },
      });

      console.log('Collaborator check:', {
        collaborator,
        requiredRoles,
      });

      if (!collaborator) {
        return res.status(403).json({ error: 'Access denied: not a collaborator' });
      }

      if (!requiredRoles.includes(collaborator.role)) {
        return res.status(403).json({ error: `Permission denied: requires ${requiredRoles.join(' or ')} role` });
      }

      (req as any).userRole = collaborator.role;
      (req as any).mindmapId = node.mindmapId;
      next();
    } catch (error) {
      console.error('Permission error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};