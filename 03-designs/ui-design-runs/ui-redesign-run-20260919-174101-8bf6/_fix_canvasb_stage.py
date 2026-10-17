# -*- coding: utf-8 -*-
"""canvas-b：把 KEY-SCREENS 占位块换成带机身的 staged 手机形态。"""
import io, re

BASE = r"D:\Project\ui-design-runs\ui-redesign-run-20260919-174101-8bf6"
path = BASE + r"\doc\canvas-b.html"
with io.open(BASE + r"\doc\img\p01.b64.txt", "r", encoding="utf-8") as f:
    uri = f.read().strip()
with io.open(path, "r", encoding="utf-8") as f:
    html = f.read()

start = html.index("<!-- KEY-SCREENS-START -->")
end = html.index("<!-- KEY-SCREENS-END -->", start) + len("<!-- KEY-SCREENS-END -->")
block = (
    "<!-- KEY-SCREENS-START -->\n"
    '    <div class="ui-stage ui-stage-row" style="--phone:22%">\n'
    "      <figure>\n"
    '        <img src="' + uri + '" alt="工作台首页">\n'
    '        <figcaption class="device-cap"><b>她随手记、随手计时，说明书自己长出来</b>'
    "工作台首屏就答「今天该做什么」；语音、计时、复盘在底部一条主操作上汇合。</figcaption>\n"
    "      </figure>\n"
    "    </div>\n"
    "    <!-- KEY-SCREENS-END -->"
)
html = html[:start] + block + html[end:]
with io.open(path, "w", encoding="utf-8") as f:
    f.write(html)
print("replaced KEY-SCREENS block in canvas-b")
