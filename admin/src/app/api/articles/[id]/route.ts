import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = path.join(process.cwd(), '..', 'content');

/**
 * 获取特定文章
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const article = await findArticleById(id);
    
    if (!article) {
      return NextResponse.json(
        { success: false, error: '文章不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: article,
    });
  } catch (error) {
    console.error('获取文章失败:', error);
    return NextResponse.json(
      { success: false, error: '获取文章失败' },
      { status: 500 }
    );
  }
}

/**
 * 更新文章
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const article = await findArticleById(id);
    if (!article) {
      return NextResponse.json(
        { success: false, error: '文章不存在' },
        { status: 404 }
      );
    }
    
    const filePath = path.join(process.cwd(), '..', article.filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const { data: frontMatter, content: markdownContent } = matter(content);
    
    // 更新Front Matter
    const updatedFrontMatter = {
      ...frontMatter,
      ...body.frontMatter,
      updatedAt: new Date().toISOString(),
    };
    
    // 更新内容
    const updatedContent = body.content !== undefined ? body.content : markdownContent;
    
    // 生成新的Markdown内容
    const newMarkdownContent = matter.stringify(updatedContent, updatedFrontMatter);
    
    // 写入文件
    fs.writeFileSync(filePath, newMarkdownContent, 'utf8');
    
    // 返回更新后的文章
    const updatedArticle = await parseArticleFile(filePath, article.category);
    
    return NextResponse.json({
      success: true,
      data: updatedArticle,
      message: '文章更新成功',
    });
  } catch (error) {
    console.error('更新文章失败:', error);
    return NextResponse.json(
      { success: false, error: '更新文章失败' },
      { status: 500 }
    );
  }
}

/**
 * 删除文章
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const article = await findArticleById(id);
    
    if (!article) {
      return NextResponse.json(
        { success: false, error: '文章不存在' },
        { status: 404 }
      );
    }
    
    const filePath = path.join(process.cwd(), '..', article.filePath);
    
    // 删除文件
    fs.unlinkSync(filePath);
    
    return NextResponse.json({
      success: true,
      message: '文章删除成功',
    });
  } catch (error) {
    console.error('删除文章失败:', error);
    return NextResponse.json(
      { success: false, error: '删除文章失败' },
      { status: 500 }
    );
  }
}

/**
 * 根据ID查找文章
 */
async function findArticleById(id: string) {
  const categories = ['tech', 'history', 'psychology', 'workplace'];
  
  for (const category of categories) {
    const categoryDir = path.join(CONTENT_DIR, category);
    
    if (!fs.existsSync(categoryDir)) {
      continue;
    }
    
    const files = fs.readdirSync(categoryDir)
      .filter(file => file.endsWith('.md') && file !== '_index.md');
    
    for (const file of files) {
      const fileId = path.basename(file, '.md');
      if (fileId === id) {
        const filePath = path.join(categoryDir, file);
        return await parseArticleFile(filePath, category);
      }
    }
  }
  
  return null;
}

/**
 * 解析文章文件
 */
async function parseArticleFile(filePath: string, category: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { data: frontMatter, content: markdownContent } = matter(content);
  
  // 计算阅读时间
  const wordCount = markdownContent.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);
  
  // 获取文件统计信息
  const stats = fs.statSync(filePath);
  
  // 确定文章状态
  let status = 'draft';
  if (frontMatter.publish?.website) {
    status = 'published';
  } else if (frontMatter.publish?.schedule) {
    status = 'scheduled';
  }
  
  return {
    id: path.basename(filePath, '.md'),
    title: frontMatter.title || 'Untitled',
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
    frontMatter,
    // 模拟统计数据
    stats: {
      views: Math.floor(Math.random() * 5000),
      likes: Math.floor(Math.random() * 200),
      shares: Math.floor(Math.random() * 50),
    },
  };
}
