/**
 * API安全管理系统
 * 提供API密钥管理、请求验证、访问控制等安全功能
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

// API密钥配置
interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  createdAt: string;
  lastUsed?: string;
  expiresAt?: string;
  isActive: boolean;
  rateLimitPerHour: number;
}

// 请求日志
interface APIRequestLog {
  id: string;
  apiKeyId?: string;
  endpoint: string;
  method: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  responseStatus: number;
  responseTime: number;
}

export class APISecurityManager {
  private static instance: APISecurityManager;
  private apiKeys: Map<string, APIKey> = new Map();
  private requestLogs: APIRequestLog[] = [];
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

  private constructor() {
    this.initializeDefaultKeys();
  }

  public static getInstance(): APISecurityManager {
    if (!APISecurityManager.instance) {
      APISecurityManager.instance = new APISecurityManager();
    }
    return APISecurityManager.instance;
  }

  /**
   * 初始化默认API密钥
   */
  private initializeDefaultKeys(): void {
    // 管理员密钥
    const adminKey = this.generateAPIKey('admin', [
      'articles:read',
      'articles:write',
      'analytics:read',
      'users:read',
      'users:write',
      'media:read',
      'media:write',
      'publish:execute',
      'system:admin',
    ], 1000);

    // 只读密钥
    const readOnlyKey = this.generateAPIKey('readonly', [
      'articles:read',
      'analytics:read',
      'media:read',
    ], 500);

    // 发布密钥
    const publishKey = this.generateAPIKey('publisher', [
      'articles:read',
      'articles:write',
      'publish:execute',
      'media:read',
    ], 200);

    this.apiKeys.set(adminKey.key, adminKey);
    this.apiKeys.set(readOnlyKey.key, readOnlyKey);
    this.apiKeys.set(publishKey.key, publishKey);
  }

  /**
   * 生成API密钥
   */
  public generateAPIKey(
    name: string, 
    permissions: string[], 
    rateLimitPerHour: number = 100,
    expiresInDays?: number
  ): APIKey {
    const id = crypto.randomUUID();
    const key = `nssa_${crypto.randomBytes(32).toString('hex')}`;
    
    let expiresAt: string | undefined;
    if (expiresInDays) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + expiresInDays);
      expiresAt = expiry.toISOString();
    }

    return {
      id,
      name,
      key,
      permissions,
      createdAt: new Date().toISOString(),
      expiresAt,
      isActive: true,
      rateLimitPerHour,
    };
  }

  /**
   * 验证API密钥
   */
  public validateAPIKey(apiKey: string): { valid: boolean; keyInfo?: APIKey; error?: string } {
    const keyInfo = this.apiKeys.get(apiKey);

    if (!keyInfo) {
      return { valid: false, error: 'Invalid API key' };
    }

    if (!keyInfo.isActive) {
      return { valid: false, error: 'API key is disabled' };
    }

    if (keyInfo.expiresAt && new Date() > new Date(keyInfo.expiresAt)) {
      return { valid: false, error: 'API key has expired' };
    }

    return { valid: true, keyInfo };
  }

  /**
   * 检查权限
   */
  public hasPermission(apiKey: string, permission: string): boolean {
    const validation = this.validateAPIKey(apiKey);
    if (!validation.valid || !validation.keyInfo) {
      return false;
    }

    return validation.keyInfo.permissions.includes(permission) || 
           validation.keyInfo.permissions.includes('*');
  }

  /**
   * 速率限制检查
   */
  public checkRateLimit(apiKey: string): boolean {
    const validation = this.validateAPIKey(apiKey);
    if (!validation.valid || !validation.keyInfo) {
      return false;
    }

    const now = Date.now();
    const hourStart = Math.floor(now / (60 * 60 * 1000)) * (60 * 60 * 1000);
    const rateLimitKey = `${apiKey}:${hourStart}`;

    const current = this.rateLimitStore.get(rateLimitKey) || { count: 0, resetTime: hourStart + 60 * 60 * 1000 };

    if (now > current.resetTime) {
      // 重置计数器
      current.count = 0;
      current.resetTime = hourStart + 60 * 60 * 1000;
    }

    if (current.count >= validation.keyInfo.rateLimitPerHour) {
      return false;
    }

    current.count++;
    this.rateLimitStore.set(rateLimitKey, current);

    // 更新最后使用时间
    validation.keyInfo.lastUsed = new Date().toISOString();

    return true;
  }

  /**
   * 记录API请求
   */
  public logRequest(
    request: NextRequest,
    apiKeyId: string | undefined,
    responseStatus: number,
    responseTime: number
  ): void {
    const log: APIRequestLog = {
      id: crypto.randomUUID(),
      apiKeyId,
      endpoint: request.nextUrl.pathname,
      method: request.method,
      ip: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || '',
      timestamp: new Date().toISOString(),
      responseStatus,
      responseTime,
    };

    this.requestLogs.push(log);

    // 保持最近1000条日志
    if (this.requestLogs.length > 1000) {
      this.requestLogs.splice(0, this.requestLogs.length - 1000);
    }
  }

  /**
   * 获取客户端IP
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');

    return cfConnectingIP || realIP || forwarded?.split(',')[0] || 'unknown';
  }

  /**
   * 获取API使用统计
   */
  public getUsageStats(timeRange: 'hour' | 'day' | 'week' = 'day') {
    const now = new Date();
    let startTime: Date;

    switch (timeRange) {
      case 'hour':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }

    const recentLogs = this.requestLogs.filter(log => 
      new Date(log.timestamp) >= startTime
    );

    const stats = {
      totalRequests: recentLogs.length,
      successfulRequests: recentLogs.filter(log => log.responseStatus < 400).length,
      errorRequests: recentLogs.filter(log => log.responseStatus >= 400).length,
      averageResponseTime: recentLogs.length > 0 
        ? recentLogs.reduce((sum, log) => sum + log.responseTime, 0) / recentLogs.length 
        : 0,
      topEndpoints: this.getTopEndpoints(recentLogs),
      requestsByHour: this.getRequestsByHour(recentLogs),
    };

    return stats;
  }

  /**
   * 获取热门端点
   */
  private getTopEndpoints(logs: APIRequestLog[]) {
    const endpointCounts = logs.reduce((acc, log) => {
      acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));
  }

  /**
   * 获取按小时分组的请求数
   */
  private getRequestsByHour(logs: APIRequestLog[]) {
    const hourCounts = logs.reduce((acc, log) => {
      const hour = new Date(log.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourCounts[hour] || 0,
    }));
  }

  /**
   * 获取所有API密钥（隐藏实际密钥）
   */
  public getAllAPIKeys() {
    return Array.from(this.apiKeys.values()).map(key => ({
      ...key,
      key: `${key.key.substring(0, 12)}...${key.key.substring(key.key.length - 4)}`,
    }));
  }

  /**
   * 禁用API密钥
   */
  public disableAPIKey(keyId: string): boolean {
    for (const [key, keyInfo] of this.apiKeys.entries()) {
      if (keyInfo.id === keyId) {
        keyInfo.isActive = false;
        return true;
      }
    }
    return false;
  }

  /**
   * 启用API密钥
   */
  public enableAPIKey(keyId: string): boolean {
    for (const [key, keyInfo] of this.apiKeys.entries()) {
      if (keyInfo.id === keyId) {
        keyInfo.isActive = true;
        return true;
      }
    }
    return false;
  }

  /**
   * 删除API密钥
   */
  public deleteAPIKey(keyId: string): boolean {
    for (const [key, keyInfo] of this.apiKeys.entries()) {
      if (keyInfo.id === keyId) {
        this.apiKeys.delete(key);
        return true;
      }
    }
    return false;
  }
}

// 导出单例实例
export const apiSecurityManager = APISecurityManager.getInstance();

// 权限常量
export const PERMISSIONS = {
  ARTICLES_READ: 'articles:read',
  ARTICLES_WRITE: 'articles:write',
  ANALYTICS_READ: 'analytics:read',
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  MEDIA_READ: 'media:read',
  MEDIA_WRITE: 'media:write',
  PUBLISH_EXECUTE: 'publish:execute',
  SYSTEM_ADMIN: 'system:admin',
} as const;
