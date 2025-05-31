import fs from 'fs-extra';
import { FileDiff } from '../types/index.js';

/**
 * 2つのファイルの内容を比較し、差分情報を返す
 */
export async function compareFiles(
  filePath1: string,
  filePath2: string,
  options: {
    ignoreWhitespace?: boolean;
    contextLines?: number;
    maxDiffs?: number;
  } = {}
): Promise<FileDiff> {
  const {
    ignoreWhitespace = false,
    contextLines = 3,
    maxDiffs = 1000,
  } = options;
  
  try {
    // ファイルの内容を読み込む
    const content1 = await fs.readFile(filePath1, 'utf8');
    const content2 = await fs.readFile(filePath2, 'utf8');
    
    // 行に分割
    const lines1 = content1.split(/\r?\n/);
    const lines2 = content2.split(/\r?\n/);
    
    // 差分情報を収集
    const differences: FileDiff['differences'] = [];
    let added = 0;
    let removed = 0;
    let changed = 0;
    
    // シンプルな差分検出アルゴリズム
    const lcs = longestCommonSubsequence(
      lines1,
      lines2,
      ignoreWhitespace ? (a, b) => a.trim() === b.trim() : undefined
    );
    
    let i = 0;
    let j = 0;
    
    while (i < lines1.length || j < lines2.length) {
      if (i < lines1.length && j < lines2.length && lcs[i][j]) {
        // 一致している行
        i++;
        j++;
      } else if (j < lines2.length && (i >= lines1.length || !lcs[i][j])) {
        // 追加された行
        differences.push({
          lineNumber: j + 1,
          content2: lines2[j],
          type: 'added',
        });
        added++;
        j++;
      } else if (i < lines1.length && (j >= lines2.length || !lcs[i][j])) {
        // 削除された行
        differences.push({
          lineNumber: i + 1,
          content1: lines1[i],
          type: 'removed',
        });
        removed++;
        i++;
      } else {
        // 変更された行
        differences.push({
          lineNumber: i + 1,
          content1: lines1[i],
          content2: lines2[j],
          type: 'changed',
        });
        changed++;
        i++;
        j++;
      }
      
      // 最大差分数に達したら中断
      if (differences.length >= maxDiffs) {
        break;
      }
    }
    
    return {
      path1: filePath1,
      path2: filePath2,
      differences,
      summary: {
        added,
        removed,
        changed,
      },
    };
  } catch (error) {
    throw new Error(`ファイル比較に失敗しました: ${(error as Error).message}`);
  }
}

/**
 * 2つの配列の最長共通部分列を計算
 */
function longestCommonSubsequence<T>(
  arr1: T[],
  arr2: T[],
  equalsFn: ((a: T, b: T) => boolean) | undefined = undefined
): boolean[][] {
  const equals = equalsFn || ((a: T, b: T) => a === b);
  const m = arr1.length;
  const n = arr2.length;
  
  // 動的計画法で最長共通部分列を計算
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (equals(arr1[i - 1], arr2[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // バックトラックして共通部分を特定
  const lcs: boolean[][] = Array(m)
    .fill(null)
    .map(() => Array(n).fill(false));
  
  let i = m;
  let j = n;
  
  while (i > 0 && j > 0) {
    if (equals(arr1[i - 1], arr2[j - 1])) {
      lcs[i - 1][j - 1] = true;
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  
  return lcs;
}

/**
 * ファイル差分をわかりやすく整形したテキストで出力
 */
export function formatFileDiff(diff: FileDiff): string {
  let output = `--- ${diff.path1}\n+++ ${diff.path2}\n\n`;
  
  output += `概要: ${diff.summary.added} 行追加, ${diff.summary.removed} 行削除, ${diff.summary.changed} 行変更\n\n`;
  
  for (const d of diff.differences) {
    switch (d.type) {
      case 'added':
        output += `@@ ${d.lineNumber}: 追加 @@\n+ ${d.content2}\n\n`;
        break;
      case 'removed':
        output += `@@ ${d.lineNumber}: 削除 @@\n- ${d.content1}\n\n`;
        break;
      case 'changed':
        output += `@@ ${d.lineNumber}: 変更 @@\n- ${d.content1}\n+ ${d.content2}\n\n`;
        break;
    }
  }
  
  return output;
}

/**
 * ファイル差分をHTMLで整形して出力
 */
export function formatFileDiffHtml(diff: FileDiff): string {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>ファイル比較: ${diff.path1} - ${diff.path2}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px;
          background-color: #f8f9fa;
          color: #333;
        }
        .diff-header {
          margin-bottom: 20px;
        }
        .diff-summary {
          background-color: #e9ecef;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        .diff-block {
          margin-bottom: 20px;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          overflow: hidden;
        }
        .diff-line-number {
          background-color: #f1f3f5;
          padding: 8px 12px;
          font-family: monospace;
          font-weight: bold;
        }
        .diff-content {
          font-family: monospace;
          white-space: pre-wrap;
          padding: 10px;
          background-color: #fff;
        }
        .diff-added {
          background-color: #e6ffed;
          border-left: 4px solid #28a745;
        }
        .diff-removed {
          background-color: #ffeef0;
          border-left: 4px solid #dc3545;
        }
        .diff-changed .old {
          background-color: #ffeef0;
          border-left: 4px solid #dc3545;
          margin-bottom: 4px;
        }
        .diff-changed .new {
          background-color: #e6ffed;
          border-left: 4px solid #28a745;
        }
      </style>
    </head>
    <body>
      <div class="diff-header">
        <h1>ファイル比較</h1>
        <div>
          <p><strong>ファイル1:</strong> ${diff.path1}</p>
          <p><strong>ファイル2:</strong> ${diff.path2}</p>
        </div>
      </div>
      
      <div class="diff-summary">
        <h2>概要</h2>
        <p>
          <span>${diff.summary.added} 行追加</span>,
          <span>${diff.summary.removed} 行削除</span>,
          <span>${diff.summary.changed} 行変更</span>
        </p>
      </div>
      
      <div class="diff-content">
        ${diff.differences.map(d => {
          switch (d.type) {
            case 'added':
              return `
                <div class="diff-block diff-added">
                  <div class="diff-line-number">行 ${d.lineNumber}: 追加</div>
                  <div class="diff-content">+ ${d.content2}</div>
                </div>
              `;
            case 'removed':
              return `
                <div class="diff-block diff-removed">
                  <div class="diff-line-number">行 ${d.lineNumber}: 削除</div>
                  <div class="diff-content">- ${d.content1}</div>
                </div>
              `;
            case 'changed':
              return `
                <div class="diff-block diff-changed">
                  <div class="diff-line-number">行 ${d.lineNumber}: 変更</div>
                  <div class="diff-content old">- ${d.content1}</div>
                  <div class="diff-content new">+ ${d.content2}</div>
                </div>
              `;
            default:
              return '';
          }
        }).join('')}
      </div>
    </body>
    </html>
  `;
  
  return html;
}
