/**
 * 全局错误处理工具
 * 提供一个统一的错误处理机制，避免不必要的控制台错误
 */

// 初始化错误处理
export function initErrorHandler() {
  // 仅在客户端运行
  if (typeof window === 'undefined') return;

  // 保存原始console方法
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;

  // 安全地将任何值转换为字符串
  const safeStringify = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (e) {
        return Object.prototype.toString.call(value);
      }
    }
    
    return String(value);
  };

  // 过滤不需要显示的错误
  console.error = function(...args) {
    // 检查错误是否是我们想要过滤的
    const errorString = safeStringify(args[0]);
    
    // 过滤掉已知会出现但不影响功能的错误
    const errorsToFilter = [
      'Cannot redefine property: ethereum',
      '[object Object]',
      'Failed to load resource',
      'ChunkLoadError',
      'NetworkError',
      'Loading chunk'
    ];
    
    // 如果错误在过滤列表中，则不显示
    if (errorsToFilter.some(error => errorString.includes(error))) {
      // 开发环境可以显示被过滤的错误的简短提示
      if (process.env.NODE_ENV === 'development') {
        originalConsoleLog('[已过滤错误]', errorString.slice(0, 50) + (errorString.length > 50 ? '...' : ''));
      }
      return;
    }
    
    // 对于其他错误，正常显示
    originalConsoleError.apply(console, args);
  };

  // 改进console.log，防止直接输出对象导致[object Object]
  console.log = function(...args) {
    // 处理参数，确保对象被正确格式化
    const processedArgs = args.map(arg => {
      // 如果是简单对象且没有被格式化为字符串，尝试格式化它
      if (arg && typeof arg === 'object' && 
          Object.prototype.toString.call(arg) === '[object Object]' &&
          args.length === 1) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return arg;
        }
      }
      return arg;
    });
    
    // 使用处理后的参数调用原始函数
    originalConsoleLog.apply(console, processedArgs);
  };

  // 添加全局未捕获错误处理
  window.addEventListener('error', (event) => {
    const errorMsg = event.error ? event.error.toString() : event.message;
    
    // 检查错误消息是否包含我们要过滤的字符串
    if (
      errorMsg && (
        errorMsg.includes('ethereum') || 
        errorMsg.includes('[object Object]') ||
        errorMsg.includes('ChunkLoadError') ||
        errorMsg.includes('NetworkError')
      )
    ) {
      // 阻止错误显示在控制台
      event.preventDefault();
      return false;
    }
    
    // 其他错误正常处理
    return true;
  }, true);

  // 添加全局未处理的Promise拒绝处理
  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg = safeStringify(event.reason);
    
    // 检查错误消息是否包含我们要过滤的字符串
    if (
      reasonMsg && (
        reasonMsg.includes('ethereum') || 
        reasonMsg.includes('[object Object]') ||
        reasonMsg.includes('ChunkLoadError') ||
        reasonMsg.includes('NetworkError') ||
        reasonMsg.includes('Loading chunk')
      )
    ) {
      // 阻止错误显示在控制台
      event.preventDefault();
      return false;
    }
    
    // 其他拒绝正常处理
    return true;
  }, true);
} 