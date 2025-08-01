/**
 * 环境配置管理
 * 统一管理不同环境的配置信息
 */

export type Environment = 'development' | 'staging' | 'production';

interface EnvironmentConfig {
  name: string;
  apiUrl: string;
  adminUrl: string;
  websiteUrl: string;
  
  // 数据库配置
  database: {
    host: string;
    port: number;
    name: string;
    ssl: boolean;
  };
  
  // 缓存配置
  cache: {
    ttl: number; // 秒
    maxSize: number; // MB
  };
  
  // 安全配置
  security: {
    jwtExpiresIn: string;
    bcryptRounds: number;
    rateLimitWindow: number; // 毫秒
    rateLimitMax: number;
  };
  
  // 文件上传配置
  upload: {
    maxFileSize: number; // bytes
    allowedTypes: string[];
    storageProvider: 'local' | 'r2' | 's3';
  };
  
  // 日志配置
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
    enableFile: boolean;
  };
  
  // 监控配置
  monitoring: {
    enabled: boolean;
    sampleRate: number;
    errorReporting: boolean;
  };
  
  // 功能开关
  features: {
    realTimeStats: boolean;
    advancedAnalytics: boolean;
    autoPublish: boolean;
    multiLanguage: boolean;
  };
}

const configs: Record<Environment, EnvironmentConfig> = {
  development: {
    name: 'Development',
    apiUrl: 'http://localhost:3001',
    adminUrl: 'http://localhost:3001/admin',
    websiteUrl: 'http://localhost:3000',
    
    database: {
      host: 'localhost',
      port: 5432,
      name: 'nssa_dev',
      ssl: false,
    },
    
    cache: {
      ttl: 300, // 5分钟
      maxSize: 100, // 100MB
    },
    
    security: {
      jwtExpiresIn: '24h',
      bcryptRounds: 10,
      rateLimitWindow: 15 * 60 * 1000, // 15分钟
      rateLimitMax: 1000,
    },
    
    upload: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
      storageProvider: 'local',
    },
    
    logging: {
      level: 'debug',
      enableConsole: true,
      enableFile: true,
    },
    
    monitoring: {
      enabled: true,
      sampleRate: 1.0,
      errorReporting: true,
    },
    
    features: {
      realTimeStats: true,
      advancedAnalytics: true,
      autoPublish: false,
      multiLanguage: false,
    },
  },
  
  staging: {
    name: 'Staging',
    apiUrl: 'https://admin-staging.nssa.io',
    adminUrl: 'https://admin-staging.nssa.io/admin',
    websiteUrl: 'https://staging.nssa.io',
    
    database: {
      host: 'staging-db.nssa.io',
      port: 5432,
      name: 'nssa_staging',
      ssl: true,
    },
    
    cache: {
      ttl: 600, // 10分钟
      maxSize: 500, // 500MB
    },
    
    security: {
      jwtExpiresIn: '12h',
      bcryptRounds: 12,
      rateLimitWindow: 15 * 60 * 1000, // 15分钟
      rateLimitMax: 500,
    },
    
    upload: {
      maxFileSize: 20 * 1024 * 1024, // 20MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
      storageProvider: 'r2',
    },
    
    logging: {
      level: 'info',
      enableConsole: false,
      enableFile: true,
    },
    
    monitoring: {
      enabled: true,
      sampleRate: 0.5,
      errorReporting: true,
    },
    
    features: {
      realTimeStats: true,
      advancedAnalytics: true,
      autoPublish: false,
      multiLanguage: true,
    },
  },
  
  production: {
    name: 'Production',
    apiUrl: 'https://admin.nssa.io',
    adminUrl: 'https://admin.nssa.io/admin',
    websiteUrl: 'https://nssa.io',
    
    database: {
      host: 'prod-db.nssa.io',
      port: 5432,
      name: 'nssa_production',
      ssl: true,
    },
    
    cache: {
      ttl: 1800, // 30分钟
      maxSize: 1000, // 1GB
    },
    
    security: {
      jwtExpiresIn: '8h',
      bcryptRounds: 14,
      rateLimitWindow: 15 * 60 * 1000, // 15分钟
      rateLimitMax: 100,
    },
    
    upload: {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
      storageProvider: 'r2',
    },
    
    logging: {
      level: 'warn',
      enableConsole: false,
      enableFile: true,
    },
    
    monitoring: {
      enabled: true,
      sampleRate: 0.1,
      errorReporting: true,
    },
    
    features: {
      realTimeStats: true,
      advancedAnalytics: true,
      autoPublish: true,
      multiLanguage: true,
    },
  },
};

