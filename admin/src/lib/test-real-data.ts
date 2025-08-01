/**
 * 真实数据系统测试工具
 */

export class RealDataTester {
  /**
   * 测试真实统计数据系统
   */
  static async testRealStatsSystem(): Promise<{
    passed: boolean;
    message: string;
    details: any;
  }> {
    try {
      console.log('🧪 开始测试真实统计数据系统...');

      // 1. 检查初始化状态
      console.log('1️⃣ 检查统计数据初始化状态...');
      const initStatusResponse = await fetch('/api/init-stats');
      const initStatus = await initStatusResponse.json();

      if (!initStatus.success) {
        return {
          passed: false,
          message: '无法获取初始化状态',
          details: initStatus,
        };
      }

      // 2. 如果需要初始化，执行初始化
      if (initStatus.data.needsInitialization) {
        console.log('2️⃣ 执行统计数据初始化...');
        const initResponse = await fetch('/api/init-stats', { method: 'POST' });
        const initResult = await initResponse.json();

        if (!initResult.success) {
          return {
            passed: false,
            message: '统计数据初始化失败',
            details: initResult,
          };
        }
        console.log('✅ 统计数据初始化成功');
      } else {
        console.log('✅ 统计数据已初始化');
      }

      // 3. 测试文章API使用真实数据
      console.log('3️⃣ 测试文章API...');
      const articlesResponse = await fetch('/api/articles?limit=5');
      const articlesData = await articlesResponse.json();

      if (!articlesData.success) {
        return {
          passed: false,
          message: '文章API调用失败',
          details: articlesData,
        };
      }

      // 检查文章是否有真实统计数据
      const articles = articlesData.data;
      const hasRealStats = articles.every((article: any) => 
        article.stats && 
        typeof article.stats.views === 'number' &&
        typeof article.stats.likes === 'number' &&
        typeof article.stats.shares === 'number'
      );

      if (!hasRealStats) {
        return {
          passed: false,
          message: '文章API未使用真实统计数据',
          details: { articles: articles.slice(0, 2) },
        };
      }

      // 4. 测试analytics API使用真实数据
      console.log('4️⃣ 测试analytics API...');
      const analyticsResponse = await fetch('/api/analytics?type=overview');
      const analyticsData = await analyticsResponse.json();

      if (!analyticsData.success) {
        return {
          passed: false,
          message: 'Analytics API调用失败',
          details: analyticsData,
        };
      }

      // 5. 测试热门文章不包含Untitled
      console.log('5️⃣ 测试热门文章...');
      const topArticlesResponse = await fetch('/api/analytics?type=articles');
      const topArticlesData = await topArticlesResponse.json();

      if (!topArticlesData.success) {
        return {
          passed: false,
          message: '热门文章API调用失败',
          details: topArticlesData,
        };
      }

      const topArticles = topArticlesData.data.topArticles;
      const hasUntitledArticles = topArticles.some((article: any) => 
        !article.title || 
        article.title === 'Untitled' || 
        article.title === '未命名文章' ||
        article.title.trim() === '' ||
        article.title.length <= 2
      );

      if (hasUntitledArticles) {
        return {
          passed: false,
          message: '热门文章中仍包含无效标题的文章',
          details: { 
            invalidArticles: topArticles.filter((article: any) => 
              !article.title || 
              article.title === 'Untitled' || 
              article.title === '未命名文章' ||
              article.title.trim() === '' ||
              article.title.length <= 2
            )
          },
        };
      }

      // 6. 测试数据一致性
      console.log('6️⃣ 测试数据一致性...');
      const [analytics1, analytics2] = await Promise.all([
        fetch('/api/analytics?type=overview').then(r => r.json()),
        fetch('/api/analytics?type=overview').then(r => r.json()),
      ]);

      const isConsistent = 
        analytics1.data.totalViews === analytics2.data.totalViews &&
        analytics1.data.totalLikes === analytics2.data.totalLikes &&
        analytics1.data.totalShares === analytics2.data.totalShares;

      if (!isConsistent) {
        return {
          passed: false,
          message: '统计数据不一致',
          details: { 
            first: analytics1.data,
            second: analytics2.data,
          },
        };
      }

      // 7. 测试统计数据收集API
      console.log('7️⃣ 测试统计数据收集...');
      if (articles.length > 0) {
        const testArticleId = articles[0].id;
        const originalStats = articles[0].stats;

        // 记录一次浏览
        const viewResponse = await fetch('/api/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'view', articleId: testArticleId }),
        });

        const viewResult = await viewResponse.json();
        if (!viewResult.success) {
          return {
            passed: false,
            message: '统计数据收集失败',
            details: viewResult,
          };
        }

        // 验证浏览量增加
        if (viewResult.data.views !== originalStats.views + 1) {
          return {
            passed: false,
            message: '浏览量未正确增加',
            details: { 
              original: originalStats.views,
              expected: originalStats.views + 1,
              actual: viewResult.data.views,
            },
          };
        }
      }

      console.log('✅ 所有测试通过');

      return {
        passed: true,
        message: '真实统计数据系统测试通过',
        details: {
          initStatus: initStatus.data,
          articlesCount: articles.length,
          topArticlesCount: topArticles.length,
          globalStats: analyticsData.data,
          sampleArticle: articles[0],
        },
      };

    } catch (error) {
      return {
        passed: false,
        message: `测试过程中发生错误: ${error.message}`,
        details: { error: error.message },
      };
    }
  }

  /**
   * 快速验证数据质量
   */
  static async quickDataQualityCheck(): Promise<{
    passed: boolean;
    summary: string;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // 检查文章数据
      const articlesResponse = await fetch('/api/articles?limit=20');
      const articlesData = await articlesResponse.json();

      if (articlesData.success) {
        const articles = articlesData.data;
        
        // 检查标题质量
        articles.forEach((article: any, index: number) => {
          if (!article.title || article.title.trim() === '' || article.title === 'Untitled') {
            issues.push(`文章${index + 1}: 标题无效 - "${article.title}"`);
          }
        });

        // 检查统计数据
        articles.forEach((article: any, index: number) => {
          if (!article.stats || typeof article.stats.views !== 'number') {
            issues.push(`文章${index + 1}: 缺少有效统计数据`);
          }
        });
      } else {
        issues.push('无法获取文章数据');
      }

      // 检查热门文章
      const topResponse = await fetch('/api/analytics?type=articles');
      const topData = await topResponse.json();

      if (topData.success) {
        const invalidTopArticles = topData.data.topArticles.filter((article: any) => 
          !article.title || article.title === 'Untitled' || article.title.trim() === ''
        );

        if (invalidTopArticles.length > 0) {
          issues.push(`热门文章中有${invalidTopArticles.length}篇无效文章`);
        }
      } else {
        issues.push('无法获取热门文章数据');
      }

      const passed = issues.length === 0;
      const summary = passed 
        ? '数据质量检查通过' 
        : `发现${issues.length}个问题`;

      return { passed, summary, issues };

    } catch (error) {
      return {
        passed: false,
        summary: '数据质量检查失败',
        issues: [`检查过程中发生错误: ${error.message}`],
      };
    }
  }
}

// 导出便捷函数
export const testRealDataSystem = RealDataTester.testRealStatsSystem;
export const quickDataCheck = RealDataTester.quickDataQualityCheck;
