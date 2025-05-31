@echo off
echo 🚀 Setting up Enhanced Development Commander...

rem Check Node.js version
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo 📌 Node.js version: %NODE_VERSION%

rem Install dependencies
echo 📦 Installing dependencies...
call npm install

rem Build the project
echo 🔨 Building project...
call npm run build

rem Create example .env file
if not exist .env (
    echo 📝 Creating example .env file...
    (
        echo NODE_ENV=development
        echo PORT=3000
        echo LOG_LEVEL=info
    ) > .env
)

echo ✅ Setup complete!
echo.
echo 📋 Next steps:
echo 1. Add to Claude Desktop config:
echo    "enhanced-development-commander": {
echo      "command": "node",
echo      "args": ["%CD%\build\index.js"]
echo    }
echo.
echo 2. Restart Claude Desktop
echo 3. Start using the tools!