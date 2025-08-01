'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ShieldCheckIcon,
  KeyIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

export default function SecurityPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // 这里应该调用实际的API
      // 现在使用模拟数据
      setApiKeys([
        {
          id: '1',
          name: 'Admin Key',
          key: 'nssa_abc123...xyz789',
          permissions: ['*'],
          createdAt: '2024-01-15T10:00:00Z',
          lastUsed: '2024-01-30T15:30:00Z',
          isActive: true,
          rateLimitPerHour: 1000,
        },
        {
          id: '2',
          name: 'Read Only Key',
          key: 'nssa_def456...uvw012',
          permissions: ['articles:read', 'analytics:read'],
          createdAt: '2024-01-20T14:00:00Z',
          lastUsed: '2024-01-30T12:15:00Z',
          isActive: true,
          rateLimitPerHour: 500,
        },
      ]);

      setUsageStats({
        totalRequests: 1247,
        successfulRequests: 1198,
        errorRequests: 49,
        averageResponseTime: 145,
        topEndpoints: [
          { endpoint: '/api/articles', count: 456 },
          { endpoint: '/api/analytics', count: 234 },
          { endpoint: '/api/media', count: 189 },
        ],
      });

      setSecurityLogs([
        {
          id: '1',
          type: 'auth_success',
          message: 'API key authentication successful',
          ip: '192.168.1.100',
          timestamp: '2024-01-30T15:30:00Z',
        },
        {
          id: '2',
          type: 'rate_limit',
          message: 'Rate limit exceeded',
          ip: '10.0.0.50',
          timestamp: '2024-01-30T15:25:00Z',
        },
        {
          id: '3',
          type: 'auth_failed',
          message: 'Invalid API key',
          ip: '203.0.113.45',
          timestamp: '2024-01-30T15:20:00Z',
        },
      ]);

    } catch (error) {
      console.error('加载安全数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAPIKey = async (formData: any) => {
    try {
      // 这里应该调用API创建密钥
      console.log('创建API密钥:', formData);
      setShowCreateForm(false);
      loadSecurityData();
    } catch (error) {
      console.error('创建API密钥失败:', error);
    }
  };

  const handleToggleAPIKey = async (keyId: string, isActive: boolean) => {
    try {
      // 这里应该调用API切换密钥状态
      console.log('切换API密钥状态:', keyId, isActive);
      loadSecurityData();
    } catch (error) {
      console.error('切换API密钥状态失败:', error);
    }
  };

  const handleDeleteAPIKey = async (keyId: string) => {
    if (!confirm('确定要删除这个API密钥吗？此操作不可撤销。')) {
      return;
    }

    try {
      // 这里应该调用API删除密钥
      console.log('删除API密钥:', keyId);
      loadSecurityData();
    } catch (error) {
      console.error('删除API密钥失败:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">安全管理</h1>
            <p className="mt-2 text-gray-600">管理API密钥、监控安全事件和访问控制</p>
          </div>
          <Button
            variant="primary"
            icon={<PlusIcon />}
            onClick={() => setShowCreateForm(true)}
          >
            创建API密钥
          </Button>
        </div>

        {/* 安全概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <KeyIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">活跃API密钥</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {apiKeys.filter(key => key.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">今日请求</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usageStats?.totalRequests || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">成功率</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usageStats ? Math.round((usageStats.successfulRequests / usageStats.totalRequests) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">安全事件</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {securityLogs.filter(log => log.type !== 'auth_success').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API密钥管理 */}
        <Card>
          <CardHeader>
            <CardTitle>API密钥管理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium">{apiKey.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        apiKey.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {apiKey.isActive ? '活跃' : '禁用'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      密钥: {apiKey.key}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>权限: {apiKey.permissions.join(', ')}</span>
                      <span>限制: {apiKey.rateLimitPerHour}/小时</span>
                      <span>最后使用: {new Date(apiKey.lastUsed).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAPIKey(apiKey.id, !apiKey.isActive)}
                    >
                      {apiKey.isActive ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAPIKey(apiKey.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 使用统计 */}
        {usageStats && (
          <Card>
            <CardHeader>
              <CardTitle>API使用统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">热门端点</h4>
                  <div className="space-y-2">
                    {usageStats.topEndpoints.map((endpoint: any, index: number) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{endpoint.endpoint}</span>
                        <span className="text-sm font-medium">{endpoint.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">性能指标</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">平均响应时间</span>
                      <span className="text-sm font-medium">{usageStats.averageResponseTime}ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">成功请求</span>
                      <span className="text-sm font-medium">{usageStats.successfulRequests}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">错误请求</span>
                      <span className="text-sm font-medium">{usageStats.errorRequests}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 安全日志 */}
        <Card>
          <CardHeader>
            <CardTitle>安全日志</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securityLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border-l-4 ${
                    log.type === 'auth_success' 
                      ? 'border-green-400 bg-green-50' 
                      : log.type === 'rate_limit'
                      ? 'border-yellow-400 bg-yellow-50'
                      : 'border-red-400 bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{log.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        IP: {log.ip} • {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      log.type === 'auth_success' 
                        ? 'bg-green-100 text-green-800' 
                        : log.type === 'rate_limit'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {log.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 创建API密钥表单 - 这里可以添加模态框 */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">创建API密钥</h3>
            <p className="text-sm text-gray-600 mb-4">
              创建新的API密钥用于访问NSSA管理API
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={() => setShowCreateForm(false)}
              >
                取消
              </Button>
              <Button
                variant="primary"
                onClick={() => handleCreateAPIKey({})}
              >
                创建
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
