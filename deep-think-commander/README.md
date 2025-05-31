# Deep Think Commander V3

Claude Desktopの思考能力を拡張するMCPサーバー。思考プロセスの強化、多段階分析の実現、MCP間連携の強化などの機能を提供します。

## 主な機能

### 1. 多段階分析プロセス

複数の思考ツールを組み合わせた高度な分析フローを提供します：

- 包括的問題分析
- 戦略的意思決定
- 認知バイアス分析
- カスタム分析フロー作成

各分析フローは複数のステージから構成され、ステージごとに異なる思考ツールを適用します。

### 2. 思考ツール連携機能

複数の思考ツールを連携させ、より深い分析を実現します：

- ツール間の結果の統合と分析
- コンテキスト共有による継続的な思考の深化
- 複数の視点からの統合的洞察

### 3. カスタマイズ可能な思考フレームワーク

ユーザーのニーズに応じた思考プロセスをカスタマイズできます：

- 技術分析フレームワーク
- ビジネス戦略フレームワーク
- 創造的問題解決フレームワーク
- 批判的評価フレームワーク

### 4. MCPサーバー間連携

他のMCPサーバーと連携し、総合的な機能を提供します：

- Web検索結果の思考分析連携
- システム情報の分析と最適化
- コード生成と実装の連携

### 5. 構造化ログシステム

詳細なログ機能で開発とデバッグをサポートします：

- 階層化されたログレベル
- パフォーマンス計測
- メモリ使用状況モニタリング
- ツール実行トレース

## 使用方法

### Claude Desktopへの追加

1. `claude_desktop_config.json` ファイルに以下の設定を追加：

```json
"deep-think-commander-v3": {
  "command": "node",
  "args": ["パス/enhanced-index-v3.js"],
  "env": {
    "DEBUG": "deep-think:*",
    "NODE_ENV": "production"
  }
}
```

2. Claude Desktopを再起動

### 主要なツール

- 基本的な思考分析ツール（analyze, counter, perspective）
- 思考プロセスの詳細化ツール（decompose, generateHypotheses, evaluateEvidence, logicalReasoning, metaCognition）
- 思考分析ツール（swotAnalysis, analysis5W1H, causeEffectAnalysis, mindMap, socraticQuestioning, sixThinkingHats）
- 高度な思考ツール（dialecticalThinking, detectCognitiveBiases, decisionMatrix, scenarioPlanning, mentalModels）
- 思考チェーンツール（problemAnalysisChain, strategicThinkingChain, creativeThinkingChain, criticalThinkingChain, learningOptimizationChain）
- フレームワーク関連ツール（listFrameworks, getFrameworkDetails, executeFramework）
- MCP連携関連ツール（getMCPServices, getMCPIntegrationInfo）

## 開発情報

### ディレクトリ構造

```
deep-think-commander/
  ├── enhanced-index-v3.js    # メインサーバーファイル
  ├── package.json            # パッケージ情報
  ├── README.md               # このファイル
  ├── utils/                  # ユーティリティモジュール
  │   ├── thinking-utils.js   # 基本思考ユーティリティ
  │   ├── thinking-tools.js   # 思考ツール実装
  │   ├── advanced-thinking.js # 高度な思考ツール
  │   ├── thought-chain.js    # 思考チェーン実装
  │   ├── debug-utility.js    # デバッグユーティリティ
  │   ├── mcp-communicator.js # MCP間連携機能
  │   └── multi-stage-analysis.js # 多段階分析機能
  └── logs/                   # ログディレクトリ
```

### 依存パッケージ

- @modelcontextprotocol/sdk: MCP SDKライブラリ

## ライセンス

MIT
