'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  BugAntIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // 这里可以发送错误报告到监控服务
    this.reportError(error, errorInfo);
  }

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // 发送错误报告到API
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(err => {
        console.error('Failed to report error:', err);
      });
    } catch (err) {
      console.error('Error reporting failed:', err);
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  copyErrorToClipboard = () => {
    const { error, errorInfo } = this.state;
    const errorText = `
错误信息: ${error?.message}
错误堆栈: ${error?.stack}
组件堆栈: ${errorInfo?.componentStack}
时间: ${new Date().toISOString()}
URL: ${window.location.href}
用户代理: ${navigator.userAgent}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      alert('错误信息已复制到剪贴板');
    }).catch(() => {
      alert('复制失败，请手动复制错误信息');
    });
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <ExclamationTriangleIcon className="h-6 w-6 mr-2" />
                应用程序错误
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 错误描述 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  很抱歉，应用程序遇到了一个错误
                </h3>
                <p className="text-gray-600">
                  我们已经记录了这个错误，并会尽快修复。您可以尝试刷新页面或返回上一页。
                </p>
              </div>

              {/* 错误详情 */}
              {this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <BugAntIcon className="h-5 w-5 text-red-500 mr-2" />
                    <h4 className="font-medium text-red-800">错误详情</h4>
                  </div>
                  <p className="text-sm text-red-700 font-mono bg-red-100 p-2 rounded">
                    {this.state.error.message}
                  </p>
                  
                  {/* 展开详细堆栈 */}
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                      查看详细堆栈信息
                    </summary>
                    <div className="mt-2 p-3 bg-red-100 rounded text-xs font-mono overflow-x-auto">
                      <div className="mb-3">
                        <strong>错误堆栈:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">{this.state.error.stack}</pre>
                      </div>
                      {this.state.errorInfo && (
                        <div>
                          <strong>组件堆栈:</strong>
                          <pre className="mt-1 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  icon={<ArrowPathIcon />}
                  onClick={this.handleRetry}
                >
                  重试
                </Button>
                <Button
                  variant="outline"
                  onClick={this.handleReload}
                >
                  刷新页面
                </Button>
                <Button
                  variant="ghost"
                  icon={<ClipboardDocumentIcon />}
                  onClick={this.copyErrorToClipboard}
                >
                  复制错误信息
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => window.history.back()}
                >
                  返回上一页
                </Button>
              </div>

              {/* 帮助信息 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">需要帮助？</h4>
                <p className="text-sm text-blue-700">
                  如果问题持续存在，请联系技术支持并提供上述错误信息。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// 简化的错误边界Hook版本
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
