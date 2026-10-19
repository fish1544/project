# 星陨幸存者 Starfall Survivors

Godot 4.7 + Aseprite 全栈开发的 **Survivors-like 肉鸽割草**游戏。目标平台：TapTap（Android / H5）。

## 玩法（当前版本 v0.2）

- **主菜单 / 结算**：开始界面 + 战绩结算（存活时间/击杀/等级/波次），Enter 快速重开
- **WASD / 方向键移动**，角色自动攻击范围内最近的敌人
- **三种敌种**（随波次解锁）：追击者（直线）、冲刺者（蓄力白闪后高速冲撞）、弹幕手（保持距离发射能量弹）
- **波次系统**：每 30 秒一波，敌人血量/速度递增、生成加速、敌种混合升级，波次推进有仪式感震屏
- **升级三选一**：每次升级暂停并弹出 3 张强化卡（攻速/伤害/移速/多弹丸/生命上限/磁吸/索敌，共 7 种 Buff）
- **打击反馈**：屏幕震动、受击白闪+击退、命中火花、伤害飘字、死亡爆裂粒子、受击红屏
- 敌人死亡掉落经验宝石，磁吸拾取，经验满升级
- UI：HP/XP 进度条、计时、波次、击杀数实时显示

## 运行

```bash
# 需要 Godot 4.7.x（已用 4.7.2.stable 验证）
godot --path .            # 运行游戏（从主菜单开始）
godot --path . --editor   # 打开编辑器
```

## 自动化测试

```bash
godot --headless --path . --import   # 首次运行先导入资源
godot --headless --path . res://scenes/test/test_runner.tscn
```

26 项断言全过：核心循环 10 项 + Buff 池/三选一面板流程/冲刺者状态机/远程弹幕/难度缩放/特效自毁/震屏复位/主菜单加载。

## 像素美术管线（一条命令全自动重建）

```bash
bash tools/art/build.sh                       # 全部精灵（含三种敌种/敌弹/图标）
python tools/art/gen_adaptive_icons.py assets/icons   # Android 自适应图标
```

流程：Python 程序化生成（`tools/art/generate.py`）→ Aseprite CLI 转 `.aseprite` 源文件（`assets/sprites/src/`，可在 Aseprite 中继续手绘编辑）→ Aseprite CLI 导出最终 PNG（`assets/sprites/`）。

**中文字体子集化**（同一管线自动完成）：`tools/art/collect_chars.py` 扫描工程全部文案收集实际用到的字符（约 470 个）→ fonttools 将 Noto Sans SC 可变字体实例化为 Regular 并子集化为 `assets/fonts/noto_sc_cn.ttf`（约 110KB，已通过项目 `gui/theme/custom_font` 全局启用）。后续新增文案只需重跑 `build.sh` 即可自动扩充字体子集，无需手动干预。

## 双端导出

```bash
# Android APK（debug 签名，可装机；需本地 Android SDK + JDK 17）
JAVA_HOME=<jdk17路径> ANDROID_HOME=<sdk路径> \
  godot --headless --path . --export-debug "Android"
# 产物: export/starfall.apk

# Web（H5，可布 GitHub Pages）
godot --headless --path . --export-release "Web"
# 产物: export/web/index.html
```

- 应用图标：`assets/sprites/icon.png`（256×256 主图标）+ `assets/icons/adaptive_*.png`（432×432 自适应图标，Android 8+ 货架展示）
- Android 侧需在编辑器设置中配置 SDK/JDK 路径（本机位于 `D:\dev-tools\android-sdk`、`D:\dev-tools\jdk-17`）

## 目录结构

```
starfall-survivors/
├── project.godot          # Godot 4.7 工程配置（主场景=主菜单）
├── scenes/                # 场景（玩家/三种敌人/宝石/弹丸/HUD/菜单/面板）
├── scripts/               # GDScript（游戏逻辑 + autoload + 测试）
├── assets/sprites/        # 最终 PNG（Godot 导入）
│   └── src/               # Aseprite 源文件（生成器中间产物，可手绘编辑）
├── assets/icons/          # Android 自适应图标素材（前景/背景 432×432）
├── tools/art/             # 资产生成器与构建脚本
└── export_presets.cfg     # 导出预设（TapTap 打包用）
```

## 开发路线图

- v0.1 核心循环（移动/射击/掉落/升级）✅
- v0.1.5 应用图标 + 双端导出（Web / Android APK）✅
- v0.2 表现层（震屏/白闪/粒子/飘字）+ 三敌种 + 波次系统 + 升级三选一 + 主菜单/结算 ✅ 当前
- v0.3 BGM 与音效（程序化合成）、精英/BOSS、暂停与设置
- v1.0 release 签名、TapTap 上架（开发者资料、隐私合规、商店截图）
