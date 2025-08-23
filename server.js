#!/usr/bin/env node

/**
 * NSSA Static File Server for Firebase App Hosting
 * 提供Hugo生成的静态文件服务
 */

const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = path.join(__dirname, 'public');

// 启用gzip压缩
app.use(compression());

// 设置安全头
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// 设置缓存策略
app.use((req, res, next) => {
  // 静态资源长期缓存
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1年
  } 
  // HTML文件短期缓存
  else if (req.path.match(/\.html$/) || req.path === '/') {
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1小时
  }
  // 其他文件中等缓存
  else {
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1天
  }
  next();
});

// 提供静态文件服务
app.use(express.static(PUBLIC_DIR, {
  dotfiles: 'ignore',
  etag: true,
  extensions: ['html'],
  index: ['index.html'],
  maxAge: 0, // 由上面的中间件控制缓存
  redirect: false,
  setHeaders: (res, path) => {
    // 为HTML文件设置正确的Content-Type
    if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
  }
}));

// 处理404 - 返回404页面或index.html
app.use((req, res) => {
  // 检查是否存在404.html
  const notFoundPath = path.join(PUBLIC_DIR, '404.html');
  const fs = require('fs');

  if (fs.existsSync(notFoundPath)) {
    res.status(404).sendFile(notFoundPath);
  } else {
    res.status(404).sendFile(path.join(PUBLIC_DIR, 'index.html'));
  }
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal Server Error');
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 NSSA server is running on port ${PORT}`);
  console.log(`📁 Serving static files from: ${PUBLIC_DIR}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // 检查public目录是否存在
  const fs = require('fs');
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.error(`❌ Public directory not found: ${PUBLIC_DIR}`);
    console.error('Make sure to run "npm run build" first');
  } else {
    console.log('✅ Public directory found');
  }
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  process.exit(0);
});
