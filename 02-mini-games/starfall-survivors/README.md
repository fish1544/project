# 星陨幸存者 Starfall Survivors

Godot 4.7 + Aseprite 全栈开发的 **Survivors-like 肉鸽割草**游戏。目标平台：TapTap（Android / H5）。

## 玩法（当前版本 v0.1 核心循环）

- WASD / 方向键移动
- 角色自动攻击范围内最近的敌人（间隔 1.2s）
- 敌人死亡掉落经验宝石，磁吸拾取，经验满升级
- 敌人接触造成伤害（受击后 0.6s 无敌帧），HP 归零游戏结束
- UI 实时显示 HP / 等级 / 经验 / 击杀数

## 运行

```bash
# 需要 Godot 4.7.x（已用 4.7.2.stable 验证）
godot --path .            # 运行游戏
godot --path . --editor   # 打开编辑器
```

## 自动化测试

```bash
godot --headless --path . --import   # 首次运行先导入资源
godot --headless --path . res://scenes/test/test_runner.tscn
```

覆盖：场景实例化、输入移动、接触伤害、自动攻击击杀、宝石掉落与拾取、升级曲线、无敌帧、游戏结束。

## 像素美术管线（一条命令全自动重建）

```bash
bash tools/art/build.sh
```

流程：Python 程序化生成（`tools/art/generate.py`）→ Aseprite CLI 转 `.aseprite` 源文件（`assets/sprites/src/`，可在 Aseprite 中继续手绘编辑）→ Aseprite CLI 导出最终 PNG（`assets/sprites/`）。

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
├── project.godot          # Godot 4.7 工程配置
├── scenes/                # 场景（玩家/敌人/宝石/弹丸/HUD）
├── scripts/               # GDScript（游戏逻辑 + autoload + 测试）
├── assets/sprites/        # 最终 PNG（Godot 导入）
│   └── src/               # Aseprite 源文件（生成器中间产物，可手绘编辑）
├── assets/icons/          # Android 自适应图标素材（前景/背景 432×432）
├── tools/art/             # 资产生成器与构建脚本
└── export_presets.cfg     # 导出预设（TapTap 打包用）
```

## 开发路线图

- v0.1 核心循环（移动/射击/掉落/升级）✅
- v0.1.5 应用图标 + 双端导出（Web / Android APK）✅ 当前
- v0.2 武器与掉落三选一、敌种多样化
- v0.3 精英/BOSS、BGM 与音效、主菜单
- v1.0 TapTap 上架（release 签名、开发者资料、隐私合规、应用商店截图）
