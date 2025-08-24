#!/usr/bin/env node

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
  InitializedNotificationSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { HamoniKRClient } from './hamonikr-client';
import { Config } from './types';

// Load configuration
const configPath = path.join(__dirname, '..', 'config', 'default.json');
const config: Config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Override credentials from environment variables if available
if (process.env.HAMONIKR_USERNAME && process.env.HAMONIKR_PASSWORD) {
  config.hamonikr.credentials.username = process.env.HAMONIKR_USERNAME;
  config.hamonikr.credentials.password = process.env.HAMONIKR_PASSWORD;
}

// Create HamoniKR client
const hamoniKRClient = new HamoniKRClient(config);

// Define Zod schemas for tool parameters
const LoginSchema = z.object({});

const CreatePostSchema = z.object({
  title: z.string().describe('게시글 제목'),
  content: z.string().describe('게시글 내용'),
  board: z.enum(['notice', 'qna', 'project']).describe('게시판 타입 (notice: 공지사항, qna: 묻고답하기, project: 프로젝트)'),
});

const AddCommentSchema = z.object({
  postUrl: z.string().url().describe('댓글을 달 게시글의 URL'),
  content: z.string().describe('댓글 내용'),
});

const EditPostSchema = z.object({
  postUrl: z.string().url().describe('수정할 게시글의 URL'),
  title: z.string().optional().describe('새로운 제목 (선택사항)'),
  content: z.string().optional().describe('새로운 내용 (선택사항)'),
});

const DeletePostSchema = z.object({
  postUrl: z.string().url().describe('삭제할 게시글의 URL'),
});

const GetPostSchema = z.object({
  postUrl: z.string().url().describe('조회할 게시글의 URL'),
});

const CheckStatusSchema = z.object({});

// Define tools
const TOOLS: Tool[] = [
  {
    name: 'hamonikr_login',
    description: '하모니카 커뮤니티에 로그인합니다. 자동으로 저장된 자격 증명을 사용합니다.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'hamonikr_create_post',
    description: '하모니카 커뮤니티에 새 게시글을 작성합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: '게시글 제목',
        },
        content: {
          type: 'string',
          description: '게시글 내용',
        },
        board: {
          type: 'string',
          enum: ['notice', 'qna', 'project'],
          description: '게시판 타입 (notice: 공지사항, qna: 묻고답하기, project: 프로젝트)',
        },
      },
      required: ['title', 'content', 'board'],
    },
  },
  {
    name: 'hamonikr_add_comment',
    description: '특정 게시글에 댓글을 추가합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        postUrl: {
          type: 'string',
          format: 'uri',
          description: '댓글을 달 게시글의 URL',
        },
        content: {
          type: 'string',
          description: '댓글 내용',
        },
      },
      required: ['postUrl', 'content'],
    },
  },
  {
    name: 'hamonikr_edit_post',
    description: '기존 게시글을 수정합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        postUrl: {
          type: 'string',
          format: 'uri',
          description: '수정할 게시글의 URL',
        },
        title: {
          type: 'string',
          description: '새로운 제목 (선택사항)',
        },
        content: {
          type: 'string',
          description: '새로운 내용 (선택사항)',
        },
      },
      required: ['postUrl'],
    },
  },
  {
    name: 'hamonikr_delete_post',
    description: '게시글을 삭제합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        postUrl: {
          type: 'string',
          format: 'uri',
          description: '삭제할 게시글의 URL',
        },
      },
      required: ['postUrl'],
    },
  },
  {
    name: 'hamonikr_get_post',
    description: '특정 게시글의 내용을 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        postUrl: {
          type: 'string',
          format: 'uri',
          description: '조회할 게시글의 URL',
        },
      },
      required: ['postUrl'],
    },
  },
  {
    name: 'hamonikr_check_status',
    description: '현재 로그인 상태와 세션 정보를 확인합니다.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'hamonikr-community-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize handler
server.setRequestHandler(InitializeRequestSchema, async (request) => {
  console.log('초기화 요청 수신:', request.params);
  
  return {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {},
      logging: {}
    },
    serverInfo: {
      name: 'hamonikr-community-mcp',
      version: '1.0.0'
    }
  };
});

// Initialized notification handler  
server.setNotificationHandler(InitializedNotificationSchema, async () => {
  console.log('클라이언트 초기화 완료 알림 수신');
});

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.log('도구 목록 요청 수신');
  return {
    tools: TOOLS,
  };
});

