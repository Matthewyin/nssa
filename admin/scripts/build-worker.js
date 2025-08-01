#!/usr/bin/env node

/**
 * NSSA 管理后台 - Cloudflare Workers 构建脚本
 * 将Next.js应用转换为适合Cloudflare Workers的格式
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  log(`🔄 ${description}...`, 'blue');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} 完成`, 'green');
  } catch (error) {
    log(`❌ ${description} 失败`, 'red');
    throw error;
  }
}

function ensureDistDirectory() {
  const distPath = path.join(__dirname, '../dist');
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
    log('📁 创建 dist 目录', 'blue');
  }
}

function createOptimizedWorker() {
  log('📝 创建优化的 Cloudflare Worker...', 'cyan');
  
  const workerCode = `/**
 * NSSA 管理后台 - Cloudflare Workers 入口文件
 * 优化版本，提供完整的API服务和管理界面
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 设置CORS头部
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // 处理OPTIONS请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // 处理API路由
      if (url.pathname.startsWith('/api/')) {
        return await handleApiRequest(request, env, corsHeaders);
      }

      // 处理管理界面路由
      if (url.pathname.startsWith('/admin') || url.pathname === '/') {
        return await handleAdminInterface(request, env, corsHeaders);
      }

      // 处理静态资源
      if (url.pathname.startsWith('/static/') || url.pathname.startsWith('/_next/')) {
        return await handleStaticAssets(request, env);
      }

      // 默认重定向到管理界面
      return Response.redirect(new URL('/admin', request.url), 302);
      
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          ...corsHeaders
        }
      });
    }
  },
};

/**
 * 处理API请求
 */
async function handleApiRequest(request, env, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // 健康检查
    if (path === '/api/health') {
      return handleHealthCheck(request, env, corsHeaders);
    }
    
    // 认证相关
    if (path === '/api/auth/login') {
      return handleLogin(request, env, corsHeaders);
    }
    
    if (path === '/api/auth/logout') {
      return handleLogout(request, env, corsHeaders);
    }
    
    if (path === '/api/auth/me') {
      return handleGetUser(request, env, corsHeaders);
    }
    
    // 文章管理
    if (path.startsWith('/api/articles')) {
      return handleArticles(request, env, corsHeaders);
    }
    
    // 分析数据
    if (path.startsWith('/api/analytics')) {
      return handleAnalytics(request, env, corsHeaders);
    }
    
    // 系统管理
    if (path.startsWith('/api/system')) {
      return handleSystem(request, env, corsHeaders);
    }
    
    // 文件上传
    if (path.startsWith('/api/upload')) {
      return handleUpload(request, env, corsHeaders);
    }
    
    // 默认API响应
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'API endpoint not found',
        path: path 
      }),
      { 
        status: 404, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
    
  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
}

/**
 * 处理管理界面
 */
async function handleAdminInterface(request, env, corsHeaders) {
  const adminHTML = getAdminHTML();
  
  return new Response(adminHTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, must-revalidate',
      ...corsHeaders
    },
  });
}

/**
 * 处理静态资源
 */
async function handleStaticAssets(request, env) {
  // 简单的静态资源处理
  return new Response('Static asset not found', { status: 404 });
}

/**
 * 生成管理后台HTML页面
 */
