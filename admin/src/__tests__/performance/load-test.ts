/**
 * 性能和负载测试
 */

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
}

interface LoadTestConfig {
  concurrentUsers: number;
  duration: number; // 秒
  rampUpTime: number; // 秒
  endpoints: string[];
}

class PerformanceTester {
  private baseUrl: string;
  private metrics: PerformanceMetrics[] = [];

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  /**
   * 执行负载测试
   */
  async runLoadTest(config: LoadTestConfig): Promise<PerformanceMetrics> {
    console.log(`开始负载测试: ${config.concurrentUsers} 并发用户, ${config.duration}秒`);
    
    const startTime = Date.now();
    const endTime = startTime + (config.duration * 1000);
    const rampUpInterval = (config.rampUpTime * 1000) / config.concurrentUsers;
    
    const workers: Promise<void>[] = [];
    const results: Array<{ success: boolean; responseTime: number }> = [];
    
    // 逐步增加负载
    for (let i = 0; i < config.concurrentUsers; i++) {
      setTimeout(() => {
        const worker = this.createWorker(config.endpoints, endTime, results);
        workers.push(worker);
      }, i * rampUpInterval);
    }
    
    // 等待所有工作线程完成
    await Promise.all(workers);
    
    // 计算性能指标
    return this.calculateMetrics(results, config.duration);
  }

  /**
   * 创建工作线程
   */
  private async createWorker(
    endpoints: string[],
    endTime: number,
    results: Array<{ success: boolean; responseTime: number }>
  ): Promise<void> {
    while (Date.now() < endTime) {
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      const startTime = Date.now();
      
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`);
        const responseTime = Date.now() - startTime;
        
        results.push({
          success: response.ok,
          responseTime,
        });
      } catch (error) {
        results.push({
          success: false,
          responseTime: Date.now() - startTime,
        });
      }
      
      // 短暂延迟以模拟真实用户行为
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    }
  }

  /**
   * 计算性能指标
   */
  private calculateMetrics(
    results: Array<{ success: boolean; responseTime: number }>,
    duration: number
  ): PerformanceMetrics {
    const successfulRequests = results.filter(r => r.success);
    const failedRequests = results.filter(r => !r.success);
    
    const avgResponseTime = successfulRequests.length > 0
      ? successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length
      : 0;
    
    const throughput = results.length / duration; // 请求/秒
    const errorRate = failedRequests.length / results.length;
    
    return {
      responseTime: avgResponseTime,
      throughput,
      errorRate,
      memoryUsage: this.getMemoryUsage(),
    };
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return usage.heapUsed / 1024 / 1024; // MB
    }
    return 0;
  }

  /**
   * 压力测试 - 逐步增加负载直到系统达到极限
   */
  async runStressTest(maxUsers: number = 100, stepSize: number = 10): Promise<PerformanceMetrics[]> {
    const results: PerformanceMetrics[] = [];
    
    for (let users = stepSize; users <= maxUsers; users += stepSize) {
      console.log(`压力测试: ${users} 并发用户`);
      
      const config: LoadTestConfig = {
        concurrentUsers: users,
        duration: 30, // 30秒测试
        rampUpTime: 5,  // 5秒爬坡
        endpoints: ['/api/articles', '/api/media', '/api/analytics'],
      };
      
      const metrics = await this.runLoadTest(config);
      results.push(metrics);
      
      // 如果错误率超过10%，停止测试
      if (metrics.errorRate > 0.1) {
        console.log(`错误率过高 (${(metrics.errorRate * 100).toFixed(2)}%)，停止压力测试`);
        break;
      }
      
      // 短暂休息让系统恢复
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    return results;
  }

  /**
   * 峰值测试 - 突然增加大量负载
   */
  async runSpikeTest(normalUsers: number = 10, spikeUsers: number = 100): Promise<{
    normal: PerformanceMetrics;
    spike: PerformanceMetrics;
    recovery: PerformanceMetrics;
  }> {
    console.log('开始峰值测试');
    
    // 正常负载
    console.log(`正常负载: ${normalUsers} 用户`);
    const normal = await this.runLoadTest({
      concurrentUsers: normalUsers,
      duration: 60,
      rampUpTime: 10,
      endpoints: ['/api/articles', '/api/media'],
    });
    
    // 峰值负载
    console.log(`峰值负载: ${spikeUsers} 用户`);
    const spike = await this.runLoadTest({
      concurrentUsers: spikeUsers,
      duration: 30,
      rampUpTime: 5,
      endpoints: ['/api/articles', '/api/media'],
    });
    
    // 恢复期
    console.log(`恢复期: ${normalUsers} 用户`);
    const recovery = await this.runLoadTest({
      concurrentUsers: normalUsers,
      duration: 60,
      rampUpTime: 10,
      endpoints: ['/api/articles', '/api/media'],
    });
    
    return { normal, spike, recovery };
  }

  /**
   * 生成性能报告
   */
  generateReport(metrics: PerformanceMetrics[]): string {
    const report = [
      '=== 性能测试报告 ===',
      `测试时间: ${new Date().toISOString()}`,
      '',
      '指标摘要:',
    ];
    
    metrics.forEach((metric, index) => {
      report.push(`测试 ${index + 1}:`);
      report.push(`  平均响应时间: ${metric.responseTime.toFixed(2)}ms`);
      report.push(`  吞吐量: ${metric.throughput.toFixed(2)} 请求/秒`);
      report.push(`  错误率: ${(metric.errorRate * 100).toFixed(2)}%`);
      report.push(`  内存使用: ${metric.memoryUsage.toFixed(2)}MB`);
      report.push('');
    });
    
    // 性能建议
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
    const avgErrorRate = metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length;
    
    report.push('性能建议:');
    if (avgResponseTime > 1000) {
      report.push('- 响应时间较慢，建议优化数据库查询和缓存策略');
    }
    if (avgErrorRate > 0.05) {
      report.push('- 错误率较高，建议检查错误处理和系统稳定性');
    }
    if (avgResponseTime < 200 && avgErrorRate < 0.01) {
      report.push('- 系统性能良好，可以处理当前负载');
    }
    
    return report.join('\n');
  }
}

// Jest测试用例
describe.skip('Performance Tests', () => {
  const tester = new PerformanceTester();

  // 设置较长的超时时间
  jest.setTimeout(300000); // 5分钟

  it('should handle moderate load', async () => {
    const config: LoadTestConfig = {
      concurrentUsers: 5,
      duration: 10,
      rampUpTime: 2,
      endpoints: ['/api/articles', '/api/health'],
    };
    
    const metrics = await tester.runLoadTest(config);
    
    // 性能断言
    expect(metrics.responseTime).toBeLessThan(2000); // 响应时间小于2秒
    expect(metrics.errorRate).toBeLessThan(0.05); // 错误率小于5%
    expect(metrics.throughput).toBeGreaterThan(0.5); // 吞吐量大于0.5请求/秒
  });
  
  it('should maintain performance under stress', async () => {
    const results = await tester.runStressTest(20, 5);
    
    // 确保在压力下仍能维持基本性能
    const lastResult = results[results.length - 1];
    expect(lastResult.errorRate).toBeLessThan(0.1); // 错误率小于10%
    expect(lastResult.responseTime).toBeLessThan(5000); // 响应时间小于5秒
  });
});

export { PerformanceTester, PerformanceMetrics, LoadTestConfig };
