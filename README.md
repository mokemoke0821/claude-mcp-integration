# Claude Code + GitHub Actions統合

## 🎯 概要
Claude Code（ローカル開発）とgrll/claude-code-action（GitHub Actions）を連携させた統合開発環境

## 🚀 セットアップ

### 1. 初期セットアップ
```bash
npm install
npm run setup
```

### 2. GitHub設定
1. GitHubリポジトリ作成・プッシュ
2. [Claude GitHub App](https://github.com/apps/claude) インストール
3. GitHub Secretsに以下を設定：
   - `CLAUDE_ACCESS_TOKEN`
   - `CLAUDE_REFRESH_TOKEN` 
   - `CLAUDE_EXPIRES_AT`

### 3. 同期確認
```bash
npm run sync
```

## 📋 使用方法

### ローカル開発
```bash
# Claude Codeチャット開始
npm run claude:local

# または直接
claude-code --chat
```

### GitHub連携
PR・Issueで `@claude` をメンション：

```
@claude このコードをレビューして改善提案をしてください
@claude バグを修正してください
@claude 新機能を実装してください
```

## 🔄 統合フロー
1. **ローカル**: Claude Codeで開発・テスト
2. **プッシュ**: GitHubに変更をプッシュ
3. **自動化**: GitHub ActionsでClaude実行
4. **同期**: 結果をローカルに反映

## 🧪 テスト
```bash
npm run sync test
```

## 🛠️ トラブルシューティング
- Claude Code未検出 → インストール確認
- GitHub認証エラー → Secrets設定確認
- 同期エラー → `npm run sync` 再実行 

# 🚀 Claude MCP Server Integration

Claude Desktop App用のMCP（Model Context Protocol）サーバー統合プロジェクト

## 📊 プロジェクト統計
- **ファイル数**: 174
- **コード行数**: 51,135
- **統合済みMCPサーバー**: 3

## ✅ 統合済みMCPサーバー
1. **filesystem** - ファイルシステム操作（npx経由）
2. **enhanced-development-commander** - 開発支援ツール
3. **enhanced-file-commander** - ファイル管理ツール

## 🔧 主な機能
- 完全自動化されたGitHub Actions CI/CD
- Claude Desktop App設定の最適化
- エラー診断ツール完備
- @claudeメンション対応（Claude GitHub App必要）

## 📝 セットアップ
1. リポジトリをクローン
2. `npm install` 実行
3. MCP設定ファイルを適用

## ⚙️ GitHub Actions
- **自動テスト**: プッシュ時に自動実行
- **Claude統合**: @claudeメンションで自動応答

---
*最終更新: 2025-05-31 - GitHub Actions統合完了* 🎉 