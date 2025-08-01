'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlayIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface TestResult {
  name: string;
  endpoint: string;
  status: 'pending' | 'running' | 'success' | 'error';
  responseTime?: number;
  data?: any;
  error?: string;
}

export default function APITestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const apiEndpoints = [
    { name: '文章列表', endpoint: '/api/articles' },
    { name: '技术专题', endpoint: '/api/articles?category=tech' },
    { name: '历史专题', endpoint: '/api/articles?category=history' },
    { name: '心理专题', endpoint: '/api/articles?category=psychology' },
    { name: '职场专题', endpoint: '/api/articles?category=workplace' },
    { name: '媒体文件', endpoint: '/api/media' },
    { name: '数据统计', endpoint: '/api/analytics?type=overview' },
    { name: '用户管理', endpoint: '/api/users' },
    { name: '发布状态', endpoint: '/api/publish' },
    { name: '微信管理', endpoint: '/api/wechat' },
    { name: '系统健康', endpoint: '/api/health' },
    { name: '缓存统计', endpoint: '/api/cache?action=stats' },
    { name: '数据验证', endpoint: '/api/validate' },
  ];

  useEffect(() => {
    // 初始化测试结果
    setTestResults(
      apiEndpoints.map(api => ({
        ...api,
        status: 'pending',
      }))
    );
  }, []);

  const runAllTests = async () => {
    setIsRunning(true);
    
    // 重置所有测试状态
    setTestResults(prev => prev.map(test => ({ ...test, status: 'pending' })));

    for (let i = 0; i < apiEndpoints.length; i++) {
      const api = apiEndpoints[i];
      
      // 设置当前测试为运行中
      setTestResults(prev => prev.map((test, index) => 
        index === i ? { ...test, status: 'running' } : test
      ));

      try {
        const startTime = Date.now();
        const response = await fetch(api.endpoint);
        const responseTime = Date.now() - startTime;
        const data = await response.json();

        setTestResults(prev => prev.map((test, index) => 
          index === i ? {
            ...test,
            status: response.ok ? 'success' : 'error',
            responseTime,
            data: response.ok ? data : undefined,
            error: response.ok ? undefined : `HTTP ${response.status}`,
          } : test
        ));
      } catch (error) {
        setTestResults(prev => prev.map((test, index) => 
          index === i ? {
            ...test,
            status: 'error',
            error: error instanceof Error ? error.message : '未知错误',
          } : test
        ));
      }

      // 添加小延迟，避免过快的请求
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setIsRunning(false);
  };

  const runSingleTest = async (index: number) => {
    const api = apiEndpoints[index];
    
    setTestResults(prev => prev.map((test, i) => 
      i === index ? { ...test, status: 'running' } : test
    ));

    try {
      const startTime = Date.now();
      const response = await fetch(api.endpoint);
      const responseTime = Date.now() - startTime;
      const data = await response.json();

      setTestResults(prev => prev.map((test, i) => 
        i === index ? {
          ...test,
          status: response.ok ? 'success' : 'error',
          responseTime,
          data: response.ok ? data : undefined,
          error: response.ok ? undefined : `HTTP ${response.status}`,
        } : test
      ));
    } catch (error) {
      setTestResults(prev => prev.map((test, i) => 
        i === index ? {
          ...test,
          status: 'error',
          error: error instanceof Error ? error.message : '未知错误',
        } : test
      ));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'running':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'running':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const successCount = testResults.filter(test => test.status === 'success').length;
  const errorCount = testResults.filter(test => test.status === 'error').length;
  const avgResponseTime = testResults
    .filter(test => test.responseTime)
    .reduce((sum, test) => sum + (test.responseTime || 0), 0) / 
    testResults.filter(test => test.responseTime).length || 0;

  return (
    <AdminLayout>
      <div className="content-area py-6">
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">API集成测试</h1>
            <p className="page-subtitle">验证所有API端点的集成状态和响应性能</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="primary"
              icon={<PlayIcon />}
              onClick={runAllTests}
              disabled={isRunning}
            >
              {isRunning ? '测试中...' : '运行所有测试'}
            </Button>
          </div>
        </div>

        {/* 测试概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">成功</p>
                  <p className="text-xl font-semibold">{successCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <XCircleIcon className="h-8 w-8 text-red-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">失败</p>
                  <p className="text-xl font-semibold">{errorCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">平均响应时间</p>
                  <p className="text-xl font-semibold">
                    {avgResponseTime ? `${Math.round(avgResponseTime)}ms` : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <ArrowPathIcon className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">总测试数</p>
                  <p className="text-xl font-semibold">{testResults.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 测试结果 */}
        <Card>
          <CardHeader>
            <CardTitle>测试结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((test, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(test.status)}
                      <div className="ml-3">
                        <h4 className="font-medium">{test.name}</h4>
                        <p className="text-sm text-gray-600">{test.endpoint}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {test.responseTime && (
                        <span className="text-sm text-gray-500">
                          {test.responseTime}ms
                        </span>
                      )}
                      {test.status === 'error' && test.error && (
                        <span className="text-sm text-red-600">{test.error}</span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => runSingleTest(index)}
                        disabled={test.status === 'running'}
                      >
                        重试
                      </Button>
                    </div>
                  </div>
                  
                  {test.data && test.status === 'success' && (
                    <div className="mt-3 pl-8">
                      <details className="text-sm">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          查看响应数据
                        </summary>
                        <div className="mt-2 p-3 bg-white bg-opacity-50 rounded text-xs">
                          <pre className="overflow-x-auto">
                            {JSON.stringify(test.data, null, 2)}
                          </pre>
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
