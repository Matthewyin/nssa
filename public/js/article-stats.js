/**
 * NSSA 文章PV统计模块
 * 提供文章页面访问次数(PV)的获取、更新和显示功能
 */

class ArticleStats {
    constructor() {
        this.baseUrl = window.location.origin;
        this.clientId = this.getOrCreateClientId();
    }

    /**
     * 获取或创建客户端唯一标识
     */
    getOrCreateClientId() {
        let clientId = localStorage.getItem('nssa_client_id');
        if (!clientId) {
            clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('nssa_client_id', clientId);
        }
        return clientId;
    }

    /**
     * 获取文章路径（用于统计标识）
     */
    getArticlePath(url = window.location.pathname) {
        // 移除开头的斜杠和结尾的斜杠
        return url.replace(/^\/+|\/+$/g, '') || 'home';
    }

    /**
     * 增加当前文章的PV数
     */
    async incrementViews(articlePath = null) {
        try {
            const path = articlePath || this.getArticlePath();
            
            const response = await fetch(`${this.baseUrl}/api/views/increment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    path: path,
                    clientId: this.clientId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to increment article views:', error);
            return null;
        }
    }

    /**
     * 获取单篇文章的PV数
     */
    async getViews(articlePath = null) {
        try {
            const path = articlePath || this.getArticlePath();
            
            const response = await fetch(`${this.baseUrl}/api/views/get?path=${encodeURIComponent(path)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.views;
        } catch (error) {
            console.error('Failed to get article views:', error);
            return 0;
        }
    }

    /**
     * 批量获取多篇文章的PV数
     */
    async getBatchViews(articlePaths) {
        try {
            const pathsParam = articlePaths.join(',');
            const response = await fetch(`${this.baseUrl}/api/views/batch?paths=${encodeURIComponent(pathsParam)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to get batch article views:', error);
            return {};
        }
    }

    /**
     * 格式化PV数显示
     */
    formatViews(views) {
        if (views >= 10000) {
            return (views / 10000).toFixed(1) + '万';
        } else if (views >= 1000) {
            return (views / 1000).toFixed(1) + 'k';
        }
        return views.toString();
    }

    /**
     * 更新页面中的PV数显示
     */
    updateViewsDisplay(views, selector = '.article-views') {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            element.textContent = this.formatViews(views);
            element.style.opacity = '1'; // 显示元素
        });
    }

    /**
     * 初始化文章页面的PV统计
     */
    async initArticlePage() {
        // 增加PV数
        const result = await this.incrementViews();
        if (result) {
            // 更新显示
            this.updateViewsDisplay(result.views);

            // 触发自定义事件
            window.dispatchEvent(new CustomEvent('articleViewsUpdated', {
                detail: { views: result.views, incremented: result.incremented }
            }));
        }
    }

    /**
     * 初始化专题页面的PV显示
     */
    async initSectionPage() {
        // 获取页面中所有文章链接
        const articleLinks = document.querySelectorAll('article h2 a, .article-link');
        const articlePaths = Array.from(articleLinks).map(link => {
            const url = new URL(link.href);
            return this.getArticlePath(url.pathname);
        });

        if (articlePaths.length === 0) return;

        // 批量获取PV数
        const viewsData = await this.getBatchViews(articlePaths);

        // 更新每个文章卡片的PV显示
        articleLinks.forEach((link, index) => {
            const path = articlePaths[index];
            const views = viewsData[path] || 0;

            // 查找对应的PV显示元素
            const article = link.closest('article');
            if (article) {
                const viewsElement = article.querySelector('.article-views-count');
                if (viewsElement) {
                    viewsElement.textContent = this.formatViews(views);
                    viewsElement.style.opacity = '1';
                }
            }
        });
    }

    /**
     * 自动初始化
     */
    async autoInit() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.autoInit());
            return;
        }

        // 检测页面类型并初始化
        if (document.querySelector('article .prose')) {
            // 文章详情页
            await this.initArticlePage();
        } else if (document.querySelector('.space-y-8 article')) {
            // 专题页面
            await this.initSectionPage();
        }
    }
}

// 创建全局实例
window.articleStats = new ArticleStats();

// 自动初始化
window.articleStats.autoInit();
