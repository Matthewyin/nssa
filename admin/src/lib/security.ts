/**
 * 安全配置和验证模块
 */

import crypto from 'crypto';

// 安全配置常量
export const SECURITY_CONFIG = {
  // JWT配置
  JWT_EXPIRES_IN: '24h',
  JWT_REFRESH_EXPIRES_IN: '7d',
  
  // 密码策略
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBERS: true,
  PASSWORD_REQUIRE_SYMBOLS: false,
  
  // 会话配置
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24小时
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15分钟
  
  // API安全
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15分钟
  RATE_LIMIT_MAX_REQUESTS: 100,
  
  // 文件上传安全
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
  ],
  
  // CORS配置
  ALLOWED_ORIGINS: [
    'http://localhost:3001',
    'https://nssa.io',
    'https://admin.nssa.io',
  ],
};

/**
 * 验证环境变量
 */
export function validateEnvironmentVariables() {
  const requiredVars = [
    'GITHUB_TOKEN',
    'GITHUB_OWNER', 
    'GITHUB_REPO',
    'GITHUB_BRANCH',
  ];
  
  const optionalVars = [
    'JWT_SECRET',
    'WECHAT_A_APPID',
    'WECHAT_A_SECRET',
    'WECHAT_B_APPID',
    'WECHAT_B_SECRET',
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ZONE_ID',
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  const warnings = [];
  
  if (missing.length > 0) {
    throw new Error(`缺少必需的环境变量: ${missing.join(', ')}`);
  }
  
  // 检查JWT密钥
  if (!process.env.JWT_SECRET) {
    warnings.push('JWT_SECRET未设置，将使用默认值（不安全）');
  } else if (process.env.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET长度不足32位（不安全）');
  }
  
  // 检查微信配置
  const wechatAConfigured = process.env.WECHAT_A_APPID && process.env.WECHAT_A_SECRET;
  const wechatBConfigured = process.env.WECHAT_B_APPID && process.env.WECHAT_B_SECRET;
  
  if (!wechatAConfigured && !wechatBConfigured) {
    warnings.push('微信公众号配置未设置，微信功能将不可用');
  }
  
  return {
    valid: true,
    warnings,
    configured: {
      required: requiredVars.length,
      optional: optionalVars.filter(v => process.env[v]).length,
      wechat: { a: wechatAConfigured, b: wechatBConfigured },
    },
  };
}

/**
 * 生成安全的随机字符串
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 生成JWT密钥
 */
export function generateJWTSecret(): string {
  return generateSecureToken(64);
}

/**
 * 密码强度验证
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 0;
  
  // 长度检查
  if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
    issues.push(`密码长度至少${SECURITY_CONFIG.PASSWORD_MIN_LENGTH}位`);
  } else {
    score += 20;
  }
  
  // 大写字母
  if (SECURITY_CONFIG.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    issues.push('密码必须包含大写字母');
  } else if (/[A-Z]/.test(password)) {
    score += 20;
  }
  
  // 小写字母
  if (SECURITY_CONFIG.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    issues.push('密码必须包含小写字母');
  } else if (/[a-z]/.test(password)) {
    score += 20;
  }
  
  // 数字
  if (SECURITY_CONFIG.PASSWORD_REQUIRE_NUMBERS && !/\d/.test(password)) {
    issues.push('密码必须包含数字');
  } else if (/\d/.test(password)) {
    score += 20;
  }
  
  // 特殊字符
  if (SECURITY_CONFIG.PASSWORD_REQUIRE_SYMBOLS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    issues.push('密码必须包含特殊字符');
  } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 20;
  }
  
  // 额外分数
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  
  return {
    valid: issues.length === 0,
    score: Math.min(score, 100),
    issues,
  };
}

/**
 * 清理用户输入
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // 移除潜在的HTML标签
    .replace(/javascript:/gi, '') // 移除JavaScript协议
    .replace(/on\w+=/gi, '') // 移除事件处理器
    .substring(0, 1000); // 限制长度
}

/**
 * 验证文件类型
 */
export function validateFileType(filename: string, mimeType: string): boolean {
  const allowedTypes = SECURITY_CONFIG.ALLOWED_FILE_TYPES;
  const fileExtension = filename.toLowerCase().split('.').pop();
  
  // 检查MIME类型
  if (!allowedTypes.includes(mimeType)) {
    return false;
  }
  
  // 检查文件扩展名
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'pdf'];
  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    return false;
  }
  
  return true;
}

/**
 * 生成CSRF令牌
 */
export function generateCSRFToken(): string {
  return generateSecureToken(32);
}

/**
 * 验证CSRF令牌
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken && token.length === 64;
}

/**
 * IP地址验证和限制
 */
export function validateIPAddress(ip: string): boolean {
  // IPv4正则
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6正则（简化版）
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * 检查是否为可信IP
 */
export function isTrustedIP(ip: string): boolean {
  const trustedRanges = [
    '127.0.0.1', // localhost
    '::1', // IPv6 localhost
    // 可以添加更多可信IP范围
  ];
  
  return trustedRanges.includes(ip);
}

/**
 * 安全头部配置
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.github.com",
    "frame-ancestors 'none'",
  ].join('; '),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/**
 * 应用安全头部
 */
export function applySecurityHeaders(headers: Headers): void {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });
}
