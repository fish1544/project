"""生成 HUD 用的全屏暗角遮罩（中心透明、边缘渐暗）。

同时把 AI 背景图压缩成适合打包的尺寸。
用法: python gen_overlay.py <背景目录>
"""
import math
import os
import sys

from PIL import Image

VIG_W, VIG_H = 960, 540


def gen_vignette(path: str) -> None:
    im = Image.new("RGBA", (VIG_W, VIG_H), (0, 0, 0, 0))
    px = im.load()
    cx, cy = VIG_W / 2.0, VIG_H / 2.0
    max_d = math.hypot(cx, cy)
    for y in range(VIG_H):
        for x in range(VIG_W):
            d = math.hypot(x - cx, y - cy) / max_d
            # 0.55 之后开始渐暗，边角约 150/255
            t = max(0.0, (d - 0.55) / 0.45)
            a = int(min(1.0, t * t * 1.15) * 150)
            px[x, y] = (4, 6, 14, a)
    im.save(path)
    print("wrote vignette:", path, im.size, os.path.getsize(path) // 1024, "KB")


def gen_mote(path: str) -> None:
    """漂浮星尘：8x8 柔和光点（中心亮、边缘透明）。"""
    size = 8
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = im.load()
    c = (size - 1) / 2.0
    for y in range(size):
        for x in range(size):
            d = math.hypot(x - c, y - c) / (size / 2.0)
            a = int(max(0.0, 1.0 - d) ** 1.6 * 255)
            px[x, y] = (200, 226, 255, a)
    im.save(path)
    print("wrote mote:", path, im.size)


def shrink_bg(path: str, max_side: int) -> None:
    """背景图压到合理尺寸：地面 512 平铺足够，天空 1024 宽足够。"""
    im = Image.open(path).convert("RGB")
    w, h = im.size
    if max(w, h) <= max_side:
        print("keep (already small):", path, im.size)
        return
    scale = max_side / float(max(w, h))
    im = im.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    im.save(path, optimize=True)
    print("resized:", path, im.size, os.path.getsize(path) // 1024, "KB")


def main() -> None:
    bg_dir = sys.argv[1] if len(sys.argv) > 1 else "."
    gen_vignette(os.path.join(bg_dir, "vignette.png"))
    gen_mote(os.path.join(bg_dir, "mote.png"))
    shrink_bg(os.path.join(bg_dir, "bg_ground.png"), 512)
    shrink_bg(os.path.join(bg_dir, "bg_sky.png"), 1024)


if __name__ == "__main__":
    main()
