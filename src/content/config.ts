import { defineCollection, z } from 'astro:content';

const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    lastmod: z.coerce.date().optional(),
    draft: z.boolean().optional().default(false),
    tags: z.array(z.string()).optional().default([]),
    categories: z.array(z.string()).optional().default([]),
    author: z.string().optional().default('NSSA Team'),
    image: z.string().optional(),
    weight: z.number().optional(),
    featured: z.boolean().optional().default(false),
    lang: z.enum(['zh', 'en']).optional().default('zh'),
    // 国际化关联字段
    articleId: z.string().optional(), // 文章的唯一标识符
    translations: z.record(z.string()).optional(), // 其他语言版本的slug映射 {en: "slug-en", zh: "slug-zh"}
    originalLang: z.enum(['zh', 'en']).optional(), // 原始语言
    translatedFrom: z.string().optional(), // 翻译来源文章的slug
    translationStatus: z.enum(['original', 'translated', 'needs_update']).optional().default('original'), // 翻译状态
    // 新增字段：支持嵌套目录结构
    category: z.enum(['business', 'tech', 'psychology', 'workplace', 'history']).optional(), // 专题分类
    slug: z.string().optional(), // 自定义slug，用于URL路径
  }),
});

export const collections = {
  'posts': postsCollection,
};
