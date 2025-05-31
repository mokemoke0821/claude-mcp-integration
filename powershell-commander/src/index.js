#!/usr/bin/env node
// CommonJS形式で記述
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } = require('@modelcontextprotocol/sdk/types.js');
const { exec } = require('child_process');
const util = require('util');
const iconv = require('iconv-lite');
const execPromise = util.promisify(exec);

// PowerShellコマンダーサーバー
class PowerShellCommanderServer {
  constructor() {
    this.server = new Server(
      {
        name: 'powershell-commander-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // エラーハンドリング
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'execute_powershell',
          description: 'PowerShellコマンドを実行します',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: '実行するPowerShellコマンド',
              },
              workingDirectory: {
                type: 'string',
                description: 'コマンドを実行するディレクトリ',
              },
              encoding: {
                type: 'string',
                description: '出力のエンコーディング（デフォルトはshift_jis）',
                enum: ['utf8', 'shift_jis', 'utf16le', 'latin1']
              }
            },
            required: ['command'],
          },
        },
        {
          name: 'get_psdrive',
          description: 'PowerShellのGet-PSDriveコマンドレットを実行してドライブ情報を取得します',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: '取得するドライブ名（省略時は全て取得）',
              }
            },
            required: [],
          },
        },
        {
          name: 'get_childitem',
          description: 'PowerShellのGet-ChildItemコマンドレットを実行してファイル/フォルダ一覧を取得します',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: '一覧取得するパス',
              },
              filter: {
                type: 'string',
                description: 'フィルター（*.txt など）',
              },
              recurse: {
                type: 'boolean',
                description: '再帰的に取得するかどうか',
              }
            },
            required: ['path'],
          },
        },
        {
          name: 'find_file',
          description: 'ファイルやディレクトリを検索します',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: '検索する開始パス',
              },
              pattern: {
                type: 'string',
                description: '検索パターン（ワイルドカードまたは正規表現）',
              },
              useRegex: {
                type: 'boolean',
                description: '正規表現を使用するかどうか',
              }
            },
            required: ['path', 'pattern'],
          },
        },
        {
          name: 'analyze_command_error',
          description: 'コマンド実行時のエラーを分析し、解決策を提案します',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: '実行したコマンド',
              },
              errorMessage: {
                type: 'string',
                description: 'エラーメッセージ',
              }
            },
            required: ['command', 'errorMessage'],
          },
        }
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'execute_powershell':
            return await this.handleExecutePowerShell(request.params.arguments);
          case 'get_psdrive':
            return await this.handleGetPSDrive(request.params.arguments);
          case 'get_childitem':
            return await this.handleGetChildItem(request.params.arguments);
          case 'find_file':
            return await this.handleFindFile(request.params.arguments);
          case 'analyze_command_error':
            return await this.handleAnalyzeCommandError(request.params.arguments);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `未知のツール: ${request.params.name}`
            );
        }
      } catch (error) {
        console.error(`ツール ${request.params.name} の実行中にエラーが発生:`, error);
        
        let errorMessage = `エラーが発生しました: ${error.message || String(error)}`;
        
        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async handleExecutePowerShell(args) {
    const { command, workingDirectory, encoding = 'shift_jis' } = args;
    
    if (!command) {
      throw new Error('コマンドが指定されていません');
    }

    try {
      // PowerShellを実行するコマンド
      const psCommand = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${command.replace(/"/g, '\\"')}"`;
      
      const options = {};
      if (workingDirectory) {
        options.cwd = workingDirectory;
      }
      options.encoding = 'buffer';
      
      const { stdout: rawStdout, stderr: rawStderr } = await execPromise(psCommand, options);
      
      // エンコーディング変換
      const stdout = iconv.decode(rawStdout, encoding);
      const stderr = iconv.decode(rawStderr, encoding);
      
      return {
        content: [
          {
            type: 'text',
            text: `${stdout}${stderr ? `\n\nエラー出力:\n${stderr}` : ''}`,
          },
        ],
      };
    } catch (error) {
      // エンコーディング変換
      const stderr = error.stderr ? iconv.decode(error.stderr, encoding) : '';
      throw new Error(`PowerShellコマンド実行エラー: ${stderr || error.message}`);
    }
  }

  async handleGetPSDrive(args) {
    const { name } = args;
    
    let command = 'Get-PSDrive';
    if (name) {
      command += ` -Name ${name}`;
    }
    command += ' | Format-Table -AutoSize | Out-String -Width 4096';
    
    return this.handleExecutePowerShell({ command });
  }

  async handleGetChildItem(args) {
    const { path, filter, recurse } = args;
    
    if (!path) {
      throw new Error('パスが指定されていません');
    }

    let command = `Get-ChildItem -Path "${path}"`;
    
    if (filter) {
      command += ` -Filter "${filter}"`;
    }
    
    if (recurse) {
      command += ' -Recurse';
    }
    
    command += ' | Format-Table -Property Mode, LastWriteTime, Length, Name -AutoSize | Out-String -Width 4096';
    
    return this.handleExecutePowerShell({ command });
  }

  async handleFindFile(args) {
    const { path, pattern, useRegex = false } = args;
    
    if (!path || !pattern) {
      throw new Error('パスとパターンの両方を指定してください');
    }

    let command = `Get-ChildItem -Path "${path}" -Recurse`;
    
    if (useRegex) {
      command += ` | Where-Object { $_.FullName -match "${pattern.replace(/"/g, '`"')}" }`;
    } else {
      command += ` | Where-Object { $_.FullName -like "*${pattern.replace(/"/g, '`"')}*" }`;
    }
    
    command += ' | Format-Table -Property FullName, Length, LastWriteTime -AutoSize | Out-String -Width 4096';
    
    return this.handleExecutePowerShell({ command });
  }

  async handleAnalyzeCommandError(args) {
    const { command, errorMessage } = args;
    
    if (!command || !errorMessage) {
      throw new Error('コマンドとエラーメッセージの両方を指定してください');
    }

    // エラー分析ロジック
    let analysis = `コマンド '${command}' のエラー分析:\n\n`;
    analysis += `エラーメッセージ:\n${errorMessage}\n\n`;
    analysis += '考えられる原因と解決策:\n\n';
    
    // コマンドレット名のミスを検出
    if (errorMessage.includes('認識されていない名前として扱われています') || 
        errorMessage.includes('is not recognized as the name of a cmdlet')) {
      analysis += '- コマンドレット名が間違っている可能性があります。正確なコマンドレット名とスペルを確認してください。\n';
      analysis += '- PowerShellモジュールがインストールされていない可能性があります。必要なモジュールをインストールしてください。\n';
    }
    
    // パラメータの問題を検出
    if (errorMessage.includes('パラメーターを処理できません') || 
        errorMessage.includes('Cannot process parameter')) {
      analysis += '- パラメータの使用方法が正しくありません。コマンドレットのヘルプを確認してください。\n';
      analysis += '  例: Get-Help [コマンドレット名] -Detailed\n';
    }
    
    // パスの問題を検出
    if (errorMessage.includes('見つかりません') || 
        errorMessage.includes('cannot find path') || 
        errorMessage.includes('パスが存在しないため')) {
      analysis += '- 指定されたパスが存在しません。パスが正しいか、アクセス権があるかを確認してください。\n';
      analysis += '- 相対パスを使用している場合は絶対パスを試してください。\n';
    }
    
    // 権限の問題を検出
    if (errorMessage.includes('アクセスが拒否されました') || 
        errorMessage.includes('Access is denied') || 
        errorMessage.includes('権限がありません')) {
      analysis += '- ファイルまたはリソースへのアクセス権がありません。\n';
      analysis += '- 管理者権限で実行するか、必要な権限を取得してください。\n';
    }
    
    // その他の一般的なエラーに対する推奨事項
    analysis += '\n一般的な対策:\n';
    analysis += '- コマンドのシンタックスエラーの場合は、Get-Help を使用してコマンドの正しい使用法を確認してください。\n';
    analysis += '- 引用符やエスケープシーケンスに問題がある場合は、文字列リテラルの使用を検討してください。\n';
    
    return {
      content: [
        {
          type: 'text',
          text: analysis,
        },
      ],
    };
  }
}

// サーバーインスタンスを作成して実行
const server = new PowerShellCommanderServer();
server.run = async function() {
  const transport = new StdioServerTransport();
  await this.server.connect(transport);
  console.error('PowerShell Commander MCPサーバーが起動しました。');
};

server.run().catch(console.error);
