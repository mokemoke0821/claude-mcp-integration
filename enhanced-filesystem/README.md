# Enhanced Filesystem Security - MCP Server

🔐 **強化ファイルシステムセキュリティツール** - Phase 1

既存のMCPファイルシステムツールと重複しない、12の新機能を段階的に実装するプロジェクトです。Phase 1では最重要のセキュリティ機能（暗号化・整合性検証）を提供します。

## 🎯 Phase 1 実装機能

### 🔐 ファイル暗号化・復号化
- AES暗号化（256/192/128bit、GCM/CBCモード対応）
- 強力なキー導出（scrypt/PBKDF2）
- 単一・複数ファイルの一括処理
- メタデータ保持による安全な復号化

### 🛡️ ファイル整合性検証
- チェックサム生成（MD5/SHA1/SHA256/SHA512）
- ファイル整合性検証
- チェックサムファイル保存・読み込み
- ディレクトリ一括検証

## 📦 インストール

```bash
cd enhanced-filesystem
npm install
npm run build
```

## 🚀 使用方法

### 1. MCPサーバーとして起動

```bash
npm start
# または
node build/index.js
```

### 2. Claude Desktop設定

`claude_desktop_config.json`に以下を追加：

```json
{
  "mcpServers": {
    "enhanced-filesystem-security": {
      "command": "node",
      "args": ["/path/to/enhanced-filesystem/build/index.js"]
    }
  }
}
```

## 🔧 利用可能なツール

### 暗号化ツール

#### `encrypt_file`
ファイルを暗号化します。

```typescript
encrypt_file({
  filePath: "secret.txt",
  password: "強力なパスワード",
  algorithm: "aes-256-gcm",  // オプション
  keyDerivation: "scrypt"    // オプション
})
```

#### `decrypt_file`
暗号化ファイルを復号化します。

```typescript
decrypt_file({
  encryptedFilePath: "secret.encrypted",
  password: "強力なパスワード",
  outputPath: "restored.txt"  // オプション
})
```

#### `encrypt_multiple_files`
複数ファイルを一括暗号化します。

```typescript
encrypt_multiple_files({
  filePaths: ["file1.txt", "file2.pdf", "file3.jpg"],
  password: "強力なパスワード",
  algorithm: "aes-256-gcm"
})
```

#### `decrypt_multiple_files`
複数の暗号化ファイルを一括復号化します。

```typescript
decrypt_multiple_files({
  encryptedFilePaths: ["file1.encrypted", "file2.encrypted"],
  password: "強力なパスワード"
})
```

### 整合性検証ツール

#### `generate_file_checksum`
ファイルのチェックサムを生成します。

```typescript
generate_file_checksum({
  filePath: "important.pdf",
  algorithm: "sha256"  // md5, sha1, sha256, sha512
})
```

#### `verify_file_integrity`
ファイルの整合性を検証します。

```typescript
verify_file_integrity({
  filePath: "important.pdf",
  expectedChecksum: "a1b2c3d4e5f6...",
  algorithm: "sha256"
})
```

#### `generate_multiple_checksums`
複数ファイルのチェックサムを一括生成します。

```typescript
generate_multiple_checksums({
  filePaths: ["file1.txt", "file2.pdf"],
  algorithm: "sha256"
})
```

#### `save_checksum_file`
チェックサム結果をファイルに保存します。

```typescript
save_checksum_file({
  filePaths: ["file1.txt", "file2.pdf"],
  outputPath: "checksums.txt",  // オプション
  algorithm: "sha256"
})
```

#### `verify_directory_integrity`
チェックサムファイルに基づいてディレクトリを検証します。

```typescript
verify_directory_integrity({
  directoryPath: "/path/to/directory",
  checksumFilePath: "checksums.txt"
})
```

## 🏗️ プロジェクト構造

```
enhanced-filesystem/
├── src/
│   ├── security/          # セキュリティ機能
│   │   ├── encryption.ts  # 暗号化・復号化
│   │   └── integrity.ts   # 整合性検証
│   ├── types/             # 型定義
│   │   └── index.ts
│   ├── utils/             # 共通ユーティリティ
│   │   ├── logger.ts      # ログシステム
│   │   └── file-helper.ts # ファイル操作ヘルパー
│   └── index.ts           # MCPサーバーメイン
├── build/                 # ビルド済みファイル
├── tests/                 # テストファイル
├── package.json
├── tsconfig.json
└── README.md
```

## 🔒 セキュリティ機能詳細

### 暗号化仕様
- **アルゴリズム**: AES-256-GCM（デフォルト）、AES-256-CBC、AES-192-GCM、AES-128-GCM
- **キー導出**: scrypt（デフォルト）、PBKDF2
- **認証**: GCMモードでAEAD（Authenticated Encryption with Associated Data）
- **ソルト**: 32バイトランダム生成
- **IV**: 16バイトランダム生成

### ファイル形式
暗号化ファイルは以下の形式で保存されます：

```
{
  "algorithm": "aes-256-gcm",
  "keyDerivation": "scrypt",
  "iterations": 100000,
  "saltLength": 32,
  "ivHex": "...",
  "saltHex": "...",
  "tagHex": "...",
  "originalFileName": "secret.txt",
  "originalSize": 1024,
  "encryptedAt": "2024-01-01T00:00:00.000Z"
}
---ENCRYPTED-DATA---
[暗号化されたバイナリデータ]
```

### チェックサムファイル形式
```
# Enhanced Filesystem Security - Checksum File
# Generated: 2024-01-01T00:00:00.000Z
# Algorithm: sha256
# Total Files: 2
#
# Format: <checksum> <algorithm> <size> <filename>

a1b2c3d4... sha256 1024 file1.txt
e5f6g7h8... sha256 2048 file2.pdf
```

## 🚧 今後の実装予定（Phase 2-3）

### Phase 2: 実用機能
- **ファイル圧縮・アーカイブ** (zip/tar/7z対応)
- **重複ファイル検出・管理** (ハッシュベース検出)
- **ファイル監視・変更検知** (リアルタイム監視)
- **ファイル同期・バックアップ** (双方向同期)

### Phase 3: 高度機能
- **ファイルバージョン管理** (スナップショット機能)
- **インテリジェント分類** (AI支援分類)
- **高度なファイル検索** (内容・メタデータ検索)
- **ファイルアクセス権限管理** (セキュリティ監査)

## 📋 開発情報

- **言語**: TypeScript
- **実行環境**: Node.js 18+
- **フレームワーク**: Model Context Protocol (MCP)
- **暗号化**: Node.js crypto モジュール
- **ログ**: カスタムログシステム

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 🔍 トラブルシューティング

### よくある問題

**Q: 暗号化ファイルが復号化できません**
A: パスワードが正しいか、暗号化ファイルが破損していないか確認してください。

**Q: チェックサム検証が失敗します**
A: ファイルが変更されているか、チェックサム値が間違っている可能性があります。

**Q: MCPサーバーが起動しません**
A: Node.js 18以上がインストールされているか、依存関係が正しくインストールされているか確認してください。

### ログ確認
詳細なログは標準エラー出力に出力されます：

```bash
node build/index.js 2> server.log
```

## 📞 サポート

問題や質問がある場合は、GitHubのIssueを作成してください。 