# Enhanced Development Commander - ツールリファレンス

## 🚀 概要

Enhanced Development Commanderは、開発者向けの高性能MCPサーバーです。Git操作、プロジェクト分析、コードテンプレート生成、環境管理など、12個の実用的なツールを提供します。

## 🛠️ 利用可能なツール

### 📂 Git統合ツール (6個)

#### 1. `git_status_enhanced`
**説明**: 拡張Gitステータス表示
**パラメータ**:
- `workingDir` (オプション): 作業ディレクトリパス

**使用例**:
```json
{
  "name": "git_status_enhanced",
  "arguments": {}
}
```

#### 2. `git_commit_smart`
**説明**: スマートコミット機能（自動メッセージ生成対応）
**パラメータ**:
- `message` (オプション): コミットメッセージ
- `autoGenerate` (boolean): 自動メッセージ生成
- `type` (enum): コミットタイプ (feat, fix, docs, style, refactor, test, chore)

**使用例**:
```json
{
  "name": "git_commit_smart",
  "arguments": {
    "autoGenerate": true,
    "type": "feat"
  }
}
```

#### 3. `git_branch_manager`
**説明**: ブランチ管理（作成、切り替え、一覧、削除）
**パラメータ**:
- `action` (必須): create, switch, list, delete
- `branchName` (条件付き): ブランチ名

**使用例**:
```json
{
  "name": "git_branch_manager",
  "arguments": {
    "action": "create",
    "branchName": "feature/new-feature"
  }
}
```

#### 4. `git_history_explorer`
**説明**: コミット履歴表示
**パラメータ**:
- `limit` (オプション): 表示件数（デフォルト: 10）

**使用例**:
```json
{
  "name": "git_history_explorer",
  "arguments": {
    "limit": 20
  }
}
```

#### 5. `git_diff_analyzer`
**説明**: Git差分分析
**パラメータ**:
- `staged` (boolean): ステージ済み変更を表示（デフォルト: false）

**使用例**:
```json
{
  "name": "git_diff_analyzer",
  "arguments": {
    "staged": true
  }
}
```

#### 6. `git_stash_manager`
**説明**: スタッシュ管理
**パラメータ**:
- `action` (必須): stash, unstash
- `message` (オプション): スタッシュメッセージ

**使用例**:
```json
{
  "name": "git_stash_manager",
  "arguments": {
    "action": "stash",
    "message": "WIP: working on feature"
  }
}
```

### 📊 プロジェクト分析ツール (4個)

#### 7. `analyze_project_structure`
**説明**: プロジェクト構造・依存関係・メトリクス分析
**パラメータ**:
- `projectPath` (オプション): プロジェクトディレクトリパス

**使用例**:
```json
{
  "name": "analyze_project_structure",
  "arguments": {
    "projectPath": "./my-project"
  }
}
```

#### 8. `analyze_code_performance`
**説明**: コード品質・パフォーマンス分析
**パラメータ**:
- `filePath` (必須): 分析対象ファイルパス

**使用例**:
```json
{
  "name": "analyze_code_performance",
  "arguments": {
    "filePath": "./src/components/App.tsx"
  }
}
```

#### 9. `find_dead_code`
**説明**: 未使用コード検出
**パラメータ**:
- `projectPath` (オプション): プロジェクトディレクトリパス

**使用例**:
```json
{
  "name": "find_dead_code",
  "arguments": {}
}
```

#### 10. `dependency_analyzer`
**説明**: 依存関係分析
**パラメータ**:
- `projectPath` (オプション): プロジェクトディレクトリパス

**使用例**:
```json
{
  "name": "dependency_analyzer",
  "arguments": {}
}
```

### 📝 テンプレート生成ツール (2個)

#### 11. `generate_code_template`
**説明**: コードテンプレート生成
**パラメータ**:
- `type` (必須): component, function, class, test, api
- `name` (必須): 生成するコード名
- `language` (オプション): typescript, javascript, react, node

**使用例**:
```json
{
  "name": "generate_code_template",
  "arguments": {
    "type": "component",
    "name": "UserProfile",
    "language": "typescript"
  }
}
```

#### 12. `suggest_commit_message`
**説明**: コミットメッセージ提案
**パラメータ**:
- `type` (オプション): feat, fix, docs, style, refactor, test, chore
- `description` (オプション): 変更内容の説明

**使用例**:
```json
{
  "name": "suggest_commit_message",
  "arguments": {
    "type": "feat",
    "description": "add user authentication"
  }
}
```

## 🎯 実用的な使用シナリオ

### シナリオ1: 新機能開発フロー
1. `git_branch_manager` でfeatureブランチ作成
2. `generate_code_template` でコンポーネント生成
3. `analyze_code_performance` でコード品質チェック
4. `git_status_enhanced` で変更確認
5. `git_commit_smart` で自動コミット

### シナリオ2: プロジェクト健康診断
1. `analyze_project_structure` で全体分析
2. `dependency_analyzer` で依存関係チェック
3. `find_dead_code` で不要コード検出
4. `analyze_code_performance` で個別ファイル分析

### シナリオ3: Git操作効率化
1. `git_status_enhanced` で現状把握
2. `git_diff_analyzer` で変更内容確認
3. `suggest_commit_message` でメッセージ生成
4. `git_commit_smart` でコミット実行

## 🔧 技術仕様

- **言語**: TypeScript/Node.js
- **依存関係**: simple-git, glob, fast-glob
- **プライバシー**: 完全ローカル処理
- **パフォーマンス**: 高速レスポンス
- **エラーハンドリング**: 包括的エラー処理

## 📋 セットアップ要件

1. Node.js 18+ 
2. TypeScript 5+
3. Git（Git機能使用時）
4. Claude Desktop

## 🚀 パフォーマンス特性

- **応答時間**: < 1秒
- **メモリ使用量**: 軽量
- **CPU使用率**: 最小限
- **ネットワーク**: 不要（完全ローカル）

## 💡 ベストプラクティス

1. **Git操作**: 作業前に`git_status_enhanced`で状況確認
2. **コード分析**: 定期的な`analyze_project_structure`実行
3. **テンプレート**: プロジェクト規約に合わせてカスタマイズ
4. **エラー処理**: エラーメッセージを確認して適切に対応

## 🔄 更新履歴

- **v1.0.0**: 初回リリース - 12個のツール実装完了
- Git統合、プロジェクト分析、テンプレート生成機能
- 完全ローカル処理、高速レスポンス実現 