#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

class MCPTester {
    constructor() {
        this.serverPath = path.join(__dirname, 'dist', 'index.js');
        this.requestId = 1;
    }

    async sendRequest(method, params = {}) {
        return new Promise((resolve, reject) => {
            const process = spawn('node', [this.serverPath], {
                stdio: ['pipe', 'pipe', 'inherit']
            });

            const request = {
                jsonrpc: '2.0',
                id: this.requestId++,
                method: method,
                params: params
            };

            let output = '';
            let errorOutput = '';
            
            process.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            process.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
            
            process.on('close', (code) => {
                if (code === 0) {
                    try {
                        // Split by lines and find valid JSON responses
                        const lines = output.split('\n').filter(line => line.trim());
                        for (const line of lines) {
                            try {
                                const response = JSON.parse(line);
                                if (response.id === request.id) {
                                    resolve(response);
                                    return;
                                }
                            } catch (e) {
                                // Continue to next line
                            }
                        }
                        reject(new Error('No valid response found'));
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    reject(new Error(`Process exited with code ${code}. Error: ${errorOutput}`));
                }
            });
            
            process.stdin.write(JSON.stringify(request) + '\n');
            process.stdin.end();
        });
    }

    async testListTools() {
        console.log('Testing tools/list...');
        try {
            const response = await this.sendRequest('tools/list');
            console.log('✅ List tools successful');
            console.log('Available tools:', response.result?.tools?.map(t => t.name).join(', '));
            return true;
        } catch (error) {
            console.log('❌ List tools failed:', error.message);
            return false;
        }
    }

    async testCheckStatus() {
        console.log('Testing hamonikr_check_status...');
        try {
            const response = await this.sendRequest('tools/call', {
                name: 'hamonikr_check_status',
                arguments: {}
            });
            console.log('✅ Check status successful');
            console.log('Response:', JSON.stringify(response.result, null, 2));
            return true;
        } catch (error) {
            console.log('❌ Check status failed:', error.message);
            return false;
        }
    }

    async testLogin() {
        console.log('Testing hamonikr_login...');
        try {
            const response = await this.sendRequest('tools/call', {
                name: 'hamonikr_login',
                arguments: {}
            });
            console.log('✅ Login test successful');
            const result = JSON.parse(response.result.content[0].text);
            console.log('Login result:', result.success ? '성공' : '실패');
            console.log('Message:', result.message);
            return result.success;
        } catch (error) {
            console.log('❌ Login test failed:', error.message);
            return false;
        }
    }

    async testGetPost() {
        console.log('Testing hamonikr_get_post...');
        try {
            const response = await this.sendRequest('tools/call', {
                name: 'hamonikr_get_post',
                arguments: {
                    postUrl: 'https://hamonikr.org/hamoni_board/144520'
                }
            });
            console.log('✅ Get post test successful');
            const result = JSON.parse(response.result.content[0].text);
            console.log('Get post result:', result.success ? '성공' : '실패');
            console.log('Message:', result.message);
            if (result.success && result.post) {
                console.log('Post title:', result.post.title);
                console.log('Post author:', result.post.author);
            }
            return result.success;
        } catch (error) {
            console.log('❌ Get post test failed:', error.message);
            return false;
        }
    }

    async runAllTests() {
        console.log('🚀 Starting HamoniKR Community MCP Server Tests\n');

        const results = [];
        
        // Test 1: List Tools
        results.push(await this.testListTools());
        console.log();

        // Test 2: Check Status
        results.push(await this.testCheckStatus());
        console.log();

        // Test 3: Get Post (게시글 조회 테스트)
        results.push(await this.testGetPost());
        console.log();

        // Test 4: Login (실제 로그인 테스트는 주석 처리 - 실제 환경에서만)
        // results.push(await this.testLogin());
        // console.log();

        const passed = results.filter(r => r).length;
        const total = results.length;

        console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
        
        if (passed === total) {
            console.log('🎉 All tests passed! MCP server is working correctly.');
        } else {
            console.log('⚠️  Some tests failed. Check the configuration and setup.');
        }

        return passed === total;
    }
}

async function main() {
    const tester = new MCPTester();
    const success = await tester.runAllTests();
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main().catch(error => {
        console.error('Test runner error:', error);
        process.exit(1);
    });
}