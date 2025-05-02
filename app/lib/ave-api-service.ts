// Ave.ai API服务
import { apiRequest, buildUrl } from './api-utils';

// API密钥配置 - 生产环境从环境变量获取
const AVE_API_KEY = process.env.AVE_API_KEY || "";

export interface TokenPrice {
  symbol: string;
  name: string;
  address: string;
  logo_url?: string;
  price?: number;
  current_price_usd?: number;
  priceChange24h?: number;
  price_change_24h?: number;
  volume24h?: number;
  tx_volume_u_24h?: number;
  marketCap?: number;
  market_cap?: string;
  holders?: number;
  chain: string;
  token: string;
}

export interface TokenDetails {
  tokenInfo: TokenPrice;
  price: number;
  priceChange: number;
  volume24h: number;
  marketCap: number;
  totalSupply: number;
  holders: number;
  lpAmount: number;
  lockPercent: number;
}

export interface KLineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// API响应接口定义
export interface SearchTokensResponse {
  success: boolean;
  tokens: TokenPrice[];
  count: number;
  keyword?: string;
  chain?: string;
  error?: string;
  message?: string;
}

export interface TokenDetailsResponse {
  success: boolean;
  symbol: string;
  name: string;
  address: string;
  logo: string;
  price: number;
  priceChange: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  totalSupply: number;
  holders: number;
  lpAmount: number;
  lockPercent: number;
  chain: string;
  error?: string;
  message?: string;
}

export interface TokenKlineResponse {
  success: boolean;
  klineData: {
    time: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }[];
  error?: string;
  message?: string;
}

export interface TokenTransactionsResponse {
  success: boolean;
  transactions: any[];
  error?: string;
  message?: string;
}

/**
 * 搜索代币
 * @param keyword 搜索关键词
 * @param chain 可选的链名称
 */
export async function searchTokens(keyword: string, chain?: string): Promise<TokenPrice[]> {
  try {
    const params: Record<string, string | undefined> = {
      keyword,
      chain
    };
    
    const url = buildUrl('/api/search-tokens', params);
    console.log('Searching tokens with URL:', url);
    
    const response = await apiRequest<SearchTokensResponse>(url, {
      timeout: 10000,
      retries: 1
    });
    
    if (!response.success) {
      throw new Error(response.error || '搜索请求失败');
    }
    
    return response.tokens || [];
  } catch (error) {
    console.error('搜索代币错误:', error);
    return [];
  }
}

/**
 * 获取代币详情
 * @param address 代币地址
 * @param chain 区块链名称
 */
export async function getTokenDetails(address: string, chain: string): Promise<TokenDetails | null> {
  try {
    const params = {
      address: encodeURIComponent(address),
      chain: encodeURIComponent(chain)
    };
    
    const url = buildUrl('/api/token-details', params);
    
    const response = await apiRequest<TokenDetailsResponse>(url, {
      timeout: 15000,
      next: { revalidate: 60 } // 缓存一分钟
    });
    
    if (!response.success) {
      throw new Error(response.error || '获取代币详情失败');
    }
    
    return {
      tokenInfo: {
        symbol: response.symbol || '',
        name: response.name || '',
        address: response.address || '',
        logo_url: response.logo || '',
        price: response.price || 0,
        priceChange24h: response.priceChange24h || 0,
        volume24h: response.volume24h || 0,
        marketCap: response.marketCap || 0,
        holders: response.holders || 0,
        chain: response.chain || '',
        token: response.address || '',
      },
      price: response.price || 0,
      priceChange: response.priceChange || 0,
      volume24h: response.volume24h || 0,
      marketCap: response.marketCap || 0,
      totalSupply: response.totalSupply || 0,
      holders: response.holders || 0,
      lpAmount: response.lpAmount || 0,
      lockPercent: response.lockPercent || 0,
    };
  } catch (error) {
    console.error('获取代币详情错误:', error);
    return null;
  }
}

/**
 * 获取代币K线数据
 * @param address 代币地址
 * @param chain 区块链名称
 * @param interval 时间间隔 (1m, 5m, 15m, 30m, 1h, 4h, 1d, etc.)
 * @param limit 获取的数据点数量
 */
export async function getTokenKlineData(
  address: string, 
  chain: string, 
  interval: string = '1d',
  limit: number = 100
): Promise<KLineData[]> {
  try {
    const params = {
      address: encodeURIComponent(address),
      chain: encodeURIComponent(chain),
      interval: encodeURIComponent(interval),
      limit: String(limit)
    };
    
    const url = buildUrl('/api/token-kline', params);
    
    const response = await apiRequest<TokenKlineResponse>(url, {
      timeout: 15000,
      next: { revalidate: 60 } // 缓存一分钟
    });
    
    if (!response.success) {
      throw new Error(response.error || '获取K线数据失败');
    }
    
    return response.klineData.map(item => ({
      time: item.time,
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseFloat(item.volume),
    }));
  } catch (error) {
    console.error('获取K线数据错误:', error);
    return [];
  }
}

/**
 * 获取代币交易历史
 * @param address 代币地址
 * @param chain 区块链名称
 * @param limit 限制返回的交易数量
 */
export async function getTokenTransactions(
  address: string, 
  chain: string, 
  limit: number = 20
): Promise<any[]> {
  try {
    const params = {
      address: encodeURIComponent(address),
      chain: encodeURIComponent(chain),
      limit: String(limit)
    };
    
    const url = buildUrl('/api/token-transactions', params);
    
    const response = await apiRequest<TokenTransactionsResponse>(url, {
      timeout: 15000,
      next: { revalidate: 300 } // 缓存5分钟
    });
    
    if (!response.success) {
      throw new Error(response.error || '获取交易历史失败');
    }
    
    return response.transactions;
  } catch (error) {
    console.error('获取交易历史错误:', error);
    return [];
  }
} 