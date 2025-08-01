'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

// 模拟用户数据
const mockUsers = [
  {
    id: '1',
    username: 'admin',
    email: 'tccio2023@gmail.com',
    displayName: '系统管理员',
    role: 'admin',
    isActive: true,
    lastLoginAt: '2025-01-31T08:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    avatar: null,
  },
  {
    id: '2',
    username: 'editor1',
    email: 'editor1@nssa.io',
    displayName: '内容编辑',
    role: 'editor',
    isActive: true,
    lastLoginAt: '2025-01-30T16:45:00Z',
    createdAt: '2024-06-15T00:00:00Z',
    avatar: null,
  },
  {
    id: '3',
    username: 'viewer1',
    email: 'viewer1@nssa.io',
    displayName: '内容查看者',
    role: 'viewer',
    isActive: true,
    lastLoginAt: '2025-01-29T10:20:00Z',
    createdAt: '2024-09-01T00:00:00Z',
    avatar: null,
  },
  {
    id: '4',
    username: 'editor2',
    email: 'editor2@nssa.io',
    displayName: '历史编辑',
    role: 'editor',
    isActive: false,
    lastLoginAt: '2024-12-15T14:30:00Z',
    createdAt: '2024-03-20T00:00:00Z',
    avatar: null,
  },
];

export default function UserManagementPage() {
  const [users, setUsers] = useState(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // 加载用户列表
  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('加载用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: any) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        setUsers(prev => [data.data, ...prev]);
        alert('用户创建成功');
        return true;
      } else {
        alert(`创建失败: ${data.error}`);
        return false;
      }
    } catch (error) {
      console.error('创建用户失败:', error);
      alert('创建用户失败');
      return false;
    }
  };

  const updateUser = async (userId: string, userData: any) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        setUsers(prev => prev.map(user =>
          user.id === userId ? data.data : user
        ));
        alert('用户更新成功');
        return true;
      } else {
        alert(`更新失败: ${data.error}`);
        return false;
      }
    } catch (error) {
      console.error('更新用户失败:', error);
      alert('更新用户失败');
      return false;
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('确定要删除这个用户吗？此操作不可恢复。')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setUsers(prev => prev.filter(user => user.id !== userId));
        alert('用户删除成功');
      } else {
        alert(`删除失败: ${data.error}`);
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      alert('删除用户失败');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery ||
      (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.displayName && user.displayName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center badge-danger">
            <ShieldCheckIcon className="h-3 w-3 mr-1" />
            管理员
          </span>
        );
      case 'editor':
        return (
          <span className="inline-flex items-center badge-primary">
            <PencilIcon className="h-3 w-3 mr-1" />
            编辑
          </span>
        );
      case 'viewer':
        return (
          <span className="inline-flex items-center badge-secondary">
            <EyeIcon className="h-3 w-3 mr-1" />
            查看者
          </span>
        );
      default:
        return <span className="badge-secondary">{role}</span>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="badge-success">活跃</span>
    ) : (
      <span className="badge-secondary">停用</span>
    );
  };

  const toggleUserStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    await updateUser(userId, { isActive: !user.isActive });
  };

  return (
    <AdminLayout>
      <div className="content-area py-6">
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">用户管理</h1>
            <p className="page-subtitle">管理系统用户和权限</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="primary"
              icon={<PlusIcon />}
              onClick={() => {
                // TODO: 实现添加用户对话框
                const username = prompt('用户名:');
                const email = prompt('邮箱:');
                const displayName = prompt('显示名称:');
                const role = prompt('角色 (admin/editor/viewer):') || 'viewer';
                const password = prompt('密码:');

                if (username && email && displayName && password) {
                  createUser({ username, email, displayName, role, password });
                }
              }}
              disabled={loading}
            >
              添加用户
            </Button>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="搜索用户名、邮箱或显示名..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<MagnifyingGlassIcon />}
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input w-32"
              >
                <option value="all">全部角色</option>
                <option value="admin">管理员</option>
                <option value="editor">编辑</option>
                <option value="viewer">查看者</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-32"
              >
                <option value="all">全部状态</option>
                <option value="active">活跃</option>
                <option value="inactive">停用</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <UserGroupIcon className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">总用户数</p>
                  <p className="text-xl font-semibold">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <ShieldCheckIcon className="h-8 w-8 text-red-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">管理员</p>
                  <p className="text-xl font-semibold">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <PencilIcon className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">编辑人员</p>
                  <p className="text-xl font-semibold">
                    {users.filter(u => u.role === 'editor').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <UserIcon className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">活跃用户</p>
                  <p className="text-xl font-semibold">
                    {users.filter(u => u.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 用户列表 */}
        <Card>
          <CardHeader>
            <CardTitle>用户列表</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">用户</th>
                    <th className="table-header-cell">角色</th>
                    <th className="table-header-cell">状态</th>
                    <th className="table-header-cell">最后登录</th>
                    <th className="table-header-cell">创建时间</th>
                    <th className="table-header-cell">操作</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.displayName}
                                className="h-10 w-10 rounded-full"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.displayName}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <p className="text-xs text-gray-400">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="table-cell">
                        {getStatusBadge(user.isActive)}
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-500">
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString('zh-CN')
                            : '从未登录'
                          }
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<PencilIcon />}
                            onClick={() => {
                              // TODO: 实现编辑用户对话框
                              const newDisplayName = prompt('新显示名称:', user.displayName);
                              if (newDisplayName && newDisplayName !== user.displayName) {
                                updateUser(user.id, { displayName: newDisplayName });
                              }
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleUserStatus(user.id)}
                          >
                            {user.isActive ? '停用' : '启用'}
                          </Button>
                          {user.role !== 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<TrashIcon />}
                              onClick={() => deleteUser(user.id)}
                              disabled={loading}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="empty-state">
                <UserGroupIcon className="empty-state-icon" />
                <h3 className="empty-state-title">暂无用户</h3>
                <p className="empty-state-description">
                  {searchQuery ? '没有找到匹配的用户' : '还没有创建任何用户'}
                </p>
                <Button
                  variant="primary"
                  icon={<PlusIcon />}
                  className="mt-4"
                  onClick={() => {
                    const username = prompt('用户名:');
                    const email = prompt('邮箱:');
                    const displayName = prompt('显示名称:');
                    const role = prompt('角色 (admin/editor/viewer):') || 'viewer';
                    const password = prompt('密码:');

                    if (username && email && displayName && password) {
                      createUser({ username, email, displayName, role, password });
                    }
                  }}
                  disabled={loading}
                >
                  添加第一个用户
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
