# NSSA 后台管理系统

基于 Tina CMS + Next.js 构建的现代化内容管理平台。

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- Git

### 安装步骤

1. **进入admin目录**
```bash
cd admin
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**

admin系统使用根目录的 `.env` 文件，无需单独配置。

确保根目录的 `.env` 文件包含以下配置：

```bash
# GitHub配置（必需）
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=Matthewyin
GITHUB_REPO=nssa

# Admin系统配置（已自动添加）
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_MAIN_SITE_URL=https://nssa.io
NEXT_PUBLIC_TINA_BRANCH=main
```

4. **启动开发服务器**
```bash
npm run dev
```

5. **访问管理后台**
- 主界面: http://localhost:3001
- Tina CMS: http://localhost:3001/admin

## 📁 项目结构

```
admin/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── admin/          # 管理后台页面
│   │   ├── globals.css     # 全局样式
│   │   └── layout.tsx      # 根布局
│   ├── components/         # React组件
│   ├── lib/               # 工具函数
│   ├── types/             # TypeScript类型
│   └── hooks/             # 自定义Hooks
├── tina/
│   └── config.ts          # Tina CMS配置
├── public/                # 静态资源
└── docs/                  # 项目文档
```

## 🛠️ 开发命令

```bash
# 开发环境
npm run dev              # 启动开发服务器 (端口3001)
npm run tina:dev         # 启动Tina CMS开发模式

# 构建
npm run build            # 构建生产版本
npm run tina:build       # 构建Tina CMS

# 代码质量
npm run lint             # 代码检查
npm run lint:fix         # 自动修复代码问题
npm run format           # 代码格式化
npm run type-check       # TypeScript类型检查

# Tina CMS
npm run tina:audit       # Tina配置审计
```

## 🔧 配置说明

### GitHub集成

需要创建GitHub Personal Access Token：

1. 访问 GitHub Settings > Developer settings > Personal access tokens
2. 创建新token，选择以下权限：
   - `repo` (完整仓库访问权限)
   - `workflow` (工作流权限)
3. 将token填入 `GITHUB_TOKEN` 环境变量

### Tina CMS配置

Tina CMS配置文件位于 `tina/config.ts`，主要配置：

- **内容路径**: 指向NSSA主项目的content目录
- **媒体路径**: 指向NSSA主项目的static目录
- **内容集合**: 定义文章、页面等内容类型
- **字段配置**: 定义Front Matter字段

### 环境变量

详细的环境变量配置请参考 `.env.example` 文件。

## 📝 使用指南

### 创建文章

1. 访问 http://localhost:3001/admin
2. 点击"Articles"进入文章管理
3. 点击"Create New"创建新文章
4. 填写文章信息和内容
5. 配置发布选项
6. 保存或发布文章

### 发布配置

每篇文章可以配置：

- **网站发布**: 是否发布到nssa.io主站
- **微信发布**: 是否发布到微信公众号
- **定时发布**: 设置未来发布时间

### 媒体管理

- 支持拖拽上传图片
- 自动图片压缩和格式转换
- CDN链接自动生成
- 媒体库分类管理

## 🔗 与主项目集成

后台管理系统通过以下方式与NSSA主项目集成：

1. **内容同步**: 直接读写主项目的content目录
2. **Git集成**: 自动提交更改到Git仓库
3. **构建触发**: 内容更新后触发Hugo重新构建
4. **媒体共享**: 共享主项目的static目录

## 🚨 注意事项

1. **端口冲突**: 管理后台使用3001端口，确保端口未被占用
2. **Git权限**: 确保GitHub token有足够的权限
3. **文件路径**: 确保content和static目录路径正确
4. **环境变量**: 生产环境请使用强密钥

## 📚 相关文档

- [架构设计文档](../docs/admin-system-architecture.md)
- [用户使用手册](../docs/admin-system-user-manual.md)
- [任务计划文档](../docs/admin-system-task-plan.md)

## 🐛 问题排查

### 常见问题

1. **Tina CMS无法启动**
   - 检查GitHub token是否正确
   - 确认content目录路径是否存在

2. **图片上传失败**
   - 检查static目录权限
   - 确认文件大小是否超限

3. **构建失败**
   - 运行 `npm run type-check` 检查类型错误
   - 检查环境变量是否完整

### 获取帮助

- 查看控制台错误信息
- 检查网络连接
- 确认环境变量配置
- 联系技术支持

## 📄 许可证

MIT License - 查看 [LICENSE](../LICENSE) 文件了解详情。
