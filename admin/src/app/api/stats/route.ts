import { NextRequest, NextResponse } from 'next/server';
import { realStatsManager } from '@/lib/real-stats';

/**
 * 统计数据收集API
 * POST /api/stats - 记录用户行为（浏览、点赞、分享）
 * GET /api/stats - 获取统计数据
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, articleId } = body;

    if (!action || !articleId) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数' },
        { status: 400 }
      );
    }

    let stats;
    switch (action) {
      case 'view':
        stats = realStatsManager.recordView(articleId);
        break;
      case 'like':
        stats = realStatsManager.recordLike(articleId);
        break;
      case 'share':
        stats = realStatsManager.recordShare(articleId);
        break;
      default:
        return NextResponse.json(
          { success: false, error: '不支持的操作类型' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: stats,
      message: `${action} 记录成功`,
    });

  } catch (error) {
    console.error('记录统计数据失败:', error);
    return NextResponse.json(
      { success: false, error: '记录统计数据失败' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const articleId = searchParams.get('articleId');

    switch (type) {
      case 'overview':
        // 获取全局统计概览
        const globalStats = realStatsManager.getGlobalStats();
        return NextResponse.json({
          success: true,
          data: globalStats,
        });

      case 'article':
        // 获取特定文章统计
        if (!articleId) {
          return NextResponse.json(
            { success: false, error: '缺少文章ID' },
            { status: 400 }
          );
        }
        const articleStats = realStatsManager.getArticleStats(articleId);
        return NextResponse.json({
          success: true,
          data: articleStats,
        });

      case 'popular':
        // 获取热门文章
        const limit = parseInt(searchParams.get('limit') || '10');
        const popularArticles = realStatsManager.getPopularArticles(limit);
        return NextResponse.json({
          success: true,
          data: popularArticles,
        });

      case 'liked':
        // 获取最受欢迎文章
        const likeLimit = parseInt(searchParams.get('limit') || '10');
        const likedArticles = realStatsManager.getMostLikedArticles(likeLimit);
        return NextResponse.json({
          success: true,
          data: likedArticles,
        });

      case 'shared':
        // 获取最多分享文章
        const shareLimit = parseInt(searchParams.get('limit') || '10');
        const sharedArticles = realStatsManager.getMostSharedArticles(shareLimit);
        return NextResponse.json({
          success: true,
          data: sharedArticles,
        });

      case 'all':
        // 获取所有文章统计
        const allStats = realStatsManager.getAllArticleStats();
        return NextResponse.json({
          success: true,
          data: allStats,
        });

      default:
        return NextResponse.json(
          { success: false, error: '不支持的查询类型' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json(
      { success: false, error: '获取统计数据失败' },
      { status: 500 }
    );
  }
}

/**
 * 初始化统计数据
 * PUT /api/stats - 初始化现有文章的统计数据
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { articles } = body;

    if (!articles || !Array.isArray(articles)) {
      return NextResponse.json(
        { success: false, error: '无效的文章数据' },
        { status: 400 }
      );
    }

    await realStatsManager.initializeExistingArticles(articles);

    return NextResponse.json({
      success: true,
      message: `已初始化 ${articles.length} 篇文章的统计数据`,
      data: realStatsManager.getGlobalStats(),
    });

  } catch (error) {
    console.error('初始化统计数据失败:', error);
    return NextResponse.json(
      { success: false, error: '初始化统计数据失败' },
      { status: 500 }
    );
  }
}
