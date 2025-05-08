import { useEffect } from 'react';
import { measurePerformance } from '@/app/lib/monitoring/performance';

/**
 * 组件性能跟踪Hook
 * 自动测量组件渲染性能
 */
export const usePerformanceTracking = (componentName: string) => {
  useEffect(() => {
    const perf = measurePerformance(`${componentName} render`);
    
    // 在组件卸载时记录总时长
    return () => {
      perf.end();
    };
  }, [componentName]);
}; 
 