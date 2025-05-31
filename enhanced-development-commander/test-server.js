#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('Enhanced Development Commander - Server Test');
console.log('==========================================\n');

const testCases = [
  {
    name: 'Git Status',
    method: 'tools/call',
    params: {
      name: 'git_status_enhanced',
      arguments: {}
    }
  },
  {
    name: 'System Info',
    method: 'tools/call',
    params: {
      name: 'env_system_info',
      arguments: {}
    }
  }
];

let currentTest = 0;

// Start the MCP server
const mcp = spawn('node', ['build/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

mcp.stderr.on('data', (data) => {
  const message = data.toString();
  if (message.includes('running on stdio')) {
    console.log('Server started successfully!\n');
    runNextTest();
  }
});

mcp.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

function runNextTest() {
  if (currentTest >= testCases.length) {
    console.log('\nAll tests completed!');
    mcp.kill();
    process.exit(0);
  }

  const test = testCases[currentTest];
  console.log(`Running test: ${test.name}`);

  const request = {
    jsonrpc: '2.0',
    id: currentTest + 1,
    method: test.method,
    params: test.params
  };

  mcp.stdin.write(JSON.stringify(request) + '\n');

  // Wait for response
  const timeout = setTimeout(() => {
    console.error('\nTest timeout!');
    mcp.kill();
    process.exit(1);
  }, 5000);

  mcp.stdout.once('data', (data) => {
    clearTimeout(timeout);

    try {
      const response = JSON.parse(data.toString());
      if (response.result) {
        console.log('Success!\n');
      } else if (response.error) {
        console.error(`Error: ${response.error.message}\n`);
      }
    } catch (error) {
      console.error('Failed to parse response\n');
    }

    currentTest++;
    setTimeout(runNextTest, 500);
  });
}