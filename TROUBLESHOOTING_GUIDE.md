# Claude Desktop MCP接続エラー トラブルシューティングガイド

## 発生したエラー

以下のMCPサーバーで接続エラーが発生していました：

1. `web_research` - Could not attach to MCP server
2. `deep_think` - Server disconnected
3. `memory-bank` - Could not attach to MCP server

## 原因分析

### 1. ファイルパスの問題
- `enhanced-index-v4.js` が不完全（1432バイトのみ）
- `simple-web-research.js` よりも `enhanced-web-research.js` の方が安定

### 2. ポート競合
- 複数のnodeプロセスが実行中
- ポート3008の競合の可能性

### 3. 依存関係の問題
- `memory-bank` パッケージの依存関係エラー

## 修正内容

### 作成した設定ファイル

1. **`minimal_claude_desktop_config.json`** - 最小限の設定
   - `filesystem` - ファイルシステムアクセス
   - `enhanced_file_commander` - ファイル操作

2. **`stable_claude_desktop_config.json`** - 安定版設定
   - 上記に加えて：
   - `playwright` - ブラウザ自動化
   - `powershell-commander` - PowerShellコマンド実行

3. **`full_fixed_claude_desktop_config.json`** - 完全版設定
   - 上記に加えて：
   - `deep_think` - より安定した `enhanced-index.js` を使用
   - `web_research` - より安定した `enhanced-web-research.js` を使用

### 削除したサーバー
- `memory-bank` - 依存関係エラーの原因
- `toolbox` - 不要なサーバー

## 推奨適用手順

### ステップ1: 最小限の設定でテスト
```powershell
.\apply_fixed_claude_config.ps1
# 選択: 1 (最小限の設定)
```

### ステップ2: 動作確認
Claude Desktopを起動して以下を確認：
- エラーメッセージが表示されないこと
- ファイルシステムアクセスが動作すること
- enhanced_file_commanderが利用可能であること

### ステップ3: 段階的に機能追加
問題がなければ、安定版設定（選択: 2）を試し、最終的に完全版設定（選択: 3）を適用

## 手動修正方法

### 1. 実行中プロセスの終了
```powershell
# Claude Desktopを終了
Stop-Process -Name "Claude" -Force

# 実行中のnodeプロセスを終了
Stop-Process -Name "node" -Force
```

### 2. 設定ファイルの手動適用
```powershell
# バックアップ作成
Copy-Item "$env:APPDATA\Claude\claude_desktop_config.json" "$env:APPDATA\Claude\claude_desktop_config.json.backup"

# 最小限の設定を適用
Copy-Item ".\minimal_claude_desktop_config.json" "$env:APPDATA\Claude\claude_desktop_config.json"
```

### 3. Claude Desktopの再起動
```powershell
Start-Process "Claude"
```

## 各設定レベルの特徴

### レベル1: 最小限（推奨開始点）
- **安定性**: 最高
- **機能**: 基本的なファイル操作
- **リスク**: 最低

### レベル2: 安定版
- **安定性**: 高
- **機能**: ブラウザ自動化 + PowerShell実行
- **リスク**: 低

### レベル3: 完全版
- **安定性**: 中
- **機能**: 思考分析 + Web検索
- **リスク**: 中（ポート競合の可能性）

## よくある問題と解決方法

### Q: "Could not attach to MCP server" エラーが表示される
**A**: 以下を確認してください：
1. ファイルパスが正しいか
2. 実行中のnodeプロセスがないか
3. ポート競合がないか

### Q: サーバーが頻繁に切断される
**A**: より安定したファイルを使用してください：
- `enhanced-index.js` (deep_think用)
- `enhanced-web-research.js` (web_research用)

### Q: ポート3008が使用中エラー
**A**: 以下のコマンドでポートを確認し、必要に応じてプロセスを終了：
```powershell
netstat -an | findstr :3008
```

## 復旧方法

問題が発生した場合は、バックアップから復旧できます：

```powershell
Copy-Item "$env:APPDATA\Claude\claude_desktop_config.json.backup" "$env:APPDATA\Claude\claude_desktop_config.json" -Force
```

## 推奨設定

初回セットアップでは**レベル1（最小限）**から開始し、動作確認後に段階的にレベルを上げることを強く推奨します。 