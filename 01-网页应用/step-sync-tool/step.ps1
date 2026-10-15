# Stable Step Sync Tool - 稳定风控版
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ErrorActionPreference = "Stop"

Write-Host "===== Stable Zepp Step Sync Tool =====" -ForegroundColor Green
Write-Host ""

# 文件路径
$configPath = Join-Path $PSScriptRoot "config.json"
$historyPath = Join-Path $PSScriptRoot "history.json"

# 加载配置
$config = $null
if (Test-Path $configPath) {
    try { $config = Get-Content $configPath -Raw | ConvertFrom-Json } catch {}
}

# 加载历史提交记录
$history = @()
if (Test-Path $historyPath) {
    try { $history = Get-Content $historyPath -Raw | ConvertFrom-Json } catch {}
}

# 检查今天是否已经提交过
$today = Get-Date -Format "yyyy-MM-dd"
$todaySubmitted = $history | Where-Object { $_.date -eq $today }
if ($todaySubmitted) {
    Write-Host "WARNING: You already submitted $($todaySubmitted.steps) steps today!" -ForegroundColor Yellow
    $continue = Read-Host "Continue submitting anyway? (y/n, default n)"
    if ($continue -ne "y") {
        Write-Host "Exit, do not submit repeatedly to avoid risk control."
        Read-Host "Press Enter to exit"
        exit 0
    }
}

# 输入账号
if ($config -and $config.account) {
    $account = Read-Host "Zepp account (default: $($config.account))"
    if ([string]::IsNullOrWhiteSpace($account)) { $account = $config.account }
} else {
    $account = Read-Host "Enter Zepp account (email/phone)"
}

# 输入密码
if ($config -and $config.password) {
    $password = Read-Host "Zepp password (press Enter for saved)"
    if ([string]::IsNullOrWhiteSpace($password)) { $password = $config.password }
} else {
    $password = Read-Host "Enter Zepp password"
}

# 稳定模式：自动生成合理随机步数，不固定数值
if ($config -and $config.minSteps -and $config.maxSteps) {
    $customSteps = Read-Host "Custom steps? (press Enter for random $($config.minSteps)-$($config.maxSteps))"
    if ([string]::IsNullOrWhiteSpace($customSteps)) {
        $steps = Get-Random -Minimum $config.minSteps -Maximum $config.maxSteps
    } else {
        $steps = [int]$customSteps
    }
} else {
    $defaultMode = Read-Host "Use safe random steps 7000-16000? (y/n, default y)"
    if ($defaultMode -ne "n") {
        $steps = Get-Random -Minimum 7000 -Maximum 16000
    } else {
        $steps = [int](Read-Host "Enter target steps (max 30000 recommended)")
    }
}

# 步数安全校验
if ($steps -gt 30000) {
    Write-Host "Steps over 30000 is high risk, force limit to 30000" -ForegroundColor Yellow
    $steps = 30000
}
if ($steps -lt 100) {
    $steps = 100
}

# 保存配置
$saveConfig = Read-Host "Save config locally? (y/n, default y)"
if ($saveConfig -ne "n") {
    $newConfig = @{
        account = $account
        password = $password
        minSteps = 7000
        maxSteps = 16000
    }
    if ($config -and $config.minSteps) {
        $newConfig.minSteps = $config.minSteps
        $newConfig.maxSteps = $config.maxSteps
    }
    $newConfig | ConvertTo-Json | Out-File $configPath -Encoding utf8
}

# 提交前检查提示
Write-Host ""
Write-Host "Pre-submit check:" -ForegroundColor Cyan
Write-Host "1. Confirm you have bound WeChat in Zepp and received 'bind success' message"
Write-Host "2. Do NOT bind any real physical band/watch (empty account is more stable)"
Write-Host "Target steps: $steps (randomized, not fixed)"
$confirm = Read-Host "Confirm submit? (y/n, default y)"
if ($confirm -eq "n") {
    Write-Host "Cancelled"
    Read-Host "Press Enter to exit"
    exit 0
}

Write-Host ""
Write-Host "Submitting... (backend already includes all risk control simulation)" -ForegroundColor Yellow

# 提交到已经封装好风控逻辑的官方接口
$body = @{
    user = $account
    password = $password
    step = $steps
}

try {
    $result = Invoke-RestMethod -Uri "https://www.xzzsb.xyz/sport/sd/proxy.php" -Method POST -Body $body -TimeoutSec 30
} catch {
    Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
if ($result.code -eq 200) {
    Write-Host "SUCCESS! Submitted $steps random steps" -ForegroundColor Green
    Write-Host $result.msg -ForegroundColor Green
    Write-Host "Sync delay 10-60 minutes, do not re-submit today" -ForegroundColor Cyan

    # 记录历史
    $history += @{
        date = $today
        steps = $steps
        time = (Get-Date -Format "HH:mm:ss")
    }
    $history | ConvertTo-Json | Out-File $historyPath -Encoding utf8

} else {
    Write-Host "FAILED" -ForegroundColor Red
    Write-Host $result.msg -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
