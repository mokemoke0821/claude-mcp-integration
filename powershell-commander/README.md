# PowerShell Commander MCP サーバー

このMCPサーバーはPowerShellコマンドの実行と結果の取得を可能にします。Windows環境で便利な操作を提供します。

## 機能

- PowerShellコマンドの実行
- ドライブ情報の取得
- ファイル/フォルダ一覧の取得
- ファイル検索
- コマンドエラーの分析と解決策の提案

## セットアップ

### 前提条件

- Node.js
- npm
- PowerShell

### インストール

1. 依存パッケージをインストールします：

```
npm install
```

## 使用方法

### サーバーの起動

```
start-powershell-commander.bat
```

または

```
node src/index.js
```

### ツール一覧

1. **execute_powershell**
   - PowerShellコマンドを実行します
   - パラメータ:
     - command: 実行するPowerShellコマンド (必須)
     - workingDirectory: コマンドを実行するディレクトリ (オプション)
     - encoding: 出力のエンコーディング (オプション, デフォルト: shift_jis)

2. **get_psdrive**
   - PowerShellのGet-PSDriveコマンドレットを実行してドライブ情報を取得
   - パラメータ:
     - name: 取得するドライブ名 (オプション)

3. **get_childitem**
   - PowerShellのGet-ChildItemコマンドレットを実行してファイル/フォルダ一覧を取得
   - パラメータ:
     - path: 一覧取得するパス (必須)
     - filter: フィルター (例: *.txt) (オプション)
     - recurse: 再帰的に取得するかどうか (オプション)

4. **find_file**
   - ファイルやディレクトリを検索します
   - パラメータ:
     - path: 検索する開始パス (必須)
     - pattern: 検索パターン (必須)
     - useRegex: 正規表現を使用するかどうか (オプション)

5. **analyze_command_error**
   - コマンド実行時のエラーを分析し、解決策を提案します
   - パラメータ:
     - command: 実行したコマンド (必須)
     - errorMessage: エラーメッセージ (必須)

## 使用例

### PowerShellコマンドの実行

```javascript
await use_mcp_tool({
  server_name: "powershell-commander",
  tool_name: "execute_powershell",
  arguments: {
    command: "Get-Process | Select-Object -First 5",
    encoding: "utf8"
  }
});
```

### ファイル検索

```javascript
await use_mcp_tool({
  server_name: "powershell-commander",
  tool_name: "find_file",
  arguments: {
    path: "C:\\Users",
    pattern: "*.json",
    useRegex: false
  }
});
```

### エラー分析

```javascript
await use_mcp_tool({
  server_name: "powershell-commander",
  tool_name: "analyze_command_error",
  arguments: {
    command: "Get-Procss",
    errorMessage: "Get-Procss : 用語 'Get-Procss' は、コマンドレット、関数、スクリプト ファイル、または操作可能なプログラムの名前として認識されません。"
  }
});
