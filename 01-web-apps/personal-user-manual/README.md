# 个人使用说明书

语音记录 + AI 复盘 + 行为计时分析工具，帮助用户挖掘自身行为规律。

## 功能特性

- **语音记录**：录音自动转文字，自动提取情绪/事件/时间标签
- **行为计时**：番茄钟式计时，支持任务分类与历史统计
- **AI 复盘**：日/周/月自动复盘，总结成就、压力源、触发点、行为模式
- **个人说明书**：基于历史数据生成个人使用说明书（精力节律、压力阈值、习惯建议）
- **独立账号体系**：用户名+密码注册登录，数据严格隔离

## 技术栈

### 前端
- React 19 + TypeScript
- React Router DOM v6
- Tailwind CSS
- shadcn/ui 组件库
- Vite 构建

### 后端
- NestJS 10 + TypeScript
- Drizzle ORM + PostgreSQL
- class-validator 验证
- scrypt 密码哈希

## 项目结构

```
├── client/              # 前端 React 应用
│   ├── public/          # 静态资源
│   └── src/
│       ├── pages/       # 页面组件
│       ├── components/  # 通用组件
│       ├── api/         # API 调用
│       ├── hooks/       # 自定义 hooks
│       ├── contexts/    # React Context
│       └── utils/       # 工具函数
├── server/              # 后端 NestJS 服务
│   ├── main.ts          # 入口
│   ├── app.module.ts    # 根模块
│   ├── modules/         # 业务模块
│   ├── common/          # 通用中间件/装饰器/过滤器
│   └── database/        # 数据库 schema
├── shared/              # 前后端共享类型
│   └── api.interface.ts
└── scripts/             # 脚本工具
```

## 快速开始

### 前置要求
- Node.js >= 22.0.0
- PostgreSQL 数据库

### 安装依赖

```bash
npm install
```

### 环境配置

在项目根目录创建 `.env` 文件：

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
PORT=3000
CLIENT_BASE_PATH=/
```

### 数据库初始化

参考 `server/database/schema.ts` 中的表结构，在 PostgreSQL 中执行建表 SQL。

### 启动开发服务

```bash
# 同时启动前后端
npm run dev

# 或分别启动
npm run dev:server  # 后端
npm run dev:client  # 前端
```

### 构建生产版本

```bash
npm run build
```

## 数据库表结构

- `app_users` — 用户表（用户名 + scrypt 密码哈希）
- `user_sessions` — 会话表（session token + cookie 登录态）
- `voice_records` — 语音记录表（音频URL、转写文本、标签）
- `timer_records` — 计时记录表（任务名、分类、时长）
- `review_reports` — 复盘报告表（日/周/月复盘）
- `user_manuals` — 个人说明书表（AI 生成的个人使用说明）
- `feedback_surveys` — 反馈问卷表

详细字段定义见 `server/database/schema.ts`。

## 部署说明

本项目为全栈 NestJS + React 应用，可部署到支持 Node.js 的平台（如 Vercel、Railway、Fly.io 等）。

## License

MIT
