// 基础类型定义

// 文章状态
export type ArticleStatus = 'draft' | 'published' | 'scheduled' | 'archived';

// 发布平台
export type PublishPlatform = 'website' | 'wechat_a' | 'wechat_b';

// 用户角色
export type UserRole = 'admin' | 'editor' | 'viewer';

// 文章接口
export interface Article {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  content: string;
  status: ArticleStatus;
  author: string;
  categories: string[];
  tags: string[];
  coverImage?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  readingTime?: string;
  
  // 发布配置
  publish: {
    website: boolean;
    wechat_a: boolean;
    wechat_b: boolean;
    schedule?: string;
  };
  
  // 微信配置
  wechat?: {
    title?: string;
    summary?: string;
    author?: string;
    cover_image?: string;
    tags?: string[];
  };
  
  // 统计数据
  stats?: {
    views: number;
    likes: number;
    shares: number;
  };
}

// 分类接口
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
  articleCount: number;
  createdAt: string;
}

// 标签接口
export interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string;
  articleCount: number;
  createdAt: string;
}

// 媒体文件接口
export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  caption?: string;
  uploadedBy: string;
  createdAt: string;
  tags?: string[];
}

// 用户接口
export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 发布记录接口
export interface PublishRecord {
  id: string;
  articleId: string;
  platform: PublishPlatform;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  publishedAt?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

// 统计数据接口
export interface Analytics {
  totalArticles: number;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  publishedThisMonth: number;
  viewsThisMonth: number;
  topArticles: Array<{
    id: string;
    title: string;
    views: number;
    likes: number;
  }>;
  categoryStats: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    articles: number;
    views: number;
  }>;
}

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

// 分页接口
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 分页响应接口
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

// 搜索参数接口
export interface SearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  status?: ArticleStatus;
  author?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'title' | 'views';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// 表单验证错误接口
export interface ValidationError {
  field: string;
  message: string;
}

// 表单状态接口
export interface FormState {
  isSubmitting: boolean;
  errors: ValidationError[];
  isDirty: boolean;
  isValid: boolean;
}

// 通知接口
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

// 系统配置接口
export interface SystemConfig {
  siteName: string;
  siteUrl: string;
  adminEmail: string;
  timezone: string;
  language: string;
  theme: 'light' | 'dark' | 'auto';
  
  // 发布配置
  publishing: {
    autoPublish: boolean;
    defaultPlatforms: PublishPlatform[];
    scheduleEnabled: boolean;
  };
  
  // 媒体配置
  media: {
    maxFileSize: number;
    allowedTypes: string[];
    imageQuality: number;
    generateThumbnails: boolean;
  };
  
  // 安全配置
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    requireTwoFactor: boolean;
  };
}

// 导出所有类型
export type {
  ArticleStatus,
  PublishPlatform,
  UserRole,
  Article,
  Category,
  Tag,
  MediaFile,
  User,
  PublishRecord,
  Analytics,
  ApiResponse,
  Pagination,
  PaginatedResponse,
  SearchParams,
  ValidationError,
  FormState,
  Notification,
  SystemConfig,
};
