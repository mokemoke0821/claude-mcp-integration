/**
 * ファイル監視・変更検知機能
 * Phase 2: 実用機能のリアルタイム監視システム
 */

import chokidar from 'chokidar';
import { promises as fs } from 'fs';
import { basename, join } from 'path';
import {
  FileChange,
  OperationResult,
  WatchOptions,
  WatchSession
} from '../types/index.js';
import {
  createFailureResult,
  createSuccessResult,
  fileExists
} from '../utils/file-helper.js';
import { logger } from '../utils/logger.js';

export class FileWatcher {
  private watchers = new Map<string, chokidar.FSWatcher>();
  private sessions = new Map<string, WatchSession>();
  private changes = new Map<string, FileChange[]>();

  private static readonly DEFAULT_OPTIONS: WatchOptions = {
    recursive: true,
    includeHidden: false,
    ignorePatterns: ['.git/**', 'node_modules/**', '.DS_Store', 'Thumbs.db'],
    debounceMs: 100,
    persistent: true
  };

  /**
   * ディレクトリ監視を開始
   */
  async startWatching(
    watchPath: string,
    options: Partial<WatchOptions> = {}
  ): Promise<OperationResult<string>> {
    try {
      logger.info(`ファイル監視を開始: ${watchPath}`);

      if (!await fileExists(watchPath)) {
        throw new Error(`監視パスが見つかりません: ${watchPath}`);
      }

      const fullOptions = { ...FileWatcher.DEFAULT_OPTIONS, ...options };
      const sessionId = this.generateSessionId();

      // 既存の監視がある場合は停止
      if (this.watchers.has(watchPath)) {
        await this.stopWatching(watchPath);
      }

      // チェンジログ初期化
      this.changes.set(sessionId, []);

      // 監視セッション作成
      const session: WatchSession = {
        id: sessionId,
        path: watchPath,
        options: fullOptions,
        startTime: new Date(),
        isActive: true,
        changeCount: 0
      };

      // chokidar監視設定
      const watcher = chokidar.watch(watchPath, {
        ignored: fullOptions.ignorePatterns,
        ignoreInitial: false,
        persistent: fullOptions.persistent,
        followSymlinks: false,
        usePolling: false,
        depth: fullOptions.recursive ? undefined : 1
      });

      // イベントハンドラー設定
      this.setupEventHandlers(watcher, sessionId, fullOptions);

      // 監視情報保存
      this.watchers.set(watchPath, watcher);
      this.sessions.set(sessionId, session);

      logger.info(`ファイル監視開始完了: セッションID ${sessionId}`);
      return createSuccessResult(`ファイル監視が開始されました: ${watchPath} (セッションID: ${sessionId})`, sessionId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`ファイル監視開始エラー: ${watchPath}`, { error });
      return createFailureResult(`ファイル監視開始に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 監視を停止
   */
  async stopWatching(watchPath: string): Promise<OperationResult<boolean>> {
    try {
      logger.info(`ファイル監視を停止: ${watchPath}`);

      const watcher = this.watchers.get(watchPath);
      if (!watcher) {
        throw new Error(`指定されたパスの監視が見つかりません: ${watchPath}`);
      }

      // セッション更新
      const session = Array.from(this.sessions.values()).find(s => s.path === watchPath);
      if (session) {
        session.isActive = false;
        this.sessions.set(session.id, session);
      }

      // 監視停止
      await watcher.close();
      this.watchers.delete(watchPath);

      logger.info(`ファイル監視停止完了: ${watchPath}`);
      return createSuccessResult(`ファイル監視が停止されました: ${watchPath}`, true);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`ファイル監視停止エラー: ${watchPath}`, { error });
      return createFailureResult(`ファイル監視停止に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 変更履歴を取得
   */
  async getChangeHistory(
    sessionId: string,
    limit?: number
  ): Promise<OperationResult<FileChange[]>> {
    try {
      logger.info(`変更履歴取得: セッション ${sessionId}`);

      const changes = this.changes.get(sessionId);
      if (!changes) {
        throw new Error(`セッションが見つかりません: ${sessionId}`);
      }

      const limitedChanges = limit ? changes.slice(-limit) : changes;

      logger.info(`変更履歴取得完了: ${limitedChanges.length}件`);
      return createSuccessResult(`変更履歴を取得しました: ${limitedChanges.length}件`, limitedChanges);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`変更履歴取得エラー: ${sessionId}`, { error });
      return createFailureResult(`変更履歴取得に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * アクティブなセッション一覧
   */
  async getActiveSessions(): Promise<OperationResult<WatchSession[]>> {
    try {
      const activeSessions = Array.from(this.sessions.values()).filter(s => s.isActive);

      logger.info(`アクティブセッション取得: ${activeSessions.length}セッション`);
      return createSuccessResult(`アクティブセッションを取得しました: ${activeSessions.length}セッション`, activeSessions);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`アクティブセッション取得エラー`, { error });
      return createFailureResult(`アクティブセッション取得に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 変更レポート生成
   */
  async generateChangeReport(
    sessionId: string,
    outputPath?: string
  ): Promise<OperationResult<string>> {
    try {
      logger.info(`変更レポート生成: セッション ${sessionId}`);

      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`セッションが見つかりません: ${sessionId}`);
      }

      const changes = this.changes.get(sessionId) || [];
      const report = this.createChangeReport(session, changes);

      const finalOutputPath = outputPath || join(process.cwd(), `change_report_${sessionId}.txt`);
      await fs.writeFile(finalOutputPath, report, 'utf-8');

      logger.info(`変更レポート生成完了: ${finalOutputPath}`);
      return createSuccessResult(`変更レポートが生成されました: ${finalOutputPath}`, finalOutputPath);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`変更レポート生成エラー: ${sessionId}`, { error });
      return createFailureResult(`変更レポート生成に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * すべての監視を停止
   */
  async stopAllWatching(): Promise<OperationResult<number>> {
    try {
      logger.info('全監視停止を開始');

      let stoppedCount = 0;
      const paths = Array.from(this.watchers.keys());

      for (const path of paths) {
        const result = await this.stopWatching(path);
        if (result.success) {
          stoppedCount++;
        }
      }

      logger.info(`全監視停止完了: ${stoppedCount}セッション停止`);
      return createSuccessResult(`すべての監視が停止されました: ${stoppedCount}セッション`, stoppedCount);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`全監視停止エラー`, { error });
      return createFailureResult(`全監視停止に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * イベントハンドラー設定（内部用）
   */
  private setupEventHandlers(
    watcher: chokidar.FSWatcher,
    sessionId: string,
    options: WatchOptions
  ): void {
    let debounceTimer: NodeJS.Timeout | null = null;
    const pendingChanges: FileChange[] = [];

    const processChanges = () => {
      if (pendingChanges.length === 0) return;

      const changes = this.changes.get(sessionId) || [];
      changes.push(...pendingChanges);
      this.changes.set(sessionId, changes);

      // セッション統計更新
      const session = this.sessions.get(sessionId);
      if (session) {
        session.changeCount += pendingChanges.length;
        this.sessions.set(sessionId, session);
      }

      logger.debug(`ファイル変更処理: ${pendingChanges.length}件`, { sessionId });
      pendingChanges.length = 0;
    };

    const addChange = (type: FileChange['type'], path: string, stats?: any) => {
      const change: FileChange = {
        type,
        path,
        timestamp: new Date(),
        stats: stats ? this.convertToFileInfo(stats) : undefined
      };

      pendingChanges.push(change);

      // デバウンス処理
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(processChanges, options.debounceMs || 100);
    };

    // ファイル追加
    watcher.on('add', (path, stats) => {
      if (this.shouldIgnoreFile(path, options)) return;
      addChange('add', path, stats);
    });

    // ファイル変更
    watcher.on('change', (path, stats) => {
      if (this.shouldIgnoreFile(path, options)) return;
      addChange('change', path, stats);
    });

    // ファイル削除
    watcher.on('unlink', (path) => {
      if (this.shouldIgnoreFile(path, options)) return;
      addChange('unlink', path);
    });

    // ディレクトリ追加
    watcher.on('addDir', (path, stats) => {
      if (this.shouldIgnoreFile(path, options)) return;
      addChange('addDir', path, stats);
    });

    // ディレクトリ削除
    watcher.on('unlinkDir', (path) => {
      if (this.shouldIgnoreFile(path, options)) return;
      addChange('unlinkDir', path);
    });

    // エラーハンドリング
    watcher.on('error', (error) => {
      logger.error(`ファイル監視エラー: セッション ${sessionId}`, { error });
    });

    // 監視準備完了
    watcher.on('ready', () => {
      logger.info(`ファイル監視準備完了: セッション ${sessionId}`);
    });
  }

  /**
   * ファイルを無視するかチェック（内部用）
   */
  private shouldIgnoreFile(filePath: string, options: WatchOptions): boolean {
    const fileName = basename(filePath);

    // 隠しファイルチェック
    if (!options.includeHidden && fileName.startsWith('.')) {
      return true;
    }

    // 無視パターンチェック
    if (options.ignorePatterns) {
      for (const pattern of options.ignorePatterns) {
        if (this.matchPattern(filePath, pattern)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * パターンマッチング（内部用）
   */
  private matchPattern(text: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]');

    return new RegExp(`^${regexPattern}$`).test(text);
  }

  /**
   * セッションID生成（内部用）
   */
  private generateSessionId(): string {
    return `watch_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * 統計情報をFileInfoに変換（内部用）
   */
  private convertToFileInfo(stats: any): any {
    return {
      size: stats.size || 0,
      created: stats.birthtime || new Date(),
      modified: stats.mtime || new Date(),
      accessed: stats.atime || new Date(),
      isDirectory: stats.isDirectory?.() || false,
      isFile: stats.isFile?.() || false
    };
  }

  /**
   * 変更レポート作成（内部用）
   */
  private createChangeReport(session: WatchSession, changes: FileChange[]): string {
    const lines: string[] = [];

    lines.push('# ファイル変更レポート');
    lines.push(`生成日時: ${new Date().toLocaleString('ja-JP')}`);
    lines.push('');

    // セッション情報
    lines.push('## セッション情報');
    lines.push(`- セッションID: ${session.id}`);
    lines.push(`- 監視パス: ${session.path}`);
    lines.push(`- 開始時刻: ${session.startTime.toLocaleString('ja-JP')}`);
    lines.push(`- 監視状態: ${session.isActive ? 'アクティブ' : '停止'}`);
    lines.push(`- 総変更数: ${session.changeCount}`);
    lines.push('');

    // 設定情報
    lines.push('## 監視設定');
    lines.push(`- 再帰監視: ${session.options.recursive ? 'あり' : 'なし'}`);
    lines.push(`- 隠しファイル: ${session.options.includeHidden ? '含む' : '除外'}`);
    lines.push(`- デバウンス: ${session.options.debounceMs}ms`);
    if (session.options.ignorePatterns && session.options.ignorePatterns.length > 0) {
      lines.push(`- 無視パターン: ${session.options.ignorePatterns.join(', ')}`);
    }
    lines.push('');

    // 変更統計
    const changeStats = this.analyzeChanges(changes);
    lines.push('## 変更統計');
    lines.push(`- ファイル追加: ${changeStats.add}件`);
    lines.push(`- ファイル変更: ${changeStats.change}件`);
    lines.push(`- ファイル削除: ${changeStats.unlink}件`);
    lines.push(`- ディレクトリ追加: ${changeStats.addDir}件`);
    lines.push(`- ディレクトリ削除: ${changeStats.unlinkDir}件`);
    lines.push('');

    // 最近の変更（最新50件）
    const recentChanges = changes.slice(-50);
    lines.push('## 最近の変更（最新50件）');
    lines.push('');

    recentChanges.forEach((change, index) => {
      const typeIcon = this.getChangeTypeIcon(change.type);
      lines.push(`${index + 1}. ${typeIcon} ${change.type.toUpperCase()}: ${change.path}`);
      lines.push(`   時刻: ${change.timestamp.toLocaleString('ja-JP')}`);
      if (change.stats) {
        lines.push(`   サイズ: ${change.stats.size || 0} bytes`);
      }
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * 変更統計分析（内部用）
   */
  private analyzeChanges(changes: FileChange[]): Record<string, number> {
    const stats: Record<string, number> = {
      add: 0,
      change: 0,
      unlink: 0,
      addDir: 0,
      unlinkDir: 0
    };

    changes.forEach(change => {
      stats[change.type] = (stats[change.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * 変更タイプアイコン取得（内部用）
   */
  private getChangeTypeIcon(type: FileChange['type']): string {
    switch (type) {
      case 'add': return '➕';
      case 'change': return '✏️';
      case 'unlink': return '🗑️';
      case 'addDir': return '📁';
      case 'unlinkDir': return '🔥';
      default: return '❓';
    }
  }
} 