#!/usr/bin/env node

/**
 * 环境变量测试脚本
 * 验证admin系统能否正确读取根目录的.env文件
 */

const path = require('path');
const { initEnv } = require('../env.config.js');

console.log('🧪 NSSA Admin 环境变量测试');
console.log('============================\n');

// 初始化环境变量
const { loadedVars, isValid } = initEnv();

console.log('\n📋 环境变量检查结果:');
console.log('====================');

// 检查关键环境变量
const keyVars = [
  'GITHUB_TOKEN',
  'GITHUB_OWNER', 
  'GITHUB_REPO',
  'GITHUB_BRANCH',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_MAIN_SITE_URL',
  'NEXT_PUBLIC_TINA_BRANCH',
  'WECHAT_A_APPID',
  'CLOUDFLARE_API_TOKEN',
];

keyVars.forEach(key => {
  const value = process.env[key];
  if (value) {
    // 遮蔽敏感信息
    const displayValue = key.includes('TOKEN') || key.includes('SECRET') 
      ? `${value.substring(0, 4)}***${value.substring(value.length - 4)}`
      : value;
    console.log(`✅ ${key}: ${displayValue}`);
  } else {
    console.log(`❌ ${key}: 未设置`);
  }
});

console.log('\n🔍 路径检查:');
console.log('============');

const paths = [
  { name: '项目根目录', path: path.resolve(__dirname, '../..') },
  { name: 'Admin目录', path: path.resolve(__dirname, '..') },
  { name: 'Content目录', path: path.resolve(__dirname, '../../content') },
  { name: 'Static目录', path: path.resolve(__dirname, '../../static') },
];

paths.forEach(({ name, path: dirPath }) => {
  const fs = require('fs');
  if (fs.existsSync(dirPath)) {
    console.log(`✅ ${name}: ${dirPath}`);
  } else {
    console.log(`❌ ${name}: ${dirPath} (不存在)`);
  }
});

console.log('\n🎯 总结:');
console.log('=======');

if (isValid) {
  console.log('✅ 环境配置正确，可以启动admin系统');
  console.log('\n🚀 启动命令:');
  console.log('   npm run dev');
  console.log('\n🌐 访问地址:');
  console.log(`   管理后台: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}`);
  console.log(`   Tina CMS: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/admin`);
} else {
  console.log('❌ 环境配置有问题，请检查根目录的.env文件');
  console.log('\n📝 需要配置的变量:');
  console.log('   GITHUB_TOKEN=your_github_token');
  console.log('   GITHUB_OWNER=Matthewyin');
  console.log('   GITHUB_REPO=nssa');
}

console.log('');
