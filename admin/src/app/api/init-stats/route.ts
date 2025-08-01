import { NextRequest, NextResponse } from 'next/server';
import { realStatsManager } from '@/lib/real-stats';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = path.join(process.cwd(), 'content');

/**
 * 初始化统计数据API
 * POST /api/init-stats - 为所有现有文章初始化真实统计数据
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 开始初始化文章统计数据...');

    // 获取所有文章
    const articles = await getAllArticles();
    console.log(`📚 找到 ${articles.length} 篇文章`);

    // 过滤有效文章
    const validArticles = articles.filter(article => 
      article.title && 
      article.title.trim() !== '' && 
      article.title !== 'Untitled' && 
      article.title !== '未命名文章' &&
      article.title.length > 2
    );

    console.log(`✅ 有效文章数量: ${validArticles.length}`);
    console.log(`❌ 无效文章数量: ${articles.length - validArticles.length}`);

    // 初始化统计数据
    await realStatsManager.initializeExistingArticles(validArticles);

    // 获取初始化后的统计数据
    const globalStats = realStatsManager.getGlobalStats();

    return NextResponse.json({
      success: true,
      message: '统计数据初始化完成',
      data: {
        totalArticles: articles.length,
        validArticles: validArticles.length,
        invalidArticles: articles.length - validArticles.length,
        globalStats,
        sampleArticles: validArticles.slice(0, 5).map(article => ({
          id: article.id,
          title: article.title,
          stats: realStatsManager.getArticleStats(article.id),
        })),
      },
    });

  } catch (error) {
    console.error('初始化统计数据失败:', error);
    return NextResponse.json(
      { success: false, error: '初始化统计数据失败', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * 获取初始化状态
 * GET /api/init-stats - 检查统计数据初始化状态
 */
export async function GET(request: NextRequest) {
  try {
    const globalStats = realStatsManager.getGlobalStats();
    const allStats = realStatsManager.getAllArticleStats();
    const articles = await getAllArticles();

    const validArticles = articles.filter(article => 
      article.title && 
      article.title.trim() !== '' && 
      article.title !== 'Untitled' && 
      article.title !== '未命名文章' &&
      article.title.length > 2
    );

    const initializedCount = Object.keys(allStats).length;
    const needsInitialization = validArticles.length > initializedCount;

    return NextResponse.json({
      success: true,
      data: {
        isInitialized: !needsInitialization,
        totalArticles: articles.length,
        validArticles: validArticles.length,
        initializedArticles: initializedCount,
        needsInitialization,
        globalStats,
        invalidArticles: articles.filter(article => 
          !article.title || 
          article.title.trim() === '' || 
          article.title === 'Untitled' || 
          article.title === '未命名文章' ||
          article.title.length <= 2
        ).map(article => ({
          id: article.id,
          title: article.title || '(无标题)',
          filePath: article.filePath,
        })),
      },
    });

  } catch (error) {
    console.error('获取初始化状态失败:', error);
    return NextResponse.json(
      { success: false, error: '获取初始化状态失败' },
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
  };
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
      }
    }
  }

  return lines.join('\n');
}
