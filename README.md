# HamoniKR Community MCP Server

하모니카 커뮤니티를 위한 MCP (Model Context Protocol) 서버입니다. 이 서버를 통해 다른 AI 프로그램들이 하모니카 커뮤니티의 게시글 관리 기능을 쉽게 사용할 수 있습니다.

## 주요 기능

- **로그인 관리**: 자동 로그인 및 세션 관리
- **게시글 작성**: 공지사항 및 Q&A 게시판에 글 작성
- **게시글 조회**: 특정 게시글의 내용, 작성자, 작성일 등 조회
- **댓글 작성**: 특정 게시글에 댓글 추가
- **게시글 수정**: 기존 게시글 수정
- **게시글 삭제**: 게시글 삭제
- **상태 확인**: 로그인 상태 및 세션 정보 조회

## 설치 및 설정

```bash
git clone https://github.com/chaeya/hamonikr-community-mcp.git
cd hamonikr-community-mcp

# 1. 설치 (Playwright 브라우저 포함 자동 설치)
npm install

# 2. 빌드
npm run build

# 3. 시작 (기본적으로 SSE 서버)
npm start
```

### 사용자 자격증명 설정

**보안을 위해 환경 변수 사용을 권장합니다:**

```bash
export HAMONIKR_USERNAME="your-email@example.com"
export HAMONIKR_PASSWORD="your-password"
```

또는 `.env` 파일을 생성:
```bash
echo "HAMONIKR_USERNAME=your-email@example.com" > .env
echo "HAMONIKR_PASSWORD=your-password" >> .env
chmod 600 .env
```

**⚠️ 중요**: `config/default.json`에 직접 자격증명을 입력하는 것은 보안상 권장하지 않습니다.

자세한 설정 방법은 [`docs/credentials-setup.md`](./docs/credentials-setup.md)를 참고하세요.

## 사용 방법

### MCP 클라이언트 설정

이 서버는 두 가지 방식으로 사용할 수 있습니다:
- **stdio 방식**: 로컬에서 직접 실행 (Claude Code, Cursor 등)
- **SSE 방식**: 원격 서버로 실행 (웹 클라이언트 등)

#### 1. stdio 방식 (로컬 사용)

**Claude Code에서 설정:**

1. Claude Code 설정 파일 열기:
   ```bash
   # macOS
   ~/.claude/claude_code_config.json
   
   # Windows
   %USERPROFILE%\.claude\claude_code_config.json
   
   # Linux
   ~/.claude/claude_code_config.json
   ```

2. 다음 설정 추가:
   ```json
   {
     "mcpServers": {
       "hamonikr-community": {
         "command": "node",
         "args": ["/full/path/to/hamonikr-community-mcp/dist/index.js"],
         "env": {
           "HAMONIKR_USERNAME": "your-email@example.com",
           "HAMONIKR_PASSWORD": "your-password"
         }
       }
     }
   }
   ```

**Cursor에서 설정:**

1. Cursor 설정 파일 위치:
   ```bash
   # macOS
   ~/Library/Application Support/Cursor/User/mcp_servers.json
   
   # Windows
   %APPDATA%\Cursor\User\mcp_servers.json
   
   # Linux
   ~/.config/Cursor/User/mcp_servers.json
   ```

2. 설정 내용:
   ```json
   {
     "mcpServers": {
       "hamonikr-community": {
         "command": "node",
         "args": ["/full/path/to/hamonikr-community-mcp/dist/index.js"],
         "env": {
           "HAMONIKR_USERNAME": "your-email@example.com",
           "HAMONIKR_PASSWORD": "your-password"
         }
       }
     }
   }
   ```

**Continue 등 기타 MCP 지원 도구:**

대부분의 MCP 클라이언트는 비슷한 형식을 사용합니다:
```json
{
  "mcpServers": {
    "hamonikr-community": {
      "command": "node",
      "args": ["/absolute/path/to/hamonikr-community-mcp/dist/index.js"],
      "env": {
        "HAMONIKR_USERNAME": "your-email@example.com",
        "HAMONIKR_PASSWORD": "your-password"
      }
    }
  }
}
```

**주의사항:**
- 절대 경로 사용 필수 (예: `/home/username/hamonikr-community-mcp/dist/index.js`)
- 먼저 `npm install && npm run build` 실행 필요
- 환경 변수로 자격증명 설정 (보안상 권장)

#### 2. SSE 방식 (원격 사용)

**서버 시작:**
```bash
# 기본 시작 (SSE 모드)
npm start

# 개발 모드
npm run dev

# stdio 모드로 시작하려면
npm run start:stdio
```

**클라이언트 연결:**
- SSE 엔드포인트: `http://localhost:5678/sse`
- Health Check: `http://localhost:5678/health`

**환경 변수 설정:**
```bash
export PORT=5678
export CORS_ORIGIN="*"  # 또는 특정 도메인
export HAMONIKR_USERNAME="your-email@example.com"
export HAMONIKR_PASSWORD="your-password"
```

**웹 클라이언트 테스트:**
브라우저에서 `test-sse-client.html`을 열어서 SSE 연결을 테스트할 수 있습니다.

**기타 MCP 클라이언트에서 SSE 사용:**
```javascript
// JavaScript 예제
const eventSource = new EventSource('http://localhost:5678/sse');
eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('MCP Response:', data);
};
```

## 사용 가능한 도구 (Tools)

