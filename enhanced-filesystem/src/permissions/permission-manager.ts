/**
 * ファイルアクセス権限管理システム
 * Phase 3: 高度機能のセキュリティ・権限管理システム
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import {
  AccessAudit,
  FilePermission,
  OperationResult,
  Permission,
  PermissionReport,
  PermissionSummary,
  SecurityPolicy,
  SecurityRule,
  SecurityViolation
} from '../types/index.js';
import {
  createFailureResult,
  createSuccessResult,
  fileExists,
  getFilesRecursively
} from '../utils/file-helper.js';
import { logger } from '../utils/logger.js';

export class PermissionManager {
  private permissions = new Map<string, FilePermission>();
  private policies = new Map<string, SecurityPolicy>();
  private auditLog: AccessAudit[] = [];
  private violations: SecurityViolation[] = [];

  /**
   * ファイル権限を設定
   */
  async setFilePermissions(
    filePath: string,
    permissions: Permission[],
    modifier: string
  ): Promise<OperationResult<FilePermission>> {
    try {
      logger.info(`ファイル権限設定: ${filePath}`);

      if (!await fileExists(filePath)) {
        throw new Error(`ファイルが見つかりません: ${filePath}`);
      }

      // 現在の権限を取得または作成
      const currentPermission = this.permissions.get(filePath);

      const filePermission: FilePermission = {
        filePath,
        owner: currentPermission?.owner || modifier,
        group: currentPermission?.group,
        permissions,
        inherited: false,
        lastModified: new Date(),
        modifier
      };

      // 権限検証
      this.validatePermissions(permissions);

      this.permissions.set(filePath, filePermission);

      // 監査ログ記録
      await this.logAccess({
        id: this.generateAuditId(),
        filePath,
        user: modifier,
        action: 'set_permissions',
        timestamp: new Date(),
        success: true,
        details: { permissionCount: permissions.length }
      });

      logger.info(`ファイル権限設定完了: ${filePath}`);
      return createSuccessResult(`ファイル権限が設定されました: ${permissions.length}権限`, filePermission);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`ファイル権限設定エラー: ${filePath}`, { error });
      return createFailureResult(`ファイル権限設定に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * ディレクトリ権限を管理
   */
  async manageDirectoryPermissions(
    directoryPath: string,
    permissions: Permission[],
    recursive: boolean = false,
    modifier: string
  ): Promise<OperationResult<FilePermission[]>> {
    try {
      logger.info(`ディレクトリ権限管理: ${directoryPath}, 再帰: ${recursive}`);

      if (!await fileExists(directoryPath)) {
        throw new Error(`ディレクトリが見つかりません: ${directoryPath}`);
      }

      const results: FilePermission[] = [];

      if (recursive) {
        // 再帰的に全ファイルに権限適用
        const files = await getFilesRecursively(directoryPath, {
          includeHidden: false
        });

        for (const filePath of files) {
          try {
            const result = await this.setFilePermissions(filePath, permissions, modifier);
            if (result.success && result.data) {
              results.push(result.data);
            }
          } catch (error) {
            logger.warn(`ファイル権限設定スキップ: ${filePath}`, { error });
          }
        }
      } else {
        // ディレクトリ自体にのみ権限設定
        const result = await this.setFilePermissions(directoryPath, permissions, modifier);
        if (result.success && result.data) {
          results.push(result.data);
        }
      }

      logger.info(`ディレクトリ権限管理完了: ${results.length}ファイル`);
      return createSuccessResult(`${results.length}ファイルの権限が設定されました`, results);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`ディレクトリ権限管理エラー: ${directoryPath}`, { error });
      return createFailureResult(`ディレクトリ権限管理に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * アクセス権限をチェック
   */
  async checkAccess(
    filePath: string,
    user: string,
    action: 'read' | 'write' | 'execute' | 'delete',
    context?: Record<string, any>
  ): Promise<OperationResult<boolean>> {
    try {
      logger.info(`アクセス権限チェック: ${filePath}, ユーザー: ${user}, アクション: ${action}`);

      const permission = this.permissions.get(filePath);
      let hasAccess = false;

      if (permission) {
        // 明示的な権限チェック
        hasAccess = this.evaluatePermissions(permission, user, action, context);
      } else {
        // デフォルト権限（読み取りのみ許可）
        hasAccess = action === 'read';
      }

      // セキュリティポリシーチェック
      const policyResult = await this.checkSecurityPolicies(filePath, user, action, context);
      if (!policyResult) {
        hasAccess = false;
      }

      // 監査ログ記録
      await this.logAccess({
        id: this.generateAuditId(),
        filePath,
        user,
        action,
        timestamp: new Date(),
        success: hasAccess,
        ip: context?.ip,
        userAgent: context?.userAgent,
        details: context
      });

      // 違反検出
      if (!hasAccess) {
        await this.detectViolation(filePath, user, action, 'アクセス拒否');
      }

      const message = hasAccess ? 'アクセスが許可されました' : 'アクセスが拒否されました';
      return createSuccessResult(message, hasAccess);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`アクセス権限チェックエラー: ${filePath}`, { error });
      return createFailureResult(`アクセス権限チェックに失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * セキュリティポリシーを作成
   */
  async createSecurityPolicy(
    name: string,
    description: string,
    rules: SecurityRule[],
    scope: string[]
  ): Promise<OperationResult<SecurityPolicy>> {
    try {
      logger.info(`セキュリティポリシー作成: ${name}`);

      const policyId = this.generatePolicyId(name);

      if (this.policies.has(policyId)) {
        throw new Error(`同じ名前のポリシーが既に存在します: ${name}`);
      }

      const policy: SecurityPolicy = {
        id: policyId,
        name,
        description,
        rules,
        enabled: true,
        priority: 100,
        scope,
        created: new Date(),
        lastModified: new Date()
      };

      // ルール検証
      this.validateSecurityRules(rules);

      this.policies.set(policyId, policy);

      logger.info(`セキュリティポリシー作成完了: ${name}`);
      return createSuccessResult(`セキュリティポリシー「${name}」が作成されました`, policy);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`セキュリティポリシー作成エラー: ${name}`, { error });
      return createFailureResult(`セキュリティポリシー作成に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * アクセス監査レポート生成
   */
  async generateAuditReport(
    startDate?: Date,
    endDate?: Date,
    outputPath?: string
  ): Promise<OperationResult<string>> {
    try {
      logger.info(`アクセス監査レポート生成開始`);

      const filteredAudits = this.auditLog.filter(audit => {
        if (startDate && audit.timestamp < startDate) return false;
        if (endDate && audit.timestamp > endDate) return false;
        return true;
      });

      const report = this.createAuditReport(filteredAudits);
      const finalOutputPath = outputPath || join(process.cwd(), `audit_report_${Date.now()}.txt`);

      await fs.writeFile(finalOutputPath, report, 'utf-8');

      logger.info(`アクセス監査レポート生成完了: ${finalOutputPath}`);
      return createSuccessResult(`アクセス監査レポートが生成されました: ${finalOutputPath}`, finalOutputPath);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`アクセス監査レポート生成エラー`, { error });
      return createFailureResult(`アクセス監査レポート生成に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 権限レポート生成
   */
  async generatePermissionReport(
    scope: string[],
    outputPath?: string
  ): Promise<OperationResult<PermissionReport>> {
    try {
      logger.info(`権限レポート生成開始: ${scope.length}スコープ`);

      // スコープ内のファイル権限収集
      const scopePermissions: FilePermission[] = [];
      for (const [filePath, permission] of this.permissions) {
        if (scope.some(scopePath => filePath.startsWith(scopePath))) {
          scopePermissions.push(permission);
        }
      }

      // 統計計算
      const summary = this.calculatePermissionSummary(scopePermissions);

      // 違反検出
      const scopeViolations = this.violations.filter(violation =>
        scope.some(scopePath => violation.filePath.startsWith(scopePath))
      );

      // 推奨事項生成
      const recommendations = this.generateSecurityRecommendations(scopePermissions, scopeViolations);

      const report: PermissionReport = {
        generatedAt: new Date(),
        scope,
        totalFiles: scopePermissions.length,
        totalUsers: this.countUniqueUsers(scopePermissions),
        permissions: scopePermissions,
        violations: scopeViolations,
        recommendations,
        summary
      };

      // ファイル出力
      if (outputPath) {
        const reportText = this.createPermissionReportText(report);
        await fs.writeFile(outputPath, reportText, 'utf-8');
      }

      logger.info(`権限レポート生成完了: ${scopePermissions.length}権限`);
      return createSuccessResult(`権限レポートが生成されました`, report);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`権限レポート生成エラー`, { error });
      return createFailureResult(`権限レポート生成に失敗しました: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * 権限評価（内部用）
   */
  private evaluatePermissions(
    filePermission: FilePermission,
    user: string,
    action: 'read' | 'write' | 'execute' | 'delete',
    context?: Record<string, any>
  ): boolean {
    // オーナーチェック
    if (filePermission.owner === user) {
      return true;
    }

    // 明示的な権限チェック
    for (const permission of filePermission.permissions) {
      if (this.matchesSubject(permission, user) && permission.granted) {
        // アクション権限チェック
        const actionAllowed = permission.actions.some(act =>
          act.type === action && act.allowed
        );

        if (actionAllowed) {
          // 条件チェック
          if (this.evaluatePermissionConditions(permission, context)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * 主体マッチング（内部用）
   */
  private matchesSubject(permission: Permission, user: string): boolean {
    switch (permission.subjectType) {
      case 'user':
        return permission.subject === user;
      case 'group':
        // 実際の実装ではグループメンバーシップを確認
        return false;
      case 'role':
        // 実際の実装ではロールベースアクセス制御を確認
        return false;
      default:
        return false;
    }
  }

  /**
   * 権限条件評価（内部用）
   */
  private evaluatePermissionConditions(
    permission: Permission,
    context?: Record<string, any>
  ): boolean {
    if (!permission.conditions || permission.conditions.length === 0) {
      return true;
    }

    for (const condition of permission.conditions) {
      if (!this.evaluateCondition(condition, context)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 条件評価（内部用）
   */
  private evaluateCondition(condition: any, context?: Record<string, any>): boolean {
    if (!context) return false;

    switch (condition.type) {
      case 'time_range':
        // 時間範囲チェック
        const currentHour = new Date().getHours();
        const [startHour, endHour] = condition.value;
        return currentHour >= startHour && currentHour <= endHour;

      case 'ip_address':
        // IPアドレスチェック
        return context.ip === condition.value;

      case 'location':
        // 位置情報チェック（実装例）
        return context.location === condition.value;

      default:
        return true;
    }
  }

  /**
   * セキュリティポリシーチェック（内部用）
   */
  private async checkSecurityPolicies(
    filePath: string,
    user: string,
    action: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    for (const policy of this.policies.values()) {
      if (!policy.enabled) continue;

      // スコープチェック
      const inScope = policy.scope.some(scopePath => filePath.startsWith(scopePath));
      if (!inScope) continue;

      // ルール評価
      for (const rule of policy.rules) {
        const ruleApplies = this.evaluateSecurityRule(rule, filePath, user, action, context);

        if (ruleApplies) {
          const denyAction = rule.actions.find(act => act.type === 'deny');
          if (denyAction) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * セキュリティルール評価（内部用）
   */
  private evaluateSecurityRule(
    rule: SecurityRule,
    filePath: string,
    user: string,
    action: string,
    context?: Record<string, any>
  ): boolean {
    // 簡単な実装例
    for (const condition of rule.conditions) {
      // 条件に応じて評価ロジックを実装
      // 今回は基本的な例のみ
    }

    return false;
  }

  /**
   * 違反検出（内部用）
   */
  private async detectViolation(
    filePath: string,
    user: string,
    action: string,
    description: string
  ): Promise<void> {
    const violation: SecurityViolation = {
      id: this.generateViolationId(),
      type: 'access_denied',
      severity: 'medium',
      description,
      filePath,
      detected: new Date(),
      resolved: false,
      details: { user, action }
    };

    this.violations.push(violation);
    logger.warn(`セキュリティ違反検出: ${description}`, { violation });
  }

  /**
   * 監査ログ記録（内部用）
   */
  private async logAccess(audit: AccessAudit): Promise<void> {
    this.auditLog.push(audit);

    // ログサイズ制限（最新10000件のみ保持）
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-10000);
    }
  }

  /**
   * 権限検証（内部用）
   */
  private validatePermissions(permissions: Permission[]): void {
    for (const permission of permissions) {
      if (!permission.subject || !permission.subjectType || !permission.actions) {
        throw new Error('無効な権限定義です');
      }

      if (permission.actions.length === 0) {
        throw new Error('権限にはアクションが必要です');
      }
    }
  }

  /**
   * セキュリティルール検証（内部用）
   */
  private validateSecurityRules(rules: SecurityRule[]): void {
    for (const rule of rules) {
      if (!rule.name || !rule.type || !rule.conditions || !rule.actions) {
        throw new Error('無効なセキュリティルールです');
      }
    }
  }

  /**
   * 権限統計計算（内部用）
   */
  private calculatePermissionSummary(permissions: FilePermission[]): PermissionSummary {
    const summary: PermissionSummary = {
      totalPermissions: 0,
      bySubjectType: {},
      byAction: {},
      inheritedCount: 0,
      explicitCount: 0,
      expiredCount: 0,
      violationCount: this.violations.length
    };

    for (const filePermission of permissions) {
      summary.totalPermissions += filePermission.permissions.length;

      if (filePermission.inherited) {
        summary.inheritedCount++;
      } else {
        summary.explicitCount++;
      }

      for (const permission of filePermission.permissions) {
        // 主体タイプ別統計
        summary.bySubjectType[permission.subjectType] =
          (summary.bySubjectType[permission.subjectType] || 0) + 1;

        // アクション別統計
        for (const action of permission.actions) {
          summary.byAction[action.type] =
            (summary.byAction[action.type] || 0) + 1;
        }

        // 期限切れチェック
        if (permission.expiration && permission.expiration < new Date()) {
          summary.expiredCount++;
        }
      }
    }

    return summary;
  }

  /**
   * ユニークユーザー数計算（内部用）
   */
  private countUniqueUsers(permissions: FilePermission[]): number {
    const users = new Set<string>();

    for (const filePermission of permissions) {
      users.add(filePermission.owner);

      for (const permission of filePermission.permissions) {
        if (permission.subjectType === 'user') {
          users.add(permission.subject);
        }
      }
    }

    return users.size;
  }

  /**
   * セキュリティ推奨事項生成（内部用）
   */
  private generateSecurityRecommendations(
    permissions: FilePermission[],
    violations: SecurityViolation[]
  ): string[] {
    const recommendations: string[] = [];

    if (violations.length > 0) {
      recommendations.push(`⚠️ ${violations.length}件のセキュリティ違反が検出されています。確認と対応が必要です。`);
    }

    const expiredPermissions = permissions.filter(p =>
      p.permissions.some(perm => perm.expiration && perm.expiration < new Date())
    );

    if (expiredPermissions.length > 0) {
      recommendations.push(`🕒 ${expiredPermissions.length}件の期限切れ権限があります。更新または削除してください。`);
    }

    const overprivilegedFiles = permissions.filter(p =>
      p.permissions.some(perm => perm.actions.length > 3)
    );

    if (overprivilegedFiles.length > 0) {
      recommendations.push(`🔐 ${overprivilegedFiles.length}件のファイルで過剰な権限が設定されています。最小権限の原則を適用してください。`);
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ 重大なセキュリティ問題は検出されませんでした。');
    }

    return recommendations;
  }

  /**
   * 監査レポート作成（内部用）
   */
  private createAuditReport(audits: AccessAudit[]): string {
    const lines: string[] = [];

    lines.push('# アクセス監査レポート');
    lines.push(`生成日時: ${new Date().toLocaleString('ja-JP')}`);
    lines.push('');

    // サマリー
    const totalAccess = audits.length;
    const successfulAccess = audits.filter(a => a.success).length;
    const failedAccess = totalAccess - successfulAccess;

    lines.push('## サマリー');
    lines.push(`- 総アクセス数: ${totalAccess}`);
    lines.push(`- 成功: ${successfulAccess}件`);
    lines.push(`- 失敗: ${failedAccess}件`);
    lines.push(`- 成功率: ${totalAccess > 0 ? ((successfulAccess / totalAccess) * 100).toFixed(1) : 0}%`);
    lines.push('');

    // 最近のアクセス
    lines.push('## 最近のアクセス（最新20件）');
    audits.slice(-20).reverse().forEach((audit, index) => {
      const status = audit.success ? '✅' : '❌';
      lines.push(`${index + 1}. ${status} ${audit.action} - ${audit.filePath}`);
      lines.push(`   ユーザー: ${audit.user} | 時刻: ${audit.timestamp.toLocaleString('ja-JP')}`);
      if (audit.ip) {
        lines.push(`   IP: ${audit.ip}`);
      }
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * 権限レポートテキスト作成（内部用）
   */
  private createPermissionReportText(report: PermissionReport): string {
    const lines: string[] = [];

    lines.push('# ファイル権限レポート');
    lines.push(`生成日時: ${report.generatedAt.toLocaleString('ja-JP')}`);
    lines.push('');

    // サマリー
    lines.push('## サマリー');
    lines.push(`- 対象ファイル数: ${report.totalFiles}`);
    lines.push(`- ユーザー数: ${report.totalUsers}`);
    lines.push(`- 総権限数: ${report.summary.totalPermissions}`);
    lines.push(`- 違反数: ${report.summary.violationCount}`);
    lines.push('');

    // 推奨事項
    lines.push('## 推奨事項');
    report.recommendations.forEach((rec, index) => {
      lines.push(`${index + 1}. ${rec}`);
    });
    lines.push('');

    return lines.join('\n');
  }

  /**
   * ID生成（内部用）
   */
  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private generatePolicyId(name: string): string {
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
    return `policy_${safeName}_${Date.now()}`;
  }

  private generateViolationId(): string {
    return `violation_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
} 