#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get tool name from command line
const toolName = process.argv[2];
if (!toolName) {
  console.log('Usage: node test-single-tool.js <tool-name>');
  console.log('Example: node test-single-tool.js git_status_enhanced');
  process.exit(1);
}

// Get the build path
const buildPath = resolve(__dirname, '..', 'build', 'index.js');

// Check if server is built
if (!existsSync(buildPath)) {
  console.error('Server not built. Run "npm run build" first.');
  process.exit(1);
}

console.log(`Testing tool: ${toolName}`);
console.log('='.repeat(40));

let mcpProcess;

async function startMCPServer() {
  mcpProcess = spawn('node', [buildPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  return new Promise((resolve, reject) => {
    mcpProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Enhanced Development Commander')) {
        console.log('MCP server started\n');
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

    // Timeout after 5 seconds
    setTimeout(() => {
      reject(new Error('Server startup timeout'));
    }, 5000);
  });
}

async function testTool() {
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: getDefaultArgs(toolName)
    }
  };

  console.log('Request:', JSON.stringify(request, null, 2));
  console.log('\nSending request...\n');

  const requestStr = JSON.stringify(request) + '\n';
  mcpProcess.stdin.write(requestStr);

  return new Promise((resolve) => {
    let responseData = '';

    const dataHandler = (data) => {
      responseData += data.toString();
      try {
        const response = JSON.parse(responseData.trim());
        if (response.id === 1) {
          mcpProcess.stdout.removeListener('data', dataHandler);

          if (response.error) {
            console.error(`Error: ${response.error.message}`);
          } else {
            console.log('Response received successfully!');
            console.log('\nResult:');
            if (response.result?.content?.[0]?.text) {
              console.log(response.result.content[0].text);
            } else {
              console.log(JSON.stringify(response.result, null, 2));
            }
          }
          resolve();
        }
      } catch (e) {
        // Not complete JSON yet, continue listening
      }
    };

    mcpProcess.stdout.on('data', dataHandler);

    // Timeout after 10 seconds
    setTimeout(() => {
      mcpProcess.stdout.removeListener('data', dataHandler);
      console.error('Timeout: No response received');
      resolve();
    }, 10000);
  });
}

function getDefaultArgs(toolName) {
  const defaultArgs = {
    'git_status_enhanced': {},
    'git_commit_smart': { message: 'test commit' },
    'git_branch_manager': { action: 'list' },
    'analyze_project_structure': {},
    'analyze_code_performance': { filePath: 'package.json' },
    'find_dead_code': {},
    'dependency_analyzer': {},
    'generate_code_template': { templateType: 'component', name: 'TestComponent' },
    'suggest_commit_message': { type: 'feat', description: 'test feature' },
    'env_process_monitor': {},
    'env_port_manager': { action: 'list' },
    'env_config_manager': { action: 'list' },
    'env_log_analyzer': { action: 'list' },
    'env_system_info': {}
  };

  return defaultArgs[toolName] || {};
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

// Run the test
startMCPServer()
  .then(() => testTool())
  .then(() => {
    console.log('\nTest completed!');
    cleanup();
  })
  .catch((error) => {
    console.error('Test failed:', error);
    cleanup();
  });