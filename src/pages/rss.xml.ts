import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('posts', ({ data }) => {
    return data.lang === 'zh' && !data.draft;
  });

  const sortedPosts = posts.sort((a, b) => 
    new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
  );

  return rss({
    title: 'NSSA - Network-System-Security-Application',
    description: '深度解析商业洞察、网络技术、职场心理与历史。本站旨在探索商业、科技、组织与人性的复杂系统',
    site: context.site!,
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description || '',
      link: `/posts/${post.slug}/`,
      categories: post.data.categories || [],
      author: post.data.author || 'NSSA Team',
    })),
    customData: `
      <language>zh-CN</language>
      <managingEditor>team@nssa.io (NSSA Team)</managingEditor>
      <webMaster>team@nssa.io (NSSA Team)</webMaster>
      <copyright>© 2025 NSSA 仅用于学习和研究目的</copyright>
      <category>Technology</category>
      <category>Business</category>
      <category>Psychology</category>
      <category>Workplace</category>
      <category>History</category>
      <ttl>60</ttl>
      <image>
        <url>https://nssa.io/logo.svg</url>
        <title>NSSA</title>
        <link>https://nssa.io</link>
        <width>144</width>
        <height>144</height>
      </image>
    `,
  });
}
