#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

function getClaudeCredentials() {
  console.log('🔐 Claude OAuth認証情報取得中...');

  // 認証情報ファイルパス
  const credentialsPath = path.join(os.homedir(), '.claude', '.credentials.json');

  if (!fs.existsSync(credentialsPath)) {
    console.log('❌ Claude認証情報が見つかりません');
    console.log('📝 以下を実行してログインしてください:');
    console.log('   claude-code');
    console.log('   /login');
    console.log('\n⚠️  Claude Code未インストールの場合:');
    console.log('1. https://claude.ai にアクセス');
    console.log('2. デベロッパーコンソールでAPI キー取得');
    console.log('3. GitHub Secretsに手動設定');
    return;
  }

  try {
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

    console.log('✅ Claude認証情報検出');
    console.log('\n📋 GitHub Secretsに設定する値:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (credentials.access_token) {
      console.log('🔑 CLAUDE_ACCESS_TOKEN:');
      console.log(`   ${credentials.access_token.substring(0, 20)}...`);
      console.log(`   (全体: ${credentials.access_token.length}文字)`);
    }

    if (credentials.refresh_token) {
      console.log('🔄 CLAUDE_REFRESH_TOKEN:');
      console.log(`   ${credentials.refresh_token.substring(0, 20)}...`);
      console.log(`   (全体: ${credentials.refresh_token.length}文字)`);
    }

    if (credentials.expires_at) {
      console.log('⏰ CLAUDE_EXPIRES_AT:');
      console.log(`   ${credentials.expires_at}`);
      const expiresDate = new Date(credentials.expires_at * 1000);
      console.log(`   (期限: ${expiresDate.toLocaleString()})`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📝 GitHub Secrets設定手順:');
    console.log('1. https://github.com/[username]/claude-code-action-integration/settings/secrets/actions');
    console.log('2. "New repository secret" をクリック');
    console.log('3. 上記の値を名前と値に設定');
    console.log('\n⚠️  セキュリティ注意:');
    console.log('   - これらの値は機密情報です');
    console.log('   - GitHub Secretsでのみ使用してください');
    console.log('   - 直接コードに記載しないでください');
    console.log('   - 有効期限を定期的に確認してください');

  } catch (error) {
    console.error('❌ 認証情報読み取りエラー:', error.message);
    console.log('\n💡 トラブルシューティング:');
    console.log('1. ファイル権限確認: ~/.claude/.credentials.json');
    console.log('2. Claude Code再ログイン実行');
    console.log('3. 手動でAPI キー取得・設定');
  }
}

getClaudeCredentials(); 