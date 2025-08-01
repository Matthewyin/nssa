'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  RocketLaunchIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

// 模拟发布记录数据
const mockPublishRecords = [
  {
    id: '1',
    articleTitle: '现代前端开发最佳实践',
    platform: 'website',
    status: 'success',
    publishedAt: '2025-01-30T10:30:00Z',
    duration: 45, // 秒
    error: null,
    retryCount: 0,
  },
  {
    id: '2',
    articleTitle: '现代前端开发最佳实践',
    platform: 'wechat_a',
    status: 'success',
    publishedAt: '2025-01-30T10:32:00Z',
    duration: 120,
    error: null,
    retryCount: 0,
  },
  {
    id: '3',
    articleTitle: '认知偏差在决策中的影响',
    platform: 'website',
    status: 'pending',
    publishedAt: null,
    duration: null,
    error: null,
    retryCount: 0,
  },
  {
    id: '4',
    articleTitle: '远程工作时代的团队协作策略',
    platform: 'wechat_b',
    status: 'failed',
    publishedAt: null,
    duration: null,
    error: '微信API限制：每日发布次数已达上限',
    retryCount: 2,
  },
  {
    id: '5',
    articleTitle: '明朝海上丝绸之路的兴衰',
    platform: 'website',
    status: 'scheduled',
    publishedAt: '2025-02-01T09:00:00Z',
    duration: null,
    error: null,
    retryCount: 0,
  },
];

