/**
 * 缓存服务 - 替代Python缓存系统
 */

type CacheItem<T> = {
  data: T;
  timestamp: number;
};

type CacheOptions = {
  ttl?: number; // 缓存生存时间（毫秒）
};

class CacheService {
  private cache: Map<string, CacheItem<any>>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 60 * 1000) { // 默认1分钟
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * 获取缓存项
   * @param key 缓存键
   * @returns 缓存数据或undefined(如果不存在或已过期)
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }
    
    // 检查是否过期
    if (Date.now() - item.timestamp > this.defaultTTL) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.data as T;
  }

  /**
   * 设置缓存项
   * @param key 缓存键
   * @param data 缓存数据
   * @param options 缓存选项
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.defaultTTL;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // 设置自动过期
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl);
  }

  /**
   * 删除缓存项
   * @param key 缓存键
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存项数量
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 获取缓存键列表
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * 带有缓存的函数包装器
   * @param fn 需要缓存结果的异步函数
   * @param keyFn 生成缓存键的函数
   * @param ttl 缓存生存时间(毫秒)
   * @returns 包装后的函数
   */
  async withCache<T, Args extends any[]>(
    fn: (...args: Args) => Promise<T>,
    keyFn: (...args: Args) => string,
    ttl?: number
  ): Promise<(...args: Args) => Promise<T>> {
    return async (...args: Args): Promise<T> => {
      const key = keyFn(...args);
      const cached = this.get<T>(key);
      
      if (cached !== undefined) {
        return cached;
      }
      
      const result = await fn(...args);
      this.set(key, result, { ttl });
      return result;
    };
  }
}

// 创建缓存服务实例
export const cacheService = new CacheService();

// 默认缓存时间(毫秒)
export const CACHE_TTL = {
  SHORT: 60 * 1000,         // 1分钟
  MEDIUM: 5 * 60 * 1000,    // 5分钟
  LONG: 15 * 60 * 1000,     // 15分钟
  VERY_LONG: 60 * 60 * 1000 // 1小时
};

// 导出默认实例
export default cacheService; 