# Enhanced File Commander MCP

ファイル操作に特化した強力なMCPツールセットを提供します。

## 機能概要

Enhanced File Commanderは、以下の4つの主要カテゴリの機能を提供します：

### 1. ファイルシステム可視化強化

- ディレクトリ構造のツリー表示（テキスト/HTML/JSON形式）
- ファイル分析（サイズ、作成日時、アクセス日時による分類）
- ファイルタイプ統計と分布の可視化

### 2. バッチ処理強化

- パターンマッチングによる複数ファイル一括操作
- 高度なリネーム機能（連番、日付挿入、正規表現置換）
- フォルダ構造最適化（拡張子/日付/サイズによる自動整理）

### 3. コンテンツ操作

- シンプルなテキスト検索・置換
- ファイル比較（差分表示）
- ファイルコンテンツプレビュー

### 4. メタデータ管理

- 詳細なメタデータ表示・編集
- カスタムタグ管理
- タグベースのファイル検索

## 技術仕様

- Node.js/TypeScriptで実装
- ファイルシステム操作には直接APIを使用
- 非同期処理の積極的な活用
- 強化されたエラーハンドリング

## 使用方法

このMCPサーバーは、Claudeを通して以下のツールを提供します：

### ファイルシステム可視化ツール

- `visualize_directory_tree`: ディレクトリ構造をツリー形式で可視化
- `analyze_files`: ファイルの分析情報を取得して表示
- `show_file_type_stats`: ファイルタイプ別の統計情報を表示

### バッチ処理ツール

- `batch_rename`: パターンマッチによる一括リネーム
- `batch_replace_in_files`: ファイル内のテキストを一括置換
- `organize_folder`: フォルダ構造を最適化

### コンテンツ操作ツール

- `search_in_files`: ファイル内容の検索
- `compare_files`: 2つのファイルを比較して差分を表示
- `preview_file_content`: ファイルのプレビューを生成

### メタデータ管理ツール

- `add_tags`: ファイルにタグを追加
- `remove_tags`: ファイルからタグを削除
- `show_tags`: ファイルのタグを表示
- `find_by_tags`: タグによるファイル検索
- `generate_tag_report`: タグ使用状況レポートを生成
- `organize_tags`: タグの整理（リネーム、削除など）
- `show_file_metadata`: ファイルのメタデータを表示

## インストール方法

1. リポジトリをクローン
2. `npm install`でパッケージをインストール
3. `npm run build`でTypeScriptファイルをコンパイル
4. Claudeの設定ファイルにサーバー設定を追加

```json
{
  "mcpServers": {
    "enhanced_file_commander": {
      "command": "node",
      "args": ["パス/enhanced-file-commander/build/index.js"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## 開発者向け情報

- `src/types/`: データ型定義
- `src/utils/`: ユーティリティ関数
- `src/services/`: 主要な機能を提供するサービス
- `src/viz/`: 可視化機能
- `src/tools/`: MCP用のツール実装
- `src/index.ts`: メインのMCPサーバー実装

## powershell-commanderとの差別化

- powershell-commanderはシステムコマンドと複雑なスクリプト処理に特化
- Enhanced File Commanderはファイルシステム操作、特にファイル管理、分析、メタデータに特化
- 明確な境界を持つことで、用途に応じた最適なツールの選択が可能

## ライセンス

MIT
