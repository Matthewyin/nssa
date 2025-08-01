#!/usr/bin/env node

/**
 * 部署前检查清单
 * 确保所有必要的配置和文件都已准备就绪
 */

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

class DeploymentChecker {
  constructor() {
    this.checks = [];
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;
  }

  /**
   * 运行完整的部署检查
   */
  async runDeploymentChecks() {
    log('🚀 NSSA 管理后台部署检查清单', 'magenta');
    log('🎯 确保生产部署准备就绪', 'blue');

    // 1. 环境配置检查
    await this.checkEnvironmentConfiguration();
    
    // 2. 文件完整性检查
    await this.checkFileIntegrity();
    
    // 3. 依赖检查
    await this.checkDependencies();
    
    // 4. 构建配置检查
    await this.checkBuildConfiguration();
    
    // 5. 安全配置检查
    await this.checkSecurityConfiguration();
    
    // 6. 性能配置检查
    await this.checkPerformanceConfiguration();
    
    // 7. 监控配置检查
    await this.checkMonitoringConfiguration();
    
    // 生成检查报告
    this.generateDeploymentReport();
    
    return {
      passed: this.passed,
      failed: this.failed,
      warnings: this.warnings,
      total: this.checks.length,
      ready: this.failed === 0,
    };
  }

  /**
   * 添加检查结果
   */
  addCheck(name, status, message, level = 'error') {
    this.checks.push({ name, status, message, level });
    
    if (status === 'pass') {
      this.passed++;
      log(`  ✅ ${name}`, 'green');
    } else if (status === 'warn') {
      this.warnings++;
      log(`  ⚠️ ${name} - ${message}`, 'yellow');
    } else {
      this.failed++;
      log(`  ❌ ${name} - ${message}`, 'red');
    }
  }

