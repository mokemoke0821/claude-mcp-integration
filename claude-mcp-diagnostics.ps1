# ================================================================
# 🎯 Claude MCP 環境診断システム
# ================================================================
# PowerShellプロファイルに追加することで、claude-check コマンドが利用可能になります
# 使用方法: claude-check
# ================================================================

function Invoke-ClaudeMCPDiagnostics {
  [CmdletBinding()]
  param()
    
  Write-Host "🔍 Claude MCP環境診断開始..." -ForegroundColor Yellow
  Write-Host "=" * 60 -ForegroundColor Cyan
    
  # 設定ファイルパス
  $configPath = "$env:APPDATA\Claude\claude_desktop_config.json"
  $mcpBasePath = "C:\Users\81902\OneDrive\Documents\Cline\MCP"
    
  # 1. 設定ファイル確認
  Write-Host "`n📋 設定ファイル診断" -ForegroundColor Cyan
  if (Test-Path $configPath) {
    Write-Host "✅ 設定ファイル発見: $configPath" -ForegroundColor Green
    try {
      $config = Get-Content $configPath -Raw | ConvertFrom-Json
      $serverCount = $config.mcpServers.PSObject.Properties.Count
      Write-Host "✅ 設定済みMCPサーバー数: $serverCount" -ForegroundColor Green
            
      # 各サーバーの詳細確認
      Write-Host "`n📊 設定済みサーバー一覧:" -ForegroundColor White
      foreach ($server in $config.mcpServers.PSObject.Properties) {
        Write-Host "  • $($server.Name)" -ForegroundColor Yellow
        $serverConfig = $server.Value
        if ($serverConfig.args -and $serverConfig.args[0]) {
          $serverPath = $serverConfig.args[0]
          if (Test-Path $serverPath) {
            Write-Host "    ✅ ファイル存在: $serverPath" -ForegroundColor Green
          }
          else {
            Write-Host "    ❌ ファイル不存在: $serverPath" -ForegroundColor Red
          }
        }
      }
    }
    catch {
      Write-Host "❌ 設定ファイル解析エラー: $($_.Exception.Message)" -ForegroundColor Red
    }
  }
  else {
    Write-Host "❌ 設定ファイルが見つかりません: $configPath" -ForegroundColor Red
  }
    
  # 2. MCPディレクトリ確認
  Write-Host "`n📁 MCPディレクトリ診断" -ForegroundColor Cyan
  if (Test-Path $mcpBasePath) {
    Write-Host "✅ MCPベースディレクトリ発見: $mcpBasePath" -ForegroundColor Green
        
    # 利用可能なMCPサーバー確認
    $availableServers = @(
      "enhanced-file-commander",
      "enhanced-development-commander",
      "enhanced-filesystem-security",
      "powershell-commander",
      "deep-think-commander"
    )
        
    Write-Host "`n🔍 利用可能なMCPサーバー確認:" -ForegroundColor White
    foreach ($server in $availableServers) {
      $serverDir = Join-Path $mcpBasePath $server
      $indexFile = Join-Path $serverDir "build\index.js"
            
      if (Test-Path $serverDir) {
        Write-Host "  📁 $server ディレクトリ: 存在" -ForegroundColor Yellow
        if (Test-Path $indexFile) {
          Write-Host "    ✅ build/index.js: 存在" -ForegroundColor Green
        }
        else {
          Write-Host "    ❌ build/index.js: 不存在" -ForegroundColor Red
          # package.json確認
          $packageFile = Join-Path $serverDir "package.json"
          if (Test-Path $packageFile) {
            Write-Host "    💡 package.json存在 - ビルドが必要な可能性" -ForegroundColor Magenta
          }
        }
      }
      else {
        Write-Host "  ❌ $server ディレクトリ: 不存在" -ForegroundColor Red
      }
    }
  }
  else {
    Write-Host "❌ MCPベースディレクトリが見つかりません: $mcpBasePath" -ForegroundColor Red
  }
    
  # 3. 問題点の特定
  Write-Host "`n⚠️  問題点分析" -ForegroundColor Cyan
  $issues = @()
    
  # Enhanced Filesystem Security確認
  $efsPath = Join-Path $mcpBasePath "enhanced-filesystem-security"
  if (-not (Test-Path $efsPath)) {
    $issues += "enhanced-filesystem-security ディレクトリが存在しないにも関わらず、設定ファイルで参照されています"
  }
    
  if ($issues.Count -eq 0) {
    Write-Host "✅ 重大な問題は検出されませんでした" -ForegroundColor Green
  }
  else {
    foreach ($issue in $issues) {
      Write-Host "❌ $issue" -ForegroundColor Red
    }
  }
    
  # 4. 推奨事項
  Write-Host "`n💡 推奨事項" -ForegroundColor Cyan
  Write-Host "1. enhanced-filesystem-security が設定されているが存在しません" -ForegroundColor Yellow
  Write-Host "2. 設定ファイルから未存在のサーバーを削除することを推奨" -ForegroundColor Yellow
  Write-Host "3. 'claude-config' コマンドで安全な設定更新が可能です" -ForegroundColor Yellow
    
  Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
  Write-Host "🎯 診断完了" -ForegroundColor Green
}

