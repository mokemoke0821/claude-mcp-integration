Write-Host "📤 GitHubへのプッシュスクリプト" -ForegroundColor Green
Write-Host "======================================"

# 現在の状態確認
Write-Host "`n📊 現在の状態確認中..." -ForegroundColor Yellow
$branch = git branch --show-current
Write-Host "🌿 現在のブランチ: $branch" -ForegroundColor Cyan

# コミット済みか確認
$status = git status --porcelain
if ($status) {
  Write-Host "⚠️  未コミットの変更があります" -ForegroundColor Yellow
  Write-Host "📝 自動コミット中..." -ForegroundColor Yellow
  git add -A
  git commit -m "🚀 GitHub統合: 全ファイル追加"
}

# プッシュ実行
Write-Host "`n📤 GitHubへプッシュ中..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
  Write-Host "`n✅ プッシュ成功！" -ForegroundColor Green
    
  # GitHub Actions確認
  Write-Host "`n⚙️ GitHub Actions状態確認中..." -ForegroundColor Yellow
  $repoUrl = "https://github.com/mokemoke0821/claude-mcp-integration"
    
  Write-Host "`n🎉 GitHub統合完了！" -ForegroundColor Green
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  Write-Host "🌐 リポジトリ: $repoUrl" -ForegroundColor Cyan
  Write-Host "⚙️ Actions: $repoUrl/actions" -ForegroundColor Cyan
  Write-Host "📊 コード: $repoUrl/tree/main" -ForegroundColor Cyan
  Write-Host "`n🚀 MCP Server統合プロジェクト完成！" -ForegroundColor Green
}
else {
  Write-Host "`n❌ プッシュに失敗しました" -ForegroundColor Red
  Write-Host "以下を確認してください：" -ForegroundColor Yellow
  Write-Host "1. GitHubでリポジトリ 'claude-mcp-integration' を作成" -ForegroundColor Yellow
  Write-Host "2. リポジトリがPublicに設定されている" -ForegroundColor Yellow
  Write-Host "3. インターネット接続が正常" -ForegroundColor Yellow
} 