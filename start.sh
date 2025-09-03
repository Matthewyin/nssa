#!/bin/sh

# 设置默认端口
export PORT=${PORT:-8080}
export HOST=${HOST:-0.0.0.0}

# 启动应用
echo "Starting Astro SSR server on $HOST:$PORT"
exec node ./dist/server/entry.mjs
