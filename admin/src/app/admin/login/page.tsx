'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { 
  EyeIcon, 
  EyeSlashIcon,
  LockClosedIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const router = useRouter();
  const { error: showError, success: showSuccess } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名';
    }

    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码长度至少6位';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess('登录成功', '正在跳转到管理后台...');
        
        // 设置认证cookie
        document.cookie = `auth-token=${data.token}; path=/; max-age=86400`; // 24小时
        
        // 跳转到管理后台
        setTimeout(() => {
          router.push('/admin');
        }, 1000);
      } else {
        showError('登录失败', data.error || '用户名或密码错误');
      }
    } catch (error) {
      console.error('登录错误:', error);
      showError('登录失败', '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setFormData({
      username: 'admin',
      password: 'admin123',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <LockClosedIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">NSSA 管理后台</h1>
          <p className="text-gray-600">请登录以访问管理功能</p>
        </div>

        {/* 登录表单 */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center">登录</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 用户名输入 */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  用户名
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="请输入用户名"
                    className={`pl-10 ${errors.username ? 'border-red-500' : ''}`}
                    disabled={loading}
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                )}
              </div>

              {/* 密码输入 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  密码
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="请输入密码"
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* 登录按钮 */}
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loading}
                loading={loading}
              >
                {loading ? '登录中...' : '登录'}
              </Button>

              {/* 演示账号 */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                  disabled={loading}
                >
                  使用演示账号
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 帮助信息 */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <h3 className="text-sm font-medium text-gray-900 mb-2">演示账号信息</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>用户名:</strong> admin</p>
              <p><strong>密码:</strong> admin123</p>
              <p className="text-xs text-gray-500 mt-2">
                * 这是演示环境，请勿在生产环境中使用默认密码
              </p>
            </div>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>&copy; 2024 NSSA. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
