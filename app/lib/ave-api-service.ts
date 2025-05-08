// Ave.ai API服务
import { apiRequest, buildUrl } from './api-utils';
import * as Types from './types/ave-api';

// API密钥配置 - 应从环境变量获取
const AVE_API_KEY = process.env.AVE_API_KEY || "NMUuJmYHJB6d91bIpgLqpuLLKYVws82lj0PeDP3UEb19FoyWFJUVGLsgE95XTEmA";

// 格式化token_id (地址-链)
export const formatTokenId = (address: string, chain: string): string => `${address}-${chain}`;

// 基础响应类型
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
  isMockData: boolean;
}

export interface KLineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  dexUrl?: string;
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
  isMockData?: boolean;
  social?: {
    website: string;
    twitter: string;
    telegram: string;
    discord: string;
  };
  risk?: {
    riskScore: number;
    riskLevel: number;
    isMintable: boolean;
  };
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

export interface TokenRiskResponse {
  success: boolean;
  riskAnalysis: Types.TokenRiskAnalysis;
  error?: string;
  message?: string;
}

export interface TokenHoldersResponse {
  success: boolean;
  holders: Types.TokenHolder[];
  count: number;
  error?: string;
  message?: string;
}

export interface ChainInfoResponse {
  success: boolean;
  chains: string[];
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
    
    try {
    const response = await apiRequest<SearchTokensResponse>(url, {
        timeout: 20000, // Increase timeout
        retries: 3 // Increase retry attempts
    });
    
    if (!response.success) {
        console.error('Search response not successful:', response.error || 'Unknown error');
        return [];
    }
    
    return response.tokens || [];
    } catch (apiError) {
      console.error('API request error in searchTokens:', apiError);
      // Return empty array instead of rethrowing the error
      return [];
    }
  } catch (error) {
    console.error('搜索代币错误:', error);
    // Return empty array instead of re-throwing
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
    
    const response = await apiRequest<TokenDetailsResponse & { isMockData?: boolean }>(url, {
      timeout: 15000,
      next: { revalidate: 60 } // 缓存一分钟
    });
    
    if (!response.success) {
      throw new Error(response.error || '获取代币详情失败');
    }
    
    // 处理模拟数据的情况，添加标记到返回的对象
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
      isMockData: response.isMockData || false
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
 * @param offset 数据偏移量，用于分页加载
 */
export async function getTokenKlineData(
  address: string, 
  chain: string, 
  interval: string = '1d',
  limit: number = 100,
  offset: number = 0
): Promise<KLineData[]> {
  try {
    // 验证参数
    if (!address || !chain) {
      console.error('Missing required parameters for getTokenKlineData');
      return [];
    }
    
    const params = {
      address: encodeURIComponent(address),
      chain: encodeURIComponent(chain),
      interval: encodeURIComponent(interval),
      limit: limit.toString(),
      offset: offset.toString()
    };
    
    const url = buildUrl('/api/token-kline', params);
    console.log('Fetching kline data with URL:', url);
    
    // 获取K线数据 - API直接返回数据数组，不再有包装对象
    try {
      const klineData = await apiRequest<KLineData[]>(url, {
        timeout: 20000, // 增加超时时间
        retries: 2,     // 添加重试
      next: { revalidate: 60 } // 缓存一分钟
    });
    
      // 检查返回的数据是否有效
      if (!klineData || !Array.isArray(klineData) || klineData.length === 0) {
        console.warn('Empty kline data received from API');
        return [];
      }
      
      // 验证每个数据点是否包含必需字段
      const validData = klineData.filter(point => {
        return (
          point && 
          typeof point === 'object' &&
          'time' in point && 
          'open' in point && 
          'high' in point && 
          'low' in point && 
          'close' in point && 
          'volume' in point
        );
      });
      
      if (validData.length === 0) {
        console.warn('No valid data points in API response');
        return [];
      }
      
      return validData;
    } catch (apiError) {
      console.error('Error in API request:', apiError);
      return [];
    }
  } catch (error) {
    console.error('获取K线数据错误:', error);
    // 返回空数组，让调用者处理空数据情况
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

// ========== 新增 AVE.ai API 直接调用方法 ==========

/**
 * 直接调用AVE API搜索代币
 * @param params 搜索参数
 */
export async function aveSearchTokens(
  params: Types.SearchTokensParams
): Promise<Types.TokenInfo[]> {
  try {
    const url = new URL(`https://prod.ave-api.com/v2/tokens`);
    url.searchParams.append('keyword', params.keyword);
    if (params.chain) {
      url.searchParams.append('chain', params.chain);
    }

    console.log(`Calling Ave.ai API: ${url.toString()}`);

    // Add timeout and retry logic for external API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Accept': '*/*',
          'X-API-KEY': AVE_API_KEY
        },
        cache: 'no-store',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details');
        console.error(`AVE API search request failed with status: ${response.status}, details: ${errorText}`);
        return [];
      }

      const data = await response.json() as Types.AveApiResponse<Types.TokenInfo[]>;
      
      if (data.status !== 1 || !data.data) {
        console.warn('AVE API returned unsuccessful status or empty data:', data);
        return [];
      }

      return data.data;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('AVE API request timed out');
      } else {
        console.error('AVE API fetch error:', fetchError);
      }
      return [];
    }
  } catch (error) {
    console.error('AVE API search tokens error:', error);
    return [];
  }
}

