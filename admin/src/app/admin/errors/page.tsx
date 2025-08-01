'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ExclamationTriangleIcon,
  BugAntIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export default function ErrorManagementPage() {
  const [errors, setErrors] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [resolvedFilter, setResolvedFilter] = useState('all');

  useEffect(() => {
    loadErrors();
  }, [severityFilter, resolvedFilter]);

  const loadErrors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      if (resolvedFilter !== 'all') params.append('resolved', resolvedFilter);
      
      const response = await fetch(`/api/errors?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setErrors(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('加载错误报告失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <span className="badge-danger">严重</span>;
      case 'high':
        return <span className="badge-warning">高</span>;
      case 'medium':
        return <span className="badge-secondary">中</span>;
      case 'low':
        return <span className="badge-success">低</span>;
      default:
        return <span className="badge-secondary">{severity}</span>;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const markAsResolved = async (errorId: string) => {
    // TODO: 实现标记为已解决的API
    setErrors(prev => prev.map(error => 
      error.id === errorId ? { ...error, resolved: true } : error
    ));
  };

  const deleteError = async (errorId: string) => {
    if (!confirm('确定要删除这个错误报告吗？')) return;
    
    // TODO: 实现删除错误的API
    setErrors(prev => prev.filter(error => error.id !== errorId));
  };

  return (
    <AdminLayout>
      <div className="content-area py-6">
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">错误管理</h1>
            <p className="page-subtitle">监控和管理应用程序错误</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadErrors}
              disabled={loading}
            >
              {loading ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowPathIcon className="h-4 w-4 mr-2" />
              )}
              刷新
            </Button>
          </div>
        </div>

        {/* 筛选器 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="input w-32"
              >
                <option value="all">全部严重程度</option>
                <option value="critical">严重</option>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
              <select
                value={resolvedFilter}
                onChange={(e) => setResolvedFilter(e.target.value)}
                className="input w-32"
              >
                <option value="all">全部状态</option>
                <option value="false">未解决</option>
                <option value="true">已解决</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* 统计信息 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <BugAntIcon className="h-8 w-8 text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">总错误数</p>
                    <p className="text-xl font-semibold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">严重错误</p>
                    <p className="text-xl font-semibold">{stats.critical}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-8 w-8 text-orange-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">高级错误</p>
                    <p className="text-xl font-semibold">{stats.high}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <XCircleIcon className="h-8 w-8 text-yellow-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">未解决</p>
                    <p className="text-xl font-semibold">{stats.unresolved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">已解决</p>
                    <p className="text-xl font-semibold">{stats.total - stats.unresolved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 错误列表 */}
        <Card>
          <CardHeader>
            <CardTitle>错误报告</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-4 p-4">
              {errors.map((error) => (
                <div
                  key={error.id}
                  className={`border rounded-lg p-4 ${
                    error.resolved ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <BugAntIcon className={`h-5 w-5 ${getSeverityColor(error.severity)}`} />
                      <div>
                        <div className="flex items-center space-x-2">
                          {getSeverityBadge(error.severity)}
                          {error.resolved && (
                            <span className="badge-success">已解决</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(error.timestamp).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!error.resolved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<CheckCircleIcon />}
                          onClick={() => markAsResolved(error.id)}
                        >
                          标记已解决
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<TrashIcon />}
                        onClick={() => deleteError(error.id)}
                      >
                        删除
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900">错误信息</h4>
                      <p className="text-sm text-red-600 bg-red-50 p-2 rounded mt-1 font-mono">
                        {error.message}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">URL:</span>
                        <p className="text-gray-600 break-all">{error.url}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">用户代理:</span>
                        <p className="text-gray-600 truncate" title={error.userAgent}>
                          {error.userAgent}
                        </p>
                      </div>
                    </div>

                    {error.stack && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          查看堆栈信息
                        </summary>
                        <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-x-auto">
                          <pre className="whitespace-pre-wrap">{error.stack}</pre>
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {errors.length === 0 && !loading && (
              <div className="empty-state">
                <CheckCircleIcon className="empty-state-icon text-green-500" />
                <h3 className="empty-state-title">暂无错误报告</h3>
                <p className="empty-state-description">
                  系统运行正常，没有发现错误
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
