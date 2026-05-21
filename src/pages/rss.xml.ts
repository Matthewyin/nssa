import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { SITE_DESCRIPTION, getPostCategory, getPostUrl } from '../utils/site';

export async function GET(context: APIContext) {
  const posts = await getCollection('posts', ({ data }) => !data.draft);

  const sortedPosts = posts.sort((a, b) =>
    new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
  );

  return rss({
    title: 'NSSA - Network-System-Security-Application',
    description: SITE_DESCRIPTION,
    site: context.site!,
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description || '',
      link: getPostUrl(post),
      categories: [getPostCategory(post), ...(post.data.tags || [])],
      author: post.data.author && post.data.author !== 'NSSA Team' ? post.data.author : 'Dayin',
    })),
    customData: `
      <language>en-US</language>
      <managingEditor>team@nssa.io (Dayin)</managingEditor>
      <webMaster>team@nssa.io (Dayin)</webMaster>
      <copyright>© 2025 NSSA For educational and research purposes only</copyright>
      <category>Technology</category>
      <category>Business</category>
      <category>Psychology</category>
      <category>Workplace</category>
      <category>History</category>
      <ttl>60</ttl>
      <image>
        <url>https://nssa.io/nssa-logo-light.svg</url>
        <title>NSSA</title>
        <link>https://nssa.io</link>
        <width>144</width>
        <height>144</height>
      </image>
    `,
  });
}
