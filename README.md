# NSSA - Not-So-Stubby Area

<div align="center">

![NSSA Logo](static/logo.svg)

**一个专注于技术、历史、心理学和职场发展的知识分享平台**

[![Deploy Status](https://github.com/Matthewyin/nssa/workflows/Deploy%20to%20Cloudflare%20Workers/badge.svg)](https://github.com/Matthewyin/nssa/actions)
[![Hugo](https://img.shields.io/badge/Hugo-0.148+-blue.svg)](https://gohugo.io)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[🌐 访问网站](https://nssa.io) | [📚 文档](https://github.com/Matthewyin/nssa/wiki) | [🐛 报告问题](https://github.com/Matthewyin/nssa/issues)

</div>

## ✨ 特性

- 🚀 **高性能**: 基于Hugo的超快静态网站生成
- 🌍 **国际化**: 完整的中英文双语支持
- 🎨 **Apple风格**: 现代化、简洁的设计语言
- 📱 **响应式**: 完美适配桌面、平板和移动设备
- 🔍 **智能搜索**: 内置全文搜索功能
- 🌙 **深色模式**: 支持明暗主题切换
- ⚡ **自动部署**: GitHub推送自动部署到Cloudflare Workers
- 📊 **SEO优化**: 完整的SEO和性能优化

## 🏗️ 技术架构

### 核心技术栈
- **静态网站生成**: [Hugo](https://gohugo.io) (Extended)
- **前端技术**: HTML5, CSS3, Vanilla JavaScript
- **样式框架**: Tailwind CSS
- **部署平台**: Cloudflare Workers
- **CI/CD**: GitHub Actions
- **内容管理**: Markdown + Front Matter

### 项目结构
```
nssa/
├── 📁 content/              # 网站内容
│   ├── 📁 tech/            # 技术专题
│   ├── 📁 history/         # 历史专题
│   ├── 📁 psychology/      # 心理专题
│   ├── 📁 workplace/       # 职场专题
│   └── 📁 en/              # 英文内容
├── 📁 layouts/             # Hugo模板
│   ├── 📁 _default/        # 默认模板
│   ├── 📁 partials/        # 组件模板
│   └── 📁 topics/          # 专题模板
├── 📁 static/              # 静态资源
├── 📁 i18n/                # 国际化翻译
├── 📁 scripts/             # 自动化脚本
├── 📁 .github/workflows/   # GitHub Actions
├── 📄 hugo.toml            # Hugo配置
├── 📄 firebase.json        # Firebase配置
└── 📄 package.json         # Node.js配置
```

## 🚀 快速开始

### 环境要求
- **Node.js**: 18.0+
- **Hugo**: 0.148+ (Extended版本)
- **Git**: 最新版本

### 本地开发

1. **克隆仓库**
   ```bash
   git clone https://github.com/Matthewyin/nssa.git
   cd nssa
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```
   访问 http://localhost:1313

4. **构建生产版本**
   ```bash
   npm run build
   ```

### 部署

项目配置了自动部署，推送到main分支即可：

```bash
git add .
git commit -m "更新内容"
git push origin main
```

GitHub Actions会自动：
- 🔨 构建Hugo网站
- 🚀 部署到Firebase Hosting
- ✅ 更新线上网站

## 📝 内容管理

### 创建新文章

1. **选择专题目录**
   ```bash
   # 技术文章
   content/tech/new-article.md

   # 历史文章
   content/history/new-article.md

   # 英文文章
   content/en/tech/new-article.md
   ```

2. **使用标准Front Matter**
   ```yaml
   ---
   title: "文章标题"
   description: "文章简介"
   date: 2024-01-01T10:00:00+08:00
   lastmod: 2024-01-01T10:00:00+08:00
   tags: ["标签1", "标签2"]
   categories: ["分类"]
   author: "作者名"
   draft: false
   ---

   # 文章内容

   这里是文章正文...
   ```

3. **本地预览**
   ```bash
   npm run dev
   ```

4. **发布文章**
   ```bash
   git add .
   git commit -m "新增文章: 文章标题"
   git push origin main
   ```

### 多语言内容

- **中文内容**: `content/` 目录
- **英文内容**: `content/en/` 目录
- **翻译文件**: `i18n/zh.toml` 和 `i18n/en.toml`

## 🌍 国际化

网站支持完整的中英文双语：

- **默认语言**: 中文 (/)
- **英文版本**: 英文 (/en/)
- **语言切换**: 右上角语言切换按钮
- **URL结构**:
  - 中文: `https://site.com/tech/article/`
  - 英文: `https://site.com/en/tech/article/`

## 🔧 自定义配置

### Hugo配置 (hugo.toml)
```toml
# 基础配置
baseURL = 'https://n8n-project-460516.web.app'
defaultContentLanguage = 'zh'

# 多语言配置
[languages]
  [languages.zh]
    languageCode = 'zh-CN'
    title = 'NSSA - Not-So-Stubby Area'
  [languages.en]
    languageCode = 'en-US'
    title = 'NSSA - Not-So-Stubby Area'
```

### Firebase配置 (firebase.json)
```json
{
  "hosting": {
    "public": "public",
    "cleanUrls": true,
    "trailingSlash": false
  }
}
```

## 📊 性能优化

- ⚡ **构建优化**: Hugo minify + gc
- 🗜️ **资源压缩**: 自动压缩CSS/JS/图片
- 🌐 **CDN分发**: Firebase全球CDN
- 📱 **响应式图片**: 自适应不同设备
- 🔍 **SEO优化**: 完整的meta标签和结构化数据

## 🤝 贡献指南

欢迎贡献内容和代码！

1. **Fork项目**
2. **创建特性分支**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **提交更改**
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **推送分支**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **创建Pull Request**

### 内容贡献
- 📝 撰写高质量文章
- 🌍 提供英文翻译
- 🐛 修复错误和改进
- 💡 提出新想法

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

## 📞 联系方式

- **网站**: https://n8n-project-460516.web.app
- **GitHub**: https://github.com/Matthewyin/nssa
- **Issues**: https://github.com/Matthewyin/nssa/issues

---

<div align="center">

**用知识连接世界，用思考改变未来**

Made with ❤️ by [NSSA Team](https://github.com/Matthewyin)

</div>