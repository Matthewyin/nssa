import { NextRequest, NextResponse } from 'next/server';

/**
 * 数据一致性验证API
 */
export async function GET(request: NextRequest) {
  try {
    const validationResults = await performDataValidation();
    
    const overallStatus = validationResults.every(result => result.status === 'pass') 
      ? 'pass' 
      : 'fail';
    
    return NextResponse.json({
      success: true,
      status: overallStatus,
      timestamp: new Date().toISOString(),
      data: {
        results: validationResults,
        summary: {
          total: validationResults.length,
          passed: validationResults.filter(r => r.status === 'pass').length,
          failed: validationResults.filter(r => r.status === 'fail').length,
          warnings: validationResults.filter(r => r.status === 'warning').length,
        },
      },
    });
  } catch (error) {
    console.error('数据验证失败:', error);
    return NextResponse.json(
      { success: false, error: '数据验证失败' },
      { status: 500 }
    );
  }
}

/**
 * 执行数据一致性验证
 */
async function performDataValidation() {
  const results = [];
  
  // 1. 验证文章API数据一致性
  results.push(await validateArticlesAPI());
  
  // 2. 验证媒体API数据一致性
  results.push(await validateMediaAPI());
  
  // 3. 验证分析API数据一致性
  results.push(await validateAnalyticsAPI());
  
  // 4. 验证用户API数据一致性
  results.push(await validateUsersAPI());
  
  // 5. 验证发布API数据一致性
  results.push(await validatePublishAPI());

  // 6. 验证微信API数据一致性
  results.push(await validateWechatAPI());

  // 7. 验证系统健康API
  results.push(await validateHealthAPI());

  // 8. 验证缓存系统
  results.push(await validateCacheAPI());

  return results;
}

/**
 * 验证文章API
 */
async function validateArticlesAPI() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/articles`);
    const data = await response.json();
    
    if (!data.success) {
      return {
        name: '文章API',
        status: 'fail',
        message: '文章API调用失败',
        details: { error: data.error },
      };
    }
    
    const articles = data.data;
    const issues = [];
    
    // 检查数据结构
    if (!Array.isArray(articles)) {
      issues.push('返回数据不是数组');
    } else {
      // 检查每篇文章的必需字段
      articles.forEach((article, index) => {
        if (!article.id) issues.push(`文章${index + 1}缺少id字段`);
        if (!article.title || article.title === 'Untitled') {
          issues.push(`文章${index + 1}标题为空或未命名`);
        }
        if (!article.category) issues.push(`文章${index + 1}缺少分类`);
        if (!article.status) issues.push(`文章${index + 1}缺少状态`);
      });
    }
    
    return {
      name: '文章API',
      status: issues.length === 0 ? 'pass' : 'fail',
      message: issues.length === 0 ? 
        `验证通过，共${articles.length}篇文章` : 
        `发现${issues.length}个问题`,
      details: { 
        articleCount: articles.length,
        issues: issues.slice(0, 5), // 只显示前5个问题
      },
    };
  } catch (error) {
    return {
      name: '文章API',
      status: 'fail',
      message: 'API调用异常',
      details: { error: error.message },
    };
  }
}

/**
 * 验证媒体API
 */
async function validateMediaAPI() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/media`);
    const data = await response.json();
    
    if (!data.success) {
      return {
        name: '媒体API',
        status: 'fail',
        message: '媒体API调用失败',
        details: { error: data.error },
      };
    }
    
    const mediaFiles = data.data;
    const issues = [];
    
    if (!Array.isArray(mediaFiles)) {
      issues.push('返回数据不是数组');
    } else {
      mediaFiles.forEach((file, index) => {
        if (!file.id) issues.push(`文件${index + 1}缺少id字段`);
        if (!file.filename) issues.push(`文件${index + 1}缺少文件名`);
        if (!file.url) issues.push(`文件${index + 1}缺少URL`);
      });
    }
    
    return {
      name: '媒体API',
      status: issues.length === 0 ? 'pass' : 'warning',
      message: issues.length === 0 ? 
        `验证通过，共${mediaFiles.length}个媒体文件` : 
        `发现${issues.length}个问题`,
      details: { 
        fileCount: mediaFiles.length,
        issues: issues.slice(0, 5),
      },
    };
  } catch (error) {
    return {
      name: '媒体API',
      status: 'fail',
      message: 'API调用异常',
      details: { error: error.message },
    };
  }
}

