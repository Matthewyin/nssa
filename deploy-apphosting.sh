#!/bin/bash

# NSSA Firebase App Hosting 部署脚本

set -e

echo "🚀 开始部署 NSSA 到 Firebase App Hosting..."

# 检查必要的工具
if ! command -v hugo &> /dev/null; then
    echo "❌ Hugo 未安装，请先安装 Hugo"
    exit 1
fi

if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI 未安装，请先安装 Firebase CLI"
    exit 1
fi

# 清理之前的构建
echo "🧹 清理之前的构建..."
rm -rf public resources

# 安装依赖
echo "📦 安装依赖..."
npm ci

# 构建 Hugo 网站
echo "🏗️ 构建 Hugo 网站..."
npm run build

# 检查构建结果
if [ ! -d "public" ]; then
    echo "❌ 构建失败，public 目录不存在"
    exit 1
fi

echo "✅ 构建完成，生成了 $(find public -type f | wc -l) 个文件"

# 部署到 Firebase App Hosting
echo "🔥 部署到 Firebase App Hosting..."

# 由于 CLI 可能有权限问题，我们先尝试直接部署
# 如果失败，用户需要在 Firebase 控制台手动配置

firebase deploy --only apphosting:nssa --project nssa-game-matthew || {
    echo "⚠️ CLI 部署失败，请在 Firebase 控制台手动配置 App Hosting"
    echo "📋 请按以下步骤操作："
    echo "1. 访问 https://console.firebase.google.com/project/nssa-game-matthew/apphosting"
    echo "2. 选择 'nssa' 后端"
    echo "3. 连接到 GitHub 仓库 Matthewyin/nssa"
    echo "4. 配置构建设置："
    echo "   - 构建命令: npm ci && npm run build"
    echo "   - 输出目录: public"
    echo "5. 触发部署"
    exit 1
}

echo "🎉 部署完成！"
echo "🌐 您的网站将在几分钟内可用"
