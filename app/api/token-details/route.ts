import { NextResponse } from 'next/server';
import { aveGetTokenDetails, formatTokenId } from '@/app/lib/ave-api-service';
import { cacheService, CACHE_TTL } from '@/app/lib/cache-service';

/**
 * 生成模拟代币数据作为后备方案
 */
function generateMockTokenDetails(address: string, chain: string) {
  const normalizedSymbol = address.slice(0, 4).toUpperCase();
  return {
    success: true,
    symbol: normalizedSymbol,
    name: `${normalizedSymbol} Token`,
    address: address,
    logo: '',
    price: 0,
    priceChange: 0,
    priceChange24h: 0,
    volume24h: 0,
    marketCap: 0,
    totalSupply: 0,
    holders: 0,
    lpAmount: 0,
    lockPercent: 0,
    chain: chain,
    social: {
      website: '',
      twitter: '',
      telegram: '',
      discord: ''
    },
    risk: {
      riskScore: 0,
      riskLevel: 0,
      isMintable: false
    },
    isMockData: true
};
}

/**
 * GET 处理程序
 * 获取代币详细信息
 */
export async function GET(request: Request) {
  // 获取查询参数
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const chain = searchParams.get('chain');
  
  console.log(`Fetching token details for ${chain}:${address}`);
  
  // 参数验证
  if (!address || !chain) {
    return NextResponse.json({
      success: false,
      error: "Missing required parameters: address and chain"
    }, { status: 400 });
  }
  
  // 生成缓存键
  const cacheKey = `token_details_${address.toLowerCase()}_${chain.toLowerCase()}`;
  
  // 检查缓存
  const cachedData = cacheService.get(cacheKey);
  if (cachedData) {
    console.log('Returning cached token details');
    return NextResponse.json(cachedData);
  }
  
  try {
    // 准备调用AVE API的参数
    const tokenId = formatTokenId(address, chain);
    
    // 调用AVE API获取代币详细信息
    const tokenDetails = await aveGetTokenDetails({
      token_id: tokenId
    });
    
    // 如果未找到代币信息，返回模拟数据而不是错误
    if (!tokenDetails) {
      console.log(`Token details not found for ${tokenId}, using mock data`);
      const mockResult = generateMockTokenDetails(address, chain);
      
      // 将模拟数据缓存较短时间，以便未来请求可以再次尝试从API获取
      cacheService.set(cacheKey, mockResult, { ttl: CACHE_TTL.SHORT });
      
      return NextResponse.json(mockResult);
    }
    
    // 解析appendix中的额外信息
    let appendixData: Record<string, any> = {};
    if (tokenDetails.appendix) {
      try {
        appendixData = JSON.parse(tokenDetails.appendix);
      } catch (e) {
        console.error('Error parsing appendix data:', e);
      }
      }
      
    // 格式化返回结果
    const result = {
        success: true,
      symbol: tokenDetails.symbol || '',
      name: tokenDetails.name || (appendixData.tokenName as string) || 'Unknown Token',
      address: tokenDetails.token || address,
      logo: tokenDetails.logo_url || '',
      price: tokenDetails.current_price_usd || 0,
      priceChange: tokenDetails.price_change_1d || 0,
      priceChange24h: tokenDetails.price_change_24h || 0,
      volume24h: tokenDetails.tx_volume_u_24h || 0,
      marketCap: parseFloat(tokenDetails.market_cap || '0'),
      totalSupply: parseFloat(tokenDetails.total || '0'),
      holders: tokenDetails.holders || 0,
      lpAmount: parseFloat(tokenDetails.lock_amount || '0'),
      lockPercent: parseFloat(tokenDetails.locked_percent || '0'),
      chain: tokenDetails.chain || chain,
      // 额外信息
      social: {
        website: appendixData.website || '',
        twitter: appendixData.twitter || '',
        telegram: appendixData.telegram || '',
        discord: appendixData.discord || ''
      },
      risk: {
        riskScore: tokenDetails.risk_score || 0,
        riskLevel: tokenDetails.risk_level || 0,
        isMintable: tokenDetails.is_mintable === '1' || false
      }
    };
    
    // 缓存结果
    cacheService.set(cacheKey, result, { ttl: CACHE_TTL.MEDIUM });
      
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error fetching token details:', error);
    
    // 在API错误情况下也返回模拟数据
    const mockResult = generateMockTokenDetails(address, chain);
    
    // 将模拟数据缓存较短时间
    cacheService.set(cacheKey, mockResult, { ttl: CACHE_TTL.SHORT });
    
    return NextResponse.json(mockResult);
  }
} 