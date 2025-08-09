# HamoniKR Community MCP Server - 설치 및 사용 가이드

## 빠른 시작

### 1. 프로젝트 확인
```bash
cd ~/workspaces/hamonikr-community-mcp
ls -la
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 프로젝트 빌드
```bash
npm run build
```

### 4. 자격증명 설정
```bash
# .env 파일 생성
echo "HAMONIKR_USERNAME=your-email@example.com" > .env
echo "HAMONIKR_PASSWORD=your-password" >> .env
chmod 600 .env
```

### 5. MCP 서버 테스트
```bash
node simple-test.js
```

정상적으로 작동한다면 다음과 같은 메시지가 출력됩니다:
```
✅ MCP Server appears to be working correctly!
```

## Claude Code에서 사용하기

### Claude Code 설정 파일 위치
- **Linux**: `~/.config/claude-code/settings.json`
- **macOS**: `~/Library/Application Support/claude-code/settings.json`
- **Windows**: `%APPDATA%\claude-code\settings.json`

### 설정 추가
```json
{
  "mcpServers": {
    "hamonikr-community": {
      "command": "node",
      "args": ["/home/hamonikr/workspaces/hamonikr-community-mcp/dist/index.js"],
      "env": {
        "HAMONIKR_USERNAME": "your-email@example.com",
        "HAMONIKR_PASSWORD": "your-password"
      }
    }
  }
}
```

## 사용 예제

Claude Code에서 다음과 같이 사용할 수 있습니다:

### 게시글 작성
```
사용자: 하모니카 Q&A 게시판에 "MCP 서버 테스트"라는 제목으로 "MCP 서버가 정상 작동합니다"라는 내용의 글을 작성해주세요.
```

### 게시글 조회
```
사용자: https://hamonikr.org/hamoni_board/144520 이 게시글의 내용을 조회해주세요.
```

### 댓글 작성
```
사용자: https://hamonikr.org/hamoni_board/144520 이 게시글에 "MCP 서버를 통한 자동 댓글입니다"라는 댓글을 달아주세요.
```

## 사용 가능한 기능

1. **hamonikr_login**: 하모니카 커뮤니티 로그인
2. **hamonikr_create_post**: 게시글 작성 (공지사항/Q&A)
3. **hamonikr_get_post**: 게시글 내용 조회
4. **hamonikr_add_comment**: 댓글 작성
5. **hamonikr_edit_post**: 게시글 수정
6. **hamonikr_delete_post**: 게시글 삭제
7. **hamonikr_check_status**: 로그인 상태 확인

## 트러블슈팅

### 1. MCP 서버가 시작되지 않는 경우
```bash
# 로그 확인
node dist/index.js

# 또는 개발 모드로 실행
npm run dev
```

### 2. 로그인 실패
- `.env` 파일에 올바른 자격증명이 설정되어 있는지 확인
- 하모니카 커뮤니티 웹사이트에서 수동 로그인 테스트

### 3. Claude Code에서 인식되지 않는 경우
- Claude Code를 재시작
- 설정 파일 경로 확인
- 설정 파일 문법 검증

### 4. 권한 오류
```bash
chmod +x dist/index.js
chmod 600 .env
```

## 보안 주의사항

1. `.env` 파일을 Git에 커밋하지 마세요
2. 자격증명을 안전한 곳에 보관하세요
3. 정기적으로 비밀번호를 변경하세요
4. 서버 환경에서는 환경 변수를 사용하세요

## 개발 환경

- Node.js 18.0.0 이상
- TypeScript 5.0.0 이상
- Playwright (자동 설치됨)

## 지원

문제가 발생하면 다음을 확인하세요:
1. 프로젝트 README.md
2. docs/credentials-setup.md
3. docs/examples.md

추가 도움이 필요하면 GitHub Issues를 생성해주세요.