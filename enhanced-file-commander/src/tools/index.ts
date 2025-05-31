import { FileInfo, DirectoryInfo, DirectoryTree, SearchCriteria, SearchResult, RenamePattern, VisualizationOptions, FileSystemStats } from '../types/index.js';
import * as fsUtils from '../utils/file-system.js';
import * as treeViz from '../viz/tree-visualization.js';
import * as fileDiff from '../services/file-diff.js';
import * as fileAnalyzer from '../services/file-analyzer.js';
import * as fileTags from '../services/file-tags.js';
import path from 'path';
import fs from 'fs-extra';

// ファイルシステム可視化強化ツール
export const visualizationTools = {
  /**
   * ディレクトリ構造をツリー形式でテキスト表示
   */
  async visualizeDirectoryTree(
    dirPath: string,
    options: {
      maxDepth?: number;
      showSize?: boolean;
      includeHidden?: boolean;
      showFiles?: boolean;
      outputFormat?: 'text' | 'html' | 'json';
      outputPath?: string;
    } = {}
  ): Promise<string> {
    const {
      maxDepth = 3,
      showSize = true,
      includeHidden = false,
      showFiles = true,
      outputFormat = 'text',
      outputPath,
    } = options;
    
    try {
      // ディレクトリツリーを構築
      const tree = await fsUtils.buildDirectoryTree(dirPath, {
        maxDepth,
        includeHidden,
        showFiles,
      });
      
      let result: string;
      
      // 出力形式に応じてレンダリング
      switch (outputFormat) {
        case 'text':
          result = treeViz.renderDirectoryTree(tree, {
            showSize,
            colorize: true,
            maxDepth,
          });
          break;
        case 'html':
          result = treeViz.renderDirectoryTreeHtml(tree);
          break;
        case 'json':
          result = JSON.stringify(tree, null, 2);
          break;
        default:
          throw new Error(`サポートされていない出力形式: ${outputFormat}`);
      }
      
      // 出力先が指定されている場合はファイルに保存
      if (outputPath) {
        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeFile(outputPath, result, 'utf8');
        return `ディレクトリツリーを ${outputPath} に保存しました`;
      }
      
      return result;
    } catch (error) {
      throw new Error(`ディレクトリツリーの可視化に失敗しました: ${(error as Error).message}`);
    }
  },
  
  /**
   * ファイル分析情報を取得して表示
   */
  async analyzeFiles(
    dirPath: string,
    options: {
      recursive?: boolean;
      includeHidden?: boolean;
      maxDepth?: number;
      outputFormat?: 'text' | 'html' | 'json';
      outputPath?: string;
    } = {}
  ): Promise<string> {
    const {
      recursive = true,
      includeHidden = false,
      maxDepth = Infinity,
      outputFormat = 'text',
      outputPath,
    } = options;
    
    try {
      // ファイル統計を分析
      const stats = await fileAnalyzer.analyzeDirectory(dirPath, {
        recursive,
        includeHidden,
        maxDepth,
      });
      
      let result: string;
      
      // 出力形式に応じてレンダリング
      switch (outputFormat) {
        case 'text':
          result = fileAnalyzer.formatFileStats(stats);
          break;
        case 'html':
          result = fileAnalyzer.formatFileStatsHtml(stats, dirPath);
          break;
        case 'json':
          result = JSON.stringify(stats, null, 2);
          break;
        default:
          throw new Error(`サポートされていない出力形式: ${outputFormat}`);
      }
      
      // 出力先が指定されている場合はファイルに保存
      if (outputPath) {
        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeFile(outputPath, result, 'utf8');
        return `ファイル分析結果を ${outputPath} に保存しました`;
      }
      
      return result;
    } catch (error) {
      throw new Error(`ファイル分析に失敗しました: ${(error as Error).message}`);
    }
  },
  
  /**
   * ファイルタイプ統計を表示
   */
  async showFileTypeStats(
    dirPath: string,
    options: {
      recursive?: boolean;
      includeHidden?: boolean;
      outputFormat?: 'text' | 'html' | 'json';
    } = {}
  ): Promise<string> {
    const {
      recursive = true,
      includeHidden = false,
      outputFormat = 'text',
    } = options;
    
    try {
      // ファイル統計を分析
      const stats = await fileAnalyzer.analyzeDirectory(dirPath, {
        recursive,
        includeHidden,
      });
      
      const typeStats = Object.entries(stats.byType)
        .sort(([, a], [, b]) => b.count - a.count);
      
      if (outputFormat === 'json') {
        return JSON.stringify(Object.fromEntries(typeStats), null, 2);
      }
      
      let result = '=== ファイルタイプ統計 ===\n\n';
      result += `ディレクトリ: ${dirPath}\n`;
      result += `総ファイル数: ${stats.total.files}\n\n`;
      
      result += '--- ファイルタイプ別の内訳 ---\n';
      for (const [ext, data] of typeStats) {
        const extName = ext === 'unknown' ? '拡張子なし' : ext;
        const percentage = ((data.count / stats.total.files) * 100).toFixed(1);
        result += `${extName}: ${data.count} ファイル (${percentage}%, ${fsUtils.formatFileSize(data.size)})\n`;
      }
      
      return result;
    } catch (error) {
      throw new Error(`ファイルタイプ統計の取得に失敗しました: ${(error as Error).message}`);
    }
  },
};

