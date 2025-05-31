/**
 * ファイル操作共通ヘルパー関数
 */

import { createHash } from 'crypto';
import { constants, promises as fs } from 'fs';
import { basename, dirname, extname, join, resolve } from 'path';
import { FileInfo, OperationResult } from '../types/index.js';
import { logger } from './logger.js';

/**
 * ファイルが存在するかチェック
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * ディレクトリが存在するかチェック
 */
export async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * ディレクトリを再帰的に作成
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    logger.debug(`ディレクトリを作成しました: ${dirPath}`);
  } catch (error) {
    logger.error(`ディレクトリ作成に失敗しました: ${dirPath}`, { error });
    throw error;
  }
}

/**
 * ファイル情報を取得
 */
export async function getFileInfo(filePath: string): Promise<FileInfo> {
  try {
    const stats = await fs.stat(filePath);
    const name = basename(filePath);
    const extension = extname(filePath);

    return {
      path: resolve(filePath),
      name,
      size: stats.size,
      extension,
      mimeType: getMimeType(extension),
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      permissions: stats.mode.toString(8)
    };
  } catch (error) {
    logger.error(`ファイル情報取得に失敗しました: ${filePath}`, { error });
    throw error;
  }
}

/**
 * ファイルサイズを人間が読みやすい形式で変換
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * ファイル拡張子からMIMEタイプを推定
 */
export function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.ts': 'application/typescript',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.zip': 'application/zip',
    '.rar': 'application/vnd.rar',
    '.7z': 'application/x-7z-compressed',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip'
  };

  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * ファイルのハッシュ値を計算
 */
export async function calculateFileHash(
  filePath: string,
  algorithm: 'md5' | 'sha1' | 'sha256' | 'sha512' = 'sha256'
): Promise<string> {
  try {
    const hash = createHash(algorithm);
    const fileBuffer = await fs.readFile(filePath);
    hash.update(fileBuffer);
    return hash.digest('hex');
  } catch (error) {
    logger.error(`ファイルハッシュ計算に失敗しました: ${filePath}`, { error, algorithm });
    throw error;
  }
}

/**
 * ディレクトリ内のファイルを再帰的に取得
 */
export async function getFilesRecursively(
  dirPath: string,
  options: {
    includeHidden?: boolean;
    maxDepth?: number;
    fileFilter?: (filePath: string) => boolean;
  } = {}
): Promise<string[]> {
  const { includeHidden = false, maxDepth = Infinity, fileFilter } = options;
  const files: string[] = [];

  async function traverse(currentPath: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;

    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        if (!includeHidden && entry.name.startsWith('.')) continue;

        const fullPath = join(currentPath, entry.name);

        if (entry.isDirectory()) {
          await traverse(fullPath, depth + 1);
        } else if (entry.isFile()) {
          if (!fileFilter || fileFilter(fullPath)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      logger.warn(`ディレクトリ読み取りに失敗しました: ${currentPath}`, { error });
    }
  }

  await traverse(dirPath, 0);
  return files;
}

/**
 * 安全なファイルパス生成（重複を避ける）
 */
export async function generateSafeFilePath(originalPath: string, suffix?: string): Promise<string> {
  const dir = dirname(originalPath);
  const name = basename(originalPath, extname(originalPath));
  const ext = extname(originalPath);
  const suffixStr = suffix ? `_${suffix}` : '';

  let counter = 0;
  let newPath = join(dir, `${name}${suffixStr}${ext}`);

  while (await fileExists(newPath)) {
    counter++;
    newPath = join(dir, `${name}${suffixStr}_${counter}${ext}`);
  }

  return newPath;
}

/**
 * ファイル操作結果のラッパー
 */
export function createOperationResult<T>(
  success: boolean,
  message: string,
  data?: T,
  error?: Error
): OperationResult<T> {
  return {
    success,
    message,
    data,
    error,
    timestamp: new Date()
  };
}

/**
 * 成功結果のヘルパー
 */
export function createSuccessResult<T>(
  message: string,
  data: T
): OperationResult<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date()
  };
}

/**
 * 失敗結果のヘルパー
 */
export function createFailureResult<T>(
  message: string,
  error?: Error
): OperationResult<T> {
  return {
    success: false,
    message,
    error,
    timestamp: new Date()
  } as OperationResult<T>;
}

/**
 * パスの正規化
 */
export function normalizePath(filePath: string): string {
  return resolve(filePath).replace(/\\/g, '/');
}

/**
 * ファイルの読み取り権限チェック
 */
export async function canReadFile(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * ファイルの書き込み権限チェック
 */
export async function canWriteFile(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * テンポラリファイルパス生成
 */
export function generateTempFilePath(prefix: string = 'enhanced-fs', extension: string = '.tmp'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return join(process.env.TEMP || '/tmp', `${prefix}_${timestamp}_${random}${extension}`);
} 