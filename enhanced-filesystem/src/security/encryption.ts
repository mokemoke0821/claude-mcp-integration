/**
 * ファイル暗号化・復号化機能
 * Phase 1: セキュリティ機能の核となる暗号化システム
 */

import { createHash, pbkdf2, randomBytes, scrypt } from 'crypto';
import { promises as fs } from 'fs';
import { basename, dirname, extname, join } from 'path';
import { promisify } from 'util';
import {
  EncryptionOptions,
  EncryptionResult,
  OperationResult
} from '../types/index.js';
import {
  canReadFile,
  createFailureResult,
  createOperationResult,
  ensureDirectory,
  fileExists,
  generateSafeFilePath
} from '../utils/file-helper.js';
import { logger } from '../utils/logger.js';

const scryptAsync = promisify(scrypt);
const pbkdf2Async = promisify(pbkdf2);

export class FileEncryption {
  private static readonly DEFAULT_OPTIONS: EncryptionOptions = {
    algorithm: 'aes-256-gcm',
    keyDerivation: 'scrypt',
    iterations: 100000,
    saltLength: 32,
    tagLength: 16
  };

  /**
   * ファイルを暗号化
   */
  async encryptFile(
    filePath: string,
    password: string,
    options: Partial<EncryptionOptions> = {}
  ): Promise<OperationResult<EncryptionResult>> {
    try {
      logger.info(`ファイル暗号化を開始: ${filePath}`);

      // ファイル存在・権限チェック
      if (!await fileExists(filePath)) {
        throw new Error(`ファイルが見つかりません: ${filePath}`);
      }

      if (!await canReadFile(filePath)) {
        throw new Error(`ファイル読み取り権限がありません: ${filePath}`);
      }

      const fullOptions = { ...FileEncryption.DEFAULT_OPTIONS, ...options };

      // 暗号化パラメータ生成
      const salt = randomBytes(fullOptions.saltLength!);
      const iv = randomBytes(16);

      // キー導出
      const key = await this.deriveKey(password, salt, fullOptions);

      // ファイル読み込み
      const plaintext = await fs.readFile(filePath);

      // 暗号化実行
      const { encryptedData, tag } = await this.encryptData(plaintext, key, iv, fullOptions.algorithm);

      // 暗号化ファイル作成
      const encryptedPath = await this.generateEncryptedFilePath(filePath);
      await ensureDirectory(dirname(encryptedPath));

      // メタデータ付きで保存
      const metadata = {
        algorithm: fullOptions.algorithm,
        keyDerivation: fullOptions.keyDerivation,
        iterations: fullOptions.iterations,
        saltLength: fullOptions.saltLength,
        ivHex: iv.toString('hex'),
        saltHex: salt.toString('hex'),
        tagHex: tag?.toString('hex'),
        originalFileName: basename(filePath),
        originalSize: plaintext.length,
        encryptedAt: new Date().toISOString()
      };

      // メタデータ + 暗号化データを結合
      const finalData = Buffer.concat([
        Buffer.from(JSON.stringify(metadata) + '\n---ENCRYPTED-DATA---\n'),
        encryptedData
      ]);

      await fs.writeFile(encryptedPath, finalData);

      const result: EncryptionResult = {
        encryptedPath,
        originalPath: filePath,
        algorithm: fullOptions.algorithm,
        keyFingerprint: this.generateKeyFingerprint(key),
        ivHex: iv.toString('hex'),
        saltHex: salt.toString('hex'),
        tagHex: tag?.toString('hex')
      };

      logger.info(`ファイル暗号化完了: ${encryptedPath}`);
      return createOperationResult(true, `ファイルが正常に暗号化されました: ${encryptedPath}`, result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`ファイル暗号化エラー: ${filePath}`, { error });
      return createFailureResult(`暗号化に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * ファイルを復号化
   */
  async decryptFile(
    encryptedFilePath: string,
    password: string,
    outputPath?: string
  ): Promise<OperationResult<string>> {
    try {
      logger.info(`ファイル復号化を開始: ${encryptedFilePath}`);

      if (!await fileExists(encryptedFilePath)) {
        throw new Error(`暗号化ファイルが見つかりません: ${encryptedFilePath}`);
      }

      if (!await canReadFile(encryptedFilePath)) {
        throw new Error(`暗号化ファイル読み取り権限がありません: ${encryptedFilePath}`);
      }

      // 暗号化ファイル読み込み
      const encryptedFileData = await fs.readFile(encryptedFilePath);

      // メタデータと暗号化データを分離
      const { metadata, encryptedData } = this.parseEncryptedFile(encryptedFileData);

      // キー再生成
      const salt = Buffer.from(metadata.saltHex, 'hex');
      const options: EncryptionOptions = {
        algorithm: metadata.algorithm as any,
        keyDerivation: metadata.keyDerivation as any,
        iterations: metadata.iterations,
        saltLength: metadata.saltLength
      };

      const key = await this.deriveKey(password, salt, options);

      // 復号化実行
      const iv = Buffer.from(metadata.ivHex, 'hex');
      const tag = metadata.tagHex ? Buffer.from(metadata.tagHex, 'hex') : undefined;

      const decryptedData = await this.decryptData(encryptedData, key, iv, options.algorithm, tag);

      // 出力パス決定
      const finalOutputPath = outputPath || await this.generateDecryptedFilePath(
        encryptedFilePath,
        metadata.originalFileName
      );

      await ensureDirectory(dirname(finalOutputPath));
      await fs.writeFile(finalOutputPath, decryptedData);

      logger.info(`ファイル復号化完了: ${finalOutputPath}`);
      return createOperationResult(true, `ファイルが正常に復号化されました: ${finalOutputPath}`, finalOutputPath);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`ファイル復号化エラー: ${encryptedFilePath}`, { error });
      return createFailureResult(`復号化に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 複数ファイルの一括暗号化
   */
  async encryptFiles(
    filePaths: string[],
    password: string,
    options: Partial<EncryptionOptions> = {}
  ): Promise<OperationResult<EncryptionResult[]>> {
    try {
      logger.info(`一括暗号化を開始: ${filePaths.length}ファイル`);

      const results: EncryptionResult[] = [];
      const errors: string[] = [];

      for (const filePath of filePaths) {
        const result = await this.encryptFile(filePath, password, options);
        if (result.success && result.data) {
          results.push(result.data);
        } else {
          errors.push(`${filePath}: ${result.message}`);
        }
      }

      if (errors.length > 0) {
        logger.warn(`一括暗号化で一部エラー発生`, { errors });
        return createOperationResult(
          false,
          `${results.length}/${filePaths.length}ファイルの暗号化に成功。エラー: ${errors.join(', ')}`,
          results
        );
      }

      logger.info(`一括暗号化完了: ${results.length}ファイル`);
      return createOperationResult(true, `${results.length}ファイルの暗号化が完了しました`, results);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`一括暗号化エラー`, { error });
      return createFailureResult(`一括暗号化に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 複数ファイルの一括復号化
   */
  async decryptFiles(
    encryptedFilePaths: string[],
    password: string
  ): Promise<OperationResult<string[]>> {
    try {
      logger.info(`一括復号化を開始: ${encryptedFilePaths.length}ファイル`);

      const results: string[] = [];
      const errors: string[] = [];

      for (const filePath of encryptedFilePaths) {
        const result = await this.decryptFile(filePath, password);
        if (result.success && result.data) {
          results.push(result.data);
        } else {
          errors.push(`${filePath}: ${result.message}`);
        }
      }

      if (errors.length > 0) {
        logger.warn(`一括復号化で一部エラー発生`, { errors });
        return createOperationResult(
          false,
          `${results.length}/${encryptedFilePaths.length}ファイルの復号化に成功。エラー: ${errors.join(', ')}`,
          results
        );
      }

      logger.info(`一括復号化完了: ${results.length}ファイル`);
      return createOperationResult(true, `${results.length}ファイルの復号化が完了しました`, results);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`一括復号化エラー`, { error });
      return createFailureResult(`一括復号化に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * データ暗号化（内部用）
   */
  private async encryptData(
    data: Buffer,
    key: Buffer,
    iv: Buffer,
    algorithm: string
  ): Promise<{ encryptedData: Buffer; tag?: Buffer }> {
    const { createCipheriv } = await import('crypto');
    const cipher = createCipheriv(algorithm, key, iv);

    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

    // GCMモードの場合は認証タグを取得
    let tag: Buffer | undefined;
    if (algorithm.includes('gcm')) {
      tag = (cipher as any).getAuthTag();
    }

    return { encryptedData: encrypted, tag };
  }

  /**
   * データ復号化（内部用）
   */
  private async decryptData(
    encryptedData: Buffer,
    key: Buffer,
    iv: Buffer,
    algorithm: string,
    tag?: Buffer
  ): Promise<Buffer> {
    const { createDecipheriv } = await import('crypto');
    const decipher = createDecipheriv(algorithm, key, iv);

    // GCMモードの場合は認証タグを設定
    if (algorithm.includes('gcm') && tag) {
      (decipher as any).setAuthTag(tag);
    }

    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  }

  /**
   * キー導出
   */
  private async deriveKey(
    password: string,
    salt: Buffer,
    options: EncryptionOptions
  ): Promise<Buffer> {
    const keyLength = this.getKeyLength(options.algorithm);

    switch (options.keyDerivation) {
      case 'scrypt':
        return await scryptAsync(password, salt, keyLength) as Buffer;

      case 'pbkdf2':
        return await pbkdf2Async(password, salt, options.iterations!, keyLength, 'sha256') as Buffer;

      default:
        throw new Error(`未対応のキー導出方法: ${options.keyDerivation}`);
    }
  }

  /**
   * アルゴリズムに対応するキー長を取得
   */
  private getKeyLength(algorithm: string): number {
    if (algorithm.includes('256')) return 32;
    if (algorithm.includes('192')) return 24;
    if (algorithm.includes('128')) return 16;
    return 32; // デフォルト
  }

  /**
   * キーのフィンガープリント生成
   */
  private generateKeyFingerprint(key: Buffer): string {
    return createHash('sha256').update(key).digest('hex').substring(0, 16);
  }

  /**
   * 暗号化ファイルパス生成
   */
  private async generateEncryptedFilePath(originalPath: string): Promise<string> {
    const dir = dirname(originalPath);
    const name = basename(originalPath, extname(originalPath));
    const encryptedName = `${name}.encrypted`;
    return await generateSafeFilePath(join(dir, encryptedName));
  }

  /**
   * 復号化ファイルパス生成
   */
  private async generateDecryptedFilePath(encryptedPath: string, originalFileName: string): Promise<string> {
    const dir = dirname(encryptedPath);
    const outputPath = join(dir, `decrypted_${originalFileName}`);
    return await generateSafeFilePath(outputPath);
  }

  /**
   * 暗号化ファイルのパース
   */
  private parseEncryptedFile(fileData: Buffer): { metadata: any; encryptedData: Buffer } {
    const fileContent = fileData.toString('utf-8');
    const separatorIndex = fileContent.indexOf('\n---ENCRYPTED-DATA---\n');

    if (separatorIndex === -1) {
      throw new Error('無効な暗号化ファイル形式です');
    }

    const metadataStr = fileContent.substring(0, separatorIndex);
    const metadata = JSON.parse(metadataStr);

    const encryptedDataStart = Buffer.byteLength(metadataStr + '\n---ENCRYPTED-DATA---\n', 'utf-8');
    const encryptedData = fileData.slice(encryptedDataStart);

    return { metadata, encryptedData };
  }
} 