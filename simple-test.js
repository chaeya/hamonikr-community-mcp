#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

async function testMCPServer() {
    console.log('🧪 MCP Server Simple Test\n');
    
    const serverPath = path.join(__dirname, 'dist', 'index.js');
    console.log('Server path:', serverPath);
    
    try {
        const process = spawn('node', [serverPath], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        // Test request
        const listToolsRequest = {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list'
        };

        console.log('Sending tools/list request...');
        
        let stdout = '';
        let stderr = '';
        
        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        // Send request
        process.stdin.write(JSON.stringify(listToolsRequest) + '\n');
        
        // Wait a bit for response
        setTimeout(() => {
            process.kill();
            
            console.log('\n--- STDOUT ---');
            console.log(stdout);
            console.log('\n--- STDERR ---');
            console.log(stderr);
            
            if (stdout.includes('hamonikr_login') || stdout.includes('tools')) {
                console.log('\n✅ MCP Server appears to be working correctly!');
            } else {
                console.log('\n⚠️ Server might have issues. Check the output above.');
            }
        }, 5000);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testMCPServer();