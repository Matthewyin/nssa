# Firebase App Hosting 配置指南

## 🎯 配置步骤

### 1. 访问Firebase控制台
打开：https://console.firebase.google.com/project/nssa-game-matthew/apphosting

### 2. 配置nssa后端
1. 选择您创建的 `nssa` 后端
2. 点击"连接到GitHub仓库"
3. 选择 `Matthewyin/nssa` 仓库
4. 选择 `main` 分支

### 3. 构建配置
在Firebase控制台中设置以下构建配置：

**构建命令：**
```bash
npm ci && npm run build
```

**输出目录：**
```
public
```

**环境变量（可选）：**
- `NODE_ENV=production`
- `HUGO_ENV=production`

### 4. 自动部署
配置完成后，Firebase App Hosting将：
- 监听main分支的推送
- 自动触发构建和部署
- 提供预览URL和生产URL

## 📁 项目结构说明

- `apphosting.yaml` - Firebase App Hosting配置文件
- `package.json` - 包含构建脚本，使用hugo-bin
- `hugo.toml` - Hugo配置，支持中英文双语
- `content/` - 网站内容（中文）
- `content/en/` - 英文内容
- `i18n/` - 国际化翻译文件

## 🌐 域名配置

配置完成后，在Firebase控制台中：
1. 进入App Hosting设置
2. 添加自定义域名 `nssa.io`
3. 按照提示配置DNS记录
4. 等待SSL证书自动配置

## ✅ 验证部署

部署成功后，您可以：
1. 访问Firebase提供的默认URL
2. 测试中英文语言切换功能
3. 验证所有页面和功能正常工作
4. 配置自定义域名

## 🔧 故障排除

如果构建失败：
1. 检查构建日志中的错误信息
2. 确认hugo-bin包已正确安装
3. 验证package.json中的构建脚本
4. 检查Hugo配置文件语法

## 📊 优势

相比Cloudflare Workers，Firebase App Hosting提供：
- ✅ 自动GitHub集成
- ✅ 内置预览环境
- ✅ 自动SSL证书
- ✅ 全球CDN分发
- ✅ 简化的域名配置
