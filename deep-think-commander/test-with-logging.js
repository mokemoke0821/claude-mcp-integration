// test-with-logging.js
console.log('Starting test with logging...');

try {
  const fs = require('fs');
  fs.writeFileSync('test-log.txt', 'Test started\n', { flag: 'w' });
  
  try {
    const { Server, StdioServerTransport, ErrorCode, McpError } = require('@modelcontextprotocol/server');
    fs.appendFileSync('test-log.txt', 'Server modules imported successfully\n');
  } catch (err) {
    fs.appendFileSync('test-log.txt', `Server import error: ${err.message}\n${err.stack}\n`);
  }
  
  try {
    const { ListServerInfoRequestSchema } = require('@modelcontextprotocol/schema');
    fs.appendFileSync('test-log.txt', 'Schema modules imported successfully\n');
  } catch (err) {
    fs.appendFileSync('test-log.txt', `Schema import error: ${err.message}\n${err.stack}\n`);
  }
  
  try {
    const Debug = require('debug');
    fs.appendFileSync('test-log.txt', 'Debug imported successfully\n');
  } catch (err) {
    fs.appendFileSync('test-log.txt', `Debug import error: ${err.message}\n${err.stack}\n`);
  }
  
  fs.appendFileSync('test-log.txt', 'Test completed\n');
  console.log('Test completed. See test-log.txt for details.');
} catch (err) {
  console.error('Fatal error:', err);
}
