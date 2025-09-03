import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.toString() || 'https://nssa.io';
  
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${siteUrl}/sitemap-0.xml</loc>
  </sitemap>
</sitemapindex>`;

  return new Response(sitemapIndex, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};
