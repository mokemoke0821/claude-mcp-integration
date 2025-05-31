# PC セットアップガイド

## システム概要

このPCは、Windows 11上でWSL2 (Windows Subsystem for Linux 2) を使用した開発環境です。主にMCP (Model Context Protocol) プロジェクトの開発に使用されています。

### 基本スペック

- **OS**: Ubuntu 24.04.2 LTS (WSL2環境)
- **CPU**: Intel N100 (4コア/4スレッド)
- **メモリ**: 7.7GB (WSL割り当て)
- **ストレージ**: 
  - WSL2: 1TB (使用量: 2.7GB)
  - Windows C:ドライブ: 476GB (使用量: 390GB)

## 開発環境

### インストール済み言語・ツール

#### プログラミング言語
- **Python**: 3.12.3
  - パッケージマネージャー: pip (未インストール)
- **Node.js**: 20.19.0
  - パッケージマネージャー: npm 11.2.0
- **GCC**: 13.3.0

#### 開発ツール
- **Git**: 2.43.0
- **VS Code**: Windows側にインストール済み
- **Cursor**: Windows側にインストール済み
- **Docker**: Windows側にインストール済み
- **PowerShell**: 7.5.0

### 環境変数

主要な環境変数:
- `HOME`: /home/mokemoke0821
- `USER`: mokemoke0821
- `SHELL`: /bin/bash

### パス設定

WindowsとWSLの両方のパスが統合されており、以下のような構成になっています:

1. WSL標準パス (/usr/bin, /usr/local/bin など)
2. Windows プログラムパス (/mnt/c/Program Files/... など)
3. ユーザー固有パス (/mnt/c/Users/81902/AppData/... など)

## ディレクトリ構造

### 重要なディレクトリ

- **ホームディレクトリ**: `/home/mokemoke0821`
- **プロジェクトディレクトリ**: `/mnt/c/Users/81902/OneDrive/Documents/Cline/MCP`
- **Windowsホーム**: `/mnt/c/Users/81902`
- **ドキュメント**: `/mnt/c/Users/81902/OneDrive/Documents`
- **ダウンロード**: `/mnt/c/Users/81902/Downloads`

### プロジェクト構成

MCP関連プロジェクト:
- claude-bridge-mcp
- deep-think-commander
- enhanced-file-commander
- powershell-commander
- web-research-commander

SDK:
- java-sdk
- python-sdk
- typescript-sdk

## WSL2特有の設定

### WSL情報
- WSLバージョン: 2.4.11.0
- カーネル: 5.15.167.4-microsoft-standard-WSL2

### ファイルシステムアクセス
- Windows側のファイルは `/mnt/c/` 経由でアクセス可能
- WSL側のファイルはWindows側から `\\wsl$\Ubuntu\` でアクセス可能

## 開発ワークフロー

### 主な用途
1. Claude AI統合開発
2. TypeScript/JavaScript開発
3. Python開発
4. Web研究と自動化
5. ファイル管理と分析

### 連携サービス
- GitHub
- npm registry
- Claude AI
- OneDrive (ファイル同期)
- Docker (Windows経由)

## セットアップ手順

### 1. 基本的な開発環境の確認
```bash
# システム情報確認
uname -a
lsb_release -a

# 開発ツール確認
git --version
node --version
python3 --version
```

### 2. プロジェクトディレクトリへの移動
```bash
cd /mnt/c/Users/81902/OneDrive/Documents/Cline/MCP
```

### 3. 必要に応じたパッケージのインストール
```bash
# Pythonパッケージマネージャーのインストール
sudo apt update
sudo apt install python3-pip

# Node.jsパッケージのインストール
npm install
```

## トラブルシューティング

### WSL2でのパフォーマンス問題
- Windows側のファイルへのアクセスは遅い場合があるため、頻繁にアクセスするファイルはWSL側に配置することを推奨

### メモリ不足
- WSL2のメモリ割り当ては `.wslconfig` ファイルで調整可能

### ネットワーク接続問題
- WSL2は独自のネットワークスタックを持つため、Windows側のファイアウォール設定に注意

## 注意事項

- SSHキーは現在設定されていません
- pipは未インストールのため、Pythonパッケージ管理には事前インストールが必要
- Windows側とWSL側でGitの改行コード設定に注意が必要