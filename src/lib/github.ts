import { Octokit } from '@octokit/rest';
import matter from 'gray-matter';

// GitHub配置
const GITHUB_OWNER = 'Matthewyin';
const GITHUB_REPO = 'nssa';
const CONTENT_PATH = 'src/content/posts';

// 创建GitHub客户端
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, // 从环境变量读取GitHub token
});

// 文章接口定义
export interface Post {
  slug: string;
  title: string;
  description: string;
  pubDate: Date;
  category: string;
  tags: string[];
  content: string;
  author?: string;
  image?: string;
}

// 缓存机制
const cache = new Map<string, { data: any; timestamp: number; etag?: string }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

/**
 * 获取所有文章
 */
export async function getAllPosts(): Promise<Post[]> {
  const cacheKey = 'all-posts';
  const cached = cache.get(cacheKey);

  // 检查缓存
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // 获取posts目录下的所有子目录
    const { data: directories } = await octokit.rest.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: CONTENT_PATH,
    });

    if (!Array.isArray(directories)) {
      return [];
    }

    // 获取所有分类目录
    const categoryDirs = directories.filter(item => item.type === 'dir');

    // 获取每个分类目录下的文章
    const posts: Post[] = [];
    for (const categoryDir of categoryDirs) {
      try {
        const categoryPosts = await getPostsFromCategory(categoryDir.name);
        posts.push(...categoryPosts);
      } catch (error) {
        console.error(`Error processing category ${categoryDir.name}:`, error);
      }
    }

    // 按发布日期排序
    posts.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

    // 更新缓存
    cache.set(cacheKey, {
      data: posts,
      timestamp: Date.now(),
    });

    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);

    // 如果有缓存数据，返回缓存
    if (cached) {
      return cached.data;
    }

    return [];
  }
}

/**
 * 从指定分类目录获取文章
 */
async function getPostsFromCategory(category: string): Promise<Post[]> {
  try {
    const { data: files } = await octokit.rest.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: `${CONTENT_PATH}/${category}`,
    });

    if (!Array.isArray(files)) {
      return [];
    }

    // 过滤markdown文件
    const markdownFiles = files.filter(
      file => file.type === 'file' && file.name.endsWith('.md')
    );

    // 获取每个文件的内容
    const posts: Post[] = [];
    for (const file of markdownFiles) {
      try {
        const post = await getPostByPath(`${category}/${file.name}`, category);
        if (post) {
          posts.push(post);
        }
      } catch (error) {
        console.error(`Error processing file ${category}/${file.name}:`, error);
      }
    }

    return posts;
  } catch (error) {
    console.error(`Error fetching posts from category ${category}:`, error);
    return [];
  }
}

/**
 * 根据路径获取文章
 */
async function getPostByPath(filePath: string, category: string): Promise<Post | null> {
  const cacheKey = `post-${filePath}`;
  const cached = cache.get(cacheKey);

  try {
    // 获取文件内容
    const { data: fileData } = await octokit.rest.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: `${CONTENT_PATH}/${filePath}`,
      headers: cached?.etag ? { 'If-None-Match': cached.etag } : {},
    });

    // 如果文件没有变化，返回缓存
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    if ('content' in fileData && fileData.content) {
      // 解码base64内容
      const content = Buffer.from(fileData.content, 'base64').toString('utf-8');

      // 解析frontmatter
      const { data: frontmatter, content: markdownContent } = matter(content);

      // 生成slug（包含分类路径）
      const filename = filePath.split('/').pop() || '';
      const slug = `${category}/${filename.replace('.md', '')}`;

      const post: Post = {
        slug,
        title: frontmatter.title || filename.replace('.md', ''),
        description: frontmatter.description || '',
        pubDate: new Date(frontmatter.pubDate || frontmatter.date || Date.now()),
        category: frontmatter.category || category,
        tags: frontmatter.tags || [],
        content: markdownContent,
        author: frontmatter.author,
        image: frontmatter.image,
      };

      // 更新缓存
      cache.set(cacheKey, {
        data: post,
        timestamp: Date.now(),
        etag: fileData.sha,
      });

      return post;
    }
  } catch (error) {
    console.error(`Error fetching post ${filePath}:`, error);

    // 如果有缓存数据，返回缓存
    if (cached) {
      return cached.data;
    }
  }

  return null;
}

/**
 * 根据slug获取文章
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  // slug格式：category/filename
  const parts = slug.split('/');
  if (parts.length !== 2) {
    return null;
  }

  const [category, filename] = parts;
  return await getPostByPath(`${category}/${filename}.md`, category);
}

/**
 * 根据分类获取文章
 */
export async function getPostsByCategory(category: string): Promise<Post[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter(post => post.category === category);
}

/**
 * 搜索文章
 */
export async function searchPosts(query: string): Promise<Post[]> {
  const allPosts = await getAllPosts();
  const searchTerm = query.toLowerCase();
  
  return allPosts.filter(post => 
    post.title.toLowerCase().includes(searchTerm) ||
    post.description.toLowerCase().includes(searchTerm) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
    post.content.toLowerCase().includes(searchTerm)
  );
}

/**
 * 获取所有分类
 */
export async function getAllCategories(): Promise<string[]> {
  const allPosts = await getAllPosts();
  const categories = new Set(allPosts.map(post => post.category));
  return Array.from(categories).sort();
}

/**
 * 获取所有标签
 */
export async function getAllTags(): Promise<string[]> {
  const allPosts = await getAllPosts();
  const tags = new Set(allPosts.flatMap(post => post.tags));
  return Array.from(tags).sort();
}
