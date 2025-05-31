/**
 * 強化ファイルシステムツールの共通型定義
 */

// ================== 基本型定義 ==================

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  extension: string;
  mimeType: string;
  created: Date;
  modified: Date;
  accessed: Date;
  isDirectory: boolean;
  isFile: boolean;
  permissions: string;
}

export interface OperationResult<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: Error;
  timestamp: Date;
}

// ================== セキュリティ関連型 ==================

export interface EncryptionOptions {
  algorithm: 'aes-256-gcm' | 'aes-256-cbc' | 'aes-192-gcm' | 'aes-128-gcm';
  keyDerivation: 'pbkdf2' | 'scrypt' | 'argon2';
  iterations?: number;
  saltLength?: number;
  tagLength?: number;
}

export interface EncryptionResult {
  encryptedPath: string;
  originalPath: string;
  algorithm: string;
  keyFingerprint: string;
  ivHex: string;
  saltHex: string;
  tagHex?: string;
}

export interface ChecksumResult {
  filePath: string;
  algorithm: 'md5' | 'sha1' | 'sha256' | 'sha512';
  checksum: string;
  fileSize: number;
  timestamp: Date;
}

export interface IntegrityVerification {
  filePath: string;
  expectedChecksum: string;
  actualChecksum: string;
  algorithm: string;
  isValid: boolean;
  timestamp: Date;
}

// ================== 圧縮・アーカイブ関連型 ==================

export interface ArchiveOptions {
  format: 'zip' | 'tar' | '7z' | 'gzip' | 'bzip2';
  compressionLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  password?: string;
  excludePatterns?: string[];
  includePatterns?: string[];
}

export interface ArchiveInfo {
  archivePath: string;
  format: string;
  fileCount: number;
  totalSize: number;
  compressedSize: number;
  compressionRatio: number;
  created: Date;
  files: ArchiveEntry[];
}

export interface ArchiveEntry {
  name: string;
  path: string;
  size: number;
  compressedSize: number;
  isDirectory: boolean;
  modified: Date;
  crc32?: string;
}

// ================== 監視・変更検知関連型 ==================

export interface WatchOptions {
  recursive: boolean;
  includeHidden: boolean;
  ignorePatterns?: string[];
  debounceMs?: number;
  persistent?: boolean;
}

export interface FileChange {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  path: string;
  timestamp: Date;
  stats?: FileInfo;
  previousStats?: FileInfo;
}

export interface WatchSession {
  id: string;
  path: string;
  options: WatchOptions;
  startTime: Date;
  isActive: boolean;
  changeCount: number;
}

// ================== 重複検出関連型 ==================

export interface DuplicateGroup {
  hash: string;
  size: number;
  files: DuplicateFile[];
  totalWastedSpace: number;
  duplicateMethod: 'hash' | 'name' | 'size' | 'content';
}

export interface DuplicateFile {
  path: string;
  size: number;
  modified: Date;
  isKeep: boolean;
  reason?: string;
}

export interface StorageAnalysis {
  totalFiles: number;
  totalSize: number;
  duplicateGroups: number;
  wastedSpace: number;
  wastedPercentage: number;
  largestDuplicates: DuplicateGroup[];
  recommendations: string[];
}

// ================== バージョン管理関連型 ==================

export interface FileSnapshot {
  id: string;
  filePath: string;
  snapshotPath: string;
  description: string;
  created: Date;
  fileSize: number;
  checksum: string;
  version: number;
}

export interface FileVersion {
  id: string;
  filePath: string;
  version: number;
  timestamp: Date;
  size: number;
  hash: string;
  comment?: string;
  author?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface VersionSnapshot {
  id: string;
  name: string;
  description?: string;
  timestamp: Date;
  basePath: string;
  files: FileVersion[];
  totalSize: number;
  author?: string;
}

export interface VersionDiff {
  filePath: string;
  changeType: 'added' | 'modified' | 'deleted' | 'renamed';
  oldVersion?: FileVersion;
  newVersion?: FileVersion;
  diffSummary?: string;
}

export interface VersionOptions {
  maxVersions?: number;
  autoSnapshot?: boolean;
  snapshotInterval?: number; // hours
  compressionEnabled?: boolean;
  includeMetadata?: boolean;
  excludePatterns?: string[];
}

export interface VersionRepository {
  basePath: string;
  repositoryPath: string;
  maxVersions: number;
  totalVersions: number;
  totalSize: number;
  created: Date;
  lastSnapshot: Date;
  config: VersionOptions;
}

// ================== インテリジェント分類関連型 ==================

export interface FileCategory {
  id: string;
  name: string;
  description?: string;
  patterns: string[];
  priority: number;
  autoAssign: boolean;
  color?: string;
  icon?: string;
}

export interface FileTag {
  name: string;
  category?: string;
  color?: string;
  confidence?: number; // AI信頼度
  source: 'manual' | 'auto' | 'ai';
  created: Date;
}

export interface ClassificationRule {
  id: string;
  name: string;
  description?: string;
  conditions: ClassificationCondition[];
  actions: ClassificationAction[];
  enabled: boolean;
  priority: number;
}

export interface ClassificationCondition {
  field: 'filename' | 'extension' | 'size' | 'content' | 'path' | 'metadata';
  operator: 'equals' | 'contains' | 'matches' | 'greater' | 'less' | 'range';
  value: any;
  caseSensitive?: boolean;
}

export interface ClassificationAction {
  type: 'tag' | 'category' | 'move' | 'copy' | 'metadata';
  value: any;
  params?: Record<string, any>;
}

export interface SmartFolder {
  id: string;
  name: string;
  description?: string;
  query: SearchQuery;
  autoUpdate: boolean;
  created: Date;
  lastUpdated: Date;
  fileCount: number;
}

// ================== 高度検索関連型 ==================

export interface SearchQuery {
  text?: string;
  filename?: string;
  extension?: string[];
  sizeRange?: { min?: number; max?: number };
  dateRange?: { start?: Date; end?: Date };
  tags?: string[];
  categories?: string[];
  metadata?: Record<string, any>;
  contentType?: string[];
  fuzzy?: boolean;
  maxResults?: number;
}

export interface SearchResult {
  file: FileInfo;
  score: number;
  highlights?: SearchHighlight[];
  metadata?: Record<string, any>;
  tags?: FileTag[];
  categories?: string[];
}

export interface SearchHighlight {
  field: string;
  snippet: string;
  positions: Array<{ start: number; end: number }>;
}

export interface SearchIndex {
  basePath: string;
  indexPath: string;
  totalFiles: number;
  lastUpdated: Date;
  version: string;
  config: SearchIndexConfig;
}

export interface SearchIndexConfig {
  indexContent: boolean;
  indexMetadata: boolean;
  excludePatterns: string[];
  maxFileSize: number; // MB
  supportedTypes: string[];
  updateInterval: number; // minutes
}

export interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  query: SearchQuery;
  created: Date;
  lastUsed: Date;
  useCount: number;
  favorite: boolean;
}

