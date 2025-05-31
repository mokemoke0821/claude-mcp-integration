/**
 * 強化ファイルシステムツール用ログシステム
 */

import { LogLevel } from '../types/index.js';

export class Logger {
  private static instance: Logger;
  private logs: LogLevel[] = [];
  private maxLogs = 1000;

  private constructor() { }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel['level'], message: string, context?: Record<string, any>): void {
    const logEntry: LogLevel = {
      level,
      message,
      timestamp: new Date(),
      context
    };

    this.logs.push(logEntry);

    // ログの上限管理
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // コンソール出力
    const timestamp = logEntry.timestamp.toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';

    switch (level) {
      case 'debug':
        console.debug(`[DEBUG ${timestamp}] ${message}${contextStr}`);
        break;
      case 'info':
        console.info(`[INFO ${timestamp}] ${message}${contextStr}`);
        break;
      case 'warn':
        console.warn(`[WARN ${timestamp}] ${message}${contextStr}`);
        break;
      case 'error':
        console.error(`[ERROR ${timestamp}] ${message}${contextStr}`);
        break;
    }
  }

  public debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  public info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  public error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  public getLogs(level?: LogLevel['level']): LogLevel[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public setMaxLogs(max: number): void {
    this.maxLogs = max;
    if (this.logs.length > max) {
      this.logs = this.logs.slice(-max);
    }
  }
}

// シングルトンインスタンスをエクスポート
export const logger = Logger.getInstance(); 