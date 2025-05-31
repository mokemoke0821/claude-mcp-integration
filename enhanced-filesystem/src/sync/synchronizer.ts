/**
 * ファイル同期・バックアップ機能
 * Phase 2: 実用機能の同期・バックアップシステム
 */

import { promises as fs } from 'fs';
import { basename, dirname, join, relative } from 'path';
import {
  OperationResult,
  SyncConflict,
  SyncOptions,
  SyncReport
} from '../types/index.js';
import {
  calculateFileHash,
  createFailureResult,
  createSuccessResult,
  ensureDirectory,
  fileExists,
  formatFileSize,
  getFilesRecursively
} from '../utils/file-helper.js';
import { logger } from '../utils/logger.js';

export class FileSynchronizer {
  private static readonly DEFAULT_OPTIONS: SyncOptions = {
    bidirectional: false,
    deleteExtraneous: false,
    preserveTimestamps: true,
    excludePatterns: ['.git/**', 'node_modules/**', '.DS_Store', 'Thumbs.db'],
    dryRun: false,
    conflictResolution: 'newer'
  };

  /**
   * ディレクトリ同期
   */
  async synchronizeDirectories(
    sourcePath: string,
    targetPath: string,
    options: Partial<SyncOptions> = {}
  ): Promise<OperationResult<SyncReport>> {
    try {
      logger.info(`ディレクトリ同期を開始: ${sourcePath} -> ${targetPath}`);

      if (!await fileExists(sourcePath)) {
        throw new Error(`ソースディレクトリが見つかりません: ${sourcePath}`);
      }

      const fullOptions = { ...FileSynchronizer.DEFAULT_OPTIONS, ...options };
      const startTime = new Date();

      // ターゲットディレクトリを作成
      await ensureDirectory(targetPath);

      // 同期実行
      const report = await this.performSync(sourcePath, targetPath, fullOptions);
      report.startTime = startTime;
      report.endTime = new Date();

      const message = fullOptions.dryRun
        ? `同期シミュレーション完了: ${report.filesCopied}ファイル処理予定`
        : `ディレクトリ同期完了: ${report.filesCopied}ファイル同期`;

      logger.info(`ディレクトリ同期完了: ${formatFileSize(report.bytesTransferred)}転送`);
      return createSuccessResult(message, report);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`ディレクトリ同期エラー: ${sourcePath}`, { error });
      return createFailureResult(`ディレクトリ同期に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 増分バックアップ
   */
  async createIncrementalBackup(
    sourcePath: string,
    backupPath: string,
    options: Partial<SyncOptions> = {}
  ): Promise<OperationResult<SyncReport>> {
    try {
      logger.info(`増分バックアップを開始: ${sourcePath} -> ${backupPath}`);

      const backupOptions: SyncOptions = {
        ...FileSynchronizer.DEFAULT_OPTIONS,
        ...options,
        bidirectional: false,
        deleteExtraneous: false,
        conflictResolution: 'source'
      };

      // タイムスタンプ付きバックアップディレクトリ作成
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const incrementalBackupPath = join(backupPath, `backup_${timestamp}`);

      const result = await this.synchronizeDirectories(sourcePath, incrementalBackupPath, backupOptions);

      if (result.success && result.data) {
        logger.info(`増分バックアップ完了: ${incrementalBackupPath}`);
        return createSuccessResult(`増分バックアップが完了しました: ${incrementalBackupPath}`, result.data);
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`増分バックアップエラー: ${sourcePath}`, { error });
      return createFailureResult(`増分バックアップに失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * ミラーバックアップ
   */
  async createMirrorBackup(
    sourcePath: string,
    mirrorPath: string,
    options: Partial<SyncOptions> = {}
  ): Promise<OperationResult<SyncReport>> {
    try {
      logger.info(`ミラーバックアップを開始: ${sourcePath} -> ${mirrorPath}`);

      const mirrorOptions: SyncOptions = {
        ...FileSynchronizer.DEFAULT_OPTIONS,
        ...options,
        bidirectional: false,
        deleteExtraneous: true,
        conflictResolution: 'source'
      };

      const result = await this.synchronizeDirectories(sourcePath, mirrorPath, mirrorOptions);

      if (result.success && result.data) {
        logger.info(`ミラーバックアップ完了: ${mirrorPath}`);
        return createSuccessResult(`ミラーバックアップが完了しました: ${mirrorPath}`, result.data);
      }

      return createFailureResult(`ミラーバックアップに失敗しました: ${result.message}`, result.error);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`ミラーバックアップエラー: ${sourcePath}`, { error });
      return createFailureResult(`ミラーバックアップに失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 双方向同期
   */
  async bidirectionalSync(
    path1: string,
    path2: string,
    options: Partial<SyncOptions> = {}
  ): Promise<OperationResult<SyncReport>> {
    try {
      logger.info(`双方向同期を開始: ${path1} <-> ${path2}`);

      if (!await fileExists(path1) || !await fileExists(path2)) {
        throw new Error('双方のパスが存在する必要があります');
      }

      const syncOptions: SyncOptions = {
        ...FileSynchronizer.DEFAULT_OPTIONS,
        ...options,
        bidirectional: true,
        conflictResolution: options.conflictResolution || 'newer'
      };

      // 双方向同期実行
      const report = await this.performBidirectionalSync(path1, path2, syncOptions);

      logger.info(`双方向同期完了: ${report.filesCopied}ファイル同期`);
      return createSuccessResult(`双方向同期が完了しました: ${report.filesCopied}ファイル同期`, report);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`双方向同期エラー: ${path1} <-> ${path2}`, { error });
      return createFailureResult(`双方向同期に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 同期レポート生成
   */
  async generateSyncReport(
    syncReport: SyncReport,
    outputPath?: string
  ): Promise<OperationResult<string>> {
    try {
      logger.info(`同期レポート生成を開始`);

      const report = this.createSyncReport(syncReport);
      const finalOutputPath = outputPath || join(process.cwd(), `sync_report_${Date.now()}.txt`);

      await fs.writeFile(finalOutputPath, report, 'utf-8');

      logger.info(`同期レポート生成完了: ${finalOutputPath}`);
      return createSuccessResult(`同期レポートが生成されました: ${finalOutputPath}`, finalOutputPath);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`同期レポート生成エラー`, { error });
      return createFailureResult(`同期レポート生成に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 実際の同期処理（内部用）
   */
  private async performSync(
    sourcePath: string,
    targetPath: string,
    options: SyncOptions
  ): Promise<SyncReport> {
    const report: SyncReport = {
      startTime: new Date(),
      endTime: new Date(),
      filesProcessed: 0,
      filesCopied: 0,
      filesDeleted: 0,
      bytesTransferred: 0,
      conflicts: [],
      errors: []
    };

    try {
      // ソースファイル一覧取得
      const sourceFiles = await getFilesRecursively(sourcePath, {
        includeHidden: false,
        fileFilter: (filePath) => this.shouldIncludeFile(filePath, options)
      });

      // ターゲットファイル一覧取得
      const targetFiles = await getFilesRecursively(targetPath, {
        includeHidden: false
      });

      const targetFileSet = new Set(targetFiles.map(f => relative(targetPath, f)));

      for (const sourceFile of sourceFiles) {
        try {
          const relativePath = relative(sourcePath, sourceFile);
          const targetFile = join(targetPath, relativePath);

          report.filesProcessed++;

          if (await this.shouldCopyFile(sourceFile, targetFile, options)) {
            if (!options.dryRun) {
              await ensureDirectory(dirname(targetFile));
              await this.copyFileWithMetadata(sourceFile, targetFile, options);
            }

            const sourceStats = await fs.stat(sourceFile);
            report.filesCopied++;
            report.bytesTransferred += sourceStats.size;
          }

          targetFileSet.delete(relativePath);

        } catch (error) {
          report.errors.push({
            path: sourceFile,
            operation: 'copy',
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date()
          });
        }
      }

      // 余分なファイルの削除
      if (options.deleteExtraneous) {
        for (const extraFile of targetFileSet) {
          try {
            const targetFile = join(targetPath, extraFile);
            if (!options.dryRun) {
              await fs.unlink(targetFile);
            }
            report.filesDeleted++;
          } catch (error) {
            report.errors.push({
              path: extraFile,
              operation: 'delete',
              error: error instanceof Error ? error.message : String(error),
              timestamp: new Date()
            });
          }
        }
      }

    } catch (error) {
      report.errors.push({
        path: sourcePath,
        operation: 'sync',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      });
    }

    return report;
  }

  /**
   * 双方向同期処理（内部用）
   */
  private async performBidirectionalSync(
    path1: string,
    path2: string,
    options: SyncOptions
  ): Promise<SyncReport> {
    const report: SyncReport = {
      startTime: new Date(),
      endTime: new Date(),
      filesProcessed: 0,
      filesCopied: 0,
      filesDeleted: 0,
      bytesTransferred: 0,
      conflicts: [],
      errors: []
    };

    try {
      // 両方のディレクトリからファイル一覧取得
      const files1 = await getFilesRecursively(path1, {
        includeHidden: false,
        fileFilter: (filePath) => this.shouldIncludeFile(filePath, options)
      });

      const files2 = await getFilesRecursively(path2, {
        includeHidden: false,
        fileFilter: (filePath) => this.shouldIncludeFile(filePath, options)
      });

      // 相対パスのマップ作成
      const map1 = new Map<string, string>();
      const map2 = new Map<string, string>();

      files1.forEach(f => map1.set(relative(path1, f), f));
      files2.forEach(f => map2.set(relative(path2, f), f));

      // すべての相対パスの結合
      const allPaths = new Set([...map1.keys(), ...map2.keys()]);

      for (const relativePath of allPaths) {
        try {
          const file1 = map1.get(relativePath);
          const file2 = map2.get(relativePath);

          report.filesProcessed++;

          if (file1 && file2) {
            // 両方に存在 - 競合解決
            const conflict = await this.resolveConflict(file1, file2, options);
            if (conflict) {
              report.conflicts.push(conflict);
            }
          } else if (file1) {
            // path1にのみ存在 - path2にコピー
            const targetFile = join(path2, relativePath);
            if (!options.dryRun) {
              await ensureDirectory(dirname(targetFile));
              await this.copyFileWithMetadata(file1, targetFile, options);
            }
            const stats = await fs.stat(file1);
            report.filesCopied++;
            report.bytesTransferred += stats.size;
          } else if (file2) {
            // path2にのみ存在 - path1にコピー
            const targetFile = join(path1, relativePath);
            if (!options.dryRun) {
              await ensureDirectory(dirname(targetFile));
              await this.copyFileWithMetadata(file2, targetFile, options);
            }
            const stats = await fs.stat(file2);
            report.filesCopied++;
            report.bytesTransferred += stats.size;
          }

        } catch (error) {
          report.errors.push({
            path: relativePath,
            operation: 'bidirectional-sync',
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date()
          });
        }
      }

    } catch (error) {
      report.errors.push({
        path: `${path1} <-> ${path2}`,
        operation: 'bidirectional-sync',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      });
    }

    return report;
  }

  /**
   * ファイルコピーの必要性チェック（内部用）
   */
  private async shouldCopyFile(
    sourceFile: string,
    targetFile: string,
    options: SyncOptions
  ): Promise<boolean> {
    if (!await fileExists(targetFile)) {
      return true; // ターゲットにファイルが存在しない
    }

    try {
      const sourceStats = await fs.stat(sourceFile);
      const targetStats = await fs.stat(targetFile);

      // サイズ比較
      if (sourceStats.size !== targetStats.size) {
        return true;
      }

      // タイムスタンプ比較
      if (sourceStats.mtime > targetStats.mtime) {
        return true;
      }

      // 詳細比較が必要な場合はハッシュ比較
      if (options.conflictResolution === 'source') {
        return true;
      }

      const sourceHash = await calculateFileHash(sourceFile, 'sha256');
      const targetHash = await calculateFileHash(targetFile, 'sha256');

      return sourceHash !== targetHash;

    } catch (error) {
      logger.warn(`ファイル比較エラー: ${sourceFile}`, { error });
      return true; // エラー時はコピーする
    }
  }

  /**
   * メタデータ付きファイルコピー（内部用）
   */
  private async copyFileWithMetadata(
    sourceFile: string,
    targetFile: string,
    options: SyncOptions
  ): Promise<void> {
    await fs.copyFile(sourceFile, targetFile);

    if (options.preserveTimestamps) {
      try {
        const stats = await fs.stat(sourceFile);
        await fs.utimes(targetFile, stats.atime, stats.mtime);
      } catch (error) {
        logger.warn(`タイムスタンプ設定失敗: ${targetFile}`, { error });
      }
    }
  }

  /**
   * 競合解決（内部用）
   */
  private async resolveConflict(
    file1: string,
    file2: string,
    options: SyncOptions
  ): Promise<SyncConflict | null> {
    try {
      const stats1 = await fs.stat(file1);
      const stats2 = await fs.stat(file2);

      // ファイルが同じかチェック
      const hash1 = await calculateFileHash(file1, 'sha256');
      const hash2 = await calculateFileHash(file2, 'sha256');

      if (hash1 === hash2) {
        return null; // 同じファイル、競合なし
      }

      // 競合解決戦略に従って処理
      let resolution = '';
      let copyFrom = '';
      let copyTo = '';

      switch (options.conflictResolution) {
        case 'newer':
          if (stats1.mtime > stats2.mtime) {
            copyFrom = file1;
            copyTo = file2;
            resolution = 'より新しいファイルを採用';
          } else if (stats2.mtime > stats1.mtime) {
            copyFrom = file2;
            copyTo = file1;
            resolution = 'より新しいファイルを採用';
          } else {
            resolution = '同じ更新日時のため手動解決が必要';
          }
          break;

        case 'larger':
          if (stats1.size > stats2.size) {
            copyFrom = file1;
            copyTo = file2;
            resolution = 'より大きいファイルを採用';
          } else if (stats2.size > stats1.size) {
            copyFrom = file2;
            copyTo = file1;
            resolution = 'より大きいファイルを採用';
          } else {
            resolution = '同じサイズのため手動解決が必要';
          }
          break;

        case 'source':
          copyFrom = file1;
          copyTo = file2;
          resolution = 'ソースファイルを採用';
          break;

        case 'target':
          resolution = 'ターゲットファイルを保持';
          break;

        default:
          resolution = '手動解決が必要';
      }

      // 実際のコピー実行
      if (copyFrom && copyTo && !options.dryRun) {
        await this.copyFileWithMetadata(copyFrom, copyTo, options);
      }

      return {
        path: relative(process.cwd(), file1),
        reason: '異なる内容のファイルが両方に存在',
        sourceModified: stats1.mtime,
        targetModified: stats2.mtime,
        resolution
      };

    } catch (error) {
      logger.error(`競合解決エラー: ${file1} vs ${file2}`, { error });
      return {
        path: relative(process.cwd(), file1),
        reason: '競合解決処理中にエラーが発生',
        sourceModified: new Date(),
        targetModified: new Date(),
        resolution: 'エラーのため未解決'
      };
    }
  }

  /**
   * ファイルを含めるかチェック（内部用）
   */
  private shouldIncludeFile(filePath: string, options: SyncOptions): boolean {
    if (!options.excludePatterns) return true;

    const fileName = basename(filePath);

    for (const pattern of options.excludePatterns) {
      if (this.matchPattern(filePath, pattern) || this.matchPattern(fileName, pattern)) {
        return false;
      }
    }

    return true;
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
   * 同期レポート作成（内部用）
   */
  private createSyncReport(syncReport: SyncReport): string {
    const lines: string[] = [];

    lines.push('# ファイル同期レポート');
    lines.push(`生成日時: ${new Date().toLocaleString('ja-JP')}`);
    lines.push('');

    // サマリー
    const duration = syncReport.endTime.getTime() - syncReport.startTime.getTime();
    lines.push('## 同期サマリー');
    lines.push(`- 開始時刻: ${syncReport.startTime.toLocaleString('ja-JP')}`);
    lines.push(`- 終了時刻: ${syncReport.endTime.toLocaleString('ja-JP')}`);
    lines.push(`- 処理時間: ${Math.round(duration / 1000)}秒`);
    lines.push(`- 処理ファイル数: ${syncReport.filesProcessed}`);
    lines.push(`- コピーファイル数: ${syncReport.filesCopied}`);
    lines.push(`- 削除ファイル数: ${syncReport.filesDeleted}`);
    lines.push(`- 転送データ量: ${formatFileSize(syncReport.bytesTransferred)}`);
    lines.push(`- 競合数: ${syncReport.conflicts.length}`);
    lines.push(`- エラー数: ${syncReport.errors.length}`);
    lines.push('');

    // 競合詳細
    if (syncReport.conflicts.length > 0) {
      lines.push('## 競合詳細');
      syncReport.conflicts.forEach((conflict, index) => {
        lines.push(`### 競合 ${index + 1}: ${conflict.path}`);
        lines.push(`- 理由: ${conflict.reason}`);
        lines.push(`- ソース更新日: ${conflict.sourceModified.toLocaleString('ja-JP')}`);
        lines.push(`- ターゲット更新日: ${conflict.targetModified.toLocaleString('ja-JP')}`);
        lines.push(`- 解決方法: ${conflict.resolution}`);
        lines.push('');
      });
    }

    // エラー詳細
    if (syncReport.errors.length > 0) {
      lines.push('## エラー詳細');
      syncReport.errors.forEach((error, index) => {
        lines.push(`### エラー ${index + 1}: ${error.path}`);
        lines.push(`- 操作: ${error.operation}`);
        lines.push(`- エラー: ${error.error}`);
        lines.push(`- 発生時刻: ${error.timestamp.toLocaleString('ja-JP')}`);
        lines.push('');
      });
    }

    return lines.join('\n');
  }
} 