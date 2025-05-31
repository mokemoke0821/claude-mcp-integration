/**
 * デバッグユーティリティ
 * Deep Think Commander用のデバッグとログ機能を提供
 */

const fs = require('fs');
const path = require('path');

class DebugUtility {
  constructor(options = {}) {
    this.enabled = options.enabled || process.env.DEBUG && process.env.DEBUG.includes('deep-think:*');
    this.logDir = options.logDir || path.join(__dirname, '../logs');
    this.logLevel = options.logLevel || 'info';
    this.logToConsole = options.logToConsole !== undefined ? options.logToConsole : true;
    this.logToFile = options.logToFile !== undefined ? options.logToFile : true;
    
    // ログレベルの優先順位
    this.logLevels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    this.initLogDirectory();
  }
  
  initLogDirectory() {
    if (this.logToFile && !fs.existsSync(this.logDir)) {
      try {
        fs.mkdirSync(this.logDir, { recursive: true });
      } catch (err) {
        console.error(`ログディレクトリの作成に失敗しました: ${err.message}`);
        this.logToFile = false;
      }
    }
  }
  
  getLogFilePath() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    return path.join(this.logDir, `deep-think-${dateStr}.log`);
  }
  
  formatLogMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      if (typeof data === 'object') {
        try {
          logMessage += `\n${JSON.stringify(data, null, 2)}`;
        } catch (e) {
          logMessage += `\n[データのシリアライズに失敗: ${e.message}]`;
        }
      } else {
        logMessage += ` ${data}`;
      }
    }
    
    return logMessage;
  }
  
  shouldLog(level) {
    if (!this.enabled) return false;
    return this.logLevels[level] >= this.logLevels[this.logLevel];
  }
  
  writeToFile(message) {
    if (!this.logToFile) return;
    
    try {
      const logFilePath = this.getLogFilePath();
      fs.appendFileSync(logFilePath, message + '\n');
    } catch (err) {
      console.error(`ログファイルへの書き込みに失敗しました: ${err.message}`);
    }
  }
  
  log(level, message, data) {
    if (!this.shouldLog(level)) return;
    
    const formattedMessage = this.formatLogMessage(level, message, data);
    
    if (this.logToConsole) {
      if (level === 'error') {
        console.error(formattedMessage);
      } else if (level === 'warn') {
        console.warn(formattedMessage);
      } else {
        console.log(formattedMessage);
      }
    }
    
    this.writeToFile(formattedMessage);
  }
  
  debug(message, data) {
    this.log('debug', message, data);
  }
  
  info(message, data) {
    this.log('info', message, data);
  }
  
  warn(message, data) {
    this.log('warn', message, data);
  }
  
  error(message, data) {
    this.log('error', message, data);
  }
  
  // ツール実行のトレースを記録
  traceToolExecution(toolName, args, result, executionTime) {
    if (!this.shouldLog('debug')) return;
    
    this.debug(`ツール実行: ${toolName}`, {
      arguments: args,
      executionTimeMs: executionTime,
      result: result
    });
  }
  
  // パフォーマンスモニタリング
  startTimer(label) {
    if (!this.shouldLog('debug')) return null;
    
    const timerId = `${label}-${Date.now()}`;
    this.debug(`タイマー開始: ${label}`, { timerId });
    
    return {
      timerId,
      startTime: process.hrtime(),
      label
    };
  }
  
  endTimer(timer) {
    if (!timer || !this.shouldLog('debug')) return;
    
    const diff = process.hrtime(timer.startTime);
    const timeMs = (diff[0] * 1e9 + diff[1]) / 1e6;
    
    this.debug(`タイマー終了: ${timer.label}`, {
      timerId: timer.timerId,
      durationMs: timeMs.toFixed(3)
    });
    
    return timeMs;
  }
  
  // メモリ使用状況のログ
  logMemoryUsage(label = 'メモリ使用状況') {
    if (!this.shouldLog('debug')) return;
    
    const memoryUsage = process.memoryUsage();
    
    this.debug(label, {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
    });
  }
}

module.exports = new DebugUtility();
