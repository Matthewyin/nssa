/**
 * 数据一致性测试工具
 * 用于验证仪表板和数据统计页面的数据一致性
 */

interface ConsistencyTestResult {
  passed: boolean;
  message: string;
  details: {
    dashboard: any;
    analytics: any;
    differences: string[];
  };
}

export class DataConsistencyTester {
  /**
   * 测试仪表板和数据统计页面的数据一致性
   */
  static async testDashboardAnalyticsConsistency(): Promise<ConsistencyTestResult> {
    try {
      // 并行获取两个页面使用的相同API数据
      const [dashboardRes, analyticsRes] = await Promise.all([
        fetch('/api/analytics?type=overview'),
        fetch('/api/analytics?type=overview'),
      ]);

      const [dashboardData, analyticsData] = await Promise.all([
        dashboardRes.json(),
        analyticsRes.json(),
      ]);

      if (!dashboardData.success || !analyticsData.success) {
        return {
          passed: false,
          message: 'API调用失败',
          details: {
            dashboard: dashboardData,
            analytics: analyticsData,
            differences: ['API调用失败'],
          },
        };
      }

      // 检查关键字段是否一致
      const differences: string[] = [];
      const dashData = dashboardData.data;
      const anaData = analyticsData.data;

      // 检查数值字段
      const numericFields = [
        'totalViews',
        'totalLikes', 
        'totalShares',
        'totalArticles',
        'publishedArticles',
        'draftArticles',
      ];

      numericFields.forEach(field => {
        if (dashData[field] !== anaData[field]) {
          differences.push(`${field}: 仪表板=${dashData[field]}, 统计页=${anaData[field]}`);
        }
      });

      // 检查变化率字段（应该在小数点后1位精度内一致）
      const changeFields = [
        'viewsChange',
        'likesChange',
        'sharesChange', 
        'articlesChange',
      ];

      changeFields.forEach(field => {
        const dashValue = Number(dashData[field]?.toFixed(1));
        const anaValue = Number(anaData[field]?.toFixed(1));
        if (dashValue !== anaValue) {
          differences.push(`${field}: 仪表板=${dashValue}%, 统计页=${anaValue}%`);
        }
      });

      // 检查缓存状态
      if (dashboardData.cached !== analyticsData.cached) {
        differences.push(`缓存状态不一致: 仪表板=${dashboardData.cached}, 统计页=${analyticsData.cached}`);
      }

      return {
        passed: differences.length === 0,
        message: differences.length === 0 
          ? '数据一致性检查通过' 
          : `发现${differences.length}个不一致项`,
        details: {
          dashboard: dashData,
          analytics: anaData,
          differences,
        },
      };

    } catch (error) {
      return {
        passed: false,
        message: `测试过程中发生错误: ${error.message}`,
        details: {
          dashboard: null,
          analytics: null,
          differences: [error.message],
        },
      };
    }
  }

  /**
   * 测试缓存一致性
   */
  static async testCacheConsistency(): Promise<ConsistencyTestResult> {
    try {
      // 连续调用同一个API多次，检查是否返回一致的数据
      const requests = Array.from({ length: 3 }, () => 
        fetch('/api/analytics?type=overview').then(res => res.json())
      );

      const responses = await Promise.all(requests);
      
      if (!responses.every(res => res.success)) {
        return {
          passed: false,
          message: '部分API调用失败',
          details: {
            dashboard: null,
            analytics: null,
            differences: ['API调用失败'],
          },
        };
      }

      // 检查所有响应的数据是否一致
      const firstData = responses[0].data;
      const differences: string[] = [];

      responses.slice(1).forEach((response, index) => {
        const data = response.data;
        
        // 检查关键字段
        ['totalViews', 'totalLikes', 'viewsChange', 'likesChange'].forEach(field => {
          if (JSON.stringify(firstData[field]) !== JSON.stringify(data[field])) {
            differences.push(`请求${index + 2}的${field}字段与第一次请求不一致`);
          }
        });
      });

      // 检查是否都使用了缓存（除了第一次请求）
      const cacheStatuses = responses.map(res => res.cached);
      if (cacheStatuses[0] !== false) {
        differences.push('第一次请求应该不使用缓存');
      }
      if (!cacheStatuses.slice(1).every(cached => cached === true)) {
        differences.push('后续请求应该都使用缓存');
      }

      return {
        passed: differences.length === 0,
        message: differences.length === 0 
          ? '缓存一致性检查通过' 
          : `发现${differences.length}个缓存问题`,
        details: {
          dashboard: responses[0],
          analytics: responses[1],
          differences,
        },
      };

    } catch (error) {
      return {
        passed: false,
        message: `缓存测试过程中发生错误: ${error.message}`,
        details: {
          dashboard: null,
          analytics: null,
          differences: [error.message],
        },
      };
    }
  }

  /**
   * 运行完整的数据一致性测试套件
   */
  static async runFullTest(): Promise<{
    dashboardAnalytics: ConsistencyTestResult;
    cache: ConsistencyTestResult;
    overall: {
      passed: boolean;
      message: string;
      summary: string;
    };
  }> {
    console.log('🔍 开始数据一致性测试...');

    const dashboardAnalytics = await this.testDashboardAnalyticsConsistency();
    console.log('📊 仪表板-统计页一致性:', dashboardAnalytics.passed ? '✅ 通过' : '❌ 失败');

    const cache = await this.testCacheConsistency();
    console.log('💾 缓存一致性:', cache.passed ? '✅ 通过' : '❌ 失败');

    const overallPassed = dashboardAnalytics.passed && cache.passed;
    const failedTests = [
      !dashboardAnalytics.passed && '仪表板-统计页一致性',
      !cache.passed && '缓存一致性',
    ].filter(Boolean);

    const overall = {
      passed: overallPassed,
      message: overallPassed 
        ? '所有数据一致性测试通过' 
        : `${failedTests.length}项测试失败: ${failedTests.join(', ')}`,
      summary: `总计2项测试，${overallPassed ? '全部通过' : `${2 - failedTests.length}项通过，${failedTests.length}项失败`}`,
    };

    console.log('🎯 测试总结:', overall.message);

    return {
      dashboardAnalytics,
      cache,
      overall,
    };
  }
}

// 导出便捷函数
export const testDataConsistency = DataConsistencyTester.runFullTest;
