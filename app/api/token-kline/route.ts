import { NextResponse } from 'next/server';
import { AVE_API_KEY } from '../lib/constants';

// 生成模拟K线数据的函数
function generateMockKlineData(count: number = 100) {
  const now = Math.floor(Date.now() / 1000);
  const interval = 60; // 60秒为一个间隔
  const basePrice = 0.007354;
  const volatility = 0.005; // 价格波动范围
  
  return Array(count).fill(0).map((_, index) => {
    const time = now - (count - index) * interval;
    
    // 生成基于前一个价格的随机波动
    const randomFactor = 0.5 - Math.random(); // -0.5 到 0.5 之间的随机数
    const priceChange = basePrice * volatility * randomFactor;
    
    const open = basePrice + priceChange * (index - 1) / count;
    const close = basePrice + priceChange * index / count;
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);
    const volume = 100 + Math.random() * 2000;
    
    return {
      open: open.toFixed(8),
      high: high.toFixed(8),
      low: low.toFixed(8),
      close: close.toFixed(8),
      volume: volume.toFixed(5),
      time
    };
  });
}

/**
 * GET 处理程序
 * 获取代币K线数据
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const chain = searchParams.get('chain');
  const interval = searchParams.get('interval') || '1d'; // 默认日K
  const limit = parseInt(searchParams.get('limit') || '100'); // 默认100条数据
  
  console.log(`Fetching kline data for ${chain}:${address}, interval=${interval}, limit=${limit}`);
  
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
      // 格式化token_id
      const tokenId = `${address}-${chain}`;
      
      // 处理时间间隔参数
      const intervalMap: { [key: string]: number } = {
        '1m': 1,
        '5m': 5,
        '15m': 15,
        '30m': 30,
        '1h': 60,
        '2h': 120,
        '4h': 240,
        '1d': 1440,
        '3d': 4320,
        '1w': 10080,
        '1M': 43200,
        '1y': 525600
      };
      
      const intervalValue = intervalMap[interval] || 1440; // 默认日K
      
      const url = new URL(`https://prod.ave-api.com/v2/klines/token/${tokenId}`);
      url.searchParams.append('interval', intervalValue.toString());
      url.searchParams.append('size', limit.toString());
      
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
      
      if (data.status !== 1 || !data.data || !data.data.points) {
        console.log('Invalid API response format');
        throw new Error('Invalid API response format');
      }
      
      // 处理API返回的K线数据
      const klinePoints = data.data.points;
      
      return NextResponse.json({
        success: true,
        klineData: klinePoints.map((point: any) => ({
          time: point.time,
          open: parseFloat(point.open),
          high: parseFloat(point.high),
          low: parseFloat(point.low),
          close: parseFloat(point.close),
          volume: parseFloat(point.volume)
        })),
        tokenId: data.data.pair_id,
        interval: data.data.interval,
        limit: data.data.limit
      });
      
    } catch (apiError) {
      console.error('Error fetching from Ave.ai API:', apiError);
      
      // 生成模拟K线数据
      console.log('Using mock data for kline');
      const mockData = generateMockKlineData(limit);
      
      return NextResponse.json({
        success: true,
        klineData: mockData,
        tokenId: `${address}-${chain}`,
        interval: interval,
        message: "使用模拟数据，API连接失败"
      });
    }
  } catch (error) {
    console.error('Error in token-kline API:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch kline data'
    }, { status: 500 });
  }
} 