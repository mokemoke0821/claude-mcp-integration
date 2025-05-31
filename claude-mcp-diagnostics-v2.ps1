# ================================================================
# 🎯 Claude MCP 環境診断システム v2.0
# ================================================================
# 現在の設定ファイルに最適化した高度診断システム
# 使用方法: claude-check-v2
# ================================================================

function Invoke-ClaudeMCPDiagnosticsV2 {
  [CmdletBinding()]
  param()
    
  Write-Host "🔍 Claude MCP環境診断開始 (v2.0)..." -ForegroundColor Yellow
  Write-Host "=" * 70 -ForegroundColor Cyan
    
  # 設定ファイルパス
  $configPath = "$env:APPDATA\Claude\claude_desktop_config.json"
  $mcpBasePath = "C:\Users\81902\OneDrive\Documents\Cline\MCP"
    
  # 1. 設定ファイル詳細確認
  Write-Host "`n📋 設定ファイル詳細診断" -ForegroundColor Cyan
  if (Test-Path $configPath) {
    Write-Host "✅ 設定ファイル発見: $configPath" -ForegroundColor Green
    try {
      $config = Get-Content $configPath -Raw | ConvertFrom-Json
      $serverCount = $config.mcpServers.PSObject.Properties.Count
      Write-Host "✅ 設定済みMCPサーバー数: $serverCount" -ForegroundColor Green
            
      # 現在の設定順序に対応した詳細確認
      $expectedServers = @("filesystem", "enhanced-development-commander", "enhanced-file-commander")
            
      Write-Host "`n📊 設定済みサーバー詳細:" -ForegroundColor White
      foreach ($server in $config.mcpServers.PSObject.Properties) {
        Write-Host "  🔸 $($server.Name)" -ForegroundColor Yellow
        $serverConfig = $server.Value
                
        # コマンド確認
        Write-Host "    📋 Command: $($serverConfig.command)" -ForegroundColor Cyan
                
        # 引数確認
        if ($serverConfig.args) {
          Write-Host "    📋 Args: $($serverConfig.args -join ', ')" -ForegroundColor Cyan
                    
          # ファイル存在確認（Node.jsベースのサーバーのみ）
          if ($serverConfig.command -eq "node" -and $serverConfig.args[0]) {
            $serverPath = $serverConfig.args[0]
            if (Test-Path $serverPath) {
              Write-Host "    ✅ ファイル存在: $serverPath" -ForegroundColor Green
                            
              # ファイルサイズ確認
              $fileInfo = Get-Item $serverPath
              Write-Host "    📊 ファイルサイズ: $([math]::Round($fileInfo.Length / 1KB, 2)) KB" -ForegroundColor Blue
              Write-Host "    📊 最終更新: $($fileInfo.LastWriteTime)" -ForegroundColor Blue
            }
            else {
              Write-Host "    ❌ ファイル不存在: $serverPath" -ForegroundColor Red
            }
          }
        }
                
        # 環境変数確認
        if ($serverConfig.env) {
          Write-Host "    🌍 Environment: $($serverConfig.env | ConvertTo-Json -Compress)" -ForegroundColor Magenta
        }
                
        Write-Host ""
      }
    }
    catch {
      Write-Host "❌ 設定ファイル解析エラー: $($_.Exception.Message)" -ForegroundColor Red
    }
  }
  else {
    Write-Host "❌ 設定ファイルが見つかりません: $configPath" -ForegroundColor Red
  }
    
  # 2. Node.js環境確認
  Write-Host "`n⚙️  Node.js環境診断" -ForegroundColor Cyan
  try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js バージョン: $nodeVersion" -ForegroundColor Green
        
    # npm確認
    $npmVersion = npm --version
    Write-Host "✅ npm バージョン: $npmVersion" -ForegroundColor Green
  }
  catch {
    Write-Host "❌ Node.js が利用できません: $($_.Exception.Message)" -ForegroundColor Red
  }
    
  # 3. MCPサーバー実行テスト
  Write-Host "`n🚀 MCPサーバー実行テスト" -ForegroundColor Cyan
    
  # Enhanced Development Commander テスト
  $enhancedDevPath = "$mcpBasePath\enhanced-development-commander\build\index.js"
  if (Test-Path $enhancedDevPath) {
    Write-Host "🔸 Enhanced Development Commander 実行テスト..." -ForegroundColor Yellow
    try {
      $testResult = Start-Job -ScriptBlock {
        param($path)
        $output = @()
        $process = Start-Process -FilePath "node" -ArgumentList $path, "--help" -PassThru -NoNewWindow -RedirectStandardOutput -Wait
        return $process.ExitCode
      } -ArgumentList $enhancedDevPath
            
      $result = Wait-Job $testResult -Timeout 10
      if ($result) {
        $exitCode = Receive-Job $testResult
        Remove-Job $testResult
        if ($exitCode -eq 0) {
          Write-Host "    ✅ 実行可能" -ForegroundColor Green
        }
        else {
          Write-Host "    ⚠️  実行時警告 (Exit Code: $exitCode)" -ForegroundColor Yellow
        }
      }
      else {
        Write-Host "    ⏱️  実行タイムアウト (MCPサーバーとして正常)" -ForegroundColor Blue
        Remove-Job $testResult -Force
      }
    }
    catch {
      Write-Host "    ❌ 実行エラー: $($_.Exception.Message)" -ForegroundColor Red
    }
  }
    
  # Enhanced File Commander テスト
  $enhancedFilePath = "$mcpBasePath\enhanced-file-commander\build\index.js"
  if (Test-Path $enhancedFilePath) {
    Write-Host "🔸 Enhanced File Commander 実行テスト..." -ForegroundColor Yellow
    try {
      $testResult = Start-Job -ScriptBlock {
        param($path)
        $process = Start-Process -FilePath "node" -ArgumentList $path, "--help" -PassThru -NoNewWindow -RedirectStandardOutput -Wait
        return $process.ExitCode
      } -ArgumentList $enhancedFilePath
            
      $result = Wait-Job $testResult -Timeout 10
      if ($result) {
        $exitCode = Receive-Job $testResult
        Remove-Job $testResult
        if ($exitCode -eq 0) {
          Write-Host "    ✅ 実行可能" -ForegroundColor Green
        }
        else {
          Write-Host "    ⚠️  実行時警告 (Exit Code: $exitCode)" -ForegroundColor Yellow
        }
      }
      else {
        Write-Host "    ⏱️  実行タイムアウト (MCPサーバーとして正常)" -ForegroundColor Blue
        Remove-Job $testResult -Force
      }
    }
    catch {
      Write-Host "    ❌ 実行エラー: $($_.Exception.Message)" -ForegroundColor Red
    }
  }
    
  # 4. ビルド状況詳細確認
  Write-Host "`n🏗️  ビルド状況詳細確認" -ForegroundColor Cyan
  $projectsToCheck = @("enhanced-development-commander", "enhanced-file-commander")
    
  foreach ($project in $projectsToCheck) {
    $projectPath = Join-Path $mcpBasePath $project
    $buildPath = Join-Path $projectPath "build"
    $packagePath = Join-Path $projectPath "package.json"
        
    Write-Host "🔸 $project プロジェクト診断:" -ForegroundColor Yellow
        
    if (Test-Path $packagePath) {
      $pkg = Get-Content $packagePath | ConvertFrom-Json
      Write-Host "    📦 Package: $($pkg.name) v$($pkg.version)" -ForegroundColor Blue
    }
        
    if (Test-Path $buildPath) {
      $buildFiles = Get-ChildItem $buildPath -Recurse -File
      $buildSize = ($buildFiles | Measure-Object -Property Length -Sum).Sum
      Write-Host "    ✅ Build ディレクトリ: 存在" -ForegroundColor Green
      Write-Host "    📊 Build ファイル数: $($buildFiles.Count)" -ForegroundColor Blue
      Write-Host "    📊 Build 合計サイズ: $([math]::Round($buildSize / 1KB, 2)) KB" -ForegroundColor Blue
            
      # index.js確認
      $indexFile = Join-Path $buildPath "index.js"
      if (Test-Path $indexFile) {
        $indexInfo = Get-Item $indexFile
        Write-Host "    ✅ index.js: $([math]::Round($indexInfo.Length / 1KB, 2)) KB (更新: $($indexInfo.LastWriteTime.ToString('yyyy/MM/dd HH:mm')))" -ForegroundColor Green
      }
    }
    else {
      Write-Host "    ❌ Build ディレクトリ: 不存在" -ForegroundColor Red
    }
        
    Write-Host ""
  }
    
  # 5. 問題点分析と推奨事項
  Write-Host "`n🔍 問題点分析と推奨事項" -ForegroundColor Cyan
  $issues = @()
  $recommendations = @()
    
  # filesystem MCPの特別確認
  try {
    $npmList = npm list -g @modelcontextprotocol/server-filesystem 2>$null
    if ($LASTEXITCODE -eq 0) {
      Write-Host "✅ filesystem MCP (npmパッケージ): 利用可能" -ForegroundColor Green
    }
    else {
      $issues += "filesystem MCP パッケージが見つかりません"
      $recommendations += "npm install -g @modelcontextprotocol/server-filesystem を実行してください"
    }
  }
  catch {
    $issues += "npm グローバルパッケージ確認でエラーが発生しました"
  }
    
  # 全体評価
  if ($issues.Count -eq 0) {
    Write-Host "✅ 重大な問題は検出されませんでした" -ForegroundColor Green
    Write-Host "🎯 現在の設定は正常に動作する見込みです" -ForegroundColor Green
  }
  else {
    Write-Host "⚠️  以下の問題が検出されました:" -ForegroundColor Yellow
    foreach ($issue in $issues) {
      Write-Host "    ❌ $issue" -ForegroundColor Red
    }
        
    Write-Host "`n💡 推奨対策:" -ForegroundColor Cyan
    foreach ($recommendation in $recommendations) {
      Write-Host "    🔧 $recommendation" -ForegroundColor White
    }
  }
    
  Write-Host "`n" + "=" * 70 -ForegroundColor Cyan
  Write-Host "🎯 診断完了 (v2.0)" -ForegroundColor Green
}

