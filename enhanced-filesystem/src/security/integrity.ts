/**
 * ファイル整合性検証機能
 * Phase 1: セキュリティ機能のファイル検証システム
 */

import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { basename, dirname, join } from 'path';
import {
  ChecksumResult,
  IntegrityVerification,
  OperationResult
} from '../types/index.js';
import {
  canReadFile,
  createFailureResult,
  createOperationResult,
  ensureDirectory,
  fileExists,
  generateSafeFilePath,
  getFileInfo
} from '../utils/file-helper.js';
import { logger } from '../utils/logger.js';

export class FileIntegrity {
  /**
   * ファイルのチェックサム生成
   */
  async generateFileChecksum(
    filePath: string,
    algorithm: 'md5' | 'sha1' | 'sha256' | 'sha512' = 'sha256'
  ): Promise<OperationResult<ChecksumResult>> {
    try {
      logger.info(`チェックサム生成を開始: ${filePath} (${algorithm})`);

      if (!await fileExists(filePath)) {
        throw new Error(`ファイルが見つかりません: ${filePath}`);
      }

      if (!await canReadFile(filePath)) {
        throw new Error(`ファイル読み取り権限がありません: ${filePath}`);
      }

      const fileInfo = await getFileInfo(filePath);
      const hash = createHash(algorithm);

      // ストリーミング処理で大きなファイルに対応
      const stream = await fs.readFile(filePath);
      hash.update(stream);
      const checksum = hash.digest('hex');

      const result: ChecksumResult = {
        filePath,
        algorithm,
        checksum,
        fileSize: fileInfo.size,
        timestamp: new Date()
      };

      logger.info(`チェックサム生成完了: ${checksum}`);
      return createOperationResult(true, `チェックサムが正常に生成されました: ${checksum}`, result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`チェックサム生成エラー: ${filePath}`, { error, algorithm });
      return createFailureResult(`チェックサム生成に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * ファイル整合性検証
   */
  async verifyFileIntegrity(
    filePath: string,
    expectedChecksum: string,
    algorithm: 'md5' | 'sha1' | 'sha256' | 'sha512' = 'sha256'
  ): Promise<OperationResult<IntegrityVerification>> {
    try {
      logger.info(`ファイル整合性検証を開始: ${filePath}`);

      // 現在のチェックサムを計算
      const checksumResult = await this.generateFileChecksum(filePath, algorithm);

      if (!checksumResult.success || !checksumResult.data) {
        throw new Error(`チェックサム計算に失敗しました: ${checksumResult.message}`);
      }

      const actualChecksum = checksumResult.data.checksum;
      const isValid = actualChecksum.toLowerCase() === expectedChecksum.toLowerCase();

      const result: IntegrityVerification = {
        filePath,
        expectedChecksum: expectedChecksum.toLowerCase(),
        actualChecksum: actualChecksum.toLowerCase(),
        algorithm,
        isValid,
        timestamp: new Date()
      };

      const message = isValid
        ? `ファイル整合性検証が成功しました: チェックサムが一致します`
        : `ファイル整合性検証が失敗しました: チェックサムが一致しません`;

      logger.info(`ファイル整合性検証完了: ${isValid ? '成功' : '失敗'}`);
      return createOperationResult(isValid, message, result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`ファイル整合性検証エラー: ${filePath}`, { error, algorithm });
      return createFailureResult(`整合性検証に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 複数ファイルの一括チェックサム生成
   */
  async generateMultipleChecksums(
    filePaths: string[],
    algorithm: 'md5' | 'sha1' | 'sha256' | 'sha512' = 'sha256'
  ): Promise<OperationResult<ChecksumResult[]>> {
    try {
      logger.info(`一括チェックサム生成を開始: ${filePaths.length}ファイル`);

      const results: ChecksumResult[] = [];
      const errors: string[] = [];

      for (const filePath of filePaths) {
        const result = await this.generateFileChecksum(filePath, algorithm);
        if (result.success && result.data) {
          results.push(result.data);
        } else {
          errors.push(`${filePath}: ${result.message}`);
        }
      }

      if (errors.length > 0) {
        logger.warn(`一括チェックサム生成で一部エラー発生`, { errors });
        return createOperationResult(
          false,
          `${results.length}/${filePaths.length}ファイルのチェックサム生成に成功。エラー: ${errors.join(', ')}`,
          results
        );
      }

      logger.info(`一括チェックサム生成完了: ${results.length}ファイル`);
      return createOperationResult(true, `${results.length}ファイルのチェックサム生成が完了しました`, results);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`一括チェックサム生成エラー`, { error });
      return createFailureResult(`一括チェックサム生成に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * チェックサムファイルの保存
   */
  async saveChecksumFile(
    checksumResults: ChecksumResult[],
    outputPath?: string
  ): Promise<OperationResult<string>> {
    try {
      logger.info(`チェックサムファイル保存を開始: ${checksumResults.length}エントリ`);

      if (checksumResults.length === 0) {
        throw new Error('保存するチェックサム結果がありません');
      }

      // デフォルトの出力パス生成
      const finalOutputPath = outputPath || await generateSafeFilePath(
        join(process.cwd(), `checksums_${Date.now()}.txt`)
      );

      await ensureDirectory(dirname(finalOutputPath));

      // チェックサムファイル内容を生成
      const content = this.generateChecksumFileContent(checksumResults);
      await fs.writeFile(finalOutputPath, content, 'utf-8');

      logger.info(`チェックサムファイル保存完了: ${finalOutputPath}`);
      return createOperationResult(true, `チェックサムファイルが保存されました: ${finalOutputPath}`, finalOutputPath);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`チェックサムファイル保存エラー`, { error });
      return createFailureResult(`チェックサムファイル保存に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * チェックサムファイルの読み込み
   */
  async loadChecksumFile(checksumFilePath: string): Promise<OperationResult<ChecksumResult[]>> {
    try {
      logger.info(`チェックサムファイル読み込みを開始: ${checksumFilePath}`);

      if (!await fileExists(checksumFilePath)) {
        throw new Error(`チェックサムファイルが見つかりません: ${checksumFilePath}`);
      }

      if (!await canReadFile(checksumFilePath)) {
        throw new Error(`チェックサムファイル読み取り権限がありません: ${checksumFilePath}`);
      }

      const content = await fs.readFile(checksumFilePath, 'utf-8');
      const results = this.parseChecksumFileContent(content);

      logger.info(`チェックサムファイル読み込み完了: ${results.length}エントリ`);
      return createOperationResult(true, `チェックサムファイルを正常に読み込みました: ${results.length}エントリ`, results);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`チェックサムファイル読み込みエラー: ${checksumFilePath}`, { error });
      return createFailureResult(`チェックサムファイル読み込みに失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * チェックサムファイルに基づくディレクトリ検証
   */
  async verifyDirectoryIntegrity(
    directoryPath: string,
    checksumFilePath: string
  ): Promise<OperationResult<IntegrityVerification[]>> {
    try {
      logger.info(`ディレクトリ整合性検証を開始: ${directoryPath}`);

      // チェックサムファイル読み込み
      const loadResult = await this.loadChecksumFile(checksumFilePath);
      if (!loadResult.success || !loadResult.data) {
        throw new Error(`チェックサムファイル読み込みに失敗: ${loadResult.message}`);
      }

      const results: IntegrityVerification[] = [];
      const errors: string[] = [];

      for (const checksumResult of loadResult.data) {
        const result = await this.verifyFileIntegrity(
          checksumResult.filePath,
          checksumResult.checksum,
          checksumResult.algorithm
        );

        if (result.data) {
          results.push(result.data);
        } else {
          errors.push(`${checksumResult.filePath}: ${result.message}`);
        }
      }

      const validCount = results.filter(r => r.isValid).length;
      const invalidCount = results.length - validCount;

      let message = `ディレクトリ整合性検証完了: ${validCount}成功, ${invalidCount}失敗`;
      if (errors.length > 0) {
        message += `. エラー: ${errors.length}件`;
      }

      logger.info(`ディレクトリ整合性検証完了: ${results.length}ファイル処理`);
      return createOperationResult(invalidCount === 0 && errors.length === 0, message, results);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`ディレクトリ整合性検証エラー: ${directoryPath}`, { error });
      return createFailureResult(`ディレクトリ整合性検証に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * チェックサムファイル内容生成（内部用）
   */
  private generateChecksumFileContent(checksumResults: ChecksumResult[]): string {
    const header = [
      '# Enhanced Filesystem Security - Checksum File',
      `# Generated: ${new Date().toISOString()}`,
      `# Algorithm: ${checksumResults[0]?.algorithm || 'mixed'}`,
      `# Total Files: ${checksumResults.length}`,
      '#',
      '# Format: <checksum> <algorithm> <size> <filename>',
      ''
    ].join('\n');

    const entries = checksumResults.map(result => {
      return `${result.checksum} ${result.algorithm} ${result.fileSize} ${basename(result.filePath)}`;
    }).join('\n');

    return header + entries;
  }

  /**
   * チェックサムファイル内容パース（内部用）
   */
  private parseChecksumFileContent(content: string): ChecksumResult[] {
    const lines = content.split('\n');
    const results: ChecksumResult[] = [];

    for (const line of lines) {
      // コメント行と空行をスキップ
      if (line.trim().startsWith('#') || line.trim() === '') {
        continue;
      }

      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        const [checksum, algorithm, sizeStr, ...filenameParts] = parts;
        const filename = filenameParts.join(' ');

        // 型安全性のためのチェック
        if (checksum && algorithm && sizeStr && filename) {
          results.push({
            filePath: filename,
            algorithm: algorithm as any,
            checksum,
            fileSize: parseInt(sizeStr, 10),
            timestamp: new Date()
          });
        }
      }
    }

    return results;
  }
} 