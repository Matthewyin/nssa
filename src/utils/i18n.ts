// 国际化配置和工具函数

export type Language = 'zh' | 'en';

export const defaultLang: Language = 'zh';

// 语言配置
export const languages = {
  zh: {
    code: 'zh',
    name: '中文',
    dir: 'ltr',
  },
  en: {
    code: 'en', 
    name: 'English',
    dir: 'ltr',
  },
};

// 翻译字典
export const translations = {
  zh: {
    // 导航
    'nav.business': '业务专题',
    'nav.tech': '技术专题',
    'nav.psychology': '心理专题',
    'nav.workplace': '职场专题',
    'nav.history': '历史专题',
    'nav.about': '关于',
    'nav.search.placeholder': '搜索...',
    
    // 首页
    'home.title': 'NSSA - Network-System-Security-Application',
    'home.subtitle': 'Network System Security Application',
    'home.description': '深度解析商业洞察、网络技术、职场心理与历史。本站旨在探索商业、科技、组织与人性的复杂系统',
    'home.intro': '通过现代化的网页技术，将复杂的商业、技术、历史、心理和职场转化为生动有趣的数字化体验',
    
    // 分类描述
    'category.business.title': '业务专题',
    'category.business.description': '深度商业分析与市场洞察，探索商业模式创新与企业战略',
    'category.tech.title': '技术专题',
    'category.tech.description': '探索前沿技术、分析技术趋势、研究技术对社会的影响',
    'category.psychology.title': '心理专题',
    'category.psychology.description': '心理学研究与行为分析，探索人类心理现象和行为模式',
    'category.workplace.title': '职场专题',
    'category.workplace.description': '职场动力学与组织行为研究，掌握职场生存智慧',
    'category.history.title': '历史专题',
    'category.history.description': '深度历史研究与分析，探索历史发展的内在规律',
    
    // 搜索
    'search.no_results': '没有找到匹配的结果',
    'search.try_different': '尝试使用不同的关键词',
    'search.results_count': '找到 {count} 个结果',
    'search.sorted_by': '按相关度排序',
    'search.view_all': '查看全部 {count} 个结果',
    
    // 文章
    'article.read_more': '阅读更多',
    'article.share': '分享文章',
    'article.related': '相关文章',
    'article.tags': '标签',
    'article.categories': '分类',
    'article.author': '作者',
    'article.published': '发布时间',
    'article.updated': '更新时间',
    'article.available_in_other_languages': '本文还有其他语言版本',
    'article.view_in_other_language': '查看其他语言版本',
    'article.translation_status.original': '原创',
    'article.translation_status.translated': '翻译',
    'article.translation_status.needs_update': '需要更新',
    'article.translated_from': '翻译自',
    
    // 分享
    'share.wechat': '微信',
    'share.weibo': '微博',
    'share.copy_link': '复制链接',
    'share.link_copied': '链接已复制到剪贴板',
    
    // 页脚
    'footer.about_title': '关于NSSA',
    'footer.about_description': '探索商业、科技、组织与人性的复杂系统，通过现代化的网页技术提供深度分析和洞察。',
    'footer.quick_links': '快速导航',
    'footer.resources': '资源链接',
    'footer.friendly_links': '友情链接',
    'footer.ecosystem_title': 'NSSA 生态系统',
    'footer.ecosystem_description': '从灵感迸发到技能修炼，从工具使用到娱乐放松，打造完整的学习成长闭环',
    'footer.inspirista': '灵感墙',
    'footer.inspirista_desc': '激发创意思维，收集灵感火花',
    'footer.sf': '练功房',
    'footer.sf_desc': '制定学习计划，系统提升技能',
    'footer.tools': '工具箱',
    'footer.tools_desc': '实用工具集合，提升工作效率',
    'footer.games': '游戏室',
    'footer.games_desc': '寓教于乐，在游戏中放松身心',
    'footer.sitemap': '站点地图',
    'footer.rss': 'RSS订阅',
    'footer.language': '语言',
    'footer.copyright': '© 2025 NSSA 仅用于学习和研究目的。',
    'footer.powered_by': 'Powered by Astro | Domain: nssa.io',
    
    // 通用
    'common.home': '首页',
    'common.loading': '加载中...',
    'common.error': '出错了',
    'common.retry': '重试',
    'common.close': '关闭',
    'common.open': '打开',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.confirm': '确认',
    'common.back': '返回',
    'common.next': '下一页',
    'common.prev': '上一页',
    
    // 主题
    'theme.light': '浅色主题',
    'theme.dark': '深色主题',
    'theme.system': '跟随系统',
    'theme.toggle': '切换主题',
  },
  en: {
    // Navigation
    'nav.business': 'Business',
    'nav.tech': 'Technology',
    'nav.psychology': 'Psychology',
    'nav.workplace': 'Workplace',
    'nav.history': 'History',
    'nav.about': 'About',
    'nav.search.placeholder': 'Search...',
    
    // Homepage
    'home.title': 'NSSA - Network-System-Security-Application',
    'home.subtitle': 'Network System Security Application',
    'home.description': 'In-depth analysis of business insights, network technology, workplace psychology, and history. This site aims to explore the complex systems of business, technology, organizations, and human nature.',
    'home.intro': 'Through modern web technologies, we transform complex business, technical, historical, psychological, and workplace concepts into engaging digital experiences.',
    
    // Category descriptions
    'category.business.title': 'Business Topics',
    'category.business.description': 'In-depth business analysis and market insights, exploring business model innovation and corporate strategy',
    'category.tech.title': 'Technology Topics',
    'category.tech.description': 'Exploring cutting-edge technology, analyzing tech trends, and studying technology\'s impact on society',
    'category.psychology.title': 'Psychology Topics',
    'category.psychology.description': 'Psychological research and behavioral analysis, exploring human psychological phenomena and behavioral patterns',
    'category.workplace.title': 'Workplace Topics',
    'category.workplace.description': 'Workplace dynamics and organizational behavior research, mastering workplace survival wisdom',
    'category.history.title': 'History Topics',
    'category.history.description': 'In-depth historical research and analysis, exploring the inherent laws of historical development',
    
    // Search
    'search.no_results': 'No matching results found',
    'search.try_different': 'Try using different keywords',
    'search.results_count': 'Found {count} results',
    'search.sorted_by': 'Sorted by relevance',
    'search.view_all': 'View all {count} results',
    
    // Articles
    'article.read_more': 'Read More',
    'article.share': 'Share Article',
    'article.related': 'Related Articles',
    'article.tags': 'Tags',
    'article.categories': 'Categories',
    'article.author': 'Author',
    'article.published': 'Published',
    'article.updated': 'Updated',
    'article.available_in_other_languages': 'This article is available in other languages',
    'article.view_in_other_language': 'View in other languages',
    'article.translation_status.original': 'Original',
    'article.translation_status.translated': 'Translated',
    'article.translation_status.needs_update': 'Needs Update',
    'article.translated_from': 'Translated from',
    
    // Sharing
    'share.wechat': 'WeChat',
    'share.weibo': 'Weibo',
    'share.copy_link': 'Copy Link',
    'share.link_copied': 'Link copied to clipboard',
    
    // Footer
    'footer.about_title': 'About NSSA',
    'footer.about_description': 'Exploring the complex systems of business, technology, organizations, and human nature through modern web technologies.',
    'footer.quick_links': 'Quick Links',
    'footer.resources': 'Resources',
    'footer.friendly_links': 'Friendly Links',
    'footer.ecosystem_title': 'NSSA Ecosystem',
    'footer.ecosystem_description': 'From inspiration to skill development, from tools to entertainment, creating a complete learning and growth loop',
    'footer.inspirista': 'Inspiration Wall',
    'footer.inspirista_desc': 'Spark creative thinking and collect inspiration',
    'footer.sf': 'Training Room',
    'footer.sf_desc': 'Create learning plans and systematically improve skills',
    'footer.tools': 'Toolbox',
    'footer.tools_desc': 'Practical tool collection to improve work efficiency',
    'footer.games': 'Game Room',
    'footer.games_desc': 'Learn through play and relax in games',
    'footer.sitemap': 'Sitemap',
    'footer.rss': 'RSS Feed',
    'footer.language': 'Language',
    'footer.copyright': '© 2025 NSSA For educational and research purposes only.',
    
    // Common
    'common.home': 'Home',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.retry': 'Retry',
    'common.close': 'Close',
    'common.open': 'Open',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.prev': 'Previous',
    
    // Theme
    'theme.light': 'Light Theme',
    'theme.dark': 'Dark Theme',
    'theme.system': 'System Theme',
    'theme.toggle': 'Toggle Theme',
  },
};

