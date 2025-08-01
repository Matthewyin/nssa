'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  RocketLaunchIcon,
  DocumentTextIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

export default function WeChatManagementPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testingAccount, setTestingAccount] = useState<string | null>(null);

  useEffect(() => {
    loadWeChatStatus();
  }, []);

  const loadWeChatStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wechat?action=status');
      const data = await response.json();
      
      if (data.success) {
        setAccounts(data.data.accounts);
      }
    } catch (error) {
      console.error('加载微信状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (accountId: string) => {
    try {
      setTestingAccount(accountId);
      
      const response = await fetch('/api/wechat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test',
          account: accountId,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('连接测试成功！');
        // 更新账户状态
        setAccounts(prev => prev.map(account => 
          account.id === accountId 
            ? { ...account, status: 'connected', lastTested: new Date().toISOString() }
            : account
        ));
      } else {
        alert(`连接测试失败: ${data.error}`);
      }
    } catch (error) {
      console.error('连接测试失败:', error);
      alert('连接测试失败');
    } finally {
      setTestingAccount(null);
    }
  };

  const publishToWeChat = async (accountId: string) => {
    // 这里应该打开文章选择对话框
    // 目前先用简单的确认
    if (!confirm('确定要发布到微信公众号吗？')) return;

    try {
      setLoading(true);
      
      // 模拟文章数据
      const articles = [
        {
          title: '测试文章',
          content: '这是一篇测试文章',
          description: '测试描述',
          filePath: 'test.md',
        },
      ];

      const response = await fetch('/api/wechat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'publish',
          account: accountId,
          articles,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('发布任务已启动！');
      } else {
        alert(`发布失败: ${data.error}`);
      }
    } catch (error) {
      console.error('发布失败:', error);
      alert('发布失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string, configured: boolean) => {
    if (!configured) {
      return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
    }
    
    switch (status) {
      case 'ready':
      case 'connected':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string, configured: boolean) => {
    if (!configured) return '未配置';
    
    switch (status) {
      case 'ready':
        return '就绪';
      case 'connected':
        return '已连接';
      case 'error':
        return '错误';
      default:
        return '未知';
    }
  };

  return (
    <AdminLayout>
      <div className="content-area py-6">
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">微信公众号管理</h1>
            <p className="page-subtitle">管理微信公众号集成和发布</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadWeChatStatus}
              disabled={loading}
            >
              {loading ? '刷新中...' : '刷新状态'}
            </Button>
            <Button
              variant="primary"
              icon={<CogIcon />}
              onClick={() => {
                alert('配置功能开发中...\n\n请在环境变量中设置:\n- WECHAT_A_APPID\n- WECHAT_A_SECRET\n- WECHAT_B_APPID\n- WECHAT_B_SECRET');
              }}
            >
              配置设置
            </Button>
          </div>
        </div>

        {/* 概览统计 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">总账户数</p>
                  <p className="text-xl font-semibold">{accounts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">已配置</p>
                  <p className="text-xl font-semibold">
                    {accounts.filter(a => a.configured).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <RocketLaunchIcon className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">可用发布</p>
                  <p className="text-xl font-semibold">
                    {accounts.filter(a => a.configured && a.status === 'ready').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 账户列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                    {account.name}
                  </div>
                  {getStatusIcon(account.status, account.configured)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 状态信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">状态</label>
                    <p className="text-sm text-gray-900">
                      {getStatusText(account.status, account.configured)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">配置状态</label>
                    <p className="text-sm text-gray-900">
                      {account.configured ? '已配置' : '未配置'}
                    </p>
                  </div>
                </div>

                {/* AppID信息 */}
                {account.configured && account.appId && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">AppID</label>
                    <p className="text-sm text-gray-900 font-mono">
                      {account.appId.substring(0, 8)}...
                    </p>
                  </div>
                )}

                {/* 错误信息 */}
                {account.error && (
                  <div>
                    <label className="text-sm font-medium text-red-500">错误信息</label>
                    <p className="text-sm text-red-700 bg-red-50 p-2 rounded">
                      {account.error}
                    </p>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex space-x-3 pt-4 border-t">
                  {account.configured ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection(account.id)}
                        disabled={testingAccount === account.id}
                      >
                        {testingAccount === account.id ? '测试中...' : '测试连接'}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<RocketLaunchIcon />}
                        onClick={() => publishToWeChat(account.id)}
                        disabled={loading || account.status !== 'ready'}
                      >
                        发布文章
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<DocumentTextIcon />}
                        onClick={() => {
                          alert('草稿管理功能开发中...');
                        }}
                      >
                        草稿管理
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<CogIcon />}
                      onClick={() => {
                        alert(`请配置 ${account.id.toUpperCase()}_APPID 和 ${account.id.toUpperCase()}_SECRET 环境变量`);
                      }}
                    >
                      立即配置
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 空状态 */}
        {accounts.length === 0 && !loading && (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无微信账户</h3>
                <p className="text-gray-500 mb-4">
                  请先配置微信公众号的AppID和Secret
                </p>
                <Button
                  variant="primary"
                  icon={<CogIcon />}
                  onClick={() => {
                    alert('配置功能开发中...');
                  }}
                >
                  开始配置
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
