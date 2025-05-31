/**
 * ファイルバージョン管理システム
 * Phase 3: 高度機能のバージョン管理・履歴システム
 */

import { promises as fs } from 'fs';
import { basename, dirname, join, relative } from 'path';
import {
  FileVersion,
  OperationResult,
  VersionDiff,
  VersionOptions,
  VersionRepository,
  VersionSnapshot
} from '../types/index.js';
import {
  calculateFileHash,
  createFailureResult,
  createSuccessResult,
  ensureDirectory,
  fileExists,
  formatFileSize,
  getFileInfo,
  getFilesRecursively
} from '../utils/file-helper.js';
import { logger } from '../utils/logger.js';

export class VersionManager {
  private static readonly DEFAULT_OPTIONS: VersionOptions = {
    maxVersions: 10,
    autoSnapshot: false,
    snapshotInterval: 24, // hours
    compressionEnabled: true,
    includeMetadata: true,
    excludePatterns: ['.git/**', 'node_modules/**', '.tmp', '.cache/**']
  };

  /**
   * バージョン管理リポジトリを初期化
   */
  async initializeRepository(
    basePath: string,
    repositoryPath?: string,
    options: Partial<VersionOptions> = {}
  ): Promise<OperationResult<VersionRepository>> {
    try {
      logger.info(`バージョン管理リポジトリ初期化: ${basePath}`);

      if (!await fileExists(basePath)) {
        throw new Error(`ベースパスが見つかりません: ${basePath}`);
      }

      const fullOptions = { ...VersionManager.DEFAULT_OPTIONS, ...options };
      const repoPath = repositoryPath || join(basePath, '.versions');

      // リポジトリディレクトリ作成
      await ensureDirectory(repoPath);
      await ensureDirectory(join(repoPath, 'snapshots'));
      await ensureDirectory(join(repoPath, 'versions'));
      await ensureDirectory(join(repoPath, 'metadata'));

      const repository: VersionRepository = {
        basePath,
        repositoryPath: repoPath,
        maxVersions: fullOptions.maxVersions || 10,
        totalVersions: 0,
        totalSize: 0,
        created: new Date(),
        lastSnapshot: new Date(),
        config: fullOptions
      };

      // リポジトリ設定保存
      const configPath = join(repoPath, 'config.json');
      await fs.writeFile(configPath, JSON.stringify(repository, null, 2), 'utf-8');

      logger.info(`バージョン管理リポジトリ初期化完了: ${repoPath}`);
      return createSuccessResult(`バージョン管理リポジトリが初期化されました: ${repoPath}`, repository);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`バージョン管理リポジトリ初期化エラー: ${basePath}`, { error });
      return createFailureResult(`リポジトリ初期化に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * ファイルのバージョンを作成
   */
  async createFileVersion(
    filePath: string,
    repositoryPath: string,
    comment?: string,
    author?: string
  ): Promise<OperationResult<FileVersion>> {
    try {
      logger.info(`ファイルバージョン作成: ${filePath}`);

      if (!await fileExists(filePath)) {
        throw new Error(`ファイルが見つかりません: ${filePath}`);
      }

      if (!await fileExists(repositoryPath)) {
        throw new Error(`リポジトリが見つかりません: ${repositoryPath}`);
      }

      // リポジトリ設定読み込み
      const repository = await this.loadRepository(repositoryPath);

      // 既存バージョン確認
      const versions = await this.getFileVersions(filePath, repositoryPath);
      const nextVersion = versions.length + 1;

      // ファイル情報取得
      const fileInfo = await getFileInfo(filePath);
      const fileHash = await calculateFileHash(filePath, 'sha256');

      // 同じハッシュのバージョンが存在するかチェック
      const existingVersion = versions.find(v => v.hash === fileHash);
      if (existingVersion) {
        return createSuccessResult(`同じ内容のバージョンが既に存在します: v${existingVersion.version}`, existingVersion);
      }

      // バージョンID生成
      const versionId = this.generateVersionId(filePath, nextVersion);

      // バージョンファイルパス
      const versionFileName = `${basename(filePath)}.v${nextVersion}`;
      const versionPath = join(repositoryPath, 'versions', versionFileName);

      // ファイルコピー
      await fs.copyFile(filePath, versionPath);

      const fileVersion: FileVersion = {
        id: versionId,
        filePath,
        version: nextVersion,
        timestamp: new Date(),
        size: fileInfo.size,
        hash: fileHash,
        comment,
        author,
        tags: [],
        metadata: repository.config.includeMetadata ? {
          originalName: basename(filePath),
          versionPath,
          created: fileInfo.created,
          modified: fileInfo.modified,
          mimeType: fileInfo.mimeType
        } : undefined
      };

      // メタデータ保存
      const metadataPath = join(repositoryPath, 'metadata', `${versionId}.json`);
      await fs.writeFile(metadataPath, JSON.stringify(fileVersion, null, 2), 'utf-8');

      // 古いバージョンの清理
      await this.cleanupOldVersions(filePath, repositoryPath, repository.maxVersions);

      logger.info(`ファイルバージョン作成完了: v${nextVersion}`);
      return createSuccessResult(`ファイルのバージョンv${nextVersion}が作成されました`, fileVersion);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`ファイルバージョン作成エラー: ${filePath}`, { error });
      return createFailureResult(`ファイルバージョン作成に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * スナップショットを作成
   */
  async createSnapshot(
    basePath: string,
    repositoryPath: string,
    name: string,
    description?: string,
    author?: string
  ): Promise<OperationResult<VersionSnapshot>> {
    try {
      logger.info(`スナップショット作成開始: ${name}`);

      if (!await fileExists(basePath)) {
        throw new Error(`ベースパスが見つかりません: ${basePath}`);
      }

      const repository = await this.loadRepository(repositoryPath);

      // すべてのファイルを収集
      const allFiles = await getFilesRecursively(basePath, {
        includeHidden: false,
        fileFilter: (filePath) => this.shouldIncludeFile(filePath, repository.config)
      });

      logger.info(`スナップショット対象ファイル: ${allFiles.length}個`);

      const snapshotId = this.generateSnapshotId(name);
      const snapshotFiles: FileVersion[] = [];
      let totalSize = 0;

      // 各ファイルのバージョン作成
      for (const filePath of allFiles) {
        try {
          const fileInfo = await getFileInfo(filePath);
          const fileHash = await calculateFileHash(filePath, 'sha256');

          const fileVersion: FileVersion = {
            id: this.generateVersionId(filePath, 1),
            filePath: relative(basePath, filePath),
            version: 1,
            timestamp: new Date(),
            size: fileInfo.size,
            hash: fileHash,
            comment: `スナップショット: ${name}`,
            author,
            metadata: repository.config.includeMetadata ? {
              originalPath: filePath,
              created: fileInfo.created,
              modified: fileInfo.modified,
              mimeType: fileInfo.mimeType
            } : undefined
          };

          snapshotFiles.push(fileVersion);
          totalSize += fileInfo.size;

        } catch (error) {
          logger.warn(`ファイル処理スキップ: ${filePath}`, { error });
        }
      }

      const snapshot: VersionSnapshot = {
        id: snapshotId,
        name,
        description,
        timestamp: new Date(),
        basePath,
        files: snapshotFiles,
        totalSize,
        author
      };

      // スナップショット保存
      const snapshotPath = join(repositoryPath, 'snapshots', `${snapshotId}.json`);
      await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf-8');

      // スナップショットデータコピー（圧縮オプションが有効な場合）
      if (repository.config.compressionEnabled) {
        const dataPath = join(repositoryPath, 'snapshots', snapshotId);
        await ensureDirectory(dataPath);

        for (const file of snapshotFiles) {
          const sourcePath = join(basePath, file.filePath);
          const targetPath = join(dataPath, file.filePath);

          await ensureDirectory(dirname(targetPath));
          await fs.copyFile(sourcePath, targetPath);
        }
      }

      logger.info(`スナップショット作成完了: ${snapshotFiles.length}ファイル, ${formatFileSize(totalSize)}`);
      return createSuccessResult(`スナップショット「${name}」が作成されました: ${snapshotFiles.length}ファイル`, snapshot);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`スナップショット作成エラー: ${name}`, { error });
      return createFailureResult(`スナップショット作成に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * ファイルを特定バージョンに復元
   */
  async restoreFileVersion(
    filePath: string,
    repositoryPath: string,
    versionId: string
  ): Promise<OperationResult<string>> {
    try {
      logger.info(`ファイルバージョン復元: ${filePath} -> ${versionId}`);

      // バージョン情報読み込み
      const metadataPath = join(repositoryPath, 'metadata', `${versionId}.json`);
      if (!await fileExists(metadataPath)) {
        throw new Error(`バージョンが見つかりません: ${versionId}`);
      }

      const versionData = JSON.parse(await fs.readFile(metadataPath, 'utf-8')) as FileVersion;

      // バージョンファイルパス
      const versionFileName = `${basename(versionData.filePath)}.v${versionData.version}`;
      const versionPath = join(repositoryPath, 'versions', versionFileName);

      if (!await fileExists(versionPath)) {
        throw new Error(`バージョンファイルが見つかりません: ${versionPath}`);
      }

      // 現在のファイルをバックアップ
      if (await fileExists(filePath)) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        await fs.copyFile(filePath, backupPath);
      }

      // バージョンファイルを復元
      await ensureDirectory(dirname(filePath));
      await fs.copyFile(versionPath, filePath);

      // タイムスタンプ復元
      if (versionData.metadata?.modified) {
        await fs.utimes(filePath, new Date(), new Date(versionData.metadata.modified));
      }

      logger.info(`ファイルバージョン復元完了: v${versionData.version}`);
      return createSuccessResult(`ファイルがバージョンv${versionData.version}に復元されました`, filePath);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`ファイルバージョン復元エラー: ${filePath}`, { error });
      return createFailureResult(`ファイルバージョン復元に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * バージョン間の差分を比較
   */
  async compareVersions(
    repositoryPath: string,
    versionId1: string,
    versionId2: string
  ): Promise<OperationResult<VersionDiff>> {
    try {
      logger.info(`バージョン比較: ${versionId1} vs ${versionId2}`);

      // 両バージョンの情報読み込み
      const version1 = await this.loadVersionMetadata(repositoryPath, versionId1);
      const version2 = await this.loadVersionMetadata(repositoryPath, versionId2);

      if (!version1 || !version2) {
        throw new Error('一方または両方のバージョンが見つかりません');
      }

      // 差分情報作成
      let changeType: VersionDiff['changeType'];
      let diffSummary = '';

      if (version1.hash === version2.hash) {
        changeType = 'modified'; // 実際は同じ
        diffSummary = 'ファイル内容に変更はありません';
      } else if (version1.size !== version2.size) {
        changeType = 'modified';
        const sizeDiff = version2.size - version1.size;
        diffSummary = `ファイルサイズが${sizeDiff > 0 ? '+' : ''}${formatFileSize(Math.abs(sizeDiff))}変更されました`;
      } else {
        changeType = 'modified';
        diffSummary = 'ファイル内容が変更されました（同サイズ）';
      }

      const diff: VersionDiff = {
        filePath: version1.filePath,
        changeType,
        oldVersion: version1,
        newVersion: version2,
        diffSummary
      };

      logger.info('バージョン比較完了');
      return createSuccessResult('バージョン比較が完了しました', diff);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`バージョン比較エラー: ${versionId1} vs ${versionId2}`, { error });
      return createFailureResult(`バージョン比較に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * バージョン履歴を取得
   */
  async getVersionHistory(
    filePath: string,
    repositoryPath: string
  ): Promise<OperationResult<FileVersion[]>> {
    try {
      logger.info(`バージョン履歴取得: ${filePath}`);

      const versions = await this.getFileVersions(filePath, repositoryPath);
      versions.sort((a, b) => b.version - a.version); // 最新から古い順

      logger.info(`バージョン履歴取得完了: ${versions.length}バージョン`);
      return createSuccessResult(`${versions.length}個のバージョンが見つかりました`, versions);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`バージョン履歴取得エラー: ${filePath}`, { error });
      return createFailureResult(`バージョン履歴取得に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * リポジトリ設定読み込み（内部用）
   */
  private async loadRepository(repositoryPath: string): Promise<VersionRepository> {
    const configPath = join(repositoryPath, 'config.json');

    if (!await fileExists(configPath)) {
      throw new Error('リポジトリ設定ファイルが見つかりません');
    }

    return JSON.parse(await fs.readFile(configPath, 'utf-8'));
  }

  /**
   * ファイルのバージョン一覧取得（内部用）
   */
  private async getFileVersions(filePath: string, repositoryPath: string): Promise<FileVersion[]> {
    const metadataDir = join(repositoryPath, 'metadata');
    const versions: FileVersion[] = [];

    try {
      const metadataFiles = await fs.readdir(metadataDir);

      for (const file of metadataFiles) {
        if (!file.endsWith('.json')) continue;

        try {
          const metadataPath = join(metadataDir, file);
          const versionData = JSON.parse(await fs.readFile(metadataPath, 'utf-8')) as FileVersion;

          if (versionData.filePath === filePath) {
            versions.push(versionData);
          }
        } catch (error) {
          logger.warn(`メタデータファイル読み込みエラー: ${file}`, { error });
        }
      }
    } catch (error) {
      logger.warn(`メタデータディレクトリ読み込みエラー: ${metadataDir}`, { error });
    }

    return versions;
  }

  /**
   * バージョンメタデータ読み込み（内部用）
   */
  private async loadVersionMetadata(repositoryPath: string, versionId: string): Promise<FileVersion | null> {
    try {
      const metadataPath = join(repositoryPath, 'metadata', `${versionId}.json`);
      return JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
    } catch (error) {
      return null;
    }
  }

  /**
   * 古いバージョン清理（内部用）
   */
  private async cleanupOldVersions(filePath: string, repositoryPath: string, maxVersions: number): Promise<void> {
    const versions = await this.getFileVersions(filePath, repositoryPath);

    if (versions.length > maxVersions) {
      // 古いバージョンを削除
      const versionsToDelete = versions
        .sort((a, b) => a.version - b.version)
        .slice(0, versions.length - maxVersions);

      for (const version of versionsToDelete) {
        try {
          // メタデータファイル削除
          const metadataPath = join(repositoryPath, 'metadata', `${version.id}.json`);
          if (await fileExists(metadataPath)) {
            await fs.unlink(metadataPath);
          }

          // バージョンファイル削除
          const versionFileName = `${basename(version.filePath)}.v${version.version}`;
          const versionPath = join(repositoryPath, 'versions', versionFileName);
          if (await fileExists(versionPath)) {
            await fs.unlink(versionPath);
          }

          logger.debug(`古いバージョンを削除: v${version.version}`);
        } catch (error) {
          logger.warn(`バージョン削除エラー: v${version.version}`, { error });
        }
      }
    }
  }

  /**
   * ファイルを含めるかチェック（内部用）
   */
  private shouldIncludeFile(filePath: string, config: VersionOptions): boolean {
    if (!config.excludePatterns) return true;

    const fileName = basename(filePath);

    for (const pattern of config.excludePatterns) {
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
   * バージョンID生成（内部用）
   */
  private generateVersionId(filePath: string, version: number): string {
    const fileName = basename(filePath).replace(/[^a-zA-Z0-9]/g, '_');
    return `${fileName}_v${version}_${Date.now()}`;
  }

  /**
   * スナップショットID生成（内部用）
   */
  private generateSnapshotId(name: string): string {
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
    return `snapshot_${safeName}_${Date.now()}`;
  }
} 