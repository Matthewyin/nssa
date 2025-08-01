#!/usr/bin/env node

/**
 * NSSA后台管理系统安装脚本
 * 自动化设置开发环境
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 NSSA后台管理系统安装脚本');
console.log('================================\n');

// 检查Node.js版本
function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  console.log(`📋 检查Node.js版本: ${nodeVersion}`);
  
  if (majorVersion < 18) {
    console.error('❌ 错误: 需要Node.js 18或更高版本');
    process.exit(1);
  }
  
  console.log('✅ Node.js版本检查通过\n');
}

// 检查必要的目录
function checkDirectories() {
  console.log('📁 检查项目目录结构...');
  
  const requiredDirs = [
    '../content',
    '../static',
    '../layouts',
  ];
  
  const missingDirs = [];
  
  for (const dir of requiredDirs) {
    const fullPath = path.resolve(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      missingDirs.push(dir);
    }
  }
  
  if (missingDirs.length > 0) {
    console.log('⚠️  警告: 以下NSSA主项目目录不存在:');
    missingDirs.forEach(dir => console.log(`   - ${dir}`));
    console.log('   请确保在NSSA主项目根目录下运行此脚本\n');
  } else {
    console.log('✅ 项目目录结构检查通过\n');
  }
}

// 安装依赖
function installDependencies() {
  console.log('📦 安装项目依赖...');
  
  try {
    execSync('npm install', { 
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });
    console.log('✅ 依赖安装完成\n');
  } catch (error) {
    console.error('❌ 依赖安装失败:', error.message);
    process.exit(1);
  }
}

// 检查环境变量配置
function checkEnvConfiguration() {
  console.log('⚙️  检查环境变量配置...');

  const rootEnvPath = path.resolve(__dirname, '../../.env');

  if (fs.existsSync(rootEnvPath)) {
    console.log('✅ 找到根目录的 .env 文件');

    // 检查必要的配置
    const envContent = fs.readFileSync(rootEnvPath, 'utf8');
    const hasGithubToken = envContent.includes('GITHUB_TOKEN=') && !envContent.includes('GITHUB_TOKEN=your_github');

    if (hasGithubToken) {
      console.log('✅ GitHub Token 已配置');
    } else {
      console.log('⚠️  请在根目录的 .env 文件中配置 GITHUB_TOKEN');
    }
    console.log('');
  } else {
    console.log('❌ 未找到根目录的 .env 文件');
    console.log('   请确保在NSSA项目根目录下运行此脚本\n');
  }
}

// 初始化Tina CMS
function initTinaCMS() {
  console.log('🎨 初始化Tina CMS...');
  
  try {
    // 检查是否已经初始化
    const tinaConfigPath = path.resolve(__dirname, '../tina/config.ts');
    if (fs.existsSync(tinaConfigPath)) {
      console.log('✅ Tina CMS已经配置\n');
      return;
    }
    
    // 运行Tina初始化
    execSync('npx @tinacms/cli init', { 
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });
    console.log('✅ Tina CMS初始化完成\n');
  } catch (error) {
    console.log('⚠️  Tina CMS初始化跳过（可能已存在配置）\n');
  }
}

// 验证安装
function validateInstallation() {
  console.log('🔍 验证安装...');
  
  const requiredFiles = [
    'package.json',
    'next.config.js',
    'tailwind.config.js',
    'tsconfig.json',
    'env.config.js',
  ];
  
  const missingFiles = [];
  
  for (const file of requiredFiles) {
    const filePath = path.resolve(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length > 0) {
    console.log('❌ 以下文件缺失:');
    missingFiles.forEach(file => console.log(`   - ${file}`));
    console.log('');
  } else {
    console.log('✅ 安装验证通过\n');
  }
}

// 显示下一步操作
function showNextSteps() {
  console.log('🎉 安装完成！');
  console.log('================\n');
  
  console.log('📝 下一步操作:');
  console.log('1. 确保根目录的 .env 文件已正确配置');
  console.log('   - GITHUB_TOKEN (必需)');
  console.log('   - 其他配置已自动添加');
  console.log('');
  console.log('2. 启动开发服务器:');
  console.log('   npm run dev');
  console.log('');
  console.log('3. 访问管理后台:');
  console.log('   - 主界面: http://localhost:3001');
  console.log('   - Tina CMS: http://localhost:3001/admin');
  console.log('');
  console.log('📚 更多信息请查看 README.md 文件');
}

// 主函数
function main() {
  try {
    checkNodeVersion();
    checkDirectories();
    installDependencies();
    checkEnvConfiguration();
    initTinaCMS();
    validateInstallation();
    showNextSteps();
  } catch (error) {
    console.error('❌ 安装过程中出现错误:', error.message);
    process.exit(1);
  }
}

// 运行安装脚本
if (require.main === module) {
  main();
}
