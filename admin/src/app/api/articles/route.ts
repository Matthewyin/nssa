import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { realStatsManager } from '@/lib/real-stats';

// 内容目录路径
const CONTENT_DIR = path.join(process.cwd(), '..', 'content');

/**
 * 获取文章列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // 获取所有文章
    const articles = await getAllArticles();
    
    // 过滤文章
    let filteredArticles = articles;
    
    if (category && category !== 'all') {
      filteredArticles = filteredArticles.filter(article => 
        article.category === category
      );
    }
    
    if (status && status !== 'all') {
      filteredArticles = filteredArticles.filter(article => 
        article.status === status
      );
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredArticles = filteredArticles.filter(article =>
        article.title.toLowerCase().includes(searchLower) ||
        article.description.toLowerCase().includes(searchLower) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // 排序（按日期倒序）
    filteredArticles.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // 分页
    const total = filteredArticles.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedArticles = filteredArticles.slice(startIndex, endIndex);
    
    return NextResponse.json({
      success: true,
      data: paginatedArticles,
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
    console.error('获取文章列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取文章列表失败' },
      { status: 500 }
    );
  }
}

/**
 * 创建新文章
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, category, description, content, tags = [], wechat = {} } = body;
    
    if (!title || !category || !description) {
      return NextResponse.json(
        { success: false, error: '缺少必需字段' },
        { status: 400 }
      );
    }
    
    // 生成文件名
    const slug = generateSlug(title);
    const date = new Date().toISOString().split('T')[0];
    const filename = `${date}-${slug}.md`;
    
    // 确定分类目录
    const categoryDir = path.join(CONTENT_DIR, category);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
    
    const filePath = path.join(categoryDir, filename);
    
    // 检查文件是否已存在
    if (fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: '文件已存在' },
        { status: 409 }
      );
    }
    
    // 创建Front Matter
    const frontMatter = {
      title,
      description,
      date: new Date().toISOString(),
      tags,
      categories: [category],
      publish: {
        website: true,
        wechat_a: false,
        wechat_b: false,
      },
      wechat: {
        title: wechat.title || title,
        summary: wechat.summary || description,
        author: wechat.author || 'NSSA团队',
        ...wechat,
      },
    };
    
    // 生成Markdown内容
    const markdownContent = matter.stringify(content || '', frontMatter);
    
    // 写入文件
    fs.writeFileSync(filePath, markdownContent, 'utf8');
    
    // 返回创建的文章信息
    const article = await parseArticleFile(filePath, category);
    
    return NextResponse.json({
      success: true,
      data: article,
      message: '文章创建成功',
    });
  } catch (error) {
    console.error('创建文章失败:', error);
    return NextResponse.json(
      { success: false, error: '创建文章失败' },
      { status: 500 }
    );
  }
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
        if (article) { // 只添加有效的文章
          articles.push(article);
        }
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
  let content = fs.readFileSync(filePath, 'utf8');

  // 清理文件内容：移除开头的空行
  content = content.replace(/^\s*\n+/, '');

  // 修复可能的frontmatter格式问题
  content = fixFrontMatterFormat(content);

  const { data: frontMatter, content: markdownContent } = matter(content);
  
  // 计算阅读时间
  const wordCount = markdownContent.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200); // 假设每分钟200字
  
  // 获取文件统计信息
  const stats = fs.statSync(filePath);
  
  // 确定文章状态
  let status = 'draft';
  if (frontMatter.publish?.website) {
    status = 'published';
  } else if (frontMatter.publish?.schedule) {
    status = 'scheduled';
  }

  // 改进title提取逻辑
  let title = frontMatter.title;
  if (!title || title.trim() === '' || title === 'Untitled') {
    // 尝试从markdown内容的第一个标题提取
    const titleMatch = markdownContent.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      title = titleMatch[1];
    } else {
      // 尝试从文件名提取title
      const filename = path.basename(filePath, '.md');
      title = filename
        .replace(/^\d{4}-\d{2}-\d{2}-/, '') // 移除日期前缀
        .replace(/[-_]/g, ' ') // 替换连字符和下划线为空格
        .replace(/\b\w/g, l => l.toUpperCase()); // 首字母大写

      // 如果文件名也无法提取有意义的标题，跳过这篇文章
      if (!title || title.trim() === '' || title.length < 3) {
        console.warn(`跳过无效文章: ${filePath} - 无法提取有效标题`);
        return null; // 返回null，在调用处过滤掉
      }
    }
  }

  return {
    id: path.basename(filePath, '.md'),
    title: title.trim(),
    description: frontMatter.description || '',
    content: markdownContent,
    category,
    status,
    tags: frontMatter.tags || [],
    date: frontMatter.date || stats.birthtime.toISOString(),
    updatedAt: stats.mtime.toISOString(),
    readingTime: `约${readingTime}分钟`,
    wordCount,
    filePath: path.relative(path.join(CONTENT_DIR, '..'), filePath),
    publish: frontMatter.publish || {
      website: false,
      wechat_a: false,
      wechat_b: false,
    },
    wechat: frontMatter.wechat || {},
    // 使用真实统计数据
    stats: realStatsManager.getArticleStats(path.basename(filePath, '.md')),
  };
}

/**
 * 生成基于文章内容的一致统计数据
 */
