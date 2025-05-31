# PowerShell script to update Claude Desktop configuration on Windows

$ErrorActionPreference = "Stop"

Write-Host "🔧 Claude Desktop Configuration Updater (Windows)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Get the Claude Desktop config path
$configPath = Join-Path $env:APPDATA "Claude\claude_desktop_config.json"
Write-Host "📁 Config path: $configPath" -ForegroundColor Yellow

# Get current directory
$mcpPath = (Get-Location).Path
$serverPath = Join-Path $mcpPath "build\index.js"

# Check if server is built
if (-not (Test-Path $serverPath)) {
    Write-Host "❌ Server not built. Run 'npm run build' first." -ForegroundColor Red
    exit 1
}

# Load existing config or create new one
$config = @{}
if (Test-Path $configPath) {
    Write-Host "📖 Loading existing configuration..." -ForegroundColor Yellow
    try {
        $config = Get-Content $configPath -Raw | ConvertFrom-Json
    } catch {
        Write-Host "⚠️  Failed to parse existing config: $_" -ForegroundColor Yellow
        Write-Host "📝 Creating new configuration..." -ForegroundColor Yellow
        $config = @{}
    }
} else {
    Write-Host "📝 Creating new configuration..." -ForegroundColor Yellow
    # Ensure directory exists
    $configDir = Split-Path $configPath -Parent
    if (-not (Test-Path $configDir)) {
        New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    }
}

# Ensure mcpServers object exists
if (-not $config.mcpServers) {
    $config | Add-Member -MemberType NoteProperty -Name "mcpServers" -Value @{} -Force
}

# Add or update Enhanced Development Commander
# Convert to hashtable if it's a PSCustomObject
if ($config.mcpServers -is [PSCustomObject]) {
    $mcpServers = @{}
    $config.mcpServers.PSObject.Properties | ForEach-Object {
        $mcpServers[$_.Name] = $_.Value
    }
    $config.mcpServers = $mcpServers
}

$config.mcpServers["enhanced-development-commander"] = @{
    command = "node"
    args = @($serverPath)
    env = @{
        NODE_ENV = "production"
    }
}

# Write updated config
try {
    $config | ConvertTo-Json -Depth 10 | Set-Content $configPath -Encoding UTF8
    Write-Host ""
    Write-Host "✅ Configuration updated successfully!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "📋 Added MCP Server:" -ForegroundColor Cyan
    Write-Host "   Name: enhanced-development-commander" -ForegroundColor White
    Write-Host "   Path: $serverPath" -ForegroundColor White
    
    Write-Host ""
    Write-Host "🚀 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Restart Claude Desktop" -ForegroundColor White
    Write-Host "   2. Look for 'enhanced-development-commander' in the MCP menu" -ForegroundColor White
    Write-Host "   3. Start using the tools!" -ForegroundColor White
    
    Write-Host ""
    Write-Host "📝 Available tool categories:" -ForegroundColor Cyan
    Write-Host "   • Git tools (git_status_enhanced, git_commit_smart, etc.)" -ForegroundColor White
    Write-Host "   • Analysis tools (analyze_project_structure, find_dead_code, etc.)" -ForegroundColor White
    Write-Host "   • Template tools (generate_code_template, suggest_commit_message)" -ForegroundColor White
    Write-Host "   • Environment tools (env_port_manager, env_process_monitor, etc.)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Failed to write configuration: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Try running PowerShell as Administrator if permission denied." -ForegroundColor Yellow
    exit 1
}