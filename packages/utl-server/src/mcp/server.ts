import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import prisma from '../db/client';
import { nodeTools, handleNodeTool } from './tools/nodeTools';
import { relationTools, handleRelationTool } from './tools/relationTools';
import { mindmapTools, handleMindmapTool } from './tools/mindmapTools';

export function createMCPServer() {
  const server = new Server(
    { name: 'utl-mcp-server', version: '0.1.0' },
    { capabilities: { tools: {}, resources: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [...nodeTools, ...relationTools, ...mindmapTools],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name.startsWith('node_')) {
      return handleNodeTool(name, args, prisma);
    }

    if (name.startsWith('relation_')) {
      return handleRelationTool(name, args, prisma);
    }

    if (name.startsWith('mindmap_')) {
      return handleMindmapTool(name, args, prisma);
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'mindmap://list',
          name: 'Mindmaps List',
          description: 'List all available mindmaps',
        },
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    if (uri === 'mindmap://list') {
      const mindmaps = await prisma.mindmap.findMany();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(mindmaps, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown resource: ${uri}`);
  });

  return server;
}