#!/usr/bin/env node

/**
 * NSSA 管理后台 - 部署测试脚本
 * 在实际部署前验证配置和文件
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

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(2);
    log(`✅ ${description}: ${filePath} (${size} KB)`, 'green');
    return true;
  } else {
    log(`❌ ${description}: ${filePath} 不存在`, 'red');
    return false;
  }
}

function checkWranglerConfig() {
  log('\n📋 检查 Wrangler 配置...', 'cyan');
  
  if (!checkFile('wrangler.toml', 'Wrangler 配置文件')) {
    return false;
  }
  
  try {
    const config = fs.readFileSync('wrangler.toml', 'utf8');
    
    // 检查必要的配置项
    const checks = [
      { key: 'name = "nssa-admin"', desc: '项目名称' },
      { key: 'main = "dist/worker.js"', desc: '入口文件' },
      { key: 'compatibility_date', desc: '兼容性日期' },
    ];
    
    let allPassed = true;
    checks.forEach(check => {
      if (config.includes(check.key)) {
        log(`✅ ${check.desc}: 已配置`, 'green');
      } else {
        log(`❌ ${check.desc}: 未找到配置`, 'red');
        allPassed = false;
      }
    });
    
    return allPassed;
  } catch (error) {
    log(`❌ 读取 wrangler.toml 失败: ${error.message}`, 'red');
    return false;
  }
}

function checkWorkerFile() {
  log('\n🔧 检查 Worker 文件...', 'cyan');
  
  if (!checkFile('dist/worker.js', 'Worker 入口文件')) {
    log('💡 提示: 运行 npm run build:worker 来生成文件', 'yellow');
    return false;
  }
  
  try {
    const workerCode = fs.readFileSync('dist/worker.js', 'utf8');
    
    // 检查关键函数
    const functions = [
      'handleApiRequest',
      'handleAdminInterface',
      'handleHealthCheck',
      'handleLogin',
      'handleAnalytics'
    ];
    
    let allFunctionsPresent = true;
    functions.forEach(func => {
      if (workerCode.includes(func)) {
        log(`✅ 函数 ${func}: 已定义`, 'green');
      } else {
        log(`❌ 函数 ${func}: 未找到`, 'red');
        allFunctionsPresent = false;
      }
    });
    
    return allFunctionsPresent;
  } catch (error) {
    log(`❌ 读取 Worker 文件失败: ${error.message}`, 'red');
    return false;
  }
}

function checkWranglerCLI() {
  log('\n🛠️ 检查 Wrangler CLI...', 'cyan');

  // 尝试本地和全局的wrangler
  const wranglerCommands = ['npx wrangler', 'wrangler'];

  for (const cmd of wranglerCommands) {
    try {
      const version = execSync(`${cmd} --version`, { encoding: 'utf8' }).trim();
      log(`✅ Wrangler CLI: ${version} (${cmd})`, 'green');

      // 检查登录状态
      try {
        execSync(`${cmd} whoami`, { stdio: 'pipe' });
        log('✅ Wrangler 已登录', 'green');
        return true;
      } catch (error) {
        log(`❌ Wrangler 未登录，请运行: ${cmd} auth login`, 'red');
        return false;
      }
    } catch (error) {
      // 继续尝试下一个命令
      continue;
    }
  }

  log('❌ Wrangler CLI 未找到，请运行: npm install wrangler --save-dev', 'red');
  return false;
}

function checkPackageScripts() {
  log('\n📦 检查 Package 脚本...', 'cyan');
  
  if (!checkFile('package.json', 'Package 配置文件')) {
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const scripts = packageJson.scripts || {};
    
    const requiredScripts = [
      'build:worker',
      'deploy',
      'test:env'
    ];
    
    let allScriptsPresent = true;
    requiredScripts.forEach(script => {
      if (scripts[script]) {
        log(`✅ 脚本 ${script}: 已定义`, 'green');
      } else {
        log(`❌ 脚本 ${script}: 未找到`, 'red');
        allScriptsPresent = false;
      }
    });
    
    return allScriptsPresent;
  } catch (error) {
    log(`❌ 读取 package.json 失败: ${error.message}`, 'red');
    return false;
  }
}

function runSyntaxCheck() {
  log('\n🔍 运行语法检查...', 'cyan');
  
  try {
    // 检查 Worker 文件语法
    execSync('node -c dist/worker.js', { stdio: 'pipe' });
    log('✅ Worker 文件语法正确', 'green');
    return true;
  } catch (error) {
    log(`❌ Worker 文件语法错误: ${error.message}`, 'red');
    return false;
  }
}

function generateDeploymentReport() {
  log('\n📊 生成部署报告...', 'cyan');
  
  const report = {
    timestamp: new Date().toISOString(),
    checks: {
      wranglerConfig: checkWranglerConfig(),
      workerFile: checkWorkerFile(),
      wranglerCLI: checkWranglerCLI(),
      packageScripts: checkPackageScripts(),
      syntaxCheck: runSyntaxCheck()
    }
  };
  
  const allPassed = Object.values(report.checks).every(check => check === true);
  
  // 保存报告
  fs.writeFileSync('deployment-report.json', JSON.stringify(report, null, 2));
  log('📄 部署报告已保存: deployment-report.json', 'blue');
  
  return { report, allPassed };
}

function showRecommendations(allPassed) {
  log('\n💡 建议和下一步操作:', 'cyan');
  
  if (allPassed) {
    log('🎉 所有检查都通过了！可以开始部署:', 'green');
    log('   npm run deploy', 'green');
    log('   或者: node scripts/deploy-simple.js', 'green');
  } else {
    log('⚠️ 发现问题，请先修复后再部署:', 'yellow');
    log('   1. 检查上述错误信息', 'yellow');
    log('   2. 运行 npm run build:worker 重新构建', 'yellow');
    log('   3. 确保 wrangler auth login 已登录', 'yellow');
    log('   4. 重新运行此测试脚本', 'yellow');
  }
  
  log('\n🔗 有用的命令:', 'blue');
  log('   npm run build:worker     # 构建 Worker', 'blue');
  log('   npm run test:env         # 测试环境变量', 'blue');
  log('   wrangler dev             # 本地调试', 'blue');
  log('   wrangler tail            # 查看日志', 'blue');
}

function main() {
  log('🧪 NSSA 管理后台部署测试', 'cyan');
  log('============================\n', 'cyan');
  
  try {
    const { report, allPassed } = generateDeploymentReport();
    
    log('\n📋 测试结果汇总:', 'cyan');
    Object.entries(report.checks).forEach(([check, passed]) => {
      const status = passed ? '✅ 通过' : '❌ 失败';
      const color = passed ? 'green' : 'red';
      log(`   ${check}: ${status}`, color);
    });
    
    showRecommendations(allPassed);
    
    if (allPassed) {
      log('\n🚀 准备就绪，可以部署！', 'green');
      process.exit(0);
    } else {
      log('\n🔧 需要修复问题后再部署', 'yellow');
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n💥 测试失败: ${error.message}`, 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkWranglerConfig,
  checkWorkerFile,
  checkWranglerCLI,
  checkPackageScripts,
  runSyntaxCheck,
};
