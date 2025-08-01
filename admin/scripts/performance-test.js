#!/usr/bin/env node

/**
 * 性能测试脚本
 * 测试API响应时间、并发处理能力和资源使用情况
 */

const { performance } = require('perf_hooks');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class PerformanceTester {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.results = {
      responseTime: {},
      concurrency: {},
      loadTest: {},
      memoryUsage: {},
    };
  }

  /**
   * 运行完整的性能测试套件
   */
  async runPerformanceTests() {
    log('⚡ NSSA 管理后台性能测试', 'magenta');
    log('🎯 测试API响应时间、并发能力和资源使用', 'blue');

    try {
      // 1. 响应时间测试
      await this.testResponseTimes();
      
      // 2. 并发测试
      await this.testConcurrency();
      
      // 3. 负载测试
      await this.testLoadHandling();
      
      // 4. 内存使用测试
      await this.testMemoryUsage();
      
      // 生成性能报告
      this.generatePerformanceReport();
      
      return this.results;
      
    } catch (error) {
      log(`❌ 性能测试失败: ${error.message}`, 'red');
      throw error;
    }
  }

  /**
   * 测试API响应时间
   */
  async testResponseTimes() {
    log('\n📊 测试API响应时间...', 'cyan');
    
    const endpoints = [
      { name: '健康检查', path: '/api/health' },
      { name: '配置状态', path: '/api/config-status' },
      { name: '文章列表', path: '/api/articles' },
      { name: '统计数据', path: '/api/analytics?type=overview' },
      { name: '微信状态', path: '/api/wechat?action=status' },
    ];

    for (const endpoint of endpoints) {
      const times = [];
      const iterations = 5;

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        
        try {
          const response = await fetch(`${this.baseUrl}${endpoint.path}`);
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          if (response.ok) {
            times.push(responseTime);
          } else {
            log(`  ⚠️ ${endpoint.name} 返回错误状态: ${response.status}`, 'yellow');
          }
        } catch (error) {
          log(`  ❌ ${endpoint.name} 请求失败: ${error.message}`, 'red');
        }
      }

      if (times.length > 0) {
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        
        this.results.responseTime[endpoint.name] = {
          average: Math.round(avgTime),
          min: Math.round(minTime),
          max: Math.round(maxTime),
          samples: times.length,
        };

        const status = avgTime < 500 ? '✅' : avgTime < 1000 ? '⚠️' : '❌';
        const color = avgTime < 500 ? 'green' : avgTime < 1000 ? 'yellow' : 'red';
        
        log(`  ${status} ${endpoint.name}: ${Math.round(avgTime)}ms (${Math.round(minTime)}-${Math.round(maxTime)}ms)`, color);
      }
    }
  }

  /**
   * 测试并发处理能力
   */
  async testConcurrency() {
    log('\n🔄 测试并发处理能力...', 'cyan');
    
    const concurrencyLevels = [1, 5, 10, 20];
    const testEndpoint = '/api/health';

    for (const concurrency of concurrencyLevels) {
      log(`  测试 ${concurrency} 个并发请求...`, 'blue');
      
      const startTime = performance.now();
      const promises = [];

      for (let i = 0; i < concurrency; i++) {
        promises.push(
          fetch(`${this.baseUrl}${testEndpoint}`)
            .then(response => ({ success: response.ok, status: response.status }))
            .catch(error => ({ success: false, error: error.message }))
        );
      }

      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;
      
      this.results.concurrency[`${concurrency}_concurrent`] = {
        concurrency,
        totalTime: Math.round(totalTime),
        successful,
        failed,
        successRate: Math.round((successful / results.length) * 100),
        avgTimePerRequest: Math.round(totalTime / concurrency),
      };

      const status = failed === 0 ? '✅' : failed < concurrency * 0.1 ? '⚠️' : '❌';
      const color = failed === 0 ? 'green' : failed < concurrency * 0.1 ? 'yellow' : 'red';
      
      log(`    ${status} ${successful}/${concurrency} 成功, 总时间: ${Math.round(totalTime)}ms`, color);
    }
  }

  /**
   * 测试负载处理能力
   */
  async testLoadHandling() {
    log('\n📈 测试负载处理能力...', 'cyan');
    
    const duration = 10000; // 10秒
    const requestInterval = 100; // 每100ms一个请求
    const testEndpoint = '/api/articles';
    
    log(`  持续 ${duration/1000} 秒，每 ${requestInterval}ms 发送一个请求...`, 'blue');
    
    const startTime = performance.now();
    const results = [];
    let requestCount = 0;
    
    const interval = setInterval(async () => {
      const reqStartTime = performance.now();
      requestCount++;
      
      try {
        const response = await fetch(`${this.baseUrl}${testEndpoint}`);
        const reqEndTime = performance.now();
        
        results.push({
          success: response.ok,
          responseTime: reqEndTime - reqStartTime,
          timestamp: reqEndTime - startTime,
        });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          timestamp: performance.now() - startTime,
        });
      }
    }, requestInterval);

    // 等待测试完成
    await new Promise(resolve => setTimeout(resolve, duration));
    clearInterval(interval);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    const avgResponseTime = results
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + r.responseTime, 0) / successful;
    
    this.results.loadTest = {
      duration: duration / 1000,
      totalRequests: results.length,
      successful,
      failed,
      successRate: Math.round((successful / results.length) * 100),
      avgResponseTime: Math.round(avgResponseTime),
      requestsPerSecond: Math.round(results.length / (duration / 1000)),
    };

    const status = failed < results.length * 0.05 ? '✅' : failed < results.length * 0.1 ? '⚠️' : '❌';
    const color = failed < results.length * 0.05 ? 'green' : failed < results.length * 0.1 ? 'yellow' : 'red';
    
    log(`  ${status} ${successful}/${results.length} 成功 (${Math.round((successful/results.length)*100)}%)`, color);
    log(`    平均响应时间: ${Math.round(avgResponseTime)}ms`, 'blue');
    log(`    请求速率: ${Math.round(results.length/(duration/1000))} req/s`, 'blue');
  }

  /**
   * 测试内存使用情况
   */
  async testMemoryUsage() {
    log('\n💾 测试内存使用情况...', 'cyan');
    
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const initialMemory = process.memoryUsage();
      
      // 执行一些内存密集型操作
      const largeArray = [];
      for (let i = 0; i < 10000; i++) {
        largeArray.push(new Array(100).fill(Math.random()));
      }
      
      // 发送一些请求
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(fetch(`${this.baseUrl}/api/health`));
      }
      await Promise.all(promises);
      
      const finalMemory = process.memoryUsage();
      
      this.results.memoryUsage = {
        initial: {
          heapUsed: Math.round(initialMemory.heapUsed / 1024 / 1024),
          heapTotal: Math.round(initialMemory.heapTotal / 1024 / 1024),
          external: Math.round(initialMemory.external / 1024 / 1024),
        },
        final: {
          heapUsed: Math.round(finalMemory.heapUsed / 1024 / 1024),
          heapTotal: Math.round(finalMemory.heapTotal / 1024 / 1024),
          external: Math.round(finalMemory.external / 1024 / 1024),
        },
        difference: {
          heapUsed: Math.round((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024),
          heapTotal: Math.round((finalMemory.heapTotal - initialMemory.heapTotal) / 1024 / 1024),
        },
      };
      
      log(`  初始内存: ${this.results.memoryUsage.initial.heapUsed}MB`, 'blue');
      log(`  最终内存: ${this.results.memoryUsage.final.heapUsed}MB`, 'blue');
      log(`  内存增长: ${this.results.memoryUsage.difference.heapUsed}MB`, 
          this.results.memoryUsage.difference.heapUsed < 50 ? 'green' : 'yellow');
    } else {
      log('  ⚠️ 内存使用信息不可用', 'yellow');
    }
  }

  /**
   * 生成性能报告
   */
  generatePerformanceReport() {
    log('\n📊 性能测试报告', 'magenta');
    log('=' * 50, 'blue');
    
    // 响应时间报告
    log('\n⏱️ API响应时间:', 'cyan');
    Object.entries(this.results.responseTime).forEach(([name, data]) => {
      const status = data.average < 500 ? '✅' : data.average < 1000 ? '⚠️' : '❌';
      log(`  ${status} ${name}: ${data.average}ms (${data.min}-${data.max}ms)`, 
          data.average < 500 ? 'green' : data.average < 1000 ? 'yellow' : 'red');
    });
    
    // 并发测试报告
    log('\n🔄 并发处理能力:', 'cyan');
    Object.entries(this.results.concurrency).forEach(([key, data]) => {
      const status = data.failed === 0 ? '✅' : '⚠️';
      log(`  ${status} ${data.concurrency} 并发: ${data.successRate}% 成功率, ${data.avgTimePerRequest}ms/请求`, 
          data.failed === 0 ? 'green' : 'yellow');
    });
    
    // 负载测试报告
    if (this.results.loadTest.totalRequests > 0) {
      log('\n📈 负载测试:', 'cyan');
      const load = this.results.loadTest;
      const status = load.successRate >= 95 ? '✅' : load.successRate >= 90 ? '⚠️' : '❌';
      log(`  ${status} ${load.successRate}% 成功率 (${load.successful}/${load.totalRequests})`, 
          load.successRate >= 95 ? 'green' : load.successRate >= 90 ? 'yellow' : 'red');
      log(`    平均响应时间: ${load.avgResponseTime}ms`, 'blue');
      log(`    处理速率: ${load.requestsPerSecond} req/s`, 'blue');
    }
    
    // 内存使用报告
    if (this.results.memoryUsage.initial) {
      log('\n💾 内存使用:', 'cyan');
      const mem = this.results.memoryUsage;
      log(`  初始: ${mem.initial.heapUsed}MB, 最终: ${mem.final.heapUsed}MB`, 'blue');
      log(`  增长: ${mem.difference.heapUsed}MB`, 
          mem.difference.heapUsed < 50 ? 'green' : 'yellow');
    }
    
    // 总体评估
    log('\n🎯 性能评估:', 'magenta');
    const avgResponseTime = Object.values(this.results.responseTime)
      .reduce((sum, data) => sum + data.average, 0) / Object.keys(this.results.responseTime).length;
    
    if (avgResponseTime < 500) {
      log('  🚀 性能优秀 - 系统响应迅速，可以处理高负载', 'green');
    } else if (avgResponseTime < 1000) {
      log('  ⚡ 性能良好 - 系统响应正常，适合生产使用', 'yellow');
    } else {
      log('  🐌 性能需要优化 - 建议优化后再部署', 'red');
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const tester = new PerformanceTester();
  tester.runPerformanceTests().catch(console.error);
}

module.exports = { PerformanceTester };
