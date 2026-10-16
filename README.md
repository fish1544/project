# 我的网页作品仓库

作品按类型分类，每个作品一个独立文件夹、资源自包含。
AI 助手在此创建 / 整理文件时会自动读取并遵守 [AGENTS.md](./AGENTS.md)。

---

## 📁 01-网页应用

| 文件夹 | 作品 | 简介 | 打开方式 |
|---|---|---|---|
| `cat-workbench` | 猫咪生活报 · 桌面版 | 猫咪主题桌面信息页 | 直接打开 `index.html` |
| `goalday` | GoalDay（前端工程） | React 19 + TS + Tailwind v4 + shadcn/ui + ECharts + Framer Motion | `npm install` 后 `npm run dev` |
| `personal-sop` | 个人工作台 · 学习生活 SOP（GitHub: fish1544/personal-sop，已发布 [线上版](https://fish1544.github.io/personal-sop/)） | 单文件离线个人 SOP：课表/专注/待办/习惯/购物/记账/阅读/考试/健康；隐私已清理，数据存本地 | 本地打开 `product.html`，线上打开链接 |
| `personal-user-manual` | 个人使用说明书（全栈工程，GitHub: fish1544/personal-user-manual） | 语音记录 + AI 复盘 + 行为计时分析；React 19 + NestJS + PostgreSQL | `npm install` 后 `npm run dev` |
| `liangli-energy-tracker` | 亮力能量管理 · 减脂健身追踪（GitHub: fish1544/liangli-energy-tracker） | 标准 NestJS + Vite 独立可部署项目：体重/体脂/热量/训练计划追踪 | `npm install` 后 `npm run dev` |
| `作品集-自律` | 自律舱 · 个人自律生活管家 | 自律生活管理单页 | 打开 `deepseek_html_20260706_3942fc.html` |
| `step-sync-tool` | 本地刷步工具 | 单文件离线Zepp刷步工具，同步微信/支付宝运动，数据全本地存储无广告 | 直接打开 `index.html` |
| `step-sync-web` | 公开刷步网页 | 手机端适配的免费在线刷步网页，自动随机安全步数，朋友打开即用 | 直接打开 `index.html`，部署后可分享链接 |
| `desktop-ai-assistant-nav` | 桌面 AI 助手导航 · 精致版 | 收录 26 款桌面端 AI Agent/智能办公助手，去广告、搜索过滤、分类标签、本地图标离线可用 | 直接打开 `index.html` |

## 🎮 02-小游戏与互动

| 文件夹 | 作品 | 简介 | 打开方式 |
|---|---|---|---|
| `mini-mart` | 小小便利店 · 模拟经营 | 模拟经营小游戏 v4.0：AI 插画素材（背景/商品/顾客/员工）、响应式双端、存档/改价/补货/员工/天气事件 | 直接打开 `index.html` |
| `neon-snake` | 霓虹贪吃蛇 · NEON SNAKE | 霓虹风贪吃蛇 | 直接打开 `index.html` |
| `凛冬轮回` | 凛冬轮回 · Frozen Reincarnation | 冰雪主题互动叙事网页（含素材与截图） | 打开 `凛冬轮回.html` |

## 🎨 03-设计稿

| 文件夹 | 内容 |
|---|---|
| `ui-design-runs` | 《个人使用说明书》界面全面重构的设计运行产物（`app` 原型 / `doc` 方案 / `deliver` 交付 / `shots` 截图，含 `style.json` 样式签名） |

## 🗃️ 04-数据文件

| 文件 | 内容 |
|---|---|
| `购物库数据.json` | 购物清单 / 比价记录（名称、品类、品牌、平台、规格价格） |

## 🖼️ _截图与素材

| 文件 | 内容 |
|---|---|
| `fish1544_github_io_desktop.jpg` | 网页桌面端参考截图 |

---

## ➕ 新增作品怎么做

1. 判断类型，放进 `01～04` 对应文件夹；
2. 为作品单独建一个**英文 kebab-case** 文件夹，资源放 `assets/`、全部用相对路径；
3. 在本文件上方对应表格里补一行索引。

> 直接让 AI 做即可——它会读取 `AGENTS.md`，自动建好文件夹并归档，不会在根目录乱建文件。
