# クイックリファレンス

## よく使うパス

### WSL側
```bash
# ホームディレクトリ
cd ~
cd /home/mokemoke0821

# プロジェクトルート
cd /mnt/c/Users/81902/OneDrive/Documents/Cline/MCP

# 設定ファイル
~/.bashrc
~/.profile
~/.config/
```

### Windows側パス (WSLから)
```bash
# Windowsホーム
cd /mnt/c/Users/81902

# ドキュメント
cd /mnt/c/Users/81902/OneDrive/Documents

# ダウンロード
cd /mnt/c/Users/81902/Downloads

# デスクトップ
cd /mnt/c/Users/81902/Desktop

# VS Code
/mnt/c/Users/81902/AppData/Local/Programs/Microsoft\ VS\ Code/bin/code

# Cursor
/mnt/c/Users/81902/AppData/Local/Programs/cursor/resources/app/bin/cursor
```

## よく使うコマンド

### システム情報
```bash
# OS情報
lsb_release -a

# CPU情報
lscpu

# メモリ情報
free -h

# ディスク容量
df -h

# WSLバージョン確認
wsl.exe --version
```

### 開発関連
```bash
# Git
git status
git add .
git commit -m "message"
git push
git pull

# Node.js
node --version
npm --version
npm install
npm run dev
npm run build

# Python
python3 --version
python3 script.py

# プロセス確認
ps aux | grep node
ps aux | grep python
```

### ファイル操作
```bash
# ディレクトリ作成
mkdir -p path/to/directory

# ファイル検索
find . -name "*.js"
find . -type f -name "*.json"

# ファイル内容検索
grep -r "search_term" .
grep -r "pattern" --include="*.js" .

# ディレクトリツリー表示
tree -L 2
ls -la
```

### WSL特有のコマンド
```bash
# Windows側のプログラム実行
cmd.exe /c dir
powershell.exe -Command "Get-ChildItem"

# エクスプローラー開く
explorer.exe .

# VS Codeで開く
code .

# Windows側のパス変換
wslpath -w /home/mokemoke0821  # WSL → Windows
wslpath -u "C:\Users\81902"    # Windows → WSL
```

## プロジェクト別コマンド

### MCP関連
```bash
# TypeScript SDK
cd typescript-sdk
npm install
npm run build

# Python SDK
cd python-sdk
pip install -e .

# Web Research Commander
cd web-research-commander
npm install
npm start
```

### デバッグ・ログ確認
```bash
# ログファイル確認
tail -f combined.log
tail -f error.log

# プロセス確認・終了
ps aux | grep mcp
kill -9 [PID]

# ポート使用確認
netstat -tulpn | grep :3000
lsof -i :3000
```

## 環境変数関連
```bash
# 環境変数確認
echo $PATH
echo $HOME
printenv | grep NODE

# 一時的な環境変数設定
export NODE_ENV=development
export DEBUG=true

# パス追加
export PATH=$PATH:/new/path
```

## Git設定
```bash
# ユーザー設定
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 設定確認
git config --list
git config --global --list
```

## トラブルシューティング
```bash
# パーミッション修正
chmod +x script.sh
chmod 755 directory/

# 所有者変更
chown -R mokemoke0821:mokemoke0821 directory/

# WSL再起動
wsl.exe --shutdown
# その後、新しいターミナルを開く

# apt update (パッケージ更新)
sudo apt update
sudo apt upgrade
```

## エイリアス候補 (.bashrcに追加)
```bash
# プロジェクトディレクトリへのショートカット
alias mcp='cd /mnt/c/Users/81902/OneDrive/Documents/Cline/MCP'
alias home='cd /mnt/c/Users/81902'
alias docs='cd /mnt/c/Users/81902/OneDrive/Documents'

# よく使うコマンド
alias ll='ls -la'
alias gs='git status'
alias gp='git pull'
alias nr='npm run'

# Windows側プログラム
alias exp='explorer.exe .'
alias vsc='code .'
```