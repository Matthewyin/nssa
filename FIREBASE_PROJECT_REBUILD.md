# Firebase项目重建指南

## 🎯 目标
删除当前的 `nssa-game-matthew` 项目，创建新的 `nssa` 项目，获得更合适的项目名称。

## 📋 重建计划

### 第一步：删除当前项目
1. **通过Firebase控制台删除**
   - 访问：https://console.firebase.google.com/project/nssa-game-matthew/settings/general
   - 滚动到页面底部
   - 点击"删除项目"
   - 输入项目ID确认：`nssa-game-matthew`
   - 等待30天删除期（或立即删除）

### 第二步：创建新项目
1. **创建新Firebase项目**
   - 访问：https://console.firebase.google.com/
   - 点击"创建项目"
   - 项目名称：`NSSA Platform`
   - 项目ID：`nssa` (如果可用)
   - 启用Google Analytics（可选）

### 第三步：配置新项目
```bash
# 1. 更新本地配置
# 编辑 .firebaserc 文件
{
  "projects": {
    "default": "nssa"
  }
}

# 2. 重新初始化Firebase
firebase login
firebase use nssa

# 3. 初始化Hosting
firebase init hosting
# 选择现有项目：nssa
# 公共目录：public
# 单页应用：Yes
# 覆盖index.html：No

# 4. 部署网站
npm run build
firebase deploy --only hosting
```

### 第四步：更新GitHub Actions
更新 `.github/workflows/firebase-hosting-merge.yml`:
```yaml
- uses: FirebaseExtended/action-hosting-deploy@v0
  with:
    repoToken: '${{ secrets.GITHUB_TOKEN }}'
    firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_NSSA }}'
    channelId: live
    projectId: nssa  # 更新项目ID
```

### 第五步：配置GitHub Secrets
1. **生成新的服务账户密钥**
   - 访问：https://console.firebase.google.com/project/nssa/settings/serviceaccounts/adminsdk
   - 生成新的私钥
   - 下载JSON文件

2. **更新GitHub Secrets**
   - 访问：https://github.com/Matthewyin/nssa/settings/secrets/actions
   - 删除旧密钥：`FIREBASE_SERVICE_ACCOUNT_NSSA_GAME_MATTHEW`
   - 添加新密钥：`FIREBASE_SERVICE_ACCOUNT_NSSA`
   - 值为新下载的JSON内容

## 🎉 最终效果

### 新的URL结构
- **默认URL**: https://nssa.web.app ✨
- **自定义域名**: https://nssa.io (配置后)

### 项目信息
- **项目ID**: `nssa`
- **项目名称**: `NSSA Platform`
- **站点名称**: `nssa`

## ⚠️ 注意事项

### 删除等待期
- Firebase项目删除有30天等待期
- 可以在控制台中选择"立即删除"
- 删除后项目ID可能需要等待才能重新使用

### 项目ID可用性
- `nssa` 可能已被其他用户使用
- 备选方案：`nssa-platform`, `nssa-official`, `nssa-site`

### 服务中断
- 删除项目后网站将立即停止服务
- 重建完成前网站无法访问
- 建议在低流量时段操作

## 🚀 执行步骤

### 立即执行
1. **备份当前配置**（已完成，代码在GitHub）
2. **删除项目**（通过Firebase控制台）
3. **创建新项目**（项目ID: nssa）

### 删除后执行
1. **更新本地配置**
2. **重新部署网站**
3. **配置自动部署**
4. **测试所有功能**

## 📞 需要帮助？

如果在任何步骤遇到问题：
1. 检查项目ID是否可用
2. 确认Firebase CLI已登录正确账户
3. 验证GitHub Secrets配置正确
4. 测试本地构建和部署

---

**准备好了吗？让我们开始重建一个更专业的NSSA项目！**
