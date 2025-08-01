/**
 * 简单的内存缓存系统
 * 服务器端缓存，不包含React hooks
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // 生存时间（毫秒）
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // 如果缓存已满，删除最旧的项
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 清理过期缓存
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    for (const item of this.cache.values()) {
      if (now - item.timestamp > item.ttl) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      maxSize: this.maxSize,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
      hits: this.hitCount,
      misses: this.missCount,
    };
  }

  private hitCount = 0;
  private missCount = 0;

  /**
   * 带统计的获取方法
   */
  getWithStats<T>(key: string): T | null {
    const result = this.get<T>(key);
    if (result !== null) {
      this.hitCount++;
    } else {
      this.missCount++;
    }
    return result;
  }
}

// 全局缓存实例
export const cache = new MemoryCache(1000);

// 定期清理过期缓存
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000); // 每5分钟清理一次

/**
 * 缓存装饰器
 */
export function cached(ttl: number = 5 * 60 * 1000) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}.${propertyName}:${JSON.stringify(args)}`;
      
      // 尝试从缓存获取
      const cachedResult = cache.getWithStats(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }

      // 执行原方法
      const result = await method.apply(this, args);
      
      // 缓存结果
      cache.set(cacheKey, result, ttl);
      
      return result;
    };

    return descriptor;
  };
}

/**
 * API响应缓存中间件
 */
export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      // 尝试从缓存获取
      const cachedResult = cache.getWithStats<T>(key);
      if (cachedResult !== null) {
        resolve(cachedResult);
        return;
      }

      // 执行获取函数
      const result = await fetcher();
      
      // 缓存结果
      cache.set(key, result, ttl);
      
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}





/**
 * 缓存管理API
 */
export const cacheManager = {
  /**
   * 获取缓存统计
   */
  getStats: () => cache.getStats(),

  /**
   * 清理过期缓存
   */
  cleanup: () => cache.cleanup(),

  /**
   * 清空所有缓存
   */
  clear: () => cache.clear(),

  /**
   * 删除特定缓存
   */
  delete: (key: string) => cache.delete(key),

  /**
   * 预热缓存
   */
  warmup: async (keys: Array<{ key: string; fetcher: () => Promise<any>; ttl?: number }>) => {
    const promises = keys.map(async ({ key, fetcher, ttl }) => {
      try {
        const result = await fetcher();
        cache.set(key, result, ttl);
        return { key, success: true };
      } catch (error) {
        return { key, success: false, error };
      }
    });

    return Promise.all(promises);
  },

  /**
   * 批量删除缓存
   */
  deleteBatch: (pattern: string) => {
    let deleted = 0;
    for (const key of cache['cache'].keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
        deleted++;
      }
    }
    return deleted;
  },
};
