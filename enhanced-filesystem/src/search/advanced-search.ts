/**
 * 高度ファイル検索システム
 * Phase 3: 高度機能のインテリジェント検索・インデックスシステム
 */

import { promises as fs } from 'fs';
import { basename, extname, join } from 'path';
import {
  OperationResult,
  SavedSearch,
  SearchHighlight,
  SearchIndex,
  SearchIndexConfig,
  SearchQuery,
  SearchResult
} from '../types/index.js';
import {
  createFailureResult,
  createSuccessResult,
  ensureDirectory,
  fileExists,
  getFileInfo,
  getFilesRecursively
} from '../utils/file-helper.js';
import { logger } from '../utils/logger.js';

export class AdvancedSearchEngine {
  private searchIndex = new Map<string, SearchIndex>();
  private savedSearches = new Map<string, SavedSearch>();
  private fileContentCache = new Map<string, string>();

  private static readonly DEFAULT_INDEX_CONFIG: SearchIndexConfig = {
    indexContent: true,
    indexMetadata: true,
    excludePatterns: ['.git/**', 'node_modules/**', '*.exe', '*.dll', '*.so'],
    maxFileSize: 10, // MB
    supportedTypes: ['.txt', '.md', '.js', '.ts', '.py', '.java', '.cpp', '.c', '.json', '.xml', '.html', '.css'],
    updateInterval: 60 // minutes
  };

