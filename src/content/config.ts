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
    author: z.string().optional().default('Dayin'),
    image: z.string().optional(),
    weight: z.number().optional(),
    featured: z.boolean().optional().default(false),
    lang: z.enum(['zh', 'en']).optional().default('zh'),
    category: z.enum(['business', 'tech', 'psychology', 'workplace', 'history']).optional(),
    slug: z.string().optional(),
  }),
});

export const collections = {
  'posts': postsCollection,
};
