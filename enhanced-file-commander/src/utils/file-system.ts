import fs from 'fs-extra';
import path from 'path';
import mime from 'mime-types';
import dayjs from 'dayjs';
import { glob } from 'glob';
import { FileInfo, DirectoryInfo, DirectoryTree } from '../types/index.js';
import crypto from 'crypto';

/**
 * ファイルまたはディレクトリの詳細情報を取得
 */
export async function getFileInfo(filePath: string): Promise<FileInfo | DirectoryInfo> {
  try {
    const stats = await fs.stat(filePath);
    const isDirectory = stats.isDirectory();
    
    const name = path.basename(filePath);
    const extension = isDirectory ? '' : path.extname(filePath).toLowerCase();
    
    const baseInfo = {
      name,
      path: filePath,
      isDirectory,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      permissions: stats.mode.toString(8).slice(-3),
      isHidden: name.startsWith('.'),
      isSymlink: stats.isSymbolicLink(),
    };
    
    if (isDirectory) {
      let items;
      try {
        items = await fs.readdir(filePath);
      } catch (error) {
        items = [];
      }
      
      let totalSize = 0;
      // 最大100アイテムまで計算して、それ以上の場合は概算
      const sampleItems = items.slice(0, 100);
      for (const item of sampleItems) {
        try {
          const itemStats = await fs.stat(path.join(filePath, item));
          totalSize += itemStats.size;
        } catch (error) {
          // エラーは無視
        }
      }
      
      // サンプルから全体を推定
      if (items.length > sampleItems.length) {
        totalSize = Math.round(totalSize * (items.length / sampleItems.length));
      }
      
      return {
        ...baseInfo,
        itemCount: items.length,
        totalSize,
        isEmpty: items.length === 0,
      } as DirectoryInfo;
    } else {
      return {
        ...baseInfo,
        extension,
        mimeType: mime.lookup(filePath) || 'application/octet-stream',
        isExecutable: Boolean(stats.mode & 0o111), // Executableビットがあるか確認
      } as FileInfo;
    }
  } catch (error) {
    throw new Error(`ファイル情報の取得に失敗しました: ${(error as Error).message}`);
  }
}

/**
 * ディレクトリ内のファイルとフォルダを再帰的にリスト
 */
export async function listDirectoryContents(
  dirPath: string,
  recursive = false,
  includeHidden = false,
  maxDepth = Infinity,
  currentDepth = 0
): Promise<Array<FileInfo | DirectoryInfo>> {
  try {
    const entries = await fs.readdir(dirPath);
    let results: Array<FileInfo | DirectoryInfo> = [];
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      
      // 隠しファイルをスキップ
      if (!includeHidden && entry.startsWith('.')) {
        continue;
      }
      
      try {
        const info = await getFileInfo(fullPath);
        results.push(info);
        
        // 再帰的に処理（最大深度まで）
        if (recursive && info.isDirectory && currentDepth < maxDepth) {
          const subEntries = await listDirectoryContents(
            fullPath,
            recursive,
            includeHidden,
            maxDepth,
            currentDepth + 1
          );
          results = results.concat(subEntries);
        }
      } catch (error) {
        console.error(`項目をスキップしました ${fullPath}: ${(error as Error).message}`);
      }
    }
    
    return results;
  } catch (error) {
    throw new Error(`ディレクトリの内容の一覧取得に失敗しました: ${(error as Error).message}`);
  }
}

/**
 * ディレクトリツリーを構築
 */