// バッチ処理強化ツール
export const batchTools = {
  /**
   * パターンマッチによる一括リネーム
   */
  async batchRename(
    dirPath: string,
    renamePattern: {
      type: 'regex' | 'template' | 'sequence' | 'date' | 'case';
      pattern: string;
      replacement: string;
      options?: {
        startNumber?: number;
        step?: number;
        dateFormat?: string;
        case?: 'upper' | 'lower' | 'title' | 'camel' | 'snake' | 'kebab';
      };
    },
    options: {
      filePattern?: string;
      recursive?: boolean;
      includeHidden?: boolean;
      dryRun?: boolean;
    } = {}
  ): Promise<string> {
    const {
      filePattern = '*',
      recursive = false,
      includeHidden = false,
      dryRun = true, // デフォルトはドライラン
    } = options;
    
    try {
      let searchReplace: { search: string | RegExp; replace: string | ((match: string, ...args: any[]) => string) };
      
      // リネームパターンタイプに応じて検索・置換パターンを構築
      switch (renamePattern.type) {
        case 'regex':
          // 正規表現によるリネーム
          searchReplace = {
            search: new RegExp(renamePattern.pattern, 'g'),
            replace: renamePattern.replacement,
          };
          break;
          
        case 'template':
          // テンプレートによるリネーム（{name}, {ext}などの置換）
          searchReplace = {
            search: /.+/,
            replace: (filename) => {
              const ext = path.extname(filename);
              const name = path.basename(filename, ext);
              
              return renamePattern.replacement
                .replace(/{name}/g, name)
                .replace(/{ext}/g, ext.slice(1))
                .replace(/{extfull}/g, ext);
            },
          };
          break;
          
        case 'sequence':
          // 連番によるリネーム
          const startNum = renamePattern.options?.startNumber || 1;
          const step = renamePattern.options?.step || 1;
          let currentNum = startNum;
          
          searchReplace = {
            search: /.+/,
            replace: (filename) => {
              const ext = path.extname(filename);
              const result = renamePattern.replacement.replace(/{n}/g, String(currentNum).padStart(3, '0'));
              currentNum += step;
              return result + ext;
            },
          };
          break;
          
        case 'date':
          // 日付によるリネーム
          const dateFormat = renamePattern.options?.dateFormat || 'YYYY-MM-DD';
          
          searchReplace = {
            search: /.+/,
            replace: (filename) => {
              const ext = path.extname(filename);
              const now = new Date();
              
              // 超シンプルな日付フォーマット（本来はdayjsなどを使用）
              const dateStr = dateFormat
                .replace('YYYY', now.getFullYear().toString())
                .replace('MM', (now.getMonth() + 1).toString().padStart(2, '0'))
                .replace('DD', now.getDate().toString().padStart(2, '0'))
                .replace('HH', now.getHours().toString().padStart(2, '0'))
                .replace('mm', now.getMinutes().toString().padStart(2, '0'))
                .replace('ss', now.getSeconds().toString().padStart(2, '0'));
              
              return renamePattern.replacement.replace(/{date}/g, dateStr) + ext;
            },
          };
          break;
          
        case 'case':
          // 大文字・小文字変換
          const caseType = renamePattern.options?.case || 'lower';
          
          searchReplace = {
            search: /.+/,
            replace: (filename) => {
              const ext = path.extname(filename);
              const name = path.basename(filename, ext);
              
              let newName: string;
              switch (caseType) {
                case 'upper':
                  newName = name.toUpperCase();
                  break;
                case 'lower':
                  newName = name.toLowerCase();
                  break;
                case 'title':
                  newName = name.replace(/\b\w/g, c => c.toUpperCase());
                  break;
                case 'camel':
                  newName = name.replace(/[-_\s](.)/g, (_, c) => c.toUpperCase());
                  break;
                case 'snake':
                  newName = name.replace(/[-\s]/g, '_').toLowerCase();
                  break;
                case 'kebab':
                  newName = name.replace(/[_\s]/g, '-').toLowerCase();
                  break;
                default:
                  newName = name;
              }
              
              return newName + ext;
            },
          };
          break;
          
        default:
          throw new Error(`サポートされていないリネームパターンタイプ: ${renamePattern.type}`);
      }
      
      // 一括リネームを実行
      const results = await fsUtils.batchRename(
        dirPath,
        filePattern,
        searchReplace,
        {
          recursive,
          includeHidden,
          dryRun,
        }
      );
      
      // 結果を整形
      let output = dryRun
        ? '=== 一括リネーム（ドライラン - 実際の変更は行われません）===\n\n'
        : '=== 一括リネーム結果 ===\n\n';
      
      const successCount = results.filter(r => r.status === 'success').length;
      const skippedCount = results.filter(r => r.status === 'skipped').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      const dryRunCount = results.filter(r => r.status === 'dry-run').length;
      
      output += `処理ファイル数: ${results.length}\n`;
      if (dryRun) {
        output += `変更予定: ${dryRunCount}\n`;
      } else {
        output += `成功: ${successCount}, スキップ: ${skippedCount}, エラー: ${errorCount}\n`;
      }
      output += '\n';
      
      // 変更内容を表示
      for (const result of results) {
        if (result.status === 'skipped') continue;
        
        const oldName = path.basename(result.old);
        const newName = path.basename(result.new);
        
        if (oldName !== newName) {
          output += `${oldName} -> ${newName} (${result.status})\n`;
          if (result.status === 'error' && result.error) {
            output += `  エラー: ${result.error}\n`;
          }
        }
      }
      
      return output;
    } catch (error) {
      throw new Error(`一括リネームに失敗しました: ${(error as Error).message}`);
    }
  },
  
  /**
   * ファイル内のテキスト一括置換
   */
  async batchReplaceInFiles(
    dirPath: string,
    searchText: string,
    replaceText: string,
    options: {
      filePattern?: string;
      recursive?: boolean;
      useRegex?: boolean;
      caseSensitive?: boolean;
      includeHidden?: boolean;
      dryRun?: boolean;
      maxFilesToProcess?: number;
    } = {}
  ): Promise<string> {
    const {
      filePattern = '*.txt',
      recursive = false,
      useRegex = false,
      caseSensitive = true,
      includeHidden = false,
      dryRun = true, // デフォルトはドライラン
      maxFilesToProcess = 100,
    } = options;
    
    try {
      // 対象ファイルを検索
      const files = await fsUtils.findFiles(dirPath, filePattern, {
        recursive,
        includeHidden,
        includeDirectories: false,
        includeFiles: true,
      });
      
      if (files.length === 0) {
        return `パターン ${filePattern} に一致するファイルが見つかりませんでした`;
      }
      
      if (files.length > maxFilesToProcess) {
        return `処理対象のファイル数(${files.length})が上限(${maxFilesToProcess})を超えています。より具体的なファイルパターンを指定するか、上限を引き上げてください。`;
      }
      
      // 正規表現パターンを構築
      const regex = useRegex
        ? new RegExp(searchText, caseSensitive ? 'g' : 'gi')
        : new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'gi');
      
      // 結果情報
      const results: {
        file: string;
        matches: number;
        replaced: number;
        error?: string;
      }[] = [];
      
      // 各ファイルを処理
      for (const file of files) {
        try {
          // ファイル内容を読み込み
          const content = await fs.readFile(file, 'utf8');
          
          // マッチ数をカウント
          const matches = (content.match(regex) || []).length;
          
          if (matches > 0) {
            if (!dryRun) {
              // 置換を実行
              const newContent = content.replace(regex, replaceText);
              await fs.writeFile(file, newContent, 'utf8');
            }
            
            results.push({
              file,
              matches,
              replaced: dryRun ? 0 : matches,
            });
          } else {
            results.push({
              file,
              matches: 0,
              replaced: 0,
            });
          }
        } catch (error) {
          results.push({
            file,
            matches: 0,
            replaced: 0,
            error: (error as Error).message,
          });
        }
      }
      
      // 結果を整形
      let output = dryRun
        ? '=== テキスト一括置換（ドライラン - 実際の変更は行われません）===\n\n'
        : '=== テキスト一括置換結果 ===\n\n';
      
      const totalMatches = results.reduce((sum, r) => sum + r.matches, 0);
      const totalReplaced = results.reduce((sum, r) => sum + r.replaced, 0);
      const filesWithMatches = results.filter(r => r.matches > 0).length;
      const filesWithErrors = results.filter(r => r.error).length;
      
      output += `検索パターン: ${searchText}\n`;
      output += `置換テキスト: ${replaceText}\n`;
      output += `処理ファイル数: ${files.length}\n`;
      output += `マッチのあるファイル: ${filesWithMatches}\n`;
      output += `総マッチ数: ${totalMatches}\n`;
      
      if (!dryRun) {
        output += `置換実行数: ${totalReplaced}\n`;
      }
      
      if (filesWithErrors > 0) {
        output += `エラーのあるファイル: ${filesWithErrors}\n`;
      }
      
      output += '\n--- 詳細 ---\n';
      
      for (const result of results) {
        if (result.matches > 0 || result.error) {
          output += `${path.basename(result.file)}: ${result.matches} マッチ`;
          if (!dryRun) {
            output += `, ${result.replaced} 置換`;
          }
          output += '\n';
          
          if (result.error) {
            output += `  エラー: ${result.error}\n`;
          }
        }
      }
      
      return output;
    } catch (error) {
      throw new Error(`テキスト一括置換に失敗しました: ${(error as Error).message}`);
    }
  },
  
  /**
   * フォルダ構造を最適化（特定条件のファイルを整理）
   */
  async organizeFolder(
    dirPath: string,
    options: {
      byExtension?: boolean;
      byDate?: boolean;
      bySize?: boolean;
      dryRun?: boolean;
      excludePatterns?: string[];
    } = {}
  ): Promise<string> {
    const {
      byExtension = true,
      byDate = false,
      bySize = false,
      dryRun = true, // デフォルトはドライラン
      excludePatterns = [],
    } = options;
    
    if (!byExtension && !byDate && !bySize) {
      return '少なくとも1つの整理オプション（byExtension、byDate、bySize）を有効にしてください';
    }
    
    try {
      // ディレクトリ内のファイル一覧を取得
      const contents = await fsUtils.listDirectoryContents(dirPath, false, false);
      const files = contents.filter(item => !item.isDirectory) as FileInfo[];
      
      // 各ファイルの移動先を決定
      interface MoveOperation {
        source: string;
        destination: string;
        category: string;
      }
      
      const moveOperations: MoveOperation[] = [];
      
      for (const file of files) {
        // 除外パターンに一致するファイルはスキップ
        const shouldExclude = excludePatterns.some(pattern => {
          if (pattern.startsWith('*.')) {
            return file.extension === pattern.substring(1);
          }
          return file.name.includes(pattern);
        });
        
        if (shouldExclude) continue;
        
        let targetDir = dirPath;
        let category = '';
        
        if (byExtension) {
          // 拡張子ごとに整理
          const ext = file.extension.toLowerCase().slice(1) || 'no-extension';
          targetDir = path.join(dirPath, ext);
          category = ext;
        } else if (byDate) {
          // 日付ごとに整理
          const date = new Date(file.created);
          const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          targetDir = path.join(dirPath, dateStr);
          category = dateStr;
        } else if (bySize) {
          // サイズごとに整理
          let sizeCategory: string;
          const sizeInMB = file.size / (1024 * 1024);
          
          if (sizeInMB < 1) {
            sizeCategory = 'small (< 1MB)';
          } else if (sizeInMB < 10) {
            sizeCategory = 'medium (1-10MB)';
          } else if (sizeInMB < 100) {
            sizeCategory = 'large (10-100MB)';
          } else {
            sizeCategory = 'huge (> 100MB)';
          }
          
          targetDir = path.join(dirPath, sizeCategory);
          category = sizeCategory;
        }
        
        const destination = path.join(targetDir, file.name);
        
        // 同じ場所への移動はスキップ
        if (file.path !== destination) {
          moveOperations.push({
            source: file.path,
            destination,
            category,
          });
        }
      }
      
      // 結果を整形
      let output = dryRun
        ? '=== フォルダ整理（ドライラン - 実際の変更は行われません）===\n\n'
        : '=== フォルダ整理結果 ===\n\n';
      
      output += `対象ディレクトリ: ${dirPath}\n`;
      output += `処理対象ファイル数: ${files.length}\n`;
      output += `移動予定ファイル数: ${moveOperations.length}\n\n`;
      
      // カテゴリ別の集計
      const categories: { [category: string]: number } = {};
      for (const op of moveOperations) {
        categories[op.category] = (categories[op.category] || 0) + 1;
      }
      
      output += '--- カテゴリ別ファイル数 ---\n';
      for (const [category, count] of Object.entries(categories)) {
        output += `${category}: ${count} ファイル\n`;
      }
      
      output += '\n';
      
      // ドライランでなければ実際に移動
      if (!dryRun) {
        let successCount = 0;
        let errorCount = 0;
        
        for (const op of moveOperations) {
          try {
            // 移動先ディレクトリが存在することを確認
            await fs.ensureDir(path.dirname(op.destination));
            
            // ファイルを移動
            await fsUtils.moveFileOrDirectory(op.source, op.destination);
            successCount++;
          } catch (error) {
            errorCount++;
            output += `エラー: ${op.source} -> ${op.destination}: ${(error as Error).message}\n`;
          }
        }
        
        output += `\n移動成功: ${successCount} ファイル`;
        if (errorCount > 0) {
          output += `, エラー: ${errorCount} ファイル`;
        }
        output += '\n';
      } else {
        // ドライランの場合は移動先の表示
        output += '--- 移動予定ファイル（一部） ---\n';
        const samplesToShow = Math.min(10, moveOperations.length);
        
        for (let i = 0; i < samplesToShow; i++) {
          const op = moveOperations[i];
          output += `${path.basename(op.source)} -> ${path.relative(dirPath, op.destination)}\n`;
        }
        
        if (moveOperations.length > samplesToShow) {
          output += `... 他 ${moveOperations.length - samplesToShow} ファイル\n`;
        }
      }
      
      return output;
    } catch (error) {
      throw new Error(`フォルダ整理に失敗しました: ${(error as Error).message}`);
    }
  },
};

