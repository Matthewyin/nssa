import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { realStatsManager } from '@/lib/real-stats';

// 统计数据缓存（生产环境应使用Redis）
interface CachedStats {
  data: any;
  timestamp: number;
  expiresAt: number;
}

const statsCache = new Map<string, CachedStats>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

/**
 * 生成字符串的哈希码
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash);
}

/**
 * 基于种子的伪随机数生成器
 */
function seededRandom(seed: number, offset: number = 0): number {
  const x = Math.sin(seed + offset) * 10000;
  return x - Math.floor(x);
}

const CONTENT_DIR = path.join(process.cwd(), '..', 'content');

/**
 * 获取统计数据
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const dateRange = searchParams.get('dateRange') || '30d';

    // 创建缓存键
    const cacheKey = `${type}-${dateRange}`;

    // 检查缓存
    const cached = statsCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
        cacheTime: new Date(cached.timestamp).toISOString(),
      });
    }

    let data;
    switch (type) {
      case 'overview':
        data = await getOverviewStats();
        break;

      case 'articles':
        data = await getArticleStats();
        break;

      case 'categories':
        data = await getCategoryStats();
        break;

      case 'trends':
        data = await getTrendStats(dateRange);
        break;

      default:
        return NextResponse.json(
          { success: false, error: '不支持的统计类型' },
          { status: 400 }
        );
    }

    // 缓存数据
    const now = Date.now();
    statsCache.set(cacheKey, {
      data,
      timestamp: now,
      expiresAt: now + CACHE_DURATION,
    });

    return NextResponse.json({
      success: true,
      data,
      cached: false,
      cacheTime: new Date(now).toISOString(),
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json(
      { success: false, error: '获取统计数据失败' },
      { status: 500 }
    );
  }
}

/**
 * 获取概览统计
 */
async function getOverviewStats() {
  const articles = await getAllArticles();
  
  // 计算基础统计
  const totalArticles = articles.length;
  const publishedArticles = articles.filter(a => a.status === 'published').length;
  const draftArticles = articles.filter(a => a.status === 'draft').length;
  
  // 使用真实统计数据
  const globalStats = realStatsManager.getGlobalStats();
  const totalViews = globalStats.totalViews;
  const totalLikes = globalStats.totalLikes;
  const totalShares = globalStats.totalShares;
  
  // 计算变化率（基于日期的固定种子，确保一致性）
  const today = new Date().toDateString(); // 使用日期作为种子
  const seed = hashCode(today); // 生成固定种子

  const viewsChange = seededRandom(seed, 0) * 20 - 5; // -5% 到 +15%
  const likesChange = seededRandom(seed, 1) * 15 - 3; // -3% 到 +12%
  const sharesChange = seededRandom(seed, 2) * 25 - 8; // -8% 到 +17%
  const articlesChange = seededRandom(seed, 3) * 10; // 0% 到 +10%
  
  return {
    totalViews,
    totalLikes,
    totalShares,
    totalArticles,
    publishedArticles,
    draftArticles,
    viewsChange: Number(viewsChange.toFixed(1)),
    likesChange: Number(likesChange.toFixed(1)),
    sharesChange: Number(sharesChange.toFixed(1)),
    articlesChange: Number(articlesChange.toFixed(1)),
  };
}

/**
 * 获取文章统计
 */
async function getArticleStats() {
  const articles = await getAllArticles();

  // 过滤掉无效标题的文章
  const validArticles = articles.filter(article =>
    article.title &&
    article.title.trim() !== '' &&
    article.title !== 'Untitled' &&
    article.title !== '未命名文章' &&
    article.title.length > 2
  );

  // 按阅读量排序，取前10
  const topArticles = validArticles
    .sort((a, b) => b.stats.views - a.stats.views)
    .slice(0, 10)
    .map(article => ({
      id: article.id,
      title: article.title,
      category: article.category,
      views: article.stats.views,
      likes: article.stats.likes,
      shares: article.stats.shares,
      publishedAt: article.date,
    }));

  return {
    topArticles,
    totalArticles: validArticles.length,
    averageViews: validArticles.length > 0 ? Math.round(validArticles.reduce((sum, a) => sum + a.stats.views, 0) / validArticles.length) : 0,
    averageLikes: validArticles.length > 0 ? Math.round(validArticles.reduce((sum, a) => sum + a.stats.likes, 0) / validArticles.length) : 0,
  };
}

/**
 * 获取分类统计
 */
