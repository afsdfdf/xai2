import { NextResponse } from 'next/server';
import { AVE_API_KEY } from '../lib/constants';

// 模拟数据，在API调用失败时使用
const mockTokenData = {
  symbol: "BL",
  name: "Blast",
  address: "0xtoken",
  logo: "/LOGO.JPG",
  price: 0.007354,
  priceChange: -0.53,
  volume24h: 769.3006,
  marketCap: 44443.23,
  totalSupply: 89.14,
  holders: 2798,
  lpAmount: 269,
  lockPercent: 99.97,
  chain: "eth"
};

/**
 * GET 处理程序
 * 获取代币详情数据
 */
export async function GET(request: Request) {
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
  
  try {
    // 尝试从 Ave.ai 获取真实数据
    try {
      const url = new URL(`https://prod.ave-api.com/v2/tokens/${address}`);
      url.searchParams.append('chain', chain);
      
      console.log(`Fetching from API: ${url.toString()}`);
      
      const response = await fetch(url.toString(), {
        headers: {
          'Accept': '*/*',
          'X-API-KEY': AVE_API_KEY
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        console.log(`API response not OK: ${response.status}`);
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 1 || !data.data) {
        console.log('Invalid API response format');
        throw new Error('Invalid API response format');
      }
      
      // 处理API返回的数据
      const tokenData = data.data;
      
      return NextResponse.json({
        success: true,
        symbol: tokenData.symbol,
        name: tokenData.name,
        address: tokenData.token,
        logo: tokenData.logo_url,
        price: parseFloat(tokenData.current_price_usd) || 0,
        priceChange: parseFloat(tokenData.price_change_24h) || 0,
        volume24h: parseFloat(tokenData.tx_volume_u_24h) || 0,
        marketCap: parseFloat(tokenData.market_cap) || 0,
        totalSupply: parseFloat(tokenData.total_supply) || 0,
        holders: parseInt(tokenData.holders) || 0,
        lpAmount: parseFloat(tokenData.lp_amount) || 0,
        lockPercent: parseFloat(tokenData.lock_percent) || 0,
        chain: tokenData.chain
      });
      
    } catch (apiError) {
      console.error('Error fetching from Ave.ai API:', apiError);
      
      // 使用模拟数据
      console.log('Using mock data for token details');
      
      return NextResponse.json({
        success: true,
        ...mockTokenData
      });
    }
  } catch (error) {
    console.error('Error in token-details API:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch token details'
    }, { status: 500 });
  }
} 