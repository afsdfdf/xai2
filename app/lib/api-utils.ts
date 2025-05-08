/**
 * API工具函数 - 提供通用请求处理、错误处理和超时机制
 */

interface ApiRequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * API请求错误类
 */
export class ApiError extends Error {
  status: number;
  statusText: string;
  data: any;

  constructor(message: string, status: number, statusText: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

/**
 * 通用API请求函数
 * @param endpoint API端点
 * @param options 请求选项
 * @returns 请求响应数据
 */
export async function apiRequest<T = any>(
  endpoint: string, 
  options: ApiRequestOptions = {}
): Promise<T> {
  const { 
    timeout = 15000, 
    retries = 0, 
    retryDelay = 1000,
    ...fetchOptions 
  } = options;

  // 创建AbortController用于超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // 构建完整URL
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : new URL(endpoint, window.location.origin).toString();
    
    // 发起请求
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      }
    });

    // 清除超时
    clearTimeout(timeoutId);

    // 获取响应数据
    const data = await response.json();

    // 检查响应状态
    if (!response.ok) {
      const errorMessage = data?.error || data?.message || `请求失败，状态码: ${response.status}`;
      throw new ApiError(
        errorMessage,
        response.status,
        response.statusText,
        data
      );
    }

    return data as T;
  } catch (error: any) {
    // 清除超时
    clearTimeout(timeoutId);

    // 处理中止错误
    if (error.name === 'AbortError') {
      throw new ApiError('请求超时', 408, 'Request Timeout');
    }

    // 处理API错误
    if (error instanceof ApiError) {
      // 确定是否应该重试
      const shouldRetry = retries > 0 && (
        // 服务器错误
        error.status >= 500 || 
        // 或者是429速率限制错误
        error.status === 429 ||
        // 或者是网络相关错误
        error.status === 0 || 
        error.status === 408
      );
      
      if (shouldRetry) {
        // 对于速率限制错误，使用更长的延迟
        const actualRetryDelay = error.status === 429 
          ? retryDelay * 2 
          : retryDelay;
        
        console.log(`请求失败(${error.status})，${actualRetryDelay}ms后重试，剩余重试次数: ${retries}`);
        await new Promise(resolve => setTimeout(resolve, actualRetryDelay));
        
        return apiRequest<T>(endpoint, {
          ...options,
          retries: retries - 1,
          retryDelay: actualRetryDelay * 1.5, // 指数退避
        });
      }
      throw error;
    }

    // 处理其他错误
    console.error('API请求错误:', error);
    throw new ApiError(
      error.message || '未知错误',
      500,
      'Internal Error'
    );
  }
}

/**
 * 用户友好的错误消息映射
 */
export const errorMessages: Record<number, string> = {
  400: '请求参数错误',
  401: '未授权，请登录',
  403: '无访问权限',
  404: '未找到请求的资源',
  408: '请求超时，请稍后再试',
  500: '服务器错误，请稍后再试',
  502: '网关错误，请稍后再试',
  503: '服务不可用，请稍后再试',
  504: '网关超时，请稍后再试'
};

/**
 * 获取用户友好的错误消息
 * @param error 错误对象
 * @returns 用户友好的错误消息
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return errorMessages[error.status] || error.message;
  }
  
  if (error instanceof Error) {
    if (error.message.includes('fetch')) {
      return '网络连接错误，请检查您的网络连接';
    }
    return error.message;
  }
  
  return '发生未知错误，请稍后再试';
}

/**
 * 构建带参数的URL
 * @param baseUrl 基础URL
 * @param params 参数对象
 * @returns 完整URL
 */
export function buildUrl(baseUrl: string, params: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(baseUrl, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });
  
  return url.toString();
} 