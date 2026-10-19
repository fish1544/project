#!/usr/bin/env bash
# 星陨幸存者 - 像素美术资产管线（全自动，无头运行）
# 流程:
#   1. Python 程序化生成 PNG -> Aseprite CLI 转 .aseprite 源文件 -> Aseprite CLI 导出最终 PNG
#   2. 中文字体子集化：收集工程实际使用字符 -> Noto Sans SC 实例化 Regular -> 子集化
# 用法: bash tools/art/build.sh
set -euo pipefail

ART="$(cd "$(dirname "$0")" && pwd)"
PROJECT="$(dirname "$(dirname "$ART")")"
SPRITES="$PROJECT/assets/sprites"
SRC="$SPRITES/src"
FONTS="$PROJECT/assets/fonts"

PYTHON_BIN="${PYTHON_BIN:-python}"
ASEPRITE_BIN="${ASEPRITE_BIN:-E:/Aseprite/Aseprite/aseprite.exe}"
# 可变字体源（按本机实际路径改）；缺失时跳过字体子集化，不阻断精灵构建
VF_FONT_SRC="${VF_FONT_SRC:-C:/Windows/Fonts/NotoSansSC-VF.ttf}"

if [ ! -x "$ASEPRITE_BIN" ] && [ ! -f "$ASEPRITE_BIN" ]; then
  echo "ERROR: 找不到 Aseprite: $ASEPRITE_BIN（可设 ASEPRITE_BIN 环境变量指定）" >&2
  exit 1
fi

mkdir -p "$SRC" "$FONTS"
"$PYTHON_BIN" "$ART/generate.py" "$SRC"

for f in "$SRC"/*.png; do
  base="$(basename "$f" .png)"
  "$ASEPRITE_BIN" -b "$f" --save-as "$SRC/$base.aseprite" > /dev/null
  "$ASEPRITE_BIN" -b "$SRC/$base.aseprite" --save-as "$SPRITES/$base.png" > /dev/null
  echo "built $base.png"
done
echo "art build done -> $SPRITES"

# ---- 中文字体子集化（可选步骤：缺 python 包或字体源时跳过）----
if [ -f "$VF_FONT_SRC" ] && "$PYTHON_BIN" -c "import fontTools" 2>/dev/null; then
  "$PYTHON_BIN" "$ART/collect_chars.py" "$PROJECT" > /dev/null
  REG_TTF="$FONTS/.noto_regular.tmp.ttf"
  "$PYTHON_BIN" -m fontTools.varLib.instancer "$VF_FONT_SRC" wght=400 -o "$REG_TTF" > /dev/null
  "$PYTHON_BIN" -m fontTools.subset "$REG_TTF" \
    --text-file="$FONTS/_chars.txt" \
    --output-file="$FONTS/noto_sc_cn.ttf" > /dev/null
  rm -f "$REG_TTF"
  size=$(stat -c%s "$FONTS/noto_sc_cn.ttf" 2>/dev/null || wc -c < "$FONTS/noto_sc_cn.ttf")
  echo "built noto_sc_cn.ttf ($size bytes)"
else
  echo "SKIP 字体子集化（缺 $VF_FONT_SRC 或 fontTools 包）"
fi
