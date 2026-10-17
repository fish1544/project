# 量力 - 精力管理与个人成长应用

## 项目概述
量力是一款面向精力管理与个人成长的 Web 应用，核心是负荷系统、成长池、专注计时与数据复盘，采用独立数据库账号体系。

## 技术栈
- 后端：NestJS + Drizzle ORM + PostgreSQL
- 前端：React 19 + TypeScript + Tailwind CSS + shadcn/ui
- 认证：独立账号体系（用户名 + 密码 + JWT）
- 图表：ECharts

## 设计规范 — 「晨光森林」设计语言

### 设计理念
以「晨光穿透林间薄雾」为灵感，温暖的奶油米色背景 + 柔和绿色主调，营造宁静、有呼吸感的成长氛围。远离冰冷的 SaaS 模板感，用有机的形态、柔和的渐变和纸张般的质感让人放松。

### 色彩系统

**品牌主色 — 森林绿：**
- `--primary: #2D6A4F` — 深森绿（品牌主色、按钮、标题强调）
- `--primary-light: #40916C` — 林间绿（悬停态、次级按钮）
- `--primary-soft: #52B788` — 嫩芽绿（进度条、标签）
- `--primary-pale: #B7E4C7` — 薄荷绿（背景块、浅底）
- `--primary-mist: #D8F3DC` — 晨雾绿（极浅背景、分割块）

**背景 — 奶油纸感：**
- `--background: #F7F5EF` — 奶油米白（主背景）
- `--surface: #FFFFFF` — 白纸（卡片底色）
- `--surface-warm: #FBFAF5` — 暖白纸（次级卡片）
- `--muted-bg: #F0EDE4` — 米灰（输入框、disabled态）

**文字 — 墨绿层次：**
- `--text-primary: #1B3A2D` — 深墨绿（标题、正文）
- `--text-secondary: #4A6355` — 苔绿（次级文字）
- `--text-muted: #8B9E92` — 雾绿（辅助、placeholder）
- `--text-inverse: #FFFFFF` — 纯白（深色底上的文字）

**精力负荷 4 态（柔和自然色系）：**
- 轻负荷（light）：`#95D5B2` — 新芽绿
- 舒适区（comfortable）：`#74C69D` — 青草绿
- 紧绷区（tight）：`#F4A261` — 暖橙
- 超载（overload）：`#E76F51` — 橘红

**点缀色：**
- 日出金：`#E9C46A` — 成就、提醒、重点标记
- 晚霞紫：`#B5838D` — 社区、灵感类标签

### 排版
- 字体：系统字体栈 + 'Noto Serif SC' 用于品牌名和大标题（衬线体增添人文质感）
- 大标题：text-4xl md:text-5xl font-bold tracking-tight（用 font-serif 衬线体）
- 页面标题：text-2xl font-semibold tracking-tight
- 卡片标题：text-lg font-semibold
- 正文：text-base leading-relaxed
- 辅助文字：text-sm
- 数字展示：font-semibold tracking-tight

### 卡片与容器
- 圆角：2xl（大卡片）、xl（中卡片）、lg（按钮/输入框）
- 阴影：极其柔和，用多层暖色阴影模拟纸面浮起感
  - `shadow-soft`: 0 4px 24px -8px rgba(45, 106, 79, 0.12), 0 2px 8px -4px rgba(45, 106, 79, 0.08)
  - `shadow-soft-lg`: 0 12px 40px -12px rgba(45, 106, 79, 0.18), 0 4px 16px -8px rgba(45, 106, 79, 0.1)
- 边框：极细的暖灰边 `border border-stone-100`，不靠粗边分割
- 卡片内部：用留白和分组组织信息，不靠分割线

### 按钮
- 主按钮：深森绿底 + 白字 + 圆角 lg + 柔和阴影 + hover 微上浮
- 次按钮：白底 + 森绿边框 + 森绿字 + hover 浅绿底
- 幽灵按钮：透明底 + 苔绿字 + hover 雾绿底
- 尺寸：默认 h-10 px-5；大按钮 h-12 px-6 text-base

### 图标
- 使用 lucide-react，stroke 宽度统一 1.75（更柔和）
- 图标尺寸：导航 w-5 h-5，按钮 w-4 h-4，大卡片 w-6 h-6

### 动效
- 过渡：transition-all duration-300 ease-out
- 悬停：微上浮（translateY -2px）+ 阴影加深
- 渐入：fade-in + 轻微上移
- 加载：柔和呼吸（opacity 脉动）

### 页面布局
- 整体背景：奶油米白 `bg-[#F7F5EF]`
- 内容最大宽度：6xl（桌面端居中）
- 页面内边距：px-4 sm:px-6 lg:px-8
- 区块间距：py-10 md:py-14
- 登录后布局：左侧 248px 侧边栏（暖白纸色）+ 右侧滚动主内容区
- 移动端：顶部导航栏 + 抽屉式侧边栏

