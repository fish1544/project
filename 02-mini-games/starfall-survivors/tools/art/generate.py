"""星陨幸存者 - 像素资产生成器（程序化生成，无需手绘）。

用法: python generate.py <输出目录>
产出: player.png / enemy.png / gem.png / projectile.png / icon.png（RGBA PNG，256x256 应用图标）
设计原则: 暗色描边 + 高饱和主体色 + 少量高光，16x16 / 8x8 对齐网格。
"""
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
    def __init__(self, w: int, h: int):
        self.w = w
        self.h = h
        self.px = [[(0, 0, 0, 0)] * w for _ in range(h)]

    def rect(self, x: int, y: int, w: int, h: int, color) -> None:
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                if 0 <= xx < self.w and 0 <= yy < self.h:
                    self.px[yy][xx] = color

    def save(self, path: str) -> None:
        assert len(self.px) == self.h, "行数不符"
        for row in self.px:
            assert len(row) == self.w, "列数不符"
        write_png(path, self.w, self.h, self.px)


def draw_player() -> Canvas:
    c = Canvas(16, 16)
    dark = (20, 24, 40, 255)
    cyan = (76, 201, 240, 255)
    gold = (255, 209, 102, 255)
    white = (248, 249, 250, 255)
    c.rect(4, 1, 8, 11, dark)
    c.rect(5, 2, 6, 9, cyan)
    c.rect(6, 4, 4, 2, gold)
    c.rect(5, 9, 6, 1, white)
    c.rect(3, 6, 1, 3, cyan)
    c.rect(12, 6, 1, 3, cyan)
    c.rect(3, 6, 1, 1, dark)
    c.rect(12, 6, 1, 1, dark)
    c.rect(5, 12, 2, 2, cyan)
    c.rect(9, 12, 2, 2, cyan)
    c.rect(5, 14, 2, 1, dark)
    c.rect(9, 14, 2, 1, dark)
    return c


def draw_enemy() -> Canvas:
    c = Canvas(16, 16)
    dark = (60, 12, 20, 255)
    red = (229, 75, 74, 255)
    white = (248, 249, 250, 255)
    black = (20, 20, 24, 255)
    c.rect(3, 6, 10, 7, dark)
    c.rect(4, 7, 8, 5, red)
    c.rect(5, 6, 6, 1, red)
    c.rect(6, 9, 2, 2, white)
    c.rect(10, 9, 2, 2, white)
    c.rect(6, 10, 1, 1, black)
    c.rect(11, 10, 1, 1, black)
    return c


def draw_dasher() -> Canvas:
    """冲刺者：紫红色箭头形，蓄势待发的尖锐轮廓。"""
    c = Canvas(16, 16)
    dark = (40, 12, 48, 255)
    purple = (178, 102, 255, 255)
    light = (226, 190, 255, 255)
    c.rect(7, 0, 2, 16, dark)      # 中轴
    c.rect(2, 2, 12, 12, dark)     # 头部外框
    c.rect(4, 4, 8, 8, dark)
    c.rect(3, 3, 10, 10, purple)
    c.rect(5, 5, 6, 6, purple)
    c.rect(6, 2, 4, 12, purple)    # 箭头
    c.rect(7, 1, 2, 14, light)
    c.rect(6, 6, 2, 2, (248, 249, 250, 255))  # 眼
    c.rect(6, 10, 2, 2, (248, 249, 250, 255))
    return c


def draw_shooter() -> Canvas:
    """远程弹幕手：青绿色圆环 + 炮口，谨慎的射手轮廓。"""
    c = Canvas(16, 16)
    dark = (12, 48, 56, 255)
    teal = (56, 200, 190, 255)
    light = (170, 240, 235, 255)
    c.rect(3, 3, 10, 10, dark)
    c.rect(4, 4, 8, 8, teal)
    c.rect(6, 6, 4, 4, dark)
    c.rect(7, 7, 2, 2, light)
    c.rect(0, 5, 3, 6, dark)       # 左炮
    c.rect(0, 6, 2, 4, teal)
    c.rect(13, 5, 3, 6, dark)      # 右炮
    c.rect(14, 6, 2, 4, teal)
    return c


def draw_enemy_bullet() -> Canvas:
    """远程敌弹：8x8 青绿能量球，边缘暗描边。"""
    c = Canvas(8, 8)
    dark = (8, 40, 48, 255)
    teal = (80, 220, 200, 255)
    light = (200, 250, 245, 255)
    c.rect(2, 0, 4, 1, dark)
    c.rect(1, 1, 6, 1, dark)
    c.rect(0, 2, 8, 4, dark)
    c.rect(1, 6, 6, 1, dark)
    c.rect(2, 7, 4, 1, dark)
    c.rect(2, 1, 4, 1, teal)
    c.rect(1, 2, 6, 4, teal)
    c.rect(2, 6, 4, 1, teal)
    c.rect(2, 2, 3, 3, light)
    return c


