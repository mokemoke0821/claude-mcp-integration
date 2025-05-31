/**
 * Enhanced Deep Think Commander V4
 * MCPサーバーの強化版
 * 
 * 機能：
 * - AI思考強化モジュール
 * - 文脈認識プロンプトテンプレート
 * - 会話コンテキスト管理
 * - 思考チェーン
 */

const { Server, StdioServerTransport, ErrorCode, McpError } = require('@modelcontextprotocol/server');
const path = require('path');
const Debug = require('debug');

// 内部モジュールの読み込み
const ThinkingUtils = require('./utils/thinking-utils');
const ThinkingTools = require('./utils/thinking-tools');
const AdvancedThinking = require('./utils/advanced-thinking');
const AIThinkingEnhancer = require('./utils/ai-thinking-enhancer');
const ContextPromptTemplates = require('./utils/context-prompt-templates');
const ThoughtChain = require('./utils/thought-chain');
const McpCommunicator = require('./utils/mcp-communicator');

// 知識ベースの読み込み
const TechnologyKnowledgeBase = require('./utils/knowledge/technology-base');
const BusinessKnowledgeBase = require('./utils/knowledge/business-base');

// 標準リクエストスキーマ
const {
  ListServerInfoRequestSchema,
  ListServerInfoResponseSchema,
  ListToolsRequestSchema,
  ListToolsResponseSchema,
  CallToolRequestSchema,
  CallToolResponseSchema,
} = require('@modelcontextprotocol/schema');

// デバッグ設定
const debug = Debug('deep-think:server');
debug.log = console.error.bind(console);