# Code Style and Conventions

## TypeScript Configuration
- **Target**: ES2022
- **Module System**: CommonJS
- **Strict Mode**: Enabled
- **Output Directory**: `./dist`
- **Source Directory**: `./src`
- **Declaration Files**: Generated (with source maps)

## Code Style
- Uses TypeScript strict mode for comprehensive type checking
- ESModule interop enabled
- Consistent casing enforced in filenames
- JSON module resolution enabled

## Naming Conventions
- **Files**: kebab-case (e.g., `hamonikr-client.ts`, `browser-manager.ts`)
- **Classes**: PascalCase (e.g., `HamoniKRClient`)
- **Functions/Methods**: camelCase
- **Constants**: UPPER_CASE for environment variables

## Project Structure
```
src/
├── index.ts              # MCP stdio entry point
├── sse-server.ts         # SSE server entry point  
├── http-server.ts        # HTTP server entry point
├── hamonikr-client.ts    # Main client implementation
├── browser-manager.ts    # Browser automation
└── types.ts              # Type definitions
```

## Import Style
- Uses ES6 import/export syntax
- Imports from npm packages use full paths where needed
- Local imports use relative paths

## Error Handling
- Functions return structured responses with success/failure status
- Error messages are descriptive and user-friendly

## Dependencies
- **Runtime**: Node.js >=18.0.0
- **Main Dependencies**: @modelcontextprotocol/sdk, playwright, express, cors, dotenv
- **Dev Dependencies**: TypeScript, ts-node, jest, @types packages

## Security Practices
- Credentials loaded from environment variables
- Config files exclude sensitive data by default
- File permissions properly set for .env files (600)