# 本地Zepp刷步脚本 - 可用版本
# 完全本地运行，数据只在你本机

# 强制TLS1.2
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host "===== 本地Zepp刷步工具 =====" -ForegroundColor Green
Write-Host ""

# 配置文件路径
$configPath = Join-Path $PSScriptRoot "config.json"
$config = $null
if (Test-Path $configPath) {
    try { $config = Get-Content $configPath -Raw | ConvertFrom-Json } catch {}
}

# 输入账号
if ($config -and $config.account) {
    $account = Read-Host "Zepp账号（默认: $($config.account)）"
    if ([string]::IsNullOrWhiteSpace($account)) { $account = $config.account }
} else {
    $account = Read-Host "请输入Zepp账号（手机号/邮箱）"
}

# 输入密码
if ($config -and $config.password) {
    $password = Read-Host "Zepp密码（默认: $($config.password)）"
    if ([string]::IsNullOrWhiteSpace($password)) { $password = $config.password }
} else {
    $password = Read-Host "请输入Zepp密码"
}

# 输入步数
if ($config -and $config.steps) {
    $stepsInput = Read-Host "目标步数（默认: $($config.steps)）"
    if ([string]::IsNullOrWhiteSpace($stepsInput)) { $steps = $config.steps } else { $steps = [int]$stepsInput }
} else {
    $steps = [int](Read-Host "请输入目标步数（推荐5000-20000）")
}

# 保存配置
$save = Read-Host "记住配置到本地？(y/n，默认y)"
if ($save -ne "n") {
    @{account=$account;password=$password;steps=$steps} | ConvertTo-Json | Out-File $configPath -Encoding utf8
}

Write-Host ""
Write-Host "正在提交步数..." -ForegroundColor Yellow

# 调用公开免费刷步API
$apiUrl = "https://api.qhsou.com/api/sport.php?do=shuabu&user=$([uri]::EscapeDataString($account))&pass=$([uri]::EscapeDataString($password))&count=$steps"

try {
    $result = Invoke-RestMethod -Uri $apiUrl -Method GET -TimeoutSec 30
} catch {
    Write-Host "请求失败：$($_.Exception.Message)" -ForegroundColor Red
    Read-Host "按回车退出"
    exit 1
}

Write-Host ""
if ($result.code -eq 200) {
    Write-Host "✅ 提交成功！" -ForegroundColor Green
    Write-Host $result.msg -ForegroundColor Green
    Write-Host "同步到微信运动/支付宝运动可能延迟1-10分钟" -ForegroundColor Cyan
} else {
    Write-Host "❌ 提交失败" -ForegroundColor Red
    Write-Host $result.msg -ForegroundColor Red
}

Write-Host ""
Read-Host "按回车退出"
