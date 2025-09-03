# 多阶段构建：第一阶段构建Astro静态文件
FROM node:18-alpine AS builder

WORKDIR /app

# 复制package文件并安装依赖
COPY package*.json ./
RUN npm ci --only=production --no-audit --no-fund

# 复制源代码并构建
COPY . .
RUN npm run build

# 第二阶段：配置nginx服务器
FROM nginx:alpine

# 复制构建好的静态文件
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制简化的nginx配置文件
COPY nginx-simple.conf /etc/nginx/nginx.conf

# 创建健康检查文件
RUN echo "OK" > /usr/share/nginx/html/health

# 设置正确的权限
RUN chown -R nginx:nginx /usr/share/nginx/html

# 安装curl用于健康检查
RUN apk add --no-cache curl

# 添加健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# 暴露8080端口（Firebase App Hosting要求）
EXPOSE 8080

# 启动nginx（以root用户运行以绑定8080端口）
CMD ["nginx", "-g", "daemon off;"]
