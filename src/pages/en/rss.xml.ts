import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('posts', ({ data }) => {
    return data.lang === 'en' && !data.draft;
  });

  const sortedPosts = posts.sort((a, b) => 
    new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
  );

  return rss({
    title: 'NSSA - Network-System-Security-Application',
    description: 'In-depth analysis of business insights, network technology, workplace psychology, and history. This site aims to explore the complex systems of business, technology, organizations, and human nature.',
    site: context.site!,
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description || '',
      link: `/en/posts/${post.slug}/`,
      categories: post.data.categories || [],
      author: post.data.author || 'NSSA Team',
    })),
    customData: `
      <language>en-US</language>
      <managingEditor>team@nssa.io (NSSA Team)</managingEditor>
      <webMaster>team@nssa.io (NSSA Team)</webMaster>
      <copyright>© 2025 NSSA For educational and research purposes only</copyright>
      <category>Technology</category>
      <category>Business</category>
      <category>Psychology</category>
      <category>Workplace</category>
      <category>History</category>
      <ttl>60</ttl>
      <image>
        <url>https://nssa.io/logo.svg</url>
        <title>NSSA</title>
        <link>https://nssa.io/en</link>
        <width>144</width>
        <height>144</height>
      </image>
    `,
  });
}
