/**
 * 全ツール実行ハンドラー
 * 実装済み: Phase 1 (9ツール) + Phase 3 (21ツール) = 30ツール
 * 未実装: Phase 2 (19ツール)
 */

import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';

// インスタンス型定義
interface ToolInstances {
  // Phase 1: セキュリティ機能
  encryption: any;
  integrity: any;
  secureOps: any | null;

  // Phase 2: 実用機能（未実装）
  compression: any | null;
  duplicateDetector: any | null;
  fileWatcher: any | null;
  syncManager: any | null;

  // Phase 3: 高度機能
  versionManager: any;
  classifier: any;
  searchEngine: any;
  permissionManager: any;
}

export class ToolHandlers {
  constructor(private instances: ToolInstances) { }

  /**
   * 全ツール実行処理
   */
  async handleToolCall(name: string, args: any): Promise<any> {
    // Phase 2 ツールのチェック（未実装）
    const phase2Tools = [
      'create_archive', 'extract_archive', 'list_archive_contents', 'analyze_compression_efficiency',
      'scan_duplicates', 'clean_duplicates', 'analyze_storage_waste', 'generate_duplicate_report',
      'start_file_watch', 'stop_file_watch', 'get_watch_status', 'get_file_changes', 'export_watch_log', 'analyze_file_activity',
      'sync_directories', 'create_backup', 'restore_backup', 'verify_sync_integrity', 'generate_sync_report'
    ];

    if (phase2Tools.includes(name)) {
      return {
        success: false,
        message: `ツール「${name}」はPhase 2機能で現在未実装です。Phase 1とPhase 3のツールのみ利用可能です。`,
        error: new Error('機能未実装'),
        timestamp: new Date()
      };
    }

    switch (name) {
      // ================== Phase 1: セキュリティ機能（9ツール）- 実装済み ==================

      // 暗号化・復号化ツール（4ツール）
      case 'encrypt_file': {
        const { filePath, password, algorithm, keyDerivation } = args;
        const options = algorithm || keyDerivation ? { algorithm, keyDerivation } : {};
        return await this.instances.encryption.encryptFile(filePath, password, options);
      }

      case 'decrypt_file': {
        const { encryptedFilePath, password, outputPath } = args;
        return await this.instances.encryption.decryptFile(encryptedFilePath, password, outputPath);
      }

      case 'encrypt_multiple_files': {
        const { filePaths, password, algorithm } = args;
        const options = algorithm ? { algorithm } : {};
        return await this.instances.encryption.encryptFiles(filePaths, password, options);
      }

      case 'decrypt_multiple_files': {
        const { encryptedFilePaths, password } = args;
        return await this.instances.encryption.decryptFiles(encryptedFilePaths, password);
      }

      // 整合性検証ツール（5ツール）
      case 'generate_file_checksum': {
        const { filePath, algorithm } = args;
        return await this.instances.integrity.generateFileChecksum(filePath, algorithm);
      }

      case 'verify_file_integrity': {
        const { filePath, expectedChecksum, algorithm } = args;
        return await this.instances.integrity.verifyFileIntegrity(filePath, expectedChecksum, algorithm);
      }

      case 'generate_multiple_checksums': {
        const { filePaths, algorithm } = args;
        return await this.instances.integrity.generateMultipleChecksums(filePaths, algorithm);
      }

      case 'save_checksum_file': {
        const { filePaths, outputPath, algorithm } = args;
        const checksumResult = await this.instances.integrity.generateMultipleChecksums(filePaths, algorithm);
        if (!checksumResult.success || !checksumResult.data) {
          return checksumResult;
        }
        return await this.instances.integrity.saveChecksumFile(checksumResult.data, outputPath);
      }

      case 'verify_directory_integrity': {
        const { directoryPath, checksumFilePath } = args;
        return await this.instances.integrity.verifyDirectoryIntegrity(directoryPath, checksumFilePath);
      }

      // ================== Phase 3: 高度機能（21ツール）- 実装済み ==================

      // ファイルバージョン管理システム（6ツール）
      case 'initialize_repository': {
        const { basePath, repositoryPath, maxVersions, autoSnapshot } = args;
        const options = { maxVersions, autoSnapshot };
        return await this.instances.versionManager.initializeRepository(basePath, repositoryPath, options);
      }

      case 'create_file_version': {
        const { filePath, repositoryPath, comment, author } = args;
        return await this.instances.versionManager.createFileVersion(filePath, repositoryPath, comment, author);
      }

      case 'create_snapshot': {
        const { basePath, repositoryPath, name, description, author } = args;
        return await this.instances.versionManager.createSnapshot(basePath, repositoryPath, name, description, author);
      }

      case 'restore_file_version': {
        const { filePath, repositoryPath, versionId } = args;
        return await this.instances.versionManager.restoreFileVersion(filePath, repositoryPath, versionId);
      }

      case 'compare_versions': {
        const { repositoryPath, versionId1, versionId2 } = args;
        return await this.instances.versionManager.compareVersions(repositoryPath, versionId1, versionId2);
      }

      case 'get_version_history': {
        const { filePath, repositoryPath } = args;
        return await this.instances.versionManager.getVersionHistory(filePath, repositoryPath);
      }

      // インテリジェント分類システム（5ツール）
      case 'classify_files': {
        const { searchPaths, useAI } = args;
        return await this.instances.classifier.classifyFiles(searchPaths, useAI);
      }

      case 'create_classification_rule': {
        const { name, description, conditions, actions, priority } = args;
        const rule = { name, description, conditions, actions, enabled: true, priority };
        return await this.instances.classifier.createClassificationRule(rule);
      }

      case 'create_smart_folder': {
        const { name, query, autoUpdate } = args;
        return await this.instances.classifier.createSmartFolder(name, query, autoUpdate);
      }

      case 'manage_categories': {
        const { action, category } = args;
        return await this.instances.classifier.manageCategories(action, category);
      }

      case 'generate_classification_report': {
        const { searchPaths, outputPath } = args;
        return await this.instances.classifier.generateClassificationReport(searchPaths, outputPath);
      }

      // 高度ファイル検索システム（6ツール）
      case 'create_search_index': {
        const { basePath, indexPath, indexContent, maxFileSize } = args;
        const config = { indexContent, maxFileSize };
        return await this.instances.searchEngine.createSearchIndex(basePath, indexPath, config);
      }

      case 'perform_advanced_search': {
        const { query, searchPaths } = args;
        return await this.instances.searchEngine.performAdvancedSearch(query, searchPaths);
      }

      case 'create_saved_search': {
        const { name, description, query } = args;
        return await this.instances.searchEngine.createSavedSearch(name, description, query);
      }

      case 'perform_fuzzy_search': {
        const { searchTerm, searchPaths, threshold } = args;
        return await this.instances.searchEngine.performFuzzySearch(searchTerm, searchPaths, threshold);
      }

      case 'perform_content_search': {
        const { searchTerm, searchPaths, caseSensitive } = args;
        return await this.instances.searchEngine.performContentSearch(searchTerm, searchPaths, caseSensitive);
      }

      case 'generate_search_report': {
        const { searchQueries, outputPath } = args;
        return await this.instances.searchEngine.generateSearchReport(searchQueries, outputPath);
      }

      // ファイルアクセス権限管理システム（6ツール）
      case 'set_file_permissions': {
        const { filePath, permissions, modifier } = args;
        return await this.instances.permissionManager.setFilePermissions(filePath, permissions, modifier);
      }

      case 'manage_directory_permissions': {
        const { directoryPath, permissions, recursive, modifier } = args;
        return await this.instances.permissionManager.manageDirectoryPermissions(directoryPath, permissions, recursive, modifier);
      }

      case 'check_access': {
        const { filePath, user, action, context } = args;
        return await this.instances.permissionManager.checkAccess(filePath, user, action, context);
      }

      case 'create_security_policy': {
        const { name, description, rules, scope } = args;
        return await this.instances.permissionManager.createSecurityPolicy(name, description, rules, scope);
      }

      case 'generate_audit_report': {
        const { startDate, endDate, outputPath } = args;
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return await this.instances.permissionManager.generateAuditReport(start, end, outputPath);
      }

      case 'generate_permission_report': {
        const { scope, outputPath } = args;
        return await this.instances.permissionManager.generatePermissionReport(scope, outputPath);
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `未知のツール: ${name}`
        );
    }
  }
} 