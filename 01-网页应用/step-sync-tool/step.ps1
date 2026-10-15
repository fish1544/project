# Step sync tool
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host "===== Zepp Step Sync Tool =====" -ForegroundColor Green
Write-Host ""

$configPath = Join-Path $PSScriptRoot "config.json"
$config = $null
if (Test-Path $configPath) {
    try { $config = Get-Content $configPath -Raw | ConvertFrom-Json } catch {}
}

# Account
if ($config -and $config.account) {
    $account = Read-Host "Zepp account (default: $($config.account))"
    if ([string]::IsNullOrWhiteSpace($account)) { $account = $config.account }
} else {
    $account = Read-Host "Enter Zepp account (phone/email)"
}

# Password
if ($config -and $config.password) {
    $password = Read-Host "Zepp password (press Enter to use saved)"
    if ([string]::IsNullOrWhiteSpace($password)) { $password = $config.password }
} else {
    $password = Read-Host "Enter Zepp password"
}

# Steps
if ($config -and $config.steps) {
    $stepsInput = Read-Host "Target steps (default: $($config.steps))"
    if ([string]::IsNullOrWhiteSpace($stepsInput)) { $steps = $config.steps } else { $steps = [int]$stepsInput }
} else {
    $steps = [int](Read-Host "Enter target steps (recommend 5000-20000)")
}

# Save config
$save = Read-Host "Save config locally? (y/n, default y)"
if ($save -ne "n") {
    @{account=$account;password=$password;steps=$steps} | ConvertTo-Json | Out-File $configPath -Encoding utf8
}

Write-Host ""
Write-Host "Submitting steps..." -ForegroundColor Yellow

# Pass parameters as body, PowerShell auto builds URL correctly
$apiParams = @{
    do = "shuabu"
    user = $account
    pass = $password
    count = $steps
}

try {
    $result = Invoke-RestMethod -Uri "https://api.qhsou.com/api/sport.php" -Method GET -Body $apiParams -TimeoutSec 30
} catch {
    Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
if ($result.code -eq 200) {
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host $result.msg -ForegroundColor Green
    Write-Host "It may take 1-10 minutes to sync to WeChat/Alipay" -ForegroundColor Cyan
} else {
    Write-Host "FAILED" -ForegroundColor Red
    Write-Host $result.msg -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
