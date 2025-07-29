#!/usr/bin/env node

// 加载环境变量（如果存在.env文件）
try {
    require('dotenv').config();
} catch (error) {
    // 在GitHub Actions环境中可能没有dotenv
}

const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const cheerio = require('cheerio');
const MarkdownIt = require('markdown-it');

/**
 * 微信公众号发布脚本
 * 将Markdown内容转换为微信公众号格式并发布
 */

class WeChatPublisher {
    constructor(appId, appSecret, accountName) {
        this.appId = appId;
        this.appSecret = appSecret;
        this.accountName = accountName;
        this.accessToken = null;
        this.tokenExpireTime = null;
        this.md = new MarkdownIt({
            html: true,
            linkify: true,
            typographer: true
        });

        // 重试配置
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000, // 1秒
            maxDelay: 10000  // 10秒
        };
    }

    /**
     * 延迟函数
     * @param {number} ms - 延迟毫秒数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 计算重试延迟时间（指数退避）
     * @param {number} attempt - 重试次数
     */
    calculateDelay(attempt) {
        const delay = this.retryConfig.baseDelay * Math.pow(2, attempt - 1);
        return Math.min(delay, this.retryConfig.maxDelay);
    }

    /**
     * 检查访问令牌是否有效
     */
    isTokenValid() {
        return this.accessToken && this.tokenExpireTime && new Date() < this.tokenExpireTime;
    }

    /**
     * 获取访问令牌（带重试和缓存）
     */
    async getAccessToken() {
        // 如果令牌仍然有效，直接返回
        if (this.isTokenValid()) {
            console.log(`🔄 ${this.accountName} 使用缓存的访问令牌`);
            return this.accessToken;
        }

        for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                console.log(`🔑 ${this.accountName} 获取访问令牌 (尝试 ${attempt}/${this.retryConfig.maxRetries})`);

                const response = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
                    params: {
                        grant_type: 'client_credential',
                        appid: this.appId,
                        secret: this.appSecret
                    },
                    timeout: 10000 // 10秒超时
                });

                if (response.data.access_token) {
                    this.accessToken = response.data.access_token;
                    // 设置过期时间（提前5分钟过期以确保安全）
                    const expiresIn = (response.data.expires_in || 7200) - 300;
                    this.tokenExpireTime = new Date(Date.now() + expiresIn * 1000);

                    // 添加调试信息
                    const now = new Date();
                    const expiresInHours = expiresIn / 3600;
                    console.log(`✅ ${this.accountName} 获取访问令牌成功`);
                    console.log(`   当前时间: ${now.toLocaleString()}`);
                    console.log(`   有效期: ${expiresInHours.toFixed(1)}小时 (${expiresIn}秒)`);
                    console.log(`   过期时间: ${this.tokenExpireTime.toLocaleString()}`);
                    return this.accessToken;
                } else {
                    const errorMsg = `获取访问令牌失败: ${response.data.errcode} - ${response.data.errmsg}`;
                    throw new Error(errorMsg);
                }
            } catch (error) {
                console.error(`❌ ${this.accountName} 获取访问令牌失败 (尝试 ${attempt}):`, error.message);

                if (attempt === this.retryConfig.maxRetries) {
                    throw new Error(`获取访问令牌最终失败: ${error.message}`);
                }

                const delay = this.calculateDelay(attempt);
                console.log(`⏳ ${delay}ms 后重试...`);
                await this.delay(delay);
            }
        }
    }

    /**
     * 上传图片到微信素材库（带重试）
     */
    async uploadImage(imagePath) {
        if (!imagePath) {
            console.log(`⚠️  图片路径为空`);
            return null;
        }

        // 检查文件是否存在
        if (!fs.existsSync(imagePath)) {
            console.log(`⚠️  图片文件不存在: ${imagePath}`);
            return null;
        }

        // 检查文件大小（微信限制10MB）
        const stats = fs.statSync(imagePath);
        const fileSizeInMB = stats.size / (1024 * 1024);
        if (fileSizeInMB > 10) {
            console.error(`❌ 图片文件过大: ${imagePath} (${fileSizeInMB.toFixed(2)}MB > 10MB)`);
            return null;
        }

        for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                console.log(`📷 上传图片: ${imagePath} (尝试 ${attempt}/${this.retryConfig.maxRetries})`);

                const form = new FormData();
                form.append('media', fs.createReadStream(imagePath));
                form.append('type', 'image');

                // 使用永久素材API而不是临时素材API
                const response = await axios.post(
                    `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${this.accessToken}&type=image`,
                    form,
                    {
                        headers: {
                            ...form.getHeaders()
                        },
                        timeout: 30000, // 30秒超时
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity
                    }
                );

                // 永久素材API返回格式不同
                if (response.data.media_id) {
                    console.log(`✅ 图片上传成功: ${imagePath} -> ${response.data.media_id}`);
                    return response.data.media_id;
                } else if (response.data.errcode === 0 && response.data.url) {
                    // 有些情况下返回的是url而不是media_id
                    console.log(`✅ 图片上传成功: ${imagePath} -> ${response.data.url}`);
                    return response.data.url;
                } else {
                    const errorMsg = `图片上传失败: ${response.data.errcode} - ${response.data.errmsg}`;
                    throw new Error(errorMsg);
                }
            } catch (error) {
                console.error(`❌ 上传图片失败 ${imagePath} (尝试 ${attempt}):`, error.message);

                if (attempt === this.retryConfig.maxRetries) {
                    console.error(`❌ 图片上传最终失败: ${imagePath}`);
                    return null;
                }

                const delay = this.calculateDelay(attempt);
                console.log(`⏳ ${delay}ms 后重试...`);
                await this.delay(delay);
            }
        }

        return null;
    }

    /**
     * 转换Markdown为微信HTML格式
     */
    convertMarkdownToWeChatHTML(markdown, article) {
        // 转换Markdown为HTML
        let html = this.md.render(markdown);
        
        // 使用cheerio处理HTML
        const $ = cheerio.load(html);

        // 处理标题样式
        $('h1').each((i, el) => {
            $(el).attr('style', 'font-size: 24px; font-weight: bold; color: #333; margin: 20px 0 10px 0; line-height: 1.4;');
        });

        $('h2').each((i, el) => {
            $(el).attr('style', 'font-size: 20px; font-weight: bold; color: #333; margin: 18px 0 8px 0; line-height: 1.4; border-left: 4px solid #007AFF; padding-left: 10px;');
        });

        $('h3').each((i, el) => {
            $(el).attr('style', 'font-size: 18px; font-weight: bold; color: #333; margin: 16px 0 6px 0; line-height: 1.4;');
        });

        // 处理段落样式
        $('p').each((i, el) => {
            $(el).attr('style', 'font-size: 16px; line-height: 1.8; color: #333; margin: 12px 0; text-align: justify;');
        });

        // 处理列表样式
        $('ul, ol').each((i, el) => {
            $(el).attr('style', 'margin: 12px 0; padding-left: 20px;');
        });

        $('li').each((i, el) => {
            $(el).attr('style', 'font-size: 16px; line-height: 1.8; color: #333; margin: 6px 0;');
        });

        // 处理代码块
        $('pre').each((i, el) => {
            $(el).attr('style', 'background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; padding: 12px; margin: 12px 0; overflow-x: auto; font-family: "Courier New", monospace;');
        });

        $('code').each((i, el) => {
            if (!$(el).parent('pre').length) {
                $(el).attr('style', 'background: #f0f0f0; padding: 2px 4px; border-radius: 3px; font-family: "Courier New", monospace; color: #d14;');
            }
        });

        // 处理引用
        $('blockquote').each((i, el) => {
            $(el).attr('style', 'border-left: 4px solid #007AFF; background: #f8f9fa; padding: 12px 16px; margin: 12px 0; font-style: italic;');
        });

        // 处理链接
        $('a').each((i, el) => {
            $(el).attr('style', 'color: #007AFF; text-decoration: none;');
            // 微信不支持外部链接，转换为文本
            const href = $(el).attr('href');
            const text = $(el).text();
            $(el).replaceWith(`${text} (${href})`);
        });

        // 处理图片
        $('img').each((i, el) => {
            $(el).attr('style', 'max-width: 100%; height: auto; display: block; margin: 12px auto; border-radius: 4px;');
        });

        // 处理表格
        $('table').each((i, el) => {
            $(el).attr('style', 'width: 100%; border-collapse: collapse; margin: 12px 0;');
        });

        $('th, td').each((i, el) => {
            $(el).attr('style', 'border: 1px solid #ddd; padding: 8px 12px; text-align: left;');
        });

        $('th').each((i, el) => {
            $(el).attr('style', $(el).attr('style') + ' background: #f5f5f5; font-weight: bold;');
        });

        return $.html();
    }

    /**
     * 创建默认封面图片
     */
    async createDefaultCoverImage(article) {
        try {
            const sharp = require('sharp');
            const fs = require('fs');
            const path = require('path');

            // 确保临时目录存在
            const tempDir = path.join(process.cwd(), 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // 创建一个简单的蓝色背景图片
            const imagePath = path.join(tempDir, `cover-${Date.now()}.jpg`);

            await sharp({
                create: {
                    width: 900,
                    height: 500,
                    channels: 3,
                    background: { r: 0, g: 122, b: 255 } // 苹果蓝色
                }
            })
            .jpeg({ quality: 90 })
            .toFile(imagePath);

            console.log(`🎨 ${this.accountName} 创建默认封面图片: ${imagePath}`);

            // 尝试上传图片文件
            const mediaId = await this.uploadImage(imagePath);

            // 清理临时文件
            try {
                fs.unlinkSync(imagePath);
            } catch (e) {
                // 忽略清理错误
            }

            return mediaId;
        } catch (error) {
            console.error(`❌ ${this.accountName} 创建默认封面失败:`, error.message);
            // 如果sharp不可用，尝试使用预设的图片
            return await this.usePresetCoverImage();
        }
    }

    /**
     * 使用预设封面图片
     */
    async usePresetCoverImage() {
        try {
            const fs = require('fs');
            const path = require('path');

            // 创建一个最小的1x1像素图片
            const tempDir = path.join(process.cwd(), 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // 创建一个最小的JPEG文件（Base64编码的1x1蓝色像素）
            const minimalJpeg = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A', 'base64');

            const imagePath = path.join(tempDir, `minimal-cover-${Date.now()}.jpg`);
            fs.writeFileSync(imagePath, minimalJpeg);

            console.log(`🎨 ${this.accountName} 使用最小封面图片: ${imagePath}`);

            // 尝试上传图片文件
            const mediaId = await this.uploadImage(imagePath);

            // 清理临时文件
            try {
                fs.unlinkSync(imagePath);
            } catch (e) {
                // 忽略清理错误
            }

            return mediaId;
        } catch (error) {
            console.error(`❌ ${this.accountName} 使用预设封面失败:`, error.message);
            return null;
        }
    }

    /**
     * 创建图文消息草稿
     */
    async createDraft(article) {
        try {
            // 转换内容
            const content = this.convertMarkdownToWeChatHTML(article.content, article);
            
            // 先创建一个默认的缩略图（使用临时图片或跳过）
            let thumbMediaId = null;

            // 如果有封面图片，先上传
            if (article.wechat.cover_image) {
                const coverPath = `static${article.wechat.cover_image}`;
                thumbMediaId = await this.uploadImage(coverPath);
            }

            // 如果没有封面图片，创建一个默认图片
            if (!thumbMediaId) {
                console.log(`ℹ️  ${this.accountName} 没有封面图片，创建默认封面`);
                thumbMediaId = await this.createDefaultCoverImage(article);
                if (!thumbMediaId) {
                    throw new Error('无法创建默认封面图片');
                }
            }

            // 准备图文消息数据（有封面图片的情况）
            const newsData = {
                articles: [{
                    title: article.wechat.title,
                    author: article.wechat.author || 'NSSA团队',
                    digest: article.wechat.digest || article.wechat.summary || article.description || '',
                    content: content,
                    content_source_url: `https://nssa.io${this.getArticleUrl(article.filePath)}`,
                    thumb_media_id: thumbMediaId,
                    show_cover_pic: 1,
                    need_open_comment: 1,
                    only_fans_can_comment: 0
                }]
            };

            // 创建草稿
            const response = await axios.post(
                `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${this.accessToken}`,
                newsData
            );

            // 检查响应格式
            if (response.data.errcode === 0 || (response.data.media_id && !response.data.errcode)) {
                console.log(`✅ ${this.accountName} 创建草稿成功: ${article.wechat.title}`);
                return {
                    success: true,
                    media_id: response.data.media_id,
                    article_id: response.data.media_id
                };
            } else if (response.data.media_id && response.data.item && response.data.item.length === 0) {
                // 特殊情况：返回了media_id但item为空，可能是成功的
                console.log(`✅ ${this.accountName} 创建草稿成功 (特殊格式): ${article.wechat.title}`);
                return {
                    success: true,
                    media_id: response.data.media_id,
                    article_id: response.data.media_id
                };
            } else {
                throw new Error(`创建草稿失败: ${JSON.stringify(response.data)}`);
            }
        } catch (error) {
            console.error(`❌ ${this.accountName} 创建草稿失败:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 发布草稿
     */
    async publishDraft(mediaId) {
        try {
            const response = await axios.post(
                `https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${this.accessToken}`,
                {
                    media_id: mediaId
                }
            );

            if (response.data.errcode === 0) {
                console.log(`✅ ${this.accountName} 发布成功`);
                return {
                    success: true,
                    publish_id: response.data.publish_id
                };
            } else {
                throw new Error(`发布失败: ${JSON.stringify(response.data)}`);
            }
        } catch (error) {
            console.error(`❌ ${this.accountName} 发布失败:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 获取文章URL路径
     */
    getArticleUrl(filePath) {
        // content/tech/ai.md -> /tech/ai/
        const pathParts = filePath.replace('content/', '').replace('.md', '').split('/');
        return '/' + pathParts.join('/') + '/';
    }

    /**
     * 发布文章到微信公众号（带重试）
     */
    async publishArticle(article) {
        const startTime = Date.now();

        for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                console.log(`🚀 开始发布到 ${this.accountName}: ${article.wechat.title} (尝试 ${attempt}/${this.retryConfig.maxRetries})`);

                // 获取访问令牌
                await this.getAccessToken();

                // 创建草稿
                const draftResult = await this.createDraft(article);
                if (!draftResult.success) {
                    throw new Error(`创建草稿失败: ${draftResult.error}`);
                }

                // 由于权限限制，只创建草稿，不自动发布
                const duration = Date.now() - startTime;
                console.log(`📝 ${this.accountName} 草稿创建成功，请手动发布: ${article.wechat.title}`);
                console.log(`   草稿ID: ${draftResult.media_id}`);
                console.log(`   请登录微信公众平台手动发布: https://mp.weixin.qq.com/`);
                console.log(`   耗时: ${duration}ms`);

                return {
                    success: true,
                    account: this.accountName,
                    article_id: draftResult.article_id,
                    media_id: draftResult.media_id,
                    title: article.wechat.title,
                    created_at: new Date().toISOString(),
                    duration_ms: duration,
                    attempt: attempt,
                    note: '草稿已创建，请手动发布'
                };

            } catch (error) {
                console.error(`❌ ${this.accountName} 发布文章失败 (尝试 ${attempt}):`, error.message);

                if (attempt === this.retryConfig.maxRetries) {
                    const duration = Date.now() - startTime;
                    return {
                        success: false,
                        account: this.accountName,
                        error: error.message,
                        title: article.wechat.title,
                        duration_ms: duration,
                        final_attempt: attempt
                    };
                }

                const delay = this.calculateDelay(attempt);
                console.log(`⏳ ${delay}ms 后重试...`);
                await this.delay(delay);
            }
        }
    }
}

/**
 * 主发布函数
 */
async function publishToWeChat() {
    const startTime = Date.now();

    try {
        // 读取文章配置
        let articlesData;
        try {
            articlesData = JSON.parse(process.env.ARTICLES_CONFIG || '[]');
        } catch (error) {
            throw new Error(`解析文章配置失败: ${error.message}`);
        }

        // 支持新的配置格式（包含summary）
        const articlesConfig = Array.isArray(articlesData) ? articlesData : (articlesData.articles || []);

        console.log(`📚 准备发布 ${articlesConfig.length} 篇文章到微信公众号`);

        if (articlesConfig.length === 0) {
            console.log('ℹ️  没有需要发布到微信的文章');
            return [];
        }

        const results = [];
        const stats = {
            total: 0,
            success: 0,
            failed: 0,
            skipped: 0
        };

        // 初始化发布器
        const publishers = {};

        if (process.env.WECHAT_A_APPID && process.env.WECHAT_A_SECRET) {
            publishers.wechat_a = new WeChatPublisher(
                process.env.WECHAT_A_APPID,
                process.env.WECHAT_A_SECRET,
                '公众号A'
            );
            console.log('✅ 公众号A 发布器初始化成功');
        } else {
            console.log('⚠️  公众号A 配置缺失，跳过初始化');
        }

        if (process.env.WECHAT_B_APPID && process.env.WECHAT_B_SECRET) {
            publishers.wechat_b = new WeChatPublisher(
                process.env.WECHAT_B_APPID,
                process.env.WECHAT_B_SECRET,
                '公众号B'
            );
            console.log('✅ 公众号B 发布器初始化成功');
        } else {
            console.log('⚠️  公众号B 配置缺失，跳过初始化');
        }

        // 发布文章
        for (const [index, article] of articlesConfig.entries()) {
            console.log(`\n📄 处理文章 ${index + 1}/${articlesConfig.length}: ${article.title}`);
            console.log(`   文件: ${article.filePath}`);

            // 发布到公众号A
            if (article.publish.wechat_a) {
                stats.total++;
                if (publishers.wechat_a) {
                    try {
                        const result = await publishers.wechat_a.publishArticle(article);
                        results.push({
                            ...result,
                            filePath: article.filePath,
                            platform: 'wechat_a'
                        });

                        if (result.success) {
                            stats.success++;
                        } else {
                            stats.failed++;
                        }
                    } catch (error) {
                        console.error(`❌ 公众号A发布异常:`, error.message);
                        results.push({
                            success: false,
                            account: '公众号A',
                            error: error.message,
                            title: article.wechat.title,
                            filePath: article.filePath,
                            platform: 'wechat_a'
                        });
                        stats.failed++;
                    }
                } else {
                    console.log(`⚠️  公众号A 发布器未初始化，跳过发布`);
                    results.push({
                        success: false,
                        account: '公众号A',
                        error: '发布器未初始化',
                        title: article.wechat.title,
                        filePath: article.filePath,
                        platform: 'wechat_a'
                    });
                    stats.skipped++;
                }
            }

            // 发布到公众号B
            if (article.publish.wechat_b) {
                stats.total++;
                if (publishers.wechat_b) {
                    try {
                        const result = await publishers.wechat_b.publishArticle(article);
                        results.push({
                            ...result,
                            filePath: article.filePath,
                            platform: 'wechat_b'
                        });

                        if (result.success) {
                            stats.success++;
                        } else {
                            stats.failed++;
                        }
                    } catch (error) {
                        console.error(`❌ 公众号B发布异常:`, error.message);
                        results.push({
                            success: false,
                            account: '公众号B',
                            error: error.message,
                            title: article.wechat.title,
                            filePath: article.filePath,
                            platform: 'wechat_b'
                        });
                        stats.failed++;
                    }
                } else {
                    console.log(`⚠️  公众号B 发布器未初始化，跳过发布`);
                    results.push({
                        success: false,
                        account: '公众号B',
                        error: '发布器未初始化',
                        title: article.wechat.title,
                        filePath: article.filePath,
                        platform: 'wechat_b'
                    });
                    stats.skipped++;
                }
            }

            // 文章间添加延迟，避免API限制
            if (index < articlesConfig.length - 1) {
                console.log('⏳ 等待2秒后处理下一篇文章...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        const duration = Date.now() - startTime;

        // 输出详细的发布结果
        console.log('\n📊 发布结果汇总:');
        console.log(`   总计: ${stats.total}`);
        console.log(`   成功: ${stats.success}`);
        console.log(`   失败: ${stats.failed}`);
        console.log(`   跳过: ${stats.skipped}`);
        console.log(`   耗时: ${duration}ms`);

        // 输出详细结果
        if (results.length > 0) {
            console.log('\n📝 详细结果:');
            results.forEach((result, index) => {
                const status = result.success ? '✅' : '❌';
                console.log(`   ${index + 1}. ${status} ${result.platform}: ${result.title}`);
                if (!result.success) {
                    console.log(`      错误: ${result.error}`);
                } else if (result.publish_id) {
                    console.log(`      发布ID: ${result.publish_id}`);
                }
                if (result.duration_ms) {
                    console.log(`      耗时: ${result.duration_ms}ms`);
                }
            });
        }

        // 构建完整的结果数据
        const finalResults = {
            timestamp: new Date().toISOString(),
            duration_ms: duration,
            statistics: stats,
            results: results
        };

        // 设置GitHub Actions输出
        try {
            const core = require('@actions/core');
            core.setOutput('results', JSON.stringify(results));
            core.setOutput('wechat-stats', JSON.stringify(stats));
            core.setOutput('wechat-success', (stats.success > 0).toString());
            core.setOutput('wechat-failed', (stats.failed > 0).toString());
        } catch (error) {
            // 在本地测试时，@actions/core可能不可用
            console.log('\n🔧 GitHub Actions输出（本地测试时忽略）:');
            console.log(`   results=${JSON.stringify(results)}`);
            console.log(`   wechat-stats=${JSON.stringify(stats)}`);
        }

        // 保存详细结果到文件
        try {
            fs.writeFileSync('wechat-publish-results.json', JSON.stringify(finalResults, null, 2));
            console.log('\n💾 发布结果已保存到 wechat-publish-results.json');
        } catch (error) {
            console.warn('⚠️  保存结果文件失败:', error.message);
        }

        // 如果有失败的发布，返回错误状态
        if (stats.failed > 0 && stats.success === 0) {
            console.error('\n❌ 所有微信发布都失败了');
            process.exit(1);
        }

        return finalResults;

    } catch (error) {
        console.error('❌ 微信发布系统错误:', error.message);
        console.error('错误堆栈:', error.stack);

        // 尝试保存错误信息
        try {
            const errorResult = {
                timestamp: new Date().toISOString(),
                error: error.message,
                stack: error.stack,
                success: false
            };
            fs.writeFileSync('wechat-publish-error.json', JSON.stringify(errorResult, null, 2));
        } catch (saveError) {
            console.error('保存错误信息失败:', saveError.message);
        }

        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    publishToWeChat();
}

module.exports = { WeChatPublisher, publishToWeChat };
