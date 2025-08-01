import { NextRequest, NextResponse } from 'next/server';
import { applySecurityHeaders, SECURITY_CONFIG } from '@/lib/security';

// 速率限制存储（生产环境应使用Redis）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * 中间件主函数
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // 应用安全头部
  applySecurityHeaders(response.headers);
  
  // 获取客户端IP
  const clientIP = getClientIP(request);
  
  // API路由的额外安全检查
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // 速率限制
    if (!checkRateLimit(clientIP)) {
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': '900', // 15分钟
        },
      });
    }
    
    // CORS检查
    if (!checkCORS(request)) {
      return new NextResponse('CORS Policy Violation', { status: 403 });
    }
    
    // 内容类型验证（对于POST/PUT请求）
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers.get('content-type');
      if (contentType && !isValidContentType(contentType)) {
        return new NextResponse('Invalid Content Type', { status: 400 });
      }
    }
  }
  
  // 管理员路由的认证检查
  if (request.nextUrl.pathname.startsWith('/admin') && 
      !request.nextUrl.pathname.startsWith('/admin/login')) {
    
    // 检查认证状态（简化版，生产环境需要JWT验证）
    const authToken = request.cookies.get('auth-token');
    if (!authToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  // 添加安全相关的响应头
  response.headers.set('X-Request-ID', generateRequestId());
  response.headers.set('X-Timestamp', new Date().toISOString());
  
  return response;
}

/**
 * 获取客户端IP地址
 */
function getClientIP(request: NextRequest): string {
  // 尝试从各种头部获取真实IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return request.ip || '127.0.0.1';
}

/**
 * 速率限制检查
 */
function checkRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const windowStart = now - SECURITY_CONFIG.RATE_LIMIT_WINDOW;
  
  // 清理过期记录
  for (const [ip, data] of rateLimitStore.entries()) {
    if (data.resetTime < now) {
      rateLimitStore.delete(ip);
    }
  }
  
  const current = rateLimitStore.get(clientIP);
  
  if (!current) {
    // 首次请求
    rateLimitStore.set(clientIP, {
      count: 1,
      resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW,
    });
    return true;
  }
  
  if (current.resetTime < now) {
    // 窗口已重置
    rateLimitStore.set(clientIP, {
      count: 1,
      resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW,
    });
    return true;
  }
  
  if (current.count >= SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  // 增加计数
  current.count++;
  return true;
}

/**
 * CORS检查
 */
function checkCORS(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  
  // 如果没有origin头部，允许（可能是同源请求）
  if (!origin) return true;
  
  // 检查是否在允许列表中
  return SECURITY_CONFIG.ALLOWED_ORIGINS.includes(origin);
}

/**
 * 验证内容类型
 */
function isValidContentType(contentType: string): boolean {
  const validTypes = [
    'application/json',
    'multipart/form-data',
    'application/x-www-form-urlencoded',
    'text/plain',
  ];
  
  return validTypes.some(type => contentType.includes(type));
}

/**
 * 生成请求ID
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * 配置中间件匹配路径
 */
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
