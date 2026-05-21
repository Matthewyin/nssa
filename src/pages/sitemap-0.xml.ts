import type { APIRoute } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import { CATEGORY_KEYS, getPostUrl } from '../utils/site';

function formatLastMod(date: Date | string): string {
  return new Date(date).toISOString().split('T')[0];
}

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = (site?.toString() || 'https://nssa.io').replace(/\/$/, '');

  let posts: CollectionEntry<'posts'>[] = [];
  try {
    posts = await getCollection('posts', ({ data }) => !data.draft);
  } catch (error) {
    console.log('No posts found, generating basic sitemap');
  }

  const latestPostDate = posts
    .map(post => post.data.lastmod || post.data.date)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || new Date();

  const staticPages = [
    '',
    'about/',
    'search/',
    ...CATEGORY_KEYS.map(category => `${category}/`),
  ].map(url => ({
    url,
    lastmod: formatLastMod(latestPostDate),
  }));

  const postUrls = posts.map(post => ({
    url: getPostUrl(post).replace(/^\//, ''),
    lastmod: formatLastMod(post.data.lastmod || post.data.date),
  }));

  const allUrls = [...staticPages, ...postUrls];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(item => `  <url>
    <loc>${siteUrl}/${item.url}</loc>
    <lastmod>${item.lastmod}</lastmod>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};
