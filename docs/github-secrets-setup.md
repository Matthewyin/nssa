# GitHub Secrets 配置指南

## 📋 必需的Secrets配置

在GitHub仓库中配置以下Secrets，路径：`Settings → Secrets and variables → Actions → New repository secret`

### 🔐 微信公众号配置

#### 公众号A配置
```
WECHAT_A_APPID=
WECHAT_A_SECRET=
```

#### 公众号B配置
```
WECHAT_B_APPID=
WECHAT_B_SECRET=
```

### ☁️ Cloudflare配置
```
CLOUDFLARE_API_TOKEN=
```

## 🔧 获取配置信息

### 1. 微信公众号AppID和AppSecret

#### 步骤1：登录微信公众平台
访问：https://mp.weixin.qq.com/

#### 步骤2：获取开发者凭证
```
左侧菜单 → 设置与开发 → 基本配置 → 开发者密码(AppSecret)
```

#### 步骤3：记录信息
- **AppID**: 在基本配置页面可以看到
- **AppSecret**: 点击"重置"按钮生成新的密钥

#### 步骤4：配置IP白名单
```
基本配置 → IP白名单 → 添加以下IP段：
- GitHub Actions IP段（动态，建议配置为 0.0.0.0/0 用于测试）
```

### 2. Cloudflare API Token

#### 步骤1：登录Cloudflare Dashboard
访问：https://dash.cloudflare.com/

#### 步骤2：创建API Token
```
右上角头像 → My Profile → API Tokens → Create Token
```

#### 步骤3：配置权限
```
Token name: NSSA Auto Deploy
Permissions:
- Zone:Zone:Read
- Zone:Zone Settings:Edit  
- Account:Cloudflare Workers:Edit
Zone Resources:
- Include: nssa.io
```

## ✅ 配置验证

### 检查清单

- [ ] WECHAT_A_APPID 已配置
- [ ] WECHAT_A_SECRET 已配置
- [ ] WECHAT_B_APPID 已配置
- [ ] WECHAT_B_SECRET 已配置
- [ ] CLOUDFLARE_API_TOKEN 已配置

### 测试配置
推送一个测试文章到仓库，检查GitHub Actions是否正常执行：

```bash
# 创建测试文章
echo '---
title: "测试文章"
publish:
  website: true
  wechat_a: false
  wechat_b: false
---

# 测试内容
这是一篇测试文章。
' > content/test/test-article.md

# 提交并推送
git add .
git commit -m "测试自动发布系统"
git push origin main
```

## 🔒 安全注意事项

### 密钥安全
- ✅ 所有密钥都存储在GitHub Secrets中，加密保护
- ✅ 密钥不会在日志中显示
- ✅ 只有仓库管理员可以查看和修改
- ❌ 不要在代码中硬编码任何密钥

### 权限控制
- 定期轮换API密钥
- 使用最小权限原则
- 监控API使用情况
- 及时撤销不需要的访问权限

### 备份恢复
- 记录所有配置信息（除密钥外）
- 定期备份重要配置
- 建立密钥恢复流程

## 🚨 故障排除

### 常见问题

#### 1. 微信API调用失败
```
错误：invalid appid
解决：检查WECHAT_A_APPID是否正确配置
```

#### 2. Cloudflare部署失败
```
错误：Authentication error
解决：检查CLOUDFLARE_API_TOKEN权限配置
```

### 调试方法
1. 查看GitHub Actions执行日志
2. 检查Secrets配置是否完整
3. 验证API权限和白名单设置
4. 测试单个组件功能

## 📞 技术支持

如果遇到配置问题，请：
1. 检查本文档的配置步骤
2. 查看GitHub Actions执行日志
3. 在GitHub Issues中提交问题
4. 联系技术团队获取支持
