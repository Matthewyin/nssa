/**
 * 监控和告警系统
 */

interface MonitoringEvent {
  type: 'error' | 'warning' | 'info' | 'performance';
  message: string;
  data?: any;
  timestamp: string;
  source: string;
  userId?: string;
  sessionId?: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags?: Record<string, string>;
}

interface AlertRule {
  id: string;
  name: string;
  condition: (metric: PerformanceMetric) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldown: number; // 冷却时间（毫秒）
  enabled: boolean;
}

class MonitoringService {
  private events: MonitoringEvent[] = [];
  private metrics: PerformanceMetric[] = [];
  private alertRules: AlertRule[] = [];
  private lastAlerts: Map<string, number> = new Map();

  constructor() {
    this.initializeDefaultAlertRules();
    this.startMetricsCollection();
  }

  /**
   * 记录事件
   */
  logEvent(event: Omit<MonitoringEvent, 'timestamp'>): void {
    const fullEvent: MonitoringEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    this.events.push(fullEvent);
    
    // 保持最近1000个事件
    if (this.events.length > 1000) {
      this.events.splice(0, this.events.length - 1000);
    }

    // 发送到外部监控服务
    this.sendToExternalService(fullEvent);
    
    // 检查是否需要触发告警
    if (event.type === 'error') {
      this.checkErrorAlerts(fullEvent);
    }
  }

