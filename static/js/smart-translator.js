/**
 * NSSA 智能翻译系统
 * 基于IP地理位置检测和用户偏好的自动翻译
 */

class SmartTranslator {
    constructor() {
        this.isEnabled = true; // 是否启用翻译功能
        this.currentLanguage = 'zh'; // 当前语言
        this.userPreference = localStorage.getItem('nssa_language_preference');
        this.translationCache = new Map(); // 翻译缓存
        this.isTranslating = false;
        
        // 配置选项
        this.config = {
            // 免费IP地理位置API
            geoApiUrl: 'https://ipapi.co/json/',
            // 备用API
            fallbackGeoApi: 'https://ipinfo.io/json',
            // 翻译API配置（这里使用免费的Google Translate）
            translateApiUrl: 'https://translate.googleapis.com/translate_a/single',
            // 中国大陆地区代码
            chinaRegions: ['CN', 'China'],
            // 翻译目标语言
            targetLanguage: 'en'
        };
    }

    /**
     * 初始化翻译系统
     */
    async init() {
        try {
            // 如果用户已有语言偏好，直接应用
            if (this.userPreference) {
                if (this.userPreference === 'en') {
                    await this.translatePage();
                }
                return;
            }

            // 检测用户地理位置
            const location = await this.detectUserLocation();
            
            // 如果在中国大陆，显示中文（默认）
            if (this.isInChina(location)) {
                this.currentLanguage = 'zh';
                return;
            }

            // 如果在海外，询问是否需要英文翻译
            this.showLanguageSuggestion();

        } catch (error) {
            console.warn('Smart translator initialization failed:', error);
            // 静默失败，不影响用户体验
        }
    }

    /**
     * 检测用户地理位置
     */
    async detectUserLocation() {
        try {
            // 首先尝试主要API
            const response = await fetch(this.config.geoApiUrl, {
                timeout: 3000
            });
            
            if (response.ok) {
                return await response.json();
            }
            
            // 如果失败，尝试备用API
            const fallbackResponse = await fetch(this.config.fallbackGeoApi, {
                timeout: 3000
            });
            
            if (fallbackResponse.ok) {
                return await fallbackResponse.json();
            }
            
            throw new Error('All geo APIs failed');
            
        } catch (error) {
            console.warn('Geo detection failed:', error);
            // 返回默认值，假设在海外
            return { country: 'US', country_name: 'United States' };
        }
    }

    /**
     * 判断是否在中国大陆
     */
    isInChina(location) {
        if (!location) return false;
        
        const country = location.country || location.country_code;
        const countryName = location.country_name;
        
        return this.config.chinaRegions.some(region => 
            country === region || countryName === region
        );
    }

