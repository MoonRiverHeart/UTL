import { Tool } from '@modelcontextprotocol/sdk/types.js';
import prisma from '../../db/client';

export const mindmapTools: Tool[] = [
  {
    name: 'mindmap_load',
    description: '加载脑图',
    inputSchema: {
      type: 'object',
      properties: {
        mindmapId: { type: 'string', description: '脑图ID' },
      },
      required: ['mindmapId'],
    },
  },
  {
    name: 'mindmap_save',
    description: '保存脑图',
    inputSchema: {
      type: 'object',
      properties: {
        mindmapId: { type: 'string', description: '脑图ID' },
        utlSource: { type: 'string', description: 'UTL源码' },
      },
      required: ['mindmapId', 'utlSource'],
    },
  },
];

export async function handleMindmapTool(name: string, args: Record<string, unknown>, client: typeof prisma) {
  switch (name) {
    case 'mindmap_load': {
      const mindmap = await client.mindmap.findUnique({
        where: { id: args.mindmapId as string },
        include: {
          nodes: {
            include: {
              relationsAsSource: true,
              relationsAsTarget: true,
            },
          },
          relations: true,
        },
      });
      return { content: [{ type: 'text', text: JSON.stringify(mindmap) }] };
    }

    case 'mindmap_save': {
      const mindmap = await client.mindmap.update({
        where: { id: args.mindmapId as string },
        data: { utlSource: args.utlSource as string },
      });
      return { content: [{ type: 'text', text: JSON.stringify(mindmap) }] };
    }

    default:
      throw new Error(`Unknown mindmap tool: ${name}`);
  }
}