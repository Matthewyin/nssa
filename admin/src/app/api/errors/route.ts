import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ERRORS_DIR = path.join(process.cwd(), '..', '.taskmaster', 'errors');
const ERRORS_FILE = path.join(ERRORS_DIR, 'errors.json');

// 确保错误目录存在
function ensureErrorsDirectory() {
  if (!fs.existsSync(ERRORS_DIR)) {
    fs.mkdirSync(ERRORS_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(ERRORS_FILE)) {
    fs.writeFileSync(ERRORS_FILE, JSON.stringify([], null, 2));
  }
}

/**
 * 记录错误报告
 */
export async function POST(request: NextRequest) {
  try {
    ensureErrorsDirectory();
    
    const body = await request.json();
    const {
      message,
      stack,
      componentStack,
      timestamp,
      userAgent,
      url,
    } = body;
    
    // 创建错误记录
    const errorRecord = {
      id: Date.now().toString(),
      message: message || 'Unknown error',
      stack: stack || '',
      componentStack: componentStack || '',
      timestamp: timestamp || new Date().toISOString(),
      userAgent: userAgent || '',
      url: url || '',
      resolved: false,
      severity: determineSeverity(message, stack),
    };
    
    // 读取现有错误
    const existingErrors = JSON.parse(fs.readFileSync(ERRORS_FILE, 'utf8'));
    
    // 添加新错误（保持最近1000条）
    existingErrors.unshift(errorRecord);
    if (existingErrors.length > 1000) {
      existingErrors.splice(1000);
    }
    
    // 保存错误
    fs.writeFileSync(ERRORS_FILE, JSON.stringify(existingErrors, null, 2));
    
    // 记录到控制台
    console.error('Frontend Error Reported:', {
      id: errorRecord.id,
      message: errorRecord.message,
      url: errorRecord.url,
      timestamp: errorRecord.timestamp,
    });
    
    return NextResponse.json({
      success: true,
      data: { id: errorRecord.id },
      message: '错误报告已记录',
    });
  } catch (error) {
    console.error('记录错误报告失败:', error);
    return NextResponse.json(
      { success: false, error: '记录错误报告失败' },
      { status: 500 }
    );
  }
}

/**
 * 获取错误报告列表
 */
export async function GET(request: NextRequest) {
  try {
    ensureErrorsDirectory();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const severity = searchParams.get('severity');
    const resolved = searchParams.get('resolved');
    
    // 读取错误数据
    const allErrors = JSON.parse(fs.readFileSync(ERRORS_FILE, 'utf8'));
    
    // 过滤错误
    let filteredErrors = allErrors;
    
    if (severity && severity !== 'all') {
      filteredErrors = filteredErrors.filter((error: any) => error.severity === severity);
    }
    
    if (resolved && resolved !== 'all') {
      const isResolved = resolved === 'true';
      filteredErrors = filteredErrors.filter((error: any) => error.resolved === isResolved);
    }
    
    // 分页
    const total = filteredErrors.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedErrors = filteredErrors.slice(startIndex, endIndex);
    
    // 统计信息
    const stats = {
      total: allErrors.length,
      unresolved: allErrors.filter((error: any) => !error.resolved).length,
      critical: allErrors.filter((error: any) => error.severity === 'critical').length,
      high: allErrors.filter((error: any) => error.severity === 'high').length,
      medium: allErrors.filter((error: any) => error.severity === 'medium').length,
      low: allErrors.filter((error: any) => error.severity === 'low').length,
    };
    
    return NextResponse.json({
      success: true,
      data: paginatedErrors,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: endIndex < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('获取错误报告失败:', error);
    return NextResponse.json(
      { success: false, error: '获取错误报告失败' },
      { status: 500 }
    );
  }
}

/**
 * 确定错误严重程度
 */
function determineSeverity(message: string, stack: string): string {
  const criticalKeywords = [
    'Cannot read properties of undefined',
    'Cannot read property',
    'TypeError',
    'ReferenceError',
    'SyntaxError',
  ];
  
  const highKeywords = [
    'Network Error',
    'Failed to fetch',
    'Unauthorized',
    'Forbidden',
  ];
  
  const mediumKeywords = [
    'Warning',
    'Deprecated',
    'Invalid',
  ];
  
  const errorText = `${message} ${stack}`.toLowerCase();
  
  if (criticalKeywords.some(keyword => errorText.includes(keyword.toLowerCase()))) {
    return 'critical';
  }
  
  if (highKeywords.some(keyword => errorText.includes(keyword.toLowerCase()))) {
    return 'high';
  }
  
  if (mediumKeywords.some(keyword => errorText.includes(keyword.toLowerCase()))) {
    return 'medium';
  }
  
  return 'low';
}
