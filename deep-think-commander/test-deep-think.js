// test-deep-think.js
console.log('Importing dependencies...');
try {
  const { Server } = require('@modelcontextprotocol/server');
  console.log('Server import successful');
} catch (err) {
  console.error('Server import failed:', err.message);
}

try {
  const { ListServerInfoRequestSchema } = require('@modelcontextprotocol/schema');
  console.log('Schema import successful');
} catch (err) {
  console.error('Schema import failed:', err.message);
}

try {
  const Debug = require('debug');
  console.log('Debug import successful');
} catch (err) {
  console.error('Debug import failed:', err.message);
}

console.log('Done testing imports.');
