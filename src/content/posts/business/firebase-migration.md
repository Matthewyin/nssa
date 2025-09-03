---
title: "从Cloudflare到Firebase的迁移之路"
description: "详细记录NSSA网站从Cloudflare Pages迁移到Firebase App Hosting的完整过程"
date: 2025-09-03
category: "business"
categories: ["business"]
tags: ["迁移", "firebase", "cloudflare", "部署"]
author: "NSSA Team"
lang: "zh"
---

# 从Cloudflare到Firebase的迁移之路

## 迁移背景

经过深入思考，我们决定将NSSA网站从Cloudflare Pages迁移到Firebase App Hosting，主要原因包括：

### 技术考虑

1. **动态功能需求**: 希望实现实时搜索、动态分类等功能
2. **内容管理优化**: 希望内容更新后立即可见，无需重新构建
3. **平台整合**: 与其他Firebase服务更好地集成

### 解决方案

最终我们选择了**Astro SSR + GitHub API**的方案：

- **保持现有工作流程**: Google Drive → n8n → Git → 自动部署
- **实现动态加载**: 通过GitHub API实时读取文章内容
- **提升用户体验**: 服务器端渲染，更好的SEO
- **降低维护成本**: 无需管理数据库

## 实施过程

### 1. 技术架构调整
- 将Astro从静态模式改为SSR模式
- 集成@astrojs/node适配器
- 实现GitHub API客户端

### 2. 容器化部署
- 创建适配Firebase App Hosting的Dockerfile
- 配置健康检查和环境变量
- 优化构建流程

### 3. 内容管理
- 保持原有的markdown文件结构
- 实现动态内容读取和缓存
- 添加搜索和分类功能

## 预期收益

1. **功能增强**: 实时搜索、动态分类、更好的SEO
2. **维护简化**: 内容更新立即生效，无需重新部署
3. **成本优化**: Firebase App Hosting的定价模式更适合我们的使用场景
4. **扩展性**: 为未来添加更多动态功能奠定基础

这次迁移不仅解决了当前的技术限制，也为NSSA网站的未来发展提供了更大的灵活性。
