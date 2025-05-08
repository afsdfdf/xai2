import { NextResponse } from 'next/server';
import { getTokenRankList, getTokenRankTopics } from '@/app/lib/ave-api-service';
import { cacheService, CACHE_TTL } from '@/app/lib/cache-service';

// API key for Ave.ai - 应该从环境变量获取，避免在代码中硬编码
const AVE_API_KEY = process.env.AVE_API_KEY || "NMUuJmYHJB6d91bIpgLqpuLLKYVws82lj0PeDP3UEb19FoyWFJUVGLsgE95XTEmA";

// 缓存文件路径
const CACHE_DIR = process.cwd();

// Define types for tokens
interface TokenData {
  token: string;
  chain: string;
  symbol: string;
  name: string;
  logo_url: string;
  current_price_usd: number;
  price_change_24h: number;
  tx_volume_u_24h: number;
  holders: number;
  market_cap?: string;
  fdv?: string;
  risk_score?: string;
}

interface RankTopic {
  id: string;
  name_en: string;
  name_zh: string;
}

// 临时测试数据，在API调用失败时使用
const dummyTopics: RankTopic[] = [
  {
    "id": "hot",
    "name_en": "Hot",
    "name_zh": "热门"
  },
  {
    "id": "new",
    "name_en": "New",
    "name_zh": "新币"
  },
  {
    "id": "meme",
    "name_en": "Meme",
    "name_zh": "Meme"
  }
];

// 默认代币作为备用数据
const dummyTokens: TokenData[] = [
  {
    "token": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "chain": "eth",
    "symbol": "USDT",
    "name": "Tether",
    "logo_url": "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png",
    "current_price_usd": 1.0,
    "price_change_24h": 0.01,
    "tx_volume_u_24h": 50000000,
    "holders": 5000000
  },
  {
    "token": "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
    "chain": "eth",
    "symbol": "BNB",
    "name": "BNB",
    "logo_url": "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png",
    "current_price_usd": 580.0,
    "price_change_24h": 2.5,
    "tx_volume_u_24h": 10000000,
    "holders": 1000000
  },
  {
    "token": "0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b",
    "chain": "eth",
    "symbol": "CRO",
    "name": "Cronos",
    "logo_url": "https://s2.coinmarketcap.com/static/img/coins/64x64/3635.png",
    "current_price_usd": 0.1,
    "price_change_24h": -1.2,
    "tx_volume_u_24h": 5000000,
    "holders": 500000
  },
  {
    "token": "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
    "chain": "eth",
    "symbol": "UNI",
    "name": "Uniswap",
    "logo_url": "https://s2.coinmarketcap.com/static/img/coins/64x64/7083.png",
    "current_price_usd": 7.5,
    "price_change_24h": 3.1,
    "tx_volume_u_24h": 8000000,
    "holders": 700000
  },
  {
    "token": "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0",
    "chain": "eth",
    "symbol": "MATIC",
    "name": "Polygon",
    "logo_url": "https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png",
    "current_price_usd": 0.6,
    "price_change_24h": -0.8,
    "tx_volume_u_24h": 6000000,
    "holders": 600000
  }
];

/**
 * 将API返回的代币数据转换为统一格式
 */
function formatTokenData(tokens: any[]): TokenData[] {
  return tokens.map(token => ({
    token: token.token || "",
    chain: token.chain || "unknown",
    symbol: token.symbol || "Unknown",
    name: token.name || "Unknown Token",
    logo_url: token.logo_url || "",
    current_price_usd: typeof token.current_price_usd === 'number' 
      ? token.current_price_usd 
      : parseFloat(token.current_price_usd || '0') || 0,
    price_change_24h: typeof token.price_change_24h === 'number' 
      ? token.price_change_24h 
      : parseFloat(token.price_change_24h || '0') || 0,
    tx_volume_u_24h: typeof token.tx_volume_u_24h === 'number' 
      ? token.tx_volume_u_24h 
      : parseFloat(token.tx_volume_u_24h || '0') || 0,
    holders: typeof token.holders === 'number' 
      ? token.holders 
      : parseInt(token.holders || '0') || 0,
    market_cap: token.market_cap || "0",
    fdv: token.fdv || "0",
    risk_score: token.risk_score || "0"
  }));
}

