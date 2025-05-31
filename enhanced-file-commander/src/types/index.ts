// ファイルシステムエンティティの基本型
export interface FileSystemEntity {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  created: Date;
  modified: Date;
  accessed: Date;
  permissions: string;
  owner?: string;
}

// ファイル固有の情報を含む拡張インターフェース
export interface FileInfo extends FileSystemEntity {
  extension: string;
  mimeType: string;
  isHidden: boolean;
  isSymlink: boolean;
  isExecutable: boolean;
  mediaInfo?: MediaInfo;
  hash?: string;
  tags?: string[];
}

// ディレクトリ固有の情報を含む拡張インターフェース
export interface DirectoryInfo extends FileSystemEntity {
  itemCount: number;
  totalSize: number;
  isHidden: boolean;
  isSymlink: boolean;
  isEmpty: boolean;
}

// メディアファイル（画像、動画、音声）の情報
export interface MediaInfo {
  type: 'image' | 'video' | 'audio' | 'unknown';
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number;
  bitrate?: number;
  codec?: string;
}

// ファイルコンテンツの差分情報
export interface FileDiff {
  path1: string;
  path2: string;
  differences: {
    lineNumber: number;
    content1?: string;
    content2?: string;
    type: 'added' | 'removed' | 'changed';
  }[];
  summary: {
    added: number;
    removed: number;
    changed: number;
  };
}

// ディレクトリツリー表示用の構造
export interface DirectoryTree {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: DirectoryTree[];
}

// ファイル統計情報
export interface FileSystemStats {
  total: {
    files: number;
    directories: number;
    size: number;
  };
  byType: {
    [extension: string]: {
      count: number;
      size: number;
    };
  };
  byDate: {
    [date: string]: {
      created: number;
      modified: number;
    };
  };
  bySize: {
    small: number; // < 1MB
    medium: number; // 1MB - 100MB
    large: number; // 100MB - 1GB
    huge: number; // > 1GB
  };
}

// バッチリネーム操作のパターン
export interface RenamePattern {
  type: 'regex' | 'template' | 'sequence' | 'date' | 'case';
  pattern: string;
  replacement: string;
  options?: {
    startNumber?: number;
    step?: number;
    dateFormat?: string;
    case?: 'upper' | 'lower' | 'title' | 'camel' | 'snake' | 'kebab';
  };
}

// 検索条件
export interface SearchCriteria {
  pattern: string;
  useRegex: boolean;
  caseSensitive: boolean;
  searchContents: boolean;
  maxResults?: number;
  fileTypes?: string[];
  sizeRange?: {
    min?: number;
    max?: number;
  };
  dateRange?: {
    after?: Date;
    before?: Date;
  };
}

// 検索結果
export interface SearchResult {
  path: string;
  isDirectory: boolean;
  matches: {
    line?: number;
    content?: string;
    context?: string[];
  }[];
}

// ファイルタグ
export interface FileTag {
  path: string;
  tags: string[];
  lastUpdated: Date;
}

// ファイル操作履歴項目
export interface FileOperationHistoryItem {
  operation: 'create' | 'modify' | 'delete' | 'rename' | 'move' | 'copy';
  path: string;
  newPath?: string;
  timestamp: Date;
  size?: number;
}

// 可視化オプション
export interface VisualizationOptions {
  showHidden: boolean;
  sortBy: 'name' | 'size' | 'type' | 'date';
  sortDirection: 'asc' | 'desc';
  groupBy?: 'type' | 'date' | 'size';
  maxDepth?: number;
  colorize: boolean;
}