### 1. hamonikr_login
하모니카 커뮤니티에 로그인합니다.

**매개변수**: 없음

**예제**:
```json
{
  "name": "hamonikr_login",
  "arguments": {}
}
```

### 2. hamonikr_create_post
새 게시글을 작성합니다.

**매개변수**:
- `title`: 게시글 제목 (문자열, 필수)
- `content`: 게시글 내용 (문자열, 필수)  
- `board`: 게시판 타입 (문자열, 필수) - `notice` 또는 `qna`

**예제**:
```json
{
  "name": "hamonikr_create_post",
  "arguments": {
    "title": "하모니카 사용 팁",
    "content": "유용한 하모니카 사용 팁을 공유합니다.",
    "board": "qna"
  }
}
```

### 3. hamonikr_add_comment
특정 게시글에 댓글을 추가합니다.

**매개변수**:
- `postUrl`: 댓글을 달 게시글의 URL (문자열, 필수)
- `content`: 댓글 내용 (문자열, 필수)

**예제**:
```json
{
  "name": "hamonikr_add_comment",
  "arguments": {
    "postUrl": "https://hamonikr.org/hamoni_board/144520",
    "content": "유용한 정보 감사합니다!"
  }
}
```

### 4. hamonikr_edit_post
기존 게시글을 수정합니다.

**매개변수**:
- `postUrl`: 수정할 게시글의 URL (문자열, 필수)
- `title`: 새로운 제목 (문자열, 선택사항)
- `content`: 새로운 내용 (문자열, 선택사항)

**예제**:
```json
{
  "name": "hamonikr_edit_post",
  "arguments": {
    "postUrl": "https://hamonikr.org/hamoni_board/144520",
    "title": "수정된 제목",
    "content": "수정된 내용입니다."
  }
}
```

### 5. hamonikr_get_post
특정 게시글의 내용을 조회합니다.

**매개변수**:
- `postUrl`: 조회할 게시글의 URL (문자열, 필수)

**예제**:
```json
{
  "name": "hamonikr_get_post",
  "arguments": {
    "postUrl": "https://hamonikr.org/hamoni_board/144520"
  }
}
```

**응답 예시**:
```json
{
  "success": true,
  "message": "게시글 내용을 성공적으로 조회했습니다.",
  "post": {
    "title": "윈도우의 음성입력 기능 처름 하모니카에서도 음성입력이 가능할까요?",
    "content": "윈도에서는 컨트롤 + H 를 누르면 이렇게 음성 입력 창이 나타나고 음성 입력이 가능하게 됩니다. 하모니카에서도 음성입력이 가능할까요?",
    "author": "옥포정",
    "date": "2025.06.25 22:39",
    "views": 259,
    "comments": 3,
    "url": "https://hamonikr.org/hamoni_board/144520"
  }
}
```

### 6. hamonikr_delete_post
게시글을 삭제합니다.

**매개변수**:
- `postUrl`: 삭제할 게시글의 URL (문자열, 필수)

**예제**:
```json
{
  "name": "hamonikr_delete_post",
  "arguments": {
    "postUrl": "https://hamonikr.org/hamoni_board/144520"
  }
}
```

### 7. hamonikr_check_status
현재 로그인 상태와 세션 정보를 확인합니다.

**매개변수**: 없음

**예제**:
```json
{
  "name": "hamonikr_check_status",
  "arguments": {}
}
```

## API 응답 형식

모든 도구는 다음과 같은 형식의 응답을 반환합니다:

### 성공 응답
```json
{
  "success": true,
  "message": "작업이 성공적으로 완료되었습니다.",
  "postUrl": "https://hamonikr.org/hamoni_board/144520",
  "postId": "144520"
}
```

### 실패 응답
```json
{
  "success": false,
  "message": "오류 메시지가 여기에 표시됩니다."
}
```

## 기술적 세부사항

- **언어**: TypeScript
- **브라우저 자동화**: Playwright
- **프로토콜**: Model Context Protocol (MCP)
- **지원 Node.js 버전**: 18.0.0 이상

## 프로젝트 구조

```
hamonikr-community-mcp/
├── src/
│   ├── index.ts              # MCP 서버 진입점 (stdio)
│   ├── sse-server.ts         # SSE 서버 진입점
│   ├── hamonikr-client.ts    # 하모니카 커뮤니티 클라이언트
│   ├── browser-manager.ts    # 브라우저 관리자
│   └── types.ts              # 타입 정의
├── config/
│   └── default.json          # 설정 파일
├── docs/                     # 문서
├── dist/                     # 컴파일된 JavaScript 파일
├── test-sse-client.html      # SSE 테스트 클라이언트
├── package.json
├── tsconfig.json
└── README.md
```

## 개발 및 테스트

### 개발 모드 실행
```bash
# SSE 서버 개발 모드
npm run dev

# stdio 서버 개발 모드
npm run dev:stdio
```

### 테스트 실행
```bash
npm test
```

### 빌드
```bash
npm run build
```

## 보안 주의사항

- 설정 파일에 저장된 자격 증명을 안전하게 관리하세요
- 프로덕션 환경에서는 환경 변수를 사용하여 자격 증명을 관리하는 것을 권장합니다
- 이 도구는 승인된 사용자만 사용해야 합니다

## 라이선스

MIT License

## 기여하기

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 지원

문제가 발생하거나 기능 요청이 있으면 Issue를 생성해주세요.