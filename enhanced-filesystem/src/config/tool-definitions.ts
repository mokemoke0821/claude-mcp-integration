/**
 * 全ツール定義設定
 * 49ツール（Phase 1: 9, Phase 2: 19, Phase 3: 21）
 */

export const ALL_TOOLS = [
  // ================== Phase 1: セキュリティ機能（9ツール） ==================

  // 暗号化・復号化ツール（4ツール）
  {
    name: 'encrypt_file',
    description: 'ファイルを暗号化します（AES暗号化、複数アルゴリズム対応）',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: '暗号化するファイルのパス' },
        password: { type: 'string', description: '暗号化パスワード' },
        algorithm: {
          type: 'string',
          description: '暗号化アルゴリズム',
          enum: ['aes-256-gcm', 'aes-256-cbc', 'aes-192-gcm', 'aes-128-gcm'],
          default: 'aes-256-gcm'
        },
        keyDerivation: {
          type: 'string',
          description: 'キー導出方法',
          enum: ['scrypt', 'pbkdf2'],
          default: 'scrypt'
        }
      },
      required: ['filePath', 'password'],
    },
  },
  {
    name: 'decrypt_file',
    description: '暗号化ファイルを復号化します',
    inputSchema: {
      type: 'object',
      properties: {
        encryptedFilePath: { type: 'string', description: '復号化する暗号化ファイルのパス' },
        password: { type: 'string', description: '復号化パスワード' },
        outputPath: { type: 'string', description: '復号化後のファイル出力パス（省略時は自動生成）' }
      },
      required: ['encryptedFilePath', 'password'],
    },
  },
  {
    name: 'encrypt_multiple_files',
    description: '複数ファイルを一括暗号化します',
    inputSchema: {
      type: 'object',
      properties: {
        filePaths: {
          type: 'array',
          description: '暗号化するファイルパスの配列',
          items: { type: 'string' }
        },
        password: { type: 'string', description: '暗号化パスワード' },
        algorithm: {
          type: 'string',
          description: '暗号化アルゴリズム',
          enum: ['aes-256-gcm', 'aes-256-cbc', 'aes-192-gcm', 'aes-128-gcm'],
          default: 'aes-256-gcm'
        }
      },
      required: ['filePaths', 'password'],
    },
  },
  {
    name: 'decrypt_multiple_files',
    description: '複数の暗号化ファイルを一括復号化します',
    inputSchema: {
      type: 'object',
      properties: {
        encryptedFilePaths: {
          type: 'array',
          description: '復号化する暗号化ファイルパスの配列',
          items: { type: 'string' }
        },
        password: { type: 'string', description: '復号化パスワード' }
      },
      required: ['encryptedFilePaths', 'password'],
    },
  },

  // 整合性検証ツール（5ツール）
  {
    name: 'generate_file_checksum',
    description: 'ファイルのチェックサム（ハッシュ値）を生成します',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'チェックサムを生成するファイルのパス' },
        algorithm: {
          type: 'string',
          description: 'ハッシュアルゴリズム',
          enum: ['md5', 'sha1', 'sha256', 'sha512'],
          default: 'sha256'
        }
      },
      required: ['filePath'],
    },
  },
  {
    name: 'verify_file_integrity',
    description: 'ファイルの整合性を検証します',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: '検証するファイルのパス' },
        expectedChecksum: { type: 'string', description: '期待されるチェックサム値' },
        algorithm: {
          type: 'string',
          description: 'ハッシュアルゴリズム',
          enum: ['md5', 'sha1', 'sha256', 'sha512'],
          default: 'sha256'
        }
      },
      required: ['filePath', 'expectedChecksum'],
    },
  },
  {
    name: 'generate_multiple_checksums',
    description: '複数ファイルのチェックサムを一括生成します',
    inputSchema: {
      type: 'object',
      properties: {
        filePaths: {
          type: 'array',
          description: 'チェックサムを生成するファイルパスの配列',
          items: { type: 'string' }
        },
        algorithm: {
          type: 'string',
          description: 'ハッシュアルゴリズム',
          enum: ['md5', 'sha1', 'sha256', 'sha512'],
          default: 'sha256'
        }
      },
      required: ['filePaths'],
    },
  },
  {
    name: 'save_checksum_file',
    description: 'チェックサム結果をファイルに保存します',
    inputSchema: {
      type: 'object',
      properties: {
        filePaths: {
          type: 'array',
          description: 'チェックサムを生成するファイルパスの配列',
          items: { type: 'string' }
        },
        outputPath: { type: 'string', description: 'チェックサムファイルの出力パス（省略時は自動生成）' },
        algorithm: {
          type: 'string',
          description: 'ハッシュアルゴリズム',
          enum: ['md5', 'sha1', 'sha256', 'sha512'],
          default: 'sha256'
        }
      },
      required: ['filePaths'],
    },
  },
  {
    name: 'verify_directory_integrity',
    description: 'チェックサムファイルに基づいてディレクトリの整合性を検証します',
    inputSchema: {
      type: 'object',
      properties: {
        directoryPath: { type: 'string', description: '検証するディレクトリのパス' },
        checksumFilePath: { type: 'string', description: 'チェックサムファイルのパス' }
      },
      required: ['directoryPath', 'checksumFilePath'],
    },
  },

  // ================== Phase 2: 実用機能（19ツール） ==================

  // 圧縮・アーカイブシステム（4ツール）
  {
    name: 'create_archive',
    description: 'ファイル・ディレクトリをアーカイブ化します',
    inputSchema: {
      type: 'object',
      properties: {
        sourcePaths: {
          type: 'array',
          description: 'アーカイブするファイル・ディレクトリパスの配列',
          items: { type: 'string' }
        },
        outputPath: { type: 'string', description: 'アーカイブファイルの出力パス' },
        format: {
          type: 'string',
          description: 'アーカイブ形式',
          enum: ['zip', 'tar', '7z', 'gzip'],
          default: 'zip'
        },
        compressionLevel: {
          type: 'integer',
          description: '圧縮レベル（1-9）',
          minimum: 1,
          maximum: 9,
          default: 6
        },
        password: { type: 'string', description: 'アーカイブパスワード（任意）' }
      },
      required: ['sourcePaths', 'outputPath'],
    },
  },
  {
    name: 'extract_archive',
    description: 'アーカイブファイルを展開します',
    inputSchema: {
      type: 'object',
      properties: {
        archivePath: { type: 'string', description: '展開するアーカイブファイルのパス' },
        outputDirectory: { type: 'string', description: '展開先ディレクトリのパス（省略時は自動生成）' },
        password: { type: 'string', description: 'アーカイブパスワード（任意）' }
      },
      required: ['archivePath'],
    },
  },
  {
    name: 'list_archive_contents',
    description: 'アーカイブファイルの内容を一覧表示します',
    inputSchema: {
      type: 'object',
      properties: {
        archivePath: { type: 'string', description: 'アーカイブファイルのパス' },
        password: { type: 'string', description: 'アーカイブパスワード（任意）' }
      },
      required: ['archivePath'],
    },
  },
  {
    name: 'analyze_compression_efficiency',
    description: '圧縮効率を分析してレポートを生成します',
    inputSchema: {
      type: 'object',
      properties: {
        sourcePaths: {
          type: 'array',
          description: '分析対象のファイル・ディレクトリパスの配列',
          items: { type: 'string' }
        },
        outputPath: { type: 'string', description: 'レポート出力パス（省略時は自動生成）' }
      },
      required: ['sourcePaths'],
    },
  },

  // 重複ファイル検出システム（4ツール）
  {
    name: 'scan_duplicates',
    description: '重複ファイルをスキャンして検出します',
    inputSchema: {
      type: 'object',
      properties: {
        searchPaths: {
          type: 'array',
          description: '検索対象のディレクトリパスの配列',
          items: { type: 'string' }
        },
        method: {
          type: 'string',
          description: '重複検出方法',
          enum: ['hash', 'name', 'size', 'content'],
          default: 'hash'
        },
        minFileSize: { type: 'integer', description: '最小ファイルサイズ（バイト）', default: 0 }
      },
      required: ['searchPaths'],
    },
  },
  {
    name: 'clean_duplicates',
    description: '重複ファイルを自動削除します',
    inputSchema: {
      type: 'object',
      properties: {
        searchPaths: {
          type: 'array',
          description: '検索対象のディレクトリパスの配列',
          items: { type: 'string' }
        },
        strategy: {
          type: 'string',
          description: '削除戦略',
          enum: ['keep_oldest', 'keep_newest', 'keep_largest', 'keep_smallest'],
          default: 'keep_newest'
        },
        dryRun: { type: 'boolean', description: 'ドライラン（実際の削除は行わない）', default: true }
      },
      required: ['searchPaths'],
    },
  },
  {
    name: 'analyze_storage_waste',
    description: 'ストレージの無駄遣いを分析します',
    inputSchema: {
      type: 'object',
      properties: {
        searchPaths: {
          type: 'array',
          description: '分析対象のディレクトリパスの配列',
          items: { type: 'string' }
        },
        outputPath: { type: 'string', description: 'レポート出力パス（省略時は自動生成）' }
      },
      required: ['searchPaths'],
    },
  },
  {
    name: 'generate_duplicate_report',
    description: '重複ファイルレポートを生成します',
    inputSchema: {
      type: 'object',
      properties: {
        searchPaths: {
          type: 'array',
          description: '検索対象のディレクトリパスの配列',
          items: { type: 'string' }
        },
        outputPath: { type: 'string', description: 'レポート出力パス（省略時は自動生成）' }
      },
      required: ['searchPaths'],
    },
  },

  // ファイル監視システム（6ツール）
  {
    name: 'start_file_watch',
    description: 'ファイル・ディレクトリの監視を開始します',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '監視するファイル・ディレクトリのパス' },
        recursive: { type: 'boolean', description: '再帰的監視', default: true },
        includeHidden: { type: 'boolean', description: '隠しファイルを含める', default: false },
        ignorePatterns: {
          type: 'array',
          description: '無視するパターンの配列',
          items: { type: 'string' },
          default: []
        }
      },
      required: ['path'],
    },
  },
  {
    name: 'stop_file_watch',
    description: 'ファイル監視を停止します',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: '監視セッションID' }
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'get_watch_status',
    description: '監視状態を取得します',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: '監視セッションID（省略時は全セッション）' }
      },
      required: [],
    },
  },
  {
    name: 'get_file_changes',
    description: 'ファイル変更履歴を取得します',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: '監視セッションID' },
        limit: { type: 'integer', description: '取得する変更履歴の最大数', default: 100 }
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'export_watch_log',
    description: '監視ログをファイルに出力します',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: '監視セッションID' },
        outputPath: { type: 'string', description: 'ログ出力パス（省略時は自動生成）' },
        format: {
          type: 'string',
          description: '出力形式',
          enum: ['json', 'csv', 'text'],
          default: 'json'
        }
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'analyze_file_activity',
    description: 'ファイル活動を分析してレポートを生成します',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: '監視セッションID' },
        outputPath: { type: 'string', description: 'レポート出力パス（省略時は自動生成）' }
      },
      required: ['sessionId'],
    },
  },

  // 同期・バックアップシステム（5ツール）
  {
    name: 'sync_directories',
    description: 'ディレクトリ間でファイルを同期します',
    inputSchema: {
      type: 'object',
      properties: {
        sourcePath: { type: 'string', description: '同期元ディレクトリのパス' },
        targetPath: { type: 'string', description: '同期先ディレクトリのパス' },
        bidirectional: { type: 'boolean', description: '双方向同期', default: false },
        deleteExtraneous: { type: 'boolean', description: '不要ファイル削除', default: false },
        dryRun: { type: 'boolean', description: 'ドライラン', default: true }
      },
      required: ['sourcePath', 'targetPath'],
    },
  },
  {
    name: 'create_backup',
    description: 'ファイル・ディレクトリのバックアップを作成します',
    inputSchema: {
      type: 'object',
      properties: {
        sourcePaths: {
          type: 'array',
          description: 'バックアップ対象のパスの配列',
          items: { type: 'string' }
        },
        backupPath: { type: 'string', description: 'バックアップ保存先のパス' },
        incremental: { type: 'boolean', description: '増分バックアップ', default: false },
        compression: { type: 'boolean', description: '圧縮バックアップ', default: true }
      },
      required: ['sourcePaths', 'backupPath'],
    },
  },
  {
    name: 'restore_backup',
    description: 'バックアップからファイルを復元します',
    inputSchema: {
      type: 'object',
      properties: {
        backupPath: { type: 'string', description: 'バックアップファイルのパス' },
        restorePath: { type: 'string', description: '復元先のパス' },
        selective: {
          type: 'array',
          description: '選択的復元（特定ファイル・ディレクトリのみ）',
          items: { type: 'string' },
          default: []
        }
      },
      required: ['backupPath', 'restorePath'],
    },
  },
  {
    name: 'verify_sync_integrity',
    description: '同期の整合性を検証します',
    inputSchema: {
      type: 'object',
      properties: {
        sourcePath: { type: 'string', description: '同期元ディレクトリのパス' },
        targetPath: { type: 'string', description: '同期先ディレクトリのパス' },
        deep: { type: 'boolean', description: 'ディープ検証（内容比較）', default: false }
      },
      required: ['sourcePath', 'targetPath'],
    },
  },
  {
    name: 'generate_sync_report',
    description: '同期レポートを生成します',
    inputSchema: {
      type: 'object',
      properties: {
        sourcePath: { type: 'string', description: '同期元ディレクトリのパス' },
        targetPath: { type: 'string', description: '同期先ディレクトリのパス' },
        outputPath: { type: 'string', description: 'レポート出力パス（省略時は自動生成）' }
      },
      required: ['sourcePath', 'targetPath'],
    },
  },

  // ================== Phase 3: 高度機能（21ツール） ==================

  // ファイルバージョン管理システム（6ツール）
  {
    name: 'initialize_repository',
    description: 'バージョン管理リポジトリを初期化します',
    inputSchema: {
      type: 'object',
      properties: {
        basePath: { type: 'string', description: 'リポジトリのベースパス' },
        repositoryPath: { type: 'string', description: 'リポジトリ保存先パス（省略時は自動生成）' },
        maxVersions: { type: 'integer', description: '最大バージョン数', default: 10 },
        autoSnapshot: { type: 'boolean', description: '自動スナップショット', default: false }
      },
      required: ['basePath'],
    },
  },
  {
    name: 'create_file_version',
    description: 'ファイルのバージョンを作成します',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'バージョン作成対象ファイルのパス' },
        repositoryPath: { type: 'string', description: 'リポジトリパス' },
        comment: { type: 'string', description: 'バージョンコメント' },
        author: { type: 'string', description: '作成者' }
      },
      required: ['filePath', 'repositoryPath'],
    },
  },
  {
    name: 'create_snapshot',
    description: 'プロジェクトスナップショットを作成します',
    inputSchema: {
      type: 'object',
      properties: {
        basePath: { type: 'string', description: 'スナップショット対象のベースパス' },
        repositoryPath: { type: 'string', description: 'リポジトリパス' },
        name: { type: 'string', description: 'スナップショット名' },
        description: { type: 'string', description: 'スナップショット説明' },
        author: { type: 'string', description: '作成者' }
      },
      required: ['basePath', 'repositoryPath', 'name'],
    },
  },
  {
    name: 'restore_file_version',
    description: 'ファイルを特定バージョンに復元します',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: '復元対象ファイルのパス' },
        repositoryPath: { type: 'string', description: 'リポジトリパス' },
        versionId: { type: 'string', description: '復元するバージョンID' }
      },
      required: ['filePath', 'repositoryPath', 'versionId'],
    },
  },
  {
    name: 'compare_versions',
    description: 'バージョン間の差分を比較します',
    inputSchema: {
      type: 'object',
      properties: {
        repositoryPath: { type: 'string', description: 'リポジトリパス' },
        versionId1: { type: 'string', description: '比較元バージョンID' },
        versionId2: { type: 'string', description: '比較先バージョンID' }
      },
      required: ['repositoryPath', 'versionId1', 'versionId2'],
    },
  },
  {
    name: 'get_version_history',
    description: 'ファイルのバージョン履歴を取得します',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: '対象ファイルのパス' },
        repositoryPath: { type: 'string', description: 'リポジトリパス' }
      },
      required: ['filePath', 'repositoryPath'],
    },
  },

  // インテリジェント分類システム（5ツール）
  {
    name: 'classify_files',
    description: 'ファイルの自動分類・タグ付けを実行します',
    inputSchema: {
      type: 'object',
      properties: {
        searchPaths: {
          type: 'array',
          description: '分類対象のディレクトリパスの配列',
          items: { type: 'string' }
        },
        useAI: { type: 'boolean', description: 'AI支援分類を使用', default: false }
      },
      required: ['searchPaths'],
    },
  },
  {
    name: 'create_classification_rule',
    description: '分類ルールを作成します',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'ルール名' },
        description: { type: 'string', description: 'ルール説明' },
        conditions: {
          type: 'array',
          description: '分類条件の配列',
          items: { type: 'object' }
        },
        actions: {
          type: 'array',
          description: '実行アクションの配列',
          items: { type: 'object' }
        },
        priority: { type: 'integer', description: 'ルール優先度', default: 100 }
      },
      required: ['name', 'conditions', 'actions'],
    },
  },
  {
    name: 'create_smart_folder',
    description: 'スマートフォルダを作成します',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'スマートフォルダ名' },
        query: { type: 'object', description: '検索クエリ' },
        autoUpdate: { type: 'boolean', description: '自動更新', default: true }
      },
      required: ['name', 'query'],
    },
  },
  {
    name: 'manage_categories',
    description: 'ファイルカテゴリを管理します',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: '管理アクション',
          enum: ['add', 'update', 'delete']
        },
        category: { type: 'object', description: 'カテゴリ情報' }
      },
      required: ['action', 'category'],
    },
  },
  {
    name: 'generate_classification_report',
    description: '分類統計レポートを生成します',
    inputSchema: {
      type: 'object',
      properties: {
        searchPaths: {
          type: 'array',
          description: '分析対象のディレクトリパスの配列',
          items: { type: 'string' }
        },
        outputPath: { type: 'string', description: 'レポート出力パス（省略時は自動生成）' }
      },
      required: ['searchPaths'],
    },
  },

  // 高度ファイル検索システム（6ツール）
  {
    name: 'create_search_index',
    description: '検索インデックスを作成・更新します',
    inputSchema: {
      type: 'object',
      properties: {
        basePath: { type: 'string', description: 'インデックス対象のベースパス' },
        indexPath: { type: 'string', description: 'インデックス保存先パス（省略時は自動生成）' },
        indexContent: { type: 'boolean', description: 'ファイル内容をインデックス', default: true },
        maxFileSize: { type: 'integer', description: 'インデックス対象最大ファイルサイズ（MB）', default: 10 }
      },
      required: ['basePath'],
    },
  },
  {
    name: 'perform_advanced_search',
    description: '高度検索を実行します',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'object', description: '検索クエリ' },
        searchPaths: {
          type: 'array',
          description: '検索対象パスの配列',
          items: { type: 'string' }
        }
      },
      required: ['query', 'searchPaths'],
    },
  },
  {
    name: 'create_saved_search',
    description: '保存済み検索を作成します',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '保存済み検索名' },
        description: { type: 'string', description: '検索説明' },
        query: { type: 'object', description: '検索クエリ' }
      },
      required: ['name', 'description', 'query'],
    },
  },
  {
    name: 'perform_fuzzy_search',
    description: 'ファジー検索を実行します',
    inputSchema: {
      type: 'object',
      properties: {
        searchTerm: { type: 'string', description: '検索語' },
        searchPaths: {
          type: 'array',
          description: '検索対象パスの配列',
          items: { type: 'string' }
        },
        threshold: { type: 'number', description: '類似度閾値', default: 0.6 }
      },
      required: ['searchTerm', 'searchPaths'],
    },
  },
  {
    name: 'perform_content_search',
    description: '内容ベース検索を実行します',
    inputSchema: {
      type: 'object',
      properties: {
        searchTerm: { type: 'string', description: '検索語' },
        searchPaths: {
          type: 'array',
          description: '検索対象パスの配列',
          items: { type: 'string' }
        },
        caseSensitive: { type: 'boolean', description: '大文字小文字を区別', default: false }
      },
      required: ['searchTerm', 'searchPaths'],
    },
  },
  {
    name: 'generate_search_report',
    description: '検索統計レポートを生成します',
    inputSchema: {
      type: 'object',
      properties: {
        searchQueries: {
          type: 'array',
          description: '分析対象の検索クエリ配列',
          items: { type: 'object' }
        },
        outputPath: { type: 'string', description: 'レポート出力パス（省略時は自動生成）' }
      },
      required: ['searchQueries'],
    },
  },

  // ファイルアクセス権限管理システム（4ツール）
  {
    name: 'set_file_permissions',
    description: 'ファイル権限を設定します',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: '権限設定対象ファイルのパス' },
        permissions: {
          type: 'array',
          description: '権限設定の配列',
          items: { type: 'object' }
        },
        modifier: { type: 'string', description: '権限変更者' }
      },
      required: ['filePath', 'permissions', 'modifier'],
    },
  },
  {
    name: 'manage_directory_permissions',
    description: 'ディレクトリ権限を管理します',
    inputSchema: {
      type: 'object',
      properties: {
        directoryPath: { type: 'string', description: '権限管理対象ディレクトリのパス' },
        permissions: {
          type: 'array',
          description: '権限設定の配列',
          items: { type: 'object' }
        },
        recursive: { type: 'boolean', description: '再帰的適用', default: false },
        modifier: { type: 'string', description: '権限変更者' }
      },
      required: ['directoryPath', 'permissions', 'modifier'],
    },
  },
  {
    name: 'check_access',
    description: 'アクセス権限をチェックします',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'チェック対象ファイルのパス' },
        user: { type: 'string', description: 'ユーザー名' },
        action: {
          type: 'string',
          description: 'アクション',
          enum: ['read', 'write', 'execute', 'delete']
        },
        context: { type: 'object', description: 'アクセスコンテキスト（IP、デバイス等）' }
      },
      required: ['filePath', 'user', 'action'],
    },
  },
  {
    name: 'create_security_policy',
    description: 'セキュリティポリシーを作成します',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'ポリシー名' },
        description: { type: 'string', description: 'ポリシー説明' },
        rules: {
          type: 'array',
          description: 'セキュリティルールの配列',
          items: { type: 'object' }
        },
        scope: {
          type: 'array',
          description: 'ポリシー適用スコープ',
          items: { type: 'string' }
        }
      },
      required: ['name', 'description', 'rules', 'scope'],
    },
  },
  {
    name: 'generate_audit_report',
    description: 'アクセス監査レポートを生成します',
    inputSchema: {
      type: 'object',
      properties: {
        startDate: { type: 'string', description: '開始日時（ISO形式）' },
        endDate: { type: 'string', description: '終了日時（ISO形式）' },
        outputPath: { type: 'string', description: 'レポート出力パス（省略時は自動生成）' }
      },
      required: [],
    },
  },
  {
    name: 'generate_permission_report',
    description: '権限レポートを生成します',
    inputSchema: {
      type: 'object',
      properties: {
        scope: {
          type: 'array',
          description: 'レポート対象スコープ',
          items: { type: 'string' }
        },
        outputPath: { type: 'string', description: 'レポート出力パス（省略時は自動生成）' }
      },
      required: ['scope'],
    },
  }
]; 