#!/usr/bin/env node

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
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
  board: z.enum(['notice', 'qna']).describe('게시판 타입 (notice: 공지사항, qna: 묻고답하기)'),
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
          enum: ['notice', 'qna'],
          description: '게시판 타입 (notice: 공지사항, qna: 묻고답하기)',
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

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'hamonikr_login': {
        LoginSchema.parse(args);
        const result = await hamoniKRClient.login();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'hamonikr_create_post': {
        const validatedArgs = CreatePostSchema.parse(args);
        const result = await hamoniKRClient.createPost(validatedArgs);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'hamonikr_add_comment': {
        const validatedArgs = AddCommentSchema.parse(args);
        const result = await hamoniKRClient.addComment(validatedArgs);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'hamonikr_edit_post': {
        const validatedArgs = EditPostSchema.parse(args);
        const result = await hamoniKRClient.editPost(validatedArgs);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'hamonikr_delete_post': {
        const validatedArgs = DeletePostSchema.parse(args);
        const result = await hamoniKRClient.deletePost(validatedArgs.postUrl);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'hamonikr_get_post': {
        const validatedArgs = GetPostSchema.parse(args);
        const result = await hamoniKRClient.getPost(validatedArgs.postUrl);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'hamonikr_check_status': {
        CheckStatusSchema.parse(args);
        const session = hamoniKRClient.getSession();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                session,
                message: '세션 상태 조회 완료',
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`잘못된 인수: ${error.message}`);
    }
    throw error;
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
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('HamoniKR Community MCP Server가 시작되었습니다.');
}

if (require.main === module) {
  main().catch((error) => {
    console.error('서버 시작 오류:', error);
    process.exit(1);
  });
}