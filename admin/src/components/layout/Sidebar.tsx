'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  HomeIcon,
  DocumentTextIcon,
  PhotoIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  UserGroupIcon,
  CogIcon,
  FolderIcon,
  ChatBubbleLeftRightIcon,
  ComputerDesktopIcon,
  BugAntIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  {
    name: '仪表板',
    href: '/admin',
    icon: HomeIcon,
    current: false,
  },
  {
    name: '内容管理',
    icon: FolderIcon,
    children: [
      {
        name: '技术专题',
        href: '/admin/tech',
        icon: DocumentTextIcon,
      },
      {
        name: '历史专题',
        href: '/admin/history',
        icon: DocumentTextIcon,
      },
      {
        name: '心理专题',
        href: '/admin/psychology',
        icon: DocumentTextIcon,
      },
      {
        name: '职场专题',
        href: '/admin/workplace',
        icon: DocumentTextIcon,
      },
    ],
  },
  {
    name: '媒体管理',
    href: '/admin/media',
    icon: PhotoIcon,
  },
  {
    name: '发布管理',
    href: '/admin/publish',
    icon: RocketLaunchIcon,
  },
  {
    name: '微信管理',
    href: '/admin/wechat',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: '数据统计',
    href: '/admin/analytics',
    icon: ChartBarIcon,
  },
  {
    name: '用户管理',
    href: '/admin/users',
    icon: UserGroupIcon,
  },
  {
    name: '系统状态',
    href: '/admin/system',
    icon: ComputerDesktopIcon,
  },
  {
    name: '错误管理',
    href: '/admin/errors',
    icon: BugAntIcon,
  },
  {
    name: 'API测试',
    href: '/admin/test',
    icon: BeakerIcon,
  },
  {
    name: '系统设置',
    href: '/admin/settings',
    icon: CogIcon,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: any, level = 0) => {
    if (item.children) {
      return (
        <div key={item.name} className="space-y-1">
          <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-700">
            <item.icon className="mr-3 h-5 w-5 text-gray-400" />
            {item.name}
          </div>
          <div className="ml-6 space-y-1">
            {item.children.map((child: any) => renderNavItem(child, level + 1))}
          </div>
        </div>
      );
    }

    const active = isActive(item.href);

    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
          active
            ? 'bg-apple-blue text-white'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
          level > 0 && 'ml-6'
        )}
      >
        <item.icon
          className={cn(
            'mr-3 h-5 w-5 flex-shrink-0',
            active ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
          )}
        />
        {item.name}
      </Link>
    );
  };

  return (
    <div className={cn('flex flex-col w-64 bg-white border-r border-gray-200', className)}>
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-apple-blue rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">N</span>
          </div>
          <span className="ml-3 text-lg font-semibold text-gray-900">
            NSSA Admin
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => renderNavItem(item))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-sm font-medium">A</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">管理员</p>
            <p className="text-xs text-gray-500">admin@nssa.io</p>
          </div>
        </div>
      </div>
    </div>
  );
}
