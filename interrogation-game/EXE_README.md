# Interrogation Game - Windows Executable

## 🎮 実行ファイル作成完了！

Windows用の実行ファイル(.exe)が正常に作成されました。

## 📁 ファイルの場所

```
interrogation-game/
└── release/
    └── win-unpacked/
        └── Interrogation Game.exe  (193MB)
```

## 🚀 実行方法

### 方法1: バッチファイル経由
プロジェクトルートにある `run-game.bat` をダブルクリックしてください。

### 方法2: 直接実行
1. `release/win-unpacked/` フォルダを開く
2. `Interrogation Game.exe` をダブルクリック

## ⚠️ 重要な注意事項

1. **Ollama必須**: このゲームはAI機能のためにOllamaが必要です
   - Ollamaを事前にインストールしてください
   - Ollamaサーバーを起動してください（localhost:11434）
   - 対応モデルをダウンロードしてください

2. **ポータブル版**: 現在の実行ファイルはポータブル版です
   - インストール不要
   - フォルダごと移動可能
   - 設定は実行ファイルと同じフォルダに保存

3. **セキュリティ警告**: 初回実行時にWindowsから警告が出る場合があります
   - 「詳細情報」をクリック
   - 「実行」を選択

## 🔧 今後の改善点

- [ ] カスタムアイコンの追加
- [ ] インストーラー版（NSIS）の作成
- [ ] コード署名の追加
- [ ] 自動アップデート機能
- [ ] Ollama自動起動機能

## 📦 配布方法

`release/win-unpacked/` フォルダ全体をZIPに圧縮して配布してください。

## 🛠️ トラブルシューティング

- **起動しない場合**: 
  - Windows Defenderやアンチウイルスソフトの例外設定を確認
  - Visual C++ 再頒布可能パッケージをインストール

- **Ollamaエラー**: 
  - Ollamaが起動しているか確認
  - ファイアウォール設定を確認