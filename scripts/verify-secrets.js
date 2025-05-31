#!/usr/bin/env node

const { execSync } = require('child_process');

function verifySecrets() {
  console.log('🔍 GitHub Secrets設定確認中...');

  try {
    // リポジトリSecrets一覧取得
    const secretsList = execSync('gh secret list', { encoding: 'utf8' });

    const requiredSecrets = [
      'CLAUDE_ACCESS_TOKEN',
      'CLAUDE_REFRESH_TOKEN',
      'CLAUDE_EXPIRES_AT'
    ];

    console.log('📋 設定済みSecrets:');
    console.log(secretsList);

    const setSecrets = secretsList.split('\n')
      .filter(line => line.trim())
      .map(line => line.split('\t')[0]);

    console.log('\n✅ 必須Secrets確認:');
    requiredSecrets.forEach(secret => {
      const isSet = setSecrets.includes(secret);
      console.log(`   ${isSet ? '✅' : '❌'} ${secret}`);
    });

    const allSet = requiredSecrets.every(secret => setSecrets.includes(secret));

    if (allSet) {
      console.log('\n🎉 GitHub Secrets設定完了！');
      console.log('🚀 GitHub Actions実行準備完了');
    } else {
      console.log('\n⚠️  未設定のSecretsがあります');
      console.log('📝 GITHUB_SECRETS_SETUP.md を参照してください');
    }

  } catch (error) {
    console.log('⚠️  GitHub CLI未検出 - 手動確認を推奨');
    console.log('\n📝 手動確認手順:');
    console.log('1. https://github.com/[username]/claude-code-action-integration/settings/secrets/actions');
    console.log('2. 以下のSecretsが設定されているか確認:');
    console.log('   - CLAUDE_ACCESS_TOKEN');
    console.log('   - CLAUDE_REFRESH_TOKEN');
    console.log('   - CLAUDE_EXPIRES_AT');
    console.log('\n💡 GitHub CLI インストール推奨:');
    console.log('   winget install GitHub.cli');
    console.log('   gh auth login');
  }
}

verifySecrets(); 