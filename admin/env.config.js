/**
 * 环境变量配置加载器
 * 从根目录的.env文件加载环境变量
 */

const path = require('path');
const fs = require('fs');

// 根目录路径
const rootDir = path.resolve(__dirname, '..');

// 环境变量文件路径
const envFiles = [
  path.join(rootDir, '.env'),
  path.join(rootDir, '.env.local'),
  path.join(__dirname, '.env.local'), // admin目录的本地配置（如果存在）
];

/**
 * 加载环境变量文件
 */
function loadEnvFiles() {
  const envVars = {};

  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      console.log(`Loading env file: ${envFile}`);
      
      const content = fs.readFileSync(envFile, 'utf8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // 跳过注释和空行
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          continue;
        }

        // 解析键值对
        const equalIndex = trimmedLine.indexOf('=');
        if (equalIndex > 0) {
          const key = trimmedLine.substring(0, equalIndex).trim();
          const value = trimmedLine.substring(equalIndex + 1).trim();
          
          // 移除引号
          const cleanValue = value.replace(/^["']|["']$/g, '');
          
          // 只有当环境变量不存在时才设置
          if (!process.env[key]) {
            process.env[key] = cleanValue;
            envVars[key] = cleanValue;
          }
        }
      }
    }
  }

  return envVars;
}

/**
 * 验证必需的环境变量
 */
function validateRequiredEnvVars() {
  const required = [
    'GITHUB_TOKEN',
    'GITHUB_OWNER',
    'GITHUB_REPO',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ 缺少必需的环境变量:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\n请在根目录的.env文件中配置这些变量');
    return false;
  }

  return true;
}

/**
 * 初始化环境变量
 */
function initEnv() {
  console.log('🔧 加载环境变量...');
  
  const loadedVars = loadEnvFiles();
  const isValid = validateRequiredEnvVars();

  if (isValid) {
    console.log('✅ 环境变量加载成功');
    console.log(`📁 项目根目录: ${rootDir}`);
    console.log(`🔗 GitHub仓库: ${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}`);
  } else {
    console.log('❌ 环境变量验证失败');
  }

  return { loadedVars, isValid };
}

module.exports = {
  loadEnvFiles,
  validateRequiredEnvVars,
  initEnv,
  rootDir,
};
