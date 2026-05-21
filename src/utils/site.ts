export type ContentLanguage = 'zh' | 'en';
export type CategoryKey = 'business' | 'tech' | 'psychology' | 'workplace' | 'history';

export const SITE_TITLE = 'NSSA - Network / Systems / Security / AI';
export const SITE_DESCRIPTION =
  'Deconstructing complex systems with first principles, from technical architecture to business logic, from organizational behavior to cognitive models.';
export const SITE_URL = 'https://nssa.io';

export const CATEGORY_KEYS: CategoryKey[] = ['business', 'tech', 'psychology', 'workplace', 'history'];

export const CATEGORY_INFO: Record<CategoryKey, { title: string; description: string; icon: string }> = {
  business: {
    title: 'Business',
    description: 'Business analysis, market logic, strategy, and operating models.',
    icon: '📊',
  },
  tech: {
    title: 'Technology',
    description: 'AI, systems, networks, security, and engineering practice.',
    icon: '🔬',
  },
  psychology: {
    title: 'Psychology',
    description: 'Behavioral patterns, cognitive models, and inner operating systems.',
    icon: '🧠',
  },
  workplace: {
    title: 'Workplace',
    description: 'Organizational behavior, collaboration, incentives, and career dynamics.',
    icon: '💼',
  },
  history: {
    title: 'History',
    description: 'Historical patterns, power structures, and long-term systems thinking.',
    icon: '📚',
  },
};

const CATEGORY_ALIASES: Record<string, CategoryKey> = {
  business: 'business',
  tech: 'tech',
  technology: 'tech',
  psychology: 'psychology',
  workplace: 'workplace',
  history: 'history',
  '业务专题': 'business',
  '商业专题': 'business',
  '技术专题': 'tech',
  '科技专题': 'tech',
  '心理专题': 'psychology',
  '职场专题': 'workplace',
  '历史专题': 'history',
};

export function normalizeCategory(value?: string): CategoryKey | undefined {
  if (!value) return undefined;
  return CATEGORY_ALIASES[value.trim().toLowerCase()] || CATEGORY_ALIASES[value.trim()];
}

export function getPostCategory(post: { slug: string; data: any }): CategoryKey {
  const fromDirectory = normalizeCategory(post.slug.split('/')[0]);
  const fromField = normalizeCategory(post.data.category);
  const fromCategories = (post.data.categories || [])
    .map((category: string) => normalizeCategory(category))
    .find(Boolean);

  return fromDirectory || fromField || fromCategories || 'tech';
}

export function getPostSlug(post: { slug: string }): string {
  return post.slug.replace(/\/index$/, '');
}

export function getPostUrl(post: { slug: string; data: any }): string {
  return `/${getPostSlug(post)}/`;
}

export function getCategoryUrl(category: CategoryKey): string {
  return `/${category}/`;
}

export function formatDisplayDate(date: Date | string, lang: ContentLanguage = 'en'): string {
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function getContentLanguage(value?: string): ContentLanguage {
  return value === 'en' ? 'en' : 'zh';
}