// 获取翻译文本
export function t(key: string, lang: Language = defaultLang, params?: Record<string, string | number>): string {
  const translation = translations[lang]?.[key] || translations[defaultLang]?.[key] || key;
  
  if (params) {
    return Object.entries(params).reduce((text, [param, value]) => {
      return text.replace(new RegExp(`{${param}}`, 'g'), String(value));
    }, translation);
  }
  
  return translation;
}

// 获取当前语言
export function getLangFromUrl(url: URL): Language {
  const [, lang] = url.pathname.split('/');
  if (lang && lang in languages) {
    return lang as Language;
  }
  return defaultLang;
}

// 获取本地化路径
export function getLocalizedPath(path: string, lang: Language): string {
  if (lang === defaultLang) {
    return path;
  }
  return `/${lang}${path}`;
}

// 获取替代语言路径
export function getAlternateLanguagePaths(path: string, currentLang: Language) {
  const paths: Record<Language, string> = {} as Record<Language, string>;
  
  Object.keys(languages).forEach((lang) => {
    const langKey = lang as Language;
    if (langKey !== currentLang) {
      if (langKey === defaultLang) {
        // 移除语言前缀
        paths[langKey] = path.replace(`/${currentLang}`, '') || '/';
      } else {
        // 替换或添加语言前缀
        if (currentLang === defaultLang) {
          paths[langKey] = `/${langKey}${path}`;
        } else {
          paths[langKey] = path.replace(`/${currentLang}`, `/${langKey}`);
        }
      }
    }
  });
  
  return paths;
}
