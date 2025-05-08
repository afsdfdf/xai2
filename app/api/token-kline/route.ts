import { NextResponse } from 'next/server';
import { aveGetTokenKlineData, formatTokenId } from '@/app/lib/ave-api-service';
import { cacheService, CACHE_TTL } from '@/app/lib/cache-service';
import { KLinePoint } from '@/app/lib/types/ave-api';

// Ave.ai API Key
const AVE_API_KEY = "NMUuJmYHJB6d91bIpgLqpuLLKYVws82lj0PeDP3UEb19FoyWFJUVGLsgE95XTEmA";

// 生成模拟K线数据的函数 - 更加真实和稳定
function generateMockKlineData(count: number = 100, interval: string = '1h', offset: number = 0) {
  const now = Math.floor(Date.now() / 1000);
  let intervalSeconds = 3600; // 默认1小时
  
  // 根据interval设置适当的时间间隔
  switch (interval) {
    case '1m': intervalSeconds = 60; break;
    case '5m': intervalSeconds = 300; break;
    case '15m': intervalSeconds = 900; break;
    case '30m': intervalSeconds = 1800; break;
    case '1h': intervalSeconds = 3600; break;
    case '4h': intervalSeconds = 14400; break;
    case '1d': intervalSeconds = 86400; break;
    case '1w': intervalSeconds = 604800; break;
    default: intervalSeconds = 3600; // 默认1小时
  }
  
  // 基础价格和趋势参数
  const basePrice = 0.007354;
  const trend = Math.random() < 0.5 ? 1 : -1; // 随机选择上升或下降趋势
  const trendStrength = 0.00002 + Math.random() * 0.0001; // 趋势强度
  const volatility = 0.005; // 价格波动范围
  
  // 计算起始位置 - 考虑offset
  const totalOffset = offset + count;
  
  // 生成带有趋势的价格序列
  let currentPrice = basePrice - (trend * trendStrength * offset); // 根据offset调整起始价格
  const result = [];
  
  for (let i = 0; i < count; i++) {
    // 添加趋势因素
    currentPrice += trend * trendStrength;
    
    // 添加随机波动
    const randomFactor = 0.5 - Math.random(); // -0.5 到 0.5 之间的随机数
    const dailyVolatility = currentPrice * volatility * randomFactor;
    
    // 生成OHLC数据
    let open = currentPrice;
    let close = currentPrice + dailyVolatility;
    
    // 确保价格不会变为负数
    if (close < 0.000001) close = 0.000001;
    
    // 根据开盘和收盘价生成高低点
    const higher = Math.max(open, close);
    const lower = Math.min(open, close);
    const highExtra = higher * (Math.random() * 0.02); // 上影线
    const lowExtra = lower * (Math.random() * 0.02); // 下影线
    
    const high = higher + highExtra;
    const low = Math.max(0.000001, lower - lowExtra);
    
    // 生成成交量，与价格变化幅度关联
    const volumeBase = 100 + Math.random() * 2000;
    const volumeChange = Math.abs(open - close) / open; // 价格变化比例
    const volume = volumeBase * (1 + volumeChange * 10); // 放大价格变化对成交量的影响
    
    // 时间戳，从现在开始，往回计算，增加offset的影响
    const time = now - (totalOffset - i) * intervalSeconds;
    
    result.push({
      time,
      open,
      high,
      low,
      close,
      volume
    });
    
    // 为下一个周期设置开盘价
    currentPrice = close;
  }
  
  return result;
}

// 将AVE API返回的K线数据转换为我们的格式
function transformKlineData(klinePoints: KLinePoint[]) {
  if (!klinePoints || !Array.isArray(klinePoints) || klinePoints.length === 0) {
    console.warn('transformKlineData: 收到空数据或非数组数据');
    return [];
  }
  
  console.log(`转换${klinePoints.length}个K线数据点`);
  // 打印第一个数据点用于调试
  if (klinePoints.length > 0) {
    console.log('第一个原始数据点:', JSON.stringify(klinePoints[0]));
  }
  
  try {
    const transformedData = klinePoints.map(point => {
      try {
        // 确保所有字段存在且能被转换为数字
        if (!point.time || !point.open || !point.high || !point.low || !point.close || !point.volume) {
          console.warn('数据点缺少必要字段:', point);
          return null;
        }
        
        // 时间戳处理 - 确保它是一个数字且格式正确
        let timeValue: number;
        if (typeof point.time === 'string') {
          timeValue = parseInt(point.time);
        } else {
          timeValue = point.time;
        }
        
        // 时间戳修复 - 确保它是一个以秒为单位的UNIX时间戳
        // 有些API可能返回毫秒级时间戳，我们需要转换成秒级
        if (timeValue > 2000000000) { // 如果时间戳太大(可能是毫秒)
          timeValue = Math.floor(timeValue / 1000);
        }
        
        // 检查时间戳是否合理
        const now = Math.floor(Date.now() / 1000);
        if (timeValue > now + 86400) { // 如果时间戳比现在晚一天以上
          console.warn(`异常时间戳: ${timeValue}, 转换为日期: ${new Date(timeValue * 1000).toISOString()}`);
          timeValue = now; // 使用当前时间作为替代
        }
        
        const transformedPoint = {
          time: timeValue,
          open: typeof point.open === 'string' ? parseFloat(point.open) : point.open,
          high: typeof point.high === 'string' ? parseFloat(point.high) : point.high,
          low: typeof point.low === 'string' ? parseFloat(point.low) : point.low,
          close: typeof point.close === 'string' ? parseFloat(point.close) : point.close,
          volume: typeof point.volume === 'string' ? parseFloat(point.volume) : point.volume
        };
        
        // 验证转换后的数值是否有效
        if (
          isNaN(transformedPoint.time) || 
          isNaN(transformedPoint.open) || 
          isNaN(transformedPoint.high) || 
          isNaN(transformedPoint.low) || 
          isNaN(transformedPoint.close) || 
          isNaN(transformedPoint.volume)
        ) {
          console.warn('转换后的数据点包含NaN值:', transformedPoint);
          return null;
        }
        
        return transformedPoint;
      } catch (err) {
        console.error('处理单个数据点时出错:', err, point);
        return null;
      }
    }).filter(point => point !== null); // 过滤掉无效的数据点
    
    if (transformedData.length === 0) {
      console.warn('转换后没有有效的数据点');
      return [];
    }
    
    if (transformedData.length > 0) {
      console.log('第一个转换后的数据点:', JSON.stringify(transformedData[0]));
    }
    
    console.log(`成功转换了${transformedData.length}个有效数据点`);
    return transformedData;
  } catch (err) {
    console.error('转换K线数据时出错:', err);
    return [];
  }
}

