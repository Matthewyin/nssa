#!/usr/bin/env node

/**
 * NSSA 管理后台 - 简化部署脚本
 * 专门用于修复Cloudflare Workers部署问题
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
    return true;
  } catch (error) {
    log(`❌ ${description} 失败: ${error.message}`, 'red');
    return false;
  }
}

function checkPrerequisites() {
  log('\n🔍 检查部署前置条件...', 'cyan');

  // 检查 wrangler CLI (本地或全局)
  const wranglerCommands = ['npx wrangler', 'wrangler'];
  let wranglerFound = false;

  for (const cmd of wranglerCommands) {
    try {
      execSync(`${cmd} --version`, { stdio: 'pipe' });
      log(`✅ Wrangler CLI 已安装 (${cmd})`, 'green');
      wranglerFound = true;
      break;
    } catch (error) {
      continue;
    }
  }

  if (!wranglerFound) {
    log('❌ Wrangler CLI 未安装，请运行: npm install wrangler --save-dev', 'red');
    return false;
  }
  
  // 检查配置文件
  if (!fs.existsSync('wrangler.toml')) {
    log('❌ wrangler.toml 配置文件不存在', 'red');
    return false;
  }
  
  // 检查worker文件
  if (!fs.existsSync('dist/worker.js')) {
    log('⚠️ Worker文件不存在，将自动构建', 'yellow');
  }
  
  log('✅ 前置条件检查完成', 'green');
  return true;
}

function buildWorker() {
  log('\n🏗️ 构建 Cloudflare Worker...', 'cyan');
  
  // 运行构建脚本
  const buildSuccess = execCommand('npm run build:worker', '构建Worker文件');
  
  if (!buildSuccess) {
    log('❌ Worker构建失败', 'red');
    return false;
  }
  
  // 验证构建结果
  if (!fs.existsSync('dist/worker.js')) {
    log('❌ Worker文件构建失败', 'red');
    return false;
  }
  
  const workerSize = fs.statSync('dist/worker.js').size;
  log(`📦 Worker文件大小: ${(workerSize / 1024).toFixed(2)} KB`, 'blue');
  
  return true;
}

function deployToCloudflare(environment = 'production') {
  log(`\n🚀 部署到 Cloudflare Workers (${environment})...`, 'cyan');

  const deployCommand = environment === 'production'
    ? 'npx wrangler deploy --env production'
    : `npx wrangler deploy --env ${environment}`;

  const deploySuccess = execCommand(deployCommand, `部署到 ${environment} 环境`);

  if (!deploySuccess) {
    log('❌ 部署失败', 'red');
    return false;
  }

  log(`✅ 部署到 ${environment} 环境完成`, 'green');
  return true;
}

function validateDeployment(environment = 'production') {
  log('\n✅ 验证部署...', 'cyan');
  
  const baseUrl = environment === 'production' 
    ? 'https://admin.nssa.io'
    : `https://admin-${environment}.nssa.io`;
  
  log(`🌐 管理后台地址: ${baseUrl}`, 'green');
  log(`🔍 健康检查: ${baseUrl}/api/health`, 'blue');
  log(`📊 分析数据: ${baseUrl}/api/analytics`, 'blue');
  
  log('\n💡 请手动验证以下功能:', 'yellow');
  log('   1. 访问管理后台主页', 'yellow');
  log('   2. 检查API健康状态', 'yellow');
  log('   3. 测试分析数据接口', 'yellow');
  log('   4. 验证系统信息接口', 'yellow');
}

function showTroubleshootingTips() {
  log('\n🔧 故障排除提示:', 'cyan');
  
  const tips = [
    '如果部署失败，请检查:',
    '  • Wrangler CLI 是否已登录: wrangler auth login',
    '  • 域名配置是否正确',
    '  • KV/R2 资源是否存在（当前已注释掉）',
    '',
    '如果访问失败，请检查:',
    '  • DNS 记录是否正确指向',
    '  • SSL 证书是否有效',
    '  • Cloudflare 代理是否启用',
    '',
    '常用调试命令:',
    '  • wrangler tail --env production  # 查看实时日志',
    '  • wrangler dev --env production   # 本地调试',
    '  • curl https://admin.nssa.io/api/health  # 测试API',
  ];
  
  tips.forEach(tip => {
    log(tip, 'yellow');
  });
}

function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || 'production';
  const skipBuild = args.includes('--skip-build');
  
  log('🚀 NSSA 管理后台简化部署脚本', 'cyan');
  log(`📦 目标环境: ${environment}`, 'blue');
  
  try {
    // 1. 检查前置条件
    if (!checkPrerequisites()) {
      process.exit(1);
    }
    
    // 2. 构建Worker（可选）
    if (!skipBuild) {
      if (!buildWorker()) {
        process.exit(1);
      }
    } else {
      log('⚠️ 跳过构建阶段', 'yellow');
    }
    
    // 3. 部署到 Cloudflare
    if (!deployToCloudflare(environment)) {
      process.exit(1);
    }
    
    // 4. 验证部署
    validateDeployment(environment);
    
    // 5. 显示故障排除提示
    showTroubleshootingTips();
    
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
  buildWorker,
  deployToCloudflare,
  validateDeployment,
};