  /**
   * 检查环境配置
   */
  async checkEnvironmentConfiguration() {
    log('\n🔧 环境配置检查...', 'cyan');
    
    // 检查必需的环境变量
    const requiredEnvVars = [
      'GITHUB_TOKEN',
      'GITHUB_OWNER', 
      'GITHUB_REPO',
      'GITHUB_BRANCH',
      'JWT_SECRET',
    ];

    const optionalEnvVars = [
      'WECHAT_A_APPID',
      'WECHAT_A_SECRET',
      'WECHAT_B_APPID',
      'WECHAT_B_SECRET',
      'CLOUDFLARE_API_TOKEN',
    ];

    // 检查必需变量
    const missingRequired = requiredEnvVars.filter(key => !process.env[key]);
    if (missingRequired.length === 0) {
      this.addCheck('必需环境变量', 'pass', '所有必需环境变量已配置');
    } else {
      this.addCheck('必需环境变量', 'fail', `缺少: ${missingRequired.join(', ')}`);
    }

    // 检查可选变量
    const missingOptional = optionalEnvVars.filter(key => !process.env[key]);
    if (missingOptional.length === 0) {
      this.addCheck('可选环境变量', 'pass', '所有可选环境变量已配置');
    } else {
      this.addCheck('可选环境变量', 'warn', `未配置: ${missingOptional.join(', ')}`, 'warning');
    }

    // 检查JWT密钥强度
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.length >= 32) {
      this.addCheck('JWT密钥强度', 'pass', 'JWT密钥长度符合要求');
    } else {
      this.addCheck('JWT密钥强度', 'fail', 'JWT密钥长度不足32字符');
    }
  }

  /**
   * 检查文件完整性
   */
  async checkFileIntegrity() {
    log('\n📁 文件完整性检查...', 'cyan');
    
    const requiredFiles = [
      'package.json',
      'next.config.js',
      'wrangler.toml',
      'src/app/layout.tsx',
      'src/app/admin/page.tsx',
      'src/middleware.ts',
    ];

    const requiredDirectories = [
      'src/app/api',
      'src/components',
      'src/lib',
      'content',
      '.taskmaster',
    ];

    // 检查必需文件
    let missingFiles = 0;
    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        this.addCheck(`文件: ${file}`, 'pass', '文件存在');
      } else {
        this.addCheck(`文件: ${file}`, 'fail', '文件缺失');
        missingFiles++;
      }
    }

    // 检查必需目录
    let missingDirs = 0;
    for (const dir of requiredDirectories) {
      if (fs.existsSync(dir)) {
        this.addCheck(`目录: ${dir}`, 'pass', '目录存在');
      } else {
        this.addCheck(`目录: ${dir}`, 'fail', '目录缺失');
        missingDirs++;
      }
    }

    // 检查内容文件
    const contentDirs = ['tech', 'history', 'psychology', 'workplace'];
    let contentIssues = 0;
    for (const dir of contentDirs) {
      const contentPath = path.join('content', dir);
      if (fs.existsSync(contentPath)) {
        const files = fs.readdirSync(contentPath).filter(f => f.endsWith('.md'));
        if (files.length > 0) {
          this.addCheck(`内容: ${dir}`, 'pass', `包含 ${files.length} 个文件`);
        } else {
          this.addCheck(`内容: ${dir}`, 'warn', '目录为空', 'warning');
          contentIssues++;
        }
      } else {
        this.addCheck(`内容: ${dir}`, 'fail', '目录不存在');
        contentIssues++;
      }
    }
  }

  /**
   * 检查依赖
   */
  async checkDependencies() {
    log('\n📦 依赖检查...', 'cyan');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // 检查关键依赖
      const criticalDeps = [
        'next',
        'react',
        'typescript',
        '@types/node',
      ];

      for (const dep of criticalDeps) {
        if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
          this.addCheck(`依赖: ${dep}`, 'pass', '已安装');
        } else {
          this.addCheck(`依赖: ${dep}`, 'fail', '未安装');
        }
      }

      // 检查node_modules
      if (fs.existsSync('node_modules')) {
        this.addCheck('node_modules', 'pass', '依赖已安装');
      } else {
        this.addCheck('node_modules', 'fail', '需要运行 npm install');
      }

    } catch (error) {
      this.addCheck('package.json', 'fail', '无法读取package.json');
    }
  }

  /**
   * 检查构建配置
   */
  async checkBuildConfiguration() {
    log('\n🏗️ 构建配置检查...', 'cyan');
    
    // 检查Next.js配置
    try {
      const nextConfig = require(path.join(process.cwd(), 'next.config.js'));
      this.addCheck('Next.js配置', 'pass', 'next.config.js 可读取');
    } catch (error) {
      this.addCheck('Next.js配置', 'fail', 'next.config.js 有错误');
    }

    // 检查Wrangler配置
    if (fs.existsSync('wrangler.toml')) {
      this.addCheck('Wrangler配置', 'pass', 'wrangler.toml 存在');
    } else {
      this.addCheck('Wrangler配置', 'fail', 'wrangler.toml 缺失');
    }

    // 检查TypeScript配置
    if (fs.existsSync('tsconfig.json')) {
      this.addCheck('TypeScript配置', 'pass', 'tsconfig.json 存在');
    } else {
      this.addCheck('TypeScript配置', 'warn', 'tsconfig.json 缺失', 'warning');
    }

    // 检查构建脚本
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      if (packageJson.scripts?.build) {
        this.addCheck('构建脚本', 'pass', 'build 脚本已配置');
      } else {
        this.addCheck('构建脚本', 'fail', 'build 脚本缺失');
      }
    } catch (error) {
      this.addCheck('构建脚本', 'fail', '无法检查构建脚本');
    }
  }

  /**
   * 检查安全配置
   */
  async checkSecurityConfiguration() {
    log('\n🔒 安全配置检查...', 'cyan');
    
    // 检查中间件
    if (fs.existsSync('src/middleware.ts')) {
      this.addCheck('安全中间件', 'pass', 'middleware.ts 存在');
    } else {
      this.addCheck('安全中间件', 'fail', 'middleware.ts 缺失');
    }

    // 检查.gitignore
    if (fs.existsSync('.gitignore')) {
      const gitignore = fs.readFileSync('.gitignore', 'utf8');
      if (gitignore.includes('.env') && gitignore.includes('node_modules')) {
        this.addCheck('Git忽略配置', 'pass', '.gitignore 配置正确');
      } else {
        this.addCheck('Git忽略配置', 'warn', '.gitignore 可能不完整', 'warning');
      }
    } else {
      this.addCheck('Git忽略配置', 'fail', '.gitignore 缺失');
    }

    // 检查敏感文件
    const sensitiveFiles = ['.env.local', '.env.production', 'secrets.json'];
    let exposedFiles = [];
    for (const file of sensitiveFiles) {
      if (fs.existsSync(file)) {
        exposedFiles.push(file);
      }
    }

    if (exposedFiles.length === 0) {
      this.addCheck('敏感文件检查', 'pass', '未发现敏感文件');
    } else {
      this.addCheck('敏感文件检查', 'warn', `发现敏感文件: ${exposedFiles.join(', ')}`, 'warning');
    }
  }

  /**
   * 检查性能配置
   */
  async checkPerformanceConfiguration() {
    log('\n⚡ 性能配置检查...', 'cyan');
    
    // 检查缓存配置
    const cacheFiles = [
      'src/lib/cache.ts',
      'src/lib/real-stats.ts',
    ];

    for (const file of cacheFiles) {
      if (fs.existsSync(file)) {
        this.addCheck(`缓存: ${path.basename(file)}`, 'pass', '缓存模块存在');
      } else {
        this.addCheck(`缓存: ${path.basename(file)}`, 'warn', '缓存模块缺失', 'warning');
      }
    }

    // 检查静态资源优化
    if (fs.existsSync('public')) {
      this.addCheck('静态资源', 'pass', 'public 目录存在');
    } else {
      this.addCheck('静态资源', 'warn', 'public 目录缺失', 'warning');
    }
  }

  /**
   * 检查监控配置
   */
  async checkMonitoringConfiguration() {
    log('\n📊 监控配置检查...', 'cyan');
    
    // 检查健康检查API
    if (fs.existsSync('src/app/api/health/route.ts')) {
      this.addCheck('健康检查API', 'pass', '健康检查端点存在');
    } else {
      this.addCheck('健康检查API', 'fail', '健康检查端点缺失');
    }

    // 检查错误处理
    if (fs.existsSync('src/app/error.tsx')) {
      this.addCheck('错误处理', 'pass', '错误页面存在');
    } else {
      this.addCheck('错误处理', 'warn', '错误页面缺失', 'warning');
    }

    // 检查日志配置
    const logFiles = fs.readdirSync('src/lib').filter(f => f.includes('log'));
    if (logFiles.length > 0) {
      this.addCheck('日志配置', 'pass', '日志模块存在');
    } else {
      this.addCheck('日志配置', 'warn', '日志模块缺失', 'warning');
    }
  }

  /**
   * 生成部署报告
   */
  generateDeploymentReport() {
    log('\n📋 部署检查报告', 'magenta');
    log('=' * 50, 'blue');
    
    log(`\n📊 检查统计:`, 'cyan');
    log(`  ✅ 通过: ${this.passed}`, 'green');
    log(`  ⚠️ 警告: ${this.warnings}`, 'yellow');
    log(`  ❌ 失败: ${this.failed}`, 'red');
    log(`  📊 总计: ${this.checks.length}`, 'blue');
    
    const successRate = Math.round((this.passed / this.checks.length) * 100);
    log(`  📈 通过率: ${successRate}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');

    // 部署建议
    log(`\n🎯 部署建议:`, 'magenta');
    if (this.failed === 0) {
      if (this.warnings === 0) {
        log('  🚀 完美！系统已准备好部署到生产环境', 'green');
      } else {
        log('  ✅ 系统可以部署，但建议修复警告项', 'yellow');
      }
    } else if (this.failed <= 2) {
      log('  ⚠️ 修复关键问题后可以部署', 'yellow');
    } else {
      log('  ❌ 请修复所有失败项后再部署', 'red');
    }

    // 保存报告
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        passed: this.passed,
        warnings: this.warnings,
        failed: this.failed,
        total: this.checks.length,
        successRate,
        ready: this.failed === 0,
      },
      checks: this.checks,
    };

    const reportDir = path.join(process.cwd(), '.taskmaster', 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportFile = path.join(reportDir, 'deployment-checklist.json');
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
    
    log(`\n📄 部署检查报告已保存到: ${reportFile}`, 'blue');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const checker = new DeploymentChecker();
  checker.runDeploymentChecks().catch(console.error);
}

module.exports = { DeploymentChecker };
