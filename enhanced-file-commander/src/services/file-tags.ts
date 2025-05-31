import fs from 'fs-extra';
import path from 'path';
import { FileTag } from '../types/index.js';

// タグデータを保存するファイルのパス
const TAG_DB_FILE = path.join(process.cwd(), '.file-commander-tags.json');

/**
 * タグデータベースの読み込み
 */
async function loadTagDatabase(): Promise<{ [filePath: string]: FileTag }> {
  try {
    if (await fs.pathExists(TAG_DB_FILE)) {
      const data = await fs.readFile(TAG_DB_FILE, 'utf8');
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('タグデータベースの読み込みエラー:', error);
    return {};
  }
}

/**
 * タグデータベースの保存
 */
async function saveTagDatabase(tags: { [filePath: string]: FileTag }): Promise<void> {
  try {
    await fs.writeFile(TAG_DB_FILE, JSON.stringify(tags, null, 2), 'utf8');
  } catch (error) {
    throw new Error(`タグデータベースの保存に失敗しました: ${(error as Error).message}`);
  }
}

/**
 * ファイルにタグを追加
 */
export async function addTagsToFile(
  filePath: string,
  tags: string[]
): Promise<FileTag> {
  // 絶対パスに変換
  const absolutePath = path.resolve(filePath);
  
  // ファイルが存在するか確認
  if (!await fs.pathExists(absolutePath)) {
    throw new Error(`ファイルが存在しません: ${filePath}`);
  }
  
  // タグデータベースの読み込み
  const tagDb = await loadTagDatabase();
  
  // 既存のタグをマージ
  const existingTags = tagDb[absolutePath]?.tags || [];
  const mergedTags = Array.from(new Set([...existingTags, ...tags]));
  
  // 新しいタグ情報を作成
  const fileTag: FileTag = {
    path: absolutePath,
    tags: mergedTags,
    lastUpdated: new Date(),
  };
  
  // データベースを更新
  tagDb[absolutePath] = fileTag;
  await saveTagDatabase(tagDb);
  
  return fileTag;
}

/**
 * ファイルからタグを削除
 */
export async function removeTagsFromFile(
  filePath: string,
  tags: string[]
): Promise<FileTag | null> {
  // 絶対パスに変換
  const absolutePath = path.resolve(filePath);
  
  // タグデータベースの読み込み
  const tagDb = await loadTagDatabase();
  
  // ファイルのタグが存在するか確認
  if (!tagDb[absolutePath]) {
    return null;
  }
  
  // 指定されたタグを削除
  const remainingTags = tagDb[absolutePath].tags.filter(tag => !tags.includes(tag));
  
  // タグ情報を更新
  if (remainingTags.length > 0) {
    tagDb[absolutePath].tags = remainingTags;
    tagDb[absolutePath].lastUpdated = new Date();
    await saveTagDatabase(tagDb);
    return tagDb[absolutePath];
  } else {
    // タグがなくなった場合はエントリ自体を削除
    delete tagDb[absolutePath];
    await saveTagDatabase(tagDb);
    return null;
  }
}

/**
 * ファイルのタグを取得
 */
export async function getFileTags(filePath: string): Promise<string[]> {
  // 絶対パスに変換
  const absolutePath = path.resolve(filePath);
  
  // タグデータベースの読み込み
  const tagDb = await loadTagDatabase();
  
  // ファイルのタグを返す
  return tagDb[absolutePath]?.tags || [];
}

/**
 * 特定のタグを持つファイルをすべて検索
 */
export async function findFilesByTags(
  tags: string[],
  options: {
    matchAll?: boolean;
  } = {}
): Promise<FileTag[]> {
  const { matchAll = true } = options;
  
  // タグデータベースの読み込み
  const tagDb = await loadTagDatabase();
  
  // タグに一致するファイルをフィルタリング
  return Object.values(tagDb).filter(fileTag => {
    if (matchAll) {
      // すべてのタグに一致するか
      return tags.every(tag => fileTag.tags.includes(tag));
    } else {
      // いずれかのタグに一致するか
      return tags.some(tag => fileTag.tags.includes(tag));
    }
  });
}

/**
 * 使用されているすべてのタグを取得
 */
export async function getAllTags(): Promise<{ [tag: string]: number }> {
  // タグデータベースの読み込み
  const tagDb = await loadTagDatabase();
  
  // タグの使用回数をカウント
  const tagCounts: { [tag: string]: number } = {};
  
  Object.values(tagDb).forEach(fileTag => {
    fileTag.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  return tagCounts;
}

/**
 * すべてのタグ付きファイルを取得
 */
export async function getAllTaggedFiles(): Promise<FileTag[]> {
  // タグデータベースの読み込み
  const tagDb = await loadTagDatabase();
  return Object.values(tagDb);
}

/**
 * ファイルのタグを完全に置き換え
 */
export async function setFileTags(
  filePath: string,
  tags: string[]
): Promise<FileTag> {
  // 絶対パスに変換
  const absolutePath = path.resolve(filePath);
  
  // ファイルが存在するか確認
  if (!await fs.pathExists(absolutePath)) {
    throw new Error(`ファイルが存在しません: ${filePath}`);
  }
  
  // タグデータベースの読み込み
  const tagDb = await loadTagDatabase();
  
  // 新しいタグ情報を作成
  const fileTag: FileTag = {
    path: absolutePath,
    tags: Array.from(new Set(tags)), // 重複を削除
    lastUpdated: new Date(),
  };
  
  // データベースを更新
  tagDb[absolutePath] = fileTag;
  await saveTagDatabase(tagDb);
  
  return fileTag;
}

/**
 * タグの使用状況レポートを生成
 */
export async function generateTagReport(): Promise<string> {
  // タグデータベースの読み込み
  const tagDb = await loadTagDatabase();
  const tagCounts = await getAllTags();
  
  // レポート生成
  let report = '=== ファイルタグレポート ===\n\n';
  
  // タグ数とファイル数の概要
  report += `総タグ数: ${Object.keys(tagCounts).length}\n`;
  report += `タグ付きファイル数: ${Object.keys(tagDb).length}\n\n`;
  
  // 使用頻度順にタグを表示
  report += '--- 使用頻度順のタグ ---\n';
  const sortedTags = Object.entries(tagCounts)
    .sort(([, countA], [, countB]) => countB - countA);
  
  for (const [tag, count] of sortedTags) {
    report += `${tag}: ${count} ファイル\n`;
  }
  
  report += '\n--- 直近でタグ更新されたファイル ---\n';
  const recentFiles = Object.values(tagDb)
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0, 10);
  
  for (const file of recentFiles) {
    report += `${file.path}\n`;
    report += `  タグ: ${file.tags.join(', ')}\n`;
    report += `  最終更新: ${new Date(file.lastUpdated).toLocaleString()}\n\n`;
  }
  
  return report;
}

/**
 * タグの整理（未使用タグの削除、名前変更など）
 */
export async function organizeTags(
  operations: {
    rename?: { [oldTag: string]: string };
    delete?: string[];
  }
): Promise<{
  renamed: { [oldTag: string]: { newTag: string; count: number } };
  deleted: { [tag: string]: number };
}> {
  const { rename = {}, delete: tagsToDelete = [] } = operations;
  
  // タグデータベースの読み込み
  const tagDb = await loadTagDatabase();
  
  // 操作結果を記録
  const result = {
    renamed: {} as { [oldTag: string]: { newTag: string; count: number } },
    deleted: {} as { [tag: string]: number },
  };
  
  // 各タグをマッピング
  Object.entries(tagDb).forEach(([filePath, fileTag]) => {
    let modified = false;
    
    // タグ名を置換
    fileTag.tags = fileTag.tags.map(tag => {
      if (tag in rename) {
        modified = true;
        result.renamed[tag] = result.renamed[tag] || { newTag: rename[tag], count: 0 };
        result.renamed[tag].count++;
        return rename[tag];
      }
      return tag;
    });
    
    // 削除対象のタグを削除
    const originalLength = fileTag.tags.length;
    fileTag.tags = fileTag.tags.filter(tag => {
      if (tagsToDelete.includes(tag)) {
        result.deleted[tag] = (result.deleted[tag] || 0) + 1;
        return false;
      }
      return true;
    });
    
    if (originalLength !== fileTag.tags.length) {
      modified = true;
    }
    
    // 重複を削除
    const uniqueTags = Array.from(new Set(fileTag.tags));
    if (uniqueTags.length !== fileTag.tags.length) {
      fileTag.tags = uniqueTags;
      modified = true;
    }
    
    // 更新日時を設定
    if (modified) {
      fileTag.lastUpdated = new Date();
    }
    
    // タグがすべて削除された場合、エントリ自体を削除
    if (fileTag.tags.length === 0) {
      delete tagDb[filePath];
    }
  });
  
  // データベースを保存
  await saveTagDatabase(tagDb);
  
  return result;
}
