"use client"

import React, { ErrorInfo } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Home } from "lucide-react";
import { trackError } from '@/app/lib/monitoring/performance';

/**
 * 错误边界组件属性
 */
interface ErrorBoundaryProps {
  /** 子组件 */
  children: React.ReactNode;
  /** 自定义错误UI，可选 */
  fallback?: React.ReactNode;
  /** 是否记录错误，默认为true */
  logErrors?: boolean;
  /** 过滤掉特定错误，可选 */
  filterErrors?: (error: Error) => boolean;
  /** 点击重试时的回调，可选 */
  onReset?: () => void;
  /** 自定义错误报告回调，可选 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * 错误边界组件状态
 */
interface ErrorBoundaryState {
  /** 是否有错误发生 */
  hasError: boolean;
  /** 捕获的错误对象 */
  error: Error | null;
}

/**
 * 统一错误边界组件
 * 用于捕获和处理组件树中的JavaScript错误
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null 
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 检查是否需要过滤错误
    if (this.props.filterErrors && this.props.filterErrors(error)) {
      return;
    }

    // 记录错误
    if (this.props.logErrors !== false) {
      trackError(error, 'ErrorBoundary');
      console.error("Error boundary caught error:", error, errorInfo);
    }

    // 使用自定义错误处理程序（如果有）
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // 使用提供的fallback（如果有）
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 使用默认UI
      return (
        <div className="p-4 text-center">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-yellow-900/50 p-3 mb-3">
                <RefreshCw className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">组件加载失败</h3>
              <p className="text-red-400 mb-3 text-sm overflow-auto max-h-24">
                {this.state.error?.message || "未知错误"}
              </p>
              <div className="flex space-x-2">
                <Button 
                  onClick={this.handleReset}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> 重试
                </Button>
                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                >
                  <Home className="w-4 h-4 mr-2" /> 首页
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 