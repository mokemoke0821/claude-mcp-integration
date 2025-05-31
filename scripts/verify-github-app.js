#!/usr/bin/env node

const { execSync } = require('child_process');

async function verifyGitHubApp() {
  console.log('🔍 Claude GitHub App インストール確認中...');

  try {
    // リポジトリ情報取得
    const repoInfo = execSync('gh repo view --json name,owner', { encoding: 'utf8' });
    const repo = JSON.parse(repoInfo);
    console.log(`✅ リポジトリ: ${repo.owner.login}/${repo.name}`);

    // インストール済みアプリ確認
    console.log('📋 GitHub Apps確認中...');
    console.log('🌐 ブラウザで確認: https://github.com/settings/installations');
    console.log('📱 Claude Appが以下に表示されるはずです:');
    console.log(`   - Repository access: ${repo.owner.login}/${repo.name}`);
    console.log('   - Permissions: Contents, Issues, Pull requests, Metadata');

  } catch (error) {
    console.log('⚠️  GitHub CLI未検出 - 手動確認を推奨');
    console.log('🌐 以下のURLでClaude GitHub Appをインストールしてください:');
    console.log('   https://github.com/apps/claude');
    console.log('\n📋 インストール手順:');
    console.log('1. 上記URLにアクセス');
    console.log('2. "Install" ボタンをクリック');
    console.log('3. リポジトリ選択で "claude-code-action-integration" を選択');
    console.log('4. "Install & Authorize" を実行');
    console.log('\n✅ 必要な権限:');
    console.log('   - Contents: Read and write');
    console.log('   - Issues: Read and write');
    console.log('   - Pull requests: Read and write');
    console.log('   - Metadata: Read');
  }
}

verifyGitHubApp(); 