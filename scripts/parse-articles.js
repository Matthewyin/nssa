#!/usr/bin/env node

// 加载环境变量（如果存在.env文件）
try {
    require('dotenv').config();
} catch (error) {
    // 在GitHub Actions环境中可能没有dotenv
}

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

/**
 * 解析文章配置脚本
 * 读取变更的Markdown文件，解析Front Matter中的发布配置
 */

/**
 * 验证Front Matter配置
 * @param {Object} frontMatter - Front Matter数据
 * @param {string} filePath - 文件路径
 * @throws {Error} 验证失败时抛出错误
 */
function validateFrontMatter(frontMatter, filePath) {
    const required = ['title', 'date'];
    const missing = required.filter(field => !frontMatter[field]);

    if (missing.length > 0) {
        throw new Error(`${filePath}: 缺少必需字段: ${missing.join(', ')}`);
    }

    // 验证日期格式
    if (frontMatter.date && isNaN(new Date(frontMatter.date))) {
        throw new Error(`${filePath}: 日期格式无效: ${frontMatter.date}`);
    }

    // 验证发布配置
    if (frontMatter.publish) {
        validatePublishConfig(frontMatter.publish, filePath);
    }

    // 验证微信配置
    if (frontMatter.wechat) {
        validateWechatConfig(frontMatter.wechat, filePath);
    }
}

/**
 * 验证发布配置
 * @param {Object} publishConfig - 发布配置
 * @param {string} filePath - 文件路径
 */
function validatePublishConfig(publishConfig, filePath) {
    const validKeys = ['website', 'wechat_a', 'wechat_b', 'schedule'];
    const invalidKeys = Object.keys(publishConfig).filter(key => !validKeys.includes(key));

    if (invalidKeys.length > 0) {
        console.warn(`⚠️  ${filePath}: 发布配置包含未知字段: ${invalidKeys.join(', ')}`);
    }

    // 验证定时发布时间
    if (publishConfig.schedule) {
        const scheduleTime = new Date(publishConfig.schedule);
        if (isNaN(scheduleTime)) {
            throw new Error(`${filePath}: 定时发布时间格式无效: ${publishConfig.schedule}`);
        }
    }
}

/**
 * 验证微信配置
 * @param {Object} wechatConfig - 微信配置
 * @param {string} filePath - 文件路径
 */
function validateWechatConfig(wechatConfig, filePath) {
    // 检查封面图片路径
    if (wechatConfig.cover_image && !wechatConfig.cover_image.startsWith('/')) {
        console.warn(`⚠️  ${filePath}: 建议使用绝对路径作为封面图片: ${wechatConfig.cover_image}`);
    }

    // 检查摘要长度
    if (wechatConfig.digest && wechatConfig.digest.length > 120) {
        console.warn(`⚠️  ${filePath}: 微信摘要过长(${wechatConfig.digest.length}字符)，建议控制在120字符以内`);
    }
}

/**
 * 构建文章配置对象
 * @param {Object} frontMatter - Front Matter数据
 * @param {string} content - 文章内容
 * @param {string} filePath - 文件路径
 * @param {Object} publishConfig - 发布配置
 * @param {Object} wechatConfig - 微信配置
 * @returns {Object} 文章配置对象
 */
function buildArticleConfig(frontMatter, content, filePath, publishConfig, wechatConfig) {
    return {
        filePath,
        title: frontMatter.title || '未命名文章',
        subtitle: frontMatter.subtitle || '',
        description: frontMatter.description || '',
        date: frontMatter.date || new Date().toISOString(),
        lastmod: frontMatter.lastmod || frontMatter.date || new Date().toISOString(),
        tags: Array.isArray(frontMatter.tags) ? frontMatter.tags : [],
        categories: Array.isArray(frontMatter.categories) ? frontMatter.categories : [],
        readingTime: frontMatter.readingTime || '',
        content: content.trim(),

        // 发布配置
        publish: {
            website: publishConfig.website !== false, // 默认发布到网站
            wechat_a: publishConfig.wechat_a === true,
            wechat_b: publishConfig.wechat_b === true,
            schedule: publishConfig.schedule || null
        },

        // 微信配置
        wechat: {
            title: wechatConfig.title || frontMatter.title || '未命名文章',
            summary: wechatConfig.summary || frontMatter.description || '',
            author: wechatConfig.author || 'NSSA团队',
            cover_image: wechatConfig.cover_image || '',
            tags: Array.isArray(wechatConfig.tags) ? wechatConfig.tags : (Array.isArray(frontMatter.tags) ? frontMatter.tags : []),
            digest: wechatConfig.digest || (frontMatter.description ? frontMatter.description.substring(0, 120) : '')
        },

        // 元数据
        metadata: {
            wordCount: content.trim().length,
            parsedAt: new Date().toISOString(),
            fileSize: Buffer.byteLength(content, 'utf8')
        }
    };
}

