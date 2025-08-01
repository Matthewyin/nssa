'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  DocumentTextIcon,
  PhotoIcon,
  ChartBarIcon,
  UserGroupIcon,
  RocketLaunchIcon,
  CogIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

// 汇总的仪表板数据
const dashboardStats = [
  {
    name: '总文章数',
    value: '13', // 技术3 + 历史3 + 心理3 + 职场4
    change: '+4',
    changeType: 'positive',
    icon: DocumentTextIcon,
  },
  {
    name: '总阅读量',
    value: '45.2K', // 汇总所有专题的阅读量
    change: '+12.5%',
    changeType: 'positive',
    icon: ChartBarIcon,
  },
  {
    name: '媒体文件',
    value: '4', // 当前有4个示例媒体文件
    change: '+4',
    changeType: 'positive',
    icon: PhotoIcon,
  },
  {
    name: '活跃用户',
    value: '3', // 3个活跃用户
    change: '0',
    changeType: 'neutral',
    icon: UserGroupIcon,
  },
];

const quickActions = [
  {
    name: '技术专题',
    description: '管理技术相关文章',
    href: '/admin/tech',
    icon: DocumentTextIcon,
    color: 'bg-blue-500',
  },
  {
    name: '历史专题',
    description: '管理历史研究文章',
    href: '/admin/history',
    icon: DocumentTextIcon,
    color: 'bg-amber-500',
  },
  {
    name: '心理专题',
    description: '管理心理学文章',
    href: '/admin/psychology',
    icon: DocumentTextIcon,
    color: 'bg-purple-500',
  },
  {
    name: '职场专题',
    description: '管理职场发展文章',
    href: '/admin/workplace',
    icon: DocumentTextIcon,
    color: 'bg-indigo-500',
  },
];

