const path = require('path');

// 加载环境变量
require('./env.config.js').initEnv();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 环境变量配置 - 读取根目录的.env文件
  env: {
    // 公共环境变量
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
    NEXT_PUBLIC_MAIN_SITE_URL: process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'https://nssa.io',
    NEXT_PUBLIC_TINA_BRANCH: process.env.NEXT_PUBLIC_TINA_BRANCH || 'main',

    // GitHub配置
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_OWNER: process.env.GITHUB_OWNER,
    GITHUB_REPO: process.env.GITHUB_REPO,
    GITHUB_BRANCH: process.env.GITHUB_BRANCH,

    // 微信配置
    WECHAT_A_APPID: process.env.WECHAT_A_APPID,
    WECHAT_A_SECRET: process.env.WECHAT_A_SECRET,
    WECHAT_B_APPID: process.env.WECHAT_B_APPID,
    WECHAT_B_SECRET: process.env.WECHAT_B_SECRET,

    // JWT配置
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,

    // Cloudflare配置
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,

    // 管理员配置
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  },

  // 启用实验性功能
  experimental: {
    // appDir 在 Next.js 14 中已经稳定，不需要在 experimental 中配置
  },
  
  // 图片优化配置
  images: {
    domains: [
      'nssa.io',
      'admin.nssa.io',
      'imagedelivery.net', // Cloudflare Images
      'pub-*.r2.dev', // Cloudflare R2
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 重定向配置
  async redirects() {
    return [
      {
        source: '/',
        destination: '/admin',
        permanent: false,
      },
    ];
  },
  

  
  // Webpack配置
  webpack: (config, { isServer }) => {
    // 处理YAML文件
    config.module.rules.push({
      test: /\.ya?ml$/,
      use: 'js-yaml-loader',
    });
    
    return config;
  },
  
  // 输出配置
  output: 'standalone',
  
  // 压缩配置
  compress: true,
  
  // 电源配置
  poweredByHeader: false,
  
  // 严格模式
  reactStrictMode: true,
  
  // SWC配置
  swcMinify: true,
};

module.exports = nextConfig;
