/**
 * ファイル圧縮・アーカイブ機能
 * Phase 2: 実用機能の圧縮・アーカイブシステム
 */

import archiver from 'archiver';
import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { basename, dirname, extname, join } from 'path';
import * as unzipper from 'unzipper';
import {
  ArchiveInfo,
  ArchiveOptions,
  OperationResult
} from '../types/index.js';
import {
  canReadFile,
  createFailureResult,
  createSuccessResult,
  ensureDirectory,
  fileExists,
  generateSafeFilePath,
  getFilesRecursively
} from '../utils/file-helper.js';
import { logger } from '../utils/logger.js';

export class FileArchive {
  private static readonly DEFAULT_OPTIONS: ArchiveOptions = {
    format: 'zip',
    compressionLevel: 6,
    excludePatterns: ['.DS_Store', 'Thumbs.db', '.git/**'],
    includePatterns: []
  };

  /**
   * ファイル・ディレクトリを圧縮
   */
  async createArchive(
    sourcePaths: string[],
    outputPath: string,
    options: Partial<ArchiveOptions> = {}
  ): Promise<OperationResult<ArchiveInfo>> {
    try {
      logger.info(`アーカイブ作成を開始: ${sourcePaths.length}アイテム -> ${outputPath}`);

      const fullOptions = { ...FileArchive.DEFAULT_OPTIONS, ...options };

      // 入力パスの検証
      for (const path of sourcePaths) {
        if (!await fileExists(path)) {
          throw new Error(`ソースが見つかりません: ${path}`);
        }
      }

      // 出力ディレクトリの作成
      await ensureDirectory(dirname(outputPath));

      // 安全な出力パス生成
      const safeOutputPath = await generateSafeFilePath(outputPath);

      // 圧縮実行
      const archiveInfo = await this.performCompression(sourcePaths, safeOutputPath, fullOptions);

      logger.info(`アーカイブ作成完了: ${archiveInfo.fileCount}ファイル, 圧縮率: ${(archiveInfo.compressionRatio * 100).toFixed(1)}%`);
      return createSuccessResult(`アーカイブが正常に作成されました: ${safeOutputPath}`, archiveInfo);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`アーカイブ作成エラー`, { error, sourcePaths, outputPath });
      return createFailureResult(`アーカイブ作成に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * アーカイブを展開
   */
  async extractArchive(
    archivePath: string,
    outputDirectory: string,
    password?: string
  ): Promise<OperationResult<string[]>> {
    try {
      logger.info(`アーカイブ展開を開始: ${archivePath} -> ${outputDirectory}`);

      if (!await fileExists(archivePath)) {
        throw new Error(`アーカイブファイルが見つかりません: ${archivePath}`);
      }

      if (!await canReadFile(archivePath)) {
        throw new Error(`アーカイブファイル読み取り権限がありません: ${archivePath}`);
      }

      // 出力ディレクトリの作成
      await ensureDirectory(outputDirectory);

      // 拡張子に基づく形式判定
      const format = this.detectArchiveFormat(archivePath);

      // 展開実行
      const extractedFiles = await this.performExtraction(archivePath, outputDirectory, format, password);

      logger.info(`アーカイブ展開完了: ${extractedFiles.length}ファイル展開`);
      return createSuccessResult(`アーカイブが正常に展開されました: ${extractedFiles.length}ファイル`, extractedFiles);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`アーカイブ展開エラー: ${archivePath}`, { error });
      return createFailureResult(`アーカイブ展開に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * アーカイブ情報を取得
   */
  async getArchiveInfo(archivePath: string): Promise<OperationResult<ArchiveInfo>> {
    try {
      logger.info(`アーカイブ情報取得を開始: ${archivePath}`);

      if (!await fileExists(archivePath)) {
        throw new Error(`アーカイブファイルが見つかりません: ${archivePath}`);
      }

      const format = this.detectArchiveFormat(archivePath);
      const archiveInfo = await this.analyzeArchive(archivePath, format);

      logger.info(`アーカイブ情報取得完了: ${archiveInfo.fileCount}ファイル`);
      return createSuccessResult(`アーカイブ情報を正常に取得しました`, archiveInfo);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`アーカイブ情報取得エラー: ${archivePath}`, { error });
      return createFailureResult(`アーカイブ情報取得に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 複数ディレクトリの一括圧縮
   */
  async createMultipleArchives(
    sourceDirectories: string[],
    outputDirectory: string,
    options: Partial<ArchiveOptions> = {}
  ): Promise<OperationResult<ArchiveInfo[]>> {
    try {
      logger.info(`複数アーカイブ作成を開始: ${sourceDirectories.length}ディレクトリ`);

      const results: ArchiveInfo[] = [];
      const errors: string[] = [];

      await ensureDirectory(outputDirectory);

      for (const sourceDir of sourceDirectories) {
        try {
          const dirName = basename(sourceDir);
          const outputPath = join(outputDirectory, `${dirName}.${options.format || 'zip'}`);

          const result = await this.createArchive([sourceDir], outputPath, options);
          if (result.success && result.data) {
            results.push(result.data);
          } else {
            errors.push(`${sourceDir}: ${result.message}`);
          }
        } catch (error) {
          errors.push(`${sourceDir}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      if (errors.length > 0) {
        logger.warn(`複数アーカイブ作成で一部エラー発生`, { errors });
        return createSuccessResult(
          `${results.length}/${sourceDirectories.length}ディレクトリのアーカイブ作成に成功。エラー: ${errors.join(', ')}`,
          results
        );
      }

      logger.info(`複数アーカイブ作成完了: ${results.length}アーカイブ`);
      return createSuccessResult(`${results.length}個のアーカイブが正常に作成されました`, results);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`複数アーカイブ作成エラー`, { error });
      return createFailureResult(`複数アーカイブ作成に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 実際の圧縮処理（内部用）
   */
  private async performCompression(
    sourcePaths: string[],
    outputPath: string,
    options: ArchiveOptions
  ): Promise<ArchiveInfo> {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(outputPath);
      const archive = archiver(options.format as any, {
        zlib: { level: options.compressionLevel }
      });

      let fileCount = 0;
      let totalSize = 0;
      const files: any[] = [];

      // エラーハンドリング
      archive.on('error', reject);
      output.on('error', reject);

      // 進行状況追跡
      archive.on('entry', (entry) => {
        fileCount++;
        totalSize += entry.stats?.size || 0;
        files.push({
          name: entry.name,
          path: entry.name,
          size: entry.stats?.size || 0,
          compressedSize: 0, // 圧縮後に更新
          isDirectory: entry.stats?.isDirectory() || false,
          modified: entry.stats?.mtime || new Date()
        });
      });

      // 完了処理
      output.on('close', async () => {
        try {
          const stats = await fs.stat(outputPath);
          const compressedSize = stats.size;
          const compressionRatio = totalSize > 0 ? compressedSize / totalSize : 0;

          const archiveInfo: ArchiveInfo = {
            archivePath: outputPath,
            format: options.format,
            fileCount,
            totalSize,
            compressedSize,
            compressionRatio,
            created: new Date(),
            files
          };

          resolve(archiveInfo);
        } catch (error) {
          reject(error);
        }
      });

      // パイプ設定
      archive.pipe(output);

      // ファイル追加
      this.addFilesToArchive(archive, sourcePaths, options)
        .then(() => archive.finalize())
        .catch(reject);
    });
  }

  /**
   * 実際の展開処理（内部用）
   */
  private async performExtraction(
    archivePath: string,
    outputDirectory: string,
    format: string,
    password?: string
  ): Promise<string[]> {
    const extractedFiles: string[] = [];

    if (format === 'zip') {
      return new Promise((resolve, reject) => {
        const stream = createReadStream(archivePath)
          .pipe(unzipper.Parse({ forceStream: true }));

        stream.on('entry', (entry: any) => {
          const fileName = entry.path;
          const type = entry.type;
          const outputPath = join(outputDirectory, fileName);

          if (type === 'File') {
            ensureDirectory(dirname(outputPath))
              .then(() => {
                entry.pipe(createWriteStream(outputPath));
                extractedFiles.push(outputPath);
              })
              .catch(reject);
          } else {
            entry.autodrain();
          }
        });

        stream.on('error', reject);
        stream.on('close', () => resolve(extractedFiles));
      });
    }

    throw new Error(`未対応の形式: ${format}`);
  }

  /**
   * アーカイブ分析（内部用）
   */
  private async analyzeArchive(archivePath: string, format: string): Promise<ArchiveInfo> {
    const stats = await fs.stat(archivePath);

    // 基本情報
    const archiveInfo: ArchiveInfo = {
      archivePath,
      format,
      fileCount: 0,
      totalSize: 0,
      compressedSize: stats.size,
      compressionRatio: 0,
      created: stats.mtime,
      files: []
    };

    if (format === 'zip') {
      return new Promise((resolve, reject) => {
        const files: any[] = [];
        let totalSize = 0;

        createReadStream(archivePath)
          .pipe(unzipper.Parse({ forceStream: true }))
          .on('entry', (entry: any) => {
            files.push({
              name: basename(entry.path),
              path: entry.path,
              size: entry.vars?.uncompressedSize || 0,
              compressedSize: entry.vars?.compressedSize || 0,
              isDirectory: entry.type === 'Directory',
              modified: entry.vars?.lastModified || new Date()
            });
            totalSize += entry.vars?.uncompressedSize || 0;
            entry.autodrain();
          })
          .on('error', reject)
          .on('close', () => {
            archiveInfo.fileCount = files.length;
            archiveInfo.totalSize = totalSize;
            archiveInfo.compressionRatio = totalSize > 0 ? stats.size / totalSize : 0;
            archiveInfo.files = files;
            resolve(archiveInfo);
          });
      });
    }

    return archiveInfo;
  }

  /**
   * アーカイブにファイル追加（内部用）
   */
  private async addFilesToArchive(
    archive: archiver.Archiver,
    sourcePaths: string[],
    options: ArchiveOptions
  ): Promise<void> {
    for (const sourcePath of sourcePaths) {
      const stats = await fs.stat(sourcePath);

      if (stats.isDirectory()) {
        // ディレクトリの場合、再帰的に追加
        const files = await getFilesRecursively(sourcePath, {
          includeHidden: false,
          fileFilter: (filePath) => this.shouldIncludeFile(filePath, options)
        });

        for (const file of files) {
          const relativePath = file.replace(sourcePath + '/', '');
          archive.file(file, { name: relativePath });
        }
      } else {
        // ファイルの場合、直接追加
        if (this.shouldIncludeFile(sourcePath, options)) {
          archive.file(sourcePath, { name: basename(sourcePath) });
        }
      }
    }
  }

  /**
   * ファイルをアーカイブに含めるかチェック（内部用）
   */
  private shouldIncludeFile(filePath: string, options: ArchiveOptions): boolean {
    const fileName = basename(filePath);

    // 除外パターンチェック
    if (options.excludePatterns) {
      for (const pattern of options.excludePatterns) {
        if (this.matchPattern(filePath, pattern) || this.matchPattern(fileName, pattern)) {
          return false;
        }
      }
    }

    // 含むパターンチェック
    if (options.includePatterns && options.includePatterns.length > 0) {
      for (const pattern of options.includePatterns) {
        if (this.matchPattern(filePath, pattern) || this.matchPattern(fileName, pattern)) {
          return true;
        }
      }
      return false;
    }

    return true;
  }

  /**
   * パターンマッチング（内部用）
   */
  private matchPattern(text: string, pattern: string): boolean {
    // 簡単なglob風パターンマッチング
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]');

    return new RegExp(`^${regexPattern}$`).test(text);
  }

  /**
   * アーカイブ形式検出（内部用）
   */
  private detectArchiveFormat(archivePath: string): string {
    const ext = extname(archivePath).toLowerCase();

    switch (ext) {
      case '.zip':
        return 'zip';
      case '.tar':
        return 'tar';
      case '.gz':
      case '.tgz':
        return 'tar.gz';
      case '.bz2':
        return 'tar.bz2';
      case '.7z':
        return '7z';
      default:
        return 'zip'; // デフォルト
    }
  }
} 