def draw_gem() -> Canvas:
    c = Canvas(8, 8)
    dark = (20, 60, 30, 255)
    green = (154, 205, 50, 255)
    light = (220, 240, 180, 255)
    c.rect(3, 0, 2, 1, dark)
    c.rect(2, 1, 4, 1, dark)
    c.rect(3, 1, 2, 1, green)
    c.rect(1, 2, 6, 1, dark)
    c.rect(2, 2, 4, 1, green)
    c.rect(0, 3, 8, 1, dark)
    c.rect(1, 3, 6, 1, green)
    c.rect(2, 3, 1, 1, light)
    c.rect(1, 4, 6, 1, dark)
    c.rect(2, 4, 4, 1, green)
    c.rect(2, 5, 4, 1, dark)
    c.rect(3, 5, 2, 1, green)
    c.rect(3, 6, 2, 1, dark)
    return c


def draw_projectile() -> Canvas:
    c = Canvas(8, 8)
    dark = (133, 87, 10, 255)
    yellow = (255, 209, 102, 255)
    c.rect(2, 1, 4, 1, dark)
    c.rect(3, 1, 2, 1, yellow)
    c.rect(1, 2, 6, 1, dark)
    c.rect(2, 2, 4, 1, yellow)
    c.rect(0, 3, 8, 1, dark)
    c.rect(1, 3, 6, 1, yellow)
    c.rect(0, 4, 8, 1, dark)
    c.rect(1, 4, 6, 1, yellow)
    c.rect(1, 5, 6, 1, dark)
    c.rect(2, 5, 4, 1, yellow)
    c.rect(2, 6, 4, 1, dark)
    return c


def draw_icon() -> Canvas:
    """256x256 应用图标：星陨之夜（夜空 + 金星 + 幸存者剪影）。"""
    import math

    c = Canvas(256, 256)
    # 夜空渐变（深蓝紫）
    top = (14, 18, 36, 255)
    bottom = (48, 24, 76, 255)
    for y in range(256):
        t = y / 255.0
        c.rect(0, y, 256, 1, tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(4)))
    # 远景星点
    for sx, sy in [(28, 40), (210, 30), (40, 200), (226, 180), (70, 96), (190, 86), (128, 236)]:
        c.rect(sx, sy, 2, 2, (248, 249, 250, 110))
    # 主星：8 角金星（暗金描边 + 金色主体 + 高光）
    cx, cy, R = 128, 118, 74
    star_dark = (133, 87, 10, 255)
    star_gold = (255, 209, 102, 255)
    star_hi = (255, 236, 179, 255)
    for yy in range(256):
        for xx in range(256):
            dx, dy = xx - cx, yy - cy
            r = math.hypot(dx, dy)
            if r > R + 4:
                continue
            ang = math.atan2(dy, dx)
            frac = ((ang + math.pi / 4) % (math.pi / 4)) - math.pi / 4
            rmax = R * math.cos(math.pi / 8) / math.cos(frac)
            if r <= rmax + 4 and r > rmax - 2:
                c.px[yy][xx] = star_dark  # 描边
            elif r <= rmax - 2:
                c.px[yy][xx] = star_gold
    # 星心高光
    c.rect(cx - 14, cy - 14, 18, 18, star_hi)
    c.rect(cx - 24, cy - 24, 10, 10, star_gold)
    # 星陨轨迹（左上方向渐隐）
    for i in range(9):
        tx, ty = cx - 84 - i * 9, cy - 78 - i * 8
        c.rect(tx, ty, max(1, 6 - i // 2), max(1, 6 - i // 2), (255, 209, 102, 200 - i * 20))
    # 幸存者剪影（底部中央，青色机甲）
    dark = (16, 20, 34, 255)
    cyan = (76, 201, 240, 255)
    gold = (255, 209, 102, 255)
    c.rect(117, 172, 22, 34, dark)   # 身体
    c.rect(119, 174, 18, 30, cyan)
    c.rect(124, 180, 8, 6, gold)     # 胸口能量核
    c.rect(112, 172, 5, 12, dark)    # 左臂
    c.rect(139, 172, 5, 12, dark)    # 右臂
    c.rect(142, 176, 14, 5, dark)    # 枪
    c.rect(143, 177, 12, 3, gold)
    c.rect(121, 206, 5, 12, dark)    # 左腿
    c.rect(130, 206, 5, 12, dark)    # 右腿
    # 宝石（右下）
    gd = (24, 60, 110, 255)
    gb = (90, 200, 250, 255)
    c.rect(196, 206, 14, 4, gd)
    c.rect(199, 202, 8, 14, gd)
    c.rect(201, 204, 4, 10, gb)
    c.rect(197, 205, 2, 2, (248, 249, 250, 200))
    return c


def main() -> None:
    out = sys.argv[1] if len(sys.argv) > 1 else "."
    os.makedirs(out, exist_ok=True)
    painters = {
        "player": draw_player,
        "enemy": draw_enemy,
        "dasher": draw_dasher,
        "shooter": draw_shooter,
        "gem": draw_gem,
        "projectile": draw_projectile,
        "enemy_bullet": draw_enemy_bullet,
        "icon": draw_icon,
    }
    for name, fn in painters.items():
        fn().save(os.path.join(out, name + ".png"))
        print("wrote " + name + ".png")


if __name__ == "__main__":
    main()
