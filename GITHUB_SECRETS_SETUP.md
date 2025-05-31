# GitHub Secrets設定ガイド

## 🔐 設定手順

### 1. リポジトリのSecretsページにアクセス
```
https://github.com/[username]/claude-code-action-integration/settings/secrets/actions
```

### 2. 以下のSecretsを追加

#### CLAUDE_ACCESS_TOKEN
- **Name**: `CLAUDE_ACCESS_TOKEN`
- **Secret**: `[npm run get:credentials で取得した access_token]`
- **説明**: Claude APIアクセス用の認証トークン

#### CLAUDE_REFRESH_TOKEN  
- **Name**: `CLAUDE_REFRESH_TOKEN`
- **Secret**: `[npm run get:credentials で取得した refresh_token]`
- **説明**: トークン更新用のリフレッシュトークン

#### CLAUDE_EXPIRES_AT
- **Name**: `CLAUDE_EXPIRES_AT`
- **Secret**: `[npm run get:credentials で取得した expires_at]`
- **説明**: トークンの有効期限（Unix timestamp）

## 📋 詳細設定手順

### Step 1: 認証情報取得
```bash
npm run get:credentials
```

### Step 2: GitHub Secretsページアクセス
1. GitHubリポジトリページに移動
2. 「Settings」タブをクリック
3. 左サイドバーの「Secrets and variables」→「Actions」をクリック

### Step 3: Secret追加
各Secretについて以下を実行：
1. 「New repository secret」ボタンをクリック
2. 「Name」フィールドに Secret名を入力
3. 「Secret」フィールドに取得した値を入力
4. 「Add secret」ボタンをクリック

## ✅ 設定確認

設定完了後、以下で確認：
```bash
npm run verify:secrets
```

## 🔄 トークン更新

### 自動更新（推奨）
grll/claude-code-actionはOAuth認証を使用して自動でトークンを更新します。

### 手動更新（必要時）
1. `npm run get:credentials` で新しい値を取得
2. GitHub Secretsページで値を更新
3. `npm run verify:secrets` で確認

## 🚨 セキュリティ注意事項

### 機密情報の取り扱い
- ✅ GitHub Secretsでのみ保存
- ❌ コードに直接記載しない
- ❌ ログファイルに出力しない
- ❌ 公開リポジトリのIssue/PRに記載しない

### アクセス管理
- 必要最小限の権限のみ付与
- 定期的なアクセス監査実施
- 不要になったら即座に削除

### 有効期限管理
- 定期的な期限確認（推奨：月1回）
- 期限切れ前の更新実施
- 自動更新機能の動作確認

## 🛠️ トラブルシューティング

### 認証エラーが発生する場合
1. **Secret名の確認**
   - 大文字・小文字の正確性
   - スペースや特殊文字の有無

2. **Secret値の確認**
   - コピー・ペースト時の改行混入
   - 文字数・形式の正確性

3. **権限の確認**
   - リポジトリのSecret設定権限
   - GitHub Appの認証状態

### エラー別対処法

#### `401 Unauthorized`
```bash
# 認証情報の再取得
npm run get:credentials

# Secretsの再設定
# → GitHub Secretsページで値を更新
```

#### `403 Forbidden`
```bash
# GitHub App権限確認
npm run verify:github-app

# リポジトリアクセス権限確認
# → https://github.com/settings/installations
```

#### `Token expired`
```bash
# 自動更新確認（通常は自動実行）
# 手動更新が必要な場合のみ：
npm run get:credentials
# → 新しい値でSecrets更新
```

## 📊 設定状況確認

### 設定完了チェックリスト
- [ ] CLAUDE_ACCESS_TOKEN 設定済み
- [ ] CLAUDE_REFRESH_TOKEN 設定済み  
- [ ] CLAUDE_EXPIRES_AT 設定済み
- [ ] GitHub App インストール済み
- [ ] 統合テスト成功

### 確認コマンド
```bash
# 全体確認
npm run test:integration

# 個別確認
npm run verify:secrets
npm run verify:github-app
npm run sync
```

---

## 🎯 設定完了後の次のステップ

1. **テストIssue作成**
   ```markdown
   @claude こんにちは！統合テストです。
   
   このIssueで GitHub Actions が正常に動作するか確認してください。
   ```

2. **テストPR作成**
   ```bash
   # 新しいブランチ作成
   git checkout -b test/claude-integration
   
   # テストファイル作成
   echo "# Claude統合テスト" > test-claude-integration.md
   git add . && git commit -m "test: Claude統合テスト用ファイル追加"
   git push origin test/claude-integration
   
   # PRでClaudeメンション
   @claude このPRをレビューして改善提案をお願いします
   ```

3. **本格運用開始**
   - 実際の開発ワークフローでの活用
   - チーム内での使用方法共有
   - カスタム指示の調整・最適化 