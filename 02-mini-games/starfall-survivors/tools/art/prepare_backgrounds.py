"""处理 AI 生成的背景图：去除右下角水印。

- bg_ground.png：右下角水印区用水平镜像的邻近区域覆盖（地面纹理近似均匀，无痕）
- bg_sky.png：直接裁掉底部含水印的条带（山剪影略低，无伤大雅）
用法: python prepare_backgrounds.py <背景目录>
"""
import os
import sys

from PIL import Image

WM_W, WM_H = 300, 90  # 水印预估尺寸（略放大确保覆盖）


def clean_ground(path: str) -> None:
    im = Image.open(path).convert("RGB")
    w, h = im.size
    x0, y0 = w - WM_W, h - WM_H
    # 取左侧对称区域做源（水平镜像后宽度与目标一致）
    sx0, sy0 = x0 - 2 * WM_W, y0
    src = im.crop((sx0, sy0, sx0 + WM_W, sy0 + WM_H)).transpose(Image.FLIP_LEFT_RIGHT)
    im.paste(src, (x0, y0))
    im.save(path)
    print("cleaned watermark (mirror):", path, im.size)


def clean_sky(path: str) -> None:
    im = Image.open(path).convert("RGB")
    w, h = im.size
    im = im.crop((0, 0, w, h - WM_H))
    im.save(path)
    print("cleaned watermark (crop):", path, im.size)


def main() -> None:
    bg_dir = sys.argv[1] if len(sys.argv) > 1 else "."
    clean_ground(os.path.join(bg_dir, "bg_ground.png"))
    clean_sky(os.path.join(bg_dir, "bg_sky.png"))


if __name__ == "__main__":
    main()
