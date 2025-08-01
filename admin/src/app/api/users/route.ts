import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// 用户数据文件路径
const USERS_FILE = path.join(process.cwd(), '..', '.taskmaster', 'users.json');

// 确保用户文件存在
function ensureUsersFile() {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (!fs.existsSync(USERS_FILE)) {
    const defaultUsers = [
      {
        id: '1',
        username: 'admin',
        email: 'tccio2023@gmail.com',
        displayName: '系统管理员',
        role: 'admin',
        isActive: true,
        passwordHash: bcrypt.hashSync('admin123', 10), // 默认密码
        lastLoginAt: new Date().toISOString(),
        createdAt: '2024-01-01T00:00:00Z',
        avatar: null,
        permissions: ['*'], // 管理员拥有所有权限
      },
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
  }
}

/**
 * 获取用户列表
 */
export async function GET(request: NextRequest) {
  try {
    ensureUsersFile();
    
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // 读取用户数据
    const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    let users = usersData.map((user: any) => ({
      ...user,
      passwordHash: undefined, // 不返回密码哈希
    }));
    
    // 过滤用户
    if (role && role !== 'all') {
      users = users.filter((user: any) => user.role === role);
    }
    
    if (status && status !== 'all') {
      const isActive = status === 'active';
      users = users.filter((user: any) => user.isActive === isActive);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter((user: any) =>
        user.username.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.displayName.toLowerCase().includes(searchLower)
      );
    }
    
    // 排序（按创建时间倒序）
    users.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // 分页
    const total = users.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = users.slice(startIndex, endIndex);
    
    return NextResponse.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: endIndex < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取用户列表失败' },
      { status: 500 }
    );
  }
}

/**
 * 创建新用户
 */
export async function POST(request: NextRequest) {
  try {
    ensureUsersFile();
    
    const body = await request.json();
    const { username, email, displayName, role, password, isActive = true } = body;
    
    if (!username || !email || !displayName || !role || !password) {
      return NextResponse.json(
        { success: false, error: '缺少必需字段' },
        { status: 400 }
      );
    }
    
    // 读取现有用户
    const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    
    // 检查用户名和邮箱是否已存在
    const existingUser = usersData.find((user: any) => 
      user.username === username || user.email === email
    );
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: '用户名或邮箱已存在' },
        { status: 409 }
      );
    }
    
    // 创建新用户
    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      displayName,
      role,
      isActive,
      passwordHash: bcrypt.hashSync(password, 10),
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      avatar: null,
      permissions: getRolePermissions(role),
    };
    
    // 添加到用户列表
    usersData.push(newUser);
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2));
    
    // 返回用户信息（不包含密码）
    const { passwordHash, ...userResponse } = newUser;
    
    return NextResponse.json({
      success: true,
      data: userResponse,
      message: '用户创建成功',
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    return NextResponse.json(
      { success: false, error: '创建用户失败' },
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
