# NSSA Cloudflare Workers 部署指南

## 迁移完成状态

✅ **已完成的配置**：
- 创建了 `wrangler.toml` 配置文件
- 创建了 `workers-site/index.js` Worker 脚本
- 更新了 `package.json` 部署脚本
- 添加了 `@cloudflare/kv-asset-handler` 依赖
- 更新了 Hugo 配置中的 baseURL

## 部署步骤

### 1. 首次部署准备

```bash
# 安装依赖
npm install

# 构建网站
npm run build
```

### 1.1 Cloudflare 认证配置

有两种方式进行 Cloudflare 认证：

**方式一：OAuth 登录（推荐）**
```bash
# 如果设置了 API Token，先清除环境变量
unset CLOUDFLARE_API_TOKEN

# 通过浏览器登录
npx wrangler login
```

**方式二：API Token（CI/CD 推荐）**
1. 访问 [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. 创建自定义 Token，需要以下权限：
   - Zone:Zone:Read
   - Zone:DNS:Edit
   - Account:Cloudflare Workers:Edit
3. 设置环境变量：
```bash
export CLOUDFLARE_API_TOKEN="your-api-token-here"
```

### 1.2 验证认证状态

```bash
# 检查登录状态
npx wrangler whoami

# 测试部署配置（干运行）
npx wrangler deploy --dry-run --env=""
```

### 2. 部署到生产环境

```bash
# 部署到生产环境（nssa.io）
npm run deploy

# 或者使用集成部署脚本
npm run deploy:integrated
```

### 3. 部署到测试环境

```bash
# 部署到测试环境（staging.nssa.io）
npm run deploy:staging

# 或者使用集成部署脚本
npm run deploy:integrated:staging
```

## 域名配置

### 生产环境
- 主域名：`nssa.io`
- WWW 域名：`www.nssa.io`

### 测试环境
- 测试域名：`staging.nssa.io`

## 功能特性

### 静态网站托管
- ✅ Hugo 生成的静态文件托管
- ✅ Clean URLs 支持
- ✅ 自动 404 页面处理
- ✅ 缓存优化（静态资源 1 年，HTML 1 小时）
- ✅ 安全头设置

### 管理后台
- ✅ `/admin` 路由处理
- ✅ 管理 API 接口 `/admin/api/`
- 🔄 管理功能开发中

## 与 Firebase 的对比

| 功能 | Firebase Hosting | Cloudflare Workers |
|------|------------------|-------------------|
| 全球 CDN | ✅ | ✅ |
| 自定义域名 | ✅ | ✅ |
| SSL 证书 | ✅ | ✅ |
| 缓存控制 | ✅ | ✅ |
| 边缘计算 | ❌ | ✅ |
| 服务端逻辑 | ❌ | ✅ |
| 成本 | 免费额度有限 | 更大免费额度 |

## 故障排除

### 常见问题

1. **部署失败**
   ```bash
   # 检查 wrangler 配置
   npx wrangler whoami
   
   # 验证配置文件
   npx wrangler validate
   ```

2. **域名未生效**
   - 确保在 Cloudflare 控制台中正确配置了 DNS 记录
   - 检查 `wrangler.toml` 中的路由配置

3. **静态文件 404**
   - 确保 `public` 目录存在且包含构建文件
   - 检查 Worker 脚本中的资源映射逻辑

## 回滚到 Firebase

如果需要回滚到 Firebase 部署：

```bash
# 使用 Firebase 部署
npm run deploy:firebase
```

## 下一步

1. 配置 Cloudflare DNS 记录
2. 测试所有页面和功能
3. 设置监控和告警
4. 完善管理后台功能