// GET token rank topics or token list
export async function GET(request: Request) {
  console.log("Tokens API route called:", request.url);
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic') || 'hot';
  console.log("Topic requested:", topic);
  
  try {
    // 如果请求的是话题列表
    if (topic === 'topics') {
      const cacheKey = 'token_rank_topics';
      
      // 检查缓存
      const cachedTopics = cacheService.get(cacheKey);
      if (cachedTopics) {
        console.log("Returning cached topics data");
        return NextResponse.json({ topics: cachedTopics }, { status: 200 });
      }
      
      console.log("Fetching fresh topics data from Ave.ai API");
      
      try {
        // 尝试获取真实数据
        const topicList = await getTokenRankTopics();
        console.log("Topics directly from API:", topicList);
        
        // API now returns the topics in the correct format, so we don't need to transform
        if (topicList && topicList.length > 0) {
          console.log("Using API topics directly");
          
          // 更新缓存
          cacheService.set(cacheKey, topicList, { ttl: CACHE_TTL.LONG });
          
          console.log("Returning topics data");
          return NextResponse.json({ topics: topicList }, { status: 200 });
        } else {
          console.error("Empty or invalid topics data received from API");
          throw new Error('Empty or invalid topics data received from API');
        }
      } catch (apiError) {
        console.error("Error fetching from Ave.ai, using dummy topics:", apiError);
        
        // 更新缓存 - 即使是备用数据也缓存一小段时间
        cacheService.set(cacheKey, dummyTopics, { ttl: CACHE_TTL.SHORT });
        
        return NextResponse.json({ topics: dummyTopics }, { status: 200 });
      }
    }
    
    // 如果请求的是代币列表
    else {
      const cacheKey = `token_rank_${topic}`;
      
      // 检查缓存
      const cachedTokens = cacheService.get(cacheKey);
      if (cachedTokens) {
        console.log(`Returning cached token data for topic: ${topic}`);
        return NextResponse.json({ tokens: cachedTokens }, { status: 200 });
      }
      
      console.log(`Fetching fresh token data for topic: ${topic} from Ave.ai API`);
      
      try {
        // 尝试获取真实数据
        const tokenList = await getTokenRankList({
          topic: topic,
          limit: 50 // 最多获取50个代币
        });
        
        if (tokenList && tokenList.length > 0) {
          // 格式化代币数据
          const formattedTokens = formatTokenData(tokenList);
          
          // 更新缓存
          cacheService.set(cacheKey, formattedTokens, { ttl: CACHE_TTL.MEDIUM });
          
          console.log(`Returning ${formattedTokens.length} tokens for topic: ${topic}`);
          return NextResponse.json({ tokens: formattedTokens }, { status: 200 });
        } else {
          throw new Error(`Empty or invalid token data received from API for topic: ${topic}`);
        }
      } catch (apiError) {
        console.error(`Error fetching tokens for topic: ${topic}, using dummy data:`, apiError);
        
        // 更新缓存 - 即使是备用数据也缓存一小段时间
        cacheService.set(cacheKey, dummyTokens, { ttl: CACHE_TTL.SHORT });
        
        return NextResponse.json({ tokens: dummyTokens }, { status: 200 });
      }
    }
  } catch (error) {
    console.error("Unhandled error in tokens API route:", error);
    
    // 为了确保前端不会因为API错误而完全崩溃，我们返回一个有用的错误响应
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ 
      error: "Failed to fetch token data",
      message: errorMessage,
      // 即使在错误的情况下也提供备用数据
      tokens: topic === 'topics' ? dummyTopics : dummyTokens 
    }, { status: 500 });
  }
} 