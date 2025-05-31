// MCPのSDKの型定義を利用します
// このファイルは空にしておき、SDKの型定義を利用します

import { ExecOptions as ChildProcessExecOptions } from "child_process";

// サーバー結果の基本型
export interface BaseServerResult {
  success: boolean;
  message?: string;
}

// サーバー結果の型
export interface ServerResult extends BaseServerResult {
  content?: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

// SDKの ServerResult の代替 (必要最低限)
export interface SimpleServerResult {
  success: boolean;
  isError?: boolean;
  content?: { type: string; text?: string; data?: any }[];
}

// SDKの McpRequest の代替 (プレースホルダー)
export interface McpRequest<T = any> {
  params: T;
  // 他に必要なプロパティがあれば追加
}

// スクリプト実行の状態を管理するインターフェース
export interface ScriptExecutionInfo {
  id: string;
  scriptPath: string;
  parameters?: Record<string, any>;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime: Date;
  output: string;
  error: string;
}

// パイプライン実行の状態を管理するインターフェース
export interface PipelineExecutionInfo {
  id: string;
  commands: string[];
  status: 'running' | 'completed' | 'failed' | 'stopped';
  startTime: Date;
  endTime: Date;
  output: { step: number; command: string; output: string; error?: string }[];
  error: string;
  currentStep: number;
  totalSteps: number;
}

// バックグラウンドジョブの状態を管理するインターフェース
export interface BackgroundJobInfo {
  id: string;
  name: string;
  command: string;
  status: 'starting' | 'running' | 'completed' | 'failed' | 'stopped' | 'stop_failed' | 'unknown';
  startTime: string;
  endTime: string;
  output: BackgroundJobOutput[];
  error: string;
  pid: number | undefined;
}

// システム情報のインターフェース
export interface SystemInfo {
  os: {
    platform: string;
    release: string;
    version: string;
    arch: string;
  };
  cpu: {
    model: string;
    cores: number;
    speed: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
  };
  disk: {
    total: number;
    free: number;
    used: number;
  };
  network: {
    interfaces: Array<{
      name: string;
      address: string;
      netmask: string;
      family: string;
    }>;
  };
}

// プロセス情報のインターフェース
export interface ProcessInfo {
  pid: number;
  command: string;
  startTime: Date;
}

// ファイルシステムの結果を管理するインターフェース
export interface FileSystemResult {
  success: boolean;
  message: string;
  path: string;
  size?: number;
  modified?: string;
  created?: string;
}

// ネットワーク接続情報のインターフェース
export interface NetworkConnection {
  protocol: string;
  localAddress: string;
  localPort: number;
  remoteAddress: string;
  remotePort: number;
  state: string;
  pid: number;
}

// システムログのインターフェース
export interface SystemLog {
  timestamp: string;
  level: string;
  source: string;
  message: string;
  eventId?: number;
}

// 拡張された実行オプションのインターフェース
export interface ExtendedExecOptions extends ChildProcessExecOptions {
  encoding?: BufferEncoding;
}

// リモートセッション情報を管理するインターフェース
export interface RemoteSessionInfo {
  id: string;
  computerName: string;
  userName: string;
  state: string;
  lastActivity: string;
  sessionId: number;
}

// 認証情報を管理するインターフェース
export interface CredentialInfo {
  id: string;
  userName: string;
  secureString: string;
  lastUsed: string;
}

// ジョブ履歴情報を管理するインターフェース
export interface JobHistoryInfo {
  id: string;
  name: string;
  command: string;
  status: 'completed' | 'failed';
  startTime: string;
  endTime: string;
  output: string;
  error: string;
}

// スケジュールされたジョブ情報を管理するインターフェース
export interface ScheduledJobInfo {
  id: string;
  name: string;
  command: string;
  enabled: boolean;
  cwd?: string;
  schedule: {
    type: 'once' | 'daily' | 'weekly' | 'monthly';
    startTime: Date;
    interval?: number;
    daysOfWeek?: number[];
    daysOfMonth?: number[];
  };
  lastRun?: JobHistoryInfo;
  nextRun: string;
  status: string;
}

// イベントログモニターを管理するインターフェース
export interface EventLogMonitor {
  id: string;
  logName: string;
  filter: string;
  isRunning: boolean;
}

// カスタムログソースを管理するインターフェース
export interface CustomLogSource {
  id: string;
  name: string;
  path: string;
  format: string;
}

// パイプラインステップを管理するインターフェース
export interface PipelineStep {
  id: string;
  name: string;
  type: 'input' | 'transform' | 'filter' | 'output';
  command: string;
  parameters?: Record<string, any>;
  errorHandling?: {
    retryCount: number;
    retryInterval: number;
    onError: 'stop' | 'continue' | 'custom';
    customAction?: string;
  };
}

// パイプライン定義を管理するインターフェース
export interface PipelineDefinition {
  id: string;
  name: string;
  steps: PipelineStep[];
  variables?: Record<string, any>;
}

// DSC設定を管理するインターフェース
export interface DscConfiguration {
  id: string;
  name: string;
  content: string;
  status: string;
  lastApplied: string;
}

// インタラクティブセッション情報を管理するインターフェース
export interface InteractiveSessionInfo {
  id: string;
  state: string;
  lastActivity: string;
}

// PowerShellプロファイルを管理するインターフェース
export interface PowerShellProfile {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

export interface ScriptAnalysisResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  parameters: ScriptParameter[];
}

export interface ScriptParameter {
  name: string;
  type: string;
  isMandatory: boolean;
  defaultValue?: any;
}

export interface ScriptParameterValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// プロセスの出力データ型
export type ProcessData = string | Buffer;

// プロセスの出力ハンドラー型
export type ProcessDataType = 'stdout' | 'stderr';
export type ProcessDataHandler = (data: string, type: ProcessDataType) => void;

// プロセスの戻り値型
export interface ProcessResult {
  output: string;
  error: string;
  code: number | null;
}

// プロセスの戻り値型（エラーを含む）
export interface ProcessResultWithError {
  output: string;
  error: string;
  code: number | null;
  errorMessage?: string;
}

// プロセスのイベントハンドラー型
export interface ProcessEventHandlers {
  onData?: (data: ProcessData) => void;
  onError?: (error: Error) => void;
  onClose?: (code: number | null) => void;
}

export interface BackgroundJobOutput {
  timestamp: string;
  type: 'stdout' | 'stderr';
  text: string;
}
