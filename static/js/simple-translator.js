/**
 * NSSA 简化版智能翻译系统
 * 演示版本 - 基于IP检测和本地翻译映射
 */

class SimpleTranslator {
    constructor() {
        this.currentLanguage = localStorage.getItem('nssa_language') || 'zh';
        this.isTranslating = false;
        
        // 简化的翻译映射表
        this.translations = {
            'NSSA': 'NSSA',
            'Network System Security Application': 'Network System Security Application',
            '深度解析网络技术、职场心理与历史。本站旨在探索科技、组织与人性的复杂系统': 'In-depth analysis of network technology, workplace psychology and history. This site aims to explore the complex systems of technology, organization and human nature.',
            '通过现代化的网页技术，将复杂的技术、历史、心理和职场转化为生动有趣的数字化体验': 'Through modern web technology, transform complex technology, history, psychology and workplace into vivid and interesting digital experiences.',
            '🔬 技术专题': '🔬 Technology Topics',
            '探索前沿技术、分析技术趋势、研究技术对社会的影响': 'Explore cutting-edge technology, analyze technology trends, and study the impact of technology on society',
            '📚 历史专题': '📚 History Topics',
            '深度历史研究与分析，探索历史发展的内在规律': 'In-depth historical research and analysis, exploring the inherent laws of historical development',
            '🧠 心理专题': '🧠 Psychology Topics',
            '职场心理、人际关系、认知科学等心理学相关内容': 'Workplace psychology, interpersonal relationships, cognitive science and other psychology-related content',
            '💼 职场专题': '💼 Career Topics',
            '职场技能、职业发展、团队管理等职场相关话题': 'Workplace skills, career development, team management and other workplace-related topics',
            '最新文章': 'Latest Articles',
            '查看全部': 'View All',
            '阅读更多': 'Read More',
            '返回顶部': 'Back to Top',
            '搜索...': 'Search...',
            '切换主题': 'Toggle Theme',
            '语言切换': 'Language Switch'
        };
    }

    /**
     * 初始化翻译系统
     */
    async init() {
        try {
            // 检测用户地理位置
            const isInChina = await this.detectLocation();
            
            // 如果用户已有偏好，使用用户偏好
            if (localStorage.getItem('nssa_language')) {
                if (this.currentLanguage === 'en') {
                    this.translatePage();
                }
                this.updateLanguageIndicator();
                return;
            }

            // 如果在海外，显示翻译建议
            if (!isInChina) {
                this.showTranslationSuggestion();
            }

            this.updateLanguageIndicator();

        } catch (error) {
            console.warn('Translation system init failed:', error);
        }
    }

    /**
     * 简化的地理位置检测
     */
    async detectLocation() {
        try {
            // 使用免费的IP地理位置API
            const response = await fetch('https://ipapi.co/country_code/', {
                timeout: 3000
            });
            
            if (response.ok) {
                const countryCode = await response.text();
                return countryCode.trim() === 'CN';
            }
            
            // 如果API失败，检查浏览器语言
            const browserLang = navigator.language || navigator.userLanguage;
            return browserLang.startsWith('zh');
            
        } catch (error) {
            console.warn('Location detection failed:', error);
            // 默认假设在海外
            return false;
        }
    }

    /**
     * 显示翻译建议
     */
    showTranslationSuggestion() {
        const banner = document.createElement('div');
        banner.id = 'translation-banner';
        banner.className = 'fixed top-0 left-0 right-0 z-50 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 p-3 transform -translate-y-full transition-transform duration-300';
        banner.innerHTML = `
            <div class="max-w-6xl mx-auto flex items-center justify-between">
                <div class="flex items-center">
                    <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
                    </svg>
                    <span class="text-sm text-blue-800 dark:text-blue-200">
                        We detected you're visiting from outside China. Would you like to view this page in English?
                    </span>
                </div>
                <div class="flex gap-2">
                    <button id="accept-translation" class="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                        Yes, English
                    </button>
                    <button id="keep-chinese" class="text-xs px-3 py-1 text-blue-600 hover:text-blue-800 transition-colors">
                        Keep Chinese
                    </button>
                    <button id="dismiss-banner" class="text-xs px-3 py-1 text-gray-500 hover:text-gray-700 transition-colors">
                        ×
                    </button>
                </div>
            </div>
        `;

        document.body.insertBefore(banner, document.body.firstChild);

        // 动画显示
        setTimeout(() => {
            banner.classList.remove('-translate-y-full');
        }, 100);

        // 绑定事件
        document.getElementById('accept-translation').addEventListener('click', () => {
            this.setLanguage('en');
            this.removeBanner();
        });

        document.getElementById('keep-chinese').addEventListener('click', () => {
            this.setLanguage('zh');
            this.removeBanner();
        });

        document.getElementById('dismiss-banner').addEventListener('click', () => {
            this.removeBanner();
        });

        // 8秒后自动隐藏
        setTimeout(() => {
            this.removeBanner();
        }, 8000);
    }