// コンテンツ操作ツール
export const contentTools = {
  /**
   * ファイル内容の検索
   */
  async searchInFiles(
    dirPath: string,
    searchPattern: string,
    options: {
      filePattern?: string;
      recursive?: boolean;
      caseSensitive?: boolean;
      useRegex?: boolean;
      contextLines?: number;
      maxResults?: number;
      includeHidden?: boolean;
    } = {}
  ): Promise<string> {
    const {
      filePattern = '*.*',
      recursive = true,
      caseSensitive = false,
      useRegex = false,
      contextLines = 2,
      maxResults = 100,
      includeHidden = false,
    } = options;
    
    try {
      // 対象ファイルを検索
      const files = await fsUtils.findFiles(dirPath, filePattern, {
        recursive,
        includeHidden,
        includeDirectories: false,
      });
      
      // 検索パターンを準備
      const regex = useRegex
        ? new RegExp(searchPattern, caseSensitive ? 'g' : 'gi')
        : new RegExp(searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'gi');
      
      // 結果を格納する配列
      interface SearchMatch {
        file: string;
        matches: {
          line: number;
          content: string;
          context: string[];
        }[];
      }
      
      const results: SearchMatch[] = [];
      let totalMatches = 0;
      
      // 各ファイルを検索
      for (const file of files) {
        // バイナリファイルなどはスキップ
        const mimeType = path.extname(file).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.pdf', '.zip', '.exe', '.dll', '.obj'].includes(mimeType)) {
          continue;
        }
        
        try {
          // ファイル内容を検索
          const matches = await fsUtils.searchFileContents(file, regex, {
            maxResults: maxResults - totalMatches,
            contextLines,
            caseSensitive,
          });
          
          if (matches.length > 0) {
            results.push({
              file,
              matches,
            });
            
            totalMatches += matches.length;
            if (totalMatches >= maxResults) {
              break;
            }
          }
        } catch (error) {
          // 読み取り不可能なファイルはスキップ
          console.error(`ファイル検索時のエラー: ${file}`, error);
        }
      }
      
      // 結果を整形
      let output = '=== ファイル内容検索結果 ===\n\n';
      
      output += `検索パターン: ${searchPattern}\n`;
      output += `対象ディレクトリ: ${dirPath}\n`;
      output += `マッチしたファイル数: ${results.length}\n`;
      output += `総マッチ数: ${totalMatches}\n\n`;
      
      // 各ファイルの検索結果を表示
      for (const result of results) {
        output += `--- ${path.relative(dirPath, result.file)} (${result.matches.length} マッチ) ---\n`;
        
        for (const match of result.matches) {
          output += `行 ${match.line}: ${match.content.trim()}\n`;
          
          // コンテキスト行を表示
          if (match.context.length > 0) {
            output += '  コンテキスト:\n';
            for (const ctx of match.context) {
              output += `    ${ctx}\n`;
            }
          }
          
          output += '\n';
        }
      }
      
      if (totalMatches >= maxResults) {
        output += `注意: 検索結果が上限(${maxResults})に達しました。すべての結果を表示していません。\n`;
      }
      
      return output;
    } catch (error) {
      throw new Error(`ファイル内容の検索に失敗しました: ${(error as Error).message}`);
    }
  },
  
  /**
   * 2つのファイルを比較して差分を表示
   */
  async compareFiles(
    file1Path: string,
    file2Path: string,
    options: {
      ignoreWhitespace?: boolean;
      contextLines?: number;
      outputFormat?: 'text' | 'html' | 'json';
      outputPath?: string;
    } = {}
  ): Promise<string> {
    const {
      ignoreWhitespace = false,
      contextLines = 3,
      outputFormat = 'text',
      outputPath,
    } = options;
    
    try {
      // ファイル比較を実行
      const diff = await fileDiff.compareFiles(file1Path, file2Path, {
        ignoreWhitespace,
        contextLines,
      });
      
      let result: string;
      
      // 出力形式に応じてレンダリング
      switch (outputFormat) {
        case 'text':
          result = fileDiff.formatFileDiff(diff);
          break;
        case 'html':
          result = fileDiff.formatFileDiffHtml(diff);
          break;
        case 'json':
          result = JSON.stringify(diff, null, 2);
          break;
        default:
          throw new Error(`サポートされていない出力形式: ${outputFormat}`);
      }
      
      // 出力先が指定されている場合はファイルに保存
      if (outputPath) {
        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeFile(outputPath, result, 'utf8');
        return `ファイル比較結果を ${outputPath} に保存しました`;
      }
      
      return result;
    } catch (error) {
      throw new Error(`ファイル比較に失敗しました: ${(error as Error).message}`);
    }
  },
  
  /**
   * ファイルのプレビュー生成
   */
  async previewFileContent(
    filePath: string,
    options: {
      maxLines?: number;
      highlight?: boolean;
      outputFormat?: 'text' | 'html';
    } = {}
  ): Promise<string> {
    const {
      maxLines = 100,
      highlight = true,
      outputFormat = 'text',
    } = options;
    
    try {
      // ファイルの基本情報を取得
      const fileInfo = await fsUtils.getFileInfo(filePath) as FileInfo;
      
      // ファイルのMIMEタイプをチェック
      const isBinary = ['image/', 'audio/', 'video/', 'application/'].some(
        prefix => fileInfo.mimeType.startsWith(prefix) && !fileInfo.mimeType.includes('json') && !fileInfo.mimeType.includes('xml')
      );
      
      if (isBinary) {
        return `このファイル(${fileInfo.mimeType})はバイナリファイルのためプレビューできません。`;
      }
      
      // ファイル内容を読み込み
      const content = await fs.readFile(filePath, 'utf8');
      
      // 行に分割
      const lines = content.split(/\r?\n/).slice(0, maxLines);
      
      if (outputFormat === 'text') {
        // テキスト出力の場合
        let output = `=== ファイルプレビュー: ${filePath} ===\n`;
        output += `サイズ: ${fsUtils.formatFileSize(fileInfo.size)}\n`;
        output += `タイプ: ${fileInfo.mimeType}\n`;
        output += `更新日時: ${fsUtils.formatFileDate(fileInfo.modified)}\n\n`;
        
        output += lines.map((line, i) => `${(i + 1).toString().padStart(4, ' ')}: ${line}`).join('\n');
        
        if (lines.length < content.split(/\r?\n/).length) {
          output += `\n\n... (${content.split(/\r?\n/).length - lines.length} 行省略)`;
        }
        
        return output;
      } else {
        // HTML出力の場合
        let html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>ファイルプレビュー: ${path.basename(filePath)}</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                padding: 20px;
                background-color: #f8f9fa;
                color: #333;
              }
              .file-info {
                background-color: #e9ecef;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
              }
              .code-container {
                background-color: #fff;
                border: 1px solid #dee2e6;
                border-radius: 5px;
                padding: 10px;
                overflow: auto;
              }
              .line-numbers {
                color: #6c757d;
                text-align: right;
                padding-right: 10px;
                user-select: none;
                border-right: 1px solid #dee2e6;
              }
              pre {
                margin: 0;
                font-family: 'Courier New', Courier, monospace;
                tab-size: 4;
              }
              table {
                border-collapse: collapse;
                width: 100%;
              }
              td {
                padding: 0;
                vertical-align: top;
              }
            </style>
          </head>
          <body>
            <h1>ファイルプレビュー: ${path.basename(filePath)}</h1>
            
            <div class="file-info">
              <p><strong>ファイルパス:</strong> ${filePath}</p>
              <p><strong>サイズ:</strong> ${fsUtils.formatFileSize(fileInfo.size)}</p>
              <p><strong>タイプ:</strong> ${fileInfo.mimeType}</p>
              <p><strong>更新日時:</strong> ${fsUtils.formatFileDate(fileInfo.modified)}</p>
            </div>
            
            <div class="code-container">
              <table>
                <tbody>
                  ${lines.map((line, i) => `
                    <tr>
                      <td class="line-numbers">${i + 1}</td>
                      <td><pre>${escapeHtml(line)}</pre></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              ${lines.length < content.split(/\r?\n/).length ? 
                `<p style="text-align: center; margin-top: 10px;">... (${content.split(/\r?\n/).length - lines.length} 行省略)</p>` : 
                ''}
            </div>
          </body>
          </html>
        `;
        
        return html;
      }
    } catch (error) {
      throw new Error(`ファイルプレビューの生成に失敗しました: ${(error as Error).message}`);
    }
  },
};

