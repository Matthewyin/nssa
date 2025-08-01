# NSSA Admin 集成部署指南

## 🎯 集成方案概述

将NSSA管理后台与主站合并到同一个Cloudflare Worker中，通过域名路由实现功能分离。

### 架构优势
- ✅ **简化部署**: 单一Worker，统一管理
- ✅ **资源共享**: 共享KV存储和API逻辑
- ✅ **性能优化**: 减少冷启动，提高响应速度
- ✅ **成本节约**: 减少Worker数量，降低费用
- ✅ **维护便利**: 统一的代码库和部署流程

## 🌐 域名配置

### 路由规则
```
nssa.io/*         → 主站 (Hugo静态网站)
www.nssa.io/*     → 主站 (重定向到主域名)
admin.nssa.io/*   → 管理后台 (Admin界面)
```

### DNS记录配置
在Cloudflare DNS中添加以下记录：

```
类型    名称     内容                代理状态
A       @        192.0.2.1          已代理 🧡
A       www      192.0.2.1          已代理 🧡
A       admin    192.0.2.1          已代理 🧡
```

> 注意：IP地址可以是任意值，因为Cloudflare Workers会拦截所有请求

## 🔧 技术实现

### 1. Worker路由逻辑
```javascript
async function handleEvent(event) {
  const url = new URL(event.request.url)
  
  // 检查是否是admin域名访问
  if (url.hostname === 'admin.nssa.io') {
    return handleAdminRequest(event.request, url)
  }
  
  // 处理主站请求
  return handleMainSiteRequest(event.request, url)
}
```

### 2. Admin功能模块
- 🔐 **认证系统**: 登录/登出/用户管理
- 📊 **分析数据**: 文章统计、访问分析
- 📝 **内容管理**: 文章列表、状态管理
- ⚙️ **系统管理**: 健康检查、配置信息
- 📁 **文件上传**: 媒体资源管理

### 3. API端点
```
主站API:
  /api/views/*      - PV统计
  /api/likes/*      - 点赞功能

Admin API:
  /api/health       - 健康检查
  /api/auth/*       - 认证相关
  /api/articles     - 文章管理
  /api/analytics    - 分析数据
  /api/system/*     - 系统管理
  /api/upload       - 文件上传
```

## 🚀 部署流程

### 1. 准备工作
```bash
# 确保Hugo网站已构建
npm run build

# 检查Worker代码
node -c workers-site/index.js
```

### 2. 执行集成部署
```bash
# 完整部署（包含Hugo构建）
npm run deploy:integrated

# 跳过Hugo构建（仅部署Worker）
npm run deploy:integrated:skip-build

# 部署到测试环境
npm run deploy:integrated:staging
```

### 3. 验证部署
访问以下URL确认功能正常：

- **主站**: https://nssa.io
- **管理后台**: https://admin.nssa.io
- **健康检查**: https://admin.nssa.io/api/health

## 🔍 功能测试

### 主站功能测试
```bash
# 测试PV统计API
curl "https://nssa.io/api/views/get?path=/workplace/sic"

# 测试点赞API
curl -X POST "https://nssa.io/api/likes/toggle" \
  -H "Content-Type: application/json" \
  -d '{"path":"/workplace/sic","clientId":"test-client"}'
```

### Admin功能测试
```bash
# 测试健康检查
curl "https://admin.nssa.io/api/health"

# 测试分析数据
curl "https://admin.nssa.io/api/analytics"

# 测试文章管理
curl "https://admin.nssa.io/api/articles"
```

## 📊 监控和维护

### 1. 日志查看
```bash
# 查看实时日志
npx wrangler tail

# 查看特定时间段的日志
npx wrangler tail --since 1h
```

### 2. 性能监控
- 在Cloudflare Dashboard中查看Worker分析
- 监控请求量、错误率、响应时间
- 设置告警规则

### 3. 故障排除
常见问题和解决方案：

**问题**: admin.nssa.io 无法访问
**解决**: 检查DNS记录和Worker路由配置

**问题**: API返回404错误
**解决**: 确认Worker代码中包含对应的API处理函数

**问题**: 跨域请求失败
**解决**: 检查CORS头部设置

## 🔄 回滚方案

如果集成部署出现问题，可以快速回滚：

### 1. 恢复独立部署
```bash
# 部署原始的主站Worker
git checkout HEAD~1 -- workers-site/index.js
npm run deploy

# 单独部署Admin Worker
cd admin
npm run deploy:production
```

### 2. 修改DNS记录
将admin.nssa.io指向独立的Admin Worker

## 📝 开发指南

### 添加新的Admin功能
1. 在`handleAdminApiRequest`中添加新的路由
2. 实现对应的处理函数
3. 在Admin HTML界面中添加调用按钮
4. 测试功能并部署

### 修改主站功能
1. 保持现有API兼容性
2. 在`handleApiRequest`中修改逻辑
3. 确保不影响Admin功能
4. 进行完整测试

## 🎉 总结

通过将Admin功能集成到主站Worker中，我们实现了：

- 🏗️ **统一架构**: 单一Worker处理所有请求
- 🌐 **域名分离**: 通过域名区分主站和管理后台
- 📈 **性能提升**: 共享资源，减少冷启动
- 💰 **成本优化**: 减少Worker数量和复杂性
- 🔧 **维护简化**: 统一的部署和监控流程

这种集成方案特别适合中小型项目，在保持功能完整性的同时，大大简化了部署和维护的复杂度。
