# Firebase CLI 完整操作指南

## 🎯 当前配置状态

- **项目ID**: `nssa-game-matthew`
- **默认站点**: `nssa-game-matthew` (旧)
- **新站点**: `nssa` ✨
- **网站URL**: https://nssa.web.app
- **自定义域名**: 待配置 nssa.io

## 🔄 站点名称更改

### 为什么要更改站点名称？
- 默认站点名称 `nssa-game-matthew` 来自项目ID
- 更简洁的名称 `nssa` 更专业、更易记
- URL从 `nssa-game-matthew.web.app` 变为 `nssa.web.app`

### 更改方法
```bash
# 1. 创建新站点
firebase hosting:sites:create nssa

# 2. 更新 firebase.json 配置
# 添加 "site": "nssa" 到 hosting 配置中

# 3. 部署到新站点
firebase deploy --only hosting

# 4. 验证新站点
curl -I https://nssa.web.app

# 5. 删除旧站点（可选）
firebase hosting:sites:delete nssa-game-matthew
```

## 📋 Firebase Hosting 核心命令

### 站点管理
```bash
# 列出所有站点
firebase hosting:sites:list

# 创建新站点
firebase hosting:sites:create <siteId>

# 获取站点信息
firebase hosting:sites:get <siteId>

# 删除站点
firebase hosting:sites:delete <siteId>
```

### 部署相关
```bash
# 构建并部署到生产环境
npm run build && firebase deploy --only hosting

# 部署到指定站点
firebase deploy --only hosting:nssa-platform

# 部署到预览频道
firebase hosting:channel:deploy <channelId>

# 查看部署历史
firebase hosting:clone --help
```

### 频道管理（预览环境）
```bash
# 创建预览频道
firebase hosting:channel:create <channelId>

# 列出所有频道
firebase hosting:channel:list

# 部署到频道
firebase hosting:channel:deploy <channelId>

# 打开频道URL
firebase hosting:channel:open <channelId>

# 删除频道
firebase hosting:channel:delete <channelId>
```

### 本地开发
```bash
# 本地预览（需要先构建）
npm run build && firebase serve --only hosting

# 指定端口
firebase serve --only hosting --port 5000

# 模拟生产环境
firebase emulators:start --only hosting
```

## 🌐 域名配置

### 添加自定义域名
```bash
# 通过控制台添加域名（推荐）
firebase open hosting

# 或使用CLI（需要验证）
# 目前CLI不直接支持域名添加，需要通过控制台
```

### 域名管理步骤
1. **添加域名**
   ```
   访问: https://console.firebase.google.com/project/nssa-game-matthew/hosting/main
   点击: "添加自定义域名"
   输入: nssa.io
   ```

2. **DNS配置**
   ```
   类型: A记录
   名称: @
   值: Firebase提供的IP地址
   
   类型: A记录  
   名称: www
   值: Firebase提供的IP地址
   ```

3. **SSL证书**
   - Firebase自动提供SSL证书
   - 通常在24小时内生效

## 🔧 项目配置命令

### 项目管理
```bash
# 查看当前项目
firebase projects:list

# 切换项目
firebase use <projectId>

# 查看项目信息
firebase projects:list

# 添加项目别名
firebase use --add
```

### 配置管理
```bash
# 查看当前配置
firebase target

# 设置部署目标
firebase target:apply hosting nssa nssa-platform

# 清除目标
firebase target:clear hosting nssa
```

## 📊 监控和日志

### 部署状态
```bash
# 查看部署状态
firebase hosting:channel:list

# 查看站点信息
firebase hosting:sites:get nssa-platform
```

### 访问日志
```bash
# 打开Firebase控制台
firebase open

# 打开Hosting控制台
firebase open hosting

# 查看使用情况
# 需要在控制台查看Analytics
```

## 🚀 常用操作流程

### 日常部署
```bash
# 1. 构建网站
npm run build

# 2. 预览本地
firebase serve --only hosting

# 3. 部署到生产
firebase deploy --only hosting

# 4. 验证部署
curl -I https://nssa-platform.web.app
```

### 预览部署
```bash
# 1. 创建预览频道
firebase hosting:channel:create preview

# 2. 部署到预览
firebase hosting:channel:deploy preview

# 3. 查看预览URL
firebase hosting:channel:list

# 4. 删除预览（可选）
firebase hosting:channel:delete preview
```

### 回滚部署
```bash
# 查看部署历史（需要在控制台）
firebase open hosting

# 克隆之前的版本
firebase hosting:clone <sourceVersion> <targetChannel>
```

## 🔐 权限和安全

### 认证管理
```bash
# 查看当前登录账户
firebase login:list

# 切换账户
firebase login:use <email>

# 重新登录
firebase logout
firebase login
```

### 项目权限
```bash
# 查看项目权限（需要在控制台）
firebase open iam

# 添加团队成员（需要在控制台）
# 访问: https://console.firebase.google.com/project/nssa-game-matthew/settings/iam
```

## 📈 性能优化

### 缓存配置
当前配置在 `firebase.json` 中：
- 静态资源：1年缓存
- HTML文件：1小时缓存
- 安全头：已配置

### 压缩优化
```bash
# Hugo构建时已启用压缩
npm run build  # 包含 --minify --gc

# 检查文件大小
du -sh public/*
```

## 🛠️ 故障排除

### 常见问题
```bash
# 构建失败
npm run clean && npm ci && npm run build

# 部署失败
firebase login --reauth
firebase deploy --only hosting --debug

# 域名问题
# 检查DNS配置
nslookup nssa.io
dig nssa.io

# 缓存问题
# 强制刷新浏览器
Ctrl+F5 (Windows) / Cmd+Shift+R (Mac)
```

### 调试命令
```bash
# 详细日志
firebase deploy --only hosting --debug

# 检查配置
firebase projects:list
firebase target

# 验证构建
npm run build && ls -la public/
```

## 📞 获取帮助

```bash
# 命令帮助
firebase --help
firebase hosting --help
firebase deploy --help

# 在线文档
firebase open docs

# 社区支持
firebase open support
```

---

## 🎉 快速参考

**当前网站**: https://nssa-platform.web.app  
**部署命令**: `npm run build && firebase deploy --only hosting`  
**本地预览**: `npm run build && firebase serve --only hosting`  
**添加域名**: 访问 Firebase 控制台 → Hosting → 添加自定义域名
