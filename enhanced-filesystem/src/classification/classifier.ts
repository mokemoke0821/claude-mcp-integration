/**
 * インテリジェント分類システム
 * Phase 3: 高度機能のAI支援ファイル分類・自動タグ付けシステム
 */

import { promises as fs } from 'fs';
import { basename, extname, join } from 'path';
import {
  ClassificationAction,
  ClassificationCondition,
  ClassificationRule,
  FileCategory,
  FileTag,
  OperationResult,
  SmartFolder
} from '../types/index.js';
import {
  createFailureResult,
  createSuccessResult,
  fileExists,
  getFileInfo,
  getFilesRecursively
} from '../utils/file-helper.js';
import { logger } from '../utils/logger.js';

export class IntelligentClassifier {
  private categories = new Map<string, FileCategory>();
  private rules: ClassificationRule[] = [];
  private smartFolders = new Map<string, SmartFolder>();

  private static readonly DEFAULT_CATEGORIES: FileCategory[] = [
    {
      id: 'documents',
      name: 'ドキュメント',
      description: 'テキストファイル、Office文書、PDF等',
      patterns: ['*.txt', '*.doc', '*.docx', '*.pdf', '*.rtf', '*.odt'],
      priority: 10,
      autoAssign: true,
      color: '#1f77b4',
      icon: '📄'
    },
    {
      id: 'images',
      name: '画像',
      description: '写真、図表、アイコン等',
      patterns: ['*.jpg', '*.jpeg', '*.png', '*.gif', '*.bmp', '*.svg', '*.webp'],
      priority: 10,
      autoAssign: true,
      color: '#ff7f0e',
      icon: '🖼️'
    },
    {
      id: 'videos',
      name: '動画',
      description: 'ビデオファイル',
      patterns: ['*.mp4', '*.avi', '*.mov', '*.wmv', '*.flv', '*.mkv', '*.webm'],
      priority: 10,
      autoAssign: true,
      color: '#2ca02c',
      icon: '🎥'
    },
    {
      id: 'audio',
      name: '音声',
      description: '音楽、音声ファイル',
      patterns: ['*.mp3', '*.wav', '*.flac', '*.aac', '*.ogg', '*.m4a'],
      priority: 10,
      autoAssign: true,
      color: '#d62728',
      icon: '🎵'
    },
    {
      id: 'archives',
      name: 'アーカイブ',
      description: '圧縮ファイル',
      patterns: ['*.zip', '*.rar', '*.7z', '*.tar', '*.gz', '*.bz2'],
      priority: 8,
      autoAssign: true,
      color: '#9467bd',
      icon: '📦'
    },
    {
      id: 'code',
      name: 'ソースコード',
      description: 'プログラムファイル',
      patterns: ['*.js', '*.ts', '*.py', '*.java', '*.cpp', '*.c', '*.cs', '*.php', '*.rb', '*.go'],
      priority: 9,
      autoAssign: true,
      color: '#8c564b',
      icon: '💻'
    }
  ];

  constructor() {
    this.initializeDefaultCategories();
  }

