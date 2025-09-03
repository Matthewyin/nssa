#!/usr/bin/env node

/**
 * 迁移脚本：将现有文章迁移到新的嵌套目录结构
 * 
 * 使用方法：
 * node scripts/migrate-to-nested-structure.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTS_DIR = path.join(__dirname, '../src/content/posts');
const BACKUP_DIR = path.join(__dirname, '../backup/posts');

// 分类映射
const CATEGORY_MAPPING = {
  'business': ['business', 'commercial', 'enterprise'],
  'tech': ['tech', 'technology', 'technical'],
  'psychology': ['psychology', 'mental', 'behavior'],
  'workplace': ['workplace', 'work', 'career'],
  'history': ['history', 'historical']
};

/**
 * 从文件名或内容中推断分类
 */
function inferCategory(filename, frontmatter) {
  // 首先检查frontmatter中的category字段
  if (frontmatter.category) {
    return frontmatter.category;
  }
  
  // 检查categories数组
  if (frontmatter.categories && frontmatter.categories.length > 0) {
    return frontmatter.categories[0];
  }
  
  // 从文件名推断
  const lowerFilename = filename.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_MAPPING)) {
    if (keywords.some(keyword => lowerFilename.includes(keyword))) {
      return category;
    }
  }
  
  // 默认分类
  return 'tech';
}

/**
 * 解析frontmatter
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { frontmatter: {}, content };
  }
  
  const frontmatterText = match[1];
  const bodyContent = content.replace(frontmatterRegex, '').trim();
  
  // 简单的YAML解析（仅支持基本格式）
  const frontmatter = {};
  const lines = frontmatterText.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const colonIndex = trimmedLine.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmedLine.substring(0, colonIndex).trim();
        let value = trimmedLine.substring(colonIndex + 1).trim();
        
        // 移除引号
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        // 处理数组
        if (value.startsWith('[') && value.endsWith(']')) {
          value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
        }
        
        frontmatter[key] = value;
      }
    }
  }
  
  return { frontmatter, content: bodyContent };
}

/**
 * 生成新的frontmatter
 */
function generateFrontmatter(frontmatter, category, articleName) {
  const newFrontmatter = { ...frontmatter };
  
  // 添加新字段
  newFrontmatter.category = category;
  newFrontmatter.slug = `${category}/${articleName}`;
  
  // 确保categories数组包含分类
  if (!newFrontmatter.categories) {
    newFrontmatter.categories = [category];
  } else if (!newFrontmatter.categories.includes(category)) {
    newFrontmatter.categories.unshift(category);
  }
  
  // 生成YAML
  let yaml = '---\n';
  for (const [key, value] of Object.entries(newFrontmatter)) {
    if (Array.isArray(value)) {
      yaml += `${key}: [${value.map(v => `"${v}"`).join(', ')}]\n`;
    } else if (typeof value === 'string') {
      yaml += `${key}: "${value}"\n`;
    } else {
      yaml += `${key}: ${value}\n`;
    }
  }
  yaml += '---\n\n';
  
  return yaml;
}

/**
 * 创建备份
 */
function createBackup() {
  console.log('创建备份...');
  
  if (fs.existsSync(BACKUP_DIR)) {
    fs.rmSync(BACKUP_DIR, { recursive: true });
  }
  
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  
  // 复制所有现有文件到备份目录
  const files = fs.readdirSync(POSTS_DIR);
  for (const file of files) {
    const srcPath = path.join(POSTS_DIR, file);
    const destPath = path.join(BACKUP_DIR, file);
    
    if (fs.statSync(srcPath).isFile() && file.endsWith('.md')) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  
  console.log(`备份完成：${BACKUP_DIR}`);
}

/**
 * 迁移文章
 */
function migrateArticles() {
  console.log('开始迁移文章...');
  
  const files = fs.readdirSync(POSTS_DIR);
  const mdFiles = files.filter(file => file.endsWith('.md') && fs.statSync(path.join(POSTS_DIR, file)).isFile());
  
  for (const file of mdFiles) {
    const filePath = path.join(POSTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter, content: bodyContent } = parseFrontmatter(content);
    
    // 推断分类和文章名
    const category = inferCategory(file, frontmatter);
    const articleName = path.basename(file, '.md');
    
    // 创建新目录
    const newDir = path.join(POSTS_DIR, category, articleName);
    fs.mkdirSync(newDir, { recursive: true });
    
    // 生成新的frontmatter
    const newFrontmatter = generateFrontmatter(frontmatter, category, articleName);
    const newContent = newFrontmatter + bodyContent;
    
    // 写入新文件
    const newFilePath = path.join(newDir, 'index.md');
    fs.writeFileSync(newFilePath, newContent);
    
    // 删除原文件
    fs.unlinkSync(filePath);
    
    console.log(`迁移完成：${file} -> ${category}/${articleName}/index.md`);
  }
}

/**
 * 创建目录结构说明文件
 */
function createDocumentation() {
  const docContent = `# 新的目录结构说明

## 目录结构

\`\`\`
src/content/posts/
├── business/
│   ├── article-name-1/
│   │   ├── index.md
│   │   ├── image1.jpg
│   │   └── image2.png
│   └── article-name-2/
│       ├── index.md
│       └── chart.png
├── tech/
├── psychology/
├── workplace/
└── history/
\`\`\`

## 使用说明

1. **文章文件**：每篇文章的主要内容放在 \`index.md\` 文件中
2. **图片文件**：文章相关的图片直接放在同一目录下
3. **相对路径**：在文章中使用相对路径引用图片，如 \`![描述](./image.jpg)\`

## 迁移完成

所有现有文章已按照新的目录结构重新组织。原文件已备份到 \`backup/posts/\` 目录。

迁移时间：${new Date().toISOString()}
`;

  fs.writeFileSync(path.join(POSTS_DIR, 'README.md'), docContent);
}

/**
 * 主函数
 */
function main() {
  console.log('开始迁移到嵌套目录结构...');
  
  try {
    // 创建备份
    createBackup();
    
    // 迁移文章
    migrateArticles();
    
    // 创建说明文档
    createDocumentation();
    
    console.log('\n✅ 迁移完成！');
    console.log('📁 新的目录结构已创建');
    console.log('💾 原文件已备份到 backup/posts/ 目录');
    console.log('📖 查看 src/content/posts/README.md 了解新结构');
    
  } catch (error) {
    console.error('❌ 迁移失败：', error.message);
    process.exit(1);
  }
}

// 运行迁移
main();