export async function buildDirectoryTree(
  dirPath: string,
  options: {
    maxDepth?: number;
    includeHidden?: boolean;
    showFiles?: boolean;
  } = {}
): Promise<DirectoryTree> {
  const {
    maxDepth = Infinity,
    includeHidden = false,
    showFiles = true,
  } = options;
  
  try {
    const stats = await fs.stat(dirPath);
    const name = path.basename(dirPath);
    
    if (!stats.isDirectory()) {
      return {
        name,
        path: dirPath,
        type: 'file',
        size: stats.size,
      };
    }
    
    const entries = await fs.readdir(dirPath);
    let children: DirectoryTree[] = [];
    
    if (maxDepth > 0) {
      for (const entry of entries) {
        if (!includeHidden && entry.startsWith('.')) {
          continue;
        }
        
        const fullPath = path.join(dirPath, entry);
        let stats;
        
        try {
          stats = await fs.stat(fullPath);
        } catch (error) {
          continue; // 読み取れないファイルはスキップ
        }
        
        if (stats.isDirectory()) {
          // サブディレクトリのツリーを構築
          const subTree = await buildDirectoryTree(fullPath, {
            maxDepth: maxDepth - 1,
            includeHidden,
            showFiles,
          });
          children.push(subTree);
        } else if (showFiles) {
          // ファイルを追加
          children.push({
            name: entry,
            path: fullPath,
            type: 'file',
            size: stats.size,
          });
        }
      }
    }
    
    return {
      name,
      path: dirPath,
      type: 'directory',
      children: children.sort((a, b) => {
        // ディレクトリを先、ファイルを後にソート
        if (a.type === 'directory' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      }),
    };
  } catch (error) {
    throw new Error(`ディレクトリツリーの構築に失敗しました: ${(error as Error).message}`);
  }
}

/**
 * パターンに一致するファイルを検索
 */
export async function findFiles(
  rootDir: string,
  pattern: string,
  options: {
    recursive?: boolean;
    includeHidden?: boolean;
    includeDirectories?: boolean;
    includeFiles?: boolean;
  } = {}
): Promise<string[]> {
  const {
    recursive = true,
    includeHidden = false,
    includeDirectories = true,
    includeFiles = true,
  } = options;
  
  try {
    // globパターンを構築
    let globPattern = path.join(rootDir, pattern);
    if (recursive) {
      globPattern = path.join(rootDir, '**', pattern);
    }
    
    // glob検索オプション
    const globOptions = {
      nodir: !includeDirectories,
      dot: includeHidden,
    };
    
    // 検索実行
    let matches = await glob(globPattern, globOptions);
    
    if (!includeFiles) {
      // ディレクトリのみにフィルタリング
      matches = await Promise.all(
        matches.map(async (match) => ({
          path: match,
          isDirectory: (await fs.stat(match)).isDirectory(),
        }))
      ).then((results) =>
        results.filter((result) => result.isDirectory).map((result) => result.path)
      );
    }
    
    return matches;
  } catch (error) {
    throw new Error(`ファイルの検索に失敗しました: ${(error as Error).message}`);
  }
}

/**
 * ファイルまたはディレクトリをコピー
 */
export async function copyFileOrDirectory(
  sourcePath: string,
  destPath: string,
  options: {
    overwrite?: boolean;
    preserveTimestamps?: boolean;
    errorOnExist?: boolean;
  } = {}
): Promise<void> {
  try {
    await fs.copy(sourcePath, destPath, options);
  } catch (error) {
    throw new Error(`コピーに失敗しました: ${(error as Error).message}`);
  }
}

/**
 * ファイルまたはディレクトリを移動
 */
export async function moveFileOrDirectory(
  sourcePath: string,
  destPath: string,
  options: {
    overwrite?: boolean;
  } = {}
): Promise<void> {
  try {
    await fs.move(sourcePath, destPath, options);
  } catch (error) {
    throw new Error(`移動に失敗しました: ${(error as Error).message}`);
  }
}

/**
 * 一括リネーム操作を実行
 */
export async function batchRename(
  sourceDir: string,
  pattern: string,
  renamePattern: {
    search: string | RegExp;
    replace: string | ((match: string, ...args: any[]) => string);
  },
  options: {
    recursive?: boolean;
    includeHidden?: boolean;
    dryRun?: boolean;
  } = {}
): Promise<{ old: string; new: string; status: 'success' | 'error' | 'skipped' | 'dry-run'; error?: string }[]> {
  const {
    recursive = false,
    includeHidden = false,
    dryRun = false,
  } = options;
  
  try {
    const files = await findFiles(sourceDir, pattern, {
      recursive,
      includeHidden,
      includeFiles: true,
      includeDirectories: false,
    });
    
    const results = [];
    
    for (const filePath of files) {
      const dirName = path.dirname(filePath);
      const fileName = path.basename(filePath);
      
      // 新しいファイル名を生成
      let newFileName: string;
      
      if (renamePattern.search instanceof RegExp) {
        newFileName = fileName.replace(renamePattern.search, renamePattern.replace as string);
      } else {
        newFileName = fileName.replace(
          new RegExp(renamePattern.search, 'g'),
          renamePattern.replace as string
        );
      }
      
      if (fileName === newFileName) {
        results.push({
          old: filePath,
          new: filePath,
          status: 'skipped',
        });
        continue;
      }
      
      const newFilePath = path.join(dirName, newFileName);
      
      // ドライランの場合は実際のリネームを行わない
      if (dryRun) {
        results.push({
          old: filePath,
          new: newFilePath,
          status: 'dry-run',
        });
        continue;
      }
      
      try {
        // ファイルをリネーム
        await fs.rename(filePath, newFilePath);
        results.push({
          old: filePath,
          new: newFilePath,
          status: 'success',
        });
      } catch (error) {
        results.push({
          old: filePath,
          new: newFilePath,
          status: 'error',
          error: (error as Error).message,
        });
      }
    }
    
    return results;
  } catch (error) {
    throw new Error(`一括リネームに失敗しました: ${(error as Error).message}`);
  }
}

/**
 * ファイルのハッシュを計算
 */
export async function calculateFileHash(
  filePath: string,
  algorithm = 'md5'
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const hash = crypto.createHash(algorithm);
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (data) => {
        hash.update(data);
      });
      
      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });
      
      stream.on('error', (error) => {
        reject(new Error(`ハッシュ計算中にエラーが発生しました: ${error.message}`));
      });
    } catch (error) {
      reject(new Error(`ハッシュ計算の初期化に失敗しました: ${(error as Error).message}`));
    }
  });
}

