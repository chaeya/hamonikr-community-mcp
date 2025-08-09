# 사용자 자격증명 설정 가이드

HamoniKR Community MCP Server를 사용하기 위해서는 하모니카 커뮤니티 계정의 자격증명을 설정해야 합니다.

## 설정 방법

### 방법 1: 설정 파일 직접 수정 (권장하지 않음)

`config/default.json` 파일을 직접 수정하는 방법입니다. 보안상 권장하지 않습니다.

```json
{
  "hamonikr": {
    "credentials": {
      "username": "your-email@example.com",
      "password": "your-password"
    }
  }
}
```

### 방법 2: 환경 변수 사용 (권장)

환경 변수를 사용하여 자격증명을 안전하게 관리하는 방법입니다.

1. **환경 변수 설정**:
```bash
export HAMONIKR_USERNAME="your-email@example.com"
export HAMONIKR_PASSWORD="your-password"
```

2. **영구 설정** (선택사항):
```bash
# ~/.bashrc 또는 ~/.zshrc에 추가
echo 'export HAMONIKR_USERNAME="your-email@example.com"' >> ~/.bashrc
echo 'export HAMONIKR_PASSWORD="your-password"' >> ~/.bashrc
source ~/.bashrc
```

### 방법 3: .env 파일 사용

프로젝트 루트 디렉토리에 `.env` 파일을 생성합니다.

1. **`.env` 파일 생성**:
```bash
cd ~/workspaces/hamonikr-community-mcp
touch .env
```

2. **`.env` 파일 내용**:
```env
HAMONIKR_USERNAME=your-email@example.com
HAMONIKR_PASSWORD=your-password
```

3. **.env 파일 권한 설정**:
```bash
chmod 600 .env  # 소유자만 읽기/쓰기 가능하도록 설정
```

### 방법 4: 설정 파일 분리

민감한 정보를 별도 파일로 관리하는 방법입니다.

1. **credentials.json 파일 생성**:
```bash
cd ~/workspaces/hamonikr-community-mcp/config
touch credentials.json
chmod 600 credentials.json
```

2. **credentials.json 내용**:
```json
{
  "username": "your-email@example.com",
  "password": "your-password"
}
```

3. **main 설정 파일에서 참조**:
`config/default.json`을 다음과 같이 수정:
```json
{
  "hamonikr": {
    "credentialsFile": "./config/credentials.json"
  }
}
```

## 실제 사용 예제

### 현재 테스트용 계정 설정

테스트를 위해 현재 사용중인 계정으로 설정하려면:

```bash
cd ~/workspaces/hamonikr-community-mcp
export HAMONIKR_USERNAME="chaeya@gmail.com"
export HAMONIKR_PASSWORD="wlwhs73**"
```

또는 `.env` 파일에:
```env
HAMONIKR_USERNAME=chaeya@gmail.com
HAMONIKR_PASSWORD=wlwhs73**
```

### MCP 서버 실행

자격증명 설정 후 MCP 서버 실행:

```bash
cd ~/workspaces/hamonikr-community-mcp
npm start
```

## Claude Code에서 사용하기

### MCP 서버 설정 파일

Claude Code의 설정 파일에 다음과 같이 추가:

**Linux/macOS**: `~/.config/claude-code/settings.json`
**Windows**: `%APPDATA%\claude-code\settings.json`

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

또는 환경 변수를 시스템 레벨에서 설정한 경우:

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

## 보안 주의사항

1. **절대 Git에 자격증명을 커밋하지 마세요**
   - `.env` 파일과 `credentials.json`은 `.gitignore`에 포함되어 있습니다
   - 실수로 커밋하지 않도록 주의하세요

2. **파일 권한 설정**
   ```bash
   chmod 600 .env
   chmod 600 config/credentials.json
   ```

3. **주기적인 비밀번호 변경**
   - 정기적으로 하모니카 커뮤니티 계정 비밀번호를 변경하세요
   - 변경 후 설정 파일도 업데이트하세요

4. **다중 사용자 환경**
   - 서버 환경에서는 각 사용자별로 별도의 자격증명을 사용하세요
   - 서비스 계정을 생성하여 사용하는 것을 권장합니다

## 트러블슈팅

### 로그인 실패 시

1. **자격증명 확인**:
```bash
echo $HAMONIKR_USERNAME
echo $HAMONIKR_PASSWORD
```

2. **수동 로그인 테스트**:
브라우저에서 직접 https://hamonikr.org 에 로그인해보세요.

3. **설정 파일 권한 확인**:
```bash
ls -la config/
ls -la .env
```

### 환경 변수가 적용되지 않을 때

```bash
# 현재 세션에 환경 변수 다시 로드
source ~/.bashrc
# 또는
source ~/.zshrc

# 환경 변수 확인
env | grep HAMONIKR
```

## 고급 설정

### 여러 계정 관리

여러 하모니카 계정을 관리해야 하는 경우:

```json
{
  "profiles": {
    "default": {
      "username": "account1@example.com",
      "password": "password1"
    },
    "admin": {
      "username": "admin@example.com", 
      "password": "admin_password"
    }
  }
}
```

### 자동 로그인 설정

MCP 서버가 시작될 때 자동으로 로그인하도록 설정:

```json
{
  "hamonikr": {
    "autoLogin": true,
    "loginRetries": 3
  }
}
```

이 가이드를 따라 자격증명을 올바르게 설정하면 HamoniKR Community MCP Server를 안전하고 효과적으로 사용할 수 있습니다.