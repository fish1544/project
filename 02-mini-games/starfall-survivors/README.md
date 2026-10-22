# 星陨幸存者 Starfall Survivors

Godot 4.7 + Aseprite 全栈开发的 **Survivors-like 肉鸽割草**游戏。目标平台：TapTap（Android / H5）。

## 玩法（当前版本 v0.3）

- **AI 生成场景**：荒原地面大图无缝平铺、漂浮星尘视差、岩石/星陨晶体/枯草/远古石柱/撞击坑按网格动态生成，世界不再空旷
- **装饰物参与碰撞**：岩石/晶体/石柱是真实障碍（碰撞层 16），能挡住玩家与敌人移动、挡下双方弹丸；敌人遇障会沿切线绕行而非顶着石头打滑；实体挂在世界层按 y 排序，角色走到石头上/下方有正确前后遮挡；出生点周围不生成实体障碍
- **尸潮软分离**：敌人之间不做硬碰撞（会把尸潮挤成一堵墙），改为按重叠深度施加柔和推开力，同类各占其位不叠成一个点；分离力按 3 帧降频 + 相位错开，同屏 140 敌人峰值开销约 0.8ms/帧
- **防卡死**：障碍生成前检查该点是否压住玩家/敌人（压住则降级为贴地装饰）；万一角色被挤进石头内部会自动沿最短方向推出；敌人"想走却走不动"超过 1 秒会强制换方向绕出
- **主菜单 / 结算**：夜空背景 + 星点闪烁 + 标题浮动；结算展示存活/击杀/等级/波次与评价（新兵→星陨传说），Enter 快速重开、Esc 返回菜单
- **WASD / 方向键移动**，角色自动攻击范围内最近的敌人
- **三种敌种**（随波次解锁）：追击者（直线）、冲刺者（蓄力白闪后高速冲撞）、弹幕手（保持距离发射能量弹）
- **波次系统**：每 30 秒一波，敌人血量/速度递增、生成加速、敌种混合升级，波次推进有横幅 + 震屏仪式感
- **升级三选一**：每次升级暂停并弹出 3 张强化卡（7 种 Buff，普通/稀有/史诗三档稀有度配色，悬停放大）
- **打击反馈**：屏幕震动、受击白闪+击退、命中火花、伤害飘字、死亡爆裂粒子、受击红屏
- 敌人死亡掉落经验宝石，磁吸拾取，经验满升级
- UI：血条面板（Lv 徽章 + 数字）、底部经验条、顶部波次/计时、右上击杀、暗角、低血脉动警示

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

38 项断言全过：核心循环 10 项 + Buff 池/三选一面板流程/冲刺者状态机/远程弹幕/难度缩放/特效自毁/震屏复位 + 主题资源/背景装饰/星尘/地面跟随/障碍碰撞/玩家被挡/敌人绕障/尸潮软分离/障碍避开角色/嵌入脱困/主菜单/结算布局零重叠。

另有无损诊断脚本，量化输出各类碰撞的真实表现：

```bash
godot --headless --path . res://scenes/test/collision_audit.tscn
```

输出障碍总数、敌人最小间距、玩家四方向阻挡、双方弹丸湮灭、尸潮分离计算耗时等。

## 场景与 UI 资源

- AI 生成背景（`assets/backgrounds/`）：`bg_ground.png` 荒原地面（平铺）、`bg_sky.png` 夜空远景（菜单/结算背景）、`vignette.png` 暗角遮罩、`mote.png` 星尘光点。生成后经 `tools/art/prepare_backgrounds.py` 去水印、`tools/art/gen_overlay.py` 压缩与遮罩生成
- 统一 UI 主题：`assets/ui/theme.tres`（按钮/面板/进度条配色与圆角描边）+ 中文字体 `assets/fonts/noto_sc_cn.ttf`
- 场景装饰贴图（`assets/sprites/prop_*.png`）：岩石/晶体/枯草/石柱/撞击坑，程序化生成走 Aseprite 管线

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
