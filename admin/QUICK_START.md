# 🚀 NSSA后台管理系统 - 快速启动指南

## 📋 前置要求

- Node.js 18+
- npm 或 yarn
- Git
- GitHub Personal Access Token

## ⚡ 一键安装

```bash
# 1. 进入admin目录
cd admin

# 2. 运行安装脚本
npm run setup
```

安装脚本会自动：
- ✅ 检查Node.js版本
- ✅ 检查项目目录结构
- ✅ 安装所有依赖
- ✅ 创建环境变量文件
- ✅ 初始化Tina CMS
- ✅ 验证安装

## 🔧 手动配置

### 1. 创建GitHub Token

1. 访问 [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 选择以下权限：
   - ✅ `repo` (完整仓库访问权限)
   - ✅ `workflow` (工作流权限)
4. 复制生成的token

### 2. 配置环境变量

admin系统使用根目录的 `.env` 文件，确保包含以下配置：

```bash
# 必需配置
GITHUB_TOKEN=your_github_personal_access_token_here
GITHUB_OWNER=Matthewyin
GITHUB_REPO=nssa

# Admin系统配置（安装时自动添加）
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_MAIN_SITE_URL=https://nssa.io
NEXT_PUBLIC_TINA_BRANCH=main

# 其他配置（微信、Cloudflare等已存在）
```

## 🎯 启动项目

```bash
# 启动开发服务器
npm run dev

# 或者启动Tina CMS开发模式
npm run tina:dev
```

## 🌐 访问地址

- **管理后台主界面**: http://localhost:3001
- **Tina CMS编辑器**: http://localhost:3001/admin
- **NSSA主站**: https://nssa.io

## 📝 基本使用

### 1. 创建文章

1. 访问 http://localhost:3001/admin
2. 选择对应的专题分类（技术、历史、心理、职场）
3. 点击 "Create New" 创建新文章
4. 填写文章信息：
   - 标题
   - 描述
   - 发布日期
   - 标签
   - 内容

### 2. 编辑现有文章

1. 在Tina CMS中浏览现有文章
2. 点击文章进入编辑模式
3. 修改内容后保存

### 3. 发布配置

每篇文章可以配置：
- 发布到网站
- 发布到微信公众号
- 定时发布

## 🔍 故障排除

### 常见问题

**1. 端口被占用**
```bash
# 检查端口占用
lsof -i :3001

# 或者使用其他端口
npm run dev -- -p 3002
```

**2. Tina CMS无法启动**
- 检查GitHub token是否正确
- 确认content目录路径是否存在
- 查看控制台错误信息

**3. 图片上传失败**
- 检查static目录权限
- 确认文件大小是否超限（默认10MB）

**4. Git权限错误**
- 确认GitHub token有repo权限
- 检查仓库访问权限

### 获取帮助

1. 查看控制台错误信息
2. 检查 `.env.local` 配置
3. 确认网络连接
4. 查看项目文档：
   - [架构设计文档](../docs/admin-system-architecture.md)
   - [用户手册](../docs/admin-system-user-manual.md)

## 📚 下一步

安装完成后，建议：

1. **熟悉界面** - 浏览管理后台各个功能模块
2. **测试编辑** - 创建一篇测试文章
3. **配置发布** - 设置微信公众号等发布选项
4. **自定义设置** - 根据需要调整系统配置

## 🎉 开始使用

现在你可以开始使用NSSA后台管理系统了！

- 创建精彩的内容
- 管理多平台发布
- 查看数据统计
- 享受现代化的编辑体验

有任何问题，请查看详细文档或联系技术支持。
