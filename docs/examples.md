# HamoniKR Community MCP Server 사용 예제

이 문서는 HamoniKR Community MCP Server의 실제 사용 예제를 제공합니다.

## Claude Code와 함께 사용하기

### 1. MCP 서버 설정

Claude Code 설정에 다음을 추가하세요:

```json
{
  "mcpServers": {
    "hamonikr-community": {
      "command": "node",
      "args": ["/home/hamonikr/workspaces/hamonikr-community-mcp/dist/index.js"]
    }
  }
}
```

### 2. 기본 사용법

#### 로그인 확인
```
사용자: 하모니카 커뮤니티 로그인 상태를 확인해주세요.
Claude: hamonikr_check_status 도구를 사용하여 확인하겠습니다.
```

#### 게시글 작성
```
사용자: 하모니카 Q&A 게시판에 "Ubuntu 호환성 질문"이라는 제목으로 글을 작성해주세요. 내용은 "하모니카OS에서 Ubuntu 패키지 호환성에 대해 궁금합니다."로 해주세요.

Claude: hamonikr_create_post 도구를 사용하여 게시글을 작성하겠습니다.
- title: "Ubuntu 호환성 질문"
- content: "하모니카OS에서 Ubuntu 패키지 호환성에 대해 궁금합니다."
- board: "qna"
```

#### 댓글 작성
```
사용자: https://hamonikr.org/hamoni_board/144520 이 게시물에 "유용한 정보 감사합니다!"라는 댓글을 달아주세요.

Claude: hamonikr_add_comment 도구를 사용하여 댓글을 작성하겠습니다.
- postUrl: "https://hamonikr.org/hamoni_board/144520"
- content: "유용한 정보 감사합니다!"
```

## Python 스크립트 예제

```python
import subprocess
import json

def call_mcp_tool(tool_name, arguments):
    """MCP 도구를 호출하는 함수"""
    cmd = ["node", "/home/hamonikr/workspaces/hamonikr-community-mcp/dist/index.js"]
    
    request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }
    
    process = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    stdout, stderr = process.communicate(json.dumps(request))
    return json.loads(stdout)

# 사용 예제
if __name__ == "__main__":
    # 로그인
    result = call_mcp_tool("hamonikr_login", {})
    print("Login result:", result)
    
    # 게시글 작성
    result = call_mcp_tool("hamonikr_create_post", {
        "title": "Python에서 MCP 서버 사용하기",
        "content": "Python 스크립트로 하모니카 커뮤니티에 글을 작성하는 예제입니다.",
        "board": "qna"
    })
    print("Post creation result:", result)
```

## Node.js 예제

```javascript
const { spawn } = require('child_process');

class HamoniKRMCPClient {
    constructor() {
        this.serverPath = '/home/hamonikr/workspaces/hamonikr-community-mcp/dist/index.js';
    }

    async callTool(toolName, arguments) {
        return new Promise((resolve, reject) => {
            const process = spawn('node', [this.serverPath]);
            
            const request = {
                jsonrpc: '2.0',
                id: 1,
                method: 'tools/call',
                params: {
                    name: toolName,
                    arguments: arguments
                }
            };

            let output = '';
            
            process.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            process.on('close', (code) => {
                if (code === 0) {
                    try {
                        resolve(JSON.parse(output));
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    reject(new Error(`Process exited with code ${code}`));
                }
            });
            
            process.stdin.write(JSON.stringify(request));
            process.stdin.end();
        });
    }

    async login() {
        return await this.callTool('hamonikr_login', {});
    }

    async createPost(title, content, board = 'qna') {
        return await this.callTool('hamonikr_create_post', {
            title,
            content,
            board
        });
    }

    async addComment(postUrl, content) {
        return await this.callTool('hamonikr_add_comment', {
            postUrl,
            content
        });
    }
}

// 사용 예제
async function main() {
    const client = new HamoniKRMCPClient();
    
    try {
        // 로그인
        const loginResult = await client.login();
        console.log('Login result:', loginResult);
        
        // 게시글 작성
        const postResult = await client.createPost(
            'Node.js에서 MCP 사용하기',
            'Node.js에서 하모니카 커뮤니티 MCP 서버를 사용하는 예제입니다.'
        );
        console.log('Post result:', postResult);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
```

## 일반적인 워크플로우

### 1. 커뮤니티 관리 자동화
```bash
# 1. 로그인 상태 확인
hamonikr_check_status

# 2. 필요시 로그인
hamonikr_login

# 3. 공지사항 작성
hamonikr_create_post {
  "title": "하모니카 8.0 업데이트 안내",
  "content": "새로운 기능과 개선사항을 소개합니다...",
  "board": "notice"
}

# 4. 사용자 질문에 답변
hamonikr_add_comment {
  "postUrl": "https://hamonikr.org/hamoni_board/144520",
  "content": "답변드립니다. 이 문제는 다음과 같이 해결할 수 있습니다..."
}
```

### 2. 배치 작업 예제
```bash
#!/bin/bash

# 여러 게시글에 일괄 댓글 추가
POSTS=(
  "https://hamonikr.org/hamoni_board/144520"
  "https://hamonikr.org/hamoni_board/144521"
  "https://hamonikr.org/hamoni_board/144522"
)

for POST_URL in "${POSTS[@]}"; do
  echo "Adding comment to $POST_URL"
  # MCP 도구 호출 로직
done
```

## 트러블슈팅

### 일반적인 문제들

1. **로그인 실패**
   ```json
   {
     "success": false,
     "message": "로그인에 실패했습니다. 자격 증명을 확인해주세요."
   }
   ```
   - 해결: `config/default.json`에서 자격 증명 확인

2. **요소를 찾을 수 없음**
   ```json
   {
     "success": false,
     "message": "게시글 작성 버튼을 찾을 수 없습니다."
   }
   ```
   - 해결: 웹사이트 구조 변경 시 CSS 선택자 업데이트 필요

3. **네트워크 타임아웃**
   ```json
   {
     "success": false,
     "message": "네트워크 타임아웃이 발생했습니다."
   }
   ```
   - 해결: `config/default.json`에서 타임아웃 설정 증가

### 디버깅 팁

1. **헤드리스 모드 비활성화**
   ```json
   {
     "browser": {
       "headless": false,
       "timeout": 30000
     }
   }
   ```

2. **스크린샷 캡처**
   - 브라우저 매니저의 screenshot 메서드 활용

3. **로그 레벨 증가**
   - 개발 모드에서 상세한 로그 확인

이러한 예제들을 참고하여 HamoniKR Community MCP Server를 효과적으로 활용하시기 바랍니다.