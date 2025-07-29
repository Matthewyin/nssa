#!/usr/bin/env node

// 尝试加载dotenv，如果不存在则跳过
try {
    require('dotenv').config();
} catch (error) {
    console.log('⚠️  dotenv模块未找到，请运行: npm install dotenv');
    process.exit(1);
}

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * NSSA 本地发布系统
 * 支持本地发布到网站和微信公众号
 */

class LocalPublisher {
    constructor() {
        this.args = process.argv.slice(2);
        this.options = this.parseArgs();
        this.config = this.loadConfig();
        
        console.log('🚀 NSSA 本地发布系统启动');
        console.log(`📁 项目根目录: ${this.config.projectRoot}`);
        console.log(`⚙️  发布模式: ${this.getPublishMode()}`);
    }

    /**
     * 解析命令行参数
     */
    parseArgs() {
        const options = {
            websiteOnly: false,
            wechatOnly: false,
            all: false,
            force: false,
            verbose: false
        };

        this.args.forEach(arg => {
            switch (arg) {
                case '--website-only':
                    options.websiteOnly = true;
                    break;
                case '--wechat-only':
                    options.wechatOnly = true;
                    break;
                case '--all':
                    options.all = true;
                    break;
                case '--force':
                    options.force = true;
                    break;
                case '--verbose':
                    options.verbose = true;
                    break;
            }
        });

        return options;
    }

    /**
     * 加载配置
     */
    loadConfig() {
        return {
            projectRoot: process.env.PROJECT_ROOT || '.',
            contentDir: process.env.CONTENT_DIR || 'content',
            outputDir: process.env.OUTPUT_DIR || 'public',
            hugoEnv: process.env.HUGO_ENV || 'production',
            debug: process.env.DEBUG === 'true',
            verbose: process.env.VERBOSE === 'true' || this.options.verbose,
            skipWebsiteBuild: process.env.SKIP_WEBSITE_BUILD === 'true',
            skipWechatPublish: process.env.SKIP_WECHAT_PUBLISH === 'true',
            
            // 微信配置
            wechatA: {
                appId: process.env.WECHAT_A_APPID,
                secret: process.env.WECHAT_A_SECRET
            },
            wechatB: {
                appId: process.env.WECHAT_B_APPID,
                secret: process.env.WECHAT_B_SECRET
            },
            
            // Cloudflare配置
            cloudflareToken: process.env.CLOUDFLARE_API_TOKEN
        };
    }

    /**
     * 获取发布模式描述
     */
    getPublishMode() {
        if (this.options.websiteOnly) return '仅网站';
        if (this.options.wechatOnly) return '仅微信';
        if (this.options.all) return '全平台';
        return '智能检测';
    }

    /**
     * 检测变更的文章
     */
    detectChangedArticles() {
        console.log('\n📄 检测文章变更...');
        
        try {
            // 获取所有Markdown文件
            const contentPath = path.join(this.config.projectRoot, this.config.contentDir);
            const allFiles = this.getAllMarkdownFiles(contentPath);
            
            if (this.options.force || this.options.all) {
                console.log(`🔄 强制模式：处理所有 ${allFiles.length} 个文件`);
                return allFiles;
            }
            
            // 检测Git变更（如果在Git仓库中）
            try {
                const gitChanges = execSync('git diff --name-only HEAD~1 HEAD', { 
                    encoding: 'utf8',
                    cwd: this.config.projectRoot 
                }).trim();
                
                const changedMdFiles = gitChanges
                    .split('\n')
                    .filter(file => file.startsWith(this.config.contentDir) && file.endsWith('.md'))
                    .filter(file => fs.existsSync(path.join(this.config.projectRoot, file)));
                
                if (changedMdFiles.length > 0) {
                    console.log(`📝 检测到 ${changedMdFiles.length} 个变更文件`);
                    return changedMdFiles;
                }
            } catch (error) {
                console.log('⚠️  Git检测失败，使用全部文件模式');
            }
            
            // 如果没有Git变更，检查最近修改的文件
            const recentFiles = allFiles.filter(file => {
                const fullPath = path.join(this.config.projectRoot, file);
                const stats = fs.statSync(fullPath);
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return stats.mtime > dayAgo;
            });
            
            if (recentFiles.length > 0) {
                console.log(`🕒 检测到 ${recentFiles.length} 个最近修改的文件`);
                return recentFiles;
            }
            
            console.log('ℹ️  未检测到变更，使用全部文件');
            return allFiles.slice(0, 10); // 限制最多10个文件
            
        } catch (error) {
            console.error('❌ 检测文章变更失败:', error.message);
            return [];
        }
    }