// 添加延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 带重试功能的 API 请求函数
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, backoff = 300) {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i + 1} fetching from API: ${url}`);
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error);
      lastError = error;
      
      // 最后一次尝试不需要等待
      if (i < retries - 1) {
        // 每次重试增加等待时间
        await delay(backoff * Math.pow(2, i));
      }
    }
  }
  
  throw lastError;
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
  const offset = parseInt(searchParams.get('offset') || '0'); // 新增: 数据起始偏移量
  
  console.log(`接收K线请求: ${chain}:${address}, 周期=${interval}, 数量=${limit}, 偏移=${offset}`);
  console.log(`完整请求URL: ${request.url}`);
  
  // 参数验证
  if (!address || !chain) {
    console.error('缺少必要参数: address或chain');
    return NextResponse.json([], { status: 400 });
  }
  
  // 生成缓存键 - 包含offset参数
  const cacheKey = `kline_${address}_${chain}_${interval}_${limit}_${offset}`;
  
  // 检查缓存
  try {
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      console.log(`返回缓存K线数据 (${chain}:${address}, ${interval}, offset=${offset})`);
      return NextResponse.json(cachedData);
    }
  } catch (cacheError) {
    console.error('访问缓存出错:', cacheError);
    // 继续执行，不依赖缓存
  }
  
  try {
    // 准备调用AVE API的参数
    const tokenId = formatTokenId(address, chain);
    
    // 将时间间隔转换为AVE API的格式
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
      
    // 调用AVE API获取K线数据
    let klinePoints: KLinePoint[] = [];
    try {
      klinePoints = await aveGetTokenKlineData({
        token_id: tokenId,
        interval: intervalValue,
        size: limit,
        offset: offset // 传递offset参数
      });
    } catch (aveApiError) {
      console.error('Error fetching data from AVE API:', aveApiError);
      klinePoints = [];
    }
    
    // 转换数据格式
    const klineData = transformKlineData(klinePoints);
    
    // 检查数据是否有效
    if (!klineData || klineData.length === 0) {
      console.log('Invalid or empty KLine data from AVE API, using mock data');
      
      // 使用模拟数据 - 根据offset生成不同的数据
      const mockData = generateMockKlineData(limit, interval, offset);
      console.log(`生成了 ${mockData.length} 个模拟K线数据点 (offset=${offset})`);
      
      if (mockData.length > 0) {
        console.log('模拟数据第一个点:', JSON.stringify(mockData[0]));
        console.log(`模拟数据时间戳: ${mockData[0].time}, 转换为日期: ${new Date(mockData[0].time * 1000).toISOString()}`);
      }
      
      // 缓存结果，但时间较短
      try {
        cacheService.set(cacheKey, mockData, { ttl: CACHE_TTL.SHORT });
      } catch (cacheError) {
        console.error('Error caching mock data:', cacheError);
      }
      
      return NextResponse.json(mockData);
    }
    
    // 有效数据，缓存并返回
    try {
      cacheService.set(cacheKey, klineData, { ttl: CACHE_TTL.MEDIUM });
    } catch (cacheError) {
      console.error('Error caching kline data:', cacheError);
    }
    
    return NextResponse.json(klineData);
    
  } catch (error) {
    console.error('Error processing token-kline request:', error);
    
    // 使用模拟数据作为后备 - 考虑offset
    const mockData = generateMockKlineData(limit, interval, offset);
    
    // 缓存结果，但时间较短
    try {
      cacheService.set(cacheKey, mockData, { ttl: CACHE_TTL.SHORT });
    } catch (cacheError) {
      console.error('Error caching fallback mock data:', cacheError);
    }
    
    return NextResponse.json(mockData);
  }
} 