  /**
   * 検索インデックスを作成/更新
   */
  async createSearchIndex(
    basePath: string,
    indexPath?: string,
    config: Partial<SearchIndexConfig> = {}
  ): Promise<OperationResult<SearchIndex>> {
    try {
      logger.info(`検索インデックス作成開始: ${basePath}`);

      if (!await fileExists(basePath)) {
        throw new Error(`ベースパスが見つかりません: ${basePath}`);
      }

      const fullConfig = { ...AdvancedSearchEngine.DEFAULT_INDEX_CONFIG, ...config };
      const finalIndexPath = indexPath || join(basePath, '.search-index');

      await ensureDirectory(finalIndexPath);

      // ファイル一覧取得
      const allFiles = await getFilesRecursively(basePath, {
        includeHidden: false,
        fileFilter: (filePath) => this.shouldIndexFile(filePath, fullConfig)
      });

      logger.info(`インデックス対象ファイル: ${allFiles.length}個`);

      const searchIndex: SearchIndex = {
        basePath,
        indexPath: finalIndexPath,
        totalFiles: 0,
        lastUpdated: new Date(),
        version: '1.0.0',
        config: fullConfig
      };

      // インデックス作成
      const indexedFiles = await this.buildIndex(allFiles, searchIndex);
      searchIndex.totalFiles = indexedFiles;

      // インデックス保存
      const indexFilePath = join(finalIndexPath, 'index.json');
      await fs.writeFile(indexFilePath, JSON.stringify(searchIndex, null, 2), 'utf-8');

      this.searchIndex.set(basePath, searchIndex);

      logger.info(`検索インデックス作成完了: ${indexedFiles}ファイル`);
      return createSuccessResult(`検索インデックスが作成されました: ${indexedFiles}ファイル`, searchIndex);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`検索インデックス作成エラー: ${basePath}`, { error });
      return createFailureResult(`検索インデックス作成に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 高度検索を実行
   */
  async performAdvancedSearch(
    query: SearchQuery,
    searchPaths: string[]
  ): Promise<OperationResult<SearchResult[]>> {
    try {
      logger.info(`高度検索実行: クエリ「${query.text || '(空)'}」`);

      const results: SearchResult[] = [];
      const maxResults = query.maxResults || 100;

      for (const searchPath of searchPaths) {
        if (!await fileExists(searchPath)) {
          logger.warn(`検索パスが見つかりません: ${searchPath}`);
          continue;
        }

        // インデックスが存在するかチェック
        let searchIndex = this.searchIndex.get(searchPath);
        if (!searchIndex) {
          // インデックスをロードまたは作成
          const indexResult = await this.loadOrCreateIndex(searchPath);
          if (indexResult.success && indexResult.data) {
            searchIndex = indexResult.data;
          }
        }

        // ファイル検索実行
        const pathResults = await this.searchInPath(query, searchPath, searchIndex);
        results.push(...pathResults);

        if (results.length >= maxResults) {
          break;
        }
      }

      // 結果をスコア順にソート
      results.sort((a, b) => b.score - a.score);

      // 最大結果数で切り詰め
      const finalResults = results.slice(0, maxResults);

      logger.info(`高度検索完了: ${finalResults.length}件ヒット`);
      return createSuccessResult(`${finalResults.length}件の検索結果が見つかりました`, finalResults);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`高度検索エラー`, { error, query });
      return createFailureResult(`高度検索に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 保存済み検索を作成
   */
  async createSavedSearch(
    name: string,
    description: string,
    query: SearchQuery
  ): Promise<OperationResult<SavedSearch>> {
    try {
      logger.info(`保存済み検索作成: ${name}`);

      const searchId = this.generateSearchId(name);

      if (this.savedSearches.has(searchId)) {
        throw new Error(`同じ名前の保存済み検索が既に存在します: ${name}`);
      }

      const savedSearch: SavedSearch = {
        id: searchId,
        name,
        description,
        query,
        created: new Date(),
        lastUsed: new Date(),
        useCount: 0,
        favorite: false
      };

      this.savedSearches.set(searchId, savedSearch);

      logger.info(`保存済み検索作成完了: ${name}`);
      return createSuccessResult(`保存済み検索「${name}」が作成されました`, savedSearch);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`保存済み検索作成エラー: ${name}`, { error });
      return createFailureResult(`保存済み検索作成に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * ファジー検索を実行
   */
  async performFuzzySearch(
    searchTerm: string,
    searchPaths: string[],
    threshold: number = 0.6
  ): Promise<OperationResult<SearchResult[]>> {
    try {
      logger.info(`ファジー検索実行: 「${searchTerm}」, 閾値: ${threshold}`);

      const query: SearchQuery = {
        text: searchTerm,
        fuzzy: true,
        maxResults: 50
      };

      // 通常検索を実行
      const searchResult = await this.performAdvancedSearch(query, searchPaths);
      if (!searchResult.success || !searchResult.data) {
        throw new Error(`検索処理に失敗: ${searchResult.message}`);
      }

      const results = searchResult.data;

      // ファジー検索スコア計算
      const fuzzyResults = results.map(result => {
        const fileName = basename(result.file.path);
        const fuzzyScore = this.calculateFuzzyScore(searchTerm, fileName);

        return {
          ...result,
          score: result.score * fuzzyScore
        };
      }).filter(result => result.score >= threshold);

      // スコア順にソート
      fuzzyResults.sort((a, b) => b.score - a.score);

      logger.info(`ファジー検索完了: ${fuzzyResults.length}件ヒット`);
      return createSuccessResult(`${fuzzyResults.length}件のファジー検索結果が見つかりました`, fuzzyResults);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`ファジー検索エラー: ${searchTerm}`, { error });
      return createFailureResult(`ファジー検索に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 内容ベース検索を実行
   */
  async performContentSearch(
    searchTerm: string,
    searchPaths: string[],
    caseSensitive: boolean = false
  ): Promise<OperationResult<SearchResult[]>> {
    try {
      logger.info(`内容ベース検索実行: 「${searchTerm}」`);

      const results: SearchResult[] = [];
      const searchRegex = new RegExp(searchTerm, caseSensitive ? 'g' : 'gi');

      for (const searchPath of searchPaths) {
        const files = await getFilesRecursively(searchPath, {
          includeHidden: false,
          fileFilter: (filePath) => this.isTextFile(filePath)
        });

        for (const filePath of files) {
          try {
            const content = await this.readFileContent(filePath);
            const matches = content.match(searchRegex);

            if (matches && matches.length > 0) {
              const fileInfo = await getFileInfo(filePath);
              const highlights = this.generateHighlights(content, searchTerm, caseSensitive);

              const result: SearchResult = {
                file: fileInfo,
                score: matches.length * 0.1, // マッチ数に基づくスコア
                highlights,
                metadata: {
                  matchCount: matches.length,
                  contentType: 'text'
                }
              };

              results.push(result);
            }

          } catch (error) {
            logger.warn(`ファイル内容読み込みスキップ: ${filePath}`, { error });
          }
        }
      }

      // スコア順にソート
      results.sort((a, b) => b.score - a.score);

      logger.info(`内容ベース検索完了: ${results.length}件ヒット`);
      return createSuccessResult(`${results.length}件の内容ベース検索結果が見つかりました`, results);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`内容ベース検索エラー: ${searchTerm}`, { error });
      return createFailureResult(`内容ベース検索に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 検索統計レポート生成
   */
  async generateSearchReport(
    searchQueries: SearchQuery[],
    outputPath?: string
  ): Promise<OperationResult<string>> {
    try {
      logger.info(`検索統計レポート生成開始: ${searchQueries.length}クエリ`);

      const report = this.createSearchReport(searchQueries);
      const finalOutputPath = outputPath || join(process.cwd(), `search_report_${Date.now()}.txt`);

      await fs.writeFile(finalOutputPath, report, 'utf-8');

      logger.info(`検索統計レポート生成完了: ${finalOutputPath}`);
      return createSuccessResult(`検索統計レポートが生成されました: ${finalOutputPath}`, finalOutputPath);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`検索統計レポート生成エラー`, { error });
      return createFailureResult(`検索統計レポート生成に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * インデックス構築（内部用）
   */
  private async buildIndex(files: string[], searchIndex: SearchIndex): Promise<number> {
    let indexedCount = 0;

    for (const filePath of files) {
      try {
        // ファイル情報取得
        const fileInfo = await getFileInfo(filePath);

        // 内容インデックス
        if (searchIndex.config.indexContent && this.isTextFile(filePath)) {
          const content = await this.readFileContent(filePath);
          this.fileContentCache.set(filePath, content);
        }

        indexedCount++;

        if (indexedCount % 1000 === 0) {
          logger.info(`インデックス進行状況: ${indexedCount}/${files.length}ファイル`);
        }

      } catch (error) {
        logger.warn(`ファイルインデックススキップ: ${filePath}`, { error });
      }
    }

    return indexedCount;
  }

  /**
   * 指定パスでの検索実行（内部用）
   */
  private async searchInPath(
    query: SearchQuery,
    searchPath: string,
    searchIndex?: SearchIndex
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // ファイル一覧取得
    const files = await getFilesRecursively(searchPath, {
      includeHidden: false
    });

    for (const filePath of files) {
      try {
        const score = await this.calculateSearchScore(filePath, query);

        if (score > 0) {
          const fileInfo = await getFileInfo(filePath);

          const result: SearchResult = {
            file: fileInfo,
            score,
            metadata: {
              searchPath,
              indexed: !!searchIndex
            }
          };

          // ハイライト生成
          if (query.text && this.isTextFile(filePath)) {
            const highlights = await this.generateFileHighlights(filePath, query.text);
            result.highlights = highlights;
          }

          results.push(result);
        }

      } catch (error) {
        logger.warn(`ファイル検索スキップ: ${filePath}`, { error });
      }
    }

    return results;
  }

  /**
   * 検索スコア計算（内部用）
   */
  private async calculateSearchScore(filePath: string, query: SearchQuery): Promise<number> {
    let score = 0;
    const fileName = basename(filePath);
    const fileExtension = extname(filePath).toLowerCase();

    // ファイル名マッチング
    if (query.filename) {
      if (fileName.toLowerCase().includes(query.filename.toLowerCase())) {
        score += 0.8;
      }
    }

    // 拡張子マッチング
    if (query.extension && query.extension.length > 0) {
      if (query.extension.includes(fileExtension)) {
        score += 0.6;
      }
    }

    // テキスト検索
    if (query.text && this.isTextFile(filePath)) {
      const content = await this.readFileContent(filePath);
      const regex = new RegExp(query.text, 'gi');
      const matches = content.match(regex);

      if (matches) {
        score += matches.length * 0.1;
      }
    }

    // ファイルサイズフィルタ
    if (query.sizeRange) {
      try {
        const fileInfo = await getFileInfo(filePath);
        const sizeRange = query.sizeRange;

        if (sizeRange.min !== undefined && fileInfo.size < sizeRange.min) return 0;
        if (sizeRange.max !== undefined && fileInfo.size > sizeRange.max) return 0;

        score += 0.2;
      } catch (error) {
        // ファイル情報取得エラーは無視
      }
    }

    // 日付範囲フィルタ
    if (query.dateRange) {
      try {
        const fileInfo = await getFileInfo(filePath);
        const dateRange = query.dateRange;

        if (dateRange.start && fileInfo.modified < dateRange.start) return 0;
        if (dateRange.end && fileInfo.modified > dateRange.end) return 0;

        score += 0.2;
      } catch (error) {
        // ファイル情報取得エラーは無視
      }
    }

    return Math.min(score, 1.0); // 最大スコアは1.0
  }

  /**
   * ファジースコア計算（内部用）
   */
  private calculateFuzzyScore(searchTerm: string, targetText: string): number {
    const s1 = searchTerm.toLowerCase();
    const s2 = targetText.toLowerCase();

    // レーベンシュタイン距離ベースの類似度
    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    if (maxLength === 0) return 1.0;

    return 1.0 - (distance / maxLength);
  }

  /**
   * レーベンシュタイン距離計算（内部用）
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * ハイライト生成（内部用）
   */
  private generateHighlights(content: string, searchTerm: string, caseSensitive: boolean): SearchHighlight[] {
    const highlights: SearchHighlight[] = [];
    const regex = new RegExp(searchTerm, caseSensitive ? 'g' : 'gi');
    let match;

    while ((match = regex.exec(content)) !== null) {
      const start = Math.max(0, match.index - 50);
      const end = Math.min(content.length, match.index + searchTerm.length + 50);
      const snippet = content.substring(start, end);

      highlights.push({
        field: 'content',
        snippet,
        positions: [{ start: match.index, end: match.index + searchTerm.length }]
      });

      if (highlights.length >= 5) break; // 最大5個のハイライト
    }

    return highlights;
  }

  /**
   * ファイルハイライト生成（内部用）
   */
  private async generateFileHighlights(filePath: string, searchTerm: string): Promise<SearchHighlight[]> {
    try {
      const content = await this.readFileContent(filePath);
      return this.generateHighlights(content, searchTerm, false);
    } catch (error) {
      return [];
    }
  }

  /**
   * ファイル内容読み込み（内部用）
   */
  private async readFileContent(filePath: string): Promise<string> {
    // キャッシュから取得
    const cached = this.fileContentCache.get(filePath);
    if (cached) {
      return cached;
    }

    // ファイル読み込み
    const content = await fs.readFile(filePath, 'utf-8');

    // 大きすぎるファイルはキャッシュしない
    if (content.length < 100000) { // 100KB以下
      this.fileContentCache.set(filePath, content);
    }

    return content;
  }

  /**
   * テキストファイル判定（内部用）
   */
  private isTextFile(filePath: string): boolean {
    const textExtensions = ['.txt', '.md', '.js', '.ts', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.json', '.xml', '.html', '.css', '.yaml', '.yml'];
    const extension = extname(filePath).toLowerCase();
    return textExtensions.includes(extension);
  }

  /**
   * インデックス対象ファイル判定（内部用）
   */
  private shouldIndexFile(filePath: string, config: SearchIndexConfig): boolean {
    const fileName = basename(filePath);
    const extension = extname(filePath).toLowerCase();

    // 除外パターンチェック
    for (const pattern of config.excludePatterns) {
      if (this.matchPattern(filePath, pattern) || this.matchPattern(fileName, pattern)) {
        return false;
      }
    }

    // サポート形式チェック
    if (config.supportedTypes.length > 0) {
      return config.supportedTypes.includes(extension);
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
   * インデックス読み込みまたは作成（内部用）
   */
  private async loadOrCreateIndex(searchPath: string): Promise<OperationResult<SearchIndex>> {
    const indexPath = join(searchPath, '.search-index', 'index.json');

    if (await fileExists(indexPath)) {
      try {
        const indexData = JSON.parse(await fs.readFile(indexPath, 'utf-8'));
        this.searchIndex.set(searchPath, indexData);
        return createSuccessResult('インデックスを読み込みました', indexData);
      } catch (error) {
        logger.warn(`インデックス読み込みエラー: ${indexPath}`, { error });
      }
    }

    // インデックスが存在しない場合は作成
    return await this.createSearchIndex(searchPath);
  }

  /**
   * 検索レポート作成（内部用）
   */
  private createSearchReport(searchQueries: SearchQuery[]): string {
    const lines: string[] = [];

    lines.push('# 検索統計レポート');
    lines.push(`生成日時: ${new Date().toLocaleString('ja-JP')}`);
    lines.push('');

    // サマリー
    lines.push('## サマリー');
    lines.push(`- 検索クエリ数: ${searchQueries.length}`);
    lines.push('');

    // クエリ分析
    const textQueries = searchQueries.filter(q => q.text).length;
    const filenameQueries = searchQueries.filter(q => q.filename).length;
    const extensionQueries = searchQueries.filter(q => q.extension && q.extension.length > 0).length;
    const fuzzyQueries = searchQueries.filter(q => q.fuzzy).length;

    lines.push('## クエリ種別');
    lines.push(`- テキスト検索: ${textQueries}件`);
    lines.push(`- ファイル名検索: ${filenameQueries}件`);
    lines.push(`- 拡張子フィルタ: ${extensionQueries}件`);
    lines.push(`- ファジー検索: ${fuzzyQueries}件`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * 検索ID生成（内部用）
   */
  private generateSearchId(name: string): string {
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
    return `search_${safeName}_${Date.now()}`;
  }
} 