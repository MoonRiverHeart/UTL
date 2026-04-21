import { Router, Request, Response } from 'express';
import prisma from '../../db/client';
import { authMiddleware } from '../middleware/auth';
import { UTLTokenizer } from '@utl/language';
import { UTLParser } from '@utl/language';
import { UTLGenerator } from '@utl/language';
import { SemanticAnalyzer } from '@utl/language';
import { MindmapSyncEngine, MindmapNode, MindmapRelation } from '@utl/language';

const router = Router();

const syncEngine = new MindmapSyncEngine();

router.post('/mindmap/:mindmapId/import', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { mindmapId } = req.params;
    const userId = (req as any).userId;
    const { utlSource, workspaceId } = req.body;

    if (!utlSource) {
      return res.status(400).json({ error: 'UTL source required' });
    }

    const mindmap = await prisma.mindmap.findUnique({ where: { id: mindmapId } });
    if (!mindmap) {
      return res.status(404).json({ error: 'Mindmap not found' });
    }

    const analyzer = new SemanticAnalyzer();
    const errors = analyzer.analyze(utlSource, 'import');
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'UTL syntax errors', 
        details: errors.map(e => `Line ${e.line}: ${e.message}`)
      });
    }

    const mindmapData = syncEngine.parseToMindmap(utlSource);
    
    const createdNodes = [];
    for (const node of mindmapData.nodes) {
      const created = await prisma.node.create({
        data: {
          id: node.id.startsWith('node-') ? undefined : node.id,
          type: node.type,
          name: node.name,
          description: node.description || '',
          mindmapId,
          workspaceId: workspaceId || mindmap.workspaceId,
          x: node.position.x,
          y: node.position.y,
          metadata: node.metadata || {},
          versionId: 'v1',
          branchId: 'main',
        },
      });
      createdNodes.push(created);
    }

    const createdRelations = [];
    for (const rel of mindmapData.relations) {
      const source = createdNodes.find(n => n.name === mindmapData.nodes.find(nd => nd.id === rel.sourceId)?.name);
      const target = createdNodes.find(n => n.name === mindmapData.nodes.find(nd => nd.id === rel.targetId)?.name);
      
      if (source && target) {
        const created = await prisma.relation.create({
          data: {
            mindmapId,
            sourceId: source.id,
            targetId: target.id,
            type: rel.type,
          },
        });
        createdRelations.push(created);
      }
    }

    await prisma.mindmap.update({
      where: { id: mindmapId },
      data: { utlSource },
    });

    res.json({
      imported: true,
      nodes: createdNodes.length,
      relations: createdRelations.length,
      createdNodes,
      createdRelations,
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ error: 'Import failed', details: err.message });
  }
});

router.get('/mindmap/:mindmapId/export', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { mindmapId } = req.params;
    const { format } = req.query;

    const mindmap = await prisma.mindmap.findUnique({
      where: { id: mindmapId },
      include: {
        nodes: true,
        relations: true,
      },
    });

    if (!mindmap) {
      return res.status(404).json({ error: 'Mindmap not found' });
    }

    const mindmapData: { nodes: MindmapNode[]; relations: MindmapRelation[] } = {
      nodes: mindmap.nodes.map(n => ({
        id: n.id,
        type: n.type,
        name: n.name,
        description: n.description,
        position: { x: n.x, y: n.y },
        metadata: n.metadata as Record<string, unknown>,
        parentId: mindmap.relations.find(r => r.sourceId === n.id && r.type === 'contains')?.targetId,
      })),
      relations: mindmap.relations.map(r => ({
        id: r.id,
        sourceId: r.sourceId,
        targetId: r.targetId,
        type: r.type,
      })),
    };

    const utlSource = syncEngine.generateUTL(mindmapData);

    if (format === 'file') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${mindmap.name}.utl"`);
      res.send(utlSource);
    } else {
      res.json({ utlSource, name: mindmap.name });
    }
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
});

router.post('/parse', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { utlSource } = req.body;

    if (!utlSource) {
      return res.status(400).json({ error: 'UTL source required' });
    }

    const tokenizer = new UTLTokenizer(utlSource);
    const tokens = tokenizer.tokenize();
    
    const parser = new UTLParser(tokens);
    const ast = parser.parse();

    const analyzer = new SemanticAnalyzer();
    const errors = analyzer.analyze(utlSource, 'parse');

    const mindmapData = syncEngine.parseToMindmap(utlSource);

    res.json({
      tokens: tokens.length,
      definitions: ast.definitions.length,
      nodes: mindmapData.nodes.length,
      relations: mindmapData.relations.length,
      errors: errors.length > 0 ? errors.map(e => `Line ${e.line}: ${e.message}`) : [],
      symbols: analyzer.getAllSymbols().map(s => ({ name: s.name, type: s.type })),
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ error: 'Parse error', details: err.message });
  }
});

router.post('/validate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { utlSource } = req.body;

    if (!utlSource) {
      return res.status(400).json({ error: 'UTL source required' });
    }

    const analyzer = new SemanticAnalyzer();
    const errors = analyzer.analyze(utlSource, 'validate');

    res.json({
      valid: errors.length === 0,
      errors: errors.map(e => ({
        line: e.line,
        column: e.column,
        message: e.message,
      })),
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ error: 'Validation error', details: err.message });
  }
});

export default router;