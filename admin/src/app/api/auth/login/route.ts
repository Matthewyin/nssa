import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const USERS_FILE = path.join(process.cwd(), '..', '.taskmaster', 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'nssa-admin-secret-key';

/**
 * 用户登录
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;
    
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }
    
    // 检查用户文件是否存在
    if (!fs.existsSync(USERS_FILE)) {
      return NextResponse.json(
        { success: false, error: '用户系统未初始化' },
        { status: 500 }
      );
    }
    
    // 读取用户数据
    const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    
    // 查找用户（支持用户名或邮箱登录）
    const user = usersData.find((u: any) => 
      u.username === username || u.email === username
    );
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 401 }
      );
    }
    
    // 检查用户是否被禁用
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: '账户已被禁用' },
        { status: 401 }
      );
    }
    
    // 验证密码
    const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: '密码错误' },
        { status: 401 }
      );
    }
    
    // 更新最后登录时间
    user.lastLoginAt = new Date().toISOString();
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2));
    
    // 生成JWT令牌
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // 返回用户信息和令牌（不包含密码）
    const { passwordHash, ...userResponse } = user;
    
    const response = NextResponse.json({
      success: true,
      data: {
        user: userResponse,
        token,
        expiresIn: 24 * 60 * 60 * 1000, // 24小时（毫秒）
      },
      message: '登录成功',
    });
    
    // 设置HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24小时（秒）
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json(
      { success: false, error: '登录失败' },
      { status: 500 }
    );
  }
}

/**
 * 验证令牌
 */
export async function GET(request: NextRequest) {
  try {
    // 从cookie或Authorization头获取令牌
    const token = request.cookies.get('auth-token')?.value ||
                  request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: '未提供认证令牌' },
        { status: 401 }
      );
    }
    
    // 验证令牌
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // 检查用户是否仍然存在且活跃
    if (fs.existsSync(USERS_FILE)) {
      const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      const user = usersData.find((u: any) => u.id === decoded.userId);
      
      if (!user || !user.isActive) {
        return NextResponse.json(
          { success: false, error: '用户不存在或已被禁用' },
          { status: 401 }
        );
      }
      
      // 返回用户信息（不包含密码）
      const { passwordHash, ...userResponse } = user;
      
      return NextResponse.json({
        success: true,
        data: {
          user: userResponse,
          token,
        },
      });
    }
    
    return NextResponse.json(
      { success: false, error: '用户系统未初始化' },
      { status: 500 }
    );
  } catch (error) {
    console.error('令牌验证失败:', error);
    return NextResponse.json(
      { success: false, error: '令牌无效或已过期' },
      { status: 401 }
    );
  }
}
