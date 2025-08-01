'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // 根据路径生成面包屑
  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];

    if (segments.length === 1 && segments[0] === 'admin') {
      return [{ name: '仪表板', href: '/admin' }];
    }

    // 映射路径到中文名称
    const pathMap: Record<string, string> = {
      admin: '管理后台',
      tech: '技术专题',
      history: '历史专题',
      psychology: '心理专题',
      workplace: '职场专题',
      media: '媒体管理',
      publish: '发布管理',
      analytics: '数据统计',
      users: '用户管理',
      settings: '系统设置',
    };

    let currentPath = '';
    for (const segment of segments) {
      currentPath += `/${segment}`;
      breadcrumbs.push({
        name: pathMap[segment] || segment,
        href: currentPath,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* 左侧：菜单按钮和面包屑 */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            icon={<Bars3Icon />}
            className="lg:hidden"
          />
          
          {/* 面包屑导航 */}
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              {breadcrumbs.map((breadcrumb, index) => (
                <li key={breadcrumb.href} className="flex items-center">
                  {index > 0 && (
                    <span className="mx-2 text-gray-400">/</span>
                  )}
                  <Link
                    href={breadcrumb.href}
                    className={`text-sm font-medium ${
                      index === breadcrumbs.length - 1
                        ? 'text-gray-900'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {breadcrumb.name}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* 右侧：搜索、通知、用户菜单 */}
        <div className="flex items-center space-x-4">
          {/* 搜索框 */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="搜索文章..."
                className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent"
              />
            </div>
          </div>

          {/* 通知按钮 */}
          <Button
            variant="ghost"
            size="sm"
            icon={<BellIcon />}
            className="relative"
          >
            {/* 通知小红点 */}
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* 用户菜单 */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUserMenu(!showUserMenu)}
              icon={<UserCircleIcon />}
            />
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">管理员</p>
                  <p className="text-xs text-gray-500">admin@nssa.io</p>
                </div>
                
                <Link
                  href="/admin/settings"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  <CogIcon className="mr-3 h-4 w-4" />
                  系统设置
                </Link>
                
                <button
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setShowUserMenu(false);
                    // TODO: 实现退出登录逻辑
                  }}
                >
                  <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
