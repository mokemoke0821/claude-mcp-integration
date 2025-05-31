# 🎯 Claude MCP環境整備 手動作業ガイド

## ⚠️ **重要事項**
このガイドは **手動実行が必要** な作業手順を示しています。  
AI編集ツールでは設定ファイルの直接編集ができないため、以下の手順に従って手動で実行してください。

---

## 📋 **1. 環境診断の実行**

### PowerShellで診断システムを実行
```powershell
# 診断システムの読み込み
. .\claude-mcp-diagnostics.ps1

# 環境診断の実行
claude-check
```

**期待される出力:**
- ✅ 設定ファイル発見
- ✅ 設定済みMCPサーバー数: 4
- ❌ enhanced-filesystem-security: ファイル不存在

---

## 🔧 **2. 設定ファイルの手動修正**

### **STEP 1: バックアップの作成**
```powershell
# 現在の設定をバックアップ
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item "$env:APPDATA\Claude\claude_desktop_config.json" "$env:APPDATA\Claude\claude_desktop_config_backup_$timestamp.json"
Write-Host "✅ バックアップ作成完了: claude_desktop_config_backup_$timestamp.json"
```

### **STEP 2: 設定ファイルの編集**

**修正対象ファイル:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**現在の設定（問題あり）:**
```json
{
  "mcpServers": {
    "enhanced-file-commander": { ... },
    "filesystem": { ... },
    "enhanced-development-commander": { ... },
    "enhanced-filesystem-security": {  // ← この部分を削除
      "args": ["...path.../enhanced-filesystem-security/build/index.js"],
      "command": "node",
      "env": { "NODE_ENV": "production" }
    }
  }
}
```

**修正後の設定:**
```json
{
  "mcpServers": {
    "enhanced-file-commander": {
      "args": [
        "C:/Users/81902/OneDrive/Documents/Cline/MCP/enhanced-file-commander/build/index.js"
      ],
      "command": "node",
      "env": {
        "NODE_ENV": "production"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\Users\\81902\\OneDrive\\Documents\\Cline\\MCP"
      ]
    },
    "enhanced-development-commander": {
      "args": [
        "C:/Users/81902/OneDrive/Documents/Cline/MCP/enhanced-development-commander/build/index.js"
      ],
      "command": "node",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### **STEP 3: 自動修正ツールの使用（推奨）**
```powershell
# 自動修正ツールを実行
claude-config

# プロンプトに 'y' と入力して修正を適用
```

---

## 🚀 **3. Claude Desktop Appの再起動**

### **STEP 1: Claude Desktop App の完全停止**
```powershell
# プロセスの強制終了
Get-Process -Name "Claude" -ErrorAction SilentlyContinue | Stop-Process -Force

# 少し待機
Start-Sleep -Seconds 3
```

### **STEP 2: Claude Desktop App の起動**
1. Windowsスタートメニューから「Claude」を検索
2. Claude Desktop Appを起動
3. アプリが正常に起動するまで待機

---

## ✅ **4. 動作確認チェックリスト**

### **4.1 Claude Desktop App 内での確認**
- [ ] Claude Desktop Appが正常に起動する
- [ ] エラーダイアログが表示されない
- [ ] MCP接続インジケーターが正常（緑色）

### **4.2 MCP機能の確認**
Claude内で以下を試行：
- [ ] ファイル操作コマンドが動作する
- [ ] filesystem MCPが応答する
- [ ] enhanced-file-commander機能が利用可能
- [ ] enhanced-development-commander機能が利用可能

### **4.3 PowerShellでの最終確認**
```powershell
# 最終診断の実行
claude-check

# 期待される結果:
# ✅ 設定済みMCPサーバー数: 3
# ✅ 全ファイル存在確認
# ✅ 重大な問題は検出されませんでした
```

---

## 🛠️ **5. トラブルシューティング**

### **問題: Claude Desktop Appが起動しない**
**解決策:**
1. 設定ファイルの構文チェック
```powershell
$config = Get-Content "$env:APPDATA\Claude\claude_desktop_config.json" | ConvertFrom-Json
$config | ConvertTo-Json -Depth 10
```
2. 構文エラーがある場合、バックアップから復元

### **問題: MCP機能が動作しない**
**解決策:**
1. ファイルパスの確認
```powershell
Test-Path "C:/Users/81902/OneDrive/Documents/Cline/MCP/enhanced-file-commander/build/index.js"
Test-Path "C:/Users/81902/OneDrive/Documents/Cline/MCP/enhanced-development-commander/build/index.js"
```
2. Node.jsのインストール確認
```powershell
node --version
```

### **問題: 設定修正後もエラーが発生**
**解決策:**
1. 完全な設定リセット
```powershell
# 最小限の設定で開始
Copy-Item ".\minimal_claude_desktop_config.json" "$env:APPDATA\Claude\claude_desktop_config.json"
```

---

## 📊 **6. 完了確認レポート**

修正完了後、以下のコマンドで最終レポートを生成：

```powershell
# 完全な環境レポート生成
claude-check | Out-File -FilePath "claude_mcp_final_report.txt" -Encoding UTF8
Write-Host "✅ 最終レポートを生成しました: claude_mcp_final_report.txt"
```

---

## 🎯 **重要な注意事項**

1. **バックアップは必須** - 設定変更前に必ずバックアップを作成
2. **Claude完全再起動** - 設定変更後は必ずClaudeを完全に再起動
3. **段階的確認** - 各ステップ後に動作確認を実施
4. **問題発生時** - 迷わずバックアップから復元

---

**🎯 この手順書に従って、Claude MCP環境を安全に整備してください。** 