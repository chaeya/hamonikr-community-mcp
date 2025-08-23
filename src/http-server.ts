#!/usr/bin/env node

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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
const TOOLS = [
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

// Create Express app
const app = express();
const PORT = parseInt(process.env.PORT || '5680');

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
    transport: 'http' 
  });
});

// MCP HTTP endpoint - tools/list
app.post('/mcp/tools/list', async (req, res) => {
  console.log('tools/list 요청 수신');
  
  try {
    res.json({
      tools: TOOLS,
    });
  } catch (error) {
    console.error('tools/list 처리 오류:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// MCP HTTP endpoint - tools/call
app.post('/mcp/tools/call', async (req, res) => {
  console.log('tools/call 요청 수신:', JSON.stringify(req.body, null, 2));
  
  try {
    const { name, arguments: args } = req.body;

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
        return res.status(400).json({
          error: 'Unknown tool',
          message: `Tool not found: ${name}`
        });
    }

    res.json({
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    });

  } catch (error) {
    console.error('tools/call 처리 오류:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid arguments',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Handle cleanup
process.on('SIGINT', async () => {
  await hamoniKRClient.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await hamoniKRClient.close();
  process.exit(0);
});

// Start server
async function main() {
  app.listen(PORT, () => {
    console.log(`HamoniKR Community MCP HTTP 서버가 포트 ${PORT}에서 시작되었습니다.`);
    console.log(`Tools/list: http://localhost:${PORT}/mcp/tools/list`);
    console.log(`Tools/call: http://localhost:${PORT}/mcp/tools/call`);
    console.log(`헬스 체크: http://localhost:${PORT}/health`);
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error('HTTP 서버 시작 오류:', error);
    process.exit(1);
  });
}