// Call tool handler with improved error handling
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  console.log(`도구 호출 요청: ${name}`, args);

  try {
    let result;
    
    switch (name) {
      case 'hamonikr_login': {
        LoginSchema.parse(args);
        result = await hamoniKRClient.login();
        break;
      }

      case 'hamonikr_create_post': {
        const validatedArgs = CreatePostSchema.parse(args);
        result = await hamoniKRClient.createPost(validatedArgs);
        break;
      }

      case 'hamonikr_add_comment': {
        const validatedArgs = AddCommentSchema.parse(args);
        result = await hamoniKRClient.addComment(validatedArgs);
        break;
      }

      case 'hamonikr_edit_post': {
        const validatedArgs = EditPostSchema.parse(args);
        result = await hamoniKRClient.editPost(validatedArgs);
        break;
      }

      case 'hamonikr_delete_post': {
        const validatedArgs = DeletePostSchema.parse(args);
        result = await hamoniKRClient.deletePost(validatedArgs.postUrl);
        break;
      }

      case 'hamonikr_get_post': {
        const validatedArgs = GetPostSchema.parse(args);
        result = await hamoniKRClient.getPost(validatedArgs.postUrl);
        break;
      }

      case 'hamonikr_check_status': {
        CheckStatusSchema.parse(args);
        const session = hamoniKRClient.getSession();
        result = {
          success: true,
          session,
          message: '세션 상태 조회 완료',
        };
        break;
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
    
  } catch (error) {
    console.error(`도구 호출 오류 (${name}):`, error);
    
    if (error instanceof z.ZodError) {
      throw new Error(`잘못된 인수: ${error.message}`);
    }
    throw error;
  }
});

// Session cleanup function
function cleanupDeadSessions() {
  const now = new Date();
  const timeout = 5 * 60 * 1000; // 5 minutes
  
  for (const [sessionId, session] of sessions.entries()) {
    if (!session.connected || (now.getTime() - session.lastPing.getTime()) > timeout) {
      console.log(`세션 정리: ${sessionId}`);
      try {
        session.transport.close();
      } catch (error) {
        console.error(`세션 정리 오류 (${sessionId}):`, error);
      }
      sessions.delete(sessionId);
    }
  }
}

// Cleanup dead sessions every 2 minutes
setInterval(cleanupDeadSessions, 2 * 60 * 1000);

// Handle cleanup
process.on('SIGINT', async () => {
  console.log('서버 종료 중...');
  
  // Close all sessions
  for (const [sessionId, session] of sessions.entries()) {
    try {
      session.transport.close();
    } catch (error) {
      console.error(`세션 종료 오류 (${sessionId}):`, error);
    }
  }
  sessions.clear();
  
  await hamoniKRClient.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('서버 종료 중...');
  
  // Close all sessions
  for (const [sessionId, session] of sessions.entries()) {
    try {
      session.transport.close();
    } catch (error) {
      console.error(`세션 종료 오류 (${sessionId}):`, error);
    }
  }
  sessions.clear();
  
  await hamoniKRClient.close();
  process.exit(0);
});

// Create Express app for SSE
const app = express();
const PORT = parseInt(process.env.PORT || '5678');

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200,
  exposedHeaders: ['*'],
  allowedHeaders: ['*']
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    activeSessions: sessions.size,
    uptime: process.uptime()
  });
});

// Session management endpoint
app.get('/sessions', (req, res) => {
  const sessionInfo = Array.from(sessions.entries()).map(([id, session]) => ({
    id,
    connected: session.connected,
    lastPing: session.lastPing,
    uptime: Date.now() - new Date(session.lastPing).getTime()
  }));
  
  res.json({
    totalSessions: sessions.size,
    sessions: sessionInfo
  });
});

