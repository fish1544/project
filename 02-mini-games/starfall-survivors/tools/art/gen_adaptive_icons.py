"""生成 Android 自适应图标素材（ foreground + background，各 432x432）。

用法: python gen_adaptive_icons.py <输出目录>
产出: adaptive_foreground.png（透明底金星，安全区 66% 内）/ adaptive_background.png（夜空渐变底）
"""
import math
import os
import struct
import sys
import zlib


def _chunk(tag: bytes, data: bytes) -> bytes:
    payload = tag + data
    return struct.pack(">I", len(data)) + payload + struct.pack(">I", zlib.crc32(payload) & 0xFFFFFFFF)


def write_png(path: str, width: int, height: int, rows) -> None:
    raw = b"".join(b"\x00" + b"".join(bytes(px) for px in row) for row in rows)
    blob = (
        b"\x89PNG\r\n\x1a\n"
        + _chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
        + _chunk(b"IDAT", zlib.compress(raw))
        + _chunk(b"IEND", b"")
    )
    with open(path, "wb") as f:
        f.write(blob)


class Canvas:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.px = [[(0, 0, 0, 0)] * w for _ in range(h)]

    def rect(self, x, y, w, h, color):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                if 0 <= xx < self.w and 0 <= yy < self.h:
                    self.px[yy][xx] = color

    def px_set(self, x, y, color):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[y][x] = color

    def save(self, path):
        write_png(path, self.w, self.h, self.px)


def star_polygon(c: Canvas, cx: int, cy: int, r: int, outline: int, fill) -> None:
    """在画布上绘制 n=8 的星形多边形，外扩 outline 像素描边。"""
    for yy in range(c.h):
        for xx in range(c.w):
            dx, dy = xx - cx, yy - cy
            dist = math.hypot(dx, dy)
            if dist > r + outline:
                continue
            ang = math.atan2(dy, dx)
            frac = ((ang + math.pi / 4) % (math.pi / 4)) - math.pi / 8
            bound = r * math.cos(math.pi / 8) / math.cos(frac)
            if dist <= bound + outline and dist > bound - outline:
                c.px_set(xx, yy, outline if isinstance(outline, tuple) else (0, 0, 0, 0))
            elif dist <= bound - outline:
                c.px_set(xx, yy, fill)


def gen_foreground() -> Canvas:
    c = Canvas(432, 432)
    cx, cy, r = 216, 216, 118  # 安全区半径约 143px，留出系统裁剪余量
    dark = (133, 87, 10, 255)
    gold = (255, 209, 102, 255)
    hi = (255, 236, 179, 255)
    star_polygon(c, cx, cy, r, 5, dark)
    star_polygon(c, cx, cy, r - 5, 0, gold)
    # 高光核心
    for yy in range(cy - 26, cy + 26):
        for xx in range(cx - 26, cx + 26):
            if math.hypot(xx - cx, yy - cy) <= 24:
                c.px_set(xx, yy, hi)
    # 星核内的玩家微剪影（品牌辨识度）
    dark_sil = (16, 20, 34, 255)
    cyan = (76, 201, 240, 255)
    c.rect(cx - 8, cy + 8, 16, 22, dark_sil)
    c.rect(cx - 6, cy + 10, 12, 18, cyan)
    c.rect(cx - 13, cy + 8, 5, 10, dark_sil)
    c.rect(cx + 8, cy + 8, 5, 10, dark_sil)
    return c


def gen_background() -> Canvas:
    c = Canvas(432, 432)
    top = (14, 18, 36, 255)
    bottom = (48, 24, 76, 255)
    for y in range(432):
        t = y / 431.0
        c.rect(0, y, 432, 1, tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(4)))
    # 低亮度装饰星点
    for sx, sy in [(60, 90), (370, 70), (90, 340), (350, 320), (216, 40)]:
        c.rect(sx, sy, 3, 3, (248, 249, 250, 90))
    return c


def main() -> None:
    out = sys.argv[1] if len(sys.argv) > 1 else "."
    os.makedirs(out, exist_ok=True)
    gen_foreground().save(os.path.join(out, "adaptive_foreground.png"))
    print("wrote adaptive_foreground.png")
    gen_background().save(os.path.join(out, "adaptive_background.png"))
    print("wrote adaptive_background.png")


if __name__ == "__main__":
    main()
