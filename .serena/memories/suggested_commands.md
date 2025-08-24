# Suggested Development Commands

## Installation and Setup
```bash
# Install dependencies (includes Playwright browser installation)
npm install

# Build the project
npm run build
```

## Development Commands
```bash
# Run in development mode (SSE server)
npm run dev

# Run in development mode (stdio server) 
npm run dev:stdio

# Build TypeScript to JavaScript
npm run build
```

## Running the Server
```bash
# Start HTTP server (default)
npm start

# Start stdio mode server
npm run start:stdio

# Start SSE server
npm run start:sse

# Start HTTP server explicitly  
npm run start:http
```

## Testing
```bash
# Run tests
npm test
```

## Linting and Formatting
The project uses TypeScript strict mode for type checking. No specific linting commands are configured.

## System Commands (Linux)
- `git` - version control
- `ls` - list directory contents
- `cd` - change directory
- `grep` - search text patterns
- `find` - search files and directories
- `cat` - display file contents
- `tail` - show end of files
- `chmod` - change file permissions

## Environment Setup
```bash
# Set credentials via environment variables (recommended)
export HAMONIKR_USERNAME="your-email@example.com"
export HAMONIKR_PASSWORD="your-password"

# Or create .env file
echo "HAMONIKR_USERNAME=your-email@example.com" > .env
echo "HAMONIKR_PASSWORD=your-password" >> .env
chmod 600 .env
```