# Task Completion Checklist

## When Completing a Development Task

### 1. Build and Type Checking
```bash
# Always run build to check for TypeScript errors
npm run build
```

### 2. Testing
```bash
# Run tests to ensure functionality works
npm test
```

### 3. Code Quality Checks
Since the project doesn't have explicit linting commands configured:
- Review TypeScript compiler output for strict mode violations
- Ensure all types are properly defined
- Check that imports/exports are correct

### 4. Functional Testing
Depending on the changes made:

**For MCP stdio functionality:**
```bash
# Test the stdio server
npm run start:stdio
```

**For SSE/HTTP functionality:**
```bash
# Start the SSE server
npm run start:sse
# Or HTTP server
npm run start:http
```

**For browser automation changes:**
- Verify Playwright browser installation: `npx playwright install chromium`
- Test with actual HamoniKR community site

### 5. Environment Configuration
- Ensure environment variables are properly set
- Verify `.env` file has correct permissions (600)
- Test with both environment variables and config file approaches

### 6. Documentation Updates
- Update README.md if adding new features
- Update API documentation for new tools/functions
- Check that examples are still valid

### 7. Git Workflow
```bash
# Check status and stage changes
git status
git add <files>

# Commit with descriptive message
git commit -m "descriptive message"

# Push if needed
git push origin <branch>
```

### 8. Deployment Considerations
- Verify the built `dist/` directory contains all necessary files
- Check that `package.json` scripts work correctly
- Ensure all dependencies are properly listed