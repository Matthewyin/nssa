/**
 * 数据一致性检查工具
 */

interface ConsistencyCheck {
  name: string;
  description: string;
  check: () => Promise<ConsistencyResult>;
}

interface ConsistencyResult {
  passed: boolean;
  message: string;
  details?: any;
  suggestions?: string[];
}

class DataConsistencyChecker {
  private checks: ConsistencyCheck[] = [];

  constructor() {
    this.initializeChecks();
  }

  /**
   * 初始化检查项目
   */
  private initializeChecks() {
    this.checks = [
      {
        name: '文章数据完整性',
        description: '检查文章数据的完整性和一致性',
        check: this.checkArticleDataIntegrity.bind(this),
      },
      {
        name: '媒体文件一致性',
        description: '检查媒体文件的存在性和引用一致性',
        check: this.checkMediaFileConsistency.bind(this),
      },
      {
        name: 'API响应一致性',
        description: '检查各API端点的响应格式一致性',
        check: this.checkAPIResponseConsistency.bind(this),
      },
      {
        name: '分类数据一致性',
        description: '检查文章分类的一致性',
        check: this.checkCategoryConsistency.bind(this),
      },
      {
        name: '发布状态一致性',
        description: '检查文章发布状态的一致性',
        check: this.checkPublishStatusConsistency.bind(this),
      },
    ];
  }

  /**
   * 运行所有检查
   */
  async runAllChecks(): Promise<{
    passed: number;
    failed: number;
    total: number;
    results: Array<ConsistencyResult & { name: string; description: string }>;
  }> {
    const results = [];
    let passed = 0;
    let failed = 0;

    for (const check of this.checks) {
      try {
        const result = await check.check();
        results.push({
          name: check.name,
          description: check.description,
          ...result,
        });

        if (result.passed) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        results.push({
          name: check.name,
          description: check.description,
          passed: false,
          message: `检查失败: ${error.message}`,
          details: { error: error.message },
        });
        failed++;
      }
    }

    return {
      passed,
      failed,
      total: this.checks.length,
      results,
    };
  }

  /**
   * 检查文章数据完整性
   */
  private async checkArticleDataIntegrity(): Promise<ConsistencyResult> {
    try {
      const response = await fetch('/api/articles');
      const data = await response.json();

      if (!data.success) {
        return {
          passed: false,
          message: '无法获取文章数据',
          details: { error: data.error },
        };
      }

      const articles = data.data;
      const issues = [];
      const suggestions = [];

      // 检查必需字段
      articles.forEach((article: any, index: number) => {
        if (!article.id) issues.push(`文章${index + 1}缺少ID`);
        if (!article.title || article.title === 'Untitled') {
          issues.push(`文章${index + 1}标题为空或未命名`);
          suggestions.push('检查markdown文件的frontmatter配置');
        }
        if (!article.category) issues.push(`文章${index + 1}缺少分类`);
        if (!article.content) issues.push(`文章${index + 1}缺少内容`);
      });

      // 检查重复ID
      const ids = articles.map((a: any) => a.id);
      const duplicateIds = ids.filter((id: string, index: number) => ids.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        issues.push(`发现重复ID: ${duplicateIds.join(', ')}`);
        suggestions.push('确保每个markdown文件名唯一');
      }

      return {
        passed: issues.length === 0,
        message: issues.length === 0 
          ? `文章数据完整性检查通过 (${articles.length}篇文章)`
          : `发现${issues.length}个问题`,
        details: { 
          articleCount: articles.length,
          issues: issues.slice(0, 5),
        },
        suggestions: suggestions.slice(0, 3),
      };
    } catch (error) {
      return {
        passed: false,
        message: '检查过程中发生错误',
        details: { error: error.message },
      };
    }
  }

  /**
   * 检查媒体文件一致性
   */
  private async checkMediaFileConsistency(): Promise<ConsistencyResult> {
    try {
      const response = await fetch('/api/media');
      const data = await response.json();

      if (!data.success) {
        return {
          passed: false,
          message: '无法获取媒体文件数据',
          details: { error: data.error },
        };
      }

      const mediaFiles = data.data;
      const issues = [];
      const suggestions = [];

      // 检查文件URL的有效性
      for (const file of mediaFiles.slice(0, 10)) { // 只检查前10个文件
        if (!file.url) {
          issues.push(`文件${file.filename}缺少URL`);
          continue;
        }

        try {
          const fileResponse = await fetch(file.url, { method: 'HEAD' });
          if (!fileResponse.ok) {
            issues.push(`文件${file.filename}无法访问 (${fileResponse.status})`);
            suggestions.push('检查static目录中的文件是否存在');
          }
        } catch (error) {
          issues.push(`文件${file.filename}检查失败`);
        }
      }

      return {
        passed: issues.length === 0,
        message: issues.length === 0 
          ? `媒体文件一致性检查通过 (${mediaFiles.length}个文件)`
          : `发现${issues.length}个问题`,
        details: { 
          fileCount: mediaFiles.length,
          issues: issues.slice(0, 5),
        },
        suggestions: suggestions.slice(0, 3),
      };
    } catch (error) {
      return {
        passed: false,
        message: '检查过程中发生错误',
        details: { error: error.message },
      };
    }
  }