### 装饰元素
- 有机光斑：用 radial-gradient 制作柔和的绿色/金色光斑作为背景点缀
- 渐变叠层：hero 区域用线性渐变叠加增加层次感
- 装饰小圆点/圆环：用极简圆形装饰数字和重点信息

---

## 视觉打磨 V2 规范（2026-09 精修版）

**核心气质：安静、诚实、慢慢成长** — 参考 Gentler Streak / Waking Up / Calm / Streaks 的克制感。

### 色彩与层级
- 颜色使用 CSS 变量（`hsl(var(--primary))` 等），5 套主题自动适配，禁止硬编码十六进制色值
- 文字颜色严格三档：`text-foreground`（标题/重点）、`text-foreground/80`（正文）、`text-muted-foreground`（辅助/说明），不做中间色阶
- 背景只用 `bg-background` 和 `bg-card`，次级背景用 `bg-muted/30`，不发明新底色

### 卡片
- 统一用 `.paper-card`（标准矩形+细边+软阴影）或 `.memo-card`（有机圆角+手账感），不自定义阴影
- 卡片 hover：微上浮 1~1.5px + 阴影柔和加深，用 `.paper-card-hover` / `.memo-card-hover`
- 卡片内边距：小卡 `p-3.5`，中卡 `p-4`，大卡 `p-5`，不超过这个范围
- 卡片内部分组靠留白，不靠分割线；必须分割时用 `soft-divider` 渐变线

### 排版
- 页面标题：`font-serif-display text-xl md:text-2xl text-foreground tracking-tight`
- 卡片标题：`font-serif-display text-base md:text-lg text-foreground`
- 正文：`text-sm text-foreground/80 leading-relaxed`
- 辅助/标签：`text-xs text-muted-foreground`
- 超大数字：`display-number` + `text-3xl/4xl`（衬线体展示数字）
- eyebrow 小标签：`.eyebrow-label`（全大写 + 字距 + 苔绿色）
- 标题与正文之间用 mb-1 ~ mb-2，不要过大间距

### 图标
- 统一 lucide-react，strokeWidth 1.75
- 尺寸：导航 18px，按钮 16px，卡片标题旁 18px，装饰图标 20~24px
- 图标容器：圆形或有机圆角方块，尺寸 32/36/40px，对应 w-8/w-9/w-10

### 按钮
- 主按钮：`bg-primary text-primary-foreground rounded-lg h-9 px-4 text-sm font-medium shadow-sm hover:shadow hover:-translate-y-px transition-all duration-200`
- 次按钮：`bg-card text-foreground border border-border rounded-lg h-9 px-4 text-sm hover:bg-muted/30 transition-colors`
- 幽灵按钮：`text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-md`
- 按钮内图标 16px，间距 gap-1.5 ~ gap-2

### 输入框
- `h-9 border border-border/60 bg-muted/30 rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:border-ring/50 focus:bg-background transition-all duration-200`
- 带图标输入框：左侧绝对定位图标（pl-9），聚焦时图标颜色切到 primary

### 背景装饰（克制使用）
- 每张页面最多 2 个光斑 + 1 个有机小形状，透明度控制在 5~15%
- 光斑用 CSS blur-3xl，颜色取 `--primary/10`、`--accent/10`、`--secondary/50`
- 不叠加噪点纹理（已证明效果不明显且性能损耗大）
- 光斑全部 `pointer-events-none`，不拦截交互

### 动效
- 过渡统一 `transition-all duration-200 ease-out`，重要的用 300ms
- hover 上浮不超过 1.5px
- 渐入动画统一 `fadeInUp 0.5s ease-out`，延迟最多加 1 级（0.08s）

### 整体节奏
- 页面区块间距 `space-y-4 md:space-y-5`，不搞大段留白
- 页面内边距 `p-3 sm:p-4 md:p-5`，紧凑不松散
- 移动端优先考虑，不出现横向溢出

## 模块结构

### 后端模块
- `auth` - 注册登录、JWT 认证
- `tasks` - 任务管理、负荷系统
- `growth` - 成长池
- `focus` - 专注计时、专注记录
- `community` - 匿名社区
- `review` - 复盘统计
- `user` - 用户资料

### 前端页面
- `/` - 落地页（产品介绍）
- `/login` - 登录页
- `/register` - 注册页
- `/app/dashboard` - 首页/仪表板
- `/app/tasks` - 任务管理（负荷系统）
- `/app/growth` - 成长池
- `/app/focus` - 专注计时
- `/app/stats` - 数据看板
- `/app/review` - 复盘
- `/app/community` - 匿名社区
- `/app/profile` - 个人中心

## 认证机制
- 注册：用户名唯一校验 + 密码强度提示 + bcrypt 加密存储
- 登录：用户名 + 密码校验 → 签发 JWT
- Token：存在 localStorage，请求时带 Authorization header
- 路由守卫：登录态页面需校验 token，无 token 跳转登录页
