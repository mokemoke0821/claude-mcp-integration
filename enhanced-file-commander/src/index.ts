#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { visualizationTools, batchTools, contentTools, metadataTools } from './tools/index.js';

class EnhancedFileCommanderServer {
  private server: Server;

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

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // ファイルシステム可視化強化ツール
        {
          name: 'visualize_directory_tree',
          description: 'ディレクトリ構造をツリー形式で可視化します',
          inputSchema: {
            type: 'object',
            properties: {
              dirPath: {
                type: 'string',
                description: '可視化するディレクトリのパス',
              },
              maxDepth: {
                type: 'number',
                description: '表示する最大深度',
              },
              showSize: {
                type: 'boolean',
                description: 'サイズ情報を表示するかどうか',
              },
              includeHidden: {
                type: 'boolean',
                description: '隠しファイルを含めるかどうか',
              },
              showFiles: {
                type: 'boolean',
                description: 'ファイルも表示するかどうか（falseの場合はディレクトリのみ）',
              },
              outputFormat: {
                type: 'string',
                description: '出力形式',
                enum: ['text', 'html', 'json'],
              },
              outputPath: {
                type: 'string',
                description: '出力先ファイルパス（省略時は直接表示）',
              }
            },
            required: ['dirPath'],
          },
        },
        {
          name: 'analyze_files',
          description: 'ファイル分析情報を取得して表示します',
          inputSchema: {
            type: 'object',
            properties: {
              dirPath: {
                type: 'string',
                description: '分析するディレクトリのパス',
              },
              recursive: {
                type: 'boolean',
                description: 'サブディレクトリも含めるかどうか',
              },
              includeHidden: {
                type: 'boolean',
                description: '隠しファイルを含めるかどうか',
              },
              maxDepth: {
                type: 'number',
                description: '再帰的に処理する最大深度',
              },
              outputFormat: {
                type: 'string',
                description: '出力形式',
                enum: ['text', 'html', 'json'],
              },
              outputPath: {
                type: 'string',
                description: '出力先ファイルパス（省略時は直接表示）',
              }
            },
            required: ['dirPath'],
          },
        },
        {
          name: 'show_file_type_stats',
          description: 'ファイルタイプ別の統計情報を表示します',
          inputSchema: {
            type: 'object',
            properties: {
              dirPath: {
                type: 'string',
                description: '分析するディレクトリのパス',
              },
              recursive: {
                type: 'boolean',
                description: 'サブディレクトリも含めるかどうか',
              },
              includeHidden: {
                type: 'boolean',
                description: '隠しファイルを含めるかどうか',
              },
              outputFormat: {
                type: 'string',
                description: '出力形式',
                enum: ['text', 'html', 'json'],
              }
            },
            required: ['dirPath'],
          },
        },
        
