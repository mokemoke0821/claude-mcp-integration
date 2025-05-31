@echo off
echo 🔧 Updating Claude Desktop Configuration...
echo.

rem Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

rem Check if server is built
if not exist "build\index.js" (
    echo ❌ Server not built. Building now...
    call npm run build
    if %errorlevel% neq 0 (
        echo ❌ Build failed!
        exit /b 1
    )
)

rem Run the configuration updater
node scripts\update-claude-config.js

if %errorlevel% equ 0 (
    echo.
    echo ✅ Configuration update complete!
    echo.
    echo 🚀 Quick Start Guide:
    echo    1. Restart Claude Desktop
    echo    2. Click the MCP icon in Claude
    echo    3. Select "enhanced-development-commander"
    echo    4. Try these commands:
    echo       - git_status_enhanced
    echo       - analyze_project_structure
    echo       - env_port_manager with action: "list"
    echo       - generate_code_template with type: "component", name: "MyComponent"
) else (
    echo.
    echo ❌ Configuration update failed!
    echo.
    echo 💡 Troubleshooting:
    echo    - Run as Administrator if permission denied
    echo    - Check if Claude Desktop is installed
    echo    - Ensure the build completed successfully
)

pause