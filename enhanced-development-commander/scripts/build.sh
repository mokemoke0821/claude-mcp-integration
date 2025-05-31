#!/bin/bash

echo "🔨 Building Enhanced Development Commander..."

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf build/

# Run TypeScript compiler
echo "📦 Compiling TypeScript..."
npx tsc

# Check if build was successful
if [ -d "build" ]; then
    echo "✅ Build successful!"
    echo "📁 Output directory: ./build"
    echo "🚀 Run 'npm start' to launch the server"
else
    echo "❌ Build failed!"
    exit 1
fi