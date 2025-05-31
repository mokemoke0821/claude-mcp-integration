#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the build path
const buildPath = resolve(__dirname, '..', 'build', 'index.js');

// Check if server is built
if (!existsSync(buildPath)) {
  console.error('Server not built. Run "npm run build" first.');
  process.exit(1);
}

console.log('Testing Enhanced Development Commander Tools');
console.log('==========================================\n');

let mcpProcess;

// Test data
const tests = [
  {
    name: 'Git Status',
    tool: 'git_status_enhanced',
    args: {}
  },
  {
    name: 'Project Structure Analysis',
    tool: 'analyze_project_structure',
    args: {}
  },
  {
    name: 'Environment Info',
    tool: 'env_system_info',
    args: {}
  },
  {
    name: 'Code Template Generation',
    tool: 'generate_code_template',
    args: {
      templateType: 'component',
      name: 'TestComponent',
      framework: 'react'
    }
  },
  {
    name: 'Port Manager',
    tool: 'env_port_manager',
    args: {
      action: 'list'
    }
  }
];

async function startMCPServer() {
  console.log('Starting MCP server...\n');

  mcpProcess = spawn('node', [buildPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  return new Promise((resolve, reject) => {
    let output = '';

    mcpProcess.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('Enhanced Development Commander')) {
        console.log('MCP server started successfully\n');
        resolve();
      }
    });

    mcpProcess.stderr.on('data', (data) => {
      console.error('Server error:', data.toString());
    });

    mcpProcess.on('error', (error) => {
      console.error('Failed to start MCP server:', error);
      reject(error);
    });

    mcpProcess.on('exit', (code) => {
      console.error(`MCP server exited with code ${code}`);
      reject(new Error(`Server exited with code ${code}`));
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      reject(new Error('Server startup timeout'));
    }, 5000);
  });
}

async function runTests() {
  for (let i = 0; i < tests.length; i++) {
    await testTool(tests[i], i);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  }

  console.log('\nAll tests completed!');
}

async function testTool(test, currentTest) {
  return new Promise((resolve) => {
    console.log(`\nTest ${currentTest + 1}/${tests.length}: ${test.name}`);
    console.log('='.repeat(40));

    const request = {
      jsonrpc: '2.0',
      id: currentTest + 1,
      method: 'tools/call',
      params: {
        name: test.tool,
        arguments: test.args
      }
    };

    const requestStr = JSON.stringify(request) + '\n';

    mcpProcess.stdin.write(requestStr);

    let responseData = '';
    const dataHandler = (data) => {
      responseData += data.toString();
      try {
        const response = JSON.parse(responseData.trim());
        if (response.id === currentTest + 1) {
          mcpProcess.stdout.removeListener('data', dataHandler);
          if (response.error) {
            console.error(`Error: ${response.error.message}`);
          } else {
            console.log('Success!');
            if (response.result?.content?.[0]?.text) {
              const text = response.result.content[0].text;
              const lines = text.split('\n');
              console.log(lines.slice(0, 3).join('\n')); // Show first 3 lines
              if (lines.length > 3) {
                console.log(`... and ${lines.length - 3} more lines`);
              }
            }
          }
          resolve();
        }
      } catch (e) {
        // Not complete JSON yet, continue listening
      }
    };

    mcpProcess.stdout.on('data', dataHandler);

    // Timeout after 3 seconds
    setTimeout(() => {
      mcpProcess.stdout.removeListener('data', dataHandler);
      console.log('Test timeout - moving to next test');
      resolve();
    }, 3000);
  });
}

// Cleanup function
function cleanup() {
  if (mcpProcess) {
    mcpProcess.kill();
  }
  process.exit(0);
}

// Handle cleanup on exit
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

// Check if built
if (!existsSync(buildPath)) {
  console.error('Server not built. Run "npm run build" first.');
  process.exit(1);
}

console.log('Testing Enhanced Development Commander Tools');
console.log('==========================================\n');

// Start server and run tests
startMCPServer()
  .then(() => runTests())
  .then(() => cleanup())
  .catch((error) => {
    console.error('Test failed:', error);
    cleanup();
  });