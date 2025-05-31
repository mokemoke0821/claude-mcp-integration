#!/bin/bash

echo "🚀 Setting up Enhanced Development Commander..."

# Check Node.js version
NODE_VERSION=$(node -v)
echo "📌 Node.js version: $NODE_VERSION"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Create example .env file
if [ ! -f ".env" ]; then
    echo "📝 Creating example .env file..."
    cat > .env << EOF
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
EOF
fi

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add to Claude Desktop config:"
echo '   "enhanced-development-commander": {'
echo '     "command": "node",'
echo '     "args": ["'$(pwd)'/build/index.js"]'
echo '   }'
echo ""
echo "2. Restart Claude Desktop"
echo "3. Start using the tools!"