'use client';

import { useState, useEffect, useCallback } from 'react';
import { withCache, cache } from '@/lib/cache';

/**
 * React Hook for cached data
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await withCache(key, fetcher, ttl);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    clearCache: () => cache.delete(key),
  };
}

/**
 * Hook for cache statistics
 */
export function useCacheStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cache?action=stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('加载缓存统计失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    
    // 定期刷新统计
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [loadStats]);

  return {
    stats,
    loading,
    refresh: loadStats,
  };
}
