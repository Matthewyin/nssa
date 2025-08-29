#!/usr/bin/env node

/**
 * NSSA 部署状态检查脚本
 * 检查网站部署状态和可访问性
 */

const https = require('https');
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

function checkUrl(url) {
  return new Promise((resolve) => {
    const request = https.get(url, (response) => {
      resolve({
        url,
        status: response.statusCode,
        success: response.statusCode >= 200 && response.statusCode < 300
      });
    });

    request.on('error', () => {
      resolve({
        url,
        status: 'ERROR',
        success: false
      });
    });

    request.setTimeout(10000, () => {
      request.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        success: false
      });
    });
  });
}

async function checkDeploymentStatus() {
  log('\n🔍 检查 NSSA 部署状态...', 'cyan');

  // 检查 Wrangler 状态
  try {
    const output = execSync('npx wrangler deployments list --name nssa', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    log('✅ Cloudflare Workers 连接正常', 'green');
  } catch (error) {
    log('❌ Cloudflare Workers 连接失败', 'red');
    return false;
  }

  // 检查网站可访问性
  const urls = [
    'https://nssa.io',
    'https://www.nssa.io',
    'https://nssa.io/about',
    'https://nssa.io/admin'
  ];

  log('\n🌐 检查网站可访问性...', 'cyan');

  const results = await Promise.all(urls.map(checkUrl));

  results.forEach(result => {
    if (result.success) {
      log(`✅ ${result.url} - ${result.status}`, 'green');
    } else {
      log(`❌ ${result.url} - ${result.status}`, 'red');
    }
  });

  const allSuccess = results.every(r => r.success);
  
  if (allSuccess) {
    log('\n🎉 所有检查通过！网站运行正常', 'green');
  } else {
    log('\n⚠️  部分检查失败，请查看上述详情', 'yellow');
  }

  return allSuccess;
}

async function main() {
  log('🌟 NSSA 部署状态检查工具', 'cyan');
  
  const success = await checkDeploymentStatus();
  
  if (success) {
    log('\n📊 快速链接:', 'blue');
    log('🌐 主站: https://nssa.io', 'cyan');
    log('⚙️  管理: https://nssa.io/admin', 'cyan');
    log('📈 分析: https://dash.cloudflare.com/9a11012bc783e85de4ed991b8df456d2/workers-and-pages', 'cyan');
  }

  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { checkDeploymentStatus, checkUrl };
