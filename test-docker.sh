#!/bin/bash

# NSSA Docker测试脚本
# 用于本地测试Docker构建和部署

set -e  # 遇到错误立即退出

echo "🚀 NSSA Docker测试开始..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 清理函数
cleanup() {
    echo -e "${YELLOW}🧹 清理Docker容器...${NC}"
    docker stop nssa-test 2>/dev/null || true
    docker rm nssa-test 2>/dev/null || true
}

# 设置清理陷阱
trap cleanup EXIT

# 步骤1：构建Astro静态文件
echo -e "${BLUE}📦 步骤1: 构建Astro静态文件...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Astro构建成功${NC}"
else
    echo -e "${RED}❌ Astro构建失败${NC}"
    exit 1
fi

# 步骤2：构建Docker镜像
echo -e "${BLUE}🐳 步骤2: 构建Docker镜像...${NC}"
docker build -t nssa-nginx .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker镜像构建成功${NC}"
else
    echo -e "${RED}❌ Docker镜像构建失败${NC}"
    exit 1
fi

# 步骤3：启动容器
echo -e "${BLUE}🚀 步骤3: 启动Docker容器...${NC}"
docker run -d -p 8080:8080 --name nssa-test nssa-nginx

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker容器启动成功${NC}"
else
    echo -e "${RED}❌ Docker容器启动失败${NC}"
    exit 1
fi

# 步骤4：等待服务启动
echo -e "${BLUE}⏳ 步骤4: 等待服务启动...${NC}"
sleep 5

# 步骤5：健康检查
echo -e "${BLUE}🔍 步骤5: 执行健康检查...${NC}"
health_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)

if [ "$health_response" = "200" ]; then
    echo -e "${GREEN}✅ 健康检查通过 (HTTP $health_response)${NC}"
else
    echo -e "${RED}❌ 健康检查失败 (HTTP $health_response)${NC}"
    echo "查看容器日志:"
    docker logs nssa-test
    exit 1
fi

# 步骤6：测试主页
echo -e "${BLUE}🌐 步骤6: 测试网站主页...${NC}"
home_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/)

if [ "$home_response" = "200" ]; then
    echo -e "${GREEN}✅ 主页访问正常 (HTTP $home_response)${NC}"
else
    echo -e "${RED}❌ 主页访问失败 (HTTP $home_response)${NC}"
    exit 1
fi

# 步骤7：测试sitemap
echo -e "${BLUE}🗺️ 步骤7: 测试sitemap...${NC}"
sitemap_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/sitemap-index.xml)

if [ "$sitemap_response" = "200" ]; then
    echo -e "${GREEN}✅ Sitemap访问正常 (HTTP $sitemap_response)${NC}"
else
    echo -e "${YELLOW}⚠️ Sitemap访问异常 (HTTP $sitemap_response)${NC}"
fi

# 显示容器信息
echo -e "${BLUE}📊 容器运行信息:${NC}"
echo "容器状态: $(docker ps --filter name=nssa-test --format 'table {{.Status}}')"
echo "内存使用: $(docker stats nssa-test --no-stream --format 'table {{.MemUsage}}')"

# 成功信息
echo ""
echo -e "${GREEN}🎉 Docker测试完成！${NC}"
echo -e "${GREEN}🌐 网站地址: http://localhost:8080${NC}"
echo -e "${GREEN}💚 健康检查: http://localhost:8080/health${NC}"
echo ""
echo -e "${YELLOW}📝 测试完成后，运行以下命令清理:${NC}"
echo -e "${YELLOW}   docker stop nssa-test && docker rm nssa-test${NC}"
echo ""
echo -e "${BLUE}🔍 查看容器日志: docker logs nssa-test${NC}"
echo -e "${BLUE}🔍 进入容器: docker exec -it nssa-test sh${NC}"
