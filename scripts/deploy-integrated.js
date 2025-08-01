#!/usr/bin/env node

/**
 * NSSA 集成部署脚本
 * 将主站和Admin合并部署到同一个Worker
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
    log(`❌ ${description} 失败`, 'red');
    return false;
  }
}

function checkPrerequisites() {
  log('\n🔍 检查部署前置条件...', 'cyan');
  
  // 检查Hugo构建
  if (!fs.existsSync('public')) {
    log('❌ public 目录不存在，请先运行 Hugo 构建', 'red');
    return false;
  }
  
  // 检查Worker文件
  if (!fs.existsSync('workers-site/index.js')) {
    log('❌ Worker 文件不存在', 'red');
    return false;
  }
  
  // 检查wrangler配置
  if (!fs.existsSync('wrangler.toml')) {
    log('❌ wrangler.toml 配置文件不存在', 'red');
    return false;
  }
  
  // 检查wrangler CLI
  try {
    execSync('npx wrangler --version', { stdio: 'pipe' });
    log('✅ Wrangler CLI 可用', 'green');
  } catch (error) {
    log('❌ Wrangler CLI 不可用', 'red');
    return false;
  }
  
  log('✅ 前置条件检查完成', 'green');
  return true;
}

function buildHugoSite() {
  log('\n🏗️ 构建 Hugo 静态网站...', 'cyan');
  
  const buildSuccess = execCommand('hugo --minify', '构建Hugo网站');
  
  if (!buildSuccess) {
    log('❌ Hugo构建失败', 'red');
    return false;
  }
  
  // 检查构建结果
  if (!fs.existsSync('public/index.html')) {
    log('❌ Hugo构建输出不完整', 'red');
    return false;
  }
  
  log('✅ Hugo网站构建完成', 'green');
  return true;
}

function validateWorkerCode() {
  log('\n🔍 验证 Worker 代码...', 'cyan');
  
  try {
    // 检查Worker文件是否存在
    if (!fs.existsSync('workers-site/index.js')) {
      log('❌ Worker 文件不存在', 'red');
      return false;
    }

    log('✅ Worker 文件存在', 'green');

    // 检查是否包含Admin功能
    const workerCode = fs.readFileSync('workers-site/index.js', 'utf8');
    
    const requiredFunctions = [
      'handleAdminRequest',
      'handleAdminApiRequest',
      'handleAdminInterface',
      'getAdminHTML'
    ];
    
    let allFunctionsPresent = true;
    requiredFunctions.forEach(func => {
      if (workerCode.includes(func)) {
        log(`✅ 函数 ${func}: 已定义`, 'green');
      } else {
        log(`❌ 函数 ${func}: 未找到`, 'red');
        allFunctionsPresent = false;
      }
    });
    
    return allFunctionsPresent;
  } catch (error) {
    log(`❌ Worker 代码验证失败: ${error.message}`, 'red');
    return false;
  }
}

function deployToCloudflare(environment = 'production') {
  log(`\n🚀 部署到 Cloudflare Workers (${environment})...`, 'cyan');
  
  const deployCommand = environment === 'production' 
    ? 'npx wrangler deploy'
    : `npx wrangler deploy --env ${environment}`;
  
  const deploySuccess = execCommand(deployCommand, `部署到 ${environment} 环境`);
  
  if (!deploySuccess) {
    log('❌ 部署失败', 'red');
    return false;
  }
  
  log(`✅ 部署到 ${environment} 环境完成`, 'green');
  return true;
}

function validateDeployment() {
  log('\n✅ 验证部署结果...', 'cyan');
  
  const urls = [
    'https://nssa.io',
    'https://www.nssa.io', 
    'https://admin.nssa.io'
  ];
  
  log('🌐 部署的URL:', 'green');
  urls.forEach(url => {
    log(`   ${url}`, 'blue');
  });
  
  log('\n🔍 请手动验证以下功能:', 'yellow');
  log('   主站功能:', 'yellow');
  log('     • 访问 https://nssa.io', 'yellow');
  log('     • 检查文章页面加载', 'yellow');
  log('     • 测试PV统计API', 'yellow');
  log('     • 测试点赞功能', 'yellow');
  
  log('   管理后台功能:', 'yellow');
  log('     • 访问 https://admin.nssa.io', 'yellow');
  log('     • 检查管理界面加载', 'yellow');
  log('     • 测试健康检查API', 'yellow');
  log('     • 测试分析数据API', 'yellow');
  log('     • 测试集成功能', 'yellow');
}

function showDeploymentSummary() {
  log('\n📊 部署总结:', 'cyan');
  log('🎯 架构特点:', 'blue');
  log('   • 单一Worker部署，简化管理', 'green');
  log('   • 主站和Admin共享资源', 'green');
  log('   • 基于域名的路由分发', 'green');
  log('   • 统一的KV存储访问', 'green');
  
  log('\n🌐 域名配置:', 'blue');
  log('   • nssa.io → 主站', 'green');
  log('   • www.nssa.io → 主站', 'green');
  log('   • admin.nssa.io → 管理后台', 'green');
  
  log('\n⚡ 性能优势:', 'blue');
  log('   • 减少冷启动时间', 'green');
  log('   • 共享缓存和连接', 'green');
  log('   • 统一的错误处理', 'green');
  log('   • 简化的部署流程', 'green');
}

function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || 'production';
  const skipBuild = args.includes('--skip-build');
  
  log('🚀 NSSA 集成部署脚本', 'cyan');
  log('======================\n', 'cyan');
  log(`📦 目标环境: ${environment}`, 'blue');
  
  try {
    // 1. 检查前置条件
    if (!checkPrerequisites()) {
      process.exit(1);
    }
    
    // 2. 构建Hugo网站（可选）
    if (!skipBuild) {
      if (!buildHugoSite()) {
        process.exit(1);
      }
    } else {
      log('⚠️ 跳过Hugo构建阶段', 'yellow');
    }
    
    // 3. 验证Worker代码
    if (!validateWorkerCode()) {
      process.exit(1);
    }
    
    // 4. 部署到Cloudflare
    if (!deployToCloudflare(environment)) {
      process.exit(1);
    }
    
    // 5. 验证部署
    validateDeployment();
    
    // 6. 显示总结
    showDeploymentSummary();
    
    log('\n🎉 集成部署完成！', 'green');
    
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
  buildHugoSite,
  validateWorkerCode,
  deployToCloudflare,
  validateDeployment,
};
