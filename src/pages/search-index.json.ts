import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getPostCategory, getPostUrl } from '../utils/site';

export const GET: APIRoute = async () => {
  const posts = await getCollection('posts', ({ data }) => !data.draft);

  const searchData = posts.map((post) => ({
    slug: post.slug,
    url: getPostUrl(post),
    title: post.data.title,
    description: post.data.description || '',
    tags: post.data.tags || [],
    category: getPostCategory(post),
    content: post.body.slice(0, 500),
    date: post.data.date.toISOString(),
    lang: post.data.lang || 'zh',
    author: post.data.author && post.data.author !== 'NSSA Team' ? post.data.author : 'Dayin',
  }));

  return new Response(JSON.stringify(searchData), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
