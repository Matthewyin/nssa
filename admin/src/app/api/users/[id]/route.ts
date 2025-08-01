import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const USERS_FILE = path.join(process.cwd(), '..', '.taskmaster', 'users.json');

/**
 * 获取特定用户
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!fs.existsSync(USERS_FILE)) {
      return NextResponse.json(
        { success: false, error: '用户数据文件不存在' },
        { status: 404 }
      );
    }
    
    const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    const user = usersData.find((u: any) => u.id === id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }
    
    // 不返回密码哈希
    const { passwordHash, ...userResponse } = user;
    
    return NextResponse.json({
      success: true,
      data: userResponse,
    });
  } catch (error) {
    console.error('获取用户失败:', error);
    return NextResponse.json(
      { success: false, error: '获取用户失败' },
      { status: 500 }
    );
  }
}

/**
 * 更新用户
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    if (!fs.existsSync(USERS_FILE)) {
      return NextResponse.json(
        { success: false, error: '用户数据文件不存在' },
        { status: 404 }
      );
    }
    
    const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    const userIndex = usersData.findIndex((u: any) => u.id === id);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }
    
    const currentUser = usersData[userIndex];
    
    // 更新用户信息
    const updatedUser = {
      ...currentUser,
      ...body,
      id, // 确保ID不被修改
      updatedAt: new Date().toISOString(),
    };
    
    // 如果提供了新密码，更新密码哈希
    if (body.password) {
      updatedUser.passwordHash = bcrypt.hashSync(body.password, 10);
      delete updatedUser.password; // 删除明文密码
    }
    
    // 如果角色发生变化，更新权限
    if (body.role && body.role !== currentUser.role) {
      updatedUser.permissions = getRolePermissions(body.role);
    }
    
    // 检查用户名和邮箱唯一性（如果有变化）
    if (body.username && body.username !== currentUser.username) {
      const existingUser = usersData.find((u: any, index: number) => 
        index !== userIndex && u.username === body.username
      );
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: '用户名已存在' },
          { status: 409 }
        );
      }
    }
    
    if (body.email && body.email !== currentUser.email) {
      const existingUser = usersData.find((u: any, index: number) => 
        index !== userIndex && u.email === body.email
      );
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: '邮箱已存在' },
          { status: 409 }
        );
      }
    }
    
    // 更新用户数据
    usersData[userIndex] = updatedUser;
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2));
    
    // 返回更新后的用户信息（不包含密码）
    const { passwordHash, ...userResponse } = updatedUser;
    
    return NextResponse.json({
      success: true,
      data: userResponse,
      message: '用户更新成功',
    });
  } catch (error) {
    console.error('更新用户失败:', error);
    return NextResponse.json(
      { success: false, error: '更新用户失败' },
      { status: 500 }
    );
  }
}

/**
 * 删除用户
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!fs.existsSync(USERS_FILE)) {
      return NextResponse.json(
        { success: false, error: '用户数据文件不存在' },
        { status: 404 }
      );
    }
    
    const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    const userIndex = usersData.findIndex((u: any) => u.id === id);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }
    
    const user = usersData[userIndex];
    
    // 防止删除管理员账户
    if (user.role === 'admin') {
      return NextResponse.json(
        { success: false, error: '不能删除管理员账户' },
        { status: 403 }
      );
    }
    
    // 删除用户
    usersData.splice(userIndex, 1);
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2));
    
    return NextResponse.json({
      success: true,
      message: '用户删除成功',
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    return NextResponse.json(
      { success: false, error: '删除用户失败' },
      { status: 500 }
    );
  }
}

/**
 * 根据角色获取权限
 */
function getRolePermissions(role: string): string[] {
  switch (role) {
    case 'admin':
      return ['*']; // 所有权限
    case 'editor':
      return [
        'articles:read',
        'articles:write',
        'articles:publish',
        'media:read',
        'media:write',
        'analytics:read',
      ];
    case 'viewer':
      return [
        'articles:read',
        'media:read',
        'analytics:read',
      ];
    default:
      return [];
  }
}
