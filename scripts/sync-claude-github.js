#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ClaudeGitHubSync {
  constructor() {
    this.configPath = '.claude/config.json';
  }

  async syncSettings() {
    console.log('🔄 Claude Code ⇔ GitHub Actions 同期開始');

    // ローカル設定読み込み
    const config = this.loadConfig();

    // Claude認証情報確認
    this.checkClaudeAuth();

    // GitHub設定確認
    this.checkGitHubSetup();

    console.log('✅ 同期完了');
  }

  loadConfig() {
    if (!fs.existsSync(this.configPath)) {
      console.log('❌ 設定ファイルが見つかりません。npm run setup を実行してください。');
      process.exit(1);
    }
    return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
  }

  checkClaudeAuth() {
    const homeDir = process.env.USERPROFILE || process.env.HOME;
    const credentialsPath = path.join(homeDir, '.claude', '.credentials.json');

    if (fs.existsSync(credentialsPath)) {
      console.log('✅ Claude認証情報確認済み');

      try {
        const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
        console.log('📋 GitHub Secretsに設定が必要な値:');
        console.log('   CLAUDE_ACCESS_TOKEN: (認証情報から取得)');
        console.log('   CLAUDE_REFRESH_TOKEN: (認証情報から取得)');
        console.log('   CLAUDE_EXPIRES_AT: (認証情報から取得)');
      } catch (error) {
        console.log('⚠️  認証情報の読み取りエラー');
      }
    } else {
      console.log('❌ Claude認証情報未検出');
      console.log('   claude-code でログインしてください');
    }
  }

  checkGitHubSetup() {
    // GitHub Actions ワークフローファイル確認
    const workflowPath = '.github/workflows/claude.yml';
    if (fs.existsSync(workflowPath)) {
      console.log('✅ GitHub Actionsワークフロー確認済み');
    } else {
      console.log('❌ GitHub Actionsワークフローが見つかりません');
    }

    // Git リポジトリ確認
    try {
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      console.log('✅ GitHubリポジトリ:', remoteUrl);
    } catch (error) {
      console.log('⚠️  GitHubリポジトリ未設定');
    }
  }

  async testIntegration() {
    console.log('🧪 統合テスト実行');

    // ローカルClaude Code テスト
    try {
      console.log('1. ローカルClaude Code テスト...');
      execSync('claude-code --help', { timeout: 5000 });
      console.log('✅ ローカルClaude Code動作正常');
    } catch (error) {
      console.log('❌ ローカルClaude Code テスト失敗');
    }

    // Git状態確認
    try {
      console.log('2. Git状態確認...');
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        console.log('📝 未コミット変更あり');
      } else {
        console.log('✅ Git状態クリーン');
      }
    } catch (error) {
      console.log('⚠️  Git確認スキップ');
    }

    console.log('🎉 テスト完了');
  }
}

async function main() {
  const sync = new ClaudeGitHubSync();
  const command = process.argv[2] || 'sync';

  switch (command) {
    case 'sync':
      await sync.syncSettings();
      break;
    case 'test':
      await sync.testIntegration();
      break;
    default:
      console.log('使用方法: npm run sync または npm run sync test');
  }
}

main().catch(console.error); 