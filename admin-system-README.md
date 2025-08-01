# NSSA后台管理系统

[![Deploy Status](https://img.shields.io/badge/deploy-ready-brightgreen)](https://admin.nssa.io)
[![Tina CMS](https://img.shields.io/badge/powered%20by-Tina%20CMS-blue)](https://tina.io/)
[![Cloudflare](https://img.shields.io/badge/deployed%20on-Cloudflare-orange)](https://workers.cloudflare.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 📖 项目简介

NSSA后台管理系统是为[NSSA网站](https://nssa.io)设计的现代化内容管理平台，基于**Tina CMS + 自定义扩展**的混合架构，提供直观的可视化编辑界面和强大的多平台发布功能。

### ✨ 核心特性

- 🎨 **Apple风格设计** - 简洁优雅的用户界面
- 📝 **可视化编辑** - Markdown编辑器，实时预览
- 🚀 **多平台发布** - 一键发布到网站和微信公众号
- 📊 **数据统计** - 详细的阅读量和用户行为分析
- 👥 **权限管理** - 基于角色的访问控制
- 📱 **移动适配** - 完美支持手机和平板设备
- ⚡ **高性能** - 基于Cloudflare边缘计算

### 🎯 设计理念

- **渐进增强** - 在现有Git工作流基础上逐步增强
- **技术统一** - 与NSSA主站技术栈保持一致
- **用户体验** - 简单易用，无需技术背景
- **成本控制** - 优先使用开源和免费方案

## 🏗️ 技术架构

### 技术栈

**前端技术:**
- **Tina CMS** - 基础内容管理界面
- **React 18** - 用户界面框架
- **TypeScript** - 类型安全开发
- **Tailwind CSS** - 原子化CSS框架
- **Vite** - 现代化构建工具

**后端技术:**
- **Cloudflare Workers** - 边缘计算API服务
- **Hono** - 轻量级Web框架
- **Cloudflare D1** - SQLite数据库
- **Cloudflare KV** - 键值存储
- **Cloudflare R2** - 对象存储

**部署平台:**
- **Cloudflare Pages** - 前端静态部署
- **Cloudflare Workers** - API服务部署
- **GitHub** - 代码托管和CI/CD

### 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        NSSA后台管理系统                          │
├─────────────────────────────────────────────────────────────────┤
│  前端层 (Frontend)                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Tina CMS      │  │  自定义管理界面   │  │   移动端适配     │  │
│  │  (内容管理)      │  │  (发布&统计)     │  │  (响应式设计)    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  API层 (API Gateway)                                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Tina GraphQL   │  │ 自定义REST API  │  │  认证授权API     │  │
│  │     API         │  │  (发布管理)     │  │   (JWT/OAuth)   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  数据存储层 (Data Storage)                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Git仓库       │  │  Cloudflare D1  │  │  Cloudflare KV  │  │
│  │ (内容存储)       │  │  (元数据)       │  │   (缓存)        │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 快速开始

### 环境要求

- **Node.js** 18+ 
- **npm** 或 **yarn**
- **Git** 版本控制
- **Cloudflare账户** (用于部署)

### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/Matthewyin/nssa-admin.git
cd nssa-admin

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件，填入必要的配置

# 4. 启动开发服务器
npm run dev

# 5. 访问本地开发环境
# 前端: http://localhost:3000
# Tina CMS: http://localhost:3000/admin
```

### 环境变量配置

创建 `.env.local` 文件并配置以下变量：

```bash
# Tina CMS配置
NEXT_PUBLIC_TINA_CLIENT_ID=your_tina_client_id
TINA_TOKEN=your_tina_token

# GitHub配置 (用于Git集成)
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=Matthewyin
GITHUB_REPO=nssa

# Cloudflare配置
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_DATABASE_ID=your_d1_database_id

# 微信公众号配置
WECHAT_A_APPID=your_wechat_appid
WECHAT_A_SECRET=your_wechat_secret
WECHAT_B_APPID=your_wechat_b_appid
WECHAT_B_SECRET=your_wechat_b_secret

# JWT密钥
JWT_SECRET=your_jwt_secret_key

# 其他配置
NODE_ENV=development
```

## 📁 项目结构

```
nssa-admin/
├── src/                          # 源代码目录
│   ├── components/               # React组件
│   │   ├── ui/                   # 基础UI组件
│   │   ├── forms/                # 表单组件
│   │   ├── charts/               # 图表组件
│   │   └── layout/               # 布局组件
│   ├── pages/                    # 页面组件
│   │   ├── articles/             # 文章管理页面
│   │   ├── media/                # 媒体管理页面
│   │   ├── publish/              # 发布管理页面
│   │   ├── analytics/            # 数据统计页面
│   │   └── settings/             # 系统设置页面
│   ├── hooks/                    # 自定义React Hooks
│   ├── utils/                    # 工具函数
│   ├── types/                    # TypeScript类型定义
│   └── styles/                   # 样式文件
├── api/                          # API路由 (Cloudflare Workers)
│   ├── articles/                 # 文章相关API
│   ├── media/                    # 媒体相关API
│   ├── publish/                  # 发布相关API
│   ├── analytics/                # 统计相关API
│   └── auth/                     # 认证相关API
├── tina/                         # Tina CMS配置
│   ├── config.ts                 # Tina配置文件
│   └── collections/              # 内容集合定义
├── docs/                         # 项目文档
│   ├── admin-system-architecture.md    # 架构设计文档
│   ├── admin-system-user-manual.md     # 用户手册
│   └── api-documentation.md             # API文档
├── public/                       # 静态资源
├── migrations/                   # 数据库迁移文件
├── tests/                        # 测试文件
├── .env.example                  # 环境变量模板
├── package.json                  # 项目依赖配置
├── tailwind.config.js            # Tailwind CSS配置
├── tsconfig.json                 # TypeScript配置
├── wrangler.toml                 # Cloudflare Workers配置
└── README.md                     # 项目说明文档
```

## 🛠️ 开发指南

### 开发命令

```bash
# 开发环境
npm run dev              # 启动开发服务器
npm run dev:api          # 启动API开发服务器

# 构建
npm run build            # 构建生产版本
npm run build:api        # 构建API

# 测试
npm run test             # 运行单元测试
npm run test:e2e         # 运行端到端测试
npm run test:coverage    # 生成测试覆盖率报告

# 代码质量
npm run lint             # 代码检查
npm run lint:fix         # 自动修复代码问题
npm run format           # 代码格式化

# 数据库
npm run db:migrate       # 运行数据库迁移
npm run db:seed          # 填充测试数据
npm run db:reset         # 重置数据库

# 部署
npm run deploy           # 部署到生产环境
npm run deploy:staging   # 部署到预发布环境
```

### 开发规范

#### 代码规范
- 使用 **TypeScript** 进行类型安全开发
- 遵循 **ESLint** 和 **Prettier** 代码规范
- 组件命名使用 **PascalCase**
- 文件命名使用 **kebab-case**
- 提交信息遵循 **Conventional Commits** 规范

#### 组件开发
```typescript
// 组件示例
import React from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
}) => {
  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-colors',
        {
          'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        }
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

#### API开发
```typescript
// API路由示例
import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

const app = new Hono();

// 认证中间件
app.use('/api/*', jwt({ secret: 'your-secret' }));

// 获取文章列表
app.get('/api/articles', async (c) => {
  try {
    const articles = await getArticles();
    return c.json({
      success: true,
      data: articles,
      message: '获取成功'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: '获取失败',
      error: error.message
    }, 500);
  }
});

export default app;
```

### 测试指南

#### 单元测试
```typescript
// 组件测试示例
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### API测试
```typescript
// API测试示例
import { testClient } from 'hono/testing';
import app from '@/api/articles';

describe('Articles API', () => {
  it('should return articles list', async () => {
    const res = await testClient(app).api.articles.$get();
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

## 🚀 部署指南

### 生产环境部署

#### 1. Cloudflare Pages部署 (前端)
```bash
# 1. 构建项目
npm run build

# 2. 使用Wrangler部署
npx wrangler pages deploy dist --project-name nssa-admin

# 3. 配置自定义域名
# 在Cloudflare Dashboard中配置 admin.nssa.io
```

#### 2. Cloudflare Workers部署 (API)
```bash
# 1. 配置wrangler.toml
# 2. 部署Workers
npx wrangler deploy

# 3. 配置环境变量
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put WECHAT_A_SECRET
# ... 其他敏感变量
```

#### 3. 数据库初始化
```bash
# 1. 创建D1数据库
npx wrangler d1 create nssa-admin-db

# 2. 运行迁移
npx wrangler d1 migrations apply nssa-admin-db

# 3. 填充初始数据
npx wrangler d1 execute nssa-admin-db --file=./migrations/seed.sql
```

### CI/CD配置

#### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build project
        run: npm run build
        
      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## 📊 功能特性

### 内容管理
- ✅ 可视化Markdown编辑器
- ✅ 实时预览功能
- ✅ 图片拖拽上传
- ✅ 文章分类和标签管理
- ✅ 草稿自动保存
- ✅ 版本历史记录

### 发布管理
- ✅ 多平台一键发布
- ✅ 定时发布功能
- ✅ 发布状态监控
- ✅ 微信公众号集成
- ✅ 发布历史记录
- ✅ 错误重试机制

### 数据统计
- ✅ 实时PV/UV统计
- ✅ 文章热度排行
- ✅ 数据可视化图表
- ✅ 趋势分析
- ✅ 数据导出功能

### 用户管理
- ✅ 基于角色的权限控制
- ✅ JWT认证机制
- ✅ 用户操作日志
- ✅ 安全设置

## 📚 相关文档

- [架构设计文档](docs/admin-system-architecture.md)
- [用户使用手册](docs/admin-system-user-manual.md)
- [API接口文档](docs/api-documentation.md)
- [部署运维指南](docs/deployment-guide.md)

## 🤝 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

### 开发规范
- 遵循现有代码风格
- 添加适当的测试
- 更新相关文档
- 确保CI/CD通过

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) - 查看LICENSE文件了解详情。

## 📞 支持与反馈

- **项目主页**: https://github.com/Matthewyin/nssa-admin
- **问题反馈**: https://github.com/Matthewyin/nssa-admin/issues
- **功能建议**: https://github.com/Matthewyin/nssa-admin/discussions
- **技术支持**: support@nssa.io

---

<div align="center">
  <h3>🚀 NSSA后台管理系统</h3>
  <p>
    <strong>现代化 • 高效率 • 易使用</strong>
  </p>
  <p>
    <a href="https://admin.nssa.io">🌐 在线体验</a> •
    <a href="docs/admin-system-user-manual.md">📖 使用手册</a> •
    <a href="https://github.com/Matthewyin/nssa-admin/issues">🐛 问题反馈</a>
  </p>
</div>
