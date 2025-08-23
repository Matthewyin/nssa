# Firebase Hosting 自动部署配置指南

## 🎯 部署状态

✅ **已成功部署到Firebase Hosting**
- **网站URL**: https://nssa-game-matthew.web.app
- **支持功能**: 中英文双语切换
- **自动部署**: GitHub集成已配置

## 🚀 自动部署机制

### GitHub Actions工作流

已创建两个GitHub Actions工作流实现自动部署：

#### 1. 生产部署 (firebase-hosting-merge.yml)
- **触发条件**: 推送到main分支
- **部署目标**: 生产环境
- **访问地址**: https://nssa-game-matthew.web.app

#### 2. 预览部署 (firebase-hosting-pull-request.yml)
- **触发条件**: 创建Pull Request
- **部署目标**: 预览环境
- **访问地址**: 临时预览URL

### 部署流程

每次推送到main分支时自动执行：

1. **环境准备**
   - 安装Hugo (latest extended版本)
   - 安装Node.js 18
   - 缓存npm依赖

2. **构建过程**
   - 执行`npm ci`安装依赖
   - 执行`npm run build`构建Hugo网站
   - 生成静态文件到public目录

3. **部署发布**
   - 使用Firebase Hosting Action
   - 自动部署到生产环境
   - 网站立即更新

## 📁 项目结构

```
nssa/
├── .github/workflows/          # GitHub Actions工作流
│   ├── firebase-hosting-merge.yml
│   └── firebase-hosting-pull-request.yml
├── content/                    # Hugo内容（中文）
├── content/en/                 # 英文内容
├── i18n/                      # 国际化翻译文件
├── layouts/                   # Hugo模板
├── static/                    # 静态资源
├── public/                    # 构建输出（自动生成）
├── firebase.json              # Firebase配置
├── hugo.toml                  # Hugo配置
└── package.json               # Node.js配置
```

## 🌐 网站功能

### 多语言支持
- **中文版本**: 默认语言，路径为 `/`
- **英文版本**: 路径为 `/en/`
- **语言切换**: 右上角语言切换按钮

### 内容板块
- **技术专题**: `/tech/` 和 `/en/tech/`
- **历史专题**: `/history/` 和 `/en/history/`
- **心理专题**: `/psychology/` 和 `/en/psychology/`
- **职场专题**: `/workplace/` 和 `/en/workplace/`

## 🔧 配置详情

### Firebase Hosting配置 (firebase.json)
- **静态文件服务**: public目录
- **缓存策略**: 静态资源长期缓存，HTML短期缓存
- **安全头**: XSS保护、内容类型保护等
- **URL重写**: 支持SPA路由
- **清理URL**: 移除.html后缀

### Hugo配置 (hugo.toml)
- **多语言**: 中文(zh)和英文(en)
- **构建优化**: 启用minify和gc
- **Apple风格**: 统一设计风格
- **SEO优化**: 自动生成sitemap和RSS

## 📊 性能优化

### 缓存策略
- **静态资源**: 1年缓存 (js, css, 图片)
- **HTML文件**: 1小时缓存
- **其他文件**: 1天缓存

### 安全配置
- **XSS保护**: 启用浏览器XSS过滤
- **内容类型保护**: 防止MIME类型嗅探
- **框架保护**: 防止页面被嵌入iframe
- **引用策略**: 严格的引用策略

## 🔄 使用方法

### 日常更新
1. 在本地修改内容或代码
2. 提交到GitHub仓库
3. 推送到main分支
4. GitHub Actions自动构建和部署
5. 网站自动更新

### 预览功能
1. 创建新分支进行修改
2. 提交Pull Request
3. 自动生成预览环境
4. 在预览环境测试
5. 合并到main分支发布

## 🛠️ 故障排除

### 构建失败
- 检查Hugo语法错误
- 验证package.json配置
- 查看GitHub Actions日志

### 部署失败
- 检查Firebase权限
- 验证服务账户配置
- 查看Firebase控制台日志

### 访问问题
- 检查DNS配置
- 验证Firebase Hosting状态
- 清除浏览器缓存

## 📈 监控和维护

- **部署状态**: GitHub Actions页面
- **网站状态**: Firebase控制台
- **访问统计**: Firebase Analytics
- **错误监控**: Firebase Crashlytics

---

🎉 **恭喜！您的NSSA网站已成功配置自动部署，每次推送代码都会自动更新网站！**