        // バッチ処理強化ツール
        {
          name: 'batch_rename',
          description: 'パターンマッチによる一括リネームを行います',
          inputSchema: {
            type: 'object',
            properties: {
              dirPath: {
                type: 'string',
                description: '対象ディレクトリのパス',
              },
              renamePattern: {
                type: 'object',
                description: 'リネームパターン',
                properties: {
                  type: {
                    type: 'string',
                    description: 'リネームパターンのタイプ',
                    enum: ['regex', 'template', 'sequence', 'date', 'case'],
                  },
                  pattern: {
                    type: 'string',
                    description: '検索パターン',
                  },
                  replacement: {
                    type: 'string',
                    description: '置換パターン',
                  },
                  options: {
                    type: 'object',
                    description: 'オプション設定',
                    properties: {
                      startNumber: {
                        type: 'number',
                        description: '連番の開始番号',
                      },
                      step: {
                        type: 'number',
                        description: '連番のステップ',
                      },
                      dateFormat: {
                        type: 'string',
                        description: '日付フォーマット',
                      },
                      case: {
                        type: 'string',
                        description: '大文字・小文字変換のタイプ',
                        enum: ['upper', 'lower', 'title', 'camel', 'snake', 'kebab'],
                      }
                    }
                  }
                },
                required: ['type', 'pattern', 'replacement'],
              },
              filePattern: {
                type: 'string',
                description: '対象ファイルのパターン（glob形式）',
              },
              recursive: {
                type: 'boolean',
                description: 'サブディレクトリも含めるかどうか',
              },
              includeHidden: {
                type: 'boolean',
                description: '隠しファイルを含めるかどうか',
              },
              dryRun: {
                type: 'boolean',
                description: 'ドライラン（実際にリネームせず、結果のみ表示）',
              }
            },
            required: ['dirPath', 'renamePattern'],
          },
        },
        {
          name: 'batch_replace_in_files',
          description: 'ファイル内のテキストを一括置換します',
          inputSchema: {
            type: 'object',
            properties: {
              dirPath: {
                type: 'string',
                description: '対象ディレクトリのパス',
              },
              searchText: {
                type: 'string',
                description: '検索テキスト',
              },
              replaceText: {
                type: 'string',
                description: '置換テキスト',
              },
              filePattern: {
                type: 'string',
                description: '対象ファイルのパターン（glob形式）',
              },
              recursive: {
                type: 'boolean',
                description: 'サブディレクトリも含めるかどうか',
              },
              useRegex: {
                type: 'boolean',
                description: '正規表現を使用するかどうか',
              },
              caseSensitive: {
                type: 'boolean',
                description: '大文字・小文字を区別するかどうか',
              },
              includeHidden: {
                type: 'boolean',
                description: '隠しファイルを含めるかどうか',
              },
              dryRun: {
                type: 'boolean',
                description: 'ドライラン（実際に変更せず、結果のみ表示）',
              },
              maxFilesToProcess: {
                type: 'number',
                description: '処理するファイルの最大数',
              }
            },
            required: ['dirPath', 'searchText', 'replaceText'],
          },
        },
        {
          name: 'organize_folder',
          description: 'フォルダ構造を最適化します（特定条件のファイルを整理）',
          inputSchema: {
            type: 'object',
            properties: {
              dirPath: {
                type: 'string',
                description: '対象ディレクトリのパス',
              },
              byExtension: {
                type: 'boolean',
                description: '拡張子ごとに整理するかどうか',
              },
              byDate: {
                type: 'boolean',
                description: '日付ごとに整理するかどうか',
              },
              bySize: {
                type: 'boolean',
                description: 'サイズごとに整理するかどうか',
              },
              dryRun: {
                type: 'boolean',
                description: 'ドライラン（実際に変更せず、結果のみ表示）',
              },
              excludePatterns: {
                type: 'array',
                description: '除外するファイルパターンの配列',
                items: {
                  type: 'string'
                }
              }
            },
            required: ['dirPath'],
          },
        },
        
