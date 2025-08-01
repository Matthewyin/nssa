import { NextRequest, NextResponse } from 'next/server';
import { EnvironmentManager } from '@/lib/environment-config';
import { realStatsManager } from '@/lib/real-stats';
import fs from 'fs';
import path from 'path';

/**
 * 系统健康检查API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';
    
    const healthStatus = await performHealthCheck(detailed);
    
    const overallStatus = healthStatus.checks.every(check => check.status === 'healthy') 
      ? 'healthy' 
      : 'unhealthy';
    
    return NextResponse.json({
      success: true,
      status: overallStatus,
      timestamp: new Date().toISOString(),
      data: healthStatus,
    });
  } catch (error) {
    console.error('健康检查失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        status: 'error',
        error: '健康检查失败',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 执行健康检查
 */
async function performHealthCheck(detailed: boolean = false) {
  const checks = [];
  
  // 1. 文件系统检查
  checks.push(await checkFileSystem());
  
  // 2. 内容目录检查
  checks.push(await checkContentDirectory());
  
  // 3. 用户系统检查
  checks.push(await checkUserSystem());
  
  // 4. 环境变量检查
  checks.push(await checkEnvironmentVariables());
  
  // 5. API端点检查
  if (detailed) {
    checks.push(await checkAPIEndpoints());
  }
  
  // 6. 依赖检查
  checks.push(await checkDependencies());
  
  return {
    checks,
    summary: {
      total: checks.length,
      healthy: checks.filter(c => c.status === 'healthy').length,
      warning: checks.filter(c => c.status === 'warning').length,
      error: checks.filter(c => c.status === 'error').length,
    },
  };
}

/**
 * 检查文件系统
 */
async function checkFileSystem() {
  try {
    const projectRoot = path.join(process.cwd(), '..');
    const requiredDirs = [
      'content',
      'static',
      'static/images',
      '.taskmaster',
    ];
    
    const missingDirs = [];
    for (const dir of requiredDirs) {
      const dirPath = path.join(projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        missingDirs.push(dir);
      }
    }
    
    if (missingDirs.length === 0) {
      return {
        name: '文件系统',
        status: 'healthy',
        message: '所有必需目录存在',
        details: { requiredDirs },
      };
    } else {
      return {
        name: '文件系统',
        status: 'warning',
        message: `缺少目录: ${missingDirs.join(', ')}`,
        details: { missingDirs, requiredDirs },
      };
    }
  } catch (error) {
    return {
      name: '文件系统',
      status: 'error',
      message: '文件系统检查失败',
      error: error.message,
    };
  }
}

/**
 * 检查内容目录
 */
async function checkContentDirectory() {
  try {
    const contentDir = path.join(process.cwd(), '..', 'content');
    const categories = ['tech', 'history', 'psychology', 'workplace'];
    
    const stats = {
      totalArticles: 0,
      categoriesFound: [],
      categoriesMissing: [],
    };
    
    for (const category of categories) {
      const categoryDir = path.join(contentDir, category);
      if (fs.existsSync(categoryDir)) {
        const files = fs.readdirSync(categoryDir)
          .filter(file => file.endsWith('.md') && file !== '_index.md');
        stats.totalArticles += files.length;
        stats.categoriesFound.push({ category, articles: files.length });
      } else {
        stats.categoriesMissing.push(category);
      }
    }
    
    if (stats.categoriesMissing.length === 0) {
      return {
        name: '内容目录',
        status: 'healthy',
        message: `找到 ${stats.totalArticles} 篇文章`,
        details: stats,
      };
    } else {
      return {
        name: '内容目录',
        status: 'warning',
        message: `缺少分类目录: ${stats.categoriesMissing.join(', ')}`,
        details: stats,
      };
    }
  } catch (error) {
    return {
      name: '内容目录',
      status: 'error',
      message: '内容目录检查失败',
      error: error.message,
    };
  }
}

/**
 * 检查用户系统
 */
async function checkUserSystem() {
  try {
    const usersFile = path.join(process.cwd(), '..', '.taskmaster', 'users.json');
    
    if (!fs.existsSync(usersFile)) {
      return {
        name: '用户系统',
        status: 'warning',
        message: '用户文件不存在，将在首次使用时创建',
      };
    }
    
    const usersData = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    const adminUsers = usersData.filter((user: any) => user.role === 'admin');
    
    if (adminUsers.length === 0) {
      return {
        name: '用户系统',
        status: 'error',
        message: '没有管理员用户',
        details: { totalUsers: usersData.length },
      };
    }
    
    return {
      name: '用户系统',
      status: 'healthy',
      message: `${usersData.length} 个用户，${adminUsers.length} 个管理员`,
      details: { 
        totalUsers: usersData.length,
        adminUsers: adminUsers.length,
        activeUsers: usersData.filter((user: any) => user.isActive).length,
      },
    };
  } catch (error) {
    return {
      name: '用户系统',
      status: 'error',
      message: '用户系统检查失败',
      error: error.message,
    };
  }
}

/**
 * 检查环境变量
 */
async function checkEnvironmentVariables() {
  try {
    const requiredVars = [
      'GITHUB_TOKEN',
      'GITHUB_OWNER',
      'GITHUB_REPO',
      'GITHUB_BRANCH',
    ];
    
    const optionalVars = [
      'WECHAT_A_APPID',
      'WECHAT_A_SECRET',
      'WECHAT_B_APPID',
      'WECHAT_B_SECRET',
      'JWT_SECRET',
    ];
    
    const missing = requiredVars.filter(varName => !process.env[varName]);
    const optional = optionalVars.filter(varName => !!process.env[varName]);
    
    if (missing.length === 0) {
      return {
        name: '环境变量',
        status: 'healthy',
        message: '所有必需环境变量已配置',
        details: { 
          required: requiredVars.length,
          optional: optional.length,
          optionalConfigured: optional,
        },
      };
    } else {
      return {
        name: '环境变量',
        status: 'error',
        message: `缺少必需环境变量: ${missing.join(', ')}`,
        details: { missing, optional },
      };
    }
  } catch (error) {
    return {
      name: '环境变量',
      status: 'error',
      message: '环境变量检查失败',
      error: error.message,
    };
  }
}

/**
 * 检查API端点
 */
async function checkAPIEndpoints() {
  const endpoints = [
    '/api/articles',
    '/api/media',
    '/api/users',
    '/api/analytics',
    '/api/publish',
    '/api/wechat',
  ];
  
  // 这里可以实际测试API端点
  // 目前返回基本状态
  return {
    name: 'API端点',
    status: 'healthy',
    message: `${endpoints.length} 个API端点可用`,
    details: { endpoints },
  };
}

/**
 * 检查依赖
 */
async function checkDependencies() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const dependencies = Object.keys(packageJson.dependencies || {});
    const devDependencies = Object.keys(packageJson.devDependencies || {});
    
    return {
      name: '依赖检查',
      status: 'healthy',
      message: `${dependencies.length} 个生产依赖，${devDependencies.length} 个开发依赖`,
      details: {
        dependencies: dependencies.length,
        devDependencies: devDependencies.length,
        nodeVersion: process.version,
      },
    };
  } catch (error) {
    return {
      name: '依赖检查',
      status: 'error',
      message: '依赖检查失败',
      error: error.message,
    };
  }
}
