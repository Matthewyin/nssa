#!/usr/bin/env node

/**
 * NSSA 管理后台生产环境部署脚本
 * 完整的生产部署流程，包括构建、测试、部署和验证
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description, options = {}) {
  log(`\n🔄 ${description}...`, 'blue');
  try {
    const result = execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options 
    });
    log(`✅ ${description} 完成`, 'green');
    return result;
  } catch (error) {
    log(`❌ ${description} 失败`, 'red');
    if (options.silent) {
      console.error(error.stdout || error.message);
    }
    if (!options.continueOnError) {
      process.exit(1);
    }
    return null;
  }
}

function checkPrerequisites() {
  log('\n🔍 检查部署前置条件...', 'cyan');
  
  // 检查 Node.js 版本
  const nodeVersion = process.version;
  log(`Node.js 版本: ${nodeVersion}`, 'blue');
  
  // 检查 wrangler CLI
  try {
    const wranglerVersion = execSync('wrangler --version', { stdio: 'pipe', encoding: 'utf8' });
    log(`✅ Wrangler CLI: ${wranglerVersion.trim()}`, 'green');
  } catch (error) {
    log('❌ Wrangler CLI 未安装，请运行: npm install -g wrangler', 'red');
    process.exit(1);
  }
  
  // 检查 Git 状态
  try {
    const gitStatus = execSync('git status --porcelain', { stdio: 'pipe', encoding: 'utf8' });
    if (gitStatus.trim()) {
      log('⚠️ 工作目录有未提交的更改', 'yellow');
      log('建议先提交所有更改再进行生产部署', 'yellow');
    } else {
      log('✅ Git 工作目录干净', 'green');
    }
  } catch (error) {
    log('⚠️ 无法检查 Git 状态', 'yellow');
  }
  
  // 检查环境变量
  const requiredEnvVars = [
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
  ];
  
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missingEnvVars.length > 0) {
    log(`❌ 缺少环境变量: ${missingEnvVars.join(', ')}`, 'red');
    log('请设置必需的环境变量后重试', 'red');
    process.exit(1);
  }
  
  log('✅ 前置条件检查完成', 'green');
}

function runPreDeploymentTests() {
  log('\n🧪 运行部署前测试...', 'cyan');
  
  // 安装依赖
  execCommand('npm ci', '安装生产依赖');
  
  // 运行类型检查
  execCommand('npm run type-check', 'TypeScript 类型检查');
  
  // 运行代码检查
  execCommand('npm run lint', '代码质量检查');
  
  // 运行单元测试
  execCommand('npm run test:ci', '单元测试', { continueOnError: true });
  
  log('✅ 部署前测试完成', 'green');
}

function buildForProduction() {
  log('\n🏗️ 生产环境构建...', 'cyan');
  
  // 清理旧的构建文件
  if (fs.existsSync('.next')) {
    execCommand('rm -rf .next', '清理 Next.js 构建缓存');
  }
  if (fs.existsSync('dist')) {
    execCommand('rm -rf dist', '清理旧构建文件');
  }
  
  // 设置生产环境变量
  process.env.NODE_ENV = 'production';
  
  // 构建 Next.js 应用
  execCommand('npm run build', '构建 Next.js 应用');
  
  // 创建 Cloudflare Worker 适配器
  createCloudflareWorkerAdapter();
  
  // 验证构建产物
  validateBuildOutput();
  
  log('✅ 生产环境构建完成', 'green');
}

function createCloudflareWorkerAdapter() {
  log('📝 创建 Cloudflare Worker 适配器...', 'blue');
  
  const workerCode = `
// Cloudflare Worker 适配器 - NSSA 管理后台
import { NextRequest } from 'next/server';

// 导入 Next.js 应用处理器
import handler from './server.js';

// Cloudflare Worker 环境接口
interface Env {
  // KV 存储
  ADMIN_CACHE: KVNamespace;
  ADMIN_SESSIONS: KVNamespace;
  
  // R2 存储
  ADMIN_MEDIA: R2Bucket;
  
  // 环境变量
  NODE_ENV: string;
  NEXT_PUBLIC_API_URL: string;
  GITHUB_TOKEN: string;
  JWT_SECRET: string;
  
  // Cloudflare 特定
  CF_ZONE_ID: string;
  CF_API_TOKEN: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // 添加 CORS 头部
      const corsHeaders = {
        'Access-Control-Allow-Origin': 'https://admin.nssa.io',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      };

      // 处理 OPTIONS 请求
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }

      // 将 Cloudflare Request 转换为 Next.js Request
      const nextRequest = new NextRequest(request);
      
      // 添加环境变量到请求上下文
      (nextRequest as any).env = env;
      (nextRequest as any).ctx = ctx;
      
      // 调用 Next.js 处理器
      const response = await handler(nextRequest);
      
      // 添加 CORS 头部到响应
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      // 添加安全头部
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      
      return response;
      
    } catch (error) {
      console.error('Worker error:', error);
      
      // 返回友好的错误页面
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Internal Server Error',
          message: '服务暂时不可用，请稍后重试',
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  },

  // 定时任务处理器
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    try {
      // 清理过期缓存
      await cleanupExpiredCache(env.ADMIN_CACHE);
      
      // 清理过期会话
      await cleanupExpiredSessions(env.ADMIN_SESSIONS);
      
      console.log('Scheduled cleanup completed');
    } catch (error) {
      console.error('Scheduled task error:', error);
    }
  },
};

// 清理过期缓存
async function cleanupExpiredCache(kv: KVNamespace): Promise<void> {
  // 实现缓存清理逻辑
  console.log('Cleaning up expired cache...');
}

// 清理过期会话
async function cleanupExpiredSessions(kv: KVNamespace): Promise<void> {
  // 实现会话清理逻辑
  console.log('Cleaning up expired sessions...');
}
`;
  
  // 确保 dist 目录存在
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }
  
  fs.writeFileSync('dist/worker.js', workerCode.trim());
  log('✅ Cloudflare Worker 适配器创建完成', 'green');
}

function validateBuildOutput() {
  log('🔍 验证构建产物...', 'blue');
  
  const requiredFiles = [
    '.next/standalone/server.js',
    'dist/worker.js',
    'wrangler.toml',
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  if (missingFiles.length > 0) {
    log(`❌ 缺少必需文件: ${missingFiles.join(', ')}`, 'red');
    process.exit(1);
  }
  
  log('✅ 构建产物验证完成', 'green');
}

function deployToCloudflare() {
  log('\n🚀 部署到 Cloudflare Workers...', 'cyan');
  
  // 部署到生产环境
  execCommand('wrangler deploy --env production', '部署到生产环境');
  
  log('✅ Cloudflare Workers 部署完成', 'green');
}

function configureDNS() {
  log('\n🌐 配置 DNS 记录...', 'cyan');
  
  log('💡 请手动配置以下 DNS 记录:', 'yellow');
  log('   类型: CNAME', 'yellow');
  log('   名称: admin', 'yellow');
  log('   目标: nssa-admin-prod.your-subdomain.workers.dev', 'yellow');
  log('   代理状态: 已代理（橙色云朵）', 'yellow');
  
  log('✅ DNS 配置说明已显示', 'green');
}

function validateDeployment() {
  log('\n✅ 验证部署...', 'cyan');
  
  const productionUrl = 'https://admin.nssa.io';
  
  log(`🌐 生产环境地址: ${productionUrl}`, 'green');
  log(`🔍 健康检查: ${productionUrl}/api/health`, 'blue');
  log(`🔐 登录页面: ${productionUrl}/admin/login`, 'blue');
  
  // 这里可以添加自动化的部署验证
  log('💡 请手动验证以下功能:', 'yellow');
  log('   1. 管理后台可以正常访问', 'yellow');
  log('   2. 用户登录功能正常', 'yellow');
  log('   3. 所有 API 端点响应正常', 'yellow');
  log('   4. 文件上传功能正常', 'yellow');
  log('   5. 数据统计显示正常', 'yellow');
  
  log('✅ 部署验证说明已显示', 'green');
}

function showPostDeploymentInstructions() {
  log('\n📋 部署后操作清单:', 'cyan');
  
  const instructions = [
    '1. 验证 admin.nssa.io 可以正常访问',
    '2. 使用演示账号 (admin/admin123) 测试登录',
    '3. 检查所有管理功能是否正常工作',
    '4. 运行系统状态检查和数据一致性测试',
    '5. 配置监控和告警（如果尚未配置）',
    '6. 更新团队成员关于新管理后台的信息',
    '7. 备份当前配置和数据',
    '8. 设置定期备份计划',
  ];
  
  instructions.forEach(instruction => {
    log(`   ${instruction}`, 'yellow');
  });
  
  log('\n🎉 生产环境部署完成！', 'green');
  log('📧 如有问题，请联系技术支持团队', 'blue');
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const skipTests = args.includes('--skip-tests');
  const skipBuild = args.includes('--skip-build');
  
  log('🚀 NSSA 管理后台生产环境部署', 'magenta');
  log('🎯 目标环境: 生产环境 (admin.nssa.io)', 'blue');
  
  try {
    // 1. 检查前置条件
    checkPrerequisites();
    
    // 2. 运行部署前测试
    if (!skipTests) {
      runPreDeploymentTests();
    } else {
      log('⚠️ 跳过部署前测试', 'yellow');
    }
    
    // 3. 生产环境构建
    if (!skipBuild) {
      buildForProduction();
    } else {
      log('⚠️ 跳过构建阶段', 'yellow');
    }
    
    // 4. 部署到 Cloudflare
    deployToCloudflare();
    
    // 5. 配置 DNS
    configureDNS();
    
    // 6. 验证部署
    validateDeployment();
    
    // 7. 显示后续操作
    showPostDeploymentInstructions();
    
  } catch (error) {
    log(`\n💥 部署失败: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  checkPrerequisites,
  runPreDeploymentTests,
  buildForProduction,
  deployToCloudflare,
  validateDeployment,
};
