import fs from 'fs-extra';
import path from 'path';
import dayjs from 'dayjs';
import mime from 'mime-types';
import { FileSystemStats, FileInfo, DirectoryInfo } from '../types/index.js';
import { listDirectoryContents, formatFileSize } from '../utils/file-system.js';

/**
 * ディレクトリ内のファイル統計を収集
 */
export async function analyzeDirectory(
  dirPath: string,
  options: {
    recursive?: boolean;
    includeHidden?: boolean;
    maxDepth?: number;
  } = {}
): Promise<FileSystemStats> {
  const {
    recursive = true,
    includeHidden = false,
    maxDepth = Infinity,
  } = options;
  
  try {
    // ディレクトリ内のファイルとフォルダを取得
    const contents = await listDirectoryContents(
      dirPath,
      recursive,
      includeHidden,
      maxDepth
    );
    
    // 統計情報を初期化
    const stats: FileSystemStats = {
      total: {
        files: 0,
        directories: 0,
        size: 0,
      },
      byType: {},
      byDate: {},
      bySize: {
        small: 0,   // < 1MB
        medium: 0,  // 1MB - 100MB
        large: 0,   // 100MB - 1GB
        huge: 0,    // > 1GB
      },
    };
    
    // ファイルとディレクトリを処理
    for (const item of contents) {
      if (item.isDirectory) {
        // ディレクトリの場合
        stats.total.directories++;
      } else {
        // ファイルの場合
        stats.total.files++;
        stats.total.size += item.size;
        
        // タイプ別の統計
        const fileInfo = item as FileInfo;
        const extension = fileInfo.extension.toLowerCase() || 'unknown';
        
        if (!stats.byType[extension]) {
          stats.byType[extension] = {
            count: 0,
            size: 0,
          };
        }
        
        stats.byType[extension].count++;
        stats.byType[extension].size += item.size;
        
        // 日付別の統計
        const createdDate = dayjs(item.created).format('YYYY-MM-DD');
        const modifiedDate = dayjs(item.modified).format('YYYY-MM-DD');
        
        if (!stats.byDate[createdDate]) {
          stats.byDate[createdDate] = {
            created: 0,
            modified: 0,
          };
        }
        
        if (!stats.byDate[modifiedDate]) {
          stats.byDate[modifiedDate] = {
            created: 0,
            modified: 0,
          };
        }
        
        stats.byDate[createdDate].created++;
        stats.byDate[modifiedDate].modified++;
        
        // サイズ別の統計
        const sizeInMB = item.size / (1024 * 1024);
        
        if (sizeInMB < 1) {
          stats.bySize.small++;
        } else if (sizeInMB < 100) {
          stats.bySize.medium++;
        } else if (sizeInMB < 1024) {
          stats.bySize.large++;
        } else {
          stats.bySize.huge++;
        }
      }
    }
    
    return stats;
  } catch (error) {
    throw new Error(`ディレクトリ分析に失敗しました: ${(error as Error).message}`);
  }
}

/**
 * ファイル統計情報をテキスト形式で整形
 */
export function formatFileStats(stats: FileSystemStats): string {
  let output = '=== ファイルシステム統計 ===\n\n';
  
  // 合計統計
  output += '--- 合計 ---\n';
  output += `ファイル数: ${stats.total.files}\n`;
  output += `ディレクトリ数: ${stats.total.directories}\n`;
  output += `合計サイズ: ${formatFileSize(stats.total.size)}\n\n`;
  
  // サイズ別統計
  output += '--- サイズ別ファイル数 ---\n';
  output += `小 (< 1MB): ${stats.bySize.small}\n`;
  output += `中 (1MB - 100MB): ${stats.bySize.medium}\n`;
  output += `大 (100MB - 1GB): ${stats.bySize.large}\n`;
  output += `超大 (> 1GB): ${stats.bySize.huge}\n\n`;
  
  // タイプ別統計
  output += '--- ファイルタイプ別統計 ---\n';
  
  // タイプを数で降順にソート
  const sortedTypes = Object.entries(stats.byType)
    .sort(([, a], [, b]) => b.count - a.count);
  
  for (const [extension, data] of sortedTypes) {
    const extName = extension === 'unknown' ? '拡張子なし' : extension;
    output += `${extName}: ${data.count} ファイル (${formatFileSize(data.size)})\n`;
  }
  
  output += '\n';
  
  // 日付別統計
  output += '--- 最近の活動 ---\n';
  
  // 日付を降順にソート（最新順）
  const recentDates = Object.entries(stats.byDate)
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .slice(0, 10); // 最新の10日分
  
  for (const [date, data] of recentDates) {
    output += `${date}: 作成 ${data.created} ファイル, 更新 ${data.modified} ファイル\n`;
  }
  
  return output;
}

