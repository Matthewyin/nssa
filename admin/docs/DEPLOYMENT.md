# NSSA 管理后台部署指南

本文档详细说明了如何将 NSSA 管理后台部署到生产环境。

## 📋 部署前准备

### 1. 环境要求

- **Node.js**: 18.0 或更高版本
- **npm**: 9.0 或更高版本
- **Wrangler CLI**: 最新版本
- **Git**: 用于版本控制

### 2. 账户要求

- **Cloudflare 账户**: 用于 Workers 部署
- **GitHub 账户**: 用于代码仓库和 API 访问
- **域名**: nssa.io（已在 Cloudflare 管理）

### 3. 必需的环境变量

```bash
# Cloudflare 配置
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ZONE_ID=your_zone_id

# 应用配置
JWT_SECRET=your_jwt_secret_key
GITHUB_TOKEN=your_github_personal_access_token

# 数据库配置（如果使用）
DB_HOST=your_database_host
DB_USERNAME=your_database_username
DB_PASSWORD=your_database_password

# 微信配置（可选）
WECHAT_A_APPID=your_wechat_a_appid
WECHAT_A_SECRET=your_wechat_a_secret
WECHAT_B_APPID=your_wechat_b_appid
WECHAT_B_SECRET=your_wechat_b_secret
```

## 🚀 部署步骤

### 方法一：自动化部署（推荐）

1. **克隆仓库**
   ```bash
   git clone https://github.com/Matthewyin/nssa.git
   cd nssa/admin
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env.production
   # 编辑 .env.production 文件，填入实际的环境变量
   ```

4. **运行部署脚本**
   ```bash
   chmod +x scripts/deploy-production.js
   node scripts/deploy-production.js
   ```

### 方法二：手动部署

1. **构建项目**
   ```bash
   npm run build
   ```

2. **配置 Wrangler**
   ```bash
   wrangler login
   ```

3. **设置 Secrets**
   ```bash
   wrangler secret put JWT_SECRET
   wrangler secret put GITHUB_TOKEN
   wrangler secret put DB_PASSWORD
   # 根据需要设置其他 secrets
   ```

4. **部署到 Cloudflare Workers**
   ```bash
   wrangler deploy --env production
   ```

## 🌐 域名配置

### 1. DNS 记录配置

在 Cloudflare DNS 管理中添加以下记录：

```
类型: CNAME
名称: admin
目标: nssa-admin-prod.your-subdomain.workers.dev
代理状态: 已代理（橙色云朵）
```

### 2. SSL/TLS 配置

- 确保 SSL/TLS 加密模式设置为 "完全" 或 "完全（严格）"
- 启用 "始终使用 HTTPS"
- 配置 HSTS（HTTP 严格传输安全）

## 🔧 配置管理

### 1. Cloudflare Workers 配置

主要配置文件：`wrangler.toml`

```toml
name = "nssa-admin"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[env.production]
name = "nssa-admin-prod"

[[env.production.routes]]
pattern = "admin.nssa.io/*"
zone_name = "nssa.io"

# KV 存储
[[kv_namespaces]]
binding = "ADMIN_CACHE"
id = "your-cache-kv-id"

[[kv_namespaces]]
binding = "ADMIN_SESSIONS"
id = "your-sessions-kv-id"

# R2 存储
[[r2_buckets]]
binding = "ADMIN_MEDIA"
bucket_name = "nssa-admin-media"
```

### 2. 环境特定配置

系统支持三种环境：
- **development**: 本地开发
- **staging**: 测试环境
- **production**: 生产环境

每个环境都有独立的配置，包括：
- API 端点
- 数据库连接
- 缓存设置
- 安全配置
- 功能开关

## 📊 监控和日志

### 1. 健康检查

部署后，系统提供以下监控端点：

- **健康检查**: `https://admin.nssa.io/api/health`
- **系统状态**: `https://admin.nssa.io/admin/system`

### 2. 日志管理

- **应用日志**: 通过 Cloudflare Workers 日志查看
- **访问日志**: 在 Cloudflare Analytics 中查看
- **错误监控**: 集成到系统状态页面

### 3. 性能监控

- **响应时间**: 通过健康检查 API 监控
- **错误率**: 系统自动统计和报告
- **资源使用**: 内存和 CPU 使用情况

## 🔒 安全配置

### 1. API 安全

- **JWT 认证**: 所有 API 请求需要有效的 JWT 令牌
- **速率限制**: 防止 API 滥用
- **CORS 配置**: 限制跨域访问
- **输入验证**: 所有输入数据都经过验证和清理

### 2. 数据安全

- **加密存储**: 敏感数据使用 bcrypt 加密
- **安全传输**: 所有通信使用 HTTPS
- **访问控制**: 基于角色的权限管理
- **审计日志**: 记录所有重要操作

## 🧪 部署验证

### 1. 自动化测试

部署脚本会自动运行以下测试：
- 单元测试
- 集成测试
- 类型检查
- 代码质量检查

### 2. 手动验证清单

部署完成后，请验证以下功能：

- [ ] 管理后台可以正常访问 (`https://admin.nssa.io`)
- [ ] 用户登录功能正常（使用 admin/admin123）
- [ ] 仪表板数据显示正常
- [ ] 文章管理功能正常
- [ ] 媒体管理功能正常
- [ ] 数据统计功能正常
- [ ] 系统状态检查通过
- [ ] API 端点响应正常
- [ ] 文件上传功能正常

### 3. 性能验证

- [ ] 页面加载时间 < 3秒
- [ ] API 响应时间 < 500ms
- [ ] 无 JavaScript 错误
- [ ] 移动端适配正常

## 🔄 更新和维护

### 1. 常规更新

```bash
# 拉取最新代码
git pull origin main

# 安装新依赖
npm install

# 运行测试
npm test

# 部署更新
node scripts/deploy-production.js
```

### 2. 回滚操作

如果部署出现问题，可以快速回滚：

```bash
# 查看部署历史
wrangler deployments list

# 回滚到指定版本
wrangler rollback [deployment-id]
```

### 3. 数据备份

- **统计数据**: 定期备份 `.taskmaster/stats/` 目录
- **用户数据**: 定期备份 `.taskmaster/users.json`
- **配置文件**: 版本控制中已包含

## 🆘 故障排除

### 常见问题

1. **部署失败**
   - 检查环境变量是否正确设置
   - 确认 Cloudflare API 令牌权限
   - 查看构建日志中的错误信息

2. **访问被拒绝**
   - 检查 DNS 配置是否正确
   - 确认 SSL 证书状态
   - 验证路由配置

3. **API 错误**
   - 检查 JWT 密钥配置
   - 确认数据库连接
   - 查看应用日志

4. **性能问题**
   - 检查缓存配置
   - 监控内存使用
   - 优化数据库查询

### 获取帮助

- **文档**: 查看项目 README 和 API 文档
- **日志**: 检查 Cloudflare Workers 日志
- **监控**: 使用系统状态页面诊断问题
- **社区**: 在 GitHub Issues 中报告问题

## 📞 联系信息

- **项目仓库**: https://github.com/Matthewyin/nssa
- **技术支持**: 通过 GitHub Issues
- **文档更新**: 欢迎提交 Pull Request

---

**注意**: 本文档会随着项目发展持续更新。建议定期查看最新版本。
