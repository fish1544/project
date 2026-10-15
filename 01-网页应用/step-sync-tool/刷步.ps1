# 本地Zepp刷步脚本 - PowerShell版本
# 完全本地运行，无跨域限制，数据不上传

Write-Host "===== 本地Zepp刷步工具 =====" -ForegroundColor Green
Write-Host ""

# 读取已保存的配置（如果有的话）
$configPath = Join-Path $PSScriptRoot "config.json"
$config = $null
if (Test-Path $configPath) {
    try { $config = Get-Content $configPath -Raw | ConvertFrom-Json } catch {}
}

# 输入账号
if ($config -and $config.account) {
    $account = Read-Host "请输入Zepp账号（默认: $($config.account)）"
    if ([string]::IsNullOrWhiteSpace($account)) { $account = $config.account }
} else {
    $account = Read-Host "请输入Zepp账号（手机号/邮箱）"
}

# 输入密码
if ($config -and $config.password) {
    $password = Read-Host "请输入Zepp密码（默认: $($config.password)）"
    if ([string]::IsNullOrWhiteSpace($password)) { $password = $config.password }
} else {
    $password = Read-Host "请输入Zepp密码"
}

# 输入步数
if ($config -and $config.steps) {
    $stepsInput = Read-Host "请输入目标步数（默认: $($config.steps)）"
    if ([string]::IsNullOrWhiteSpace($stepsInput)) { $steps = $config.steps } else { $steps = [int]$stepsInput }
} else {
    $steps = [int](Read-Host "请输入目标步数（推荐5000-20000）")
}

# 保存配置
$saveConfig = Read-Host "是否记住账号密码（仅存在本地）？(y/n，默认y)"
if ($saveConfig -ne "n") {
    $config = @{
        account = $account
        password = $password
        steps = $steps
    } | ConvertTo-Json
    $config | Out-File -FilePath $configPath -Encoding utf8
}

Write-Host ""
Write-Host "正在登录Zepp..." -ForegroundColor Yellow

# 登录请求
$headers = @{
    "Content-Type" = "application/json"
    "User-Agent" = "Zepp/6.0.0 (iPhone; iOS 17.0; Scale/3.00)"
}
$loginBody = @{
    email = $account
    password = $password
    os_model = "iPhone15,2"
    app_version = "6.9.0"
} | ConvertTo-Json

try {
    $loginResult = Invoke-RestMethod -Uri "https://api-mifit.cn/user/auth/sign_in" -Method POST -Headers $headers -Body $loginBody -TimeoutSec 30
} catch {
    Write-Host "登录失败：$($_.Exception.Message)" -ForegroundColor Red
    Read-Host "按回车退出"
    exit 1
}

if (-not $loginResult.token) {
    Write-Host "登录失败：未获取到授权token，请检查账号密码" -ForegroundColor Red
    Read-Host "按回车退出"
    exit 1
}

$token = $loginResult.token
$userId = $loginResult.user_id
Write-Host "登录成功，正在提交步数..." -ForegroundColor Yellow

# 今日日期
$today = Get-Date
$dateStr = $today.ToString("yyyy-MM-dd")

# 提交步数
$stepHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
    "User-Agent" = "Zepp/6.0.0 (iPhone; iOS 17.0; Scale/3.00)"
}
$stepBody = @{
    date = $dateStr
    steps = $steps
} | ConvertTo-Json

try {
    $stepResult = Invoke-RestMethod -Uri "https://api-mifit.cn/v1/me/activity/step?user_id=$userId" -Method POST -Headers $stepHeaders -Body $stepBody -TimeoutSec 30
} catch {
    Write-Host "步数提交失败：$($_.Exception.Message)" -ForegroundColor Red
    Read-Host "按回车退出"
    exit 1
}

Write-Host ""
Write-Host "✅ 成功！已提交 $steps 步" -ForegroundColor Green
Write-Host "同步到微信运动/支付宝运动可能延迟1-10分钟" -ForegroundColor Cyan
Write-Host ""
Read-Host "按回车退出"
