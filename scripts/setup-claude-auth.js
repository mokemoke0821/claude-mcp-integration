#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

async function setupClaudeCredentials() {
  console.log('🔐 Claude認証情報セットアップ');
  console.log('=' .repeat(50));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise((resolve) => {
    rl.question(prompt, resolve);
  });

  try {
    console.log('\n📋 Claude認証情報設定方法:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n🌐 方法1: Claude.ai Web版から取得（推奨）');
    console.log('1. https://claude.ai にアクセス');
    console.log('2. 開発者ツール（F12キー）を開く');
    console.log('3. Application → Local Storage → claude.ai');
    console.log('4. "accessToken" の値をコピー');
    console.log('5. 有効期限も確認してコピー');

    console.log('\n🛠️  方法2: Claude Code インストール（完全版）');
    console.log('1. npm install -g @anthropic-ai/claude-code');
    console.log('2. claude-code');
    console.log('3. /login コマンドでログイン');

    console.log('\n📝 方法3: API キー使用（開発者向け）');
    console.log('1. https://console.anthropic.com/');
    console.log('2. API Keys → Create Key');
    console.log('3. 生成されたキーを使用');

    const choice = await question('\n設定方法を選択してください (1/2/3/skip): ');

    if (choice === '1') {
      console.log('\n🔑 Web版認証情報入力:');
      const accessToken = await question('Access Token: ');
      const refreshToken = await question('Refresh Token (オプション): ');
      const expiresAt = await question('Expires At (Unix timestamp, オプション): ');

      // 認証情報保存
      const credentialsDir = path.join(os.homedir(), '.claude');
      if (!fs.existsSync(credentialsDir)) {
        fs.mkdirSync(credentialsDir, { recursive: true });
      }

      const credentials = {
        access_token: accessToken,
        ...(refreshToken && { refresh_token: refreshToken }),
        ...(expiresAt && { expires_at: parseInt(expiresAt) })
      };

      fs.writeFileSync(
        path.join(credentialsDir, '.credentials.json'),
        JSON.stringify(credentials, null, 2)
      );

      console.log('✅ 認証情報保存完了');
      console.log(`📁 保存先: ${path.join(credentialsDir, '.credentials.json')}`);

    } else if (choice === '2') {
      console.log('\n💡 Claude Code インストール手順:');
      console.log('1. npm install -g @anthropic-ai/claude-code');
      console.log('2. claude-code');
      console.log('3. /login');
      console.log('4. ブラウザでログイン完了後、認証情報が自動保存されます');

    } else if (choice === '3') {
      console.log('\n🔑 API キー設定:');
      const apiKey = await question('Claude API Key: ');
      
      // 環境変数として保存
      const envContent = `CLAUDE_API_KEY=${apiKey}\n`;
      fs.appendFileSync('.env', envContent);
      
      console.log('✅ API キー保存完了（.env ファイル）');

    } else {
      console.log('⏭️  認証設定をスキップしました');
      console.log('💡 後で設定する場合: npm run get:credentials');
    }

    console.log('\n🎯 次のステップ:');
    console.log('1. GitHubリポジトリ作成・プッシュ');
    console.log('2. GitHub Secrets設定');
    console.log('3. 実際のテスト実行');

  } catch (error) {
    console.error('❌ エラー:', error.message);
  } finally {
    rl.close();
  }
}

setupClaudeCredentials();