/**
 * 验证分析API
 */
async function validateAnalyticsAPI() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/analytics?type=overview`);
    const data = await response.json();
    
    if (!data.success) {
      return {
        name: '分析API',
        status: 'warning',
        message: '分析API调用失败（非关键）',
        details: { error: data.error },
      };
    }
    
    return {
      name: '分析API',
      status: 'pass',
      message: '验证通过',
      details: { hasData: !!data.data },
    };
  } catch (error) {
    return {
      name: '分析API',
      status: 'warning',
      message: 'API调用异常（非关键）',
      details: { error: error.message },
    };
  }
}

/**
 * 验证用户API
 */
async function validateUsersAPI() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users`);
    const data = await response.json();
    
    if (!data.success) {
      return {
        name: '用户API',
        status: 'warning',
        message: '用户API调用失败',
        details: { error: data.error },
      };
    }
    
    return {
      name: '用户API',
      status: 'pass',
      message: '验证通过',
      details: { userCount: data.data?.length || 0 },
    };
  } catch (error) {
    return {
      name: '用户API',
      status: 'warning',
      message: 'API调用异常',
      details: { error: error.message },
    };
  }
}

/**
 * 验证发布API
 */
async function validatePublishAPI() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/publish`);
    const data = await response.json();

    return {
      name: '发布API',
      status: 'pass',
      message: '验证通过',
      details: { responsive: true },
    };
  } catch (error) {
    return {
      name: '发布API',
      status: 'warning',
      message: 'API调用异常',
      details: { error: error.message },
    };
  }
}

/**
 * 验证微信API
 */
async function validateWechatAPI() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/wechat`);
    const data = await response.json();

    if (!data.success) {
      return {
        name: '微信API',
        status: 'warning',
        message: '微信API调用失败（非关键）',
        details: { error: data.error },
      };
    }

    return {
      name: '微信API',
      status: 'pass',
      message: '验证通过',
      details: { hasData: !!data.data },
    };
  } catch (error) {
    return {
      name: '微信API',
      status: 'warning',
      message: 'API调用异常（非关键）',
      details: { error: error.message },
    };
  }
}

/**
 * 验证系统健康API
 */
async function validateHealthAPI() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/health`);
    const data = await response.json();

    if (!data.success) {
      return {
        name: '系统健康API',
        status: 'fail',
        message: '系统健康检查失败',
        details: { error: data.error },
      };
    }

    // 检查关键服务状态
    const issues = [];
    if (data.data.github?.status !== 'connected') {
      issues.push('GitHub连接异常');
    }
    if (data.data.filesystem?.status !== 'accessible') {
      issues.push('文件系统访问异常');
    }

    return {
      name: '系统健康API',
      status: issues.length === 0 ? 'pass' : 'warning',
      message: issues.length === 0 ? '系统健康' : `发现${issues.length}个问题`,
      details: {
        services: data.data,
        issues: issues.slice(0, 3),
      },
    };
  } catch (error) {
    return {
      name: '系统健康API',
      status: 'fail',
      message: 'API调用异常',
      details: { error: error.message },
    };
  }
}

/**
 * 验证缓存API
 */
async function validateCacheAPI() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/cache?action=stats`);
    const data = await response.json();

    if (!data.success) {
      return {
        name: '缓存API',
        status: 'warning',
        message: '缓存API调用失败',
        details: { error: data.error },
      };
    }

    const stats = data.data;
    const issues = [];

    // 检查缓存健康状况
    if (stats.expired > stats.valid) {
      issues.push('过期缓存过多');
    }
    if (stats.hitRate < 0.5) {
      issues.push('缓存命中率过低');
    }

    return {
      name: '缓存API',
      status: issues.length === 0 ? 'pass' : 'warning',
      message: issues.length === 0 ? '缓存系统正常' : `发现${issues.length}个问题`,
      details: {
        stats,
        issues,
      },
    };
  } catch (error) {
    return {
      name: '缓存API',
      status: 'warning',
      message: 'API调用异常',
      details: { error: error.message },
    };
  }
}
