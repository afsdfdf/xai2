import { NextResponse } from 'next/server';
import { aveSearchTokens } from '@/app/lib/ave-api-service';
import { cacheService, CACHE_TTL } from '@/app/lib/cache-service';

// Get API key from environment variable or use the fallback
const AVE_API_KEY = process.env.AVE_API_KEY || "NMUuJmYHJB6d91bIpgLqpuLLKYVws82lj0PeDP3UEb19FoyWFJUVGLsgE95XTEmA";

/**
 * GET 处理程序
 * 搜索代币功能
 */
export async function GET(request: Request) {
  console.log("Search tokens API route called:", request.url);
  
  // 获取查询参数
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword');
  const chain = searchParams.get('chain') || undefined;
  
  if (!keyword) {
    return NextResponse.json({ 
      success: false, 
      error: "Missing required parameter: keyword" 
    }, { status: 400 });
  }
  
  console.log(`Searching tokens with keyword: ${keyword}, chain: ${chain || 'all'}`);
  
  try {
    // Check if we have AVE API key
    if (!AVE_API_KEY) {
      console.error("Missing AVE_API_KEY, cannot search tokens");
      return NextResponse.json({
        success: false,
        error: "Service configuration error",
        message: "API key missing",
        tokens: [],
        count: 0
      }, { status: 500 });
    }
    
    // 构建缓存键 - 包含关键词和可选的链参数
    const cacheKey = `search_tokens_${keyword.toLowerCase()}_${chain || 'all'}`;
    
    // 检查缓存是否有效
    const cachedResult = cacheService.get(cacheKey);
    if (cachedResult) {
      console.log("Returning cached search results");
      return NextResponse.json(cachedResult, { status: 200 });
    }
    
    console.log("Fetching fresh search results from Ave.ai API");
    
    // 调用AVE API搜索代币
    const tokens = await aveSearchTokens({
      keyword,
      chain
    });
    
    if (!tokens || tokens.length === 0) {
      console.log("No search results found or invalid API response");
      const result = {
        success: true,
        tokens: [],
        count: 0,
        message: "No tokens found matching your search",
        keyword,
        chain: chain || 'all'
      };
      
      // 更新缓存 - 空结果缓存时间较短
      cacheService.set(cacheKey, result, { ttl: CACHE_TTL.SHORT });
      
      return NextResponse.json(result, { status: 200 });
    }
    
    // 格式化搜索结果
    const formattedTokens = tokens.map(token => {
      // 解析appendix中的额外信息
      let appendixData: Record<string, any> = {};
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
        name: token.name || (appendixData.tokenName as string) || token.symbol || "Unknown Token",
        logo_url: token.logo_url || "",
        current_price_usd: parseFloat(token.current_price_usd?.toString() || "0") || 0,
        price_change_24h: parseFloat(token.price_change_24h?.toString() || "0") || 0,
        tx_volume_u_24h: parseFloat(token.tx_volume_u_24h?.toString() || "0") || 0,
        holders: parseInt(token.holders?.toString() || "0") || 0,
        market_cap: token.market_cap || "0",
        risk_score: token.risk_score || 0
      };
    });
    
    // 准备返回数据
    const result = {
      success: true,
      tokens: formattedTokens,
      count: formattedTokens.length,
      keyword,
      chain: chain || 'all'
    };
    
    // 更新缓存
    cacheService.set(cacheKey, result, { ttl: CACHE_TTL.MEDIUM });
    
    console.log(`Returning ${formattedTokens.length} search results`);
    return NextResponse.json(result, { status: 200 });
    
  } catch (error) {
    console.error("Error in search API route handler:", error);
    
    // Provide more detailed error message and return a proper response even on error
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const formattedError = {
      success: false, 
      error: "Failed to search tokens",
      message: errorMessage,
      tokens: [], // Always include an empty tokens array to prevent frontend errors
      count: 0
    };
    
    return NextResponse.json(formattedError, { status: 500 });
  }
}