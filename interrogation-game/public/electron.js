const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  // Create the browser window with enhanced security
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // 🔒 PHASE 5 セキュリティ強化設定
      nodeIntegration: false,           // Node.js統合無効 (セキュリティ必須)
      contextIsolation: true,           // コンテキスト分離有効 (セキュリティ必須)
      enableRemoteModule: false,        // リモートモジュール無効 (セキュリティ必須)
      webSecurity: true,               // Webセキュリティ有効 (本番環境必須)
      allowRunningInsecureContent: false, // 非セキュアコンテンツ禁止
      experimentalFeatures: false,      // 実験的機能無効
      nodeIntegrationInWorker: false,   // ワーカー内Node統合無効
      nodeIntegrationInSubFrames: false, // サブフレーム内Node統合無効
      safeDialogs: true,               // 安全なダイアログ有効
      sandbox: false,                  // サンドボックス（必要に応じて有効化）
      preload: undefined               // プリロードスクリプトなし
    },
    autoHideMenuBar: true,
    show: false,
    title: 'Interrogation Game - 取調室ライフバトル',
    // 🛡️ ウィンドウセキュリティ設定
    minimizable: true,
    maximizable: true,
    resizable: true,
    fullscreenable: false,            // フルスクリーン無効（セキュリティ向上）
    // icon: path.join(__dirname, '../build/icon.png') // Icon will be added later
  });

  // 🔒 外部リンクのセキュリティ制御
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // 外部URLを既定のブラウザで開く（セキュアな処理）
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 🛡️ ナビゲーションセキュリティ制御
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    // 許可されたオリジンのみナビゲーション許可
    if (parsedUrl.origin !== 'http://localhost:3001' &&
      parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });

  // Load the app URL
  const startUrl = isDev
    ? 'http://localhost:3001'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development only
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Remove default menu bar for security
  Menu.setApplicationMenu(null);
}

// 🔒 アプリケーションセキュリティ設定
app.whenReady().then(() => {
  // セキュリティ警告を有効化
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'false';

  createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 🛡️ 証明書エラーハンドリング（本番環境用）
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    // 開発環境では証明書エラーを許可
    event.preventDefault();
    callback(true);
  } else {
    // 本番環境では厳格に証明書をチェック
    callback(false);
  }
});