  /**
   * 检查API响应一致性
   */
  private async checkAPIResponseConsistency(): Promise<ConsistencyResult> {
    const endpoints = [
      '/api/articles',
      '/api/media',
      '/api/analytics',
      '/api/users',
      '/api/health',
    ];

    const issues = [];
    const suggestions = [];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        const data = await response.json();

        // 检查响应格式
        if (typeof data.success === 'undefined') {
          issues.push(`${endpoint} 缺少success字段`);
          suggestions.push('确保所有API都返回统一的响应格式');
        }

        if (data.success && !data.data) {
          issues.push(`${endpoint} 成功响应但缺少data字段`);
        }

        if (!data.success && !data.error) {
          issues.push(`${endpoint} 失败响应但缺少error字段`);
        }
      } catch (error) {
        issues.push(`${endpoint} 无法访问`);
      }
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0 
        ? 'API响应格式一致性检查通过'
        : `发现${issues.length}个问题`,
      details: { 
        checkedEndpoints: endpoints.length,
        issues: issues.slice(0, 5),
      },
      suggestions: suggestions.slice(0, 3),
    };
  }

  /**
   * 检查分类数据一致性
   */
  private async checkCategoryConsistency(): Promise<ConsistencyResult> {
    try {
      const response = await fetch('/api/articles');
      const data = await response.json();

      if (!data.success) {
        return {
          passed: false,
          message: '无法获取文章数据',
        };
      }

      const articles = data.data;
      const categories = [...new Set(articles.map((a: any) => a.category))];
      const expectedCategories = ['tech', 'history', 'psychology', 'workplace'];
      
      const issues = [];
      const suggestions = [];

      // 检查是否有未知分类
      const unknownCategories = categories.filter(cat => !expectedCategories.includes(cat));
      if (unknownCategories.length > 0) {
        issues.push(`发现未知分类: ${unknownCategories.join(', ')}`);
        suggestions.push('检查文章的category字段是否正确');
      }

      // 检查分类分布
      const categoryStats = expectedCategories.map(cat => ({
        category: cat,
        count: articles.filter((a: any) => a.category === cat).length,
      }));

      return {
        passed: issues.length === 0,
        message: issues.length === 0 
          ? '分类数据一致性检查通过'
          : `发现${issues.length}个问题`,
        details: { 
          categories: categoryStats,
          issues,
        },
        suggestions,
      };
    } catch (error) {
      return {
        passed: false,
        message: '检查过程中发生错误',
        details: { error: error.message },
      };
    }
  }

  /**
   * 检查发布状态一致性
   */
  private async checkPublishStatusConsistency(): Promise<ConsistencyResult> {
    try {
      const response = await fetch('/api/articles');
      const data = await response.json();

      if (!data.success) {
        return {
          passed: false,
          message: '无法获取文章数据',
        };
      }

      const articles = data.data;
      const issues = [];
      const suggestions = [];

      // 检查发布状态
      articles.forEach((article: any, index: number) => {
        if (!article.status) {
          issues.push(`文章${index + 1}缺少发布状态`);
          return;
        }

        // 检查状态值是否有效
        const validStatuses = ['draft', 'published', 'scheduled'];
        if (!validStatuses.includes(article.status)) {
          issues.push(`文章${index + 1}状态无效: ${article.status}`);
          suggestions.push('确保文章状态为draft、published或scheduled之一');
        }

        // 检查发布配置一致性
        if (article.status === 'published' && !article.publish?.website) {
          issues.push(`文章${index + 1}状态为已发布但缺少发布配置`);
          suggestions.push('检查frontmatter中的publish配置');
        }
      });

      const statusStats = {
        draft: articles.filter((a: any) => a.status === 'draft').length,
        published: articles.filter((a: any) => a.status === 'published').length,
        scheduled: articles.filter((a: any) => a.status === 'scheduled').length,
      };

      return {
        passed: issues.length === 0,
        message: issues.length === 0 
          ? '发布状态一致性检查通过'
          : `发现${issues.length}个问题`,
        details: { 
          statusStats,
          issues: issues.slice(0, 5),
        },
        suggestions: suggestions.slice(0, 3),
      };
    } catch (error) {
      return {
        passed: false,
        message: '检查过程中发生错误',
        details: { error: error.message },
      };
    }
  }
}

// 导出单例实例
export const dataConsistencyChecker = new DataConsistencyChecker();

// 导出类型
export type { ConsistencyCheck, ConsistencyResult };
