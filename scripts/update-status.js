#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 发布状态更新脚本
 * 记录和管理文章发布状态
 */

class PublishStatusManager {
    constructor() {
        this.statusFile = 'publish-status.json';
        this.status = this.loadStatus();
    }

    /**
     * 加载现有状态
     */
    loadStatus() {
        try {
            if (fs.existsSync(this.statusFile)) {
                const content = fs.readFileSync(this.statusFile, 'utf8');
                return JSON.parse(content);
            }
        } catch (error) {
            console.log('⚠️  加载状态文件失败，创建新的状态文件');
        }

        return {
            last_updated: new Date().toISOString(),
            total_articles: 0,
            total_publishes: 0,
            articles: {},
            statistics: {
                website: { total: 0, success: 0, failed: 0 },
                wechat_a: { total: 0, success: 0, failed: 0 },
                wechat_b: { total: 0, success: 0, failed: 0 }
            }
        };
    }

    /**
     * 保存状态到文件
     */
    saveStatus() {
        try {
            this.status.last_updated = new Date().toISOString();
            fs.writeFileSync(this.statusFile, JSON.stringify(this.status, null, 2));
            console.log('💾 发布状态已保存');
        } catch (error) {
            console.error('❌ 保存状态文件失败:', error);
        }
    }

    /**
     * 更新文章状态
     */
    updateArticleStatus(filePath, platform, result) {
        // 初始化文章状态
        if (!this.status.articles[filePath]) {
            this.status.articles[filePath] = {
                title: result.title || '未知标题',
                first_published: new Date().toISOString(),
                last_updated: new Date().toISOString(),
                website: { status: 'not_configured' },
                wechat_a: { status: 'not_configured' },
                wechat_b: { status: 'not_configured' }
            };
        }

        const article = this.status.articles[filePath];
        article.last_updated = new Date().toISOString();

        // 更新平台状态
        if (result.success) {
            article[platform] = {
                status: 'published',
                published_at: result.published_at || new Date().toISOString(),
                article_id: result.article_id || null,
                publish_id: result.publish_id || null,
                url: result.url || null
            };

            // 更新统计
            this.status.statistics[platform].success++;
        } else {
            article[platform] = {
                status: 'failed',
                error: result.error || '未知错误',
                failed_at: new Date().toISOString(),
                retry_count: (article[platform].retry_count || 0) + 1
            };

            // 更新统计
            this.status.statistics[platform].failed++;
        }

        // 更新总计
        this.status.statistics[platform].total++;
    }

    /**
     * 更新网站发布状态
     */
    updateWebsiteStatus(articlesConfig, websiteSuccess) {
        for (const article of articlesConfig) {
            if (article.publish.website) {
                const result = {
                    success: websiteSuccess,
                    title: article.title,
                    published_at: new Date().toISOString(),
                    url: `https://nssa.io${this.getArticleUrl(article.filePath)}`
                };

                if (!websiteSuccess) {
                    result.error = '网站部署失败';
                }

                this.updateArticleStatus(article.filePath, 'website', result);
            }
        }
    }

    /**
     * 更新微信发布状态
     */
    updateWeChatStatus(results) {
        for (const result of results) {
            this.updateArticleStatus(result.filePath, result.platform, result);
        }
    }

    /**
     * 获取文章URL
     */
    getArticleUrl(filePath) {
        const pathParts = filePath.replace('content/', '').replace('.md', '').split('/');
        return '/' + pathParts.join('/') + '/';
    }

    /**
     * 生成发布报告
     */
    generateReport() {
        const report = {
            summary: {
                total_articles: Object.keys(this.status.articles).length,
                last_updated: this.status.last_updated,
                statistics: this.status.statistics
            },
            recent_articles: [],
            failed_publishes: []
        };

        // 获取最近的文章
        const recentArticles = Object.entries(this.status.articles)
            .sort(([,a], [,b]) => new Date(b.last_updated) - new Date(a.last_updated))
            .slice(0, 10);

        for (const [filePath, article] of recentArticles) {
            report.recent_articles.push({
                title: article.title,
                file_path: filePath,
                last_updated: article.last_updated,
                website: article.website.status,
                wechat_a: article.wechat_a.status,
                wechat_b: article.wechat_b.status
            });

            // 收集失败的发布
            ['website', 'wechat_a', 'wechat_b'].forEach(platform => {
                if (article[platform].status === 'failed') {
                    report.failed_publishes.push({
                        title: article.title,
                        platform,
                        error: article[platform].error,
                        failed_at: article[platform].failed_at
                    });
                }
            });
        }

        return report;
    }

