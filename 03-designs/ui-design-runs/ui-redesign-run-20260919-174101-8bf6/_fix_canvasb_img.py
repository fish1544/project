# -*- coding: utf-8 -*-
"""canvas-b KEY-SCREENS 占位 img 注入 p01 截图 URI，避免空 src 破碎图。"""
import io

BASE = r"D:\Project\ui-design-runs\ui-redesign-run-20260919-174101-8bf6"
path = BASE + r"\doc\canvas-b.html"
with io.open(BASE + r"\doc\img\p01.b64.txt", "r", encoding="utf-8") as f:
    uri = f.read().strip()
with io.open(path, "r", encoding="utf-8") as f:
    html = f.read()
old = '<img src="" alt="">'
assert html.count(old) == 1, "占位 img 数量异常: %d" % html.count(old)
html = html.replace(old, '<img src="%s" alt="关键界面占位（ship 将替换为实机截图）">' % uri)
with io.open(path, "w", encoding="utf-8") as f:
    f.write(html)
print("patched canvas-b")
