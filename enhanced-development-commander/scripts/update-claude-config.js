#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Claude Desktop Configuration Updater');
console.log('=====================================\n');

// Paths
const buildPath = resolve(__dirname, '..', 'build', 'index.js');
const claudeDir = resolve(homedir(), 'AppData', 'Roaming', 'Claude');
const configPath = resolve(claudeDir, 'claude_desktop_config.json');

console.log(`Config path: ${configPath}\n`);

// Ensure Claude directory exists
if (!existsSync(claudeDir)) {
  console.log('Creating Claude config directory...');
  mkdirSync(claudeDir, { recursive: true });
}

// Check if server is built
if (!existsSync(buildPath)) {
  console.error('Server not built. Run "npm run build" first.');
  process.exit(1);
}

// Enhanced Development Commander configuration
const enhancedDevConfig = {
  "command": "node",
  "args": [buildPath.replace(/\\/g, '/')],
  "env": {
    "NODE_ENV": "production"
  }
};

let config = { mcpServers: {} };

// Try to read existing config
if (existsSync(configPath)) {
  try {
    const existingConfig = JSON.parse(readFileSync(configPath, 'utf8'));
    if (existingConfig.mcpServers) {
      config.mcpServers = { ...existingConfig.mcpServers };

      // Remove duplicate Enhanced Development Commander entries
      delete config.mcpServers['enhanced_development_commander'];
      delete config.mcpServers['enhanced-development-commander'];

      console.log('Cleaned up duplicate Enhanced Development Commander entries');
    }
  } catch (error) {
    console.error('Failed to parse existing config:', error.message);
    console.log('Creating new configuration...');
  }
} else {
  console.log('Creating new configuration...');

  // Add default filesystem server if no config exists
  config.mcpServers.filesystem = {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\Users\\81902\\OneDrive\\Documents\\Cline\\MCP"]
  };
}

// Add/update Enhanced Development Commander
config.mcpServers['enhanced-development-commander'] = enhancedDevConfig;

// Write configuration
try {
  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

  console.log('\nConfiguration updated successfully!');
  console.log('===================================\n');
  console.log('MCP Servers configured:');

  Object.entries(config.mcpServers).forEach(([name, serverConfig]) => {
    console.log(`- ${name}: ${serverConfig.command} (${serverConfig.args?.length || 0} args)`);
  });

  console.log('\nNext steps:');
  console.log('----------');
  console.log('1. Restart Claude Desktop');
  console.log('2. Look for the MCP connection indicator');
  console.log('3. Try using the available tools');

  console.log('\nEnhanced Development Commander tools:');
  console.log('- Git: status, commit, branch management, history, diff, stash');
  console.log('- Analysis: project structure, performance, dead code, dependencies');
  console.log('- Templates: code generation, commit messages');
  console.log('- Environment: process monitoring, port management, config, logs, system info');

} catch (error) {
  console.error('Failed to write configuration:', error.message);
  console.error('\nTry running with administrator privileges if permission denied.');
  process.exit(1);
}