// HTMLエスケープ用ヘルパー関数
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// メタデータ管理ツール
export const metadataTools = {
  /**
   * ファイルにタグを追加
   */
  async addTags(
    filePath: string,
    tags: string[],
    options: {
      replace?: boolean;
    } = {}
  ): Promise<string> {
    const { replace = false } = options;
    
    try {
      let result;
      
      if (replace) {
        // 既存のタグを置き換え
        result = await fileTags.setFileTags(filePath, tags);
      } else {
        // 既存のタグにマージ
        result = await fileTags.addTagsToFile(filePath, tags);
      }
      
      return `ファイル "${filePath}" に${replace ? '新しい' : '追加の'}タグを設定しました: ${result.tags.join(', ')}`;
    } catch (error) {
      throw new Error(`タグの追加に失敗しました: ${(error as Error).message}`);
    }
  },
  
  /**
   * ファイルからタグを削除
   */
  async removeTags(
    filePath: string,
    tags: string[]
  ): Promise<string> {
    try {
      const result = await fileTags.removeTagsFromFile(filePath, tags);
      
      if (result === null) {
        return `ファイル "${filePath}" からすべてのタグが削除されました`;
      }
      
      return `ファイル "${filePath}" から指定したタグを削除しました。残りのタグ: ${result.tags.join(', ')}`;
    } catch (error) {
      throw new Error(`タグの削除に失敗しました: ${(error as Error).message}`);
    }
  },
  
  /**
   * ファイルのタグを表示
   */
  async showTags(
    filePath: string
  ): Promise<string> {
    try {
      const tags = await fileTags.getFileTags(filePath);
      
      if (tags.length === 0) {
        return `ファイル "${filePath}" にはタグが設定されていません`;
      }
      
      return `ファイル "${filePath}" のタグ: ${tags.join(', ')}`;
    } catch (error) {
      throw new Error(`タグの取得に失敗しました: ${(error as Error).message}`);
    }
  },
  
  /**
   * タグによるファイル検索
   */
  async findByTags(
    tags: string[],
    options: {
      matchAll?: boolean;
    } = {}
  ): Promise<string> {
    const { matchAll = true } = options;
    
    try {
      const files = await fileTags.findFilesByTags(tags, { matchAll });
      
      if (files.length === 0) {
        return `指定したタグ (${tags.join(', ')}) に一致するファイルは見つかりませんでした`;
      }
      
      let result = `=== タグ検索結果 ===\n\n`;
      result += `検索タグ: ${tags.join(', ')}\n`;
      result += `マッチモード: ${matchAll ? 'すべてのタグに一致' : 'いずれかのタグに一致'}\n`;
      result += `見つかったファイル数: ${files.length}\n\n`;
      
      for (const file of files) {
        result += `${file.path}\n`;
        result += `  タグ: ${file.tags.join(', ')}\n`;
        result += `  更新日時: ${new Date(file.lastUpdated).toLocaleString()}\n\n`;
      }
      
      return result;
    } catch (error) {
      throw new Error(`タグ検索に失敗しました: ${(error as Error).message}`);
    }
  },
  
  /**
   * タグ使用状況レポートを生成
   */
  async generateTagReport(): Promise<string> {
    try {
      return await fileTags.generateTagReport();
    } catch (error) {
      throw new Error(`タグレポートの生成に失敗しました: ${(error as Error).message}`);
    }
  },
  
  /**
   * タグの整理（リネーム、削除など）
   */
  async organizeTags(
    operations: {
      rename?: { [oldTag: string]: string };
      delete?: string[];
    }
  ): Promise<string> {
    if (!operations.rename && (!operations.delete || operations.delete.length === 0)) {
      return '少なくとも1つの操作（リネームまたは削除）を指定してください';
    }
    
    try {
      const result = await fileTags.organizeTags(operations);
      
      let output = '=== タグ整理結果 ===\n\n';
      
      // リネーム結果
      if (operations.rename && Object.keys(operations.rename).length > 0) {
        output += '--- リネーム結果 ---\n';
        
        if (Object.keys(result.renamed).length === 0) {
          output += 'リネーム対象のタグは見つかりませんでした\n';
        } else {
          for (const [oldTag, data] of Object.entries(result.renamed)) {
            output += `${oldTag} -> ${data.newTag} (${data.count} ファイル)\n`;
          }
        }
        
        output += '\n';
      }
      
      // 削除結果
      if (operations.delete && operations.delete.length > 0) {
        output += '--- 削除結果 ---\n';
        
        if (Object.keys(result.deleted).length === 0) {
          output += '削除対象のタグは見つかりませんでした\n';
        } else {
          for (const [tag, count] of Object.entries(result.deleted)) {
            output += `${tag}: ${count} ファイルから削除\n`;
          }
        }
        
        output += '\n';
      }
      
      return output;
    } catch (error) {
      throw new Error(`タグの整理に失敗しました: ${(error as Error).message}`);
    }
  },
  
  /**
   * ファイルのメタデータを表示
   */
  async showFileMetadata(
    filePath: string
  ): Promise<string> {
    try {
      // ファイル情報を取得
      const fileInfo = await fsUtils.getFileInfo(filePath) as FileInfo;
      
      // ファイルタグを取得
      const tags = await fileTags.getFileTags(filePath);
      
      let output = '=== ファイルメタデータ ===\n\n';
      
      // 基本情報
      output += `ファイル名: ${fileInfo.name}\n`;
      output += `パス: ${fileInfo.path}\n`;
      output += `サイズ: ${fsUtils.formatFileSize(fileInfo.size)}\n`;
      output += `MIME タイプ: ${fileInfo.mimeType}\n`;
      output += `拡張子: ${fileInfo.extension || '(なし)'}\n\n`;
      
      // 日時情報
      output += `作成日時: ${fsUtils.formatFileDate(fileInfo.created)}\n`;
      output += `更新日時: ${fsUtils.formatFileDate(fileInfo.modified)}\n`;
      output += `アクセス日時: ${fsUtils.formatFileDate(fileInfo.accessed)}\n\n`;
      
      // 権限情報
      output += `権限: ${fileInfo.permissions}\n`;
      output += `実行可能: ${fileInfo.isExecutable ? 'はい' : 'いいえ'}\n`;
      output += `シンボリックリンク: ${fileInfo.isSymlink ? 'はい' : 'いいえ'}\n`;
      output += `隠しファイル: ${fileInfo.isHidden ? 'はい' : 'いいえ'}\n\n`;
      
      // タグ情報
      output += `タグ: ${tags.length > 0 ? tags.join(', ') : '(なし)'}\n\n`;
      
      // 追加情報（ハッシュ値など）
      try {
        const hash = await fsUtils.calculateFileHash(filePath, 'md5');
        output += `MD5 ハッシュ: ${hash}\n`;
      } catch (error) {
        output += `MD5 ハッシュ: 計算失敗 (${(error as Error).message})\n`;
      }
      
      return output;
    } catch (error) {
      throw new Error(`メタデータの取得に失敗しました: ${(error as Error).message}`);
    }
  },
};
