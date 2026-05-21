import type { APIRoute } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import { CATEGORY_KEYS, getPostUrl } from '../utils/site';

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = (site?.toString() || 'https://nssa.io').replace(/\/$/, '');

  let posts: CollectionEntry<'posts'>[] = [];
  try {
    posts = await getCollection('posts', ({ data }) => !data.draft);
  } catch (error) {
    console.log('No posts found, generating basic sitemap');
  }

  const staticPages = [
    '',
    'about/',
    'search/',
    ...CATEGORY_KEYS.map(category => `${category}/`),
  ];

  const postUrls = posts.map(post => getPostUrl(post).replace(/^\//, ''));
  const allUrls = [...staticPages, ...postUrls];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(url => `  <url>
    <loc>${siteUrl}/${url}</loc>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};
