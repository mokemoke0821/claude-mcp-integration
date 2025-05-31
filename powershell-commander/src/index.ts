#!/usr/bin/env node
// import { McpServer, ServerResult } from "@modelcontextprotocol/sdk"; // SDK依存を削除
import { ChildProcess, exec, spawn } from "child_process"; // ExecOptionsを追加
import { randomUUID } from "crypto";
import * as iconv from "iconv-lite";
import * as path from "path";
import * as util from "util";
import {
  BackgroundJobInfo,
  ExtendedExecOptions,
  JobHistoryInfo,
  PipelineExecutionInfo,
  ProcessData,
  ProcessDataHandler,
  ProcessResultWithError,
  ScheduledJobInfo,
  ScriptExecutionInfo
} from "./types";

const execPromise = util.promisify(exec);

const config = {
  encoding: process.env.POWERSHELL_ENCODING || 'utf8',
  fallbackEncoding: process.env.POWERSHELL_FALLBACK_ENCODING || 'shiftjis',
  jobSchedulerInterval: parseInt(process.env.JOB_SCHEDULER_INTERVAL || '60000', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
  commandTimeout: parseInt(process.env.COMMAND_TIMEOUT || '300000', 10)
};

// エラーメッセージを格納するクラス
class ErrorWithDetails extends Error {
  code: string | null = null;
  stderr: string | null = null;
  suggestion: string | null = null;

  constructor(message: string) {
    super(message);
  }
}

// --- クラス定義 (McpServerを継承しない) --- 
class PowerShellCommanderServer { // extends McpServer を削除
  private activeProcesses: Map<string, ChildProcess> = new Map();
  private scriptExecutions: Map<string, ScriptExecutionInfo> = new Map();
  private pipelineExecutions: Map<string, PipelineExecutionInfo> = new Map();
  private backgroundJobs: Map<string, BackgroundJobInfo> = new Map();
  private scheduledJobs: Map<string, ScheduledJobInfo> = new Map();
  private jobHistory: Map<string, JobHistoryInfo[]> = new Map();
  private lastProcessId: number = 0;

  constructor() {
    // super({ tools: {} as any }); // super()呼び出しを削除
    console.error("[DEBUG] PowerShellCommanderServer constructor starting");

    // ツールハンドラーはMCPとして公開しないので、定義は不要だが、メソッドは残す
    // const tools = { ... };

    try {
      // this.startJobScheduler(); // スケジューラーは一旦無効化
      console.error("[DEBUG] PowerShellCommanderServer constructor finished successfully");
    } catch (error) {
      console.error("[DEBUG] Error during PowerShellCommanderServer constructor:", error);
      throw error;
    }
  }

  // --- ヘルパーメソッド --- 

  private async executePowerShell(command: string, options: ExtendedExecOptions): Promise<string> {
    try {
      console.error(`[DEBUG] Executing PowerShell: ${command} with options:`, options);
      const encodingOption: BufferEncoding | undefined = options.encoding as BufferEncoding | undefined;
      const { stdout, stderr } = await execPromise(command, {
        encoding: encodingOption,
        cwd: options.cwd,
        timeout: config.commandTimeout,
        shell: 'powershell.exe'
      });
      if (stderr) {
        console.error(`[DEBUG] PowerShell stderr: ${stderr}`);
      }
      console.error(`[DEBUG] PowerShell stdout: ${stdout}`);
      // stdout が Buffer の場合の toString を修正
      return typeof stdout === 'string' ? stdout : Buffer.from(stdout).toString(options.encoding || config.encoding);
    } catch (error: any) {
      console.error(`[DEBUG] PowerShell execution failed:`, error);
      throw new Error(`PowerShell execution failed: ${error.message || 'Unknown error'}. Stderr: ${error.stderr}`);
    }
  }

  private async handleExecutePowerShellInteractive(
    command: string,
    options: ExtendedExecOptions
  ): Promise<ProcessResultWithError> { // 型は types.ts で定義
    return new Promise<ProcessResultWithError>((resolve) => {
      const process = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
        cwd: options.cwd,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      let output = '';
      let error = '';
      let errorMessage: string | undefined;
      const handleData = (data: ProcessData): string => {
        return Buffer.isBuffer(data) ? iconv.decode(data, options.encoding || config.encoding) : String(data);
      };
      if (process.stdout) { process.stdout.on('data', (data) => { output += handleData(data); }); }
      if (process.stderr) { process.stderr.on('data', (data) => { error += handleData(data); }); }
      process.on('close', (code) => { resolve({ output, error, code: code ?? -1, errorMessage }); }); // codeがnullの場合のデフォルト値
      process.on('error', (err) => { errorMessage = err.message; resolve({ output, error, code: -1, errorMessage }); }); // codeを-1に
    });
  }

  // ServerResult の代わりにシンプルなオブジェクトまたは any を返すようにする
  private createErrorResult(message: string): { success: boolean; isError: boolean; content: any[] } {
    console.error(`[ERROR] ${message}`);
    return {
      success: false,
      isError: true,
      content: [{ type: 'error', text: message }]
    };
  }

  private startBackgroundJobInternal(
    command: string,
    options: ExtendedExecOptions,
    onData: ProcessDataHandler // types.tsで修正済み
  ): ChildProcess {
    console.error(`[DEBUG] Spawning background job: ...`);
    const process = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
      cwd: options.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: true
    });
    process.unref();
    const handleData = (data: ProcessData): string => {
      return Buffer.isBuffer(data) ? iconv.decode(data, options.encoding || config.encoding) : String(data);
    };
    // onData の呼び出しを修正 (type を渡す)
    if (process.stdout) { process.stdout.on('data', (data) => onData(handleData(data), 'stdout')); }
    if (process.stderr) { process.stderr.on('data', (data) => onData(handleData(data), 'stderr')); }
    return process;
  }

  // --- ツールハンドラー実装 (MCPとしては使わないがメソッドは残す) --- 

  // McpRequest, ServerResult を any や独自型に置き換え
  public async handleExecutePowerShellCommand(
    request: any // McpRequest<{ command: string; ... }>
  ): Promise<any> { // ServerResult
    const args = request.params;
    if (!args?.command) return this.createErrorResult('Missing command');
    const options: ExtendedExecOptions = {
      cwd: args.cwd,
      encoding: args.encoding as BufferEncoding | undefined
    };
    try {
      const result = await this.handleExecutePowerShellInteractive(args.command, options);
      if (result.code === 0) {
        return { success: true, content: [{ type: 'text', text: result.output }] };
      } else {
        return this.createErrorResult(result.errorMessage || result.error || `Process exited with code ${result.code}`);
      }
    } catch (error: any) {
      return this.createErrorResult(error.message);
    }
  }

  public async handleExecuteScriptFile(request: any): Promise<any> {
    const args = request.params;
    if (!args?.scriptPath) return this.createErrorResult('Missing scriptPath');

    const scriptPath = path.resolve(args.cwd || process.cwd(), args.scriptPath);
    if (!fs.existsSync(scriptPath)) {
      return this.createErrorResult(`Script file not found: ${scriptPath}`);
    }

    let command = `& '${scriptPath}'`;
    if (args.parameters) {
      for (const [key, value] of Object.entries(args.parameters)) {
        const paramValue = typeof value === 'string' ? `\'${value.replace(/'/g, "''")}\'` : value;
        command += ` -${key} ${paramValue}`;
      }
    }
    const options: ExtendedExecOptions = { cwd: args.cwd, encoding: args.encoding as BufferEncoding | undefined };
    const executionId = randomUUID(); // createErrorResultより前に移動
    const executionInfo: ScriptExecutionInfo = {
      id: executionId, scriptPath: args.scriptPath, parameters: args.parameters, status: 'running',
      startTime: new Date(), endTime: new Date(), output: '', error: ''
    };
    this.scriptExecutions.set(executionId, executionInfo);

    try {
      const output = await this.executePowerShell(command, options);
      executionInfo.status = 'completed'; executionInfo.endTime = new Date(); executionInfo.output = output;
      this.scriptExecutions.set(executionId, executionInfo);
      return { success: true, content: [{ type: 'text', text: `Execution ID: ${executionId}\nOutput:\n${output}` }] };
    } catch (error: any) {
      executionInfo.status = 'failed'; executionInfo.endTime = new Date(); executionInfo.error = error.message;
      this.scriptExecutions.set(executionId, executionInfo);
      // executionId はここで利用可能
      return this.createErrorResult(`Script execution failed (ID: ${executionId}): ${error.message}`);
    }
  }

  public async handleGetScriptExecutionStatus(
    request: any // McpRequest<{ executionId: string }>
  ): Promise<any> { // ServerResult
    const args = request.params;
    if (!args?.executionId) return this.createErrorResult('Missing executionId');
    const executionInfo = this.scriptExecutions.get(args.executionId);
    if (!executionInfo) {
      return this.createErrorResult(`Script execution with ID ${args.executionId} not found.`);
    }
    return { success: true, content: [{ type: 'json', data: executionInfo }] };
  }

  public async handleExecutePipeline(request: any): Promise<any> {
    return this.createErrorResult('execute_pipeline not implemented yet.');
  }

  public async handleStartBackgroundJob(
    request: any
  ): Promise<any> {
    const args = request.params;
    if (!args?.command) return this.createErrorResult('Missing command');
    const jobId = randomUUID();
    const jobName = args.name || `job-${jobId.substring(0, 8)}`;
    const options: ExtendedExecOptions = { cwd: args.cwd, encoding: args.encoding as BufferEncoding | undefined };
    // BackgroundJobInfo の型に合わせて初期化
    const jobInfo: BackgroundJobInfo = {
      id: jobId,
      name: jobName,
      command: args.command,
      status: 'starting', // status の型に 'starting' を追加 (types.tsで対応済み)
      startTime: new Date().toISOString(),
      endTime: '',
      output: [], // output は BackgroundJobOutput[] (types.tsで対応済み)
      error: '',
      pid: undefined // pid は number | undefined (types.tsで対応済み)
    };
    this.backgroundJobs.set(jobId, jobInfo);
    try {
      const process = this.startBackgroundJobInternal(args.command, options, (data, type) => { // typeを受け取る
        const currentJobInfo = this.backgroundJobs.get(jobId);
        if (currentJobInfo) {
          // output 配列にオブジェクトを追加
          currentJobInfo.output.push({ timestamp: new Date().toISOString(), type: type, text: data });
          this.backgroundJobs.set(jobId, currentJobInfo);
        }
      });
      // pid の代入を修正
      jobInfo.pid = process.pid;
      jobInfo.status = 'running';
      this.backgroundJobs.set(jobId, jobInfo);

      process.on('close', (code) => {
        const currentJobInfo = this.backgroundJobs.get(jobId);
        if (currentJobInfo) {
          currentJobInfo.status = code === 0 ? 'completed' : 'failed';
          currentJobInfo.endTime = new Date().toISOString();
          if (code !== 0) {
            currentJobInfo.error = `Process exited with code ${code}`;
          }
          this.backgroundJobs.set(jobId, currentJobInfo);
        }
      });
      process.on('error', (err) => {
        const currentJobInfo = this.backgroundJobs.get(jobId);
        if (currentJobInfo) {
          currentJobInfo.status = 'failed';
          currentJobInfo.endTime = new Date().toISOString();
          currentJobInfo.error = err.message;
          this.backgroundJobs.set(jobId, currentJobInfo);
        }
      });
      return { success: true, content: [{ type: 'text', text: `Background job started. ID: ${jobId}, PID: ${jobInfo.pid}` }] };
    } catch (error: any) {
      jobInfo.status = 'failed';
      jobInfo.endTime = new Date().toISOString(); // endTime は string
      jobInfo.error = error.message;
      this.backgroundJobs.set(jobId, jobInfo);
      return this.createErrorResult(`Failed to start background job: ${error.message}`);
    }
  }

  public async handleGetBackgroundJobStatus(request: any): Promise<any> {
    const args = request.params;
    if (!args?.jobId) return this.createErrorResult('Missing jobId');
    const jobInfo = this.backgroundJobs.get(args.jobId);
    if (!jobInfo) {
      return this.createErrorResult(`Background job with ID ${args.jobId} not found.`);
    }
    return { success: true, content: [{ type: 'json', data: jobInfo }] };
  }

  public async handleStopBackgroundJob(request: any): Promise<any> {
    const args = request.params;
    if (!args?.jobId) return this.createErrorResult('Missing jobId');
    const jobInfo = this.backgroundJobs.get(args.jobId);
    if (!jobInfo) {
      return this.createErrorResult(`Background job with ID ${args.jobId} not found.`);
    }
    if (jobInfo.status !== 'running' || jobInfo.pid === undefined || jobInfo.pid === -1) {
      return this.createErrorResult(`Background job ${args.jobId} is not running or has no valid PID.`);
    }
    try {
      await execPromise(`taskkill /PID ${jobInfo.pid} /T /F`);
      jobInfo.status = 'stopped'; jobInfo.endTime = new Date().toISOString();
      this.backgroundJobs.set(args.jobId, jobInfo);
      return { success: true, content: [{ type: 'text', text: `Background job ${args.jobId} stopped.` }] };
    } catch (error: any) {
      jobInfo.status = 'stop_failed'; jobInfo.error = `Failed to stop process: ${error.message}`;
      this.backgroundJobs.set(args.jobId, jobInfo);
      return this.createErrorResult(`Failed to stop background job ${args.jobId}: ${error.message}`);
    }
  }

  // --- ジョブスケジューラーメソッド (無効化中) ---
  private startJobScheduler(): void { /* ... */ }
  private async executeScheduledJob(jobId: string): Promise<void> {
    const job = this.scheduledJobs.get(jobId);
    if (!job) return;
    // ... (実装)
    this.calculateNextRun(job);
  }
  private calculateNextRun(job: ScheduledJobInfo): void { /* ... */ }

}

// --- サーバーインスタンス化 (MCPとしては起動しない) --- 
try {
  console.error("[DEBUG] Instantiating PowerShellCommanderServer...");
  const serverInstance = new PowerShellCommanderServer();
  console.error("[DEBUG] Instance created. (Not running as MCP server)");
  // serverInstance.runStdio(); // 削除

  // 必要であれば、ここで直接メソッドを呼び出してテスト可能
  // serverInstance.handleExecutePowerShellCommand({ params: { command: 'Get-Process' } }).then(console.log);

} catch (error) {
  console.error("[FATAL] Failed to create instance:", error);
  process.exit(1);
}
