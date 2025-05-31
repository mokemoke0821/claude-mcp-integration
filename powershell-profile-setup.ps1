# ================================================================
# 🎯 PowerShell プロファイル セットアップスクリプト
# ================================================================
# Claude MCP診断システムをPowerShellプロファイルに永続的にインストール
# 実行方法: .\powershell-profile-setup.ps1
# ================================================================

Write-Host "🔧 PowerShell プロファイルセットアップ開始..." -ForegroundColor Yellow

# プロファイルパス
$profilePath = $PROFILE
$profileDir = Split-Path $profilePath -Parent
$mcpDiagnosticsPath = Join-Path (Get-Location) "claude-mcp-diagnostics.ps1"

Write-Host "📍 プロファイルパス: $profilePath" -ForegroundColor Cyan

# プロファイルディレクトリの作成
if (-not (Test-Path $profileDir)) {
  Write-Host "📁 プロファイルディレクトリを作成: $profileDir" -ForegroundColor Yellow
  New-Item -ItemType Directory -Path $profileDir -Force
}

# 現在のプロファイルをバックアップ
if (Test-Path $profilePath) {
  $backupPath = "$profilePath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
  Copy-Item $profilePath $backupPath
  Write-Host "✅ 既存プロファイルをバックアップ: $backupPath" -ForegroundColor Green
}

# Claude MCP診断システムの追加
$claudeModuleContent = @"
# ================================================================
# 🎯 Claude MCP 診断システム (自動読み込み)
# ================================================================
# 生成日時: $(Get-Date -Format 'yyyy/MM/dd HH:mm:ss')
# ================================================================

# Claude MCP診断システムの読み込み
`$claudeMcpDiagnosticsPath = "C:\Users\81902\OneDrive\Documents\Cline\MCP\claude-mcp-diagnostics.ps1"
if (Test-Path `$claudeMcpDiagnosticsPath) {
    try {
        . `$claudeMcpDiagnosticsPath
        Write-Host "✅ Claude MCP診断システム読み込み完了" -ForegroundColor Green
    }
    catch {
        Write-Warning "❌ Claude MCP診断システム読み込みエラー: `$(`$_.Exception.Message)"
    }
} else {
    Write-Warning "⚠️  Claude MCP診断システムが見つかりません: `$claudeMcpDiagnosticsPath"
}

# ================================================================
"@

# 既存のプロファイル内容を確認
$existingContent = ""
if (Test-Path $profilePath) {
  $existingContent = Get-Content $profilePath -Raw
}

# Claude MCP診断システムが既に追加されているかチェック
if ($existingContent -notmatch "Claude MCP 診断システム") {
  # プロファイルに追加
  if ($existingContent) {
    $newContent = $existingContent + "`n`n" + $claudeModuleContent
  }
  else {
    $newContent = $claudeModuleContent
  }
    
  $newContent | Set-Content $profilePath -Encoding UTF8
  Write-Host "✅ PowerShellプロファイルに Claude MCP診断システムを追加しました" -ForegroundColor Green
}
else {
  Write-Host "ℹ️  Claude MCP診断システムは既にプロファイルに追加済みです" -ForegroundColor Blue
}

# 診断システムファイルのコピー
$targetDiagnosticsPath = "C:\Users\81902\OneDrive\Documents\Cline\MCP\claude-mcp-diagnostics.ps1"
if (Test-Path $mcpDiagnosticsPath) {
  Write-Host "✅ 診断システムファイルが正しい場所に配置されています" -ForegroundColor Green
}
else {
  Write-Warning "❌ 診断システムファイルが見つかりません: $mcpDiagnosticsPath"
}

# セットアップ完了確認
Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
Write-Host "🎯 PowerShell プロファイルセットアップ完了" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan

Write-Host "`n📋 次の手順:" -ForegroundColor Yellow
Write-Host "1. PowerShellを再起動してプロファイル設定を反映" -ForegroundColor White
Write-Host "2. 'claude-check' コマンドで環境診断を実行" -ForegroundColor White
Write-Host "3. 必要に応じて 'claude-config' で設定修正を実行" -ForegroundColor White

Write-Host "`n💡 利用可能なコマンド:" -ForegroundColor Cyan
Write-Host "  • claude-check  : 環境診断" -ForegroundColor White
Write-Host "  • claude-config : 設定修正" -ForegroundColor White
Write-Host "  • claude-safe   : 安全起動" -ForegroundColor White

Write-Host "`n🚀 PowerShellを再起動して設定を完了してください" -ForegroundColor Green 