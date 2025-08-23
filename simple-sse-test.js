#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';

const app = express();
const PORT = 5679;

const server = new Server({
  name: 'simple-test',
  version: '1.0.0'
}, {
  capabilities: { tools: {} }
});

app.get('/sse', async (req, res) => {
  console.log('SSE connection attempt');
  
  const transport = new SSEServerTransport('/sse', res);
  await server.connect(transport);
  
  console.log('SSE connected successfully');
});

app.listen(PORT, () => {
  console.log(`Simple SSE test server on port ${PORT}`);
});