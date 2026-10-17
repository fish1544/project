# 个人使用说明书 · 研发规范

> 应用 ID：app_17edqqrwb8x
> 产品定位：语音记录 + AI 复盘 + 行为计时分析工具，帮助用户挖掘自身行为规律

---

## 一、技术架构

### 账号体系（独立）
- 使用自建 `app_users` 表存储用户名 + scrypt 密码哈希 + 盐
- 登录态通过 `user_sessions` 表的 session token + HTTP Only Cookie 管理
- 所有业务表通过 `user_id` 外键关联，级联删除，严格数据隔离
- 不接入任何第三方账号（飞书/微信/QQ/抖音等）

### 后端模块
| 模块 | 目录 | 职责 |
|------|------|------|
| auth | `server/modules/auth/` | 注册、登录、登出、会话校验、用户名查重 |
| voice | `server/modules/voice/` | 语音记录 CRUD、结构化标签提取 |
| timer | `server/modules/timer/` | 计时记录 CRUD、分类统计 |
| review | `server/modules/review/` | 日/周/月复盘生成与查询 |
| manual | `server/modules/manual/` | 个人使用说明书生成与查询 |
| feedback | `server/modules/feedback/` | 内测反馈问卷提交 |

### 前端页面
| 页面 | 路径 | 路由 | 登录要求 |
|------|------|------|----------|
| 产品介绍首页 | `client/src/pages/home/` | `/` | 否 |
| 注册页 | `client/src/pages/register/` | `/register` | 否 |
| 登录页 | `client/src/pages/login/` | `/login` | 否 |
| 用户工作台 | `client/src/pages/dashboard/` | `/dashboard` | 是 |
| 语音记录页 | `client/src/pages/voice/` | `/voice` | 是 |
| 计时记录页 | `client/src/pages/timer/` | `/timer` | 是 |
| 复盘报告页 | `client/src/pages/review/` | `/review` | 是 |
| 使用说明书页 | `client/src/pages/manual/` | `/manual` | 是 |
| 反馈问卷页 | `client/src/pages/feedback/` | `/feedback` | 否（可匿名） |

### 认证中间件机制
- 后端自定义 `AuthMiddleware`：从 Cookie 读取 `app_session` → 查 `user_sessions` 表 → 校验有效期 → 将 `userId` 挂到 `req.appUserId`
- 需登录的接口用自定义 `@NeedAppLogin()` 装饰器保护
- 未登录返回 401，前端拦截后跳转 `/login`

---

## 二、设计规范

### 色彩系统
- 主色（Primary）：`#6366F1`（Indigo 500）— 代表内省、深度、自我探索
- 主色浅：`#EEF2FF`（Indigo 50）
- 主色深：`#4F46E5`（Indigo 600）
- 强调色（Accent）：`#F59E0B`（Amber 500）— 代表能量、活力
- 成功色：`#10B981`（Emerald 500）
- 警告色：`#F59E0B`（Amber 500）
- 错误色：`#EF4444`（Red 500）
- 文字主色：`#1F2937`（Gray 800）
- 文字次色：`#6B7280`（Gray 500）
- 背景：`#FAFAFA`（近白灰）
- 卡片背景：`#FFFFFF`
- 边框：`#E5E7EB`（Gray 200）

### 排版
- 字体：系统默认 sans-serif
- 标题：text-2xl font-bold / text-xl font-semibold / text-lg font-semibold
- 正文：text-base leading-relaxed
- 辅助文字：text-sm text-gray-500
- 行间距：正文 1.6，标题 1.3

### 间距
- 页面外边距：px-4 md:px-6 lg:px-8
- 卡片内边距：p-5 md:p-6
- 区块间距：gap-5 md:gap-6
- 元素间距：gap-3

### 圆角
- 卡片圆角：rounded-xl
- 按钮圆角：rounded-lg
- 输入框圆角：rounded-lg
- 头像/小标签：rounded-full

### 移动端优先
- 所有页面先做移动端布局，再用 md:/lg: 断点扩展
- 最小触达区域 44px（按钮、输入框高度）
- 底部导航栏（移动端）/ 侧边栏（桌面端）

### 组件风格
- 卡片：白色背景 + 轻微阴影（shadow-sm）+ rounded-xl
- 按钮：主色填充 + white 文字 + hover 加深
- 输入框：border border-gray-200 + focus:border-primary + focus:ring-2 focus:ring-primary/20
- 标签：圆角小胶囊 + 浅色背景 + 深色文字

### 动画
- 过渡：transition-all duration-200 ease-in-out
- 悬浮效果：hover:shadow-md hover:-translate-y-0.5
