# HamoniKR Community MCP Server Project Overview

## Purpose
The HamoniKR Community MCP Server is a Model Context Protocol server that allows AI programs to interact with the HamoniKR community platform. It provides automated functionality for:
- User login and session management
- Creating, reading, updating, and deleting forum posts
- Adding comments to posts
- Managing both announcements (notice) and Q&A board content

## Technology Stack
- **Language**: TypeScript
- **Runtime**: Node.js (>=18.0.0)
- **Browser Automation**: Playwright (with Chromium)
- **Web Framework**: Express.js (for HTTP/SSE server)
- **Protocol**: Model Context Protocol (MCP) 
- **Database**: PostgreSQL (optional, for extended features)
- **Build Tool**: TypeScript compiler (tsc)
- **Testing**: Jest

## Architecture
The project supports two operational modes:
1. **stdio mode**: Direct local execution (for Claude Code, Cursor, etc.)
2. **SSE/HTTP mode**: Remote server deployment (for web clients)

## Main Components
- `src/index.ts`: MCP server entry point (stdio mode)
- `src/sse-server.ts`: SSE server entry point
- `src/http-server.ts`: HTTP server entry point
- `src/hamonikr-client.ts`: Main HamoniKR community client
- `src/browser-manager.ts`: Browser automation manager
- `src/types.ts`: Type definitions

## Key Features
- Automated login and session management
- Post creation (notice/qna boards)
- Post retrieval with metadata
- Comment addition
- Post editing and deletion
- Status checking