'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

// 模拟职场专题文章数据
const mockWorkplaceArticles = [
  {
    id: '1',
    title: '远程工作时代的团队协作策略',
    description: '探讨在远程工作环境下如何建立高效的团队协作机制',
    status: 'published',
    author: '职场研究团队',
    publishedAt: '2025-01-31',
    tags: ['远程工作', '团队协作', '管理策略'],
    views: 3200,
  },
  {
    id: '2',
    title: '职场沟通中的情商应用',
    description: '如何在职场环境中运用情商提升沟通效果',
    status: 'published',
    author: '职场研究团队',
    publishedAt: '2025-01-29',
    tags: ['职场沟通', '情商', '人际关系'],
    views: 2800,
  },
  {
    id: '3',
    title: '技术人员的职业发展路径',
    description: '分析技术人员从初级到高级的职业发展轨迹和关键节点',
    status: 'draft',
    author: '职场研究团队',
    publishedAt: null,
    tags: ['职业发展', '技术管理', '职业规划'],
    views: 0,
  },
  {
    id: '4',
    title: '工作与生活平衡的艺术',
    description: '探讨如何在快节奏的工作环境中保持生活平衡',
    status: 'published',
    author: '职场研究团队',
    publishedAt: '2025-01-26',
    tags: ['工作生活平衡', '时间管理', '职场健康'],
    views: 1950,
  },
];

export default function WorkplaceArticlesPage() {
  const [articles, setArticles] = useState(mockWorkplaceArticles);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // 加载职场专题文章
  useEffect(() => {
    loadWorkplaceArticles();
  }, [statusFilter]);

  const loadWorkplaceArticles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('category', 'workplace');
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/articles?${params}`);
      const data = await response.json();

      if (data.success) {
        setArticles(data.data);
      } else {
        console.error('加载文章失败:', data.error);
      }
    } catch (error) {
      console.error('加载文章失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索文章
  const handleSearch = () => {
    loadWorkplaceArticles();
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = !searchQuery ||
      (article.title && article.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (article.description && article.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || article.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="badge-success">已发布</span>;
      case 'draft':
        return <span className="badge-secondary">草稿</span>;
      case 'scheduled':
        return <span className="badge-warning">定时发布</span>;
      default:
        return <span className="badge-secondary">{status}</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="content-area py-6">
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">职场专题</h1>
            <p className="page-subtitle">管理职场发展相关的文章内容</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/admin/tina', '_blank')}
            >
              打开 Tina CMS
            </Button>
            <Button
              variant="primary"
              icon={<PlusIcon />}
              onClick={() => window.open('/admin/tina', '_blank')}
            >
              新建文章
            </Button>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="搜索职场文章..."
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
                <option value="published">已发布</option>
                <option value="draft">草稿</option>
                <option value="scheduled">定时发布</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-indigo-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">总文章数</p>
                  <p className="text-xl font-semibold">{articles.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <EyeIcon className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">总阅读量</p>
                  <p className="text-xl font-semibold">
                    {articles.reduce((sum, article) => sum + article.views, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">已发布</p>
                  <p className="text-xl font-semibold">
                    {articles.filter(a => a.status === 'published').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">草稿</p>
                  <p className="text-xl font-semibold">
                    {articles.filter(a => a.status === 'draft').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 文章列表 */}
        <Card>
          <CardHeader>
            <CardTitle>职场文章列表</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">标题</th>
                    <th className="table-header-cell">状态</th>
                    <th className="table-header-cell">发布日期</th>
                    <th className="table-header-cell">阅读量</th>
                    <th className="table-header-cell">标签</th>
                    <th className="table-header-cell">操作</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredArticles.map((article) => (
                    <tr key={article.id} className="table-row">
                      <td className="table-cell">
                        <div>
                          <p className="font-medium text-gray-900">{article.title}</p>
                          <p className="text-sm text-gray-500 text-truncate-2">
                            {article.description}
                          </p>
                        </div>
                      </td>
                      <td className="table-cell">
                        {getStatusBadge(article.status)}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center text-sm text-gray-500">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {article.publishedAt || '未发布'}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center text-sm text-gray-500">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          {article.views}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-wrap gap-1">
                          {article.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="badge-secondary text-xs">
                              {tag}
                            </span>
                          ))}
                          {article.tags.length > 2 && (
                            <span className="text-xs text-gray-400">
                              +{article.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<EyeIcon />}
                            onClick={() => window.open(`https://nssa.io/workplace/${article.id}`, '_blank')}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<PencilIcon />}
                            onClick={() => window.open('/admin/tina', '_blank')}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<TrashIcon />}
                            onClick={() => {
                              if (confirm('确定要删除这篇文章吗？')) {
                                setArticles(articles.filter(a => a.id !== article.id));
                              }
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredArticles.length === 0 && (
              <div className="empty-state">
                <DocumentTextIcon className="empty-state-icon" />
                <h3 className="empty-state-title">暂无职场文章</h3>
                <p className="empty-state-description">
                  {searchQuery ? '没有找到匹配的文章' : '还没有创建任何职场文章'}
                </p>
                <Button
                  variant="primary"
                  icon={<PlusIcon />}
                  className="mt-4"
                  onClick={() => window.open('/admin/tina', '_blank')}
                >
                  创建第一篇文章
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
