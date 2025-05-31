# Claude Desktop設定ファイル修正スクリプト（段階的適用版）
# 実行前にClaude Desktopを終了してください

Write-Host "=== Claude Desktop設定ファイル修正スクリプト（段階的適用版） ===" -ForegroundColor Green
Write-Host ""

# 設定ファイルのパス
$configPath = "$env:APPDATA\Claude\claude_desktop_config.json"
$backupPath = "$env:APPDATA\Claude\claude_desktop_config.json.backup"

# Claude Desktopプロセスの確認と終了
$claudeProcess = Get-Process -Name "Claude" -ErrorAction SilentlyContinue
if ($claudeProcess) {
  Write-Host "⚠️  Claude Desktopが実行中です。終了します..." -ForegroundColor Yellow
  Stop-Process -Name "Claude" -Force
  Write-Host "✅ Claude Desktopを終了しました。" -ForegroundColor Green
  Start-Sleep -Seconds 3
}

# 実行中のnodeプロセスを確認
Write-Host "🔍 実行中のnodeプロセスを確認しています..." -ForegroundColor Blue
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
  Write-Host "⚠️  実行中のnodeプロセスがあります。これらを終了しますか？ (y/N): " -NoNewline -ForegroundColor Yellow
  $response = Read-Host
  if ($response -eq "y" -or $response -eq "Y") {
    Stop-Process -Name "node" -Force
    Write-Host "✅ nodeプロセスを終了しました。" -ForegroundColor Green
    Start-Sleep -Seconds 2
  }
}

# 現在の設定ファイルのバックアップ
if (Test-Path $configPath) {
  Write-Host "📁 現在の設定ファイルをバックアップしています..." -ForegroundColor Blue
  Copy-Item $configPath $backupPath -Force
  Write-Host "✅ バックアップ完了: $backupPath" -ForegroundColor Green
}

# 段階的適用の選択
Write-Host ""
Write-Host "適用する設定を選択してください:" -ForegroundColor Cyan
Write-Host "1. 最小限の設定（filesystem + enhanced_file_commander のみ）" -ForegroundColor White
Write-Host "2. 安定版設定（playwright + powershell-commander を追加）" -ForegroundColor White
Write-Host "3. 完全版設定（deep_think + web_research を追加）" -ForegroundColor White
Write-Host "選択 (1-3): " -NoNewline
$choice = Read-Host

switch ($choice) {
  "1" {
    $newConfigPath = ".\minimal_claude_desktop_config.json"
    Write-Host "📝 最小限の設定を適用します..." -ForegroundColor Blue
  }
  "2" {
    $newConfigPath = ".\stable_claude_desktop_config.json"
    Write-Host "📝 安定版設定を適用します..." -ForegroundColor Blue
  }
  "3" {
    $newConfigPath = ".\full_fixed_claude_desktop_config.json"
    Write-Host "📝 完全版設定を適用します..." -ForegroundColor Blue
  }
  default {
    Write-Host "❌ 無効な選択です。最小限の設定を適用します..." -ForegroundColor Yellow
    $newConfigPath = ".\minimal_claude_desktop_config.json"
  }
}

# 新しい設定ファイルの存在確認
if (-not (Test-Path $newConfigPath)) {
  Write-Host "❌ 設定ファイルが見つかりません: $newConfigPath" -ForegroundColor Red
  exit 1
}

# 新しい設定ファイルの適用
Copy-Item $newConfigPath $configPath -Force
Write-Host "✅ 設定ファイルの適用完了" -ForegroundColor Green

# 参照ファイルの存在確認
Write-Host "🔍 参照ファイルの存在確認..." -ForegroundColor Blue
$files = @(
  "C:\Users\81902\OneDrive\Documents\Cline\MCP\enhanced-file-commander\src\simple-server.js",
  "C:\Users\81902\OneDrive\Documents\Cline\MCP\powershell-commander\src\index.js",
  "C:\Users\81902\OneDrive\Documents\Cline\MCP\deep-think-commander\enhanced-index.js",
  "C:\Users\81902\OneDrive\Documents\Cline\MCP\web-research-commander\enhanced-web-research.js"
)

foreach ($file in $files) {
  if (Test-Path $file) {
    Write-Host "  ✅ $file" -ForegroundColor Green
  }
  else {
    Write-Host "  ❌ $file" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "=== 修正完了 ===" -ForegroundColor Green
Write-Host "Claude Desktopを起動して動作を確認してください。" -ForegroundColor White
Write-Host ""
Write-Host "問題が発生した場合は、以下のコマンドで元の設定に戻せます:" -ForegroundColor Yellow
Write-Host "Copy-Item '$backupPath' '$configPath' -Force" -ForegroundColor Cyan
Write-Host ""
Write-Host "Claude Desktopを起動しますか？ (y/N): " -NoNewline
$startClaude = Read-Host
if ($startClaude -eq "y" -or $startClaude -eq "Y") {
  Write-Host "🚀 Claude Desktopを起動しています..." -ForegroundColor Blue
  Start-Sleep -Seconds 2
  Start-Process "Claude"
} 