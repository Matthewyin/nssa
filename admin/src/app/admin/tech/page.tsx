'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  TagIcon,
} from '@heroicons/react/24/outline';

// 模拟技术文章数据
const mockTechArticles = [
  {
    id: '1',
    title: '现代前端开发最佳实践',
    description: '探讨React、TypeScript和现代工具链的最佳实践',
    status: 'published',
    author: '技术团队',
    publishedAt: '2025-01-30',
    tags: ['React', 'TypeScript', '前端开发'],
    views: 1250,
  },
  {
    id: '2', 
    title: 'Cloudflare Workers 深度解析',
    description: '边缘计算的未来：Cloudflare Workers 实战指南',
    status: 'draft',
    author: '技术团队',
    publishedAt: null,
    tags: ['Cloudflare', '边缘计算', 'Serverless'],
    views: 0,
  },
  {
    id: '3',
    title: 'Next.js 14 新特性详解',
    description: 'App Router、Server Components 等新特性的深入分析',
    status: 'published',
    author: '技术团队', 
    publishedAt: '2025-01-28',
    tags: ['Next.js', 'React', 'Web开发'],
    views: 890,
  },
];

export default function TechArticlesPage() {
  const [articles, setArticles] = useState(mockTechArticles);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // 加载技术专题文章
  useEffect(() => {
    loadTechArticles();
  }, [statusFilter]);

  const loadTechArticles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('category', 'tech');
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/articles?${params}`);
      const data = await response.json();

      if (data.success) {
        setArticles(data.data);
      } else {
        console.error('加载文章失败:', data.error);
        // 如果API失败，继续使用mock数据
      }
    } catch (error) {
      console.error('加载文章失败:', error);
      // 如果API失败，继续使用mock数据
    } finally {
      setLoading(false);
    }
  };

  // 搜索文章
  const handleSearch = () => {
    loadTechArticles();
  };

  // 过滤文章
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
            <h1 className="page-title">技术专题</h1>
            <p className="page-subtitle">管理技术相关的文章内容</p>
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
                  placeholder="搜索文章标题或内容..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  leftIcon={<MagnifyingGlassIcon />}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleSearch}
                disabled={loading}
              >
                搜索
              </Button>
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
                <DocumentTextIcon className="h-8 w-8 text-blue-500 mr-3" />
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
            <CardTitle>文章列表</CardTitle>
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
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="table-cell text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-gray-500">加载中...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredArticles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="table-cell text-center py-8">
                        <div className="text-gray-500">
                          {searchQuery || statusFilter !== 'all' ? '没有找到匹配的文章' : '暂无文章'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredArticles.map((article) => (
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
                            onClick={() => window.open(`https://nssa.io/tech/${article.id}`, '_blank')}
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
                  ))
                  )}
                </tbody>
              </table>
            </div>

          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