        // コンテンツ操作ツール
        {
          name: 'search_in_files',
          description: 'ファイル内容の検索を行います',
          inputSchema: {
            type: 'object',
            properties: {
              dirPath: {
                type: 'string',
                description: '対象ディレクトリのパス',
              },
              searchPattern: {
                type: 'string',
                description: '検索パターン',
              },
              filePattern: {
                type: 'string',
                description: '対象ファイルのパターン（glob形式）',
              },
              recursive: {
                type: 'boolean',
                description: 'サブディレクトリも含めるかどうか',
              },
              caseSensitive: {
                type: 'boolean',
                description: '大文字・小文字を区別するかどうか',
              },
              useRegex: {
                type: 'boolean',
                description: '正規表現を使用するかどうか',
              },
              contextLines: {
                type: 'number',
                description: '表示するコンテキスト行数',
              },
              maxResults: {
                type: 'number',
                description: '表示する最大結果数',
              },
              includeHidden: {
                type: 'boolean',
                description: '隠しファイルを含めるかどうか',
              }
            },
            required: ['dirPath', 'searchPattern'],
          },
        },
        {
          name: 'compare_files',
          description: '2つのファイルを比較して差分を表示します',
          inputSchema: {
            type: 'object',
            properties: {
              file1Path: {
                type: 'string',
                description: '比較する1つ目のファイルのパス',
              },
              file2Path: {
                type: 'string',
                description: '比較する2つ目のファイルのパス',
              },
              ignoreWhitespace: {
                type: 'boolean',
                description: '空白の違いを無視するかどうか',
              },
              contextLines: {
                type: 'number',
                description: '表示するコンテキスト行数',
              },
              outputFormat: {
                type: 'string',
                description: '出力形式',
                enum: ['text', 'html', 'json'],
              },
              outputPath: {
                type: 'string',
                description: '出力先ファイルパス（省略時は直接表示）',
              }
            },
            required: ['file1Path', 'file2Path'],
          },
        },
        {
          name: 'preview_file_content',
          description: 'ファイルのプレビューを生成します',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: 'プレビューするファイルのパス',
              },
              maxLines: {
                type: 'number',
                description: '表示する最大行数',
              },
              highlight: {
                type: 'boolean',
                description: 'シンタックスハイライトを適用するかどうか',
              },
              outputFormat: {
                type: 'string',
                description: '出力形式',
                enum: ['text', 'html'],
              }
            },
            required: ['filePath'],
          },
        },
        
        // メタデータ管理ツール
        {
          name: 'add_tags',
          description: 'ファイルにタグを追加します',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: '対象ファイルのパス',
              },
              tags: {
                type: 'array',
                description: '追加するタグの配列',
                items: {
                  type: 'string'
                }
              },
              replace: {
                type: 'boolean',
                description: '既存のタグを置き換えるかどうか（falseの場合はマージ）',
              }
            },
            required: ['filePath', 'tags'],
          },
        },
        {
          name: 'remove_tags',
          description: 'ファイルからタグを削除します',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: '対象ファイルのパス',
              },
              tags: {
                type: 'array',
                description: '削除するタグの配列',
                items: {
                  type: 'string'
                }
              }
            },
            required: ['filePath', 'tags'],
          },
        },
        {
          name: 'show_tags',
          description: 'ファイルのタグを表示します',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: '対象ファイルのパス',
              }
            },
            required: ['filePath'],
          },
        },
        {
          name: 'find_by_tags',
          description: 'タグによるファイル検索を行います',
          inputSchema: {
            type: 'object',
            properties: {
              tags: {
                type: 'array',
                description: '検索するタグの配列',
                items: {
                  type: 'string'
                }
              },
              matchAll: {
                type: 'boolean',
                description: 'すべてのタグに一致するかどうか（falseの場合はいずれか一つ）',
              }
            },
            required: ['tags'],
          },
        },
        {
          name: 'generate_tag_report',
          description: 'タグ使用状況レポートを生成します',
          inputSchema: {
            type: 'object',
            properties: {}
          },
        },
        {
          name: 'organize_tags',
          description: 'タグの整理（リネーム、削除など）を行います',
          inputSchema: {
            type: 'object',
            properties: {
              operations: {
                type: 'object',
                description: '操作内容',
                properties: {
                  rename: {
                    type: 'object',
                    description: 'タグのリネーム操作（キー: 古いタグ名、値: 新しいタグ名）',
                    additionalProperties: {
                      type: 'string'
                    }
                  },
                  delete: {
                    type: 'array',
                    description: '削除するタグの配列',
                    items: {
                      type: 'string'
                    }
                  }
                }
              }
            },
            required: ['operations'],
          },
        },
        {
          name: 'show_file_metadata',
          description: 'ファイルのメタデータを表示します',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: '対象ファイルのパス',
              }
            },
            required: ['filePath'],
          },
        }
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        // ツール名から対応する実装を呼び出す
        switch (request.params.name) {
          // ファイルシステム可視化強化ツール
          case 'visualize_directory_tree':
            return await this.createTextResponse(
              visualizationTools.visualizeDirectoryTree(
                request.params.arguments.dirPath,
                {
                  maxDepth: request.params.arguments.maxDepth,
                  showSize: request.params.arguments.showSize,
                  includeHidden: request.params.arguments.includeHidden,
                  showFiles: request.params.arguments.showFiles,
                  outputFormat: request.params.arguments.outputFormat,
                  outputPath: request.params.arguments.outputPath,
                }
              )
            );
            
          case 'analyze_files':
            return await this.createTextResponse(
              visualizationTools.analyzeFiles(
                request.params.arguments.dirPath,
                {
                  recursive: request.params.arguments.recursive,
                  includeHidden: request.params.arguments.includeHidden,
                  maxDepth: request.params.arguments.maxDepth,
                  outputFormat: request.params.arguments.outputFormat,
                  outputPath: request.params.arguments.outputPath,
                }
              )
            );
            
          case 'show_file_type_stats':
            return await this.createTextResponse(
              visualizationTools.showFileTypeStats(
                request.params.arguments.dirPath,
                {
                  recursive: request.params.arguments.recursive,
                  includeHidden: request.params.arguments.includeHidden,
                  outputFormat: request.params.arguments.outputFormat,
                }
              )
            );
            
          // バッチ処理強化ツール
          case 'batch_rename':
            return await this.createTextResponse(
              batchTools.batchRename(
                request.params.arguments.dirPath,
                request.params.arguments.renamePattern,
                {
                  filePattern: request.params.arguments.filePattern,
                  recursive: request.params.arguments.recursive,
                  includeHidden: request.params.arguments.includeHidden,
                  dryRun: request.params.arguments.dryRun,
                }
              )
            );
            
          case 'batch_replace_in_files':
            return await this.createTextResponse(
              batchTools.batchReplaceInFiles(
                request.params.arguments.dirPath,
                request.params.arguments.searchText,
                request.params.arguments.replaceText,
                {
                  filePattern: request.params.arguments.filePattern,
                  recursive: request.params.arguments.recursive,
                  useRegex: request.params.arguments.useRegex,
                  caseSensitive: request.params.arguments.caseSensitive,
                  includeHidden: request.params.arguments.includeHidden,
                  dryRun: request.params.arguments.dryRun,
                  maxFilesToProcess: request.params.arguments.maxFilesToProcess,
                }
              )
            );
            
          case 'organize_folder':
            return await this.createTextResponse(
              batchTools.organizeFolder(
                request.params.arguments.dirPath,
                {
                  byExtension: request.params.arguments.byExtension,
                  byDate: request.params.arguments.byDate,
                  bySize: request.params.arguments.bySize,
                  dryRun: request.params.arguments.dryRun,
                  excludePatterns: request.params.arguments.excludePatterns,
                }
              )
            );
            
          // コンテンツ操作ツール
          case 'search_in_files':
            return await this.createTextResponse(
              contentTools.searchInFiles(
                request.params.arguments.dirPath,
                request.params.arguments.searchPattern,
                {
                  filePattern: request.params.arguments.filePattern,
                  recursive: request.params.arguments.recursive,
                  caseSensitive: request.params.arguments.caseSensitive,
                  useRegex: request.params.arguments.useRegex,
                  contextLines: request.params.arguments.contextLines,
                  maxResults: request.params.arguments.maxResults,
                  includeHidden: request.params.arguments.includeHidden,
                }
              )
            );
            
          case 'compare_files':
            return await this.createTextResponse(
              contentTools.compareFiles(
                request.params.arguments.file1Path,
                request.params.arguments.file2Path,
                {
                  ignoreWhitespace: request.params.arguments.ignoreWhitespace,
                  contextLines: request.params.arguments.contextLines,
                  outputFormat: request.params.arguments.outputFormat,
                  outputPath: request.params.arguments.outputPath,
                }
              )
            );
            
          case 'preview_file_content':
            return await this.createTextResponse(
              contentTools.previewFileContent(
                request.params.arguments.filePath,
                {
                  maxLines: request.params.arguments.maxLines,
                  highlight: request.params.arguments.highlight,
                  outputFormat: request.params.arguments.outputFormat,
                }
              )
            );
            
          // メタデータ管理ツール
          case 'add_tags':
            return await this.createTextResponse(
              metadataTools.addTags(
                request.params.arguments.filePath,
                request.params.arguments.tags,
                {
                  replace: request.params.arguments.replace,
                }
              )
            );
            
          case 'remove_tags':
            return await this.createTextResponse(
              metadataTools.removeTags(
                request.params.arguments.filePath,
                request.params.arguments.tags
              )
            );
            
          case 'show_tags':
            return await this.createTextResponse(
              metadataTools.showTags(
                request.params.arguments.filePath
              )
            );
            
          case 'find_by_tags':
            return await this.createTextResponse(
              metadataTools.findByTags(
                request.params.arguments.tags,
                {
                  matchAll: request.params.arguments.matchAll,
                }
              )
            );
            
          case 'generate_tag_report':
            return await this.createTextResponse(
              metadataTools.generateTagReport()
            );
            
          case 'organize_tags':
            return await this.createTextResponse(
              metadataTools.organizeTags(
                request.params.arguments.operations
              )
            );
            
          case 'show_file_metadata':
            return await this.createTextResponse(
              metadataTools.showFileMetadata(
                request.params.arguments.filePath
              )
            );
            
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `未知のツール: ${request.params.name}`
            );
        }
      } catch (error) {
        console.error(`ツール ${request.params.name} の実行中にエラーが発生:`, error);
        
        return {
          content: [
            {
              type: 'text',
              text: `エラーが発生しました: ${(error as Error).message || String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async createTextResponse(resultPromise: Promise<string>): Promise<any> {
    try {
      const result = await resultPromise;
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `エラーが発生しました: ${(error as Error).message || String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Enhanced File Commander MCPサーバーがstdioで実行中');
  }
}

const server = new EnhancedFileCommanderServer();
server.run().catch(console.error);