    /**
     * 显示语言建议横幅
     */
    showLanguageSuggestion() {
        // 创建语言建议横幅
        const banner = document.createElement('div');
        banner.id = 'language-suggestion-banner';
        banner.className = 'fixed top-0 left-0 right-0 z-50 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 p-3';
        banner.innerHTML = `
            <div class="max-w-6xl mx-auto flex items-center justify-between">
                <div class="flex items-center">
                    <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
                    </svg>
                    <span class="text-sm text-blue-800 dark:text-blue-200">
                        We detected you're visiting from outside China. Would you like to translate this page to English?
                    </span>
                </div>
                <div class="flex gap-2">
                    <button id="accept-translation" class="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                        Yes, Translate
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

        // 插入到页面顶部
        document.body.insertBefore(banner, document.body.firstChild);

        // 绑定事件
        document.getElementById('accept-translation').addEventListener('click', () => {
            this.acceptTranslation();
            this.removeBanner();
        });

        document.getElementById('keep-chinese').addEventListener('click', () => {
            this.saveLanguagePreference('zh');
            this.removeBanner();
        });

        document.getElementById('dismiss-banner').addEventListener('click', () => {
            this.removeBanner();
        });

        // 5秒后自动隐藏
        setTimeout(() => {
            this.removeBanner();
        }, 8000);
    }

    /**
     * 接受翻译
     */
    async acceptTranslation() {
        this.saveLanguagePreference('en');
        await this.translatePage();
    }

    /**
     * 保存用户语言偏好
     */
    saveLanguagePreference(language) {
        localStorage.setItem('nssa_language_preference', language);
        this.userPreference = language;
        this.currentLanguage = language;
    }

    /**
     * 移除语言建议横幅
     */
    removeBanner() {
        const banner = document.getElementById('language-suggestion-banner');
        if (banner) {
            banner.remove();
        }
    }

    /**
     * 翻译整个页面
     */
    async translatePage() {
        if (this.isTranslating) return;

        this.isTranslating = true;
        this.showTranslationProgress();

        try {
            // 获取所有需要翻译的文本元素
            const elements = this.getTranslatableElements();

            // 批量翻译
            await this.translateElements(elements);

            // 更新页面语言标识
            document.documentElement.lang = 'en';
            this.currentLanguage = 'en';
            this.saveLanguagePreference('en');

        } catch (error) {
            console.error('Translation failed:', error);
            this.showTranslationError();
        } finally {
            this.isTranslating = false;
            this.hideTranslationProgress();
        }
    }

    /**
     * 获取可翻译的元素
     */
    getTranslatableElements() {
        const selectors = [
            'h1, h2, h3, h4, h5, h6',
            'p',
            'span:not([class*="icon"]):not([class*="svg"])',
            'a',
            'button',
            '[data-translate]'
        ];

        const elements = [];
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                // 跳过已翻译的元素和特殊元素
                if (el.hasAttribute('data-translated') || 
                    el.closest('script') || 
                    el.closest('style') ||
                    el.closest('code') ||
                    this.isElementEmpty(el)) {
                    return;
                }
                
                elements.push(el);
            });
        });

        return elements;
    }

    /**
     * 检查元素是否为空或只包含空白字符
     */
    isElementEmpty(element) {
        const text = element.textContent.trim();
        return !text || text.length < 2 || /^[\s\n\r]*$/.test(text);
    }

    /**
     * 批量翻译元素
     */
    async translateElements(elements) {
        const batchSize = 10; // 每批处理10个元素
        
        for (let i = 0; i < elements.length; i += batchSize) {
            const batch = elements.slice(i, i + batchSize);
            await this.translateBatch(batch);
            
            // 添加小延迟避免API限制
            await this.delay(100);
        }
    }

    /**
     * 翻译一批元素
     */
    async translateBatch(elements) {
        const promises = elements.map(element => this.translateElement(element));
        await Promise.allSettled(promises);
    }

    /**
     * 翻译单个元素
     */
    async translateElement(element) {
        try {
            const originalText = element.textContent.trim();
            
            // 检查缓存
            if (this.translationCache.has(originalText)) {
                const translatedText = this.translationCache.get(originalText);
                this.updateElementText(element, translatedText);
                return;
            }

            // 调用翻译API
            const translatedText = await this.callTranslationAPI(originalText);
            
            if (translatedText && translatedText !== originalText) {
                // 缓存翻译结果
                this.translationCache.set(originalText, translatedText);
                
                // 更新元素文本
                this.updateElementText(element, translatedText);
            }
            
        } catch (error) {
            console.warn('Failed to translate element:', error);
        }
    }

    /**
     * 调用翻译API
     */
    async callTranslationAPI(text) {
        try {
            // 这里使用Google Translate的免费接口
            // 注意：这个接口有使用限制，生产环境建议使用官方API
            const url = `${this.config.translateApiUrl}?client=gtx&sl=zh&tl=${this.config.targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data && data[0] && data[0][0] && data[0][0][0]) {
                return data[0][0][0];
            }
            
            return null;
            
        } catch (error) {
            console.warn('Translation API call failed:', error);
            return null;
        }
    }

    /**
     * 更新元素文本
     */
    updateElementText(element, translatedText) {
        element.textContent = translatedText;
        element.setAttribute('data-translated', 'true');
        element.setAttribute('data-original-text', element.textContent);
    }

    /**
     * 显示翻译进度
     */
    showTranslationProgress() {
        const progress = document.createElement('div');
        progress.id = 'translation-progress';
        progress.className = 'fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 border';
        progress.innerHTML = `
            <div class="flex items-center">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <span class="text-sm text-gray-700 dark:text-gray-300">Translating page...</span>
            </div>
        `;
        document.body.appendChild(progress);
    }

    /**
     * 隐藏翻译进度
     */
    hideTranslationProgress() {
        const progress = document.getElementById('translation-progress');
        if (progress) {
            progress.remove();
        }
    }

    /**
     * 显示翻译错误
     */
    showTranslationError() {
        const error = document.createElement('div');
        error.className = 'fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4';
        error.innerHTML = `
            <div class="flex items-center">
                <svg class="w-4 h-4 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-sm text-red-800">Translation failed. Please try again later.</span>
            </div>
        `;
        document.body.appendChild(error);
        
        setTimeout(() => error.remove(), 5000);
    }

    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 手动切换语言
     */
    async toggleLanguage() {
        if (this.currentLanguage === 'zh') {
            await this.translatePage();
            this.updateLanguageIndicator('EN');
        } else {
            this.revertToOriginal();
            this.updateLanguageIndicator('中');
        }
    }

    /**
     * 更新语言指示器
     */
    updateLanguageIndicator(text) {
        const indicator = document.getElementById('language-indicator');
        if (indicator) {
            indicator.textContent = text;
        }
    }

    /**
     * 恢复原始中文
     */
    revertToOriginal() {
        document.querySelectorAll('[data-translated]').forEach(element => {
            const originalText = element.getAttribute('data-original-text');
            if (originalText) {
                element.textContent = originalText;
            }
            element.removeAttribute('data-translated');
            element.removeAttribute('data-original-text');
        });
        
        this.currentLanguage = 'zh';
        this.saveLanguagePreference('zh');
        document.documentElement.lang = 'zh';
    }
}

// 创建全局实例
window.smartTranslator = new SmartTranslator();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.smartTranslator.init();
});
