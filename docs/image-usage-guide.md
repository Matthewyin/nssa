# 图片使用指南

本指南介绍如何在NSSA网站的文章中插入和管理图片。

## 1. 新的目录结构（推荐）

### 专题目录 → 文章目录 → 文档和图片文件

```
src/content/posts/
├── business/
│   ├── digital-transformation-2025/
│   │   ├── index.md              # 文章内容
│   │   ├── hero-image.jpg        # 文章图片
│   │   ├── chart-1.png           # 图表
│   │   └── diagram.svg           # 图解
│   └── market-analysis/
│       ├── index.md
│       ├── cover.jpg
│       └── data-chart.png
├── tech/
│   ├── ai-trends-2025/
│   │   ├── index.md
│   │   ├── ai-timeline.jpg
│   │   └── comparison-chart.png
│   └── web-development/
│       ├── index.md
│       └── code-example.png
├── psychology/
├── workplace/
└── history/
```

### 优势

1. **集中管理**：每篇文章的所有资源在同一目录
2. **便于维护**：修改文章时只需操作一个目录
3. **版本控制友好**：Git可以很好地跟踪整个文章的变更
4. **相对路径**：图片使用相对路径，移动文章时不会断链

## 2. 在新目录结构中使用图片

### 方法一：相对路径（推荐）

在新的目录结构中，图片和文章在同一目录下，使用相对路径引用：

```markdown
---
title: "数字化转型2025"
description: "企业变革的关键策略"
category: "business"
slug: "digital-transformation-2025"
image: "./hero-image.jpg"  # 相对路径引用封面图
---

# 数字化转型2025

![数字化转型概览](./hero-image.jpg)

## AI应用场景

![AI应用图表](./ai-applications-chart.png)
```

### 方法二：HTML标签（更多控制）

```markdown
<img src="/images/posts/2025/01/my-article/example.jpg" 
     alt="图片描述" 
     width="600" 
     height="400" 
     class="rounded-lg shadow-lg mx-auto" />
```

### 方法三：使用OptimizedImage组件

```markdown
import OptimizedImage from '../../components/OptimizedImage.astro';

<OptimizedImage 
  src="/images/posts/2025/01/my-article/example.jpg"
  alt="图片描述"
  caption="这是图片说明文字"
  width={800}
  height={600}
/>
```

### 方法四：使用图片画廊

```markdown
import ImageGallery from '../../components/ImageGallery.astro';

<ImageGallery 
  images={[
    {
      src: "/images/posts/2025/01/my-article/gallery1.jpg",
      alt: "图片1描述",
      caption: "图片1说明"
    },
    {
      src: "/images/posts/2025/01/my-article/gallery2.jpg",
      alt: "图片2描述",
      caption: "图片2说明"
    }
  ]}
  columns={3}
/>
```

## 3. 图片优化建议

### 文件格式选择
- **JPEG**: 适合照片和复杂图像
- **PNG**: 适合图标、截图和需要透明背景的图像
- **WebP**: 现代格式，文件更小，质量更好

### 文件大小优化
- 文章图片建议宽度：800-1200px
- 封面图片建议尺寸：1200x630px（适合社交媒体分享）
- 文件大小控制在200KB以内

### 命名规范
```
# 好的命名
business-analysis-chart.jpg
tech-trends-2025-graph.png
user-interface-mockup.png

# 避免的命名
IMG_001.jpg
screenshot.png
image.jpg
```

## 4. 响应式图片

### 使用srcset属性
```html
<img src="/images/posts/example.jpg"
     srcset="/images/posts/example-320.jpg 320w,
             /images/posts/example-640.jpg 640w,
             /images/posts/example-1024.jpg 1024w"
     sizes="(max-width: 768px) 100vw, 50vw"
     alt="响应式图片示例" />
```

### 使用OptimizedImage组件（自动处理）
```markdown
<OptimizedImage 
  src="/images/posts/example.jpg"
  alt="自动响应式图片"
  sizes="(max-width: 768px) 100vw, 80vw"
/>
```

## 5. 图片SEO优化

### Alt文本最佳实践
```markdown
<!-- 好的alt文本 -->
![2025年技术趋势分析图表，显示AI、区块链、云计算的发展趋势](/images/tech-trends-2025.jpg)

<!-- 避免的alt文本 -->
![图片](/images/image.jpg)
![](/images/chart.jpg)
```

### 图片文件名SEO
```
# SEO友好的文件名
business-growth-strategy-2025.jpg
artificial-intelligence-trends.png
user-experience-design-principles.jpg

# 不友好的文件名
IMG_20250103_001.jpg
untitled.png
新建图片.jpg
```

## 6. 图片懒加载

所有图片组件都默认启用懒加载：

```markdown
<OptimizedImage 
  src="/images/posts/example.jpg"
  alt="懒加载图片"
  loading="lazy"  <!-- 默认值 -->
/>

<!-- 重要图片可以设置立即加载 -->
<OptimizedImage 
  src="/images/posts/hero-image.jpg"
  alt="首屏重要图片"
  loading="eager"
/>
```

## 7. 图片版权和来源

### 在文章中标注图片来源
```markdown
<OptimizedImage 
  src="/images/posts/example.jpg"
  alt="示例图片"
  caption="图片来源：Unsplash / 摄影师姓名"
/>
```

### 推荐的免费图片资源
- [Unsplash](https://unsplash.com/) - 高质量免费照片
- [Pexels](https://www.pexels.com/) - 免费股票照片
- [Pixabay](https://pixabay.com/) - 免费图片和矢量图
- [Freepik](https://www.freepik.com/) - 免费矢量图和插画

## 8. 常见问题解决

### 图片不显示
1. 检查文件路径是否正确
2. 确认图片文件存在于public目录
3. 检查文件名大小写是否匹配

### 图片加载慢
1. 优化图片大小和格式
2. 使用WebP格式
3. 启用懒加载
4. 使用CDN（如需要）

### 移动端显示问题
1. 使用响应式图片
2. 设置合适的sizes属性
3. 测试不同屏幕尺寸

## 9. 示例文章模板

```markdown
---
title: "示例文章：如何使用图片"
description: "展示在文章中使用图片的各种方法"
image: "/images/posts/covers/image-usage-example.jpg"
date: 2025-01-03
categories: ["tech"]
tags: ["图片", "教程"]
---

# 示例文章：如何使用图片

这是文章的开头段落。

## 单张图片示例

<OptimizedImage 
  src="/images/posts/2025/01/image-example/single-image.jpg"
  alt="单张图片示例"
  caption="这是一张示例图片，展示了如何在文章中插入单张图片"
  width={800}
  height={600}
/>

## 图片画廊示例

<ImageGallery 
  images={[
    {
      src: "/images/posts/2025/01/image-example/gallery1.jpg",
      alt: "画廊图片1",
      caption: "画廊中的第一张图片"
    },
    {
      src: "/images/posts/2025/01/image-example/gallery2.jpg",
      alt: "画廊图片2", 
      caption: "画廊中的第二张图片"
    },
    {
      src: "/images/posts/2025/01/image-example/gallery3.jpg",
      alt: "画廊图片3",
      caption: "画廊中的第三张图片"
    }
  ]}
  columns={3}
/>

## 内联图片示例

在段落中插入图片：这是一段文字 ![小图标](/images/posts/2025/01/image-example/icon.png) 继续文字内容。

## 总结

通过以上示例，您可以看到在NSSA网站中使用图片的各种方法。
```

---

遵循这个指南，您可以在文章中有效地使用图片，提升内容的视觉效果和用户体验。
