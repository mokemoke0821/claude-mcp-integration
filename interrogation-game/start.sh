#!/bin/bash

echo "🕵️ 取調室ライフバトルゲーム 起動中..."
echo ""

# Ollamaが起動しているか確認
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Ollamaが起動していません"
    echo "別のターミナルで 'ollama serve' を実行してください"
    exit 1
fi

echo "✅ Ollama接続確認OK"

# qwen2.5:7bモデルがあるか確認
if ! ollama list | grep -q "qwen2.5:7b"; then
    echo "📥 qwen2.5:7bモデルをダウンロード中..."
    ollama pull qwen2.5:7b
fi

echo "✅ AIモデル準備完了"
echo ""

# 依存関係確認
if [ ! -d "node_modules" ]; then
    echo "📦 依存関係をインストール中..."
    npm install
fi

echo "🚀 ゲームを起動します..."
echo "ブラウザで http://localhost:3001 を開いてください"
echo ""

# 開発サーバー起動
npm run dev