    /**
     * 设置语言
     */
    setLanguage(lang) {
        this.currentLanguage = lang;
        localStorage.setItem('nssa_language', lang);
        
        if (lang === 'en') {
            this.translatePage();
        } else {
            this.revertToOriginal();
        }
        
        this.updateLanguageIndicator();
    }

    /**
     * 翻译页面
     */
    translatePage() {
        if (this.isTranslating) return;
        
        this.isTranslating = true;
        
        // 获取所有文本节点并翻译
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // 跳过脚本、样式和已翻译的内容
                    if (node.parentElement.closest('script, style, code, pre') ||
                        node.parentElement.hasAttribute('data-no-translate') ||
                        node.textContent.trim().length < 2) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        textNodes.forEach(textNode => {
            const text = textNode.textContent.trim();
            if (this.translations[text]) {
                // 保存原始文本
                if (!textNode.parentElement.hasAttribute('data-original-text')) {
                    textNode.parentElement.setAttribute('data-original-text', text);
                }
                textNode.textContent = this.translations[text];
                textNode.parentElement.setAttribute('data-translated', 'true');
            }
        });

        // 翻译属性
        this.translateAttributes();
        
        this.isTranslating = false;
        document.documentElement.lang = 'en';
    }

    /**
     * 翻译属性（如placeholder, title等）
     */
    translateAttributes() {
        // 翻译placeholder
        document.querySelectorAll('[placeholder]').forEach(el => {
            const placeholder = el.getAttribute('placeholder');
            if (this.translations[placeholder]) {
                if (!el.hasAttribute('data-original-placeholder')) {
                    el.setAttribute('data-original-placeholder', placeholder);
                }
                el.setAttribute('placeholder', this.translations[placeholder]);
            }
        });

        // 翻译title
        document.querySelectorAll('[title]').forEach(el => {
            const title = el.getAttribute('title');
            if (this.translations[title]) {
                if (!el.hasAttribute('data-original-title')) {
                    el.setAttribute('data-original-title', title);
                }
                el.setAttribute('title', this.translations[title]);
            }
        });
    }

    /**
     * 恢复原始中文
     */
    revertToOriginal() {
        // 恢复文本内容
        document.querySelectorAll('[data-translated]').forEach(el => {
            const originalText = el.getAttribute('data-original-text');
            if (originalText) {
                el.textContent = originalText;
                el.removeAttribute('data-translated');
                el.removeAttribute('data-original-text');
            }
        });

        // 恢复属性
        document.querySelectorAll('[data-original-placeholder]').forEach(el => {
            const originalPlaceholder = el.getAttribute('data-original-placeholder');
            el.setAttribute('placeholder', originalPlaceholder);
            el.removeAttribute('data-original-placeholder');
        });

        document.querySelectorAll('[data-original-title]').forEach(el => {
            const originalTitle = el.getAttribute('data-original-title');
            el.setAttribute('title', originalTitle);
            el.removeAttribute('data-original-title');
        });

        document.documentElement.lang = 'zh';
    }

    /**
     * 切换语言
     */
    toggleLanguage() {
        if (this.currentLanguage === 'zh') {
            this.setLanguage('en');
        } else {
            this.setLanguage('zh');
        }
    }

    /**
     * 更新语言指示器
     */
    updateLanguageIndicator() {
        const indicator = document.getElementById('language-indicator');
        if (indicator) {
            indicator.textContent = this.currentLanguage === 'zh' ? '中' : 'EN';
        }
    }

    /**
     * 移除横幅
     */
    removeBanner() {
        const banner = document.getElementById('translation-banner');
        if (banner) {
            banner.classList.add('-translate-y-full');
            setTimeout(() => banner.remove(), 300);
        }
    }
}

// 创建全局实例
window.simpleTranslator = new SimpleTranslator();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.simpleTranslator.init();
});

// 为了兼容性，也创建smartTranslator别名
window.smartTranslator = window.simpleTranslator;
