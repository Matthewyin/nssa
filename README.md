# NSSA - 神经科学与社会分析

[![Deploy Status](https://img.shields.io/badge/deploy-success-brightgreen)](https://nssa.io)
[![Hugo Version](https://img.shields.io/badge/hugo-v0.148.1-blue)](https://gohugo.io/)
[![Cloudflare Workers](https://img.shields.io/badge/cloudflare-workers-orange)](https://workers.cloudflare.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 📖 项目简介

NSSA（Neuroscience & Social Analysis）是一个专注于神经科学与社会分析的现代化学术博客平台。项目采用Hugo静态网站生成器构建，部署在Cloudflare Workers上，提供高性能、低延迟的阅读体验。

网站涵盖职场心理学、技术分析、历史研究、心理学等多个领域的深度文章，致力于通过科学的视角分析社会现象，为读者提供有价值的洞察和思考。

**🌐 在线访问**: [https://nssa.io](https://nssa.io)

## ✨ 核心功能

### 📊 统计功能
- **真实PV统计**: 基于Cloudflare KV的页面访问次数统计
- **智能点赞系统**: 用户级别的点赞状态管理和持久化存储
- **防刷机制**: 24小时内同一客户端不重复计数PV，防止虚假数据

### 🎨 用户体验
- **Apple风格设计**: 简洁优雅的界面设计，支持深色/浅色/跟随系统三种主题模式
- **响应式布局**: 完美适配桌面端、平板和移动设备
- **交互式按钮**: 点赞、评论、分享、下载等丰富的交互功能

### 📱 分享功能
- **智能微信分享**: 
  - 微信内：原生分享引导
  - 移动端：系统分享API或链接复制
  - 桌面端：二维码扫码分享
- **多平台支持**: 微信、微博、Facebook、X(Twitter)、邮件分享
- **一键下载**: 文章内容TXT格式下载

### 🔧 技术特性
- **静态网站生成**: 基于Hugo的高性能静态网站
- **边缘计算**: Cloudflare Workers提供全球CDN加速
- **数据持久化**: KV存储确保统计数据的可靠性
- **API驱动**: RESTful API设计，支持异步数据交互

## 🏗️ 系统架构

```mermaid
graph TB
    subgraph "前端层"
        A[Hugo静态网站] --> B[HTML/CSS/JS]
        B --> C[响应式UI组件]
        C --> D[交互功能模块]
    end
    
    subgraph "CDN层"
        E[Cloudflare CDN] --> F[全球边缘节点]
        F --> G[静态资源缓存]
    end
    
    subgraph "计算层"
        H[Cloudflare Workers] --> I[API路由处理]
        I --> J[业务逻辑处理]
        J --> K[数据验证与安全]
    end
    
    subgraph "存储层"
        L[Cloudflare KV] --> M[PV统计数据]
        L --> N[点赞状态数据]
        L --> O[用户行为数据]
    end
    
    subgraph "内容管理"
        P[Markdown文件] --> Q[Hugo处理]
        Q --> R[静态HTML生成]
    end
    
    A --> E
    E --> H
    H --> L
    P --> A
    
    style A fill:#e1f5fe
    style H fill:#fff3e0
    style L fill:#f3e5f5
    style P fill:#e8f5e8
```

## 🔄 应用调用流程

```mermaid
sequenceDiagram
    participant U as 用户浏览器
    participant C as Cloudflare CDN
    participant W as Workers API
    participant K as KV存储
    
    Note over U,K: 页面访问流程
    U->>C: 请求页面
    C->>U: 返回静态HTML
    U->>W: 异步请求PV数据
    W->>K: 查询PV统计
    K->>W: 返回PV数据
    W->>U: 返回JSON响应
    U->>U: 更新页面显示
    
    Note over U,K: PV统计流程
    U->>W: POST /api/views/increment
    W->>K: 检查客户端访问记录
    K->>W: 返回访问状态
    alt 24小时内未访问
        W->>K: 增加PV计数
        W->>K: 记录客户端访问
        W->>U: 返回新PV数据
    else 24小时内已访问
        W->>U: 返回当前PV数据
    end
    
    Note over U,K: 点赞功能流程
    U->>W: POST /api/likes/toggle
    W->>K: 查询用户点赞状态
    K->>W: 返回点赞状态
    alt 未点赞
        W->>K: 增加点赞数
        W->>K: 记录用户点赞
        W->>U: 返回点赞成功
    else 已点赞
        W->>K: 减少点赞数
        W->>K: 删除用户点赞记录
        W->>U: 返回取消点赞
    end
```

## 📝 内容管理业务流程

### 新增文章流程

```mermaid
flowchart TD
    A[开始] --> B[创建Markdown文件]
    B --> C[编写Front Matter元数据]
    C --> D{元数据格式正确?}
    D -->|否| C
    D -->|是| E[编写文章内容]
    E --> F[本地预览测试]
    F --> G{内容满意?}
    G -->|否| E
    G -->|是| H[提交到Git仓库]
    H --> I[触发自动构建]
    I --> J[Hugo生成静态文件]
    J --> K[部署到Cloudflare Workers]
    K --> L[CDN缓存更新]
    L --> M[文章上线]
    M --> N[结束]

    style A fill:#4caf50
    style N fill:#4caf50
    style D fill:#ff9800
    style G fill:#ff9800
```

### 修改文章流程

```mermaid
flowchart TD
    A[开始] --> B[定位目标文章文件]
    B --> C[编辑Markdown内容]
    C --> D[更新lastmod时间戳]
    D --> E[本地预览修改效果]
    E --> F{修改满意?}
    F -->|否| C
    F -->|是| G[提交修改到Git]
    G --> H[触发自动构建]
    H --> I[Hugo重新生成]
    I --> J[增量部署更新]
    J --> K[CDN缓存刷新]
    K --> L[修改生效]
    L --> M[结束]

    style A fill:#2196f3
    style M fill:#2196f3
    style F fill:#ff9800
```

### 删除文章流程

```mermaid
flowchart TD
    A[开始] --> B[确认删除目标]
    B --> C{是否需要备份?}
    C -->|是| D[备份文章文件]
    C -->|否| E[删除Markdown文件]
    D --> E
    E --> F[检查相关链接]
    F --> G[更新导航菜单]
    G --> H[更新相关引用]
    H --> I[提交删除操作]
    I --> J[触发自动构建]
    J --> K[Hugo重新生成]
    K --> L[部署更新]
    L --> M[CDN缓存清理]
    M --> N[删除完成]
    N --> O[结束]

    style A fill:#f44336
    style O fill:#f44336
    style C fill:#ff9800
```

## 🛠️ 技术栈

### 前端技术
- **Hugo**: 静态网站生成器
- **Tailwind CSS**: 原子化CSS框架
- **JavaScript ES6+**: 现代JavaScript特性
- **响应式设计**: 移动优先的设计理念

### 后端技术
- **Cloudflare Workers**: 边缘计算平台
- **Cloudflare KV**: 分布式键值存储
- **RESTful API**: 标准化API设计
- **JSON**: 数据交换格式

### 开发工具
- **Git**: 版本控制系统
- **GitHub**: 代码托管平台
- **Wrangler CLI**: Cloudflare Workers开发工具
- **npm**: 包管理器

## 📁 项目结构

```
nssa/
├── content/                 # 文章内容目录
│   ├── workplace/          # 职场专题
│   ├── tech/               # 技术专题
│   ├── history/            # 历史专题
│   └── psychology/         # 心理专题
├── layouts/                # Hugo模板文件
│   ├── _default/           # 默认模板
│   ├── partials/           # 组件模板
│   └── shortcodes/         # 短代码模板
├── static/                 # 静态资源
│   ├── css/                # 样式文件
│   ├── js/                 # JavaScript文件
│   └── images/             # 图片资源
├── workers-site/           # Cloudflare Workers代码
│   └── index.js            # Workers主文件
├── config.yaml             # Hugo配置文件
├── wrangler.toml           # Workers配置文件
└── package.json            # 项目依赖配置
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Hugo Extended v0.148.1+
- Git
- Cloudflare账户

### 本地开发

1. **克隆项目**
```bash
git clone https://github.com/Matthewyin/nssa.git
cd nssa
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
hugo server -D
```

4. **访问本地站点**
```
http://localhost:1313
```

### 部署到生产环境

1. **构建静态文件**
```bash
npm run build
```

2. **部署到Cloudflare Workers**
```bash
npx wrangler deploy
```

## 📊 API文档

### PV统计API

#### 获取文章PV数
```http
GET /api/views/get?path={article_path}
```

#### 增加文章PV数
```http
POST /api/views/increment
Content-Type: application/json

{
  "path": "workplace/sic",
  "clientId": "client_123"
}
```

#### 批量获取PV数
```http
GET /api/views/batch?paths=path1,path2,path3
```

### 点赞功能API

#### 获取点赞状态
```http
GET /api/likes/get?path={article_path}&clientId={client_id}
```

#### 切换点赞状态
```http
POST /api/likes/toggle
Content-Type: application/json

{
  "path": "workplace/sic",
  "clientId": "client_123"
}
```

#### 批量获取点赞数据
```http
GET /api/likes/batch?paths=path1,path2&clientId={client_id}
```

## 🔧 配置说明

### Hugo配置 (config.yaml)
```yaml
baseURL: 'https://nssa.io'
languageCode: 'zh-cn'
title: 'NSSA - 神经科学与社会分析'
theme: 'custom'

params:
  description: '专注于神经科学与社会分析的学术博客'
  author: 'NSSA Team'

markup:
  goldmark:
    renderer:
      unsafe: true
```

### Workers配置 (wrangler.toml)
```toml
name = "nssa"
main = "workers-site/index.js"
compatibility_date = "2023-12-01"

[site]
bucket = "./public"

[[kv_namespaces]]
binding = "ARTICLE_STATS"
id = "1d522d1cf0a547e28319cf5dc0f2d1cb"
```

## 📈 性能指标

- **页面加载速度**: < 1秒
- **首次内容绘制**: < 0.8秒
- **最大内容绘制**: < 1.2秒
- **累积布局偏移**: < 0.1
- **首次输入延迟**: < 100ms

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

- **网站**: [https://nssa.io](https://nssa.io)
- **GitHub**: [https://github.com/Matthewyin/nssa](https://github.com/Matthewyin/nssa)
- **邮箱**: contact@nssa.io

---

<div align="center">
  <strong>NSSA - 用科学的视角分析社会现象</strong>
</div>
