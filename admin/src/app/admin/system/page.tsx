'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { dataConsistencyChecker } from '@/lib/data-consistency';
import { DataConsistencyTester } from '@/lib/data-consistency-test';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ComputerDesktopIcon,
  ServerIcon,
  CpuChipIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function SystemStatusPage() {
  const [healthData, setHealthData] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [validationData, setValidationData] = useState<any>(null);
  const [consistencyData, setConsistencyData] = useState<any>(null);
  const [consistencyTestData, setConsistencyTestData] = useState<any>(null);
  const [statsInitData, setStatsInitData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [consistencyLoading, setConsistencyLoading] = useState(false);
  const [consistencyTestLoading, setConsistencyTestLoading] = useState(false);
  const [statsInitLoading, setStatsInitLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [pageLoadTime] = useState(Date.now());

  useEffect(() => {
    loadHealthStatus();
    loadCacheStats();
    loadSystemInfo();
    loadValidationData();

    // 每30秒自动刷新
    const interval = setInterval(() => {
      loadHealthStatus();
      loadCacheStats();
      loadSystemInfo();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadHealthStatus = async (detailed: boolean = false) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/health?detailed=${detailed}`);
      const data = await response.json();
      
      if (data.success) {
        setHealthData(data.data);
        setLastChecked(data.timestamp);
      }
    } catch (error) {
      console.error('加载系统状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCacheStats = async () => {
    try {
      const response = await fetch('/api/cache?action=stats');
      const data = await response.json();

      if (data.success) {
        setCacheStats(data.data);
      }
    } catch (error) {
      console.error('加载缓存统计失败:', error);
    }
  };

  const manageCacheAction = async (action: string, params: any = {}) => {
    try {
      setCacheLoading(true);

      const response = await fetch('/api/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...params }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        loadCacheStats(); // 刷新统计
      } else {
        alert(`操作失败: ${data.error}`);
      }
    } catch (error) {
      console.error('缓存操作失败:', error);
      alert('缓存操作失败');
    } finally {
      setCacheLoading(false);
    }
  };

  const loadSystemInfo = async () => {
    try {
      // 获取服务端配置状态
      const configResponse = await fetch('/api/config-status');
      const configData = await configResponse.json();

      // 客户端系统信息
      const clientInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        screenResolution: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        uptime: Math.floor((Date.now() - pageLoadTime) / 1000), // 页面运行时间（秒）
        memory: (performance as any).memory ? {
          used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024),
        } : null,
      };

      // 服务端配置信息
      let serverInfo;
      if (configData.success) {
        serverInfo = {
          github: {
            configured: configData.data.github.configured,
            status: configData.data.github.status,
            details: configData.data.github.details,
          },
          wechat: {
            configured: configData.data.wechat.configured,
            accounts: configData.data.wechat.accounts,
            configuredAccounts: configData.data.wechat.configuredAccounts,
          },
          environment: configData.data.environment.nodeEnv,
          version: '1.0.0',
          configurationScore: configData.data.summary.configurationScore,
        };
      } else {
        serverInfo = {
          github: { configured: false, status: 'error' },
          wechat: { configured: false, accounts: [], configuredAccounts: 0 },
          environment: 'unknown',
          version: '1.0.0',
          configurationScore: 0,
        };
      }

      setSystemInfo({
        ...clientInfo,
        server: serverInfo,
      });
    } catch (error) {
      console.error('加载系统信息失败:', error);
      // 如果服务端信息获取失败，至少显示客户端信息
      const clientInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        screenResolution: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        uptime: Math.floor((Date.now() - pageLoadTime) / 1000),
        memory: (performance as any).memory ? {
          used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024),
        } : null,
      };

      setSystemInfo({
        ...clientInfo,
        server: {
          github: { configured: false, status: 'error' },
          wechat: { configured: false, accounts: [], configuredAccounts: 0 },
          environment: 'unknown',
          version: '1.0.0',
          configurationScore: 0,
        },
      });
    }
  };

  const loadValidationData = async () => {
    try {
      setValidationLoading(true);
      const response = await fetch('/api/validate');
      const data = await response.json();

      if (data.success) {
        setValidationData(data.data);
      }
    } catch (error) {
      console.error('加载验证数据失败:', error);
    } finally {
      setValidationLoading(false);
    }
  };

  const runConsistencyCheck = async () => {
    try {
      setConsistencyLoading(true);
      const results = await dataConsistencyChecker.runAllChecks();
      setConsistencyData(results);
    } catch (error) {
      console.error('数据一致性检查失败:', error);
    } finally {
      setConsistencyLoading(false);
    }
  };

  const runConsistencyTest = async () => {
    try {
      setConsistencyTestLoading(true);
      const results = await DataConsistencyTester.runFullTest();
      setConsistencyTestData(results);
    } catch (error) {
      console.error('数据一致性测试失败:', error);
    } finally {
      setConsistencyTestLoading(false);
    }
  };

  const initializeStats = async () => {
    try {
      setStatsInitLoading(true);
      const response = await fetch('/api/init-stats', { method: 'POST' });
      const data = await response.json();
      setStatsInitData(data);
    } catch (error) {
      console.error('初始化统计数据失败:', error);
    } finally {
      setStatsInitLoading(false);
    }
  };

  const checkStatsStatus = async () => {
    try {
      const response = await fetch('/api/init-stats');
      const data = await response.json();
      setStatsInitData(data);
    } catch (error) {
      console.error('检查统计状态失败:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ComputerDesktopIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getOverallStatus = () => {
    if (!healthData) return 'unknown';
    
    const { summary } = healthData;
    if (summary.error > 0) return 'error';
    if (summary.warning > 0) return 'warning';
    return 'healthy';
  };

  const getOverallStatusText = () => {
    const status = getOverallStatus();
    switch (status) {
      case 'healthy':
        return '系统运行正常';
      case 'warning':
        return '系统有警告';
      case 'error':
        return '系统有错误';
      default:
        return '状态未知';
    }
  };

  return (
    <AdminLayout>
      <div className="content-area py-6">
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">系统状态</h1>
            <p className="page-subtitle">监控系统健康状态和性能指标</p>
          </div>
          <div className="flex items-center space-x-3">
            {lastChecked && (
              <div className="flex items-center text-sm text-gray-500">
                <ClockIcon className="h-4 w-4 mr-1" />
                最后检查: {new Date(lastChecked).toLocaleString('zh-CN')}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadHealthStatus(false)}
              disabled={loading}
            >
              {loading ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowPathIcon className="h-4 w-4 mr-2" />
              )}
              刷新状态
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => loadHealthStatus(true)}
              disabled={loading}
            >
              详细检查
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadValidationData}
              disabled={validationLoading}
            >
              {validationLoading ? '验证中...' : '数据验证'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={runConsistencyCheck}
              disabled={consistencyLoading}
            >
              {consistencyLoading ? '检查中...' : '一致性检查'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={runConsistencyTest}
              disabled={consistencyTestLoading}
            >
              {consistencyTestLoading ? '测试中...' : '数据一致性测试'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={initializeStats}
              disabled={statsInitLoading}
            >
              {statsInitLoading ? '初始化中...' : '初始化真实统计数据'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={checkStatsStatus}
            >
              检查统计状态
            </Button>
          </div>
        </div>

        {/* 系统概览 */}
        {healthData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  {getStatusIcon(getOverallStatus())}
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">系统状态</p>
                    <p className="text-lg font-semibold">{getOverallStatusText()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">健康检查</p>
                    <p className="text-xl font-semibold">{healthData.summary.healthy}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">警告</p>
                    <p className="text-xl font-semibold">{healthData.summary.warning}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <XCircleIcon className="h-8 w-8 text-red-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">错误</p>
                    <p className="text-xl font-semibold">{healthData.summary.error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 健康检查详情 */}
        {healthData && (
          <Card>
            <CardHeader>
              <CardTitle>健康检查详情</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healthData.checks.map((check: any, index: number) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getStatusColor(check.status)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        {getStatusIcon(check.status)}
                        <div className="ml-3">
                          <h3 className="font-medium">{check.name}</h3>
                          <p className="text-sm mt-1">{check.message}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        check.status === 'healthy' ? 'bg-green-100 text-green-800' :
                        check.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {check.status === 'healthy' ? '正常' :
                         check.status === 'warning' ? '警告' : '错误'}
                      </span>
                    </div>
                    
                    {/* 详细信息 */}
                    {check.details && (
                      <div className="mt-3 pl-8">
                        <details className="text-sm">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                            查看详情
                          </summary>
                          <div className="mt-2 p-3 bg-white bg-opacity-50 rounded border">
                            <pre className="text-xs overflow-x-auto">
                              {JSON.stringify(check.details, null, 2)}
                            </pre>
                          </div>
                        </details>
                      </div>
                    )}
                    
                    {/* 错误信息 */}
                    {check.error && (
                      <div className="mt-3 pl-8">
                        <div className="text-sm text-red-700 bg-red-100 p-2 rounded">
                          <strong>错误:</strong> {check.error}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 系统配置状态 */}
        {systemInfo && systemInfo.server && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>系统配置状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* GitHub 配置 */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                      </svg>
                      GitHub 配置
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      systemInfo.server.github.configured
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {systemInfo.server.github.configured ? '已配置' : '未配置'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">状态:</span>
                      <span className={systemInfo.server.github.configured ? 'text-green-600' : 'text-red-600'}>
                        {systemInfo.server.github.configured ? '已连接' : '未找到配置'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Token:</span>
                      <span className={systemInfo.server.github.configured ? 'text-green-600' : 'text-red-600'}>
                        {systemInfo.server.github.configured ? '已设置' : '未设置'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 微信配置 */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.298c-.019.065-.044.13-.044.2 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.833.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 4.882-1.900 7.60.5.5-.25 1.5-.75 2.5-1.5-2.5-3-6.5-4.5-10.5-4.5z"/>
                        <path d="M17.691 11.5c-2.5 0-4.5 1.5-4.5 3.5s2 3.5 4.5 3.5c.5 0 1-.1 1.5-.2l1.5.9c.1.1.2.1.3.1.1 0 .2-.1.2-.2 0-.1 0-.1-.1-.2l-.3-1c1.2-.8 2-2.1 2-3.4 0-2-2-3.5-4.5-3.5z"/>
                      </svg>
                      微信配置
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      systemInfo.server.wechat.configured
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {systemInfo.server.wechat.configured ? '已配置' : '未配置'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">配置账号:</span>
                      <span className={systemInfo.server.wechat.configuredAccounts > 0 ? 'text-green-600' : 'text-red-600'}>
                        {systemInfo.server.wechat.configuredAccounts || 0} / 2
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">状态:</span>
                      <span className={systemInfo.server.wechat.configured ? 'text-green-600' : 'text-red-600'}>
                        {systemInfo.server.wechat.configured ? '可用' : '未找到配置'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 配置建议 */}
              {(!systemInfo.server.github.configured || !systemInfo.server.wechat.configured) && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">配置建议</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {!systemInfo.server.github.configured && (
                      <li>• 请在环境变量中设置 GITHUB_TOKEN、GITHUB_OWNER、GITHUB_REPO</li>
                    )}
                    {!systemInfo.server.wechat.configured && (
                      <li>• 请在环境变量中设置 WECHAT_A_APPID、WECHAT_A_SECRET 等微信配置</li>
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 加载状态 */}
        {loading && !healthData && (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <ArrowPathIcon className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">正在检查系统状态</h3>
                <p className="text-gray-500">请稍候...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 数据一致性验证 */}
        {validationData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>数据一致性验证</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  validationData.summary.failed === 0
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {validationData.summary.failed === 0 ? '全部通过' : `${validationData.summary.failed}个失败`}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{validationData.summary.passed}</p>
                  <p className="text-sm text-gray-500">通过</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{validationData.summary.warnings}</p>
                  <p className="text-sm text-gray-500">警告</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{validationData.summary.failed}</p>
                  <p className="text-sm text-gray-500">失败</p>
                </div>
              </div>

              <div className="space-y-3">
                {validationData.results.map((result: any, index: number) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.status === 'pass' ? 'bg-green-50 border-green-200' :
                      result.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {result.status === 'pass' ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                        ) : result.status === 'warning' ? (
                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                        )}
                        <div>
                          <h4 className="font-medium">{result.name}</h4>
                          <p className="text-sm text-gray-600">{result.message}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        result.status === 'pass' ? 'bg-green-100 text-green-800' :
                        result.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {result.status === 'pass' ? '通过' :
                         result.status === 'warning' ? '警告' : '失败'}
                      </span>
                    </div>

                    {result.details && (
                      <div className="mt-2 pl-7">
                        <details className="text-sm">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                            查看详情
                          </summary>
                          <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs">
                            <pre>{JSON.stringify(result.details, null, 2)}</pre>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 数据一致性检查结果 */}
        {consistencyData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>数据一致性检查</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  consistencyData.failed === 0
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {consistencyData.failed === 0 ? '全部通过' : `${consistencyData.failed}个失败`}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{consistencyData.passed}</p>
                  <p className="text-sm text-gray-500">通过</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{consistencyData.failed}</p>
                  <p className="text-sm text-gray-500">失败</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{consistencyData.total}</p>
                  <p className="text-sm text-gray-500">总计</p>
                </div>
              </div>

              <div className="space-y-4">
                {consistencyData.results.map((result: any, index: number) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        {result.passed ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">{result.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{result.description}</p>
                          <p className="text-sm">{result.message}</p>

                          {result.suggestions && result.suggestions.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-700 mb-1">建议:</p>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {result.suggestions.map((suggestion: string, idx: number) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="mr-1">•</span>
                                    <span>{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {result.passed ? '通过' : '失败'}
                      </span>
                    </div>

                    {result.details && (
                      <div className="mt-3 pl-8">
                        <details className="text-sm">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                            查看详情
                          </summary>
                          <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs">
                            <pre className="whitespace-pre-wrap">{JSON.stringify(result.details, null, 2)}</pre>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 数据一致性测试结果 */}
        {consistencyTestData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>数据一致性测试</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  consistencyTestData.overall.passed
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {consistencyTestData.overall.passed ? '全部通过' : '存在问题'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">{consistencyTestData.overall.summary}</p>
                <p className="text-sm font-medium">{consistencyTestData.overall.message}</p>
              </div>

              <div className="space-y-4">
                {/* 仪表板-统计页一致性测试 */}
                <div className={`p-4 rounded-lg border ${
                  consistencyTestData.dashboardAnalytics.passed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      {consistencyTestData.dashboardAnalytics.passed ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                      )}
                      <div>
                        <h4 className="font-medium">仪表板-统计页数据一致性</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {consistencyTestData.dashboardAnalytics.message}
                        </p>
                        {consistencyTestData.dashboardAnalytics.details.differences.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-700 mb-1">发现的差异:</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {consistencyTestData.dashboardAnalytics.details.differences.map((diff: string, idx: number) => (
                                <li key={idx} className="flex items-start">
                                  <span className="mr-1">•</span>
                                  <span>{diff}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      consistencyTestData.dashboardAnalytics.passed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {consistencyTestData.dashboardAnalytics.passed ? '通过' : '失败'}
                    </span>
                  </div>
                </div>

                {/* 缓存一致性测试 */}
                <div className={`p-4 rounded-lg border ${
                  consistencyTestData.cache.passed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      {consistencyTestData.cache.passed ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                      )}
                      <div>
                        <h4 className="font-medium">缓存一致性</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {consistencyTestData.cache.message}
                        </p>
                        {consistencyTestData.cache.details.differences.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-700 mb-1">发现的问题:</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {consistencyTestData.cache.details.differences.map((diff: string, idx: number) => (
                                <li key={idx} className="flex items-start">
                                  <span className="mr-1">•</span>
                                  <span>{diff}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      consistencyTestData.cache.passed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {consistencyTestData.cache.passed ? '通过' : '失败'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 统计数据初始化结果 */}
        {statsInitData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>统计数据初始化</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  statsInitData.success
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {statsInitData.success ? '成功' : '失败'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">{statsInitData.message}</p>
              </div>

              {statsInitData.success && statsInitData.data && (
                <div className="space-y-4">
                  {/* 统计概览 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{statsInitData.data.totalArticles}</p>
                      <p className="text-sm text-gray-600">总文章数</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{statsInitData.data.validArticles}</p>
                      <p className="text-sm text-gray-600">有效文章</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{statsInitData.data.invalidArticles}</p>
                      <p className="text-sm text-gray-600">无效文章</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{statsInitData.data.globalStats?.articlesCount || 0}</p>
                      <p className="text-sm text-gray-600">已初始化</p>
                    </div>
                  </div>

                  {/* 全局统计 */}
                  {statsInitData.data.globalStats && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-3">全局统计数据</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">总阅读量:</span>
                          <span className="ml-2 font-medium">{statsInitData.data.globalStats.totalViews.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">总点赞数:</span>
                          <span className="ml-2 font-medium">{statsInitData.data.globalStats.totalLikes.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">总分享数:</span>
                          <span className="ml-2 font-medium">{statsInitData.data.globalStats.totalShares.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 示例文章 */}
                  {statsInitData.data.sampleArticles && statsInitData.data.sampleArticles.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">示例文章统计</h4>
                      <div className="space-y-2">
                        {statsInitData.data.sampleArticles.map((article: any, index: number) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h5 className="font-medium text-sm">{article.title}</h5>
                                <p className="text-xs text-gray-500 mt-1">ID: {article.id}</p>
                              </div>
                              <div className="text-right text-sm">
                                <div className="text-blue-600">{article.stats.views} 阅读</div>
                                <div className="text-green-600">{article.stats.likes} 点赞</div>
                                <div className="text-purple-600">{article.stats.shares} 分享</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 无效文章列表 */}
                  {statsInitData.data.invalidArticles && statsInitData.data.invalidArticles.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 text-red-600">发现的无效文章</h4>
                      <div className="space-y-2">
                        {statsInitData.data.invalidArticles.map((article: any, index: number) => (
                          <div key={index} className="p-3 border border-red-200 rounded-lg bg-red-50">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium text-red-800">{article.title}</span>
                                <span className="text-xs text-red-600 ml-2">({article.id})</span>
                              </div>
                              <span className="text-xs text-red-500">{article.filePath}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 缓存管理 */}
        {cacheStats && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>缓存管理</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => manageCacheAction('cleanup')}
                    disabled={cacheLoading}
                  >
                    清理过期
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => manageCacheAction('warmup')}
                    disabled={cacheLoading}
                  >
                    预热缓存
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('确定要清空所有缓存吗？')) {
                        manageCacheAction('clear');
                      }
                    }}
                    disabled={cacheLoading}
                  >
                    清空缓存
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{cacheStats.total}</p>
                  <p className="text-sm text-gray-500">总缓存项</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{cacheStats.valid}</p>
                  <p className="text-sm text-gray-500">有效缓存</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{cacheStats.expired}</p>
                  <p className="text-sm text-gray-500">过期缓存</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {(cacheStats.hitRate * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">命中率</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 系统信息 */}
        {systemInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ServerIcon className="h-5 w-5 mr-2" />
                  客户端信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">平台</span>
                    <span className="font-mono text-sm">{systemInfo.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">语言</span>
                    <span className="font-mono">{systemInfo.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">时区</span>
                    <span className="font-mono text-sm">{systemInfo.timezone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">屏幕分辨率</span>
                    <span className="font-mono">{systemInfo.screenResolution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">页面运行时间</span>
                    <span className="font-mono">
                      {Math.floor(systemInfo.uptime / 3600)}h {Math.floor((systemInfo.uptime % 3600) / 60)}m {systemInfo.uptime % 60}s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">网络状态</span>
                    <span className={`font-mono ${systemInfo.onLine ? 'text-green-600' : 'text-red-600'}`}>
                      {systemInfo.onLine ? '在线' : '离线'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CpuChipIcon className="h-5 w-5 mr-2" />
                  内存使用
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemInfo.memory ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">已使用</span>
                        <span className="font-mono">{systemInfo.memory.used} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">总计</span>
                        <span className="font-mono">{systemInfo.memory.total} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">限制</span>
                        <span className="font-mono">{systemInfo.memory.limit} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">使用率</span>
                        <span className="font-mono">
                          {((systemInfo.memory.used / systemInfo.memory.total) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-500">
                      <p>内存信息不可用</p>
                      <p className="text-xs mt-1">需要Chrome浏览器支持</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