function Invoke-ClaudeConfigFix {
  [CmdletBinding()]
  param()
    
  Write-Host "🔧 Claude設定修正ツール" -ForegroundColor Yellow
    
  $configPath = "$env:APPDATA\Claude\claude_desktop_config.json"
  $backupPath = "$env:APPDATA\Claude\claude_desktop_config_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
    
  if (Test-Path $configPath) {
    # バックアップ作成
    Copy-Item $configPath $backupPath
    Write-Host "✅ バックアップ作成: $backupPath" -ForegroundColor Green
        
    # 修正版設定の提案
    $fixedConfig = @{
      mcpServers = @{
        "enhanced-file-commander"        = @{
          args    = @("C:/Users/81902/OneDrive/Documents/Cline/MCP/enhanced-file-commander/build/index.js")
          command = "node"
          env     = @{
            "NODE_ENV" = "production"
          }
        }
        filesystem                       = @{
          command = "npx"
          args    = @(
            "-y",
            "@modelcontextprotocol/server-filesystem",
            "C:\Users\81902\OneDrive\Documents\Cline\MCP"
          )
        }
        "enhanced-development-commander" = @{
          args    = @("C:/Users/81902/OneDrive/Documents/Cline/MCP/enhanced-development-commander/build/index.js")
          command = "node"
          env     = @{
            "NODE_ENV" = "production"
          }
        }
      }
    }
        
    $jsonOutput = $fixedConfig | ConvertTo-Json -Depth 10
    Write-Host "`n📋 修正版設定（enhanced-filesystem-security を削除済み）:" -ForegroundColor Cyan
    Write-Host $jsonOutput -ForegroundColor White
        
    $confirm = Read-Host "`n設定ファイルを修正しますか？ (y/N)"
    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
      $jsonOutput | Set-Content $configPath -Encoding UTF8
      Write-Host "✅ 設定ファイルを修正しました" -ForegroundColor Green
      Write-Host "💡 Claude Desktop Appを再起動してください" -ForegroundColor Yellow
    }
    else {
      Write-Host "⏸️  修正をキャンセルしました" -ForegroundColor Yellow
    }
  }
  else {
    Write-Host "❌ 設定ファイルが見つかりません" -ForegroundColor Red
  }
}

function Invoke-ClaudeSafeStart {
  [CmdletBinding()]
  param()
    
  Write-Host "🚀 Claude安全起動" -ForegroundColor Yellow
    
  # Claude Desktop プロセス確認
  $claudeProcess = Get-Process -Name "Claude" -ErrorAction SilentlyContinue
  if ($claudeProcess) {
    Write-Host "⏹️  Claude Desktop を停止しています..." -ForegroundColor Yellow
    Stop-Process -Name "Claude" -Force
    Start-Sleep -Seconds 3
  }
    
  # 設定確認
  Invoke-ClaudeMCPDiagnostics
    
  Write-Host "`n🚀 Claude Desktop を起動してください" -ForegroundColor Green
  Write-Host "💡 手動で Claude Desktop App を起動してください" -ForegroundColor Yellow
}

# エイリアス設定
Set-Alias -Name claude-check -Value Invoke-ClaudeMCPDiagnostics -Force
Set-Alias -Name claude-config -Value Invoke-ClaudeConfigFix -Force  
Set-Alias -Name claude-safe -Value Invoke-ClaudeSafeStart -Force

# モジュールエクスポート
Export-ModuleMember -Function Invoke-ClaudeMCPDiagnostics, Invoke-ClaudeConfigFix, Invoke-ClaudeSafeStart -Alias claude-check, claude-config, claude-safe

# 初回実行メッセージ
Write-Host "🎯 Claude MCP診断システムが読み込まれました" -ForegroundColor Green
Write-Host "利用可能なコマンド:" -ForegroundColor Yellow
Write-Host "  • claude-check  : 環境診断" -ForegroundColor White
Write-Host "  • claude-config : 設定修正" -ForegroundColor White  
Write-Host "  • claude-safe   : 安全起動" -ForegroundColor White 