    /**
     * 递归获取所有Markdown文件
     */
    getAllMarkdownFiles(dir, baseDir = null) {
        if (!baseDir) baseDir = this.config.projectRoot;
        
        const files = [];
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const relativePath = path.relative(baseDir, fullPath);
            
            if (fs.statSync(fullPath).isDirectory()) {
                files.push(...this.getAllMarkdownFiles(fullPath, baseDir));
            } else if (item.endsWith('.md')) {
                files.push(relativePath);
            }
        }
        
        return files;
    }

    /**
     * 主发布流程
     */
    async publish() {
        try {
            console.log('\n🎯 开始发布流程...');
            
            // 1. 检测变更文章
            const changedFiles = this.detectChangedArticles();
            if (changedFiles.length === 0) {
                console.log('✅ 没有需要发布的文章');
                return;
            }
            
            // 2. 解析文章配置
            console.log('\n📋 解析文章配置...');
            process.env.CHANGED_FILES = JSON.stringify(changedFiles);
            
            const parseScript = path.join(__dirname, 'parse-articles.js');
            execSync(`node "${parseScript}"`, { 
                stdio: 'inherit',
                cwd: this.config.projectRoot 
            });
            
            // 3. 读取解析结果
            const configPath = path.join(this.config.projectRoot, 'articles-config.json');
            if (!fs.existsSync(configPath)) {
                throw new Error('文章配置解析失败');
            }
            
            const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            const articles = Array.isArray(configData) ? configData : (configData.articles || []);
            
            console.log(`📚 解析完成，共 ${articles.length} 篇文章待发布`);
            
            // 4. 网站发布
            if (!this.options.wechatOnly && !this.config.skipWebsiteBuild) {
                await this.publishWebsite(articles);
            }
            
            // 5. 微信发布
            if (!this.options.websiteOnly && !this.config.skipWechatPublish) {
                await this.publishWechat(articles);
            }
            
            console.log('\n🎉 发布流程完成！');
            
        } catch (error) {
            console.error('\n❌ 发布失败:', error.message);
            if (this.config.debug) {
                console.error('错误详情:', error.stack);
            }
            process.exit(1);
        }
    }

    /**
     * 发布网站
     */
    async publishWebsite(articles) {
        console.log('\n🌐 开始网站发布...');
        
        const websiteArticles = articles.filter(article => article.publish?.website);
        if (websiteArticles.length === 0) {
            console.log('⏭️  没有需要发布到网站的文章');
            return;
        }
        
        console.log(`📄 ${websiteArticles.length} 篇文章将发布到网站`);
        
        try {
            // 构建Hugo网站
            console.log('🔨 构建Hugo网站...');
            execSync('hugo --minify --gc', { 
                stdio: 'inherit',
                cwd: this.config.projectRoot,
                env: { ...process.env, HUGO_ENV: this.config.hugoEnv }
            });
            
            // 部署到Cloudflare
            if (this.config.cloudflareToken) {
                console.log('☁️  部署到Cloudflare...');
                execSync('wrangler deploy', { 
                    stdio: 'inherit',
                    cwd: this.config.projectRoot 
                });
                console.log('✅ 网站发布成功');
            } else {
                console.log('⚠️  未配置Cloudflare Token，跳过部署');
            }
            
        } catch (error) {
            console.error('❌ 网站发布失败:', error.message);
            throw error;
        }
    }

    /**
     * 发布微信公众号
     */
    async publishWechat(articles) {
        console.log('\n📱 开始微信公众号发布...');
        
        const wechatArticles = articles.filter(article => 
            article.publish?.wechat_a || article.publish?.wechat_b
        );
        
        if (wechatArticles.length === 0) {
            console.log('⏭️  没有需要发布到微信的文章');
            return;
        }
        
        console.log(`📄 ${wechatArticles.length} 篇文章将发布到微信公众号`);
        
        try {
            // 设置环境变量
            process.env.ARTICLES_CONFIG = JSON.stringify(wechatArticles);
            
            // 执行微信发布脚本
            const wechatScript = path.join(__dirname, 'publish-wechat.js');
            execSync(`node "${wechatScript}"`, { 
                stdio: 'inherit',
                cwd: this.config.projectRoot 
            });
            
            console.log('✅ 微信发布完成');
            
        } catch (error) {
            console.error('❌ 微信发布失败:', error.message);
            throw error;
        }
    }
}

// 主程序入口
if (require.main === module) {
    const publisher = new LocalPublisher();
    publisher.publish().catch(error => {
        console.error('💥 发布系统异常:', error.message);
        process.exit(1);
    });
}

module.exports = LocalPublisher;
