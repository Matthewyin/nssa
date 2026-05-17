import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const allPosts = await getCollection('posts', ({ data }) => !data.draft);

  const zhPosts = allPosts
    .filter(p => p.data.lang === 'zh')
    .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());

  const enPosts = allPosts
    .filter(p => p.data.lang === 'en')
    .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());

  const categoryNames: Record<string, string> = {
    tech: '技术专题 / Tech',
    business: '业务专题 / Business',
    psychology: '心理专题 / Psychology',
    workplace: '职场专题 / Workplace',
    history: '历史专题 / History',
  };

  function formatPostList(posts: typeof allPosts, prefix: string) {
    const grouped: Record<string, typeof posts> = {};
    for (const post of posts) {
      const cat = post.data.categories?.[0] || post.slug.split('/')[0] || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(post);
    }

    let output = '';
    for (const [cat, catPosts] of Object.entries(grouped)) {
      const label = categoryNames[cat] || cat;
      output += `\n### ${label}\n\n`;
      for (const post of catPosts) {
        const url = new URL(`${prefix}${post.slug}/`, context.site).toString();
        const desc = post.data.description ? ` — ${post.data.description}` : '';
        output += `- [${post.data.title}](${url})${desc}\n`;
      }
    }
    return output;
  }

  const content = `# NSSA - Network System Security Application

> 用第一性原理拆解复杂系统——从技术架构到商业逻辑，从组织行为到认知模型

## 站点信息

- 名称：NSSA
- 域名：https://nssa.io
- 语言：中文 / English
- 作者：大尹 (X: @bawan269, About: https://nssa.io/about/)
- 主题：网络、系统、安全、AI、商业、心理、职场、历史

## 中文文章
${formatPostList(zhPosts, '/posts/')}

## English Articles
${formatPostList(enPosts, '/en/posts/')}

## 关键页面

- 首页：https://nssa.io/
- About：https://nssa.io/about/
- RSS (中文)：https://nssa.io/rss.xml
- RSS (English)：https://nssa.io/en/rss.xml
- Sitemap：https://nssa.io/sitemap-index.xml
`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}
