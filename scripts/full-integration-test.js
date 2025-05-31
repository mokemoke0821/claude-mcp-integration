#!/usr/bin/env node

const { execSync } = require('child_process');

async function fullIntegrationTest() {
  console.log('🚀 Claude Code + GitHub Actions 完全統合テスト開始');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const tests = [
    {
      name: 'Node.js環境',
      command: 'node --version',
      description: 'Node.js バージョン確認',
      required: true
    },
    {
      name: 'NPMパッケージ',
      command: 'npm list --depth=0',
      description: 'インストール済みパッケージ確認',
      required: true
    },
    {
      name: 'ローカルClaude Code',
      command: 'claude-code --version',
      description: 'Claude Codeインストール確認',
      required: false
    },
    {
      name: 'GitHub CLI認証',
      command: 'gh auth status',
      description: 'GitHub CLI認証状態確認',
      required: false
    },
    {
      name: 'Git設定',
      command: 'git config --list',
      description: 'Git設定確認',
      required: true
    },
    {
      name: 'リポジトリ状態',
      command: 'git status',
      description: 'Gitリポジトリ状態確認',
      required: true
    },
    {
      name: 'リモートリポジトリ',
      command: 'git remote -v',
      description: 'リモートリポジトリ接続確認',
      required: false
    }
  ];

  let passedTests = 0;
  let requiredTests = 0;
  let passedRequired = 0;

  console.log('\n🧪 環境テスト実行中...\n');

  for (const test of tests) {
    if (test.required) requiredTests++;

    try {
      console.log(`📋 ${test.name} テスト中...`);
      const result = execSync(test.command, {
        encoding: 'utf8',
        timeout: 10000,
        stdio: 'pipe'
      });

      console.log(`✅ ${test.description} - 成功`);
      if (test.name === 'Node.js環境') {
        console.log(`   バージョン: ${result.trim()}`);
      }
      passedTests++;
      if (test.required) passedRequired++;

    } catch (error) {
      const status = test.required ? '❌' : '⚠️ ';
      console.log(`${status} ${test.description} - ${test.required ? '失敗' : 'スキップ'}`);
      if (test.required) {
        console.log(`   エラー: ${error.message}`);
      } else {
        console.log(`   (オプション) ${error.message.split('\n')[0]}`);
      }
    }
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 テスト結果: ${passedTests}/${tests.length} 成功`);
  console.log(`📊 必須テスト: ${passedRequired}/${requiredTests} 成功`);

  // プロジェクト固有テスト実行
  console.log('\n🔧 プロジェクト統合テスト実行中...');

  const projectTests = [
    {
      name: 'package.json確認',
      test: () => {
        const pkg = require('../package.json');
        return pkg.name === 'claude-code-action-integration';
      }
    },
    {
      name: 'GitHub Actionsワークフロー',
      test: () => {
        const fs = require('fs');
        return fs.existsSync('.github/workflows/claude.yml');
      }
    },
    {
      name: '設定ファイル',
      test: () => {
        const fs = require('fs');
        return fs.existsSync('.claude/config.json');
      }
    },
    {
      name: 'セットアップスクリプト',
      test: () => {
        const fs = require('fs');
        return fs.existsSync('scripts/setup.js');
      }
    }
  ];

  let projectPassed = 0;

  for (const test of projectTests) {
    try {
      const result = test.test();
      if (result) {
        console.log(`✅ ${test.name} - 正常`);
        projectPassed++;
      } else {
        console.log(`❌ ${test.name} - 失敗`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - エラー: ${error.message}`);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 プロジェクトテスト: ${projectPassed}/${projectTests.length} 成功`);

  // 総合判定
  const allRequired = passedRequired === requiredTests;
  const allProject = projectPassed === projectTests.length;

  if (allRequired && allProject) {
    console.log('\n🎉 すべての必須テストが成功！');
    console.log('\n🚀 次のステップ:');
    console.log('1. GitHubリポジトリ作成 (手動)');
    console.log('2. Claude GitHub App インストール');
    console.log('   → https://github.com/apps/claude');
    console.log('3. GitHub Secrets設定');
    console.log('   → npm run get:credentials');
    console.log('   → GITHUB_SECRETS_SETUP.md 参照');
    console.log('4. 実際のテスト実行');
    console.log('   → Issueで @claude メンション');

  } else {
    console.log('\n⚠️  一部テストが失敗しました');
    if (!allRequired) {
      console.log('❌ 必須テスト失敗 - 基本環境を確認してください');
    }
    if (!allProject) {
      console.log('❌ プロジェクトテスト失敗 - ファイル構造を確認してください');
    }
    console.log('📝 エラーを修正してから再実行してください');
  }

  console.log('\n📋 手動確認が必要な項目:');
  console.log('□ Claude Code インストール (オプション)');
  console.log('□ GitHub CLI インストール・認証 (推奨)');
  console.log('□ GitHubリポジトリ作成・プッシュ');
  console.log('□ Claude GitHub App インストール');
  console.log('□ GitHub Secrets設定');
}

fullIntegrationTest(); 