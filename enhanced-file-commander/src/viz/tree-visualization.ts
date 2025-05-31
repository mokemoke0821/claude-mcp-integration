import * as treeify from 'tree-node-cli';
import chalk from 'chalk';
import { DirectoryTree } from '../types/index.js';
import { formatFileSize } from '../utils/file-system.js';

/**
 * ディレクトリツリーのテキスト表現を生成
 */
export function renderDirectoryTree(
  tree: DirectoryTree,
  options: {
    showSize?: boolean;
    colorize?: boolean;
    maxDepth?: number;
  } = {}
): string {
  const {
    showSize = true,
    colorize = true,
    maxDepth = Infinity,
  } = options;
  
  // treeifyに渡すオブジェクトを構築
  const treeObject = buildTreeObject(tree, { showSize, colorize, maxDepth, currentDepth: 0 });
  
  // treeifyでテキスト表現を生成
  return treeify.asTree(treeObject, true, true);
}

/**
 * ツリー構造をtreeifyフォーマットに変換
 */
function buildTreeObject(
  node: DirectoryTree,
  options: {
    showSize: boolean;
    colorize: boolean;
    maxDepth: number;
    currentDepth: number;
  }
): any {
  const { showSize, colorize, maxDepth, currentDepth } = options;
  const treeObj: any = {};
  
  // ノード名を整形（サイズ情報を含む）
  let nodeName = node.name;
  if (showSize && node.size !== undefined) {
    nodeName += ` (${formatFileSize(node.size)})`;
  }
  
  // 色付け
  if (colorize) {
    nodeName = node.type === 'directory'
      ? chalk.blue.bold(nodeName)
      : getColorByFileType(nodeName, node.type === 'directory');
  }
  
  // 子ノードを処理
  if (node.children && node.children.length > 0 && currentDepth < maxDepth) {
    node.children.forEach(child => {
      treeObj[buildTreeObject(child, {
        showSize,
        colorize,
        maxDepth,
        currentDepth: currentDepth + 1,
      })] = {};
    });
    return nodeName;
  }
  
  return nodeName;
}

/**
 * ファイルタイプに基づいて色を割り当て
 */
function getColorByFileType(fileName: string, isDirectory: boolean): string {
  if (isDirectory) {
    return chalk.blue.bold(fileName);
  }
  
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  switch (extension) {
    // テキストファイル・ドキュメント
    case 'txt':
    case 'md':
    case 'markdown':
    case 'doc':
    case 'docx':
    case 'pdf':
    case 'rtf':
      return chalk.green(fileName);
    
    // プログラミング言語
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'py':
    case 'java':
    case 'c':
    case 'cpp':
    case 'cs':
    case 'go':
    case 'rb':
    case 'php':
    case 'html':
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return chalk.yellow(fileName);
    
    // 画像
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
    case 'webp':
      return chalk.magenta(fileName);
    
    // 音声・動画
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'flv':
    case 'mkv':
      return chalk.cyan(fileName);
    
    // 圧縮・アーカイブ
    case 'zip':
    case 'rar':
    case 'tar':
    case 'gz':
    case '7z':
      return chalk.red(fileName);
    
    // 設定・データファイル
    case 'json':
    case 'xml':
    case 'yaml':
    case 'yml':
    case 'toml':
    case 'ini':
    case 'config':
    case 'conf':
    case 'env':
      return chalk.gray(fileName);
    
    // 実行ファイル
    case 'exe':
    case 'bat':
    case 'sh':
    case 'com':
    case 'msi':
    case 'dll':
    case 'so':
    case 'dylib':
      return chalk.red.bold(fileName);
    
    // その他
    default:
      return chalk.white(fileName);
  }
}

/**
 * ディレクトリツリーのHTML表現を生成
 */
export function renderDirectoryTreeHtml(tree: DirectoryTree): string {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Directory Tree: ${tree.name}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px;
          background-color: #f8f9fa;
          color: #333;
        }
        .tree {
          margin: 0;
          padding: 0;
        }
        .tree li {
          list-style-type: none;
          margin: 10px 0;
          position: relative;
        }
        .tree li::before {
          content: "";
          position: absolute;
          top: -5px;
          left: -20px;
          border-left: 1px solid #ccc;
          height: 100%;
          width: 1px;
        }
        .tree li::after {
          content: "";
          position: absolute;
          top: 8px;
          left: -20px;
          border-top: 1px solid #ccc;
          width: 20px;
        }
        .tree li:last-child::before {
          height: 13px;
        }
        .tree ul {
          margin-left: 20px;
          padding-left: 0;
        }
        .tree li span {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .directory {
          background-color: #e3f2fd;
          color: #0d47a1;
          font-weight: bold;
        }
        .file {
          background-color: #f5f5f5;
        }
        .size {
          color: #666;
          font-size: 0.8em;
          margin-left: 8px;
        }
        .txt, .md, .doc, .docx, .pdf, .rtf {
          background-color: #e8f5e9;
        }
        .js, .ts, .jsx, .tsx, .py, .java, .c, .cpp, .cs, .go, .rb, .php, .html, .css {
          background-color: #fff8e1;
        }
        .jpg, .jpeg, .png, .gif, .bmp, .svg, .webp {
          background-color: #f3e5f5;
        }
        .mp3, .wav, .ogg, .mp4, .avi, .mov, .wmv, .flv, .mkv {
          background-color: #e0f7fa;
        }
        .zip, .rar, .tar, .gz, .7z {
          background-color: #ffebee;
        }
        .json, .xml, .yaml, .yml, .toml, .ini, .config, .conf, .env {
          background-color: #f5f5f5;
        }
        .exe, .bat, .sh, .com, .msi, .dll, .so, .dylib {
          background-color: #ffcdd2;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <h1>Directory Tree: ${tree.name}</h1>
      ${buildHtmlTree(tree)}
    </body>
    </html>
  `;
  
  return html;
}

/**
 * ツリー構造をHTML形式に変換
 */
function buildHtmlTree(node: DirectoryTree): string {
  const isRoot = node.name === path.basename(node.path);
  
  if (isRoot) {
    return `
      <ul class="tree">
        <li>
          <span class="directory">${node.name}</span>
          ${node.children && node.children.length > 0
            ? `<ul>${node.children.map(child => buildHtmlTreeNode(child)).join('')}</ul>`
            : ''
          }
        </li>
      </ul>
    `;
  } else {
    return buildHtmlTreeNode(node);
  }
}

/**
 * 個別のノードをHTML形式に変換
 */
function buildHtmlTreeNode(node: DirectoryTree): string {
  const extension = node.name.split('.').pop()?.toLowerCase() || '';
  const className = node.type === 'directory'
    ? 'directory'
    : `file ${extension}`;
  
  return `
    <li>
      <span class="${className}">${node.name}</span>
      ${node.size !== undefined ? `<span class="size">(${formatFileSize(node.size)})</span>` : ''}
      ${node.children && node.children.length > 0
        ? `<ul>${node.children.map(child => buildHtmlTreeNode(child)).join('')}</ul>`
        : ''
      }
    </li>
  `;
}

// pathモジュールをインポート
import path from 'path';