/**
 * 获取代币价格
 * @param tokenIds 代币ID列表
 * @param tvlMin 最小TVL阈值
 * @param txVolumeMin 最小24小时交易量
 */
export async function getTokenPrices(
  request: Types.TokenPriceRequestBody
): Promise<Record<string, Types.TokenInfo>> {
  try {
    const response = await fetch('https://prod.ave-api.com/v2/tokens/price', {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json',
        'X-API-KEY': AVE_API_KEY
      },
      body: JSON.stringify(request),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`获取代币价格API请求失败，状态码: ${response.status}`);
    }

    const data = await response.json() as Types.AveApiResponse<Record<string, Types.TokenInfo>>;
    
    if (data.status !== 1 || !data.data) {
      return {};
    }

    return data.data;
  } catch (error) {
    console.error('获取代币价格错误:', error);
    return {};
  }
}

/**
 * 获取排名主题列表
 */
export async function getTokenRankTopics(): Promise<{ id: string; name_en: string; name_zh: string }[]> {
  try {
    console.log('Fetching token rank topics from Ave API...');
    const response = await fetch('https://prod.ave-api.com/v2/ranks/topics', {
      headers: {
        'Accept': '*/*',
        'X-API-KEY': AVE_API_KEY
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`获取排名主题API请求失败，状态码: ${response.status}`);
      throw new Error(`获取排名主题API请求失败，状态码: ${response.status}`);
    }

    const data = await response.json();
    console.log('Token rank topics API response:', data);
    
    if (data.status !== 1 || !data.data || !Array.isArray(data.data)) {
      console.error('Invalid API response for token rank topics:', data);
      // Fall back to default topics
      return [
        { id: 'hot', name_en: 'Hot', name_zh: '热门' },
        { id: 'new', name_en: 'New', name_zh: '新币' },
        { id: 'meme', name_en: 'Meme', name_zh: 'Meme' }
      ];
    }

    return data.data;
  } catch (error) {
    console.error('获取排名主题错误:', error);
    // Return default topics on error
    return [
      { id: 'hot', name_en: 'Hot', name_zh: '热门' },
      { id: 'new', name_en: 'New', name_zh: '新币' },
      { id: 'meme', name_en: 'Meme', name_zh: 'Meme' }
    ];
  }
}

/**
 * 获取代币排名列表
 * @param topic 排名主题
 * @param chain 可选链名称
 * @param limit 限制返回数量
 */
export async function getTokenRankList(
  params: Types.TokenRankParams
): Promise<Types.TokenInfo[]> {
  try {
    const url = new URL(`https://prod.ave-api.com/v2/ranks`);
    url.searchParams.append('topic', params.topic);
    
    if (params.chain) {
      url.searchParams.append('chain', params.chain);
    }
    
    if (params.limit) {
      url.searchParams.append('limit', params.limit.toString());
    }

    console.log(`Fetching token rank list from URL: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': '*/*',
        'X-API-KEY': AVE_API_KEY
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`获取代币排名API请求失败，状态码: ${response.status}`);
      throw new Error(`获取代币排名API请求失败，状态码: ${response.status}`);
    }

    const data = await response.json() as Types.AveApiResponse<Types.TokenInfo[]>;
    console.log(`Token rank list API response status: ${data.status}, data length: ${data.data?.length || 0}`);
    
    if (data.status !== 1 || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
      console.error('Invalid API response for token rank list:', data);
      // Return default tokens for common topics
      return getDefaultTokensForTopic(params.topic);
    }

    return data.data;
  } catch (error) {
    console.error('获取代币排名错误:', error);
    // Return default tokens on error
    return getDefaultTokensForTopic(params.topic);
  }
}

/**
 * 获取特定主题的默认代币
 * @param topic 主题ID
 * @returns 默认代币列表
 */
function getDefaultTokensForTopic(topic: string): Types.TokenInfo[] {
  // 简单的默认数据，可以根据主题返回不同的默认数据
  const defaultTokens: Types.TokenInfo[] = [
    {
      token: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      chain: "eth",
      symbol: "USDT",
      name: "Tether USD",
      decimal: "6",
      total: "78501202483.75",
      lock_amount: "0",
      burn_amount: "0",
      other_amount: "0",
      fdv: "78501202483.75",
      market_cap: "78501202483.75",
      launch_price: 1.0,
      launch_at: 1514764800, // 2018-01-01
      current_price_eth: 0.000425,
      current_price_usd: 1.0,
      price_change_1d: 0.01,
      price_change_24h: 0.01,
      tx_volume_u_24h: 50000000,
      tx_count_24h: 50000,
      holders: 5000000,
      logo_url: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png",
      risk_level: 0,
      risk_score: 0,
      created_at: 1514764800
    },
    {
      token: "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
      chain: "eth",
      symbol: "BNB",
      name: "BNB",
      decimal: "18",
      total: "166801148",
      lock_amount: "0",
      burn_amount: "0",
      other_amount: "0",
      fdv: "95000000000",
      market_cap: "95000000000",
      launch_price: 0.1,
      launch_at: 1514764800, // 2018-01-01
      current_price_eth: 0.25,
      current_price_usd: 580.0,
      price_change_1d: 2.0,
      price_change_24h: 2.5,
      tx_volume_u_24h: 10000000,
      tx_count_24h: 20000,
      holders: 1000000,
      logo_url: "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png",
      risk_level: 0,
      risk_score: 0,
      created_at: 1514764800
    },
    {
      token: "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0",
      chain: "eth",
      symbol: "MATIC",
      name: "Polygon",
      decimal: "18",
      total: "8734317201.8",
      lock_amount: "0",
      burn_amount: "0",
      other_amount: "0",
      fdv: "5000000000",
      market_cap: "5000000000",
      launch_price: 0.01,
      launch_at: 1556668800, // 2019-05-01
      current_price_eth: 0.00025,
      current_price_usd: 0.6,
      price_change_1d: -0.5,
      price_change_24h: -0.8,
      tx_volume_u_24h: 6000000,
      tx_count_24h: 15000,
      holders: 600000,
      logo_url: "https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png",
      risk_level: 0,
      risk_score: 0,
      created_at: 1556668800
    }
  ];
  
  return defaultTokens;
}

/**
 * 获取代币详细信息(直接调用AVE API)
 * @param tokenId 格式: {address}-{chain}
 */
export async function aveGetTokenDetails(
  params: Types.TokenDetailsParams
): Promise<Types.TokenInfo | null> {
  try {
    const url = `https://prod.ave-api.com/v2/tokens/${params.token_id}`;

    const response = await fetch(url, {
      headers: {
        'Accept': '*/*',
        'X-API-KEY': AVE_API_KEY
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`获取代币详情API请求失败，状态码: ${response.status}`);
    }

    const data = await response.json() as Types.AveApiResponse<Types.TokenInfo>;
    
    if (data.status !== 1 || !data.data) {
      return null;
    }

    return data.data;
  } catch (error) {
    console.error('获取代币详情错误:', error);
    return null;
  }
}

/**
 * 获取交易对K线数据
 * @param params K线参数
 */
export async function getPairKlineData(
  params: Types.KLineParams
): Promise<Types.KLinePoint[]> {
  try {
    if (!params.pair_id) {
      throw new Error('交易对ID是必需的');
    }

    const url = new URL(`https://prod.ave-api.com/v2/klines/pair/${params.pair_id}`);
    
    if (params.interval !== undefined) {
      url.searchParams.append('interval', params.interval.toString());
    }
    
    if (params.size !== undefined) {
      url.searchParams.append('size', params.size.toString());
    }
    
    if (params.from !== undefined) {
      url.searchParams.append('from', params.from.toString());
    }
    
    if (params.to !== undefined) {
      url.searchParams.append('to', params.to.toString());
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': '*/*',
        'X-API-KEY': AVE_API_KEY
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`获取交易对K线数据API请求失败，状态码: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 1 || !data.data || !data.data.points) {
      return [];
    }

    return data.data.points;
  } catch (error) {
    console.error('获取交易对K线数据错误:', error);
    return [];
  }
}

/**
 * 获取代币K线数据(直接调用AVE API)
 * @param params K线参数
 */
export async function aveGetTokenKlineData(
  params: Types.KLineParams
): Promise<Types.KLinePoint[]> {
  try {
    if (!params.token_id) {
      throw new Error('代币ID是必需的');
    }

    const url = new URL(`https://prod.ave-api.com/v2/klines/token/${params.token_id}`);
    
    if (params.interval !== undefined) {
      url.searchParams.append('interval', params.interval.toString());
    }
    
    if (params.size !== undefined) {
      url.searchParams.append('size', params.size.toString());
    }
    
    if (params.from !== undefined) {
      url.searchParams.append('from', params.from.toString());
    }
    
    if (params.to !== undefined) {
      url.searchParams.append('to', params.to.toString());
    }
    
    // 添加对offset参数的支持
    if (params.offset !== undefined) {
      url.searchParams.append('offset', params.offset.toString());
    }

    console.log('请求AVE K线数据URL:', url.toString());
    
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': '*/*',
        'X-API-KEY': AVE_API_KEY
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`获取代币K线数据API请求失败，状态码: ${response.status}`);
    }

    const data = await response.json();
    console.log('AVE K线数据响应状态:', data.status);
    
    // 检查响应状态
    if (data.status !== 1) {
      console.warn('AVE API 返回错误状态:', data.msg || '未知错误');
      return [];
    }
    
    // 确保data和data.data.points存在
    if (!data.data || !data.data.points) {
      console.warn('AVE API 返回的数据结构不完整:', JSON.stringify(data).slice(0, 200) + '...');
      return [];
    }
    
    // 记录一些统计信息以便调试
    const pointsCount = Array.isArray(data.data.points) ? data.data.points.length : 0;
    console.log(`AVE API 返回了 ${pointsCount} 个K线数据点`);
    
    // 检查返回的点是否有效
    if (pointsCount === 0) {
      console.warn('AVE API 返回了空的K线数据');
      return [];
    }
    
    // 打印第一个数据点用于调试
    if (pointsCount > 0) {
      console.log('AVE API 返回的第一个数据点:', JSON.stringify(data.data.points[0]));
    }
    
    // 验证每个点的结构是否符合预期
    const validPoints = data.data.points.filter((point: any) => {
      return (
        point && 
        typeof point === 'object' &&
        'time' in point && 
        'open' in point && 
        'high' in point && 
        'low' in point && 
        'close' in point && 
        'volume' in point
      );
    });
    
    if (validPoints.length === 0) {
      console.warn('AVE API 返回的数据点均不符合预期格式');
      return [];
    }
    
    if (validPoints.length !== pointsCount) {
      console.warn(`AVE API 返回的 ${pointsCount} 个数据点中只有 ${validPoints.length} 个有效`);
    }
    
    return validPoints;
  } catch (error) {
    console.error('获取代币K线数据错误:', error);
    return [];
  }
}

/**
 * 获取代币Top100持有者
 * @param params 持有者参数
 */
export async function getTokenTop100Holders(
  params: Types.TokenHoldersParams
): Promise<Types.TokenHolder[]> {
  try {
    const url = new URL(`https://prod.ave-api.com/v2/token-holders/${params.token_id}`);
    
    if (params.offset !== undefined) {
      url.searchParams.append('offset', params.offset.toString());
    }
    
    if (params.limit !== undefined) {
      url.searchParams.append('limit', params.limit.toString());
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': '*/*',
        'X-API-KEY': AVE_API_KEY
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`获取代币持有者API请求失败，状态码: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 1 || !data.data || !data.data.holders) {
      return [];
    }

    return data.data.holders;
  } catch (error) {
    console.error('获取代币持有者错误:', error);
    return [];
  }
}

/**
 * 获取交易对交易历史
 * @param params 交易参数
 */
export async function getPairTransactions(
  params: Types.TokenTransactionsParams
): Promise<any[]> {
  try {
    const url = new URL(`https://prod.ave-api.com/v2/pair-txs/${params.pair_id}`);
    
    if (params.offset !== undefined) {
      url.searchParams.append('offset', params.offset.toString());
    }
    
    if (params.limit !== undefined) {
      url.searchParams.append('limit', params.limit.toString());
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': '*/*',
        'X-API-KEY': AVE_API_KEY
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`获取交易历史API请求失败，状态码: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 1 || !data.data || !data.data.txs) {
      return [];
    }

    return data.data.txs;
  } catch (error) {
    console.error('获取交易历史错误:', error);
    return [];
  }
}

/**
 * 获取支持的链列表
 */
export async function getSupportedChains(): Promise<string[]> {
  try {
    const response = await fetch('https://prod.ave-api.com/v2/chains', {
      headers: {
        'Accept': '*/*',
        'X-API-KEY': AVE_API_KEY
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`获取支持链列表API请求失败，状态码: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 1 || !data.data) {
      return [];
    }

    return data.data;
  } catch (error) {
    console.error('获取支持链列表错误:', error);
    return [];
  }
}

/**
 * 获取链主要代币
 * @param chain 链名称
 */
export async function getChainMainTokens(chain: string): Promise<any[]> {
  try {
    const url = `https://prod.ave-api.com/v2/chain-main-tokens/${chain}`;

    const response = await fetch(url, {
      headers: {
        'Accept': '*/*',
        'X-API-KEY': AVE_API_KEY
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`获取链主要代币API请求失败，状态码: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 1 || !data.data) {
      return [];
    }

    return data.data;
  } catch (error) {
    console.error('获取链主要代币错误:', error);
    return [];
  }
}

/**
 * 获取链趋势列表
 * @param chain 链名称
 */
export async function getChainTrendingList(chain: string): Promise<Types.TokenInfo[]> {
  try {
    const url = `https://prod.ave-api.com/v2/chain-trending/${chain}`;

    const response = await fetch(url, {
      headers: {
        'Accept': '*/*',
        'X-API-KEY': AVE_API_KEY
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`获取链趋势列表API请求失败，状态码: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 1 || !data.data) {
      return [];
    }

    return data.data;
  } catch (error) {
    console.error('获取链趋势列表错误:', error);
    return [];
  }
}

/**
 * 获取合约风险检测报告
 * @param tokenId 代币ID
 */
export async function getContractRiskReport(tokenId: string): Promise<Types.TokenRiskAnalysis | null> {
  try {
    const url = `https://prod.ave-api.com/v2/contract-detection/${tokenId}`;

    const response = await fetch(url, {
      headers: {
        'Accept': '*/*',
        'X-API-KEY': AVE_API_KEY
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`获取合约风险检测报告API请求失败，状态码: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 1 || !data.data) {
      return null;
    }

    return data.data;
  } catch (error) {
    console.error('获取合约风险检测报告错误:', error);
    return null;
  }
} 