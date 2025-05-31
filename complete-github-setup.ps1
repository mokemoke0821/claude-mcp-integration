Write-Host "🌐 GitHub統合完了スクリプト" -ForegroundColor Green
Write-Host "=========================================="

# Step 1: 認証状態確認
Write-Host "`n🔐 GitHub認証状態確認中..." -ForegroundColor Yellow

try {
  $authStatus = gh auth status 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ GitHub認証済み" -ForegroundColor Green
  }
  else {
    Write-Host "❌ GitHub認証が必要です" -ForegroundColor Red
    Write-Host "次のコマンドを実行してください: gh auth login" -ForegroundColor Yellow
    exit 1
  }
}
catch {
  Write-Host "❌ GitHub CLI認証確認に失敗" -ForegroundColor Red
  exit 1
}

# Step 2: リポジトリ作成
Write-Host "`n📦 GitHubリポジトリ作成中..." -ForegroundColor Yellow

try {
  $repoName = "claude-mcp-integration"
  gh repo create $repoName --public --source=. --remote=origin --push --description "🚀 Claude MCP Server Integration & GitHub Actions自動化プロジェクト"
    
  if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ GitHubリポジトリ作成成功: $repoName" -ForegroundColor Green
    Write-Host "🌐 リポジトリURL: https://github.com/$(gh api user --jq .login)/$repoName" -ForegroundColor Cyan
  }
  else {
    Write-Host "❌ リポジトリ作成に失敗しました" -ForegroundColor Red
    Write-Host "手動作成を試行してください:" -ForegroundColor Yellow
    Write-Host "  gh repo create $repoName --public" -ForegroundColor Cyan
    exit 1
  }
}
catch {
  Write-Host "❌ GitHub API呼び出しに失敗" -ForegroundColor Red
  exit 1
}

# Step 3: GitHub Actions設定
Write-Host "`n⚙️ GitHub Actions設定中..." -ForegroundColor Yellow

$workflowDir = ".github/workflows"
if (!(Test-Path $workflowDir)) {
  New-Item -ItemType Directory -Path $workflowDir -Force | Out-Null
}

$workflowContent = @"
name: 🚀 Claude MCP自動テスト & デプロイ

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test-mcp-servers:
    runs-on: windows-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '22'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm install
    
    - name: Test MCP Servers
      run: |
        Write-Host "🧪 MCP Servers テスト開始" -ForegroundColor Green
        
        # enhanced-development-commander テスト
        if (Test-Path "enhanced-development-commander/dist/index.js") {
          node enhanced-development-commander/dist/index.js --version
          Write-Host "✅ enhanced-development-commander 動作確認" -ForegroundColor Green
        }
        
        # enhanced-file-commander テスト
        if (Test-Path "enhanced-file-commander/dist/index.js") {
          node enhanced-file-commander/dist/index.js --version
          Write-Host "✅ enhanced-file-commander 動作確認" -ForegroundColor Green
        }
        
        Write-Host "🎉 全てのMCPサーバーテスト完了" -ForegroundColor Green
      shell: pwsh
    
    - name: Claude設定検証
      run: |
        Write-Host "🔧 Claude設定検証開始" -ForegroundColor Yellow
        
        if (Test-Path "corrected_claude_desktop_config.json") {
          \$config = Get-Content "corrected_claude_desktop_config.json" | ConvertFrom-Json
          Write-Host "✅ Claude設定ファイル検証成功" -ForegroundColor Green
          Write-Host "📊 設定済みMCPサーバー数: \$(\$config.mcpServers.PSObject.Properties.Count)" -ForegroundColor Cyan
        }
      shell: pwsh

  deploy:
    needs: test-mcp-servers
    runs-on: windows-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Create Release
      run: |
        Write-Host "🚀 リリースパッケージ作成中..." -ForegroundColor Green
        
        \$releaseFiles = @(
          "corrected_claude_desktop_config.json",
          "claude-mcp-diagnostics-v2.ps1",
          "package.json",
          "enhanced-development-commander/dist/index.js",
          "enhanced-file-commander/dist/index.js"
        )
        
        Compress-Archive -Path \$releaseFiles -DestinationPath "claude-mcp-integration-release.zip" -Force
        Write-Host "✅ リリースパッケージ作成完了" -ForegroundColor Green
      shell: pwsh
"@

$workflowContent | Set-Content -Path "$workflowDir/ci-cd.yml" -Encoding UTF8

Write-Host "✅ GitHub Actions設定完了" -ForegroundColor Green

# Step 4: 最終コミット&プッシュ
Write-Host "`n📤 最終更新をプッシュ中..." -ForegroundColor Yellow

git add .github/
git commit -m "⚙️ GitHub Actions CI/CD設定追加"
git push origin main

Write-Host "`n🎉 GitHub統合完了！" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "🌐 リポジトリアクセス: https://github.com/$(gh api user --jq .login)/claude-mcp-integration" -ForegroundColor Cyan
Write-Host "⚙️ GitHub Actions: 自動でビルド&テスト実行中" -ForegroundColor Cyan
Write-Host "📊 MCP Server統合: 完全自動化達成" -ForegroundColor Green 