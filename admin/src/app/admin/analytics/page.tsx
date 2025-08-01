'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ChartBarIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

// 模拟统计数据
const mockAnalytics = {
  overview: {
    totalViews: 45230,
    totalLikes: 1820,
    totalShares: 456,
    totalArticles: 24,
    viewsChange: 12.5,
    likesChange: -3.2,
    sharesChange: 8.7,
    articlesChange: 4.3,
  },
  topArticles: [
    {
      id: '1',
      title: '远程工作时代的团队协作策略',
      category: '职场专题',
      views: 3200,
      likes: 156,
      shares: 89,
      publishedAt: '2025-01-31',
    },
    {
      id: '2',
      title: '认知偏差在决策中的影响',
      category: '心理专题',
      views: 2800,
      likes: 142,
      shares: 67,
      publishedAt: '2025-01-30',
    },
    {
      id: '3',
      title: '现代前端开发最佳实践',
      category: '技术专题',
      views: 2450,
      likes: 128,
      shares: 54,
      publishedAt: '2025-01-29',
    },
    {
      id: '4',
      title: '明朝海上丝绸之路的兴衰',
      category: '历史专题',
      views: 2100,
      likes: 98,
      shares: 43,
      publishedAt: '2025-01-28',
    },
  ],
  categoryStats: [
    { category: '职场专题', articles: 8, views: 12500, percentage: 27.6 },
    { category: '技术专题', articles: 6, views: 11200, percentage: 24.8 },
    { category: '心理专题', articles: 5, views: 10800, percentage: 23.9 },
    { category: '历史专题', articles: 5, views: 10730, percentage: 23.7 },
  ],
  monthlyTrends: [
    { month: '2024-09', articles: 4, views: 8500 },
    { month: '2024-10', articles: 5, views: 9200 },
    { month: '2024-11', articles: 6, views: 10800 },
    { month: '2024-12', articles: 5, views: 11200 },
    { month: '2025-01', articles: 4, views: 5530 }, // 当月进行中
  ],
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d');
  const [analytics, setAnalytics] = useState(mockAnalytics);
  const [loading, setLoading] = useState(false);

  // 加载统计数据
  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // 并行加载所有统计数据
      const [overviewRes, articlesRes, categoriesRes, trendsRes] = await Promise.all([
        fetch('/api/analytics?type=overview'),
        fetch('/api/analytics?type=articles'),
        fetch('/api/analytics?type=categories'),
        fetch(`/api/analytics?type=trends&dateRange=${dateRange}`),
      ]);

      const [overview, articles, categories, trends] = await Promise.all([
        overviewRes.json(),
        articlesRes.json(),
        categoriesRes.json(),
        trendsRes.json(),
      ]);

      if (overview.success && articles.success && categories.success && trends.success) {
        setAnalytics({
          overview: overview.data || mockAnalytics.overview,
          topArticles: articles.data?.topArticles || mockAnalytics.topArticles,
          categoryStats: categories.data || mockAnalytics.categoryStats,
          monthlyTrends: trends.data?.trends || mockAnalytics.monthlyTrends,
        });
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
      // 如果API失败，继续使用模拟数据
      setAnalytics(mockAnalytics);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) {
      return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
    } else if (change < 0) {
      return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const exportData = async () => {
    try {
      setLoading(true);

      // 获取完整的统计数据
      const response = await fetch(`/api/analytics?type=overview&dateRange=${dateRange}&export=true`);
      const data = await response.json();

      if (data.success) {
        // 创建CSV内容
        const csvContent = generateCSV(analytics);

        // 下载文件
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `nssa-analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('导出数据失败:', error);
      alert('导出数据失败');
    } finally {
      setLoading(false);
    }
  };

  const generateCSV = (data: any) => {
    const headers = ['指标', '数值', '变化率'];
    const rows = [
      ['总阅读量', data.overview.totalViews, `${data.overview.viewsChange}%`],
      ['总点赞数', data.overview.totalLikes, `${data.overview.likesChange}%`],
      ['总分享数', data.overview.totalShares, `${data.overview.sharesChange}%`],
      ['总文章数', data.overview.totalArticles, `${data.overview.articlesChange}%`],
    ];

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  return (
    <AdminLayout>
      <div className="content-area py-6">
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">数据统计</h1>
            <p className="page-subtitle">查看网站访问和内容表现数据</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input w-32"
            >
              <option value="7d">近7天</option>
              <option value="30d">近30天</option>
              <option value="90d">近90天</option>
              <option value="1y">近1年</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowDownTrayIcon />}
              onClick={exportData}
              disabled={loading}
            >
              {loading ? '导出中...' : '导出数据'}
            </Button>
          </div>
        </div>

        {/* 概览统计 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">总阅读量</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(analytics.overview.totalViews)}
                  </p>
                  <div className={`flex items-center mt-1 text-sm ${getChangeColor(analytics.overview.viewsChange)}`}>
                    {getChangeIcon(analytics.overview.viewsChange)}
                    <span className="ml-1">
                      {analytics.overview.viewsChange > 0 ? '+' : ''}
                      {analytics.overview.viewsChange}%
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <EyeIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">总点赞数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(analytics.overview.totalLikes)}
                  </p>
                  <div className={`flex items-center mt-1 text-sm ${getChangeColor(analytics.overview.likesChange)}`}>
                    {getChangeIcon(analytics.overview.likesChange)}
                    <span className="ml-1">
                      {analytics.overview.likesChange > 0 ? '+' : ''}
                      {analytics.overview.likesChange}%
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <HeartIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">总分享数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(analytics.overview.totalShares)}
                  </p>
                  <div className={`flex items-center mt-1 text-sm ${getChangeColor(analytics.overview.sharesChange)}`}>
                    {getChangeIcon(analytics.overview.sharesChange)}
                    <span className="ml-1">
                      {analytics.overview.sharesChange > 0 ? '+' : ''}
                      {analytics.overview.sharesChange}%
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <ShareIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">总文章数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.overview.totalArticles}
                  </p>
                  <div className={`flex items-center mt-1 text-sm ${getChangeColor(analytics.overview.articlesChange)}`}>
                    {getChangeIcon(analytics.overview.articlesChange)}
                    <span className="ml-1">
                      {analytics.overview.articlesChange > 0 ? '+' : ''}
                      {analytics.overview.articlesChange}%
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <ChartBarIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 热门文章 */}
          <Card>
            <CardHeader>
              <CardTitle>热门文章</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topArticles.map((article, index) => (
                  <div key={article.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {article.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {article.category} • {article.publishedAt}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        {formatNumber(article.views)}
                      </div>
                      <div className="flex items-center">
                        <HeartIcon className="h-4 w-4 mr-1" />
                        {article.likes}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 分类统计 */}
          <Card>
            <CardHeader>
              <CardTitle>分类统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.categoryStats.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {category.category}
                      </span>
                      <span className="text-sm text-gray-500">
                        {category.articles} 篇文章
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatNumber(category.views)} 阅读量</span>
                      <span>{category.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 月度趋势 */}
        <Card>
          <CardHeader>
            <CardTitle>月度趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-4">
                {analytics.monthlyTrends.map((month) => (
                  <div key={month.month} className="text-center">
                    <div className="bg-gray-100 rounded-lg p-4 mb-2">
                      <div className="text-2xl font-bold text-gray-900">
                        {month.articles}
                      </div>
                      <div className="text-xs text-gray-500">文章</div>
                    </div>
                    <div className="bg-blue-100 rounded-lg p-4 mb-2">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatNumber(month.views)}
                      </div>
                      <div className="text-xs text-gray-500">阅读量</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(month.month).toLocaleDateString('zh-CN', { 
                        year: 'numeric', 
                        month: 'short' 
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
