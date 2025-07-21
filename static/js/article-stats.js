/**
 * NSSA 文章统计模块
 * 提供文章PV统计和点赞功能
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
     * 获取文章点赞数和用户点赞状态
     */
    async getLikes(articlePath = null) {
        try {
            const path = articlePath || this.getArticlePath();

            const response = await fetch(`${this.baseUrl}/api/likes/get?path=${encodeURIComponent(path)}&clientId=${encodeURIComponent(this.clientId)}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to get article likes:', error);
            return { likes: 0, userLiked: false };
        }
    }

    /**
     * 切换文章点赞状态
     */
    async toggleLike(articlePath = null) {
        try {
            const path = articlePath || this.getArticlePath();

            const response = await fetch(`${this.baseUrl}/api/likes/toggle`, {
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
            console.error('Failed to toggle article like:', error);
            return null;
        }
    }

    /**
     * 批量获取多篇文章的点赞数
     */
    async getBatchLikes(articlePaths) {
        try {
            const pathsParam = articlePaths.join(',');
            const response = await fetch(`${this.baseUrl}/api/likes/batch?paths=${encodeURIComponent(pathsParam)}&clientId=${encodeURIComponent(this.clientId)}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to get batch article likes:', error);
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
            // 显示父容器
            const container = element.closest('#article-views-container, .opacity-0');
            if (container) {
                container.style.opacity = '1';
            }
        });
    }

    /**
     * 更新点赞按钮显示
     */
    updateLikeDisplay(likes, userLiked, selector = '.like-count') {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            element.textContent = this.formatViews(likes);

            // 更新按钮状态
            const button = element.closest('button');
            if (button) {
                button.setAttribute('data-liked', userLiked.toString());
                if (userLiked) {
                    button.classList.remove('bg-gray-100', 'dark:bg-gray-800');
                    button.classList.add('bg-apple-blue', 'text-white');
                } else {
                    button.classList.remove('bg-apple-blue', 'text-white');
                    button.classList.add('bg-gray-100', 'dark:bg-gray-800');
                }
            }
        });
    }

    /**
     * 初始化文章页面的统计功能
     */
    async initArticlePage() {
        // 增加PV数
        const viewsResult = await this.incrementViews();
        if (viewsResult) {
            // 更新PV显示
            this.updateViewsDisplay(viewsResult.views);

            // 触发自定义事件
            window.dispatchEvent(new CustomEvent('articleViewsUpdated', {
                detail: { views: viewsResult.views, incremented: viewsResult.incremented }
            }));
        }

        // 获取点赞状态
        const likesResult = await this.getLikes();
        if (likesResult) {
            // 更新点赞显示
            this.updateLikeDisplay(likesResult.likes, likesResult.userLiked);
        }

        // 绑定点赞按钮事件
        this.bindLikeButtons();
    }

    /**
     * 初始化专题页面的统计显示
     */
    async initSectionPage() {
        // 获取页面中所有文章链接
        const articleLinks = document.querySelectorAll('article h2 a, .article-link');
        const articlePaths = Array.from(articleLinks).map(link => {
            const url = new URL(link.href);
            return this.getArticlePath(url.pathname);
        });

        if (articlePaths.length === 0) return;

        // 批量获取PV数和点赞数
        const [viewsData, likesData] = await Promise.all([
            this.getBatchViews(articlePaths),
            this.getBatchLikes(articlePaths)
        ]);

        // 更新每个文章卡片的显示
        articleLinks.forEach((link, index) => {
            const path = articlePaths[index];
            const views = viewsData[path] || 0;
            const likesInfo = likesData[path] || { likes: 0, userLiked: false };

            const article = link.closest('article');
            if (article) {
                // 更新PV显示
                const viewsElement = article.querySelector('.article-views-count');
                if (viewsElement) {
                    viewsElement.textContent = this.formatViews(views);
                    // 显示PV容器
                    const viewsContainer = viewsElement.closest('.opacity-0');
                    if (viewsContainer) {
                        viewsContainer.style.opacity = '1';
                    }
                }

                // 更新点赞显示
                const likeElement = article.querySelector('.like-count');
                if (likeElement) {
                    this.updateLikeDisplay(likesInfo.likes, likesInfo.userLiked, `article:nth-child(${index + 1}) .like-count`);
                }
            }
        });

        // 绑定点赞按钮事件
        this.bindLikeButtons();
    }

    /**
     * 绑定点赞按钮事件
     */
    bindLikeButtons() {
        // 移除旧的事件监听器，避免重复绑定
        document.removeEventListener('click', this.handleLikeClick);

        // 使用事件委托绑定点赞按钮
        this.handleLikeClick = async (event) => {
            const button = event.target.closest('.like-button');
            if (!button) return;

            event.preventDefault();
            event.stopPropagation();

            // 防止重复点击
            if (button.disabled) return;
            button.disabled = true;

            try {
                const result = await this.toggleLike();
                if (result) {
                    this.updateLikeDisplay(result.likes, result.userLiked);
                }
            } catch (error) {
                console.error('Failed to toggle like:', error);
            } finally {
                button.disabled = false;
            }
        };

        document.addEventListener('click', this.handleLikeClick);
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