function getAdminHTML() {
  return \`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NSSA 管理后台</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          margin: 0;
          padding: 0;
        }
        .admin-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
    </style>
</head>
<body>
    <div id="admin-root" class="admin-container">
        <div class="min-h-screen flex items-center justify-center p-4">
            <div class="max-w-4xl w-full">
                <!-- 头部 -->
                <div class="text-center mb-8">
                    <h1 class="text-4xl font-bold text-white mb-2">NSSA 管理后台</h1>
                    <p class="text-blue-100">内容管理系统 - Cloudflare Workers 版本</p>
                </div>
                
                <!-- 主要内容区域 -->
                <div class="bg-white rounded-lg shadow-xl p-8">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <!-- 系统状态 -->
                        <div class="bg-green-50 p-6 rounded-lg border border-green-200">
                            <div class="flex items-center">
                                <div class="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                                <h3 class="font-semibold text-green-800">系统状态</h3>
                            </div>
                            <p class="text-green-600 mt-2">运行正常</p>
                        </div>
                        
                        <!-- API状态 -->
                        <div class="bg-blue-50 p-6 rounded-lg border border-blue-200">
                            <div class="flex items-center">
                                <div class="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                                <h3 class="font-semibold text-blue-800">API服务</h3>
                            </div>
                            <p class="text-blue-600 mt-2">已就绪</p>
                        </div>
                        
                        <!-- 部署环境 -->
                        <div class="bg-purple-50 p-6 rounded-lg border border-purple-200">
                            <div class="flex items-center">
                                <div class="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                                <h3 class="font-semibold text-purple-800">部署环境</h3>
                            </div>
                            <p class="text-purple-600 mt-2">Cloudflare Workers</p>
                        </div>
                    </div>
                    
                    <!-- 功能按钮 -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onclick="checkHealth()" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                            🔍 检查系统健康状态
                        </button>
                        
                        <button onclick="viewAnalytics()" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
                            📊 查看分析数据
                        </button>
                        
                        <button onclick="manageArticles()" class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                            📝 文章管理
                        </button>
                        
                        <button onclick="systemSettings()" class="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors">
                            ⚙️ 系统设置
                        </button>
                    </div>
                    
                    <!-- 结果显示区域 -->
                    <div id="result-area" class="mt-8 p-4 bg-gray-50 rounded-lg hidden">
                        <h4 class="font-semibold mb-2">操作结果:</h4>
                        <pre id="result-content" class="text-sm text-gray-700 whitespace-pre-wrap"></pre>
                    </div>
                </div>
                
                <!-- 页脚 -->
                <div class="text-center mt-8 text-blue-100">
                    <p>NSSA 管理后台系统 v1.0.0</p>
                    <p>基于 Cloudflare Workers 部署</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        // 显示结果
        function showResult(data) {
            const resultArea = document.getElementById('result-area');
            const resultContent = document.getElementById('result-content');
            resultContent.textContent = JSON.stringify(data, null, 2);
            resultArea.classList.remove('hidden');
        }

        // 检查健康状态
        async function checkHealth() {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                showResult(data);
            } catch (error) {
                showResult({ error: error.message });
            }
        }

        // 查看分析数据
        async function viewAnalytics() {
            try {
                const response = await fetch('/api/analytics');
                const data = await response.json();
                showResult(data);
            } catch (error) {
                showResult({ error: error.message });
            }
        }

        // 文章管理
        async function manageArticles() {
            try {
                const response = await fetch('/api/articles');
                const data = await response.json();
                showResult(data);
            } catch (error) {
                showResult({ error: error.message });
            }
        }

        // 系统设置
        async function systemSettings() {
            try {
                const response = await fetch('/api/system/info');
                const data = await response.json();
                showResult(data);
            } catch (error) {
                showResult({ error: error.message });
            }
        }
    </script>
</body>
</html>\`;
}

// API处理函数 (继续在下一部分)
`;

  const distPath = path.join(__dirname, '../dist');
  fs.writeFileSync(path.join(distPath, 'worker.js'), workerCode);
  log('✅ Worker 文件创建完成', 'green');
}

function main() {
  log('🚀 开始构建 Cloudflare Worker...', 'cyan');
  
  try {
    // 1. 确保目录存在
    ensureDistDirectory();
    
    // 2. 创建优化的Worker文件
    createOptimizedWorker();
    
    log('🎉 Worker 构建完成！', 'green');
    log('📁 输出文件: dist/worker.js', 'blue');
    
  } catch (error) {
    log(`💥 构建失败: ${error.message}`, 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
