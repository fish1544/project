"""收集工程中实际使用到的字符，供字体子集化使用。

扫描项目内 scripts/ scenes/ 下全部 .gd/.tscn/.cfg 文本，
输出去重后的字符清单（含 ASCII 可打印字符与标点）。
"""
import os
import sys

PROJECT = sys.argv[1] if len(sys.argv) > 1 else "."
SCAN_DIRS = [os.path.join(PROJECT, "scripts"), os.path.join(PROJECT, "scenes")]
SCAN_FILES = [
    os.path.join(PROJECT, "project.godot"),
    os.path.join(PROJECT, "export_presets.cfg"),
]

chars = set()

# 基础 ASCII：数字、字母、常用符号标点
for cp in range(0x20, 0x7F):
    chars.add(chr(cp))
chars.update("，。、；：？！""''（）《》【】…—·～￥【】+-%/×÷ ")

for root_dir in SCAN_DIRS:
    for dirpath, _dirs, files in os.walk(root_dir):
        for f in files:
            if f.endswith((".gd", ".tscn", ".tres")):
                path = os.path.join(dirpath, f)
                with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                    chars.update(fh.read())
for path in SCAN_FILES:
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            chars.update(fh.read())

# HUD 用的可选符号
chars.update("◆●▲★☆■□♥")

text = "".join(sorted(chars))
with open(os.path.join(PROJECT, "assets", "fonts", "_chars.txt"), "w", encoding="utf-8") as fh:
    fh.write(text)
print("chars collected:", len(chars))
print(text)
