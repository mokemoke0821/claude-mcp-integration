#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { execSync } from 'child_process';
import fs, { createReadStream, promises as fsPromises } from 'fs';
import path from 'path';
import readline from 'readline';

class SimpleFileCommanderServer {
  constructor() {
    this.server = new Server(
      {
        name: 'enhanced_file_commander',
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

  // ファイルサイズのフォーマット
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 日付のフォーマット
  formatDate(date) {
    return new Date(date).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // ディレクトリの一覧取得
  async listFilesInDirectory(directory, recursive = false) {
    const result = [];

    const processDirectory = async (dir, relativeTo = null) => {
      const entries = await fsPromises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = relativeTo ? path.relative(relativeTo, fullPath) : null;

        if (entry.isDirectory()) {
          const stats = await fsPromises.stat(fullPath);

          result.push({
            name: entry.name,
            path: fullPath,
            relativePath: relativePath,
            isDirectory: true,
            modifiedAt: stats.mtime
          });

          if (recursive) {
            await processDirectory(fullPath, relativeTo || dir);
          }
        } else {
          const stats = await fsPromises.stat(fullPath);

          result.push({
            name: entry.name,
            path: fullPath,
            relativePath: relativePath,
            isDirectory: false,
            size: stats.size,
            modifiedAt: stats.mtime
          });
        }
      }
    };

    await processDirectory(directory, recursive ? directory : null);
    return result;
  }

  // テキストファイルかどうかを判定する関数
  isTextFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    // 一般的なテキストファイル拡張子のリスト
    const textExtensions = [
      '.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.html', '.htm', '.css',
      '.scss', '.sass', '.less', '.json', '.xml', '.yaml', '.yml', '.csv',
      '.py', '.rb', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.php',
      '.go', '.rs', '.swift', '.kt', '.sh', '.bat', '.ps1', '.log',
      '.ini', '.conf', '.cfg', '.config'
    ];

    return textExtensions.includes(ext);
  }

  // ファイル内容を検索する関数
  async searchFileContent(filePath, pattern) {
    // テキストファイルチェック
    if (!this.isTextFile(filePath)) {
      return [];
    }

    try {
      const fileStream = createReadStream(filePath, { encoding: 'utf8' });
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      const regex = new RegExp(pattern, 'g');
      const results = [];
      const maxContext = 3;

      const lines = [];
      let lineNumber = 0;

      // すべての行を読み込む
      for await (const line of rl) {
        lineNumber++;
        lines.push({ num: lineNumber, text: line });
      }

      // マッチする行を検索
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = regex.test(line.text);

        if (match) {
          // 正規表現のリセット
          regex.lastIndex = 0;

          // 前後のコンテキスト行を取得
          const contextBefore = [];
          for (let j = Math.max(0, i - maxContext); j < i; j++) {
            contextBefore.push(lines[j].text);
          }

          const contextAfter = [];
          for (let j = i + 1; j < Math.min(lines.length, i + maxContext + 1); j++) {
            contextAfter.push(lines[j].text);
          }

          results.push({
            file: filePath,
            line: line.num,
            content: line.text,
            context: {
              before: contextBefore,
              after: contextAfter
            }
          });
        }
      }

      return results;
    } catch (error) {
      console.error(`Error searching in file ${filePath}:`, error);
      return [{ file: filePath, error: error.message }];
    }
  }

  // ファイル比較関数
  async compareFiles(file1Path, file2Path) {
    // ファイルの存在確認
    if (!fs.existsSync(file1Path)) {
      throw new Error(`ファイル1 "${file1Path}" が存在しません`);
    }
    if (!fs.existsSync(file2Path)) {
      throw new Error(`ファイル2 "${file2Path}" が存在しません`);
    }

    // ファイルの内容を読み込み
    const content1 = await fsPromises.readFile(file1Path, 'utf8');
    const content2 = await fsPromises.readFile(file2Path, 'utf8');

    // ファイルが同一かどうかをチェック
    if (content1 === content2) {
      return {
        identical: true,
        differences: [],
        summary: `ファイルは同一です: "${path.basename(file1Path)}" と "${path.basename(file2Path)}"`
      };
    }

    // 行ごとに分割して比較
    const lines1 = content1.split(/\r?\n/);
    const lines2 = content2.split(/\r?\n/);

    const differences = [];
    const maxLines = Math.max(lines1.length, lines2.length);

    for (let i = 0; i < maxLines; i++) {
      const line1 = i < lines1.length ? lines1[i] : null;
      const line2 = i < lines2.length ? lines2[i] : null;

      if (line1 !== line2) {
        differences.push({
          lineNumber: i + 1,
          file1Line: line1,
          file2Line: line2
        });
      }
    }

    // 差分の要約
    const summary = `${differences.length} 行の差分が見つかりました。`;

    return {
      identical: false,
      differences,
      summary
    };
  }

  // シェルコマンド実行
  executeCommand(command, workingDirectory = process.cwd()) {
    try {
      const options = {
        cwd: workingDirectory,
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 5 // 5MBの最大バッファ
      };

      const output = execSync(command, options);
      return { success: true, output: output.toString() };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stderr: error.stderr ? error.stderr.toString() : null
      };
    }
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'hello_world',
          description: '簡単なテスト用ツール',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: '挨拶する相手の名前',
              },
            },
            required: ['name'],
          },
        },
        {
          name: 'execute_shell_command',
          description: 'シェルコマンドを実行します',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: '実行するコマンド',
              },
              workingDirectory: {
                type: 'string',
                description: 'コマンドを実行するディレクトリ',
              }
            },
            required: ['command'],
          },
        },
        {
          name: 'search_files',
          description: 'ファイル内容を検索します',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: '検索対象ディレクトリ',
              },
              pattern: {
                type: 'string',
                description: '検索パターン（正規表現）',
              },
              fileExtensions: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: '検索対象のファイル拡張子（例：[".js", ".ts"]）',
              }
            },
            required: ['directory', 'pattern'],
          },
        },
        {
          name: 'compare_files',
          description: '2つのファイルを比較します',
          inputSchema: {
            type: 'object',
            properties: {
              file1: {
                type: 'string',
                description: '比較対象ファイル1のパス',
              },
              file2: {
                type: 'string',
                description: '比較対象ファイル2のパス',
              }
            },
            required: ['file1', 'file2'],
          },
        }
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        // Hello World
        if (request.params.name === 'hello_world') {
          const name = request.params.arguments.name || 'World';
          return {
            content: [{ type: 'text', text: `こんにちは、${name}さん！` }],
          };
        }

        // execute_shell_command
        if (request.params.name === 'execute_shell_command') {
          const command = request.params.arguments.command;
          const workingDirectory = request.params.arguments.workingDirectory || process.cwd();

          // コマンドの検証
          if (typeof command !== 'string' || command.trim() === '') {
            throw new Error('無効なコマンドです');
          }

          // 危険なコマンドをブロック
          const dangerousPatterns = [
            /rm\s+(-rf?|\/s)/i,    // rm -rf などの危険なパターン
            /format\s+([a-z]:)/i,  // フォーマットコマンド
            /del\s+[\/\\]\*\.[a-z]/i, // 広範囲の削除
          ];

          for (const pattern of dangerousPatterns) {
            if (pattern.test(command)) {
              throw new Error('セキュリティ上の理由により、このコマンドは実行できません');
            }
          }

          // ディレクトリの存在確認
          if (workingDirectory !== process.cwd() && !fs.existsSync(workingDirectory)) {
            throw new Error(`作業ディレクトリ "${workingDirectory}" が存在しません`);
          }

          const result = this.executeCommand(command, workingDirectory);

          if (result.success) {
            return {
              content: [
                {
                  type: 'text',
                  text: `コマンド実行結果:\n${result.output || '(出力なし)'}`,
                },
              ],
            };
          } else {
            return {
              content: [
                {
                  type: 'text',
                  text: `コマンド実行エラー:\n${result.error}\n\n${result.stderr || ''}`,
                },
              ],
              isError: true,
            };
          }
        }

        // search_files
        if (request.params.name === 'search_files') {
          const directory = request.params.arguments.directory;
          const pattern = request.params.arguments.pattern;
          const fileExtensions = request.params.arguments.fileExtensions || [];

          // パスの存在確認
          if (!fs.existsSync(directory)) {
            throw new Error(`指定されたディレクトリ "${directory}" が存在しません`);
          }

          // パターンのバリデーション
          if (typeof pattern !== 'string' || pattern.trim() === '') {
            throw new Error('検索パターンが指定されていません');
          }

          try {
            // パターンが有効な正規表現かテスト
            new RegExp(pattern);
          } catch (e) {
            throw new Error(`無効な正規表現パターンです: ${e.message}`);
          }

          // 検索対象ファイルの一覧を取得
          const files = await this.listFilesInDirectory(directory, true);
          const targetFiles = files.filter(file => {
            if (file.isDirectory) return false;

            if (fileExtensions.length > 0) {
              const ext = path.extname(file.path).toLowerCase();
              return fileExtensions.includes(ext);
            }

            return this.isTextFile(file.path);
          });

          // 各ファイルに対して検索を実行
          const searchResults = [];
          for (const file of targetFiles) {
            const results = await this.searchFileContent(file.path, pattern);
            searchResults.push(...results);
          }

          // 結果のフォーマット
          let resultText = `"${pattern}" の検索結果:\n`;
          resultText += `===================================\n\n`;

          if (searchResults.length === 0) {
            resultText += "一致する内容は見つかりませんでした。";
          } else {
            resultText += `${searchResults.length} 件のマッチが見つかりました:\n\n`;

            searchResults.forEach((result, index) => {
              if (result.error) {
                resultText += `[エラー] ${result.file}: ${result.error}\n\n`;
                return;
              }

              resultText += `${index + 1}. ${result.file}:${result.line}\n`;

              // コンテキスト行を表示
              if (result.context.before.length > 0) {
                resultText += `${result.context.before.map(line => `    | ${line}`).join('\n')}\n`;
              }

              // マッチした行を強調表示
              resultText += `  > | ${result.content}\n`;

              // 後続の行を表示
              if (result.context.after.length > 0) {
                resultText += `${result.context.after.map(line => `    | ${line}`).join('\n')}\n`;
              }

              resultText += '\n';
            });
          }

          return {
            content: [
              {
                type: 'text',
                text: resultText,
              },
            ],
          };
        }

        // compare_files
        if (request.params.name === 'compare_files') {
          const file1Path = request.params.arguments.file1;
          const file2Path = request.params.arguments.file2;

          try {
            const compareResult = await this.compareFiles(file1Path, file2Path);

            let resultText = `ファイル比較結果:\n`;
            resultText += `===================================\n\n`;
            resultText += `ファイル1: ${file1Path}\n`;
            resultText += `ファイル2: ${file2Path}\n\n`;

            if (compareResult.identical) {
              resultText += compareResult.summary;
            } else {
              resultText += `${compareResult.summary}\n\n`;
              resultText += "差分の詳細:\n";

              const maxDiffsToShow = 50;
              const diffsToShow = compareResult.differences.slice(0, maxDiffsToShow);

              diffsToShow.forEach(diff => {
                resultText += `行 ${diff.lineNumber}:\n`;
                resultText += `- ファイル1: ${diff.file1Line === null ? '(行なし)' : diff.file1Line}\n`;
                resultText += `+ ファイル2: ${diff.file2Line === null ? '(行なし)' : diff.file2Line}\n\n`;
              });

              if (compareResult.differences.length > maxDiffsToShow) {
                resultText += `... さらに ${compareResult.differences.length - maxDiffsToShow} 行の差分があります。`;
              }
            }

            return {
              content: [
                {
                  type: 'text',
                  text: resultText,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `ファイル比較エラー: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        }

        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      } catch (error) {
        console.error('Tool execution error:', error);
        throw new McpError(
          error.code || ErrorCode.InternalError,
          error.message || 'An unknown error occurred'
        );
      }
    });
  }

  async run() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.log('Simple File Commander server is running on stdio transport');
    } catch (error) {
      console.error('Error starting server:', error);
      process.exit(1);
    }
  }
}

// サーバーの起動
const server = new SimpleFileCommanderServer();
server.run().catch(console.error);
