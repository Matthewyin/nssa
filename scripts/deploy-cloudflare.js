#!/usr/bin/env node

/**
 * NSSA Cloudflare Workers 部署脚本
 * 自动化部署到 Cloudflare Workers
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
  
  // 检查必要文件
  const requiredFiles = [
    'wrangler.toml',
    'workers-site/index.js',
    'package.json'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      log(`❌ 缺少必要文件: ${file}`, 'red');
      return false;
    }
  }
  
  // 检查 wrangler CLI
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

function checkAuthentication() {
  log('\n🔐 检查 Cloudflare 认证状态...', 'cyan');
  
  try {
    execSync('npx wrangler whoami', { stdio: 'pipe' });
    log('✅ Cloudflare 认证有效', 'green');
    return true;
  } catch (error) {
    log('❌ Cloudflare 认证失败', 'red');
    log('请运行以下命令之一进行认证:', 'yellow');
    log('  1. npx wrangler login  (OAuth 登录)', 'yellow');
    log('  2. export CLOUDFLARE_API_TOKEN="your-token"  (API Token)', 'yellow');
    return false;
  }
}

function buildSite() {
  log('\n🏗️ 构建网站...', 'cyan');
  
  // 构建 CSS
  if (!execCommand('npx tailwindcss -i ./assets/css/main.css -o ./static/css/main.css --watch=false', '构建 CSS')) {
    return false;
  }
  
  // 构建 Hugo 网站
  if (!execCommand('npx hugo --minify --gc', '构建 Hugo 网站')) {
    return false;
  }
  
  // 检查构建结果
  if (!fs.existsSync('public/index.html')) {
    log('❌ 构建输出不完整', 'red');
    return false;
  }
  
  log('✅ 网站构建完成', 'green');
  return true;
}

function deployToCloudflare(environment = 'production', dryRun = false) {
  log(`\n🚀 部署到 Cloudflare Workers (${environment})...`, 'cyan');
  
  let deployCommand;
  if (environment === 'production') {
    deployCommand = dryRun ? 'npx wrangler deploy --dry-run --env=""' : 'npx wrangler deploy --env=""';
  } else {
    deployCommand = dryRun ? `npx wrangler deploy --dry-run --env ${environment}` : `npx wrangler deploy --env ${environment}`;
  }
  
  const action = dryRun ? '验证部署配置' : `部署到 ${environment} 环境`;
  const deploySuccess = execCommand(deployCommand, action);
  
  if (!deploySuccess) {
    log(`❌ ${action}失败`, 'red');
    return false;
  }
  
  log(`✅ ${action}完成`, 'green');
  return true;
}

function main() {
  const args = process.argv.slice(2);
  const environment = args.includes('--staging') ? 'staging' : 'production';
  const dryRun = args.includes('--dry-run');
  const skipBuild = args.includes('--skip-build');
  
  log('🌟 NSSA Cloudflare Workers 部署工具', 'cyan');
  log(`📦 目标环境: ${environment}`, 'blue');
  log(`🔍 模式: ${dryRun ? '验证模式' : '部署模式'}`, 'blue');
  
  // 检查前置条件
  if (!checkPrerequisites()) {
    process.exit(1);
  }
  
  // 检查认证
  if (!checkAuthentication()) {
    process.exit(1);
  }
  
  // 构建网站
  if (!skipBuild && !buildSite()) {
    process.exit(1);
  }
  
  // 部署
  if (!deployToCloudflare(environment, dryRun)) {
    process.exit(1);
  }
  
  // 完成
  log('\n🎉 部署流程完成!', 'green');
  
  if (!dryRun) {
    if (environment === 'production') {
      log('🌐 生产环境: https://nssa.io', 'cyan');
    } else {
      log('🌐 测试环境: https://staging.nssa.io', 'cyan');
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkPrerequisites,
  checkAuthentication,
  buildSite,
  deployToCloudflare
};
