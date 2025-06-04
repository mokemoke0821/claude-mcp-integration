@echo off
chcp 65001 > nul
echo 🕵️ 取調室ライフバトルゲーム 起動中...
echo.

:: Ollamaが起動しているか確認
curl -s http://localhost:11434/api/tags > nul 2>&1
if errorlevel 1 (
    echo ⚠️  Ollamaが起動していません
    echo 別のコマンドプロンプトで 'ollama serve' を実行してください
    pause
    exit /b 1
)

echo ✅ Ollama接続確認OK

:: qwen2.5:7bモデルがあるか確認
ollama list | findstr "qwen2.5:7b" > nul
if errorlevel 1 (
    echo 📥 qwen2.5:7bモデルをダウンロード中...
    ollama pull qwen2.5:7b
)

echo ✅ AIモデル準備完了
echo.

:: 依存関係確認
if not exist "node_modules" (
    echo 📦 依存関係をインストール中...
    npm install
)

echo 🚀 ゲームを起動します...
echo ブラウザで http://localhost:3001 を開いてください
echo.

:: 開発サーバー起動
npm run dev