function generateConsistentStats(filePath: string, frontMatter: any, content: string) {
  // 使用文件路径和标题作为种子，确保数据一致性
  const seed = hashString(filePath + (frontMatter.title || ''));

  // 基于文章质量因子计算基础数据
  const qualityFactor = calculateQualityFactor(frontMatter, content);

  // 基于种子生成一致的随机数
  const baseViews = seededRandom(seed, 0) * 3000 + 500; // 500-3500
  const baseLikes = seededRandom(seed, 1) * 150 + 20;   // 20-170
  const baseShares = seededRandom(seed, 2) * 30 + 5;    // 5-35

  // 应用质量因子
  return {
    views: Math.floor(baseViews * qualityFactor),
    likes: Math.floor(baseLikes * qualityFactor),
    shares: Math.floor(baseShares * qualityFactor),
  };
}

/**
 * 计算文章质量因子
 */
function calculateQualityFactor(frontMatter: any, content: string): number {
  let factor = 1.0;

  // 基于标题质量
  if (frontMatter.title && frontMatter.title.length > 10) factor += 0.2;

  // 基于描述质量
  if (frontMatter.description && frontMatter.description.length > 50) factor += 0.2;

  // 基于标签数量
  if (frontMatter.tags && frontMatter.tags.length > 2) factor += 0.1;

  // 基于内容长度
  const wordCount = content.split(/\s+/).length;
  if (wordCount > 1000) factor += 0.3;
  else if (wordCount > 500) factor += 0.2;

  // 基于发布状态
  if (frontMatter.publish?.website) factor += 0.2;

  return Math.min(factor, 2.0); // 最大2倍
}

/**
 * 字符串哈希函数
 */
function hashString(str: string): number {
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

/**
 * 修复frontmatter格式问题
 */
function fixFrontMatterFormat(content: string): string {
  // 检查是否有多个 --- 分隔符的问题
  const lines = content.split('\n');
  let frontMatterStart = -1;
  let frontMatterEnd = -1;
  let dashCount = 0;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      dashCount++;
      if (dashCount === 1) {
        frontMatterStart = i;
      } else if (dashCount === 2) {
        frontMatterEnd = i;
        break;
      } else if (dashCount > 2) {
        // 移除多余的 ---
        lines.splice(i, 1);
        i--;
        dashCount--;
      }
    }
  }

  return lines.join('\n');
}

/**
 * 生成URL友好的slug
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5-]/g, '') // 保留字母、数字、空格和中文
    .replace(/\s+/g, '-') // 空格替换为连字符
    .replace(/-+/g, '-') // 多个连字符合并为一个
    .replace(/^-+|-+$/g, ''); // 移除开头和结尾的连字符
}
