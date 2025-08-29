# GitHub Actions 自动部署设置指南

## 🚀 概述

现在你的项目已经配置了 GitHub Actions 自动部署到 Cloudflare Workers。每次推送到 `main` 分支时，都会自动构建和部署网站。

## 📋 需要设置的 GitHub Secrets

在 GitHub 仓库中设置以下 Secrets：

### 1. 访问仓库设置
1. 打开 GitHub 仓库：https://github.com/Matthewyin/nssa
2. 点击 **Settings** 标签
3. 在左侧菜单中点击 **Secrets and variables** → **Actions**

### 2. 添加必要的 Secrets

#### CLOUDFLARE_API_TOKEN
- **名称**: `CLOUDFLARE_API_TOKEN`
- **值**: 你的 Cloudflare API Token
- **获取方式**:
  1. 访问 [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
  2. 点击 "Create Token"
  3. 使用 "Custom token" 模板
  4. 设置权限：
     - `Account:Cloudflare Workers:Edit`
     - `Zone:Zone:Read`
     - `Zone:DNS:Edit`
  5. 复制生成的 Token

#### CLOUDFLARE_ACCOUNT_ID
- **名称**: `CLOUDFLARE_ACCOUNT_ID`
- **值**: `9a11012bc783e85de4ed991b8df456d2`
- **说明**: 这是你的 Cloudflare 账户 ID

## 🔄 工作流程说明

### 主分支部署 (main)
- **触发条件**: 推送到 `main` 分支
- **部署目标**: 生产环境 (nssa.io)
- **Worker 名称**: `nssa`

### 预览部署 (Pull Request)
- **触发条件**: 创建或更新 Pull Request
- **部署目标**: 预览环境
- **Worker 名称**: `nssa-preview-{PR编号}`
- **预览地址**: `https://nssa-preview-{PR编号}.workers.dev`

## 📝 部署步骤

GitHub Actions 会自动执行以下步骤：

1. **检出代码**: 获取最新代码
2. **设置 Node.js**: 安装 Node.js 20
3. **安装依赖**: 运行 `npm ci`
4. **构建网站**: 
   - 构建 CSS: `npm run css:build`
   - 构建 Hugo: `npx hugo --minify --gc`
5. **部署到 Cloudflare**: 使用 Wrangler 部署

## 🎯 使用方法

### 部署到生产环境
```bash
# 1. 提交代码
git add .
git commit -m "更新网站内容"

# 2. 推送到 main 分支
git push origin main

# 3. GitHub Actions 会自动部署到 nssa.io
```

### 创建预览部署
```bash
# 1. 创建新分支
git checkout -b feature/new-content

# 2. 提交更改
git add .
git commit -m "添加新内容"

# 3. 推送分支
git push origin feature/new-content

# 4. 在 GitHub 创建 Pull Request
# 5. GitHub Actions 会自动创建预览部署
```

## 📊 监控部署

### 查看部署状态
1. 访问 GitHub 仓库的 **Actions** 标签
2. 查看最新的工作流运行状态
3. 点击具体的运行查看详细日志

### 查看 Cloudflare 状态
1. 访问 [Cloudflare Workers 控制台](https://dash.cloudflare.com/9a11012bc783e85de4ed991b8df456d2/workers-and-pages)
2. 查看 `nssa` Worker 的部署状态和分析数据

## 🔧 故障排除

### 常见问题

1. **wrangler-action 失败**
   ```
   Error: The process '/opt/hostedtoolcache/node/20.19.4/x64/bin/npx' failed with exit code 1
   ```
   **解决方案**：
   - 检查 API Token 权限
   - 验证 wrangler.toml 配置
   - 确保 Secrets 正确设置

2. **API Token 权限不足**
   - 确保 Token 有以下权限：
     - `Account:Cloudflare Workers:Edit`
     - `Zone:Zone:Read`
     - `Zone:DNS:Edit`
   - 重新生成 Token 并更新 Secret

3. **构建失败**
   - 检查 Hugo 配置文件
   - 确保所有依赖都在 package.json 中
   - 验证 public/ 目录生成

4. **部署失败**
   - 检查 wrangler.toml 配置
   - 确保域名配置正确
   - 验证路由设置

### 调试步骤

1. **手动测试部署**
   - 访问 GitHub Actions 页面
   - 点击 "Actions" → "Test Cloudflare Deployment"
   - 点击 "Run workflow" 手动触发测试

2. **查看详细日志**
   - 在 GitHub Actions 中查看失败的步骤
   - 检查 "Deploy to Cloudflare Workers" 步骤的详细输出

3. **本地验证**
   ```bash
   # 本地测试部署
   npm run deploy:dry-run

   # 检查配置
   npx wrangler whoami
   ```

4. **验证 Secrets**
   - 确保 `CLOUDFLARE_API_TOKEN` 已设置
   - 确保 `CLOUDFLARE_ACCOUNT_ID` 已设置
   - Token 应该有足够的权限

## 🎉 完成！

现在你的 NSSA 项目已经配置了完整的 CI/CD 流程：

- ✅ 自动构建和部署
- ✅ Pull Request 预览
- ✅ 生产环境保护
- ✅ 详细的部署日志

每次推送代码到 GitHub，都会自动部署到 Cloudflare Workers！