export default function AdminDashboard() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 格式化数字显示
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'long',
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    // 加载仪表板数据
    loadDashboardData();

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 并行加载多个API数据
      const [articlesRes, analyticsRes] = await Promise.all([
        fetch('/api/articles'),
        fetch('/api/analytics?type=overview')
      ]);

      const [articlesData, analyticsData] = await Promise.all([
        articlesRes.json(),
        analyticsRes.json()
      ]);

      if (articlesData.success && analyticsData.success) {
        setDashboardData({
          articles: articlesData.data,
          analytics: analyticsData.data
        });
      }
    } catch (error) {
      console.error('加载仪表板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className='content-area py-6'>
        {/* 欢迎区域 */}
        <div className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            欢迎回来！
          </h2>
          <p className='text-gray-600'>
            这里是您的内容管理中心，您可以创建、编辑和发布文章。
          </p>
        </div>

        {/* 统计卡片 */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {loading ? (
            // 加载状态
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardContent className='p-6'>
                  <div className='animate-pulse'>
                    <div className='flex items-center'>
                      <div className='h-8 w-8 bg-gray-200 rounded'></div>
                      <div className='ml-4 flex-1'>
                        <div className='h-4 bg-gray-200 rounded w-20 mb-2'></div>
                        <div className='h-6 bg-gray-200 rounded w-16'></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // 真实数据或fallback到mock数据
            (dashboardData ? [
              {
                name: '总文章数',
                value: dashboardData.analytics?.totalArticles || dashboardData.articles?.length || 0,
                change: (dashboardData.analytics?.articlesChange > 0 ? '+' : '') +
                       (dashboardData.analytics?.articlesChange?.toFixed(1) || '0') + '%',
                changeType: (dashboardData.analytics?.articlesChange || 0) >= 0 ? 'positive' : 'negative',
                icon: DocumentTextIcon,
              },
              {
                name: '总阅读量',
                value: formatNumber(dashboardData.analytics?.totalViews || 0),
                change: (dashboardData.analytics?.viewsChange > 0 ? '+' : '') +
                       (dashboardData.analytics?.viewsChange?.toFixed(1) || '0') + '%',
                changeType: (dashboardData.analytics?.viewsChange || 0) >= 0 ? 'positive' : 'negative',
                icon: ChartBarIcon,
              },
              {
                name: '总点赞数',
                value: formatNumber(dashboardData.analytics?.totalLikes || 0),
                change: (dashboardData.analytics?.likesChange > 0 ? '+' : '') +
                       (dashboardData.analytics?.likesChange?.toFixed(1) || '0') + '%',
                changeType: (dashboardData.analytics?.likesChange || 0) >= 0 ? 'positive' : 'negative',
                icon: UserGroupIcon,
              },
              {
                name: '总分享数',
                value: formatNumber(dashboardData.analytics?.totalShares || 0),
                change: (dashboardData.analytics?.sharesChange > 0 ? '+' : '') +
                       (dashboardData.analytics?.sharesChange?.toFixed(1) || '0') + '%',
                changeType: (dashboardData.analytics?.sharesChange || 0) >= 0 ? 'positive' : 'negative',
                icon: RocketLaunchIcon,
              },
            ] : dashboardStats).map((stat) => (
            <Card key={stat.name}>
              <CardContent className='p-6'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <stat.icon className='h-8 w-8 text-gray-400' />
                  </div>
                  <div className='ml-4'>
                    <p className='text-sm font-medium text-gray-500'>
                      {stat.name}
                    </p>
                    <div className='flex items-baseline'>
                      <p className='text-2xl font-semibold text-gray-900'>
                        {stat.value}
                      </p>
                      <p className={`ml-2 text-sm font-medium ${
                        stat.changeType === 'positive'
                          ? 'text-green-600'
                          : stat.changeType === 'negative'
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}>
                        {stat.change}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
          )}
        </div>

        {/* 快捷操作 */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-medium text-gray-900'>快捷操作</h3>
            <Button
              variant='primary'
              size='sm'
              icon={<PlusIcon />}
              onClick={() => window.open('/admin/tina', '_blank')}
            >
              打开 Tina CMS
            </Button>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {quickActions.map((action) => (
              <Card key={action.name} variant='hover'>
                <CardContent className='p-6'>
                  <Link href={action.href} className='block'>
                    <div className='flex items-center'>
                      <div className={`flex-shrink-0 p-3 rounded-lg ${action.color}`}>
                        <action.icon className='h-6 w-6 text-white' />
                      </div>
                      <div className='ml-4'>
                        <h4 className='text-sm font-medium text-gray-900'>
                          {action.name}
                        </h4>
                        <p className='text-sm text-gray-500'>
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 最近活动 */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* 最近文章 */}
          <Card>
            <CardHeader>
              <CardTitle>最近文章</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {loading ? (
                  // 加载状态
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className='flex items-center space-x-3 animate-pulse'>
                      <div className='flex-shrink-0 h-10 w-10 bg-gray-200 rounded-lg'></div>
                      <div className='flex-1 min-w-0'>
                        <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                        <div className='h-3 bg-gray-200 rounded w-1/2'></div>
                      </div>
                    </div>
                  ))
                ) : (
                  // 显示真实的最近文章
                  (dashboardData?.articles?.slice(0, 3) || [
                    { title: '远程工作时代的团队协作策略', category: '职场专题', status: '已发布' },
                    { title: '认知偏差在决策中的影响', category: '心理专题', status: '已发布' },
                    { title: '现代前端开发最佳实践', category: '技术专题', status: '已发布' },
                  ]).map((article, index) => (
                  <div key={index} className='flex items-center space-x-3'>
                    <div className='flex-shrink-0 h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center'>
                      <DocumentTextIcon className='h-5 w-5 text-gray-500' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-900 truncate'>
                        {article.title}
                      </p>
                      <p className='text-sm text-gray-500'>
                        {article.category} · {article.status}
                      </p>
                    </div>
                  </div>
                  ))
                )}
              </div>
              <div className='mt-4'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => window.open('/admin/tina', '_blank')}
                >
                  查看所有文章 →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 系统状态 */}
          <Card>
            <CardHeader>
              <CardTitle>系统状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-500'>网站状态</span>
                  <span className='badge-success'>正常</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-500'>最后发布</span>
                  <span className='text-sm text-gray-900'>2 小时前</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-500'>存储使用</span>
                  <span className='text-sm text-gray-900'>2.3 GB / 10 GB</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-500'>CDN状态</span>
                  <span className='badge-success'>活跃</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
