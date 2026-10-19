# 我的网页作品仓库

作品按类型分类，每个作品一个独立文件夹、资源自包含。
AI 助手在此创建 / 整理文件时会自动读取并遵守 [AGENTS.md](./AGENTS.md)。

---

## 📁 01-网页应用

| 文件夹 | 作品 | 简介 | 打开方式 |
|---|---|---|---|
| `cat-workbench` | 猫咪生活报 · 桌面版 | 猫咪主题桌面信息页 | 直接打开 `index.html` |
| `goalday` | GoalDay（前端工程） | React 19 + TS + Tailwind v4 + shadcn/ui + ECharts + Framer Motion | `npm install` 后 `npm run dev` |
| `personal-sop` | 个人工作台 · 学习生活 SOP（已发布 [线上版](https://fish1544.github.io/project/01-web-apps/personal-sop/)） | 单文件离线个人 SOP：课表/专注/待办/习惯/购物/记账/阅读/考试/健康；隐私已清理，数据存本地 | 本地打开 `index.html`，线上打开链接 |
| `personal-user-manual` | 个人使用说明书（全栈工程） | 语音记录 + AI 复盘 + 行为计时分析；React 19 + NestJS + PostgreSQL | `npm install` 后 `npm run dev` |
| `liangli-energy-tracker` | 亮力能量管理 · 减脂健身追踪 | 标准 NestJS + Vite 独立可部署项目：体重/体脂/热量/训练计划追踪 | `npm install` 后 `npm run dev` |
| `step-sync-tool` | 刷步工具（已发布 [线上版](https://fish1544.github.io/project/01-web-apps/step-sync-tool/)） | 手机端适配的免费在线刷步工具，自动随机安全步数，朋友打开即用 | 直接打开 `index.html`，或打开线上链接 |
| `aigc-nav` | AIGC 工具导航（已发布 [线上版](https://fish1544.github.io/project/01-web-apps/aigc-nav/)） | 收录 367 款 AI 工具、16 个分类（写作/图像/视频/办公/设计/对话/音乐/智能体/开发等），复古像素风，Tab 切换、全局搜索、点击直达官网 | 直接打开 `index.html` |

## 🎮 02-mini-games

| 文件夹 | 作品 | 简介 | 打开方式 |
|---|---|---|---|
| `mini-mart` | 小小便利店 · 模拟经营 | 模拟经营小游戏 v4.0：AI 插画素材（背景/商品/顾客/员工）、响应式双端、存档/改价/补货/员工/天气事件 | 直接打开 `index.html` |
| `neon-snake` | 霓虹贪吃蛇 · NEON SNAKE | 霓虹风贪吃蛇 | 直接打开 `index.html` |
| `frozen-reincarnation` | 凛冬轮回 · 独自求生 v3.0 | 冰雪末世生活模拟（参考《我独自生活 2.0》）：体力制日常/地点导航/五维养成/主线任务/末日终端/低保救济/大寒潮结局/轮回继承 | 直接打开 `index.html` |
| `starfall-survivors` | 星陨幸存者 · Survivors-like | 肉鸽割草：8 向移动/自动射击/经验升级/宝石掉落/接触伤害；Godot 4.7 开发，Web 在线版 + Android APK 双端交付 | 打开 `export/web/index.html` 或线上链接 |

## 🎨 03-designs

| 文件夹 | 内容 |
|---|---|
| `ui-design-runs` | 《个人使用说明书》界面全面重构的设计运行产物（`app` 原型 / `doc` 方案 / `deliver` 交付 / `shots` 截图，含 `style.json` 样式签名） |

## 🗃️ 04-data

| 文件 | 内容 |
|---|---|
| `shopping-data.json` | 购物清单 / 比价记录（名称、品类、品牌、平台、规格价格） |

## 🖼️ _screenshots

| 文件 | 内容 |
|---|---|
| `fish1544_github_io_desktop.jpg` | 网页桌面端参考截图 |

---

## ➕ 新增作品怎么做

1. 判断类型，放进 `01～04` 对应文件夹；
2. 为作品单独建一个**英文 kebab-case** 文件夹，资源放 `assets/`、全部用相对路径；
3. 在本文件上方对应表格里补一行索引。

> 直接让 AI 做即可——它会读取 `AGENTS.md`，自动建好文件夹并归档，不会在根目录乱建文件。