async function getCategoryStats() {
  const articles = await getAllArticles();
  const categories = ['tech', 'history', 'psychology', 'workplace'];
  const categoryNames = {
    tech: '技术专题',
    history: '历史专题',
    psychology: '心理专题',
    workplace: '职场专题',
  };
  
  const categoryStats = categories.map(category => {
    const categoryArticles = articles.filter(a => a.category === category);
    const totalViews = categoryArticles.reduce((sum, a) => sum + a.stats.views, 0);
    const totalArticles = categoryArticles.length;
    
    return {
      category: categoryNames[category as keyof typeof categoryNames],
      articles: totalArticles,
      views: totalViews,
      percentage: totalArticles > 0 ? Number(((totalViews / articles.reduce((sum, a) => sum + a.stats.views, 0)) * 100).toFixed(1)) : 0,
    };
  });
  
  return categoryStats;
}

/**
 * 获取趋势统计
 */
async function getTrendStats(dateRange: string) {
  // 模拟月度趋势数据
  const months = [];
  const now = new Date();
  
  // 根据日期范围生成数据点
  let dataPoints = 6;
  if (dateRange === '7d') dataPoints = 7;
  else if (dateRange === '30d') dataPoints = 30;
  else if (dateRange === '90d') dataPoints = 12;
  else if (dateRange === '1y') dataPoints = 12;
  
  for (let i = dataPoints - 1; i >= 0; i--) {
    const date = new Date(now);
    
    if (dateRange === '7d' || dateRange === '30d') {
      // 按天
      date.setDate(date.getDate() - i);
      months.push({
        period: date.toISOString().split('T')[0],
        articles: Math.floor(Math.random() * 3) + 1,
        views: Math.floor(Math.random() * 2000) + 500,
        likes: Math.floor(Math.random() * 100) + 20,
        shares: Math.floor(Math.random() * 30) + 5,
      });
    } else {
      // 按月
      date.setMonth(date.getMonth() - i);
      months.push({
        period: date.toISOString().slice(0, 7), // YYYY-MM
        articles: Math.floor(Math.random() * 5) + 2,
        views: Math.floor(Math.random() * 8000) + 2000,
        likes: Math.floor(Math.random() * 300) + 100,
        shares: Math.floor(Math.random() * 80) + 20,
      });
    }
  }
  
  return {
    trends: months,
    dateRange,
    dataPoints,
  };
}

/**
 * 获取所有文章
 */
async function getAllArticles() {
  const articles: any[] = [];
  const categories = ['tech', 'history', 'psychology', 'workplace'];
  
  for (const category of categories) {
    const categoryDir = path.join(CONTENT_DIR, category);
    
    if (!fs.existsSync(categoryDir)) {
      continue;
    }
    
    const files = fs.readdirSync(categoryDir)
      .filter(file => file.endsWith('.md') && file !== '_index.md');
    
    for (const file of files) {
      const filePath = path.join(categoryDir, file);
      try {
        const article = await parseArticleFile(filePath, category);
        articles.push(article);
      } catch (error) {
        console.error(`解析文章失败: ${filePath}`, error);
      }
    }
  }
  
  return articles;
}

/**
 * 解析文章文件
 */
async function parseArticleFile(filePath: string, category: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { data: frontMatter, content: markdownContent } = matter(content);
  
  // 获取文件统计信息
  const stats = fs.statSync(filePath);
  
  // 确定文章状态
  let status = 'draft';
  if (frontMatter.publish?.website) {
    status = 'published';
  } else if (frontMatter.publish?.schedule) {
    status = 'scheduled';
  }
  
  // 生成模拟统计数据（基于文章特征）
  const titleLength = frontMatter.title?.length || 0;
  const contentLength = markdownContent.length;
  const baseViews = Math.floor((titleLength + contentLength / 10) * Math.random() * 10);
  
  return {
    id: path.basename(filePath, '.md'),
    title: frontMatter.title || 'Untitled',
    description: frontMatter.description || '',
    category,
    status,
    tags: frontMatter.tags || [],
    date: frontMatter.date || stats.birthtime.toISOString(),
    updatedAt: stats.mtime.toISOString(),
    filePath: path.relative(path.join(CONTENT_DIR, '..'), filePath),
    // 模拟统计数据
    stats: {
      views: Math.max(baseViews, 100) + Math.floor(Math.random() * 1000),
      likes: Math.floor(Math.random() * 200) + 10,
      shares: Math.floor(Math.random() * 50) + 2,
    },
  };
}
