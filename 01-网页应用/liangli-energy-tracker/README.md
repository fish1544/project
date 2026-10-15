# 量力 - 精力管理与个人成长工具

量力而行，才是持续成长的开始。

## 技术栈

- **前端**: React 19 + Vite + Tailwind CSS + shadcn/ui + React Query
- **后端**: NestJS 10 + Drizzle ORM + PostgreSQL
- **认证**: JWT + bcryptjs

## 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 DATABASE_URL 和 JWT_SECRET

# 启动前后端（并行）
npm run dev
# 前端: http://localhost:5173
# 后端: http://localhost:3000
```

## 生产构建

```bash
npm run build
npm start
```

## 部署

推荐使用 [Render](https://render.com) 或 [Railway](https://railway.app)：
1. 连接 GitHub 仓库
2. 添加 PostgreSQL 服务
3. 设置环境变量 `DATABASE_URL`、`JWT_SECRET`
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`

## 默认账号

- 管理员: `admin` / `admin123`
- 普通用户: `testuser` / `user123`

> 上线前请修改默认密码。
