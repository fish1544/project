# 生成单文件版 SOP — 手机离线可用
# 用法: powershell -File build-standalone.ps1

$src = "d:\Project\personal-sop\index.html"
$out = "d:\Project\personal-sop\standalone.html"
$base = "d:\Project\personal-sop"

Write-Host "Reading main HTML..." -ForegroundColor Cyan
$html = Get-Content $src -Raw -Encoding UTF8

# 1. Replace local font @font-face with system font stack
Write-Host "Replacing fonts with system stack..." -ForegroundColor Cyan
$html = $html -replace "(?s)@font-face \{[^}]*\}\s*", ""

# 2. Replace font-family references
$html = $html -replace "font-family: 'Outfit', sans-serif;", "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;"
$html = $html -replace "font-family: 'InstrumentSans', -apple-system, BlinkMacSystemFont, sans-serif;", "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;"
$html = $html -replace "font-family: 'InstrumentSans', sans-serif;", "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;"
$html = $html -replace "font-family: 'JetBrainsMono', monospace;", "font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;"

# 3. Inline all local JS files
$jsFiles = @(
    "js/schedule-data.js",
    "js/cr-data.js",
    "js/toolbox-data.js",
    "js/schedule-render.js",
    "js/cr-work-render.js",
    "js/toolbox-render.js",
    "js/editable-system.js",
    "js/realtime-system.js",
    "js/finance-system.js",
    "js/cr-work-v2.js",
    "js/data-center.js"
)

Write-Host "Inlining JS files..." -ForegroundColor Cyan
foreach ($jsFile in $jsFiles) {
    $jsPath = Join-Path $base $jsFile
    if (Test-Path $jsPath) {
        $jsContent = Get-Content $jsPath -Raw -Encoding UTF8
        $scriptTag = "<script src=`"$jsFile`"></script>"
        $inlineTag = "<script>`n$jsContent`n</script>"
        $html = $html.Replace($scriptTag, $inlineTag)
        Write-Host "  Inlined: $jsFile" -ForegroundColor Green
    } else {
        Write-Host "  NOT FOUND: $jsFile" -ForegroundColor Yellow
    }
}

# 4. Inline local echarts (fully offline, self-contained single file)
$echartsPath = Join-Path $base "lib/echarts.min.js"
if (Test-Path $echartsPath) {
    $echarts = Get-Content $echartsPath -Raw -Encoding UTF8
    $html = $html.Replace('<script src="lib/echarts.min.js"></script>', "<script>`n$echarts`n</script>")
    Write-Host "ECharts inlined (fully offline)" -ForegroundColor Green
} else {
    Write-Host "echarts.min.js not found, falling back to CDN" -ForegroundColor Yellow
    $html = $html.Replace(
        '<script src="lib/echarts.min.js"></script>',
        '<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>'
    )
}

# 5. Write output
Write-Host "Writing standalone file..." -ForegroundColor Cyan
$html | Out-File $out -Encoding UTF8 -NoNewline

$size = (Get-Item $out).Length / 1KB
Write-Host ""
Write-Host "Done! Standalone file: $out" -ForegroundColor Green
Write-Host "Size: $([math]::Round($size, 0)) KB" -ForegroundColor Green
Write-Host ""
Write-Host "How to use on phone:" -ForegroundColor Cyan
Write-Host "  1. Transfer standalone.html to your phone (WeChat/QQ/AirDrop/USB)" -ForegroundColor White
Write-Host "  2. Open with any browser (Chrome/Safari/etc.)" -ForegroundColor White
Write-Host "  3. Works offline - no computer needed!" -ForegroundColor White
Write-Host "  4. ECharts need internet, other features work fully offline" -ForegroundColor White
