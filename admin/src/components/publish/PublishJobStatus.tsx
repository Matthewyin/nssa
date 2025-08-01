'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface PublishJobStatusProps {
  jobId: string;
  onClose: () => void;
}

export function PublishJobStatus({ jobId, onClose }: PublishJobStatusProps) {
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const fetchJobStatus = async () => {
      try {
        const response = await fetch(`/api/publish?jobId=${jobId}`, {
          method: 'PUT',
        });
        const data = await response.json();

        if (data.success) {
          setJob(data.data);
          setError(null);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError('获取任务状态失败');
      } finally {
        setLoading(false);
      }
    };

    // 立即获取一次
    fetchJobStatus();

    // 如果任务还在进行中，定期轮询
    const interval = setInterval(() => {
      if (job?.status === 'pending') {
        fetchJobStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, job?.status]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <ArrowPathIcon className="h-5 w-5 text-yellow-500 animate-spin" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return '发布成功';
      case 'failed':
        return '发布失败';
      case 'pending':
        return '发布中...';
      default:
        return '未知状态';
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}分${seconds % 60}秒`;
    }
    return `${seconds}秒`;
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <ArrowPathIcon className="h-6 w-6 animate-spin mr-2" />
            <span>加载任务状态...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">获取任务状态失败</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button variant="outline" onClick={onClose}>
              关闭
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!job) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">任务不存在</h3>
            <Button variant="outline" onClick={onClose}>
              关闭
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            {getStatusIcon(job.status)}
            <span className="ml-2">发布任务状态</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基本信息 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">任务ID</label>
            <p className="text-sm text-gray-900 font-mono">{job.id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">状态</label>
            <p className="text-sm text-gray-900">{getStatusText(job.status)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">平台</label>
            <p className="text-sm text-gray-900">{job.platform}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">耗时</label>
            <p className="text-sm text-gray-900">
              {job.duration ? formatDuration(job.duration) : '计算中...'}
            </p>
          </div>
        </div>

        {/* 文章信息 */}
        <div>
          <label className="text-sm font-medium text-gray-500">文章</label>
          <p className="text-sm text-gray-900">{job.articleTitle}</p>
        </div>

        {/* 时间信息 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">开始时间</label>
            <p className="text-sm text-gray-900">
              {new Date(job.startTime).toLocaleString('zh-CN')}
            </p>
          </div>
          {job.endTime && (
            <div>
              <label className="text-sm font-medium text-gray-500">结束时间</label>
              <p className="text-sm text-gray-900">
                {new Date(job.endTime).toLocaleString('zh-CN')}
              </p>
            </div>
          )}
        </div>

        {/* 错误信息 */}
        {job.error && (
          <div>
            <label className="text-sm font-medium text-red-500">错误信息</label>
            <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{job.error}</p>
            </div>
          </div>
        )}

        {/* 输出日志 */}
        {job.output && (
          <div>
            <label className="text-sm font-medium text-gray-500">执行日志</label>
            <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md max-h-40 overflow-y-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">{job.output}</pre>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          {job.status === 'success' && (
            <Button
              variant="outline"
              size="sm"
              icon={<EyeIcon />}
              onClick={() => window.open('https://nssa.io', '_blank')}
            >
              查看结果
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