// ================== アクセス権限管理関連型 ==================

export interface FilePermission {
  filePath: string;
  owner: string;
  group?: string;
  permissions: Permission[];
  inherited: boolean;
  lastModified: Date;
  modifier: string;
}

export interface Permission {
  subject: string; // user or group
  subjectType: 'user' | 'group' | 'role';
  actions: PermissionAction[];
  granted: boolean;
  expiration?: Date;
  conditions?: PermissionCondition[];
}

export interface PermissionAction {
  type: 'read' | 'write' | 'execute' | 'delete' | 'modify_permissions';
  allowed: boolean;
}

export interface PermissionCondition {
  type: 'time_range' | 'ip_address' | 'location' | 'device';
  value: any;
  operator?: string;
}

export interface AccessAudit {
  id: string;
  filePath: string;
  user: string;
  action: string;
  timestamp: Date;
  success: boolean;
  ip?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description?: string;
  rules: SecurityRule[];
  enabled: boolean;
  priority: number;
  scope: string[]; // paths
  created: Date;
  lastModified: Date;
}

export interface SecurityRule {
  id: string;
  name: string;
  type: 'access_control' | 'file_protection' | 'audit_requirement';
  conditions: SecurityCondition[];
  actions: SecurityAction[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityCondition {
  field: string;
  operator: string;
  value: any;
  description?: string;
}

export interface SecurityAction {
  type: 'allow' | 'deny' | 'audit' | 'notify' | 'quarantine';
  params?: Record<string, any>;
  description?: string;
}

export interface PermissionReport {
  generatedAt: Date;
  scope: string[];
  totalFiles: number;
  totalUsers: number;
  permissions: FilePermission[];
  violations: SecurityViolation[];
  recommendations: string[];
  summary: PermissionSummary;
}

export interface SecurityViolation {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  filePath: string;
  detected: Date;
  resolved: boolean;
  resolvedAt?: Date;
  details?: Record<string, any>;
}

export interface PermissionSummary {
  totalPermissions: number;
  bySubjectType: Record<string, number>;
  byAction: Record<string, number>;
  inheritedCount: number;
  explicitCount: number;
  expiredCount: number;
  violationCount: number;
}

// ================== 使用統計関連型 ==================

export interface UsageStats {
  filePath: string;
  accessCount: number;
  lastAccessed: Date;
  firstAccessed: Date;
  totalAccessTime: number;
  averageAccessDuration: number;
  accessPattern: AccessPattern[];
}

export interface AccessPattern {
  hour: number;
  dayOfWeek: number;
  month: number;
  accessCount: number;
}

export interface UsageReport {
  period: {
    start: Date;
    end: Date;
  };
  totalFiles: number;
  mostAccessed: UsageStats[];
  leastAccessed: UsageStats[];
  unusedFiles: string[];
  accessTrends: AccessTrend[];
}

export interface AccessTrend {
  date: Date;
  totalAccesses: number;
  uniqueFiles: number;
  averageAccessTime: number;
}

// ================== ユーティリティ型 ==================

export type TimePeriod = {
  start: Date;
  end: Date;
} | {
  days: number;
} | {
  weeks: number;
} | {
  months: number;
};

export interface ProgressCallback {
  (current: number, total: number, message?: string): void;
}

export interface LogLevel {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
}

// ================== 同期・バックアップ関連型（Phase 2）==================

export interface SyncOptions {
  bidirectional: boolean;
  deleteExtraneous: boolean;
  preserveTimestamps: boolean;
  excludePatterns?: string[];
  dryRun: boolean;
  conflictResolution: 'newer' | 'larger' | 'source' | 'target';
}

export interface SyncReport {
  startTime: Date;
  endTime: Date;
  filesProcessed: number;
  filesCopied: number;
  filesDeleted: number;
  bytesTransferred: number;
  conflicts: SyncConflict[];
  errors: SyncError[];
}

export interface SyncConflict {
  path: string;
  reason: string;
  sourceModified: Date;
  targetModified: Date;
  resolution: string;
}

export interface SyncError {
  path: string;
  operation: string;
  error: string;
  timestamp: Date;
} 