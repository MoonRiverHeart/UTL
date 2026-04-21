import { Tool } from '@modelcontextprotocol/sdk/types.js';
import prisma from '../../db/client';

export const relationTools: Tool[] = [
  {
    name: 'relation_create',
    description: '创建关系',
    inputSchema: {
      type: 'object',
      properties: {
        mindmapId: { type: 'string', description: '脑图ID' },
        sourceId: { type: 'string', description: '源节点ID' },
        targetId: { type: 'string', description: '目标节点ID' },
        type: {
          type: 'string',
          enum: ['contains', 'extends', 'references', 'depends_on', 'generates'],
          description: '关系类型',
        },
        metadata: { type: 'object', description: '关系元数据' },
      },
      required: ['mindmapId', 'sourceId', 'targetId', 'type'],
    },
  },
  {
    name: 'relation_delete',
    description: '删除关系',
    inputSchema: {
      type: 'object',
      properties: {
        relationId: { type: 'string', description: '关系ID' },
      },
      required: ['relationId'],
    },
  },
];

export async function handleRelationTool(name: string, args: Record<string, unknown>, client: typeof prisma) {
  switch (name) {
    case 'relation_create': {
      const relation = await client.relation.create({
        data: {
          mindmapId: args.mindmapId as string,
          sourceId: args.sourceId as string,
          targetId: args.targetId as string,
          type: args.type as string,
          metadata: args.metadata as Record<string, unknown> | undefined,
        },
      });
      return { content: [{ type: 'text', text: JSON.stringify(relation) }] };
    }

    case 'relation_delete': {
      await client.relation.delete({ where: { id: args.relationId as string } });
      return { content: [{ type: 'text', text: `Relation ${args.relationId} deleted` }] };
    }

    default:
      throw new Error(`Unknown relation tool: ${name}`);
  }
}