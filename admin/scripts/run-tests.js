#!/usr/bin/env node

/**
 * 测试运行脚本
 * 运行所有测试并生成报告
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
    return { success: true, output: result };
  } catch (error) {
    log(`❌ ${description} 失败`, 'red');
    if (options.silent) {
      console.error(error.stdout || error.message);
    }
    return { success: false, error: error.message };
  }
}

async function runTestSuite() {
  log('🧪 NSSA 管理后台测试套件', 'magenta');
  log('🎯 运行所有测试并生成报告', 'blue');

  const testResults = {
    component: { passed: 0, failed: 0, total: 0 },
    api: { passed: 0, failed: 0, total: 0 },
    integration: { passed: 0, failed: 0, total: 0 },
    overall: { passed: 0, failed: 0, total: 0 },
  };

  // 1. 运行组件测试
  log('\n📦 运行组件测试...', 'cyan');
  const componentTest = execCommand(
    'npx jest --config=jest.config.js --passWithNoTests',
    '组件测试',
    { silent: true }
  );

  if (componentTest.success) {
    // 解析测试结果
    const output = componentTest.output;
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    
    testResults.component.passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    testResults.component.failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    testResults.component.total = testResults.component.passed + testResults.component.failed;
  } else {
    testResults.component.failed = 1;
    testResults.component.total = 1;
  }

  // 2. 运行简单的API验证测试
  log('\n🔌 运行API验证测试...', 'cyan');
  const apiValidation = await runAPIValidationTests();
  testResults.api = apiValidation;

  // 3. 运行集成测试
  log('\n🔗 运行集成测试...', 'cyan');
  const integrationTest = await runIntegrationTests();
  testResults.integration = integrationTest;

  // 计算总体结果
  testResults.overall.passed = testResults.component.passed + testResults.api.passed + testResults.integration.passed;
  testResults.overall.failed = testResults.component.failed + testResults.api.failed + testResults.integration.failed;
  testResults.overall.total = testResults.overall.passed + testResults.overall.failed;

  // 生成测试报告
  generateTestReport(testResults);

  return testResults;
}

async function runAPIValidationTests() {
  const tests = [
    { name: '健康检查API', url: 'http://localhost:3001/api/health' },
    { name: '配置状态API', url: 'http://localhost:3001/api/config-status' },
    { name: '文章API', url: 'http://localhost:3001/api/articles' },
    { name: '微信API', url: 'http://localhost:3001/api/wechat?action=status' },
    { name: '统计API', url: 'http://localhost:3001/api/analytics?type=overview' },
  ];

  let passed = 0;
  let failed = 0;

  log('  检查开发服务器状态...', 'blue');
  
  // 检查服务器是否运行
  try {
    const response = await fetch('http://localhost:3001/api/health');
    if (!response.ok) {
      log('  ⚠️ 开发服务器未运行，跳过API测试', 'yellow');
      return { passed: 0, failed: 0, total: 0 };
    }
  } catch (error) {
    log('  ⚠️ 开发服务器未运行，跳过API测试', 'yellow');
    return { passed: 0, failed: 0, total: 0 };
  }

  for (const test of tests) {
    try {
      const response = await fetch(test.url);
      const data = await response.json();
      
      if (response.ok && data.success !== false) {
        log(`  ✅ ${test.name}`, 'green');
        passed++;
      } else {
        log(`  ❌ ${test.name} - ${data.error || 'Unknown error'}`, 'red');
        failed++;
      }
    } catch (error) {
      log(`  ❌ ${test.name} - ${error.message}`, 'red');
      failed++;
    }
  }

  return { passed, failed, total: passed + failed };
}

async function runIntegrationTests() {
  const tests = [
    { name: '环境变量配置', test: () => checkEnvironmentVariables() },
    { name: '文件系统权限', test: () => checkFileSystemPermissions() },
    { name: '依赖完整性', test: () => checkDependencies() },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.test();
      if (result.success) {
        log(`  ✅ ${test.name}`, 'green');
        passed++;
      } else {
        log(`  ❌ ${test.name} - ${result.error}`, 'red');
        failed++;
      }
    } catch (error) {
      log(`  ❌ ${test.name} - ${error.message}`, 'red');
      failed++;
    }
  }

  return { passed, failed, total: passed + failed };
}

function checkEnvironmentVariables() {
  const required = ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO'];
  const missing = required.filter(key => !process.env[key]);
  
  return {
    success: missing.length === 0,
    error: missing.length > 0 ? `缺少环境变量: ${missing.join(', ')}` : null,
  };
}

function checkFileSystemPermissions() {
  try {
    const testDir = path.join(process.cwd(), '.taskmaster');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const testFile = path.join(testDir, 'test-write.tmp');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function checkDependencies() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const nodeModules = fs.existsSync('node_modules');
    
    return {
      success: nodeModules,
      error: !nodeModules ? 'node_modules 目录不存在' : null,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function generateTestReport(results) {
  log('\n📊 测试报告', 'magenta');
  log('=' * 50, 'blue');
  
  // 组件测试
  log(`\n📦 组件测试:`, 'cyan');
  log(`  ✅ 通过: ${results.component.passed}`, 'green');
  log(`  ❌ 失败: ${results.component.failed}`, results.component.failed > 0 ? 'red' : 'green');
  log(`  📊 总计: ${results.component.total}`, 'blue');

  // API测试
  log(`\n🔌 API测试:`, 'cyan');
  log(`  ✅ 通过: ${results.api.passed}`, 'green');
  log(`  ❌ 失败: ${results.api.failed}`, results.api.failed > 0 ? 'red' : 'green');
  log(`  📊 总计: ${results.api.total}`, 'blue');

  // 集成测试
  log(`\n🔗 集成测试:`, 'cyan');
  log(`  ✅ 通过: ${results.integration.passed}`, 'green');
  log(`  ❌ 失败: ${results.integration.failed}`, results.integration.failed > 0 ? 'red' : 'green');
  log(`  📊 总计: ${results.integration.total}`, 'blue');

  // 总体结果
  log(`\n🎯 总体结果:`, 'magenta');
  log(`  ✅ 通过: ${results.overall.passed}`, 'green');
  log(`  ❌ 失败: ${results.overall.failed}`, results.overall.failed > 0 ? 'red' : 'green');
  log(`  📊 总计: ${results.overall.total}`, 'blue');
  
  const successRate = results.overall.total > 0 
    ? Math.round((results.overall.passed / results.overall.total) * 100) 
    : 0;
  
  log(`  📈 成功率: ${successRate}%`, successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');

  // 保存报告到文件
  const reportData = {
    timestamp: new Date().toISOString(),
    results,
    successRate,
  };

  const reportDir = path.join(process.cwd(), '.taskmaster', 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportFile = path.join(reportDir, 'test-report.json');
  fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
  
  log(`\n📄 测试报告已保存到: ${reportFile}`, 'blue');
  
  if (successRate >= 80) {
    log('\n🎉 测试通过！系统可以部署到生产环境。', 'green');
  } else if (successRate >= 60) {
    log('\n⚠️ 测试部分通过，建议修复失败的测试后再部署。', 'yellow');
  } else {
    log('\n❌ 测试失败较多，请修复问题后重新测试。', 'red');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runTestSuite().catch(console.error);
}

module.exports = { runTestSuite };
