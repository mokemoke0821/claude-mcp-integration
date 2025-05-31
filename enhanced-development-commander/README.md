# 🚀 Enhanced Development Commander

High-performance MCP server specialized for development tasks. Built with TypeScript for speed, reliability, and local-only operation.

## ✨ Features

### 🔧 Git Integration
- **Enhanced Status** - Detailed git status with ahead/behind counts
- **Smart Commits** - Auto-generate commit messages from diffs
- **Branch Management** - Create, switch, and manage branches
- **History Explorer** - Browse commit history with formatting
- **Diff Analyzer** - Analyze changes with insights
- **Stash Manager** - Save and restore work in progress

### 📊 Code Analysis
- **Project Structure** - Analyze file structure, dependencies, metrics
- **Performance Analysis** - Detect performance issues in code
- **Dead Code Detection** - Find potentially unused code
- **Dependency Analyzer** - Analyze and audit dependencies

### 📝 Code Templates
- **Component Templates** - Generate React, Vue, Angular components
- **Function Templates** - Create properly structured functions
- **Test Templates** - Generate test file scaffolds
- **Commit Messages** - Suggest conventional commit messages

### 🌐 Environment Management
- **Process Monitor** - Track running Node.js processes
- **Port Manager** - Check port usage, find available ports
- **Config Manager** - Manage .env files and environment variables
- **Log Analyzer** - Analyze application logs for patterns
- **System Info** - Get development environment details

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Claude Desktop

### Installation

1. Clone and setup:
```bash
git clone <repository-url>
cd enhanced-development-commander
npm install
npm run build
```

2. Add to Claude Desktop (Windows):
```bash
npm run update-config
```

Or manually:
```bash
node scripts/update-claude-config.js
```

3. Restart Claude Desktop

## 📚 Usage Examples

### Git Operations
```typescript
// Get enhanced git status
git_status_enhanced

// Auto-generate commit message
git_commit_smart { autoGenerate: true, type: "feat" }

// Manage branches
git_branch_manager { action: "create", branchName: "feature/new-feature" }
git_branch_manager { action: "list" }

// View commit history
git_history_explorer { limit: 20 }

// Analyze changes
git_diff_analyzer { staged: true }
```

### Code Analysis
```typescript
// Analyze project structure
analyze_project_structure

// Check code performance
analyze_code_performance { filePath: "src/components/App.tsx" }

// Find dead code
find_dead_code

// Analyze dependencies
dependency_analyzer
```

### Template Generation
```typescript
// Generate component
generate_code_template { type: "component", name: "UserProfile", language: "typescript" }

// Generate test file
generate_code_template { type: "test", name: "UserService" }

// Suggest commit message
suggest_commit_message { type: "feat", description: "user authentication" }
```

### Environment Management
```typescript
// Monitor processes
env_process_monitor

// Manage ports
env_port_manager { action: "list" }
env_port_manager { action: "check", port: 3000 }
env_port_manager { action: "find", startPort: 3000 }

// Manage configs
env_config_manager { action: "load" }
env_config_manager { action: "switch", environment: "production" }

// Analyze logs
env_log_analyzer { logPath: "logs/app.log", tail: 100, grep: "error" }

// System information
env_system_info
```

## 🛠️ Development

### Build
```bash
npm run build        # Production build
npm run build:watch  # Watch mode
npm run dev         # Development mode
```

### Test
```bash
# Test all tools
node scripts/test-tools.js

# Test single tool
node scripts/test-single-tool.js git_status_enhanced
node scripts/test-single-tool.js env_port_manager '{"action":"list"}'
```

### Scripts
- `scripts/setup.sh|bat` - Initial setup
- `scripts/build.sh|bat` - Build project
- `scripts/update-claude-config.js` - Update Claude config
- `scripts/test-tools.js` - Test all tools
- `scripts/test-single-tool.js` - Test specific tool

## 🏗️ Architecture

```
src/
├── index.ts              # Main server entry
├── core/
│   └── tool-registry.ts  # Tool registration system
├── services/
│   ├── git-service.ts    # Git operations
│   ├── analysis-service.ts # Code analysis
│   ├── template-service.ts # Template generation
│   └── environment-service.ts # Environment management
├── tools/
│   ├── git/             # Git tool implementations
│   ├── analysis/        # Analysis tools
│   ├── templates/       # Template tools
│   └── environment/     # Environment tools
└── types/
    └── common.ts        # Shared type definitions
```

## 🔒 Security & Privacy

- **100% Local** - No external API calls
- **No Data Collection** - Your code never leaves your machine
- **No Dependencies on Claude API** - Works offline
- **Open Source** - Fully auditable code

## 🚀 Performance

- **Instant Response** - No network latency
- **Parallel Processing** - Efficient multi-tool execution
- **Low Memory Footprint** - Optimized for development machines
- **TypeScript** - Type-safe and fast execution

## 📋 Tool Categories

### Git Tools (6 tools)
- `git_status_enhanced` - Enhanced repository status
- `git_commit_smart` - Intelligent commit creation
- `git_branch_manager` - Branch operations
- `git_history_explorer` - Commit history browsing
- `git_diff_analyzer` - Diff analysis
- `git_stash_manager` - Stash operations

### Analysis Tools (4 tools)
- `analyze_project_structure` - Project overview
- `analyze_code_performance` - Performance checks
- `find_dead_code` - Unused code detection
- `dependency_analyzer` - Dependency analysis

### Template Tools (2 tools)
- `generate_code_template` - Code generation
- `suggest_commit_message` - Commit suggestions

### Environment Tools (5 tools)
- `env_process_monitor` - Process tracking
- `env_port_manager` - Port management
- `env_config_manager` - Config management
- `env_log_analyzer` - Log analysis
- `env_system_info` - System information

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Built with:
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk)
- [simple-git](https://github.com/steveukx/git-js)
- [TypeScript](https://www.typescriptlang.org/)

---

**Note**: This MCP server is designed to complement, not replace, the standard file system MCP. It focuses on development-specific tasks that benefit from specialized implementations.