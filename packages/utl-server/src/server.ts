import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import authRoutes from './api/routes/auth';
import workspaceRoutes from './api/routes/workspace';
import mindmapRoutes from './api/routes/mindmap';
import nodeRoutes from './api/routes/node';
import relationRoutes from './api/routes/relation';
import branchRoutes from './api/routes/branch';
import versionRoutes from './api/routes/version';
import testResultRoutes from './api/routes/testResult';
import importExportRoutes from './api/routes/importExport';
import { errorHandler } from './api/middleware/errorHandler';
import { initWebSocket } from './websocket/server';

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/mindmaps', mindmapRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/relations', relationRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api/results', testResultRoutes);
app.use('/api/import', importExportRoutes);

app.use(errorHandler);

initWebSocket(io);

httpServer.listen(PORT, () => {
  console.log(`UTL Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export { app, httpServer, io };