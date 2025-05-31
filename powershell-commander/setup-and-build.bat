@echo off
echo --- PowerShell Commander MCP Server Setup ---
cd "%~dp0"
echo 現在の作業ディレクトリ: %CD%
echo Installing npm dependencies...
call npm install
echo Installing MCP SDK...
call npm install @modelcontextprotocol/sdk
echo Setup complete!

:: JavaScriptファイルを直接使用するため、ビルドステップをスキップ
echo Node.jsで直接JavaScriptを実行します
echo 実行するときは、以下のコマンドを使ってください:
echo   node src/index.js
pause