async function parseArticles() {
    try {
        // 获取变更的文件列表
        const changedFiles = JSON.parse(process.env.CHANGED_FILES || '[]');
        console.log('📄 检测到变更文件:', changedFiles);

        if (changedFiles.length === 0) {
            console.log('ℹ️  没有检测到Markdown文件变更');
            return { hasWebsite: false, hasWechat: false, articlesConfig: [] };
        }

        const articlesConfig = [];
        let hasWebsite = false;
        let hasWechat = false;
        let processedCount = 0;
        let errorCount = 0;

        for (const filePath of changedFiles) {
            try {
                if (!filePath.endsWith('.md') || !filePath.startsWith('content/')) {
                    console.log(`⏭️  跳过非内容文件: ${filePath}`);
                    continue;
                }

                console.log(`🔍 解析文件: ${filePath}`);

                // 检查文件是否存在
                if (!fs.existsSync(filePath)) {
                    console.log(`⚠️  文件不存在，可能已被删除: ${filePath}`);
                    continue;
                }

                // 读取并解析文件
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const { data: frontMatter, content } = matter(fileContent);

                // 检查是否有Front Matter
                if (!frontMatter || Object.keys(frontMatter).length === 0) {
                    console.log(`⚠️  文件缺少Front Matter: ${filePath}`);
                    continue;
                }

                // 验证Front Matter
                validateFrontMatter(frontMatter, filePath);
                processedCount++;

                // 解析发布配置
                const publishConfig = frontMatter.publish || {};
                const wechatConfig = frontMatter.wechat || {};

                // 构建文章配置对象
                const articleConfig = buildArticleConfig(frontMatter, content, filePath, publishConfig, wechatConfig);

                // 检查是否需要定时发布
                if (articleConfig.publish.schedule) {
                    const scheduleTime = new Date(articleConfig.publish.schedule);
                    const now = new Date();

                    if (scheduleTime > now) {
                        console.log(`⏰ 文章定时发布: ${articleConfig.title} - ${scheduleTime.toISOString()}`);
                        // 定时发布的文章暂时跳过，等待定时触发
                        continue;
                    }
                }

                articlesConfig.push(articleConfig);

                // 更新发布标志
                if (articleConfig.publish.website) {
                    hasWebsite = true;
                }
                if (articleConfig.publish.wechat_a || articleConfig.publish.wechat_b) {
                    hasWechat = true;
                }

                console.log(`✅ 解析完成: ${articleConfig.title}`);
                console.log(`   - 网站发布: ${articleConfig.publish.website}`);
                console.log(`   - 微信公众号A: ${articleConfig.publish.wechat_a}`);
                console.log(`   - 微信公众号B: ${articleConfig.publish.wechat_b}`);

            } catch (error) {
                console.error(`❌ 处理文件失败 ${filePath}:`, error.message);
                errorCount++;
                continue;
            }
        }

        // 输出详细的解析结果
        console.log(`\n📊 解析结果汇总:`);
        console.log(`   - 处理文件总数: ${changedFiles.length}`);
        console.log(`   - 成功解析: ${processedCount}`);
        console.log(`   - 解析失败: ${errorCount}`);
        console.log(`   - 有效文章: ${articlesConfig.length}`);
        console.log(`   - 需要网站发布: ${hasWebsite}`);
        console.log(`   - 需要微信发布: ${hasWechat}`);

        // 输出文章详情
        if (articlesConfig.length > 0) {
            console.log(`\n📝 文章详情:`);
            articlesConfig.forEach((article, index) => {
                console.log(`   ${index + 1}. ${article.title}`);
                console.log(`      文件: ${article.filePath}`);
                console.log(`      网站: ${article.publish.website ? '✅' : '❌'}`);
                console.log(`      微信A: ${article.publish.wechat_a ? '✅' : '❌'}`);
                console.log(`      微信B: ${article.publish.wechat_b ? '✅' : '❌'}`);
                if (article.publish.schedule) {
                    console.log(`      定时: ${article.publish.schedule}`);
                }
            });
        }

        // 设置GitHub Actions输出
        try {
            const core = require('@actions/core');
            core.setOutput('has-website', hasWebsite.toString());
            core.setOutput('has-wechat', hasWechat.toString());
            core.setOutput('articles-config', JSON.stringify(articlesConfig));
            core.setOutput('processed-count', processedCount.toString());
            core.setOutput('error-count', errorCount.toString());
        } catch (error) {
            // 在本地测试时，@actions/core可能不可用
            console.log('\n🔧 GitHub Actions输出（本地测试时忽略）:');
            console.log(`   has-website=${hasWebsite}`);
            console.log(`   has-wechat=${hasWechat}`);
            console.log(`   processed-count=${processedCount}`);
            console.log(`   error-count=${errorCount}`);
        }

        // 保存配置到文件
        const configData = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFiles: changedFiles.length,
                processedCount,
                errorCount,
                articlesCount: articlesConfig.length,
                hasWebsite,
                hasWechat
            },
            articles: articlesConfig
        };

        fs.writeFileSync('articles-config.json', JSON.stringify(configData, null, 2));
        console.log('\n💾 配置已保存到 articles-config.json');

        // 如果有错误但仍有成功的文章，继续执行
        if (errorCount > 0 && articlesConfig.length === 0) {
            console.error('❌ 所有文章解析都失败了');
            process.exit(1);
        }

        return {
            hasWebsite,
            hasWechat,
            articlesConfig,
            processedCount,
            errorCount
        };

    } catch (error) {
        console.error('❌ 解析文章配置失败:', error);
        console.error('错误堆栈:', error.stack);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    parseArticles();
}

module.exports = { parseArticles };
