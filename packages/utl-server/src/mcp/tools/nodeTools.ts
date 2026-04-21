import { Tool } from '@modelcontextprotocol/sdk/types.js';
import prisma from '../../db/client';

export const nodeTools: Tool[] = [
  {
    name: 'node_create',
    description: '创建新节点',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['scenario', 'function', 'test_point', 'action_factor', 'data_factor', 'test_case', 'precondition', 'test_step', 'expected_result'],
          description: '节点类型',
        },
        name: { type: 'string', description: '节点名称' },
        mindmapId: { type: 'string', description: '脑图ID' },
        description: { type: 'string', description: '节点描述' },
        parentId: { type: 'string', description: '父节点ID' },
        position: {
          type: 'object',
          properties: { x: { type: 'number' }, y: { type: 'number' } },
          description: '节点位置',
        },
        metadata: { type: 'object', description: '节点元数据' },
      },
      required: ['type', 'name', 'mindmapId'],
    },
  },
  {
    name: 'node_update',
    description: '更新节点',
    inputSchema: {
      type: 'object',
      properties: {
        nodeId: { type: 'string', description: '节点ID' },
        name: { type: 'string', description: '节点名称' },
        description: { type: 'string', description: '节点描述' },
        position: {
          type: 'object',
          properties: { x: { type: 'number' }, y: { type: 'number' } },
          description: '节点位置',
        },
        metadata: { type: 'object', description: '节点元数据' },
      },
      required: ['nodeId'],
    },
  },
  {
    name: 'node_delete',
    description: '删除节点',
    inputSchema: {
      type: 'object',
      properties: {
        nodeId: { type: 'string', description: '节点ID' },
      },
      required: ['nodeId'],
    },
  },
  {
    name: 'node_query',
    description: '查询节点',
    inputSchema: {
      type: 'object',
      properties: {
        mindmapId: { type: 'string', description: '脑图ID' },
        nodeId: { type: 'string', description: '节点ID（可选）' },
        type: { type: 'string', description: '节点类型（可选）' },
      },
      required: ['mindmapId'],
    },
  },
];

export async function handleNodeTool(name: string, args: Record<string, unknown>, client: typeof prisma) {
  switch (name) {
    case 'node_create': {
      const node = await client.node.create({
        data: {
          type: args.type as string,
          name: args.name as string,
          description: args.description as string | undefined,
          mindmapId: args.mindmapId as string,
          parentId: args.parentId as string | undefined,
          workspaceId: '',
          position: (args.position as { x: number; y: number }) || { x: 0, y: 0 },
          metadata: (args.metadata as Record<string, unknown>) || {},
          versionId: 'v1',
          branchId: 'main',
        },
      });
      return { content: [{ type: 'text', text: JSON.stringify(node) }] };
    }

    case 'node_update': {
      const node = await client.node.update({
        where: { id: args.nodeId as string },
        data: {
          name: args.name as string | undefined,
          description: args.description as string | undefined,
          position: args.position as { x: number; y: number } | undefined,
          metadata: args.metadata as Record<string, unknown> | undefined,
        },
      });
      return { content: [{ type: 'text', text: JSON.stringify(node) }] };
    }

    case 'node_delete': {
      await client.node.delete({ where: { id: args.nodeId as string } });
      return { content: [{ type: 'text', text: `Node ${args.nodeId} deleted` }] };
    }

    case 'node_query': {
      if (args.nodeId) {
        const node = await client.node.findUnique({
          where: { id: args.nodeId as string },
          include: { parent: true, children: true },
        });
        return { content: [{ type: 'text', text: JSON.stringify(node) }] };
      }

      const nodes = await client.node.findMany({
        where: {
          mindmapId: args.mindmapId as string,
          type: args.type as string | undefined,
        },
      });
      return { content: [{ type: 'text', text: JSON.stringify(nodes) }] };
    }

    default:
      throw new Error(`Unknown node tool: ${name}`);
  }
}