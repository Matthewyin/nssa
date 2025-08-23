# Firebase项目迁移指南

## 🎯 目标
将网站从 `nssa-game-matthew` 项目迁移到新的 `nssa` 项目，实现更简洁的URL。

## ⚠️ 重要考虑

### 迁移成本
- **时间成本**: 需要重新配置所有服务
- **复杂度**: 需要迁移所有配置和数据
- **风险**: 可能影响现有服务

### 是否值得
- **如果有自定义域名**: 不建议迁移，直接使用 nssa.io
- **如果没有自定义域名**: 可以考虑迁移获得更好的URL

## 🚀 迁移步骤（如果决定迁移）

### 第一步：创建新项目
```bash
# 1. 在Firebase控制台创建新项目
# 项目ID: nssa (如果可用)
# 项目名称: NSSA Platform

# 2. 初始化新项目
firebase projects:create nssa
```

### 第二步：配置新项目
```bash
# 1. 切换到新项目
firebase use nssa

# 2. 初始化Hosting
firebase init hosting

# 3. 部署到新项目
npm run build
firebase deploy --only hosting
```

### 第三步：迁移配置
- GitHub Actions工作流
- 自定义域名配置
- 任何其他Firebase服务

### 第四步：DNS切换
- 更新域名DNS记录
- 测试新环境
- 逐步切换流量

## 📊 方案对比

| 方案 | URL效果 | 复杂度 | 推荐度 |
|------|---------|--------|--------|
| 自定义域名 | nssa.io | 低 | ⭐⭐⭐⭐⭐ |
| 新项目迁移 | nssa.web.app | 高 | ⭐⭐ |
| 保持现状 | nssa-game-matthew.web.app | 无 | ⭐⭐⭐ |

## 💡 建议

**强烈推荐使用自定义域名方案**：
1. 成本最低
2. 风险最小
3. 效果最好
4. 最专业

如果您拥有 nssa.io 域名，配置自定义域名是最佳选择！
