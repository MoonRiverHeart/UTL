import { Router, Request, Response } from 'express';
import prisma from '../../db/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const ownedWorkspaces = await prisma.workspace.findMany({
      where: { ownerId: userId },
      include: { collaborators: { include: { user: { select: { id: true, username: true, email: true } } } } },
    });

    const collaboratedWorkspaces = await prisma.workspace.findMany({
      where: { collaborators: { some: { userId } } },
      include: { 
        collaborators: { include: { user: { select: { id: true, username: true, email: true } } } },
        owner: { select: { id: true, username: true } },
      },
    });

    const workspaces = [
      ...ownedWorkspaces.map(w => ({ ...w, role: 'owner' })),
      ...collaboratedWorkspaces.map(w => ({ ...w, role: w.collaborators.find(c => c.userId === userId)?.role || 'viewer' })),
    ];

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

router.get('/:id/collaborators', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const isOwner = workspace.ownerId === userId;
    const collaborator = await prisma.collaborator.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId } },
    });

    if (!isOwner && !collaborator) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const collaborators = await prisma.collaborator.findMany({
      where: { workspaceId: id },
      include: { user: { select: { id: true, username: true, email: true } } },
    });

    const ownerUser = await prisma.user.findUnique({ 
      where: { id: workspace.ownerId }, 
      select: { id: true, username: true, email: true } 
    });

    if (!ownerUser) {
      return res.status(500).json({ error: 'Owner not found' });
    }

    const result = [
      { id: 'owner', userId: workspace.ownerId, role: 'owner', user: ownerUser },
      ...collaborators,
    ];

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/collaborators', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, role } = req.body;
    const userId = (req as any).userId;

    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }

    const validRoles = ['editor', 'viewer'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Valid role required (editor or viewer)' });
    }

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (workspace.ownerId !== userId) {
      return res.status(403).json({ error: 'Only owner can add collaborators' });
    }

    const targetUser = await prisma.user.findUnique({ where: { username } });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.id === userId) {
      return res.status(400).json({ error: 'Cannot add yourself as collaborator' });
    }

    const existing = await prisma.collaborator.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId: targetUser.id } },
    });

    if (existing) {
      return res.status(400).json({ error: 'User is already a collaborator' });
    }

    const collaborator = await prisma.collaborator.create({
      data: { workspaceId: id, userId: targetUser.id, role },
      include: { user: { select: { id: true, username: true, email: true } } },
    });

    res.json(collaborator);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/collaborators/:collaboratorId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id, collaboratorId } = req.params;
    const { role } = req.body;
    const userId = (req as any).userId;

    const validRoles = ['editor', 'viewer'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Valid role required (editor or viewer)' });
    }

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (workspace.ownerId !== userId) {
      return res.status(403).json({ error: 'Only owner can modify collaborators' });
    }

    const collaborator = await prisma.collaborator.update({
      where: { id: collaboratorId },
      data: { role },
      include: { user: { select: { id: true, username: true, email: true } } },
    });

    res.json(collaborator);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id/collaborators/:collaboratorId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id, collaboratorId } = req.params;
    const userId = (req as any).userId;

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (workspace.ownerId !== userId) {
      return res.status(403).json({ error: 'Only owner can remove collaborators' });
    }

    await prisma.collaborator.delete({ where: { id: collaboratorId } });
    res.json({ message: 'Collaborator removed' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: { 
        mindmaps: true, 
        collaborators: { include: { user: { select: { id: true, username: true, email: true } } } },
        owner: { select: { id: true, username: true } },
      },
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const isOwner = workspace.ownerId === userId;
    const collaborator = workspace.collaborators.find(c => c.userId === userId);
    if (!isOwner && !collaborator) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const role = isOwner ? 'owner' : collaborator?.role || 'viewer';
    res.json({ ...workspace, role });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = (req as any).userId;

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (workspace.ownerId !== userId) {
      return res.status(403).json({ error: 'Only owner can rename workspace' });
    }

    const updated = await prisma.workspace.update({
      where: { id },
      data: { name },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (workspace.ownerId !== userId) {
      return res.status(403).json({ error: 'Only owner can delete workspace' });
    }

    await prisma.workspace.delete({ where: { id } });
    res.json({ message: 'Workspace deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;