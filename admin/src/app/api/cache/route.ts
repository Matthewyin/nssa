import { NextRequest, NextResponse } from 'next/server';
import { cacheManager } from '@/lib/cache';

/**
 * 缓存管理API
 */

/**
 * 获取缓存统计信息
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    switch (action) {
      case 'stats':
        return NextResponse.json({
          success: true,
          data: cacheManager.getStats(),
        });
      
      default:
        return NextResponse.json({
          success: true,
          data: {
            stats: cacheManager.getStats(),
            actions: ['stats', 'cleanup', 'clear'],
          },
        });
    }
  } catch (error) {
    console.error('获取缓存信息失败:', error);
    return NextResponse.json(
      { success: false, error: '获取缓存信息失败' },
      { status: 500 }
    );
  }
}

/**
 * 缓存操作
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, key, pattern } = body;
    
    switch (action) {
      case 'cleanup':
        const cleaned = cacheManager.cleanup();
        return NextResponse.json({
          success: true,
          data: { cleaned },
          message: `清理了 ${cleaned} 个过期缓存项`,
        });
      
      case 'clear':
        cacheManager.clear();
        return NextResponse.json({
          success: true,
          message: '所有缓存已清空',
        });
      
      case 'delete':
        if (!key) {
          return NextResponse.json(
            { success: false, error: '缺少key参数' },
            { status: 400 }
          );
        }
        const deleted = cacheManager.delete(key);
        return NextResponse.json({
          success: true,
          data: { deleted },
          message: deleted ? '缓存项已删除' : '缓存项不存在',
        });
      
      case 'deleteBatch':
        if (!pattern) {
          return NextResponse.json(
            { success: false, error: '缺少pattern参数' },
            { status: 400 }
          );
        }
        const batchDeleted = cacheManager.deleteBatch(pattern);
        return NextResponse.json({
          success: true,
          data: { deleted: batchDeleted },
          message: `删除了 ${batchDeleted} 个匹配的缓存项`,
        });
      
      case 'warmup':
        // 预热常用缓存
        const warmupKeys = [
          {
            key: 'articles:all',
            fetcher: async () => {
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/articles`);
              return response.json();
            },
            ttl: 10 * 60 * 1000, // 10分钟
          },
          {
            key: 'analytics:overview',
            fetcher: async () => {
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/analytics?type=overview`);
              return response.json();
            },
            ttl: 5 * 60 * 1000, // 5分钟
          },
        ];
        
        const warmupResults = await cacheManager.warmup(warmupKeys);
        const successCount = warmupResults.filter(r => r.success).length;
        
        return NextResponse.json({
          success: true,
          data: { 
            total: warmupResults.length,
            success: successCount,
            failed: warmupResults.length - successCount,
            results: warmupResults,
          },
          message: `预热完成：${successCount}/${warmupResults.length} 成功`,
        });
      
      default:
        return NextResponse.json(
          { success: false, error: '不支持的操作' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('缓存操作失败:', error);
    return NextResponse.json(
      { success: false, error: '缓存操作失败' },
      { status: 500 }
    );
  }
}
