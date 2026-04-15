import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import transcriptRoutes from './routes/transcripts.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.use('/api', transcriptRoutes);

// Error handler (must be last)
app.use(errorHandler);

// HTTP server + WebSocket upgrade
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

// Store active WS clients
export const wsClients = new Map();

wss.on('connection', (ws, req) => {
  const clientId = req.headers['x-client-id'] || crypto.randomUUID();
  wsClients.set(clientId, ws);
  ws.send(JSON.stringify({ type: 'connected', clientId }));

  ws.on('close', () => wsClients.delete(clientId));
  ws.on('error', (err) => console.error('WS error:', err));
});

export function broadcastProgress(clientId, payload) {
  const client = wsClients.get(clientId);
  if (client?.readyState === 1) {
    client.send(JSON.stringify(payload));
  }
}

httpServer.listen(PORT, () => {
  console.log(`🎙️  Transcription API listening on :${PORT}`);
});
