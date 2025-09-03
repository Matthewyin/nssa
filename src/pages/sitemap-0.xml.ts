import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.toString() || 'https://nssa.io';
  
  // 获取所有文章
  let posts = [];
  try {
    posts = await getCollection('posts');
  } catch (error) {
    // 如果没有文章，继续生成基础页面的sitemap
    console.log('No posts found, generating basic sitemap');
  }

  // 基础页面
  const staticPages = [
    '',
    'about/',
    'business/',
    'tech/',
    'psychology/',
    'workplace/',
    'history/',
    'search/',
    'en/',
    'en/about/',
    'en/business/',
    'en/tech/',
    'en/psychology/',
    'en/workplace/',
    'en/history/',
  ];

  // 生成文章页面URL
  const postUrls = posts.map(post => {
    let slug = post.slug;
    if (slug.endsWith('/index')) {
      slug = slug.replace('/index', '');
    }
    return `posts/${slug}/`;
  });

  // 合并所有URL
  const allUrls = [...staticPages, ...postUrls];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${allUrls.map(url => `  <url>
    <loc>${siteUrl}/${url}</loc>
    <xhtml:link rel="alternate" hreflang="zh-CN" href="${siteUrl}/${url}"/>
    <xhtml:link rel="alternate" hreflang="en-US" href="${siteUrl}/en/${url}"/>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};
