# Firebase Hosting 站点管理完整指南

## 🎯 当前状况

### 现有站点
- **默认站点**: `nssa-game-matthew` (无法删除)
  - URL: https://nssa-game-matthew.web.app
  - 状态: 活跃，当前部署目标
  
- **新站点**: `nssa` (已创建)
  - URL: https://nssa.web.app
  - 状态: 初始化中，等待首次部署

## 🔧 站点名称更改策略

### 方案1：使用新站点作为主站点（推荐）

**优势**:
- 更简洁的URL: `nssa.web.app`
- 专业的站点名称
- 保留原站点作为备份

**步骤**:
```bash
# 1. 确认新站点状态
firebase hosting:sites:get nssa

# 2. 等待站点完全初始化（通常需要5-10分钟）
# 可以通过以下命令检查：
curl -I https://nssa.web.app

# 3. 更新 firebase.json 配置
# 添加 "site": "nssa" 到 hosting 配置

# 4. 部署到新站点
firebase deploy --only hosting

# 5. 验证部署成功
curl -I https://nssa.web.app

# 6. 更新GitHub Actions工作流
# 确保自动部署指向新站点
```

### 方案2：重命名项目（复杂，不推荐）

**注意**: Firebase项目ID创建后无法更改，需要创建新项目。

## 🚀 实施步骤

### 第一步：等待新站点初始化
```bash
# 检查站点状态
firebase hosting:sites:get nssa

# 测试站点可访问性
curl -I https://nssa.web.app

# 如果返回404或其他错误，说明还在初始化中
```

### 第二步：配置部署目标
```bash
# 方法1：修改 firebase.json
# 添加 "site": "nssa" 到 hosting 配置中

# 方法2：使用部署目标
firebase target:apply hosting main nssa
firebase deploy --only hosting:main
```

### 第三步：更新自动部署
更新 `.github/workflows/firebase-hosting-merge.yml`:
```yaml
- uses: FirebaseExtended/action-hosting-deploy@v0
  with:
    repoToken: '${{ secrets.GITHUB_TOKEN }}'
    firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_NSSA_GAME_MATTHEW }}'
    channelId: live
    projectId: nssa-game-matthew
    target: nssa  # 添加这行指定目标站点
```

### 第四步：配置自定义域名
```bash
# 在新站点上配置 nssa.io 域名
# 通过 Firebase 控制台操作：
# https://console.firebase.google.com/project/nssa-game-matthew/hosting/main

# 选择 nssa 站点，然后添加自定义域名
```

## 🔄 站点切换流程

### 当前配置
```json
{
  "hosting": {
    "site": "nssa",
    "public": "public",
    // ... 其他配置
  }
}
```

### 切换回默认站点（如果需要）
```json
{
  "hosting": {
    "public": "public",
    // 移除 "site" 字段即使用默认站点
  }
}
```

## ⚠️ 重要注意事项

### 关于默认站点
- **无法删除**: `nssa-game-matthew` 是默认站点，与项目ID同名，无法删除
- **可以停用**: 可以停止向默认站点部署，但站点本身会保留
- **备份作用**: 可以作为备份站点保留

### 关于新站点
- **可以删除**: `nssa` 是额外创建的站点，可以随时删除
- **独立配置**: 可以有独立的域名和配置
- **部署灵活**: 可以选择性部署到不同站点

## 🛠️ 故障排除

### 新站点部署失败
```bash
# 检查站点状态
firebase hosting:sites:list

# 等待更长时间（最多30分钟）
# 新站点初始化可能需要时间

# 尝试通过控制台手动部署
firebase open hosting
```

### 域名配置问题
```bash
# 确保在正确的站点上配置域名
# 每个站点可以有独立的自定义域名

# 检查DNS配置
nslookup nssa.io
dig nssa.io
```

## 📊 最佳实践

### 生产环境建议
1. **使用新站点**: `nssa.web.app` 作为主要生产环境
2. **保留默认站点**: 作为备份或测试环境
3. **配置自定义域名**: 在新站点上配置 `nssa.io`
4. **更新所有引用**: 确保文档和链接指向新URL

### 部署策略
```bash
# 主要部署命令
firebase deploy --only hosting

# 多站点部署
firebase deploy --only hosting:nssa

# 预览部署
firebase hosting:channel:deploy preview --only nssa
```

## 🎉 完成后的状态

- ✅ **主站点**: https://nssa.web.app
- ✅ **自定义域名**: https://nssa.io (配置后)
- ✅ **备份站点**: https://nssa-game-matthew.web.app
- ✅ **自动部署**: GitHub → nssa 站点
- ✅ **简洁URL**: 专业的站点地址

---

**下一步**: 等待 `nssa` 站点完全初始化后，执行部署并配置自定义域名。
