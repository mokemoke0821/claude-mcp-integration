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