export default function PublishManagementPage() {
  const [publishRecords, setPublishRecords] = useState(mockPublishRecords);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);

  // 加载发布记录
  useEffect(() => {
    loadPublishRecords();
  }, [statusFilter, platformFilter]);

  const loadPublishRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (platformFilter !== 'all') params.append('platform', platformFilter);

      const response = await fetch(`/api/publish?${params}`);
      const data = await response.json();

      if (data.success) {
        setPublishRecords(data.data);
      }
    } catch (error) {
      console.error('加载发布记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerPublish = async (platform: string, articles: any[] = []) => {
    try {
      setLoading(true);

      // 如果没有指定文章，使用选中的文章
      const articlesToPublish = articles.length > 0 ? articles : selectedArticles;

      if (articlesToPublish.length === 0) {
        alert('请选择要发布的文章');
        return;
      }

      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          articles: articlesToPublish,
          options: {},
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`发布任务已启动: ${data.data.jobId}`);
        // 刷新记录
        setTimeout(() => loadPublishRecords(), 2000);
      } else {
        alert(`发布失败: ${data.error}`);
      }
    } catch (error) {
      console.error('发布失败:', error);
      alert('发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = publishRecords.filter(record => {
    const matchesSearch = !searchQuery ||
      (record.articleTitle && record.articleTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesPlatform = platformFilter === 'all' || record.platform === platformFilter;
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center badge-success">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            发布成功
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center badge-danger">
            <XCircleIcon className="h-3 w-3 mr-1" />
            发布失败
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center badge-warning">
            <ArrowPathIcon className="h-3 w-3 mr-1" />
            发布中
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center badge-secondary">
            <ClockIcon className="h-3 w-3 mr-1" />
            定时发布
          </span>
        );
      default:
        return <span className="badge-secondary">{status}</span>;
    }
  };

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'website':
        return (
          <span className="inline-flex items-center badge-primary">
            <GlobeAltIcon className="h-3 w-3 mr-1" />
            网站
          </span>
        );
      case 'wechat_a':
        return (
          <span className="inline-flex items-center badge-success">
            <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />
            微信A
          </span>
        );
      case 'wechat_b':
        return (
          <span className="inline-flex items-center badge-success">
            <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />
            微信B
          </span>
        );
      default:
        return <span className="badge-secondary">{platform}</span>;
    }
  };

  const retryPublish = async (recordId: string) => {
    try {
      // 找到对应的记录
      const record = publishRecords.find(r => r.id === recordId);
      if (!record) return;

      // 重新发布
      await triggerPublish(record.platform, [record]);
    } catch (error) {
      console.error('重试发布失败:', error);
      alert('重试发布失败');
    }
  };

  const cancelScheduled = (recordId: string) => {
    if (confirm('确定要取消这个定时发布任务吗？')) {
      setPublishRecords(records => records.filter(record => record.id !== recordId));
    }
  };

  return (
    <AdminLayout>
      <div className="content-area py-6">
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">发布管理</h1>
            <p className="page-subtitle">管理文章的多平台发布状态</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadPublishRecords}
              disabled={loading}
            >
              {loading ? '刷新中...' : '刷新状态'}
            </Button>
            <Button
              variant="primary"
              icon={<RocketLaunchIcon />}
              onClick={() => triggerPublish('all')}
              disabled={loading}
            >
              {loading ? '发布中...' : '批量发布'}
            </Button>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="搜索文章标题..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<MagnifyingGlassIcon />}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-32"
              >
                <option value="all">全部状态</option>
                <option value="success">发布成功</option>
                <option value="failed">发布失败</option>
                <option value="pending">发布中</option>
                <option value="scheduled">定时发布</option>
              </select>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="input w-32"
              >
                <option value="all">全部平台</option>
                <option value="website">网站</option>
                <option value="wechat_a">微信A</option>
                <option value="wechat_b">微信B</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">发布成功</p>
                  <p className="text-xl font-semibold">
                    {publishRecords.filter(r => r.status === 'success').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <XCircleIcon className="h-8 w-8 text-red-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">发布失败</p>
                  <p className="text-xl font-semibold">
                    {publishRecords.filter(r => r.status === 'failed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <ArrowPathIcon className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">发布中</p>
                  <p className="text-xl font-semibold">
                    {publishRecords.filter(r => r.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">定时发布</p>
                  <p className="text-xl font-semibold">
                    {publishRecords.filter(r => r.status === 'scheduled').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 发布记录列表 */}
        <Card>
          <CardHeader>
            <CardTitle>发布记录</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">文章标题</th>
                    <th className="table-header-cell">平台</th>
                    <th className="table-header-cell">状态</th>
                    <th className="table-header-cell">发布时间</th>
                    <th className="table-header-cell">耗时</th>
                    <th className="table-header-cell">重试次数</th>
                    <th className="table-header-cell">操作</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="table-row">
                      <td className="table-cell">
                        <p className="font-medium text-gray-900">{record.articleTitle}</p>
                        {record.error && (
                          <p className="text-sm text-red-600 mt-1">{record.error}</p>
                        )}
                      </td>
                      <td className="table-cell">
                        {getPlatformBadge(record.platform)}
                      </td>
                      <td className="table-cell">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center text-sm text-gray-500">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {record.publishedAt
                            ? new Date(record.publishedAt).toLocaleString('zh-CN')
                            : '未发布'
                          }
                        </div>
                      </td>
                      <td className="table-cell">
                        {record.duration ? `${record.duration}秒` : '-'}
                      </td>
                      <td className="table-cell">
                        {record.retryCount > 0 ? (
                          <span className="text-orange-600">{record.retryCount}</span>
                        ) : (
                          <span className="text-gray-500">0</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          {record.status === 'failed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<ArrowPathIcon />}
                              onClick={() => retryPublish(record.id)}
                            >
                              重试
                            </Button>
                          )}
                          {record.status === 'scheduled' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<XCircleIcon />}
                              onClick={() => cancelScheduled(record.id)}
                            >
                              取消
                            </Button>
                          )}
                          {record.status === 'success' && record.platform === 'website' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open('https://nssa.io', '_blank')}
                            >
                              查看
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRecords.length === 0 && (
              <div className="empty-state">
                <RocketLaunchIcon className="empty-state-icon" />
                <h3 className="empty-state-title">暂无发布记录</h3>
                <p className="empty-state-description">
                  {searchQuery ? '没有找到匹配的发布记录' : '还没有任何发布记录'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
