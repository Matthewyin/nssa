import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { CATEGORY_INFO, CATEGORY_KEYS, SITE_DESCRIPTION, type CategoryKey, getPostCategory, getPostUrl } from '../utils/site';

export async function GET(context: APIContext) {
  const allPosts = await getCollection('posts', ({ data }) => !data.draft);
  const sortedPosts = allPosts.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());

  function formatPostList(category: CategoryKey) {
    const posts = sortedPosts.filter(post => getPostCategory(post) === category);
    if (posts.length === 0) return '';

    let output = `\n### ${CATEGORY_INFO[category].title}\n\n`;
    for (const post of posts) {
      const url = new URL(getPostUrl(post), context.site).toString();
      const desc = post.data.description ? ` — ${post.data.description}` : '';
      const lang = post.data.lang === 'en' ? 'English' : 'Chinese';
      output += `- [${post.data.title}](${url}) (${lang})${desc}\n`;
    }
    return output;
  }

  const content = `# NSSA - Network System Security Application

> ${SITE_DESCRIPTION}

## Site Information

- Name: NSSA
- Domain: https://nssa.io
- Site language: English
- Content languages: English and Chinese
- Author: Dayin / 大尹 (X: @bawan269, About: https://nssa.io/about/)
- Topics: networks, systems, security, AI, business, psychology, workplace, history

## Articles
${CATEGORY_KEYS.map(formatPostList).join('')}

## Key Pages

- Home: https://nssa.io/
- About: https://nssa.io/about/
- RSS: https://nssa.io/rss.xml
- Sitemap: https://nssa.io/sitemap-index.xml
`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}
