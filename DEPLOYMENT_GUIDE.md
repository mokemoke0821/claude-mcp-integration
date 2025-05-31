# 🚀 Claude Code + GitHub Actions統合環境 運用開始ガイド

## ✅ 現在の状況
基本的な統合環境の構築が完了しました！

## 🎯 運用開始までの手順

### Phase 1: 統合テスト実行 (今すぐ実行可能)
```bash
npm run test:integration
```
このコマンドで環境の準備状況を確認できます。

### Phase 2: GitHub準備 

#### 2.1 GitHub CLIインストール (推奨)
```bash
# Windows (PowerShell)
winget install GitHub.cli

# インストール後
gh auth login
```

#### 2.2 GitHubリポジトリ作成 (手動)
1. **GitHub.com でリポジトリ作成**
   - Repository name: `claude-code-action-integration`
   - Visibility: Public (推奨) または Private
   - Initialize: チェックしない（既存プロジェクトがあるため）

2. **ローカルとリポジトリ接続**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/claude-code-action-integration.git
   git branch -M main
   git push -u origin main
   ```

### Phase 3: Claude GitHub App設定

#### 3.1 Appインストール
```bash
# インストール状況確認
npm run verify:github-app
```

**手動インストール**:
1. https://github.com/apps/claude にアクセス
2. "Install" ボタンクリック
3. リポジトリ選択: `claude-code-action-integration`
4. "Install & Authorize" 実行

#### 3.2 権限確認
以下の権限が必要です：
- ✅ Contents: Read and write
- ✅ Issues: Read and write  
- ✅ Pull requests: Read and write
- ✅ Metadata: Read

### Phase 4: Claude認証設定

#### 4.1 認証情報取得
```bash
npm run get:credentials
```

#### 4.2 GitHub Secrets設定
1. **Secretsページアクセス**
   ```
   https://github.com/YOUR_USERNAME/claude-code-action-integration/settings/secrets/actions
   ```

2. **以下のSecretsを追加**
   - `CLAUDE_ACCESS_TOKEN`
   - `CLAUDE_REFRESH_TOKEN`  
   - `CLAUDE_EXPIRES_AT`

   詳細手順: `GITHUB_SECRETS_SETUP.md` 参照

#### 4.3 設定確認
```bash
npm run verify:secrets
```

### Phase 5: 運用テスト

#### 5.1 基本動作確認
```bash
npm run sync
```

#### 5.2 GitHub Actions動作テスト
1. **テストIssue作成**
   ```markdown
   タイトル: Claude統合テスト
   
   内容:
   @claude こんにちは！統合テストです。
   
   このIssueで GitHub Actions が正常に動作するか確認してください。
   簡単な挨拶とシステム状況を教えてください。
   ```

2. **結果確認**
   - Actions タブで実行状況確認
   - Issue にClaudeからの返信確認

## 🎮 実際の使用方法

### ローカル開発
```bash
# Claude Codeチャット（インストール済みの場合）
npm run claude:local

# プロジェクト状況確認
npm run sync
```

### GitHub上での自動化

#### Issue・PRでの指示
```markdown
@claude このコードをレビューして改善提案をしてください
@claude バグを修正してください  
@claude この機能を実装してください
@claude テストケースを追加してください
@claude ドキュメントを更新してください
```

#### PR作成での自動レビュー
```bash
# 新しいブランチ作成
git checkout -b feature/new-feature

# コード変更・コミット
git add . && git commit -m "feat: 新機能追加"
git push origin feature/new-feature

# PR作成時に以下を記載
@claude このPRをレビューして、コード品質とセキュリティを確認してください
```

## 🔧 日常運用コマンド

### 開発開始時
```bash
npm run sync           # 統合状況確認
git pull origin main   # 最新取得
```

### デプロイ時
```bash
git add .
git commit -m "feat: 新機能追加"
npm run deploy         # git push origin main
```

### メンテナンス時
```bash
npm run test:integration    # 全体テスト
npm run verify:secrets     # 認証確認
npm run get:credentials    # 認証更新（必要時）
```

## 🚨 トラブルシューティング

### よくある問題

#### 1. GitHub Actions が実行されない
```bash
# 確認手順
npm run verify:github-app  # App インストール確認
npm run verify:secrets     # Secrets 確認

# 解決策
# 1. Claude GitHub App 再インストール
# 2. Secrets 再設定
# 3. リポジトリ権限確認
```

#### 2. 認証エラー
```bash
# 確認・解決
npm run get:credentials    # 新しい認証情報取得
# → GitHub Secrets で値を更新
```

#### 3. ローカル同期エラー
```bash
npm run setup             # 設定ファイル再生成
npm run sync              # 同期状況再確認
```

## 📈 段階的活用案

### Level 1: 基本活用
- Issue での質問・相談
- PR での基本レビュー
- 簡単なコード生成

### Level 2: 中級活用  
- 複雑なコードレビュー
- バグ修正・リファクタリング
- テスト自動生成

### Level 3: 高度活用
- アーキテクチャ設計相談
- 包括的品質チェック
- ドキュメント自動生成

## 🎯 次のステップ

運用開始後は以下を検討：

1. **カスタム指示調整**
   - プロジェクト固有の要件追加
   - チーム規約の反映

2. **ワークフロー最適化**
   - 自動テスト統合
   - デプロイメント自動化

3. **チーム展開**
   - 使用方法の共有
   - ベストプラクティス策定

---

## 🎉 運用開始！

これで Claude Code（ローカル） + GitHub Actions（クラウド）の完全統合環境が運用開始できます！

**まずは以下から始めてください：**
```bash
npm run test:integration  # 統合テスト実行
npm run get:credentials   # 認証情報確認
```

効率的で楽しい AI 駆動開発をお楽しみください！ 🚀 