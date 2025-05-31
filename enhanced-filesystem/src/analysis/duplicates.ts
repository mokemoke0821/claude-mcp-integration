/**
 * 重複ファイル検出・管理機能
 * Phase 2: 実用機能の重複ファイル管理システム
 */

import { promises as fs } from 'fs';
import { basename, join } from 'path';
import {
  DuplicateFile,
  DuplicateGroup,
  OperationResult,
  StorageAnalysis
} from '../types/index.js';
import {
  calculateFileHash,
  createFailureResult,
  createSuccessResult,
  fileExists,
  formatFileSize,
  getFileInfo,
  getFilesRecursively
} from '../utils/file-helper.js';
import { logger } from '../utils/logger.js';

export class DuplicateDetector {
  /**
   * 重複ファイルを検出
   */
  async findDuplicateFiles(
    searchPaths: string[],
    method: 'hash' | 'name' | 'size' | 'content' = 'hash'
  ): Promise<OperationResult<DuplicateGroup[]>> {
    try {
      logger.info(`重複ファイル検出を開始: ${searchPaths.length}パス, 方法: ${method}`);

      // 全ファイルを収集
      const allFiles: string[] = [];
      for (const searchPath of searchPaths) {
        if (!await fileExists(searchPath)) {
          logger.warn(`パスが見つかりません: ${searchPath}`);
          continue;
        }

        const files = await getFilesRecursively(searchPath, {
          includeHidden: false
        });
        allFiles.push(...files);
      }

      logger.info(`検出対象ファイル数: ${allFiles.length}`);

      // 重複検出実行
      const duplicateGroups = await this.performDuplicateDetection(allFiles, method);

      // 結果フィルタリング（重複があるもののみ）
      const filteredGroups = duplicateGroups.filter(group => group.files.length > 1);

      const totalWastedSpace = filteredGroups.reduce((sum, group) => sum + group.totalWastedSpace, 0);

      logger.info(`重複ファイル検出完了: ${filteredGroups.length}グループ, 無駄容量: ${formatFileSize(totalWastedSpace)}`);
      return createSuccessResult(`重複ファイル検出が完了しました: ${filteredGroups.length}グループ検出`, filteredGroups);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`重複ファイル検出エラー`, { error, searchPaths, method });
      return createFailureResult(`重複ファイル検出に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * ストレージ分析
   */
  async analyzeStorage(
    searchPaths: string[]
  ): Promise<OperationResult<StorageAnalysis>> {
    try {
      logger.info(`ストレージ分析を開始: ${searchPaths.length}パス`);

      // 重複ファイル検出
      const duplicatesResult = await this.findDuplicateFiles(searchPaths, 'hash');
      if (!duplicatesResult.success || !duplicatesResult.data) {
        throw new Error(`重複ファイル検出に失敗: ${duplicatesResult.message}`);
      }

      const duplicateGroups = duplicatesResult.data;

      // 全ファイル情報収集
      let totalFiles = 0;
      let totalSize = 0;

      for (const searchPath of searchPaths) {
        const files = await getFilesRecursively(searchPath);
        totalFiles += files.length;

        for (const file of files) {
          try {
            const stats = await fs.stat(file);
            totalSize += stats.size;
          } catch (error) {
            // ファイルアクセスエラーは無視
          }
        }
      }

      // 分析結果計算
      const wastedSpace = duplicateGroups.reduce((sum, group) => sum + group.totalWastedSpace, 0);
      const wastedPercentage = totalSize > 0 ? (wastedSpace / totalSize) * 100 : 0;

      // 最大重複グループのトップ10
      const largestDuplicates = [...duplicateGroups]
        .sort((a, b) => b.totalWastedSpace - a.totalWastedSpace)
        .slice(0, 10);

      // 推奨事項生成
      const recommendations = this.generateRecommendations(duplicateGroups, totalSize);

      const analysis: StorageAnalysis = {
        totalFiles,
        totalSize,
        duplicateGroups: duplicateGroups.length,
        wastedSpace,
        wastedPercentage,
        largestDuplicates,
        recommendations
      };

      logger.info(`ストレージ分析完了: 無駄容量 ${formatFileSize(wastedSpace)} (${wastedPercentage.toFixed(1)}%)`);
      return createSuccessResult(`ストレージ分析が完了しました`, analysis);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`ストレージ分析エラー`, { error, searchPaths });
      return createFailureResult(`ストレージ分析に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 重複ファイルの自動解決
   */
  async resolveDuplicates(
    duplicateGroups: DuplicateGroup[],
    strategy: 'keep-newest' | 'keep-largest' | 'keep-first' | 'interactive' = 'keep-newest'
  ): Promise<OperationResult<string[]>> {
    try {
      logger.info(`重複ファイル解決を開始: ${duplicateGroups.length}グループ, 戦略: ${strategy}`);

      const deletedFiles: string[] = [];
      const errors: string[] = [];

      for (const group of duplicateGroups) {
        try {
          const filesToDelete = await this.selectFilesToDelete(group, strategy);

          for (const file of filesToDelete) {
            try {
              await fs.unlink(file.path);
              deletedFiles.push(file.path);
              logger.debug(`重複ファイルを削除: ${file.path}`);
            } catch (error) {
              errors.push(`${file.path}: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
        } catch (error) {
          errors.push(`グループ解決エラー: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      if (errors.length > 0) {
        logger.warn(`重複ファイル解決で一部エラー発生`, { errors });
        return createSuccessResult(
          `${deletedFiles.length}ファイルを削除しました。エラー: ${errors.length}件`,
          deletedFiles
        );
      }

      logger.info(`重複ファイル解決完了: ${deletedFiles.length}ファイル削除`);
      return createSuccessResult(`重複ファイル解決が完了しました: ${deletedFiles.length}ファイル削除`, deletedFiles);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`重複ファイル解決エラー`, { error, strategy });
      return createFailureResult(`重複ファイル解決に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 重複ファイルレポート生成
   */
  async generateDuplicateReport(
    duplicateGroups: DuplicateGroup[],
    outputPath?: string
  ): Promise<OperationResult<string>> {
    try {
      logger.info(`重複ファイルレポート生成を開始: ${duplicateGroups.length}グループ`);

      const report = this.createDuplicateReport(duplicateGroups);

      const finalOutputPath = outputPath || join(process.cwd(), `duplicate_report_${Date.now()}.txt`);
      await fs.writeFile(finalOutputPath, report, 'utf-8');

      logger.info(`重複ファイルレポート生成完了: ${finalOutputPath}`);
      return createSuccessResult(`重複ファイルレポートが生成されました: ${finalOutputPath}`, finalOutputPath);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`重複ファイルレポート生成エラー`, { error });
      return createFailureResult(`重複ファイルレポート生成に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 実際の重複検出処理（内部用）
   */
  private async performDuplicateDetection(
    files: string[],
    method: 'hash' | 'name' | 'size' | 'content'
  ): Promise<DuplicateGroup[]> {
    const groupMap = new Map<string, DuplicateFile[]>();

    for (const filePath of files) {
      try {
        let key: string;

        switch (method) {
          case 'hash':
            key = await calculateFileHash(filePath, 'sha256');
            break;
          case 'name':
            key = basename(filePath);
            break;
          case 'size':
            const stats = await fs.stat(filePath);
            key = stats.size.toString();
            break;
          case 'content':
            // 内容ベースの比較（ハッシュと同じ）
            key = await calculateFileHash(filePath, 'sha256');
            break;
          default:
            throw new Error(`未対応の検出方法: ${method}`);
        }

        const fileInfo = await getFileInfo(filePath);
        const duplicateFile: DuplicateFile = {
          path: filePath,
          size: fileInfo.size,
          modified: fileInfo.modified,
          isKeep: false
        };

        if (!groupMap.has(key)) {
          groupMap.set(key, []);
        }
        const group = groupMap.get(key);
        if (group) {
          group.push(duplicateFile);
        }

      } catch (error) {
        logger.warn(`ファイル処理スキップ: ${filePath}`, { error });
      }
    }

    // DuplicateGroupに変換
    const duplicateGroups: DuplicateGroup[] = [];
    for (const [key, files] of groupMap) {
      if (files.length > 1) {
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);

        // 配列が空でないことを確認してからreduce処理
        if (files.length === 0) continue;

        const largestFile = files.reduce((largest, file) => file.size > largest.size ? file : largest, files[0]);

        // 最大ファイルを保持対象としてマーク
        largestFile.isKeep = true;
        largestFile.reason = '最大サイズファイル';

        const duplicateGroup: DuplicateGroup = {
          hash: key,
          size: largestFile.size,
          files,
          totalWastedSpace: totalSize - largestFile.size,
          duplicateMethod: method
        };

        duplicateGroups.push(duplicateGroup);
      }
    }

    return duplicateGroups;
  }

  /**
   * 削除対象ファイル選択（内部用）
   */
  private async selectFilesToDelete(
    group: DuplicateGroup,
    strategy: 'keep-newest' | 'keep-largest' | 'keep-first' | 'interactive'
  ): Promise<DuplicateFile[]> {
    const files = [...group.files];

    // 保持するファイルを決定
    let keepFile: DuplicateFile;

    switch (strategy) {
      case 'keep-newest':
        keepFile = files.reduce((newest, file) => file.modified > newest.modified ? file : newest);
        break;
      case 'keep-largest':
        keepFile = files.reduce((largest, file) => file.size > largest.size ? file : largest);
        break;
      case 'keep-first':
        keepFile = files[0];
        break;
      case 'interactive':
        // インタラクティブモードは今回は最新ファイルを保持
        keepFile = files.reduce((newest, file) => file.modified > newest.modified ? file : newest);
        break;
      default:
        throw new Error(`未対応の戦略: ${strategy}`);
    }

    // 保持対象をマーク
    keepFile.isKeep = true;
    keepFile.reason = `戦略: ${strategy}`;

    // 削除対象を返す
    return files.filter(file => file !== keepFile);
  }

  /**
   * 推奨事項生成（内部用）
   */
  private generateRecommendations(duplicateGroups: DuplicateGroup[], totalSize: number): string[] {
    const recommendations: string[] = [];

    if (duplicateGroups.length === 0) {
      recommendations.push('重複ファイルが見つかりませんでした。ストレージは効率的に使用されています。');
      return recommendations;
    }

    const wastedSpace = duplicateGroups.reduce((sum, group) => sum + group.totalWastedSpace, 0);
    const wastedPercentage = (wastedSpace / totalSize) * 100;

    if (wastedPercentage > 20) {
      recommendations.push('⚠️ 重複ファイルが全体の20%以上を占めています。早急な整理をお勧めします。');
    } else if (wastedPercentage > 10) {
      recommendations.push('📊 重複ファイルが全体の10%以上を占めています。定期的な整理をお勧めします。');
    } else if (wastedPercentage > 5) {
      recommendations.push('💡 軽微な重複ファイルが検出されました。時間のある時に整理することをお勧めします。');
    }

    // 大きな重複グループの特定
    const largeGroups = duplicateGroups.filter(group => group.totalWastedSpace > 100 * 1024 * 1024); // 100MB以上
    if (largeGroups.length > 0) {
      recommendations.push(`🎯 100MB以上の大きな重複グループが${largeGroups.length}個あります。優先的に整理してください。`);
    }

    // 画像ファイルの重複チェック
    const imageGroups = duplicateGroups.filter(group =>
      group.files.some(file => /\.(jpg|jpeg|png|gif|bmp|svg)$/i.test(file.path))
    );
    if (imageGroups.length > duplicateGroups.length * 0.3) {
      recommendations.push('📸 画像ファイルの重複が多く検出されました。写真管理ツールの使用をお勧めします。');
    }

    // ドキュメントファイルの重複チェック
    const docGroups = duplicateGroups.filter(group =>
      group.files.some(file => /\.(doc|docx|pdf|txt|rtf)$/i.test(file.path))
    );
    if (docGroups.length > duplicateGroups.length * 0.3) {
      recommendations.push('📄 ドキュメントファイルの重複が多く検出されました。バージョン管理システムの導入をお勧めします。');
    }

    return recommendations;
  }

  /**
   * 重複ファイルレポート作成（内部用）
   */
  private createDuplicateReport(duplicateGroups: DuplicateGroup[]): string {
    const lines: string[] = [];

    lines.push('# 重複ファイルレポート');
    lines.push(`生成日時: ${new Date().toLocaleString('ja-JP')}`);
    lines.push('');

    // サマリー
    const totalGroups = duplicateGroups.length;
    const totalWastedSpace = duplicateGroups.reduce((sum, group) => sum + group.totalWastedSpace, 0);
    const totalFiles = duplicateGroups.reduce((sum, group) => sum + group.files.length, 0);

    lines.push('## サマリー');
    lines.push(`- 重複グループ数: ${totalGroups}`);
    lines.push(`- 重複ファイル数: ${totalFiles}`);
    lines.push(`- 無駄な容量: ${formatFileSize(totalWastedSpace)}`);
    lines.push('');

    // 各グループの詳細
    lines.push('## 重複ファイル詳細');
    lines.push('');

    duplicateGroups
      .sort((a, b) => b.totalWastedSpace - a.totalWastedSpace)
      .forEach((group, index) => {
        lines.push(`### グループ ${index + 1}`);
        lines.push(`- ハッシュ: ${group.hash.substring(0, 16)}...`);
        lines.push(`- ファイルサイズ: ${formatFileSize(group.size)}`);
        lines.push(`- 重複ファイル数: ${group.files.length}`);
        lines.push(`- 無駄な容量: ${formatFileSize(group.totalWastedSpace)}`);
        lines.push(`- 検出方法: ${group.duplicateMethod}`);
        lines.push('');

        lines.push('**ファイル一覧:**');
        group.files.forEach((file, fileIndex) => {
          const status = file.isKeep ? '🟢 保持' : '🔴 削除候補';
          const reason = file.reason ? ` (${file.reason})` : '';
          lines.push(`${fileIndex + 1}. ${status} ${file.path}${reason}`);
          lines.push(`   - サイズ: ${formatFileSize(file.size)}`);
          lines.push(`   - 更新日: ${file.modified.toLocaleString('ja-JP')}`);
        });
        lines.push('');
      });

    return lines.join('\n');
  }
} 