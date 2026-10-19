#!/usr/bin/env bash
# 星陨幸存者 - 像素美术资产管线（全自动，无头运行）
# 流程: Python 程序化生成 -> Aseprite CLI 转 .aseprite 源文件 -> Aseprite CLI 导出最终 PNG
# 用法: bash tools/art/build.sh
set -euo pipefail

ART="$(cd "$(dirname "$0")" && pwd)"
PROJECT="$(dirname "$(dirname "$ART")")"
SPRITES="$PROJECT/assets/sprites"
SRC="$SPRITES/src"

PYTHON_BIN="${PYTHON_BIN:-python}"
ASEPRITE_BIN="${ASEPRITE_BIN:-E:/Aseprite/Aseprite/aseprite.exe}"

if [ ! -x "$ASEPRITE_BIN" ] && [ ! -f "$ASEPRITE_BIN" ]; then
  echo "ERROR: 找不到 Aseprite: $ASEPRITE_BIN（可设 ASEPRITE_BIN 环境变量指定）" >&2
  exit 1
fi

mkdir -p "$SRC"
"$PYTHON_BIN" "$ART/generate.py" "$SRC"

for f in "$SRC"/*.png; do
  base="$(basename "$f" .png)"
  "$ASEPRITE_BIN" -b "$f" --save-as "$SRC/$base.aseprite" > /dev/null
  "$ASEPRITE_BIN" -b "$SRC/$base.aseprite" --save-as "$SPRITES/$base.png" > /dev/null
  echo "built $base.png"
done
echo "art build done -> $SPRITES"
