"use client"

import { useEffect, useState } from 'react';

interface ErrorLog {
  timestamp: string;
  message: string;
  type: 'error' | 'warning' | 'info';
}

export default function ChartErrorMonitor() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 监听全局错误
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;
    
    // 限制错误日志数量
    const addError = (message: string, type: 'error' | 'warning' | 'info') => {
      const timestamp = new Date().toISOString();
      setErrors(prev => {
        const newErrors = [...prev, { timestamp, message, type }];
        // 只保留最近的 50 条记录
        return newErrors.slice(-50);
      });
    };
    
    // 重写console方法
    console.error = (...args) => {
      originalError.apply(console, args);
      // 只捕获与图表相关的错误
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      if (message.includes('chart') || 
          message.includes('LightweightCharts') || 
          message.includes('图表') || 
          message.includes('K线')) {
        addError(message, 'error');
      }
    };
    
    console.warn = (...args) => {
      originalWarn.apply(console, args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      if (message.includes('chart') || 
          message.includes('LightweightCharts') || 
          message.includes('图表') || 
          message.includes('K线')) {
        addError(message, 'warning');
      }
    };
    
    console.log = (...args) => {
      originalLog.apply(console, args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      if ((message.includes('chart') || 
          message.includes('LightweightCharts') || 
          message.includes('图表') || 
          message.includes('K线')) &&
          !message.includes('图表创建条件未满足')) { // 过滤掉太频繁的日志
        addError(message, 'info');
      }
    };
    
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
    };
  }, []);
  
  // 清除错误
  const clearErrors = () => {
    setErrors([]);
  };
  
  if (errors.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isExpanded ? (
        <button 
          onClick={() => setIsExpanded(true)}
          className="bg-red-600 text-white px-3 py-1 rounded-full text-xs flex items-center shadow-lg"
        >
          <span className="mr-1">{errors.length}</span>
          <span>图表错误</span>
        </button>
      ) : (
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-2 w-96 max-h-96 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-white text-sm font-bold">图表错误监视器</h3>
            <div className="flex">
              <button 
                onClick={clearErrors}
                className="text-gray-400 hover:text-white text-xs mr-2"
              >
                清除
              </button>
              <button 
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                关闭
              </button>
            </div>
          </div>
          
          <div className="overflow-y-auto flex-grow">
            {errors.map((error, index) => (
              <div key={index} className="mb-1 text-xs border-b border-gray-800 pb-1">
                <div className="flex justify-between">
                  <span className={
                    error.type === 'error' ? 'text-red-500' : 
                    error.type === 'warning' ? 'text-yellow-500' : 
                    'text-blue-500'
                  }>
                    {error.type.toUpperCase()}
                  </span>
                  <span className="text-gray-500">{error.timestamp.substring(11, 19)}</span>
                </div>
                <div className="text-gray-300 break-words">{error.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 