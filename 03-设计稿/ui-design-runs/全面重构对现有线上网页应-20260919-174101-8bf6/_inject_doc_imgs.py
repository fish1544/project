# -*- coding: utf-8 -*-
"""把 pack_img 产出的 b64 文本注入 cover.html / canvas-a.html 占位符。"""
import io

BASE = r"D:\Project\ui-design-runs\全面重构对现有线上网页应-20260919-174101-8bf6"
IMG = BASE + r"\doc\img"


def read_uri(name: str) -> str:
    with io.open(IMG + "\\" + name + ".b64.txt", "r", encoding="utf-8") as f:
        return f.read().strip()


def patch(path: str, repls: dict) -> None:
    with io.open(path, "r", encoding="utf-8") as f:
        html = f.read()
    for token, uri in repls.items():
        if token not in html:
            raise SystemExit("token missing: %s in %s" % (token, path))
        html = html.replace(token, uri)
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print("patched", path)


cover = BASE + r"\doc\cover.html"
patch(cover, {
    "__COVER_ART__": read_uri("paper-texture"),
    "__SHOT1__": read_uri("p01"),
    "__SHOT2__": read_uri("p03"),
    "__SHOT3__": read_uri("p05"),
})

ca = BASE + r"\doc\canvas-a.html"
patch(ca, {
    "__IMG_RHYTHM__": read_uri("rhythm-art"),
    "__IMG_MANUAL__": read_uri("manual-art"),
})
print("done")
