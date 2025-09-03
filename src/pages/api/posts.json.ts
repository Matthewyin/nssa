import type { APIRoute } from 'astro';
import { getAllPosts, searchPosts, getPostsByCategory } from '../../lib/github';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let posts;

    if (query) {
      // 搜索文章
      posts = await searchPosts(query);
    } else if (category) {
      // 按分类获取文章
      posts = await getPostsByCategory(category);
    } else {
      // 获取所有文章
      posts = await getAllPosts();
    }

    // 分页
    const paginatedPosts = posts.slice(offset, offset + limit);

    return new Response(JSON.stringify({
      posts: paginatedPosts,
      total: posts.length,
      limit,
      offset,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5分钟缓存
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch posts',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
