Write-Host "🚀 Claude Code + GitHub Actions 統合セットアップ開始" -ForegroundColor Green
Write-Host "============================================================"

# Step 1: Gitリポジトリ初期化
Write-Host "📁 Gitリポジトリ初期化中..." -ForegroundColor Yellow

if (!(Test-Path ".git")) {
  git init
  Write-Host "✅ Gitリポジトリ初期化完了" -ForegroundColor Green
}
else {
  Write-Host "ℹ️  Gitリポジトリは既に存在します" -ForegroundColor Cyan
}

# Step 2: Git基本設定確認
Write-Host "`n🔧 Git基本設定確認中..." -ForegroundColor Yellow

$userName = git config user.name
$userEmail = git config user.email

if (!$userName) {
  git config user.name "Claude User"
  Write-Host "✅ ユーザー名設定: Claude User" -ForegroundColor Green
}

if (!$userEmail) {
  git config user.email "claude@example.com"
  Write-Host "✅ メールアドレス設定: claude@example.com" -ForegroundColor Green
}

# Step 3: .gitignoreファイル作成
Write-Host "`n📝 .gitignore確認中..." -ForegroundColor Yellow

if (!(Test-Path ".gitignore")) {
  @"
node_modules/
npm-debug.log*
.env
.env.local
.claude/
.credentials.json
logs
*.log
.vscode/
.idea/
.DS_Store
Thumbs.db
dist/
build/
"@ | Set-Content -Path ".gitignore" -Encoding UTF8
  Write-Host "✅ .gitignore作成完了" -ForegroundColor Green
}

# Step 4: 初期コミット
Write-Host "`n📦 初期コミット作成中..." -ForegroundColor Yellow

git add .
git commit -m "🚀 Initial commit: Claude Code + GitHub Actions統合プロジェクト"

Write-Host "✅ 初期コミット完了" -ForegroundColor Green

# Step 5: 案内表示
Write-Host "`n🌐 次のステップ案内" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "🛠️  GitHub CLI使用（推奨）："
Write-Host "  1. winget install GitHub.cli" -ForegroundColor Cyan
Write-Host "  2. gh auth login" -ForegroundColor Cyan  
Write-Host "  3. gh repo create claude-code-action-integration --public --source=. --remote=origin --push" -ForegroundColor Cyan

Write-Host "`n🎉 Gitセットアップ完了！" -ForegroundColor Green 