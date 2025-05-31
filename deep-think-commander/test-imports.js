// test-imports.js
console.log('Testing imports from enhanced-index-v4.js...');

try {
  console.log('Importing server modules...');
  const { Server, StdioServerTransport, ErrorCode, McpError } = require('@modelcontextprotocol/server');
  console.log('Server modules imported successfully');
  
  console.log('Importing path and debug...');
  const path = require('path');
  const Debug = require('debug');
  console.log('Path and debug imported successfully');
  
  console.log('Setting up debug logger...');
  const debug = Debug('deep-think:test');
  debug.log = console.error.bind(console);
  debug.info('Debug logger working');
  
  console.log('All imports successful!');
} catch (err) {
  console.error('Import error:', err);
}
