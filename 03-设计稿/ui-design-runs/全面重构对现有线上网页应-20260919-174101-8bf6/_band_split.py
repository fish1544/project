# -*- coding: utf-8 -*-
"""把 canvas-a / canvas-b 截图切成横向条带便于逐段查看。"""
from PIL import Image
import os

BASE = r"D:\Project\ui-design-runs\全面重构对现有线上网页应-20260919-174101-8bf6\shots"
os.makedirs(BASE + r"\doc-bands", exist_ok=True)

for name, bands in (("canvas-a-698.png", 4), ("canvas-b-698.png", 3)):
    p = os.path.join(BASE, name)
    im = Image.open(p)
    w, h = im.size
    bh = h // bands
    for i in range(bands):
        top = i * bh
        bottom = h if i == bands - 1 else (i + 1) * bh
        crop = im.crop((0, top, w, bottom))
        out = os.path.join(BASE, "doc-bands", "%s-%d.png" % (name.split(".")[0], i + 1))
        crop.save(out)
        print(out, crop.size)
