# NSSA 本地发布系统使用指南

## 🚀 快速开始

### 1. 环境准备

```bash
# 安装依赖
npm install

# 复制环境变量模板
cp .env.example .env

# 编辑.env文件，填入您的API密钥
nano .env
```

### 2. 配置API密钥

编辑 `.env` 文件，填入以下信息：

```bash
# 微信公众号A配置
WECHAT_A_APPID=wx11caad39d3ebd052
WECHAT_A_SECRET=d77b047ba6ffb3a776dcfb05346d8e24

# 微信公众号B配置（可选）
WECHAT_B_APPID=
WECHAT_B_SECRET=

# Cloudflare API Token
CLOUDFLARE_API_TOKEN=JTMhXZeGtKUWaBGtsFWy9PlyeSuqnb-GozmgCHuA
```

## 📝 发布文章

### 1. 创建文章

在 `content/` 目录下创建Markdown文件，例如：

```markdown
---
title: "我的新文章"
description: "文章描述"
date: 2025-01-28T15:00:00+08:00
tags: ["标签1", "标签2"]

# 发布配置
publish:
  website: true      # 发布到网站
  wechat_a: true     # 发布到微信公众号A
  wechat_b: false    # 不发布到微信公众号B

# 微信配置
wechat:
  title: "微信标题"
  summary: "文章摘要"
  author: "作者名称"
---

# 文章内容

这里是文章的正文内容...
```

### 2. 发布命令

```bash
# 智能发布（自动检测变更文章）
npm run publish

# 仅发布到网站
npm run publish:website

# 仅发布到微信公众号
npm run publish:wechat

# 发布所有文章到所有平台
npm run publish:all
```

## 🔧 高级用法

### 命令行选项

```bash
# 强制发布所有文章
node scripts/local-publish.js --all

# 仅发布网站
node scripts/local-publish.js --website-only

# 仅发布微信
node scripts/local-publish.js --wechat-only

# 强制模式（忽略变更检测）
node scripts/local-publish.js --force

# 详细输出
node scripts/local-publish.js --verbose
```

### 环境变量配置

```bash
# 调试模式
DEBUG=true

# 详细日志
VERBOSE=true

# 跳过网站构建
SKIP_WEBSITE_BUILD=true

# 跳过微信发布
SKIP_WECHAT_PUBLISH=true
```

## 📊 发布流程

1. **检测变更**：自动检测最近修改的Markdown文件
2. **解析配置**：读取文章Front Matter中的发布配置
3. **网站发布**：使用Hugo构建静态网站并部署到Cloudflare
4. **微信发布**：将文章转换为微信格式并发布到指定公众号
5. **状态报告**：生成详细的发布状态报告

## 🔍 故障排除

### 常见问题

1. **环境变量未加载**
   ```bash
   # 确保.env文件存在且格式正确
   cat .env
   ```

2. **微信API调用失败**
   ```bash
   # 检查AppID和Secret是否正确
   # 确认IP白名单设置
   ```

3. **Hugo构建失败**
   ```bash
   # 检查Hugo是否正确安装
   hugo version
   ```

4. **Cloudflare部署失败**
   ```bash
   # 检查API Token权限
   # 确认wrangler.toml配置
   ```

### 调试模式

```bash
# 启用调试模式
DEBUG=true npm run publish

# 查看详细日志
VERBOSE=true npm run publish
```

## 📁 生成的文件

发布过程中会生成以下文件：

- `articles-config.json`：文章配置解析结果
- `wechat-publish-results.json`：微信发布详细结果
- `publish-status.json`：完整的发布状态报告

这些文件已添加到 `.gitignore`，不会提交到Git仓库。

## 🎯 最佳实践

1. **测试发布**：新文章先设置 `wechat_a: false` 进行测试
2. **分步发布**：先发布网站，确认无误后再发布微信
3. **备份重要**：定期备份 `.env` 文件（但不要提交到Git）
4. **监控日志**：关注控制台输出，及时发现问题

## 🔗 相关链接

- [微信公众平台](https://mp.weixin.qq.com/)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [Hugo文档](https://gohugo.io/documentation/)

---

**注意**：`.env` 文件包含敏感信息，请妥善保管，不要分享或提交到版本控制系统。
