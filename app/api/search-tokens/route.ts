import { NextResponse } from 'next/server';
import { AVE_API_KEY } from '../lib/constants';

// 缓存数据结构
interface CacheItem {
  data: any;
  timestamp: number;
}

// 缓存对象，用于存储搜索结果
const cache: Record<string, CacheItem> = {};

// 缓存有效期（5分钟，单位为毫秒）
const CACHE_TTL = 5 * 60 * 1000;

// 检查缓存是否有效
function isCacheValid(cacheKey: string): boolean {
  if (!cache[cacheKey]) return false;
  const now = Date.now();
  return now - cache[cacheKey].timestamp < CACHE_TTL;
}

export async function GET(request: Request) {
  console.log("Search tokens API route called:", request.url);
  
  // 获取查询参数
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword');
  const chain = searchParams.get('chain');
  
  if (!keyword) {
    return NextResponse.json({ 
      success: false, 
      error: "Missing required parameter: keyword" 
    }, { status: 400 });
  }
  
  console.log(`Searching tokens with keyword: ${keyword}, chain: ${chain || 'all'}`);
  
  try {
    // 构建缓存键 - 包含关键词和可选的链参数
    const cacheKey = `search_tokens_${keyword.toLowerCase()}_${chain || 'all'}`;
    
    // 检查缓存是否有效
    if (isCacheValid(cacheKey)) {
      console.log("Returning cached search results");
      return NextResponse.json(cache[cacheKey].data, { status: 200 });
    }
    
    console.log("Fetching fresh search results from Ave.ai API");
    
    // 构建API请求URL
    let apiUrl = `https://prod.ave-api.com/v2/tokens?keyword=${encodeURIComponent(keyword)}`;
    if (chain) {
      apiUrl = `${apiUrl}&chain=${encodeURIComponent(chain)}`;
    }
    
    // 发送请求到Ave.ai API
    const response = await fetch(apiUrl, {
      headers: {
        "Accept": "*/*",
        "X-API-KEY": AVE_API_KEY
      },
      cache: 'no-store',
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 1 || !data.data) {
      console.log("No search results found or invalid API response");
      const result = {
        success: true,
        tokens: [],
        count: 0,
        message: "No tokens found matching your search",
        keyword,
        chain: chain || 'all'
      };
      
      // 更新缓存
      cache[cacheKey] = {
        data: result,
        timestamp: Date.now()
      };
      
      return NextResponse.json(result, { status: 200 });
    }
    
    // 格式化搜索结果
    const tokens = data.data.map((token: any) => {
      // 解析appendix中的额外信息
      let appendixData = {};
      if (token.appendix) {
        try {
          appendixData = JSON.parse(token.appendix);
        } catch (e) {
          console.error('Error parsing appendix data:', e);
        }
      }
      
      return {
        token: token.token || "",
        chain: token.chain || "",
        symbol: token.symbol || "",
        name: token.name || appendixData.tokenName || token.symbol || "Unknown Token",
        logo_url: token.logo_url || "",
        current_price_usd: parseFloat(token.current_price_usd) || 0,
        price_change_24h: parseFloat(token.price_change_24h) || 0,
        tx_volume_u_24h: parseFloat(token.tx_volume_u_24h) || 0,
        holders: parseInt(token.holders) || 0,
        market_cap: token.market_cap || "0",
        risk_score: token.risk_score || 0
      };
    });
    
    // 准备返回数据
    const result = {
      success: true,
      tokens,
      count: tokens.length,
      keyword,
      chain: chain || 'all'
    };
    
    // 更新缓存
    cache[cacheKey] = {
      data: result,
      timestamp: Date.now()
    };
    
    return NextResponse.json(result, { status: 200 });
    
  } catch (error) {
    console.error("Error in search API route handler:", error);
    
    return NextResponse.json({ 
      success: false, 
      error: "Failed to search tokens",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 