/**
 * ファイルの内容を検索
 */
export async function searchFileContents(
  filePath: string,
  searchPattern: string | RegExp,
  options: {
    maxResults?: number;
    contextLines?: number;
    caseSensitive?: boolean;
  } = {}
): Promise<{
  line: number;
  content: string;
  context: string[];
}[]> {
  const {
    maxResults = 100,
    contextLines = 2,
    caseSensitive = false,
  } = options;
  
  try {
    // ファイルの内容を読み込む
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const results = [];
    
    // 正規表現を準備
    const regex = searchPattern instanceof RegExp
      ? searchPattern
      : new RegExp(searchPattern, caseSensitive ? 'g' : 'gi');
    
    // 行ごとに検索
    for (let i = 0; i < lines.length && results.length < maxResults; i++) {
      const line = lines[i];
      if (regex.test(line)) {
        // マッチした行の前後のコンテキスト行を取得
        const contextStart = Math.max(0, i - contextLines);
        const contextEnd = Math.min(lines.length - 1, i + contextLines);
        const context = [];
        
        for (let j = contextStart; j <= contextEnd; j++) {
          if (j !== i) {
            context.push(`${j + 1}: ${lines[j]}`);
          }
        }
        
        results.push({
          line: i + 1,
          content: line,
          context,
        });
      }
    }
    
    return results;
  } catch (error) {
    throw new Error(`ファイル内容の検索に失敗しました: ${(error as Error).message}`);
  }
}

/**
 * ヒューマンリーダブルなサイズに変換
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * ファイル日時の表示フォーマットを整形
 */
export function formatFileDate(date: Date, format = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs(date).format(format);
}
