export const measurePerformance = (name: string) => {
  const start = performance.now();
  return {
    end: () => {
      const duration = performance.now() - start;
      console.log(`Performance [${name}]: ${duration.toFixed(2)}ms`);
      return duration;
    }
  };
};

export const trackError = (error: Error, context: string) => {
  console.error(`Error in ${context}:`, error);
  // TODO: 添加错误上报逻辑
};

export const trackApiCall = async <T>(
  name: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  const perf = measurePerformance(`API Call [${name}]`);
  try {
    const result = await apiCall();
    perf.end();
    return result;
  } catch (error) {
    perf.end();
    trackError(error as Error, `API Call [${name}]`);
    throw error;
  }
}; 