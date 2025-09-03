#!/bin/bash

# NSSA 网站部署脚本
# 用于部署到 Firebase App Hosting

echo "🚀 开始部署 NSSA 网站到 Firebase App Hosting..."

# 检查是否安装了必要的工具
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm，请先安装 Node.js"
    exit 1
fi

if ! command -v firebase &> /dev/null; then
    echo "❌ 错误: 未找到 firebase CLI，请先安装: npm install -g firebase-tools"
    exit 1
fi

# 清理之前的构建
echo "🧹 清理之前的构建文件..."
rm -rf dist/

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建静态站点
echo "🔨 构建静态站点..."
npm run build

# 检查构建是否成功
if [ ! -d "dist" ]; then
    echo "❌ 构建失败: dist 目录不存在"
    exit 1
fi

echo "✅ 构建成功! 生成的文件:"
ls -la dist/

# 部署到 Firebase
echo "🌐 部署到 Firebase App Hosting..."
firebase deploy --only hosting

echo "🎉 部署完成!"
echo "📱 网站地址: https://n8n-project-460516.web.app"
