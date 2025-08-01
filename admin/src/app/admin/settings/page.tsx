'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  CogIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  PhotoIcon,
  BellIcon,
  CloudIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState({
    // 基本设置
    siteName: 'NSSA',
    siteUrl: 'https://nssa.io',
    adminEmail: 'tccio2023@gmail.com',
    timezone: 'Asia/Shanghai',
    language: 'zh-CN',
    
    // 发布设置
    autoPublish: false,
    defaultPlatforms: ['website'],
    scheduleEnabled: true,
    
    // 媒体设置
    maxFileSize: 10, // MB
    imageQuality: 85,
    generateThumbnails: true,
    allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    
    // 安全设置
    sessionTimeout: 24, // 小时
    maxLoginAttempts: 5,
    requireTwoFactor: false,
    
    // 通知设置
    emailNotifications: true,
    publishNotifications: true,
    errorNotifications: true,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // TODO: 实现保存设置功能
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleInputChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <AdminLayout>
      <div className="content-area py-6">
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">系统设置</h1>
            <p className="page-subtitle">配置系统参数和功能选项</p>
          </div>
          <div className="flex items-center space-x-3">
            {saved && (
              <div className="flex items-center text-green-600">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <span className="text-sm">设置已保存</span>
              </div>
            )}
            <Button
              variant="primary"
              onClick={handleSave}
            >
              保存设置
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 基本设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GlobeAltIcon className="h-5 w-5 mr-2" />
                基本设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="网站名称"
                value={settings.siteName}
                onChange={(e) => handleInputChange('siteName', e.target.value)}
                helperText="显示在浏览器标题栏的网站名称"
              />
              <Input
                label="网站URL"
                value={settings.siteUrl}
                onChange={(e) => handleInputChange('siteUrl', e.target.value)}
                helperText="网站的完整URL地址"
              />
              <Input
                label="管理员邮箱"
                type="email"
                value={settings.adminEmail}
                onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                helperText="接收系统通知的邮箱地址"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  时区
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className="input"
                >
                  <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
                  <option value="UTC">UTC (UTC+0)</option>
                  <option value="America/New_York">America/New_York (UTC-5)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  语言
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="input"
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="en-US">English</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* 发布设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CloudIcon className="h-5 w-5 mr-2" />
                发布设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    自动发布
                  </label>
                  <p className="text-xs text-gray-500">
                    保存文章时自动发布到配置的平台
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoPublish}
                  onChange={(e) => handleInputChange('autoPublish', e.target.checked)}
                  className="h-4 w-4 text-apple-blue focus:ring-apple-blue border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  默认发布平台
                </label>
                <div className="space-y-2">
                  {[
                    { key: 'website', label: '网站' },
                    { key: 'wechat_a', label: '微信公众号A' },
                    { key: 'wechat_b', label: '微信公众号B' },
                  ].map(platform => (
                    <div key={platform.key} className="flex items-center">
                      <input
                        type="checkbox"
                        id={platform.key}
                        checked={settings.defaultPlatforms.includes(platform.key)}
                        onChange={(e) => {
                          const platforms = e.target.checked
                            ? [...settings.defaultPlatforms, platform.key]
                            : settings.defaultPlatforms.filter(p => p !== platform.key);
                          handleInputChange('defaultPlatforms', platforms);
                        }}
                        className="h-4 w-4 text-apple-blue focus:ring-apple-blue border-gray-300 rounded"
                      />
                      <label htmlFor={platform.key} className="ml-2 text-sm text-gray-700">
                        {platform.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    启用定时发布
                  </label>
                  <p className="text-xs text-gray-500">
                    允许设置文章的定时发布
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.scheduleEnabled}
                  onChange={(e) => handleInputChange('scheduleEnabled', e.target.checked)}
                  className="h-4 w-4 text-apple-blue focus:ring-apple-blue border-gray-300 rounded"
                />
              </div>
            </CardContent>
          </Card>

          {/* 媒体设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PhotoIcon className="h-5 w-5 mr-2" />
                媒体设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="最大文件大小 (MB)"
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => handleInputChange('maxFileSize', parseInt(e.target.value))}
                helperText="单个文件的最大上传大小"
              />
              <Input
                label="图片质量 (%)"
                type="number"
                min="1"
                max="100"
                value={settings.imageQuality}
                onChange={(e) => handleInputChange('imageQuality', parseInt(e.target.value))}
                helperText="图片压缩质量，100为无损"
              />
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    生成缩略图
                  </label>
                  <p className="text-xs text-gray-500">
                    自动为上传的图片生成缩略图
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.generateThumbnails}
                  onChange={(e) => handleInputChange('generateThumbnails', e.target.checked)}
                  className="h-4 w-4 text-apple-blue focus:ring-apple-blue border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  允许的文件类型
                </label>
                <Input
                  value={settings.allowedTypes.join(', ')}
                  onChange={(e) => handleInputChange('allowedTypes', e.target.value.split(', '))}
                  helperText="用逗号分隔的文件扩展名"
                />
              </div>
            </CardContent>
          </Card>

          {/* 安全设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2" />
                安全设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="会话超时 (小时)"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                helperText="用户会话的有效时长"
              />
              <Input
                label="最大登录尝试次数"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => handleInputChange('maxLoginAttempts', parseInt(e.target.value))}
                helperText="账户锁定前的最大失败登录次数"
              />
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    启用双因素认证
                  </label>
                  <p className="text-xs text-gray-500">
                    要求用户使用双因素认证登录
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requireTwoFactor}
                  onChange={(e) => handleInputChange('requireTwoFactor', e.target.checked)}
                  className="h-4 w-4 text-apple-blue focus:ring-apple-blue border-gray-300 rounded"
                />
              </div>
            </CardContent>
          </Card>

          {/* 通知设置 */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BellIcon className="h-5 w-5 mr-2" />
                通知设置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      邮件通知
                    </label>
                    <p className="text-xs text-gray-500">
                      接收系统邮件通知
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                    className="h-4 w-4 text-apple-blue focus:ring-apple-blue border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      发布通知
                    </label>
                    <p className="text-xs text-gray-500">
                      文章发布成功时通知
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.publishNotifications}
                    onChange={(e) => handleInputChange('publishNotifications', e.target.checked)}
                    className="h-4 w-4 text-apple-blue focus:ring-apple-blue border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      错误通知
                    </label>
                    <p className="text-xs text-gray-500">
                      系统错误时发送通知
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.errorNotifications}
                    onChange={(e) => handleInputChange('errorNotifications', e.target.checked)}
                    className="h-4 w-4 text-apple-blue focus:ring-apple-blue border-gray-300 rounded"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
