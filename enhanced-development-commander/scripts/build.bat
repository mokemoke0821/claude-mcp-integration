@echo off
echo 🔨 Building Enhanced Development Commander...

rem Clean previous build
echo 🧹 Cleaning previous build...
if exist build rmdir /s /q build

rem Run TypeScript compiler
echo 📦 Compiling TypeScript...
call npx tsc

rem Check if build was successful
if exist build (
    echo ✅ Build successful!
    echo 📁 Output directory: .\build
    echo 🚀 Run 'npm start' to launch the server
) else (
    echo ❌ Build failed!
    exit /b 1
)