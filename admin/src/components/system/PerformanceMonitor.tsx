'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  ClockIcon,
  CpuChipIcon,
  ServerIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  renderTime: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 收集性能指标
    collectPerformanceMetrics();
    
    // 定期更新
    const interval = setInterval(collectPerformanceMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const collectPerformanceMetrics = () => {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const memory = (performance as any).memory;
      
      const newMetrics: PerformanceMetrics = {
        pageLoadTime: navigation ? navigation.loadEventEnd - navigation.navigationStart : 0,
        apiResponseTime: getAverageApiResponseTime(),
        memoryUsage: memory ? memory.usedJSHeapSize / 1024 / 1024 : 0, // MB
        renderTime: navigation ? navigation.domContentLoadedEventEnd - navigation.navigationStart : 0,
      };
      
      setMetrics(newMetrics);
    } catch (error) {
      console.warn('性能指标收集失败:', error);
    }
  };

  const getAverageApiResponseTime = () => {
    const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const apiCalls = resourceEntries.filter(entry => entry.name.includes('/api/'));
    
    if (apiCalls.length === 0) return 0;
    
    const totalTime = apiCalls.reduce((sum, entry) => sum + entry.duration, 0);
    return totalTime / apiCalls.length;
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatMemory = (mb: number) => {
    return `${mb.toFixed(1)} MB`;
  };

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!metrics) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* 切换按钮 */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="mb-2 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="性能监控"
      >
        <ChartBarIcon className="h-5 w-5" />
      </button>

      {/* 性能指标面板 */}
      {isVisible && (
        <Card className="w-80 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <CpuChipIcon className="h-4 w-4 mr-2" />
              性能监控
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* 页面加载时间 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm text-gray-600">页面加载</span>
              </div>
              <span className={`text-sm font-mono ${getPerformanceColor(metrics.pageLoadTime, { good: 1000, warning: 3000 })}`}>
                {formatTime(metrics.pageLoadTime)}
              </span>
            </div>

            {/* API响应时间 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ServerIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm text-gray-600">API响应</span>
              </div>
              <span className={`text-sm font-mono ${getPerformanceColor(metrics.apiResponseTime, { good: 200, warning: 500 })}`}>
                {formatTime(metrics.apiResponseTime)}
              </span>
            </div>

            {/* 内存使用 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CpuChipIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm text-gray-600">内存使用</span>
              </div>
              <span className={`text-sm font-mono ${getPerformanceColor(metrics.memoryUsage, { good: 50, warning: 100 })}`}>
                {formatMemory(metrics.memoryUsage)}
              </span>
            </div>

            {/* 渲染时间 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ChartBarIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm text-gray-600">DOM渲染</span>
              </div>
              <span className={`text-sm font-mono ${getPerformanceColor(metrics.renderTime, { good: 500, warning: 1500 })}`}>
                {formatTime(metrics.renderTime)}
              </span>
            </div>

            {/* 性能评级 */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">性能评级</span>
                <span className={`text-sm font-medium ${getOverallPerformanceColor()}`}>
                  {getOverallPerformanceRating()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  function getOverallPerformanceRating() {
    const scores = [
      metrics.pageLoadTime <= 1000 ? 100 : metrics.pageLoadTime <= 3000 ? 70 : 30,
      metrics.apiResponseTime <= 200 ? 100 : metrics.apiResponseTime <= 500 ? 70 : 30,
      metrics.memoryUsage <= 50 ? 100 : metrics.memoryUsage <= 100 ? 70 : 30,
      metrics.renderTime <= 500 ? 100 : metrics.renderTime <= 1500 ? 70 : 30,
    ];
    
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    if (average >= 90) return '优秀';
    if (average >= 70) return '良好';
    if (average >= 50) return '一般';
    return '需要优化';
  }

  function getOverallPerformanceColor() {
    const rating = getOverallPerformanceRating();
    switch (rating) {
      case '优秀':
        return 'text-green-600';
      case '良好':
        return 'text-blue-600';
      case '一般':
        return 'text-yellow-600';
      default:
        return 'text-red-600';
    }
  }
}
