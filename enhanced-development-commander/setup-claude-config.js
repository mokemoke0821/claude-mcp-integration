#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the absolute path to the built index.js
const serverPath = resolve(__dirname, 'build', 'index.js');

// Claude Desktop config path
const configPath = resolve(homedir(), 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json');

console.log('Enhanced Development Commander - Claude Desktop Setup\n');
console.log(`Server path: ${serverPath}`);
console.log(`Config path: ${configPath}\n`);

// Configuration to add
const mcpConfig = {
  "enhanced-development-commander": {
    "command": "node",
    "args": [serverPath]
  }
};

console.log('Add this to your claude_desktop_config.json:\n');
console.log(JSON.stringify({ mcpServers: mcpConfig }, null, 2));

// Try to read existing config
if (existsSync(configPath)) {
  console.log('\nYour current config file exists at:');
  console.log(configPath);
  console.log('\nWould you like to see the current content? (This is read-only)');

  try {
    const currentConfig = JSON.parse(readFileSync(configPath, 'utf8'));
    console.log('\nCurrent mcpServers:');
    console.log(JSON.stringify(currentConfig.mcpServers || {}, null, 2));
  } catch (error) {
    console.log('\nCould not read current config:', error.message);
  }
} else {
  console.log('\nConfig file not found at expected location.');
  console.log('You may need to create it manually.');
}

console.log('\nSetup complete! Restart Claude Desktop to use the new MCP server.');