  /**
   * 记录性能指标
   */
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date().toISOString(),
    };

    this.metrics.push(fullMetric);
    
    // 保持最近10000个指标
    if (this.metrics.length > 10000) {
      this.metrics.splice(0, this.metrics.length - 10000);
    }

    // 检查告警规则
    this.checkAlertRules(fullMetric);
  }

  /**
   * 记录API请求
   */
  logAPIRequest(
    method: string,
    path: string,
    statusCode: number,
    responseTime: number,
    userId?: string
  ): void {
    // 记录事件
    this.logEvent({
      type: statusCode >= 400 ? 'error' : 'info',
      message: `${method} ${path} - ${statusCode}`,
      data: { method, path, statusCode, responseTime },
      source: 'api',
      userId,
    });

    // 记录性能指标
    this.recordMetric({
      name: 'api_response_time',
      value: responseTime,
      unit: 'ms',
      tags: { method, path, status: statusCode.toString() },
    });

    this.recordMetric({
      name: 'api_request_count',
      value: 1,
      unit: 'count',
      tags: { method, path, status: statusCode.toString() },
    });
  }

  /**
   * 记录用户操作
   */
  logUserAction(action: string, userId: string, data?: any): void {
    this.logEvent({
      type: 'info',
      message: `User action: ${action}`,
      data,
      source: 'user',
      userId,
    });
  }

  /**
   * 记录系统错误
   */
  logError(error: Error, context?: any, userId?: string): void {
    this.logEvent({
      type: 'error',
      message: error.message,
      data: {
        stack: error.stack,
        context,
      },
      source: 'system',
      userId,
    });
  }

  /**
   * 获取监控数据
   */
  getMonitoringData(timeRange?: { start: string; end: string }) {
    let filteredEvents = this.events;
    let filteredMetrics = this.metrics;

    if (timeRange) {
      const start = new Date(timeRange.start);
      const end = new Date(timeRange.end);

      filteredEvents = this.events.filter(event => {
        const eventTime = new Date(event.timestamp);
        return eventTime >= start && eventTime <= end;
      });

      filteredMetrics = this.metrics.filter(metric => {
        const metricTime = new Date(metric.timestamp);
        return metricTime >= start && metricTime <= end;
      });
    }

    return {
      events: filteredEvents,
      metrics: filteredMetrics,
      summary: this.generateSummary(filteredEvents, filteredMetrics),
    };
  }

  /**
   * 生成监控摘要
   */
  private generateSummary(events: MonitoringEvent[], metrics: PerformanceMetric[]) {
    const errorCount = events.filter(e => e.type === 'error').length;
    const warningCount = events.filter(e => e.type === 'warning').length;
    
    const apiMetrics = metrics.filter(m => m.name === 'api_response_time');
    const avgResponseTime = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
      : 0;

    const requestCount = metrics.filter(m => m.name === 'api_request_count').length;

    return {
      totalEvents: events.length,
      errorCount,
      warningCount,
      avgResponseTime: Math.round(avgResponseTime),
      requestCount,
      uptime: this.calculateUptime(),
    };
  }

  /**
   * 计算系统运行时间
   */
  private calculateUptime(): number {
    // 简化的运行时间计算
    return Math.floor(process.uptime?.() || 0);
  }

  /**
   * 初始化默认告警规则
   */
  private initializeDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'high_response_time',
        name: '响应时间过高',
        condition: (metric) => 
          metric.name === 'api_response_time' && metric.value > 2000,
        severity: 'high',
        cooldown: 5 * 60 * 1000, // 5分钟
        enabled: true,
      },
      {
        id: 'high_error_rate',
        name: '错误率过高',
        condition: (metric) => 
          metric.name === 'error_rate' && metric.value > 0.05,
        severity: 'critical',
        cooldown: 10 * 60 * 1000, // 10分钟
        enabled: true,
      },
      {
        id: 'memory_usage_high',
        name: '内存使用率过高',
        condition: (metric) => 
          metric.name === 'memory_usage' && metric.value > 0.8,
        severity: 'medium',
        cooldown: 15 * 60 * 1000, // 15分钟
        enabled: true,
      },
    ];
  }

  /**
   * 检查告警规则
   */
  private checkAlertRules(metric: PerformanceMetric): void {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      const lastAlert = this.lastAlerts.get(rule.id) || 0;
      const now = Date.now();

      // 检查冷却时间
      if (now - lastAlert < rule.cooldown) continue;

      // 检查条件
      if (rule.condition(metric)) {
        this.triggerAlert(rule, metric);
        this.lastAlerts.set(rule.id, now);
      }
    }
  }

  /**
   * 检查错误告警
   */
  private checkErrorAlerts(event: MonitoringEvent): void {
    // 计算最近5分钟的错误率
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentEvents = this.events.filter(e => 
      new Date(e.timestamp) > fiveMinutesAgo
    );
    
    const errorEvents = recentEvents.filter(e => e.type === 'error');
    const errorRate = recentEvents.length > 0 ? errorEvents.length / recentEvents.length : 0;

    if (errorRate > 0.1) { // 错误率超过10%
      this.recordMetric({
        name: 'error_rate',
        value: errorRate,
        unit: 'ratio',
      });
    }
  }

  /**
   * 触发告警
   */
  private triggerAlert(rule: AlertRule, metric: PerformanceMetric): void {
    const alert = {
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      metric,
      timestamp: new Date().toISOString(),
    };

    // 记录告警事件
    this.logEvent({
      type: 'warning',
      message: `Alert triggered: ${rule.name}`,
      data: alert,
      source: 'monitoring',
    });

    // 发送告警通知
    this.sendAlert(alert);
  }

  /**
   * 发送告警通知
   */
  private async sendAlert(alert: any): Promise<void> {
    // 这里可以集成各种通知渠道
    // 例如：邮件、Slack、微信、短信等
    
    console.warn('🚨 Alert triggered:', alert);
    
    // 示例：发送到 Webhook
    if (process.env.ALERT_WEBHOOK_URL) {
      try {
        await fetch(process.env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert),
        });
      } catch (error) {
        console.error('Failed to send alert:', error);
      }
    }
  }

  /**
   * 发送到外部监控服务
   */
  private async sendToExternalService(event: MonitoringEvent): Promise<void> {
    // 这里可以集成外部监控服务
    // 例如：Datadog、New Relic、Sentry等
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Monitoring event:', event);
    }
  }

  /**
   * 开始指标收集
   */
  private startMetricsCollection(): void {
    // 每分钟收集系统指标
    setInterval(() => {
      this.collectSystemMetrics();
    }, 60 * 1000);
  }

  /**
   * 收集系统指标
   */
  private collectSystemMetrics(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      
      this.recordMetric({
        name: 'memory_usage',
        value: memUsage.heapUsed / memUsage.heapTotal,
        unit: 'ratio',
      });

      this.recordMetric({
        name: 'memory_heap_used',
        value: memUsage.heapUsed / 1024 / 1024,
        unit: 'MB',
      });
    }
  }
}

// 全局监控实例
export const monitoring = new MonitoringService();

// 导出类型
export type { MonitoringEvent, PerformanceMetric, AlertRule };