    /**
     * 获取发布统计
     */
    getStatistics() {
        const stats = this.status.statistics;
        return {
            website: {
                total: stats.website.total,
                success_rate: stats.website.total > 0 ? 
                    ((stats.website.success / stats.website.total) * 100).toFixed(1) + '%' : '0%'
            },
            wechat_a: {
                total: stats.wechat_a.total,
                success_rate: stats.wechat_a.total > 0 ? 
                    ((stats.wechat_a.success / stats.wechat_a.total) * 100).toFixed(1) + '%' : '0%'
            },
            wechat_b: {
                total: stats.wechat_b.total,
                success_rate: stats.wechat_b.total > 0 ? 
                    ((stats.wechat_b.success / stats.wechat_b.total) * 100).toFixed(1) + '%' : '0%'
            }
        };
    }
}

/**
 * 主更新函数
 */
async function updatePublishStatus() {
    try {
        console.log('📊 开始更新发布状态...');

        const statusManager = new PublishStatusManager();

        // 读取文章配置
        let articlesConfig = [];
        if (fs.existsSync('articles-config.json')) {
            const configData = JSON.parse(fs.readFileSync('articles-config.json', 'utf8'));
            // 支持新的配置格式
            articlesConfig = Array.isArray(configData) ? configData : (configData.articles || []);
        }

        // 读取微信发布结果
        let publishResults = [];
        if (process.env.WECHAT_RESULTS) {
            try {
                publishResults = JSON.parse(process.env.WECHAT_RESULTS);
            } catch (error) {
                console.warn('⚠️  解析微信发布结果失败:', error.message);
            }
        }

        // 也尝试从文件读取
        if (publishResults.length === 0 && fs.existsSync('wechat-publish-results.json')) {
            try {
                const wechatData = JSON.parse(fs.readFileSync('wechat-publish-results.json', 'utf8'));
                publishResults = wechatData.results || [];
            } catch (error) {
                console.warn('⚠️  读取微信发布结果文件失败:', error.message);
            }
        }

        // 更新网站状态
        const websiteEnabled = process.env.WEBSITE_STATUS === 'true';
        const buildStatus = process.env.BUILD_STATUS || 'unknown';
        const websiteSuccess = websiteEnabled && (buildStatus === 'success' || buildStatus === 'completed');

        console.log(`📊 网站状态: 启用=${websiteEnabled}, 构建=${buildStatus}, 成功=${websiteSuccess}`);
        statusManager.updateWebsiteStatus(articlesConfig, websiteSuccess);

        // 更新微信状态
        statusManager.updateWeChatStatus(publishResults);

        // 保存状态
        statusManager.saveStatus();

        // 生成报告
        const report = statusManager.generateReport();
        const statistics = statusManager.getStatistics();

        console.log('\n📈 发布统计:');
        console.log(`网站: ${statistics.website.total}次发布, 成功率: ${statistics.website.success_rate}`);
        console.log(`公众号A: ${statistics.wechat_a.total}次发布, 成功率: ${statistics.wechat_a.success_rate}`);
        console.log(`公众号B: ${statistics.wechat_b.total}次发布, 成功率: ${statistics.wechat_b.success_rate}`);

        if (report.failed_publishes.length > 0) {
            console.log('\n❌ 失败的发布:');
            report.failed_publishes.forEach(fail => {
                console.log(`   ${fail.platform}: ${fail.title} - ${fail.error}`);
            });
        }

        // 设置GitHub Actions输出
        try {
            const core = require('@actions/core');
            core.setOutput('status', JSON.stringify(report));
            core.setOutput('statistics', JSON.stringify(statistics));
            core.setOutput('overall-success', (stats.website.total > 0 || stats.wechat_a.total > 0 || stats.wechat_b.total > 0).toString());
        } catch (error) {
            // 在本地测试时，@actions/core可能不可用
            console.log('GitHub Actions输出设置（本地测试时忽略）');
        }

        return report;

    } catch (error) {
        console.error('❌ 更新发布状态失败:', error);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    updatePublishStatus();
}

module.exports = { PublishStatusManager, updatePublishStatus };