/**
 * ファイル統計情報をHTML形式で整形
 */
export function formatFileStatsHtml(stats: FileSystemStats, dirPath: string): string {
  // タイプ別データを準備
  const typeData = Object.entries(stats.byType)
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([type, data]) => {
      return {
        type: type === 'unknown' ? '拡張子なし' : type,
        count: data.count,
        size: formatFileSize(data.size),
        percentage: ((data.count / stats.total.files) * 100).toFixed(1),
      };
    });
  
  // 日付別データを準備
  const dateData = Object.entries(stats.byDate)
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .slice(0, 30) // 最新の30日分
    .map(([date, data]) => {
      return {
        date,
        created: data.created,
        modified: data.modified,
      };
    });
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>ファイル統計: ${dirPath}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px;
          background-color: #f8f9fa;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
        }
        h1, h2, h3 {
          color: #495057;
        }
        .stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .stats-card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 20px;
        }
        .stats-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        .summary-item {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 15px;
          text-align: center;
        }
        .summary-item h3 {
          margin-top: 0;
          color: #6c757d;
          font-size: 0.9rem;
          text-transform: uppercase;
        }
        .summary-item p {
          margin-bottom: 0;
          font-size: 1.5rem;
          font-weight: bold;
          color: #495057;
        }
        .size-label {
          font-size: 0.8rem;
          color: #6c757d;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #dee2e6;
        }
        th {
          background-color: #e9ecef;
          font-weight: bold;
        }
        .bar-chart {
          height: 15px;
          background-color: #4dabf7;
          border-radius: 2px;
        }
        .chart-container {
          margin-top: 40px;
        }
      </style>
    </head>
    <body>
      <h1>ファイル統計: ${dirPath}</h1>
      
      <div class="stats-summary">
        <div class="summary-item">
          <h3>ファイル</h3>
          <p>${stats.total.files}</p>
        </div>
        <div class="summary-item">
          <h3>ディレクトリ</h3>
          <p>${stats.total.directories}</p>
        </div>
        <div class="summary-item">
          <h3>合計サイズ</h3>
          <p>${formatFileSize(stats.total.size)}</p>
        </div>
        <div class="summary-item">
          <h3>ファイルタイプ</h3>
          <p>${Object.keys(stats.byType).length}</p>
        </div>
      </div>
      
      <div class="stats-container">
        <div class="stats-card">
          <h2>サイズ別ファイル数</h2>
          <table>
            <tr>
              <th>サイズ範囲</th>
              <th>ファイル数</th>
              <th>割合</th>
            </tr>
            <tr>
              <td>小 (<1MB)</td>
              <td>${stats.bySize.small}</td>
              <td>${((stats.bySize.small / stats.total.files) * 100).toFixed(1)}%</td>
            </tr>
            <tr>
              <td>中 (1MB-100MB)</td>
              <td>${stats.bySize.medium}</td>
              <td>${((stats.bySize.medium / stats.total.files) * 100).toFixed(1)}%</td>
            </tr>
            <tr>
              <td>大 (100MB-1GB)</td>
              <td>${stats.bySize.large}</td>
              <td>${((stats.bySize.large / stats.total.files) * 100).toFixed(1)}%</td>
            </tr>
            <tr>
              <td>超大 (>1GB)</td>
              <td>${stats.bySize.huge}</td>
              <td>${((stats.bySize.huge / stats.total.files) * 100).toFixed(1)}%</td>
            </tr>
          </table>
        </div>
        
        <div class="stats-card">
          <h2>最近の活動</h2>
          <table>
            <tr>
              <th>日付</th>
              <th>作成</th>
              <th>更新</th>
            </tr>
            ${dateData.map(data => `
              <tr>
                <td>${data.date}</td>
                <td>${data.created}</td>
                <td>${data.modified}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      </div>
      
      <div class="stats-card chart-container">
        <h2>ファイルタイプ分布</h2>
        <table>
          <tr>
            <th>タイプ</th>
            <th>ファイル数</th>
            <th>サイズ</th>
            <th>分布</th>
          </tr>
          ${typeData.map(data => `
            <tr>
              <td>${data.type}</td>
              <td>${data.count}</td>
              <td>${data.size}</td>
              <td>
                <div class="bar-chart" style="width: ${data.percentage}%"></div>
                <span class="size-label">${data.percentage}%</span>
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    </body>
    </html>
  `;
  
  return html;
}
