# Stable Step Sync
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ErrorActionPreference = "Continue"

Write-Host "===== Stable Zepp Step Sync =====" -ForegroundColor Green
Write-Host ""

$configPath = Join-Path $PSScriptRoot "config.json"
$historyPath = Join-Path $PSScriptRoot "history.json"

# Load config
$config = $null
if (Test-Path $configPath) {
    $config = Get-Content $configPath -Raw | ConvertFrom-Json
}

# Load history
[array]$history = @()
if (Test-Path $historyPath) {
    $loaded = Get-Content $historyPath -Raw | ConvertFrom-Json
    if ($loaded) { $history = @($loaded) }
}

# Check today submission
$today = Get-Date -Format "yyyy-MM-dd"
$todaySubmitted = $history | Where-Object { $_.date -eq $today }
if ($todaySubmitted) {
    Write-Host "WARNING: Already submitted $($todaySubmitted.steps) steps today" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n, default n)"
    if ($continue -ne "y") {
        Write-Host "Exit, no repeated submission"
        Read-Host "Press Enter to exit"
        exit 0
    }
}

# Account input
if ($config -and $config.account) {
    $account = Read-Host "Account (default: $($config.account))"
    if (-not $account) { $account = $config.account }
} else {
    $account = Read-Host "Enter Zepp account (email)"
}

# Password input
if ($config -and $config.password) {
    $password = Read-Host "Password (press Enter for saved)"
    if (-not $password) { $password = $config.password }
} else {
    $password = Read-Host "Enter Zepp password"
}

# Random steps
$steps = Get-Random -Minimum 18000 -Maximum 21000
Write-Host "Auto random target steps: $steps (18000-21000)"

# Limit steps
if ($steps -gt 30000) {
    Write-Host "Limit to 30000 for safety" -ForegroundColor Yellow
    $steps = 30000
}
if ($steps -lt 100) { $steps = 100 }

# Save config
$save = Read-Host "Save config? (y/n, default y)"
if ($save -ne "n") {
    $newConfig = @{
        account = $account
        password = $password
        minSteps = 18000
        maxSteps = 21000
    }
    $newConfig | ConvertTo-Json | Out-File $configPath -Encoding utf8
}

# Confirm
Write-Host ""
Write-Host "Pre-check: 1.Bind success 2.No real band bound" -ForegroundColor Cyan
Write-Host "Target steps: $steps"
$confirm = Read-Host "Confirm submit? (y/n, default y)"
if ($confirm -eq "n") {
    Write-Host "Cancelled"
    Read-Host "Press Enter"
    exit 0
}

Write-Host ""
Write-Host "Submitting..." -ForegroundColor Yellow

$body = @{
    user = $account
    password = $password
    step = $steps
}

try {
    $result = Invoke-RestMethod -Uri "https://www.xzzsb.xyz/sport/sd/proxy.php" -Method POST -Body $body -TimeoutSec 30
} catch {
    Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter"
    exit 1
}

Write-Host ""
if ($result.code -eq 200) {
    Write-Host "SUCCESS! Submitted $steps steps" -ForegroundColor Green
    Write-Host $result.msg -ForegroundColor Green
    Write-Host "Wait 3-10 minutes for sync, no re-submit today" -ForegroundColor Cyan

    $newRecord = @{
        date = $today
        steps = $steps
        time = (Get-Date -Format "HH:mm:ss")
    }
    $history += $newRecord
    $history | ConvertTo-Json | Out-File $historyPath -Encoding utf8
} else {
    Write-Host "FAILED" -ForegroundColor Red
    Write-Host $result.msg -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