  /**
   * ファイルの自動分類・タグ付け
   */
  async classifyFiles(
    searchPaths: string[],
    useAI: boolean = false
  ): Promise<OperationResult<Map<string, FileTag[]>>> {
    try {
      logger.info(`ファイル自動分類開始: ${searchPaths.length}パス, AI使用: ${useAI}`);

      const fileTagMap = new Map<string, FileTag[]>();
      let totalFiles = 0;
      let classifiedFiles = 0;

      for (const searchPath of searchPaths) {
        if (!await fileExists(searchPath)) {
          logger.warn(`パスが見つかりません: ${searchPath}`);
          continue;
        }

        const files = await getFilesRecursively(searchPath, {
          includeHidden: false
        });

        for (const filePath of files) {
          try {
            totalFiles++;
            const tags = await this.classifyFile(filePath, useAI);

            if (tags.length > 0) {
              fileTagMap.set(filePath, tags);
              classifiedFiles++;
            }

          } catch (error) {
            logger.warn(`ファイル分類スキップ: ${filePath}`, { error });
          }
        }
      }

      logger.info(`ファイル自動分類完了: ${classifiedFiles}/${totalFiles}ファイル分類`);
      return createSuccessResult(`${classifiedFiles}ファイルが分類されました`, fileTagMap);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`ファイル自動分類エラー`, { error, searchPaths });
      return createFailureResult(`ファイル自動分類に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 分類ルールを作成
   */
  async createClassificationRule(
    rule: Omit<ClassificationRule, 'id'>
  ): Promise<OperationResult<ClassificationRule>> {
    try {
      logger.info(`分類ルール作成: ${rule.name}`);

      const ruleId = this.generateRuleId(rule.name);
      const fullRule: ClassificationRule = {
        id: ruleId,
        ...rule
      };

      // ルール検証
      if (!this.validateRule(fullRule)) {
        throw new Error('無効な分類ルールです');
      }

      this.rules.push(fullRule);
      this.rules.sort((a, b) => b.priority - a.priority); // 優先度順にソート

      logger.info(`分類ルール作成完了: ${ruleId}`);
      return createSuccessResult(`分類ルール「${rule.name}」が作成されました`, fullRule);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`分類ルール作成エラー: ${rule.name}`, { error });
      return createFailureResult(`分類ルール作成に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * スマートフォルダを作成
   */
  async createSmartFolder(
    name: string,
    query: any, // SearchQuery
    autoUpdate: boolean = true
  ): Promise<OperationResult<SmartFolder>> {
    try {
      logger.info(`スマートフォルダ作成: ${name}`);

      const folderId = this.generateFolderId(name);

      const smartFolder: SmartFolder = {
        id: folderId,
        name,
        description: `自動更新: ${autoUpdate ? 'ON' : 'OFF'}`,
        query,
        autoUpdate,
        created: new Date(),
        lastUpdated: new Date(),
        fileCount: 0
      };

      this.smartFolders.set(folderId, smartFolder);

      // 初期ファイル数計算
      if (autoUpdate) {
        const fileCount = await this.updateSmartFolder(folderId);
        smartFolder.fileCount = fileCount;
      }

      logger.info(`スマートフォルダ作成完了: ${name}`);
      return createSuccessResult(`スマートフォルダ「${name}」が作成されました`, smartFolder);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`スマートフォルダ作成エラー: ${name}`, { error });
      return createFailureResult(`スマートフォルダ作成に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * ファイルカテゴリを管理
   */
  async manageCategories(
    action: 'add' | 'update' | 'delete',
    category: FileCategory
  ): Promise<OperationResult<FileCategory[]>> {
    try {
      logger.info(`カテゴリ管理: ${action} - ${category.name}`);

      switch (action) {
        case 'add':
          if (this.categories.has(category.id)) {
            throw new Error(`カテゴリID「${category.id}」は既に存在します`);
          }
          this.categories.set(category.id, category);
          break;

        case 'update':
          if (!this.categories.has(category.id)) {
            throw new Error(`カテゴリID「${category.id}」が見つかりません`);
          }
          this.categories.set(category.id, category);
          break;

        case 'delete':
          if (!this.categories.has(category.id)) {
            throw new Error(`カテゴリID「${category.id}」が見つかりません`);
          }
          this.categories.delete(category.id);
          break;

        default:
          throw new Error(`未対応のアクション: ${action}`);
      }

      const allCategories = Array.from(this.categories.values());
      logger.info(`カテゴリ管理完了: ${action} - ${category.name}`);
      return createSuccessResult(`カテゴリ操作が完了しました`, allCategories);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`カテゴリ管理エラー: ${action} - ${category.name}`, { error });
      return createFailureResult(`カテゴリ管理に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 分類統計レポート生成
   */
  async generateClassificationReport(
    searchPaths: string[],
    outputPath?: string
  ): Promise<OperationResult<string>> {
    try {
      logger.info(`分類統計レポート生成開始: ${searchPaths.length}パス`);

      // ファイル分類実行
      const classificationResult = await this.classifyFiles(searchPaths, false);
      if (!classificationResult.success || !classificationResult.data) {
        throw new Error(`分類処理に失敗: ${classificationResult.message}`);
      }

      const fileTagMap = classificationResult.data;
      const report = this.createClassificationReport(fileTagMap, searchPaths);

      const finalOutputPath = outputPath || join(process.cwd(), `classification_report_${Date.now()}.txt`);
      await fs.writeFile(finalOutputPath, report, 'utf-8');

      logger.info(`分類統計レポート生成完了: ${finalOutputPath}`);
      return createSuccessResult(`分類統計レポートが生成されました: ${finalOutputPath}`, finalOutputPath);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`分類統計レポート生成エラー`, { error });
      return createFailureResult(`分類統計レポート生成に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 単一ファイルの分類処理（内部用）
   */
  private async classifyFile(filePath: string, useAI: boolean): Promise<FileTag[]> {
    const tags: FileTag[] = [];
    const fileInfo = await getFileInfo(filePath);
    const fileName = basename(filePath);
    const fileExtension = extname(filePath).toLowerCase();

    // 拡張子ベースの自動分類
    for (const category of this.categories.values()) {
      if (category.autoAssign && this.matchesCategory(fileName, category)) {
        tags.push({
          name: category.name,
          category: category.id,
          color: category.color,
          confidence: 0.9,
          source: 'auto',
          created: new Date()
        });
        break; // 最初にマッチしたカテゴリのみ
      }
    }

    // ファイルサイズベースのタグ
    if (fileInfo.size > 100 * 1024 * 1024) { // 100MB以上
      tags.push({
        name: '大容量ファイル',
        color: '#ff4444',
        confidence: 1.0,
        source: 'auto',
        created: new Date()
      });
    } else if (fileInfo.size < 1024) { // 1KB未満
      tags.push({
        name: '小ファイル',
        color: '#44ff44',
        confidence: 1.0,
        source: 'auto',
        created: new Date()
      });
    }

    // ファイル年代ベースのタグ
    const fileAge = (Date.now() - fileInfo.modified.getTime()) / (1000 * 60 * 60 * 24); // days
    if (fileAge > 365) {
      tags.push({
        name: '古いファイル',
        color: '#888888',
        confidence: 0.8,
        source: 'auto',
        created: new Date()
      });
    } else if (fileAge < 7) {
      tags.push({
        name: '最近のファイル',
        color: '#00ff00',
        confidence: 0.8,
        source: 'auto',
        created: new Date()
      });
    }

    // AIベースの分類（シミュレーション）
    if (useAI) {
      const aiTags = await this.performAIClassification(filePath, fileInfo);
      tags.push(...aiTags);
    }

    // カスタムルールの適用
    const ruleTags = await this.applyClassificationRules(filePath, fileInfo);
    tags.push(...ruleTags);

    return tags;
  }

  /**
   * AI分類のシミュレーション（内部用）
   */
  private async performAIClassification(filePath: string, fileInfo: any): Promise<FileTag[]> {
    const tags: FileTag[] = [];
    const fileName = basename(filePath).toLowerCase();

    // プロジェクト関連ファイルの検出
    if (fileName.includes('project') || fileName.includes('readme') || fileName.includes('license')) {
      tags.push({
        name: 'プロジェクトファイル',
        color: '#0066cc',
        confidence: 0.7,
        source: 'ai',
        created: new Date()
      });
    }

    // 設定ファイルの検出
    if (fileName.includes('config') || fileName.includes('setting') || fileName.startsWith('.')) {
      tags.push({
        name: '設定ファイル',
        color: '#666666',
        confidence: 0.8,
        source: 'ai',
        created: new Date()
      });
    }

    // 一時ファイルの検出
    if (fileName.includes('temp') || fileName.includes('tmp') || fileName.includes('cache')) {
      tags.push({
        name: '一時ファイル',
        color: '#ff8800',
        confidence: 0.9,
        source: 'ai',
        created: new Date()
      });
    }

    return tags;
  }

  /**
   * 分類ルール適用（内部用）
   */
  private async applyClassificationRules(filePath: string, fileInfo: any): Promise<FileTag[]> {
    const tags: FileTag[] = [];
    const fileName = basename(filePath);

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      let allConditionsMet = true;

      // すべての条件をチェック
      for (const condition of rule.conditions) {
        if (!this.evaluateCondition(condition, filePath, fileName, fileInfo)) {
          allConditionsMet = false;
          break;
        }
      }

      if (allConditionsMet) {
        // アクションを実行
        for (const action of rule.actions) {
          const tag = this.executeClassificationAction(action, filePath);
          if (tag) {
            tags.push(tag);
          }
        }
      }
    }

    return tags;
  }

  /**
   * 条件評価（内部用）
   */
  private evaluateCondition(
    condition: ClassificationCondition,
    filePath: string,
    fileName: string,
    fileInfo: any
  ): boolean {
    let fieldValue: any;

    switch (condition.field) {
      case 'filename':
        fieldValue = fileName;
        break;
      case 'extension':
        fieldValue = extname(filePath).toLowerCase();
        break;
      case 'size':
        fieldValue = fileInfo.size;
        break;
      case 'path':
        fieldValue = filePath;
        break;
      default:
        return false;
    }

    return this.evaluateFieldCondition(fieldValue, condition.operator, condition.value, condition.caseSensitive);
  }

  /**
   * フィールド条件評価（内部用）
   */
  private evaluateFieldCondition(
    fieldValue: any,
    operator: string,
    conditionValue: any,
    caseSensitive: boolean = false
  ): boolean {
    if (typeof fieldValue === 'string' && !caseSensitive) {
      fieldValue = fieldValue.toLowerCase();
      if (typeof conditionValue === 'string') {
        conditionValue = conditionValue.toLowerCase();
      }
    }

    switch (operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'contains':
        return String(fieldValue).includes(String(conditionValue));
      case 'matches':
        return new RegExp(String(conditionValue)).test(String(fieldValue));
      case 'greater':
        return Number(fieldValue) > Number(conditionValue);
      case 'less':
        return Number(fieldValue) < Number(conditionValue);
      case 'range':
        const [min, max] = Array.isArray(conditionValue) ? conditionValue : [0, 0];
        return Number(fieldValue) >= min && Number(fieldValue) <= max;
      default:
        return false;
    }
  }

  /**
   * 分類アクション実行（内部用）
   */
  private executeClassificationAction(action: ClassificationAction, filePath: string): FileTag | null {
    switch (action.type) {
      case 'tag':
        return {
          name: String(action.value),
          color: action.params?.color || '#0066cc',
          confidence: action.params?.confidence || 0.8,
          source: 'auto',
          created: new Date()
        };
      case 'category':
        const category = this.categories.get(String(action.value));
        if (category) {
          return {
            name: category.name,
            category: category.id,
            color: category.color,
            confidence: 0.9,
            source: 'auto',
            created: new Date()
          };
        }
        break;
    }

    return null;
  }

  /**
   * カテゴリマッチング（内部用）
   */
  private matchesCategory(fileName: string, category: FileCategory): boolean {
    return category.patterns.some(pattern => this.matchPattern(fileName, pattern));
  }

  /**
   * パターンマッチング（内部用）
   */
  private matchPattern(text: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');

    return new RegExp(`^${regexPattern}$`, 'i').test(text);
  }

  /**
   * ルール検証（内部用）
   */
  private validateRule(rule: ClassificationRule): boolean {
    if (!rule.name || !rule.conditions || !rule.actions) {
      return false;
    }

    return rule.conditions.length > 0 && rule.actions.length > 0;
  }

  /**
   * スマートフォルダ更新（内部用）
   */
  private async updateSmartFolder(folderId: string): Promise<number> {
    // 実際の実装では検索機能と統合
    // 今回はシミュレーション
    return Math.floor(Math.random() * 100);
  }

  /**
   * 分類レポート作成（内部用）
   */
  private createClassificationReport(fileTagMap: Map<string, FileTag[]>, searchPaths: string[]): string {
    const lines: string[] = [];

    lines.push('# ファイル分類レポート');
    lines.push(`生成日時: ${new Date().toLocaleString('ja-JP')}`);
    lines.push('');

    // サマリー
    const totalFiles = fileTagMap.size;
    const categoryStats = new Map<string, number>();
    const tagStats = new Map<string, number>();

    for (const tags of fileTagMap.values()) {
      for (const tag of tags) {
        const key = tag.category || tag.name;
        categoryStats.set(key, (categoryStats.get(key) || 0) + 1);
        tagStats.set(tag.name, (tagStats.get(tag.name) || 0) + 1);
      }
    }

    lines.push('## サマリー');
    lines.push(`- 検索パス: ${searchPaths.join(', ')}`);
    lines.push(`- 分類ファイル数: ${totalFiles}`);
    lines.push(`- 検出カテゴリ数: ${categoryStats.size}`);
    lines.push(`- 総タグ数: ${tagStats.size}`);
    lines.push('');

    // カテゴリ別統計
    lines.push('## カテゴリ別統計');
    const sortedCategories = Array.from(categoryStats.entries()).sort((a, b) => b[1] - a[1]);
    sortedCategories.forEach(([category, count]) => {
      const percentage = ((count / totalFiles) * 100).toFixed(1);
      lines.push(`- ${category}: ${count}ファイル (${percentage}%)`);
    });
    lines.push('');

    // 人気タグ
    lines.push('## 人気タグ（上位10）');
    const sortedTags = Array.from(tagStats.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
    sortedTags.forEach(([tag, count], index) => {
      lines.push(`${index + 1}. ${tag}: ${count}ファイル`);
    });
    lines.push('');

    return lines.join('\n');
  }

  /**
   * デフォルトカテゴリ初期化（内部用）
   */
  private initializeDefaultCategories(): void {
    for (const category of IntelligentClassifier.DEFAULT_CATEGORIES) {
      this.categories.set(category.id, category);
    }
  }

  /**
   * ルールID生成（内部用）
   */
  private generateRuleId(name: string): string {
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
    return `rule_${safeName}_${Date.now()}`;
  }

  /**
   * フォルダID生成（内部用）
   */
  private generateFolderId(name: string): string {
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
    return `folder_${safeName}_${Date.now()}`;
  }
} 