export class EnvironmentManager {
  private static currentEnv: Environment;
  
  /**
   * 获取当前环境
   */
  static getCurrentEnvironment(): Environment {
    if (this.currentEnv) {
      return this.currentEnv;
    }
    
    // 从环境变量获取
    const nodeEnv = process.env.NODE_ENV as Environment;
    const customEnv = process.env.NSSA_ENV as Environment;
    
    this.currentEnv = customEnv || nodeEnv || 'development';
    return this.currentEnv;
  }
  
  /**
   * 设置当前环境
   */
  static setEnvironment(env: Environment): void {
    this.currentEnv = env;
  }
  
  /**
   * 获取当前环境配置
   */
  static getConfig(): EnvironmentConfig {
    const env = this.getCurrentEnvironment();
    return configs[env];
  }
  
  /**
   * 获取特定环境配置
   */
  static getConfigForEnvironment(env: Environment): EnvironmentConfig {
    return configs[env];
  }
  
  /**
   * 检查功能是否启用
   */
  static isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
    const config = this.getConfig();
    return config.features[feature];
  }
  
  /**
   * 获取数据库连接字符串
   */
  static getDatabaseUrl(): string {
    const config = this.getConfig();
    const { host, port, name, ssl } = config.database;
    
    const username = process.env.DB_USERNAME || 'postgres';
    const password = process.env.DB_PASSWORD || '';
    const sslParam = ssl ? '?sslmode=require' : '';
    
    return `postgresql://${username}:${password}@${host}:${port}/${name}${sslParam}`;
  }
  
  /**
   * 获取 Redis 连接配置
   */
  static getRedisConfig() {
    const env = this.getCurrentEnvironment();
    
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: env === 'production' ? 0 : env === 'staging' ? 1 : 2,
    };
  }
  
  /**
   * 验证环境配置
   */
  static validateConfig(): { valid: boolean; errors: string[] } {
    const config = this.getConfig();
    const errors: string[] = [];
    
    // 检查必需的环境变量
    const requiredEnvVars = [
      'JWT_SECRET',
      'GITHUB_TOKEN',
    ];
    
    if (this.getCurrentEnvironment() === 'production') {
      requiredEnvVars.push(
        'DB_PASSWORD',
        'CLOUDFLARE_API_TOKEN',
        'CLOUDFLARE_ZONE_ID'
      );
    }
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        errors.push(`Missing required environment variable: ${envVar}`);
      }
    }
    
    // 检查配置值的合理性
    if (config.cache.ttl < 60) {
      errors.push('Cache TTL should be at least 60 seconds');
    }
    
    if (config.security.rateLimitMax < 10) {
      errors.push('Rate limit max should be at least 10');
    }
    
    if (config.upload.maxFileSize > 100 * 1024 * 1024) {
      errors.push('Max file size should not exceed 100MB');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * 获取环境信息摘要
   */
  static getEnvironmentSummary() {
    const env = this.getCurrentEnvironment();
    const config = this.getConfig();
    const validation = this.validateConfig();
    
    return {
      environment: env,
      name: config.name,
      apiUrl: config.apiUrl,
      adminUrl: config.adminUrl,
      websiteUrl: config.websiteUrl,
      features: config.features,
      security: {
        jwtExpiresIn: config.security.jwtExpiresIn,
        rateLimitMax: config.security.rateLimitMax,
      },
      monitoring: config.monitoring,
      validation,
      timestamp: new Date().toISOString(),
    };
  }
}

// 导出配置获取函数
export const getConfig = () => EnvironmentManager.getConfig();
export const getCurrentEnvironment = () => EnvironmentManager.getCurrentEnvironment();
export const isFeatureEnabled = (feature: keyof EnvironmentConfig['features']) => 
  EnvironmentManager.isFeatureEnabled(feature);

// 导出类型
export type { EnvironmentConfig };
