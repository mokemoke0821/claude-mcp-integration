#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Claude Code + GitHub Actions 統合セットアップ');

// Claude Code存在確認
try {
  const claudeVersion = execSync('claude-code --version', { encoding: 'utf8' });
  console.log('✅ Claude Code検出:', claudeVersion.trim());
} catch (error) {
  console.log('⚠️  Claude Code未検出。必要に応じてインストールしてください。');
  console.log('   GitHub Actions部分は正常に動作します。');
}

// GitHub CLI確認
try {
  execSync('gh --version', { encoding: 'utf8' });
  console.log('✅ GitHub CLI検出');
} catch (error) {
  console.log('⚠️  GitHub CLI未検出（推奨）');
}

// 設定ファイル作成
const configDir = '.claude';
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir);
}

const config = {
  project_type: "claude-github-integration",
  local_claude: {
    enabled: true,
    command: "claude-code"
  },
  github_integration: {
    enabled: true,
    workflow_file: ".github/workflows/claude.yml",
    trigger: "@claude"
  },
  sync: {
    auto_sync: true,
    sync_interval: "on_commit"
  }
};

fs.writeFileSync(path.join(configDir, 'config.json'), JSON.stringify(config, null, 2));
console.log('📝 設定ファイル作成完了');

console.log('\n🎯 次のステップ:');
console.log('1. GitHubリポジトリ作成');
console.log('2. Claude GitHub App インストール: https://github.com/apps/claude');
console.log('3. GitHub Secrets設定');
console.log('4. テスト実行: npm run sync'); 