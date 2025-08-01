/**
 * 数据验证工具 - 验证修复后的数据质量
 */

interface DataVerificationResult {
  passed: boolean;
  message: string;
  details: {
    articlesChecked: number;
    untitledCount: number;
    mockDataCount: number;
    consistentDataCount: number;
    issues: string[];
  };
}

export class DataVerifier {
  /**
   * 验证文章数据质量
   */
  static async verifyArticleData(): Promise<DataVerificationResult> {
    try {
      const response = await fetch('/api/articles?limit=100');
      const data = await response.json();

      if (!data.success) {
        return {
          passed: false,
          message: '无法获取文章数据',
          details: {
            articlesChecked: 0,
            untitledCount: 0,
            mockDataCount: 0,
            consistentDataCount: 0,
            issues: ['API调用失败'],
          },
        };
      }

      const articles = data.data;
      const issues: string[] = [];
      let untitledCount = 0;
      let mockDataCount = 0;
      let consistentDataCount = 0;

      // 检查每篇文章
      articles.forEach((article: any, index: number) => {
        // 检查标题问题
        if (!article.title || 
            article.title === 'Untitled' || 
            article.title === '未命名文章' ||
            article.title.trim() === '') {
          untitledCount++;
          issues.push(`文章${index + 1}: 标题为空或未命名 - "${article.title}"`);
        }

        // 检查统计数据一致性
        if (article.stats) {
          // 检查是否为明显的随机数据（连续调用应该返回相同数据）
          const { views, likes, shares } = article.stats;
          
          // 检查数据合理性
          if (views < 0 || likes < 0 || shares < 0) {
            issues.push(`文章${index + 1}: 统计数据包含负数`);
            mockDataCount++;
          } else if (views > 10000 || likes > 1000 || shares > 500) {
            issues.push(`文章${index + 1}: 统计数据异常高 (views:${views}, likes:${likes}, shares:${shares})`);
            mockDataCount++;
          } else {
            consistentDataCount++;
          }
        } else {
          issues.push(`文章${index + 1}: 缺少统计数据`);
        }
      });

      const passed = untitledCount === 0 && mockDataCount === 0;

      return {
        passed,
        message: passed 
          ? `数据质量验证通过 (${articles.length}篇文章)` 
          : `发现${issues.length}个问题`,
        details: {
          articlesChecked: articles.length,
          untitledCount,
          mockDataCount,
          consistentDataCount,
          issues: issues.slice(0, 10), // 只显示前10个问题
        },
      };

    } catch (error) {
      return {
        passed: false,
        message: `验证过程中发生错误: ${error.message}`,
        details: {
          articlesChecked: 0,
          untitledCount: 0,
          mockDataCount: 0,
          consistentDataCount: 0,
          issues: [error.message],
        },
      };
    }
  }

  /**
   * 验证统计数据一致性
   */
  static async verifyStatsConsistency(): Promise<DataVerificationResult> {
    try {
      // 连续调用两次相同的API，检查统计数据是否一致
      const [response1, response2] = await Promise.all([
        fetch('/api/analytics?type=overview'),
        fetch('/api/analytics?type=overview'),
      ]);

      const [data1, data2] = await Promise.all([
        response1.json(),
        response2.json(),
      ]);

      if (!data1.success || !data2.success) {
        return {
          passed: false,
          message: 'API调用失败',
          details: {
            articlesChecked: 0,
            untitledCount: 0,
            mockDataCount: 0,
            consistentDataCount: 0,
            issues: ['API调用失败'],
          },
        };
      }

      const issues: string[] = [];
      
      // 检查关键统计数据是否一致
      const fields = ['totalViews', 'totalLikes', 'totalShares', 'totalArticles'];
      
      fields.forEach(field => {
        if (data1.data[field] !== data2.data[field]) {
          issues.push(`${field}不一致: 第一次=${data1.data[field]}, 第二次=${data2.data[field]}`);
        }
      });

      // 检查变化率是否一致（应该在缓存期内保持一致）
      const changeFields = ['viewsChange', 'likesChange', 'sharesChange'];
      
      changeFields.forEach(field => {
        const diff = Math.abs(data1.data[field] - data2.data[field]);
        if (diff > 0.1) { // 允许0.1的误差
          issues.push(`${field}不一致: 第一次=${data1.data[field]}, 第二次=${data2.data[field]}`);
        }
      });

      const passed = issues.length === 0;

      return {
        passed,
        message: passed 
          ? '统计数据一致性验证通过' 
          : `发现${issues.length}个一致性问题`,
        details: {
          articlesChecked: 0,
          untitledCount: 0,
          mockDataCount: issues.length,
          consistentDataCount: passed ? 1 : 0,
          issues,
        },
      };

    } catch (error) {
      return {
        passed: false,
        message: `一致性验证过程中发生错误: ${error.message}`,
        details: {
          articlesChecked: 0,
          untitledCount: 0,
          mockDataCount: 0,
          consistentDataCount: 0,
          issues: [error.message],
        },
      };
    }
  }

  /**
   * 运行完整的数据验证
   */
  static async runFullVerification(): Promise<{
    articleData: DataVerificationResult;
    statsConsistency: DataVerificationResult;
    overall: {
      passed: boolean;
      message: string;
      summary: string;
    };
  }> {
    console.log('🔍 开始数据质量验证...');

    const articleData = await this.verifyArticleData();
    console.log('📝 文章数据质量:', articleData.passed ? '✅ 通过' : '❌ 失败');

    const statsConsistency = await this.verifyStatsConsistency();
    console.log('📊 统计数据一致性:', statsConsistency.passed ? '✅ 通过' : '❌ 失败');

    const overallPassed = articleData.passed && statsConsistency.passed;
    const failedTests = [
      !articleData.passed && '文章数据质量',
      !statsConsistency.passed && '统计数据一致性',
    ].filter(Boolean);

    const overall = {
      passed: overallPassed,
      message: overallPassed 
        ? '所有数据质量验证通过' 
        : `${failedTests.length}项验证失败: ${failedTests.join(', ')}`,
      summary: `总计2项验证，${overallPassed ? '全部通过' : `${2 - failedTests.length}项通过，${failedTests.length}项失败`}`,
    };

    console.log('🎯 验证总结:', overall.message);

    return {
      articleData,
      statsConsistency,
      overall,
    };
  }
}

// 导出便捷函数
export const verifyDataQuality = DataVerifier.runFullVerification;