// MCP JSON-RPC endpoint for bidirectional communication
app.post('/mcp', async (req, res) => {
  console.log('MCP 요청 수신:', JSON.stringify(req.body, null, 2));
  
  try {
    const { jsonrpc, id, method, params } = req.body;
    
    if (!jsonrpc || jsonrpc !== '2.0') {
      return res.status(400).json({
        jsonrpc: '2.0',
        id: id || null,
        error: { code: -32600, message: 'Invalid Request' }
      });
    }
    
    let result;
    
    switch (method) {
      case 'initialize':
        console.log('JSON-RPC 초기화 요청 수신:', params);
        result = {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            logging: {}
          },
          serverInfo: {
            name: 'hamonikr-community-mcp',
            version: '1.0.0'
          }
        };
        break;
        
      case 'tools/list':
        result = { tools: TOOLS };
        break;
        
      case 'tools/call':
        const { name, arguments: args } = params;
        
        switch (name) {
          case 'hamonikr_login': {
            const loginResult = await hamoniKRClient.login();
            result = {
              content: [{
                type: 'text',
                text: JSON.stringify(loginResult, null, 2)
              }]
            };
            break;
          }
          
          case 'hamonikr_create_post': {
            const createResult = await hamoniKRClient.createPost(args);
            result = {
              content: [{
                type: 'text', 
                text: JSON.stringify(createResult, null, 2)
              }]
            };
            break;
          }
          
          case 'hamonikr_add_comment': {
            const commentResult = await hamoniKRClient.addComment(args);
            result = {
              content: [{
                type: 'text',
                text: JSON.stringify(commentResult, null, 2)
              }]
            };
            break;
          }
          
          case 'hamonikr_edit_post': {
            const editResult = await hamoniKRClient.editPost(args);
            result = {
              content: [{
                type: 'text',
                text: JSON.stringify(editResult, null, 2)
              }]
            };
            break;
          }
          
          case 'hamonikr_delete_post': {
            const deleteResult = await hamoniKRClient.deletePost(args.postUrl);
            result = {
              content: [{
                type: 'text',
                text: JSON.stringify(deleteResult, null, 2)
              }]
            };
            break;
          }
          
          case 'hamonikr_get_post': {
            const getResult = await hamoniKRClient.getPost(args.postUrl);
            result = {
              content: [{
                type: 'text',
                text: JSON.stringify(getResult, null, 2)
              }]
            };
            break;
          }
          
          case 'hamonikr_check_status': {
            const session = hamoniKRClient.getSession();
            result = {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  session,
                  message: '세션 상태 조회 완료'
                }, null, 2)
              }]
            };
            break;
          }
          
          default:
            return res.status(400).json({
              jsonrpc: '2.0',
              id,
              error: { code: -32601, message: `Unknown tool: ${name}` }
            });
        }
        break;
        
      default:
        return res.status(400).json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` }
        });
    }
    
    res.json({
      jsonrpc: '2.0',
      id,
      result
    });
    
  } catch (error) {
    console.error('MCP 처리 오류:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body.id || null,
      error: { 
        code: -32603, 
        message: 'Internal error',
        data: error instanceof Error ? error.message : String(error)
      }
    });
  }
});

// Session management
interface Session {
  id: string;
  transport: any;
  connected: boolean;
  lastPing: Date;
}

const sessions = new Map<string, Session>();

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// SSE endpoint
app.get('/sse', async (req, res) => {
  const sessionId = generateSessionId();
  console.log(`새로운 SSE 연결 설정: ${sessionId}`);
  
  try {
    // Create SSE transport (it will handle headers automatically)
    const transport = new SSEServerTransport('/sse', res);
    
    // Create session
    const session: Session = {
      id: sessionId,
      transport,
      connected: true,
      lastPing: new Date()
    };
    sessions.set(sessionId, session);
    
    // Connect server to transport
    await server.connect(transport);
    
    // Keep connection alive with periodic pings
    const pingInterval = setInterval(() => {
      try {
        if (session.connected) {
          res.write(`:ping

`);
          session.lastPing = new Date();
        } else {
          clearInterval(pingInterval);
        }
      } catch (e) {
        console.log(`Ping 실패, 세션 종료: ${sessionId}`);
        session.connected = false;
        clearInterval(pingInterval);
      }
    }, 30000);
    
    // Handle client disconnect
    req.on('close', () => {
      console.log(`SSE 연결 종료: ${sessionId}`);
      session.connected = false;
      sessions.delete(sessionId);
      clearInterval(pingInterval);
      transport.close();
    });

    req.on('error', (error) => {
      console.error(`SSE 연결 오류 (${sessionId}):`, error);
      session.connected = false;
      sessions.delete(sessionId);
      clearInterval(pingInterval);
      transport.close();
    });
    
  } catch (error) {
    console.error(`SSE 연결 설정 실패 (${sessionId}):`, error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'SSE connection failed' });
    }
  }
});

// Start server
async function main() {
  app.listen(PORT, () => {
    console.log(`HamoniKR Community MCP SSE 서버가 포트 ${PORT}에서 시작되었습니다.`);
    console.log(`SSE 엔드포인트: http://localhost:${PORT}/sse`);
    console.log(`헬스 체크: http://localhost:${PORT}/health`);
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error('SSE 서버 시작 오류:', error);
    process.exit(1);
  });
}