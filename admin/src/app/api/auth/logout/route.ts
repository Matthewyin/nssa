import { NextRequest, NextResponse } from 'next/server';

/**
 * 用户登出
 */
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: '登出成功',
    });
    
    // 清除认证cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // 立即过期
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('登出失败:', error);
    return NextResponse.json(
      { success: false, error: '登出失败' },
      { status: 500 }
    );
  }
}
