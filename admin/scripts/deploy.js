#!/usr/bin/env node

/**
 * NSSA 管理后台部署脚本
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

function execCommand(command, description) {
  log(`\n🔄 ${description}...`, 'blue');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} 完成`, 'green');
  } catch (error) {
    log(`❌ ${description} 失败`, 'red');
    process.exit(1);
  }
}

function checkPrerequisites() {
  log('\n🔍 检查部署前置条件...', 'cyan');
  
  // 检查 wrangler CLI
  try {
    execSync('wrangler --version', { stdio: 'pipe' });
    log('✅ Wrangler CLI 已安装', 'green');
  } catch (error) {
    log('❌ Wrangler CLI 未安装，请运行: npm install -g wrangler', 'red');
    process.exit(1);
  }
  
  // 检查环境变量
  const requiredSecrets = [
    'GITHUB_TOKEN',
    'JWT_SECRET',
  ];
  
  log('\n📋 需要设置的 Cloudflare Secrets:', 'yellow');
  requiredSecrets.forEach(secret => {
    log(`   - ${secret}`, 'yellow');
  });
  
  // 检查配置文件
  if (!fs.existsSync('wrangler.toml')) {
    log('❌ wrangler.toml 配置文件不存在', 'red');
    process.exit(1);
  }
  
  log('✅ 前置条件检查完成', 'green');
}

function runTests() {
  log('\n🧪 运行测试套件...', 'cyan');
  
  // 运行单元测试
  execCommand('npm run test:ci', '单元测试');
  
  // 运行类型检查
  execCommand('npm run type-check', '类型检查');
  
  // 运行代码检查
  execCommand('npm run lint', '代码检查');
  
  log('✅ 所有测试通过', 'green');
}

function buildProject() {
  log('\n🏗️ 构建项目...', 'cyan');
  
  // 清理旧的构建文件
  if (fs.existsSync('dist')) {
    execCommand('rm -rf dist', '清理旧构建文件');
  }
  
  // 构建 Next.js 应用
  execCommand('npm run build', '构建 Next.js 应用');
  
  // 创建 Worker 入口文件
  createWorkerEntry();
  
  log('✅ 项目构建完成', 'green');
}

function createWorkerEntry() {
  log('📝 创建 Cloudflare Worker 入口文件...', 'blue');
  
  const workerCode = `
// Cloudflare Worker 入口文件
import { NextRequest } from 'next/server';

// 导入 Next.js 应用
import handler from './server.js';

export default {
  async fetch(request, env, ctx) {
    try {
      // 将 Cloudflare Request 转换为 Next.js Request
      const nextRequest = new NextRequest(request);
      
      // 添加环境变量到请求上下文
      nextRequest.env = env;
      nextRequest.ctx = ctx;
      
      // 调用 Next.js 处理器
      return await handler(nextRequest);
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};
`;
  
  // 确保 dist 目录存在
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }
  
  fs.writeFileSync('dist/worker.js', workerCode.trim());
  log('✅ Worker 入口文件创建完成', 'green');
}

function deployToCloudflare(environment = 'production') {
  log(`\n🚀 部署到 Cloudflare Workers (${environment})...`, 'cyan');
  
  const deployCommand = environment === 'production' 
    ? 'wrangler deploy --env production'
    : `wrangler deploy --env ${environment}`;
  
  execCommand(deployCommand, `部署到 ${environment} 环境`);
  
  log(`✅ 部署到 ${environment} 环境完成`, 'green');
}

function setSecrets() {
  log('\n🔐 设置 Cloudflare Secrets...', 'cyan');
  
  const secrets = [
    'GITHUB_TOKEN',
    'JWT_SECRET',
    'WECHAT_A_APPID',
    'WECHAT_A_SECRET',
    'WECHAT_B_APPID',
    'WECHAT_B_SECRET',
  ];
  
  log('请手动设置以下 secrets:', 'yellow');
  secrets.forEach(secret => {
    log(`   wrangler secret put ${secret}`, 'yellow');
  });
  
  log('\n💡 提示: 你也可以使用 .env 文件批量设置 secrets', 'blue');
}

function validateDeployment(environment = 'production') {
  log('\n✅ 验证部署...', 'cyan');
  
  const baseUrl = environment === 'production' 
    ? 'https://admin.nssa.io'
    : `https://admin-${environment}.nssa.io`;
  
  log(`🌐 管理后台地址: ${baseUrl}`, 'green');
  log(`🔍 健康检查: ${baseUrl}/api/health`, 'blue');
  
  // 这里可以添加自动化的部署验证
  log('💡 请手动验证部署是否成功', 'yellow');
}

function showPostDeploymentInstructions() {
  log('\n📋 部署后操作清单:', 'cyan');
  
  const instructions = [
    '1. 验证管理后台可以正常访问',
    '2. 检查所有 API 端点是否正常工作',
    '3. 测试用户登录和权限系统',
    '4. 验证文件上传功能',
    '5. 检查微信公众号集成',
    '6. 配置监控和告警',
    '7. 更新 DNS 记录（如果需要）',
    '8. 通知团队成员新的管理后台地址',
  ];
  
  instructions.forEach(instruction => {
    log(`   ${instruction}`, 'yellow');
  });
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || 'production';
  const skipTests = args.includes('--skip-tests');
  
  log('🚀 NSSA 管理后台部署脚本', 'magenta');
  log(`📦 目标环境: ${environment}`, 'blue');
  
  try {
    // 1. 检查前置条件
    checkPrerequisites();
    
    // 2. 运行测试（可选）
    if (!skipTests) {
      runTests();
    } else {
      log('⚠️ 跳过测试阶段', 'yellow');
    }
    
    // 3. 构建项目
    buildProject();
    
    // 4. 部署到 Cloudflare
    deployToCloudflare(environment);
    
    // 5. 验证部署
    validateDeployment(environment);
    
    // 6. 显示后续操作
    showPostDeploymentInstructions();
    
    log('\n🎉 部署完成！', 'green');
    
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
  runTests,
  buildProject,
  deployToCloudflare,
  validateDeployment,
};