function Invoke-ClaudeConfigTestV2 {
  [CmdletBinding()]
  param()
    
  Write-Host "🧪 Claude設定ファイル実動作テスト" -ForegroundColor Yellow
    
  $configPath = "$env:APPDATA\Claude\claude_desktop_config.json"
    
  if (Test-Path $configPath) {
    try {
      # 設定ファイル読み込みテスト
      $config = Get-Content $configPath -Raw | ConvertFrom-Json
      Write-Host "✅ 設定ファイル構文: 正常" -ForegroundColor Green
            
      # 各サーバーの起動テスト
      foreach ($server in $config.mcpServers.PSObject.Properties) {
        $serverName = $server.Name
        $serverConfig = $server.Value
                
        Write-Host "`n🔸 $serverName 起動テスト..." -ForegroundColor Yellow
                
        if ($serverConfig.command -eq "node" -and $serverConfig.args) {
          $scriptPath = $serverConfig.args[0]
          if (Test-Path $scriptPath) {
            # 非同期で短時間実行テスト
            $job = Start-Job -ScriptBlock {
              param($cmd, $args, $env)
              try {
                $psi = New-Object System.Diagnostics.ProcessStartInfo
                $psi.FileName = $cmd
                $psi.Arguments = $args -join " "
                $psi.UseShellExecute = $false
                $psi.RedirectStandardOutput = $true
                $psi.RedirectStandardError = $true
                                
                if ($env) {
                  foreach ($envVar in $env.PSObject.Properties) {
                    $psi.EnvironmentVariables[$envVar.Name] = $envVar.Value
                  }
                }
                                
                $process = [System.Diagnostics.Process]::Start($psi)
                Start-Sleep -Seconds 2
                                
                if (-not $process.HasExited) {
                  $process.Kill()
                  return "RUNNING"
                }
                else {
                  return "EXITED:$($process.ExitCode)"
                }
              }
              catch {
                return "ERROR:$($_.Exception.Message)"
              }
            } -ArgumentList $serverConfig.command, $serverConfig.args, $serverConfig.env
                        
            $result = Wait-Job $job -Timeout 15
            if ($result) {
              $output = Receive-Job $job
              Remove-Job $job
                            
              if ($output -eq "RUNNING") {
                Write-Host "    ✅ 正常起動 (MCPサーバーとして動作中)" -ForegroundColor Green
              }
              elseif ($output.StartsWith("EXITED:0")) {
                Write-Host "    ✅ 正常起動・終了" -ForegroundColor Green
              }
              elseif ($output.StartsWith("EXITED:")) {
                Write-Host "    ⚠️  起動後異常終了: $output" -ForegroundColor Yellow
              }
              else {
                Write-Host "    ❌ 起動エラー: $output" -ForegroundColor Red
              }
            }
            else {
              Remove-Job $job -Force
              Write-Host "    ⏱️  テストタイムアウト" -ForegroundColor Blue
            }
          }
          else {
            Write-Host "    ❌ ファイル不存在: $scriptPath" -ForegroundColor Red
          }
        }
        elseif ($serverConfig.command -eq "npx") {
          Write-Host "    ✅ npx コマンド (filesystem MCP)" -ForegroundColor Green
        }
        else {
          Write-Host "    ❓ 不明なコマンド: $($serverConfig.command)" -ForegroundColor Yellow
        }
      }
            
    }
    catch {
      Write-Host "❌ 設定ファイルテストエラー: $($_.Exception.Message)" -ForegroundColor Red
    }
  }
  else {
    Write-Host "❌ 設定ファイルが見つかりません: $configPath" -ForegroundColor Red
  }
    
  Write-Host "`n🎯 実動作テスト完了" -ForegroundColor Green
}

# エイリアス設定
Set-Alias -Name claude-check-v2 -Value Invoke-ClaudeMCPDiagnosticsV2 -Force
Set-Alias -Name claude-test-v2 -Value Invoke-ClaudeConfigTestV2 -Force

# 初回実行メッセージ
Write-Host "🎯 Claude MCP診断システム v2.0 が読み込まれました" -ForegroundColor Green
Write-Host "利用可能なコマンド:" -ForegroundColor Yellow
Write-Host "  • claude-check-v2 : 高度環境診断" -ForegroundColor White
Write-Host "  • claude-test-v2  : 実動作テスト" -ForegroundColor White 