# Claude Desktop設定ファイル修正手順

## 問題の概要

以下のエラーが発生していました：

1. **desktop-commander**: `Cannot read properties of undefined (reading 'join')` - パス関連のエラー
2. **mastra-ai**: `Cannot find module '@mastra/core'` - 依存関係が見つからない
3. **file-commander と enhanced_file_commander**: stdioで実行中

## 修正内容

### 削除したサーバー
- `desktop-commander` - パス関連のエラーの原因
- `toolbox` - 不要なサーバー

### 追加したサーバー
- `enhanced_file_commander` - ローカルファイル操作
- `powershell-commander` - PowerShellコマンド実行
- `deep_think` - 思考分析ツール
- `web_research` - Web検索機能

## 適用手順

### 1. Claude Desktopを停止
Claude Desktopアプリケーションを完全に終了してください。

### 2. 設定ファイルのバックアップ
```powershell
Copy-Item "$env:APPDATA\Claude\claude_desktop_config.json" "$env:APPDATA\Claude\claude_desktop_config.json.backup"
```

### 3. 新しい設定ファイルの適用
`corrected_claude_desktop_config.json`の内容を`$env:APPDATA\Claude\claude_desktop_config.json`にコピーしてください。

### 4. Claude Desktopを再起動
Claude Desktopアプリケーションを起動してください。

## 修正後の設定内容

### 保持されたサーバー
- `filesystem` - ファイルシステムアクセス
- `playwright` - ブラウザ自動化
- `memory-bank` - メモリ管理

### 新規追加されたサーバー
- `enhanced_file_commander` - 高度なファイル操作
- `powershell-commander` - PowerShellコマンド実行
- `deep_think` - 思考分析と問題解決
- `web_research` - Web検索とリサーチ

## 確認方法

Claude Desktop起動後、以下を確認してください：

1. エラーログが表示されないこと
2. MCPサーバーが正常に起動すること
3. 各ツールが利用可能であること

## トラブルシューティング

### ファイルが見つからないエラーが発生した場合
以下のコマンドでファイルの存在を確認してください：

```powershell
Test-Path "C:\Users\81902\OneDrive\Documents\Cline\MCP\enhanced-file-commander\src\simple-server.js"
Test-Path "C:\Users\81902\OneDrive\Documents\Cline\MCP\powershell-commander\src\index.js"
Test-Path "C:\Users\81902\OneDrive\Documents\Cline\MCP\deep-think-commander\enhanced-index-v4.js"
Test-Path "C:\Users\81902\OneDrive\Documents\Cline\MCP\web-research-commander\simple-web-research.js"
```

すべて`True`が返されることを確認してください。

### ポート競合エラーが発生した場合
`web_research`サーバーはポート3008を使用します。他のアプリケーションがこのポートを使用していないことを確認してください：

```powershell
netstat -an | findstr :3008
```

## 注意事項

- Enhanced Claude MCP Bridgeが実行されている場合は、それを停止してからClaude Desktopを使用してください
- 設定変更後は必ずClaude Desktopを再起動してください
- エラーが発生した場合は、バックアップファイルから元の設定に戻すことができます 