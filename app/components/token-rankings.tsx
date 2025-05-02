"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { TrendingUp, Clock, RefreshCw, ChevronLeft, ChevronRight, Smile } from "lucide-react"
import Image from "next/image"
import { toast } from "@/components/ui/use-toast"
import { safeLogError, safeLogObject } from "../lib/logging-helper"

// API key for Ave.ai
const AVE_API_KEY = "NMUuJmYHJB6d91bIpgLqpuLLKYVws82lj0PeDP3UEb19FoyWFJUVGLsgE95XTEmA";

interface TokenRanking {
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

// 分页配置
const ITEMS_PER_PAGE = 50;

// Fallback dummy data in case API fails
const dummyTopics = [
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

// Fallback dummy token data
const dummyTokens = [
  {
    "token": "0xa5957e0e2565dc93880da7be32abcbdf55788888",
    "chain": "bsc",
    "symbol": "ATM",
    "name": "ATM Token",
    "logo_url": "https://www.logofacade.com/token_icon_request/65ffb2a20a9e59af22dae8a5_1711256226.png",
    "current_price_usd": 0.000010993584854389429,
    "price_change_24h": -76.53,
    "tx_volume_u_24h": 13385053.845136339,
    "holders": 14304
  },
  {
    "token": "0xc5102fe9359fd9a28f877a67e36b0f050d81a3cc",
    "chain": "eth",
    "symbol": "BTC",
    "name": "Bitcoin",
    "logo_url": "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    "current_price_usd": 66000.5,
    "price_change_24h": 2.3,
    "tx_volume_u_24h": 25000000,
    "holders": 1000000
  }
];

export default function TokenRankings({ darkMode }: { darkMode: boolean }) {
  const router = useRouter()
  const [topics, setTopics] = useState<RankTopic[]>(dummyTopics)
  const [activeTopicId, setActiveTopicId] = useState<string>("hot")
  const [tokens, setTokens] = useState<TokenRanking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  
  // 限制最多显示50个代币
  const displayTokens = tokens.slice(0, ITEMS_PER_PAGE);

  // 获取主题列表
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch('/api/tokens?topic=topics');
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.topics) {
          setTopics(data.topics);
        } else {
          safeLogError("Invalid API response format", "token-rankings:fetchTopics");
          toast({
            title: "错误",
            description: "获取主题列表失败",
            variant: "destructive",
          });
        }
      } catch (error) {
        safeLogError(error, "token-rankings:fetchTopics");
        toast({
          title: "错误",
          description: "获取主题列表失败",
          variant: "destructive",
        });
      }
    };

    fetchTopics();
  }, []);

  // 处理刷新
  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setImageErrors({}); // 重置图片错误状态
      
      const response = await fetch(`/api/tokens?topic=${activeTopicId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
        
      if (!response.ok) {
        throw new Error(`API请求失败，状态码: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.tokens && Array.isArray(data.tokens)) {
        // 确保每个代币对象有所有必要的字段，没有的赋予默认值
        const processedTokens = data.tokens.map((token: any) => ({
          token: token.token || "",
          chain: token.chain || "unknown",
          symbol: token.symbol || "Unknown",
          name: token.name || "Unknown Token",
          logo_url: token.logo_url || "",
          current_price_usd: typeof token.current_price_usd === 'number' ? token.current_price_usd : 0,
          price_change_24h: typeof token.price_change_24h === 'number' ? token.price_change_24h : 0,
          tx_volume_u_24h: typeof token.tx_volume_u_24h === 'number' ? token.tx_volume_u_24h : 0,
          holders: typeof token.holders === 'number' ? token.holders : 0,
          market_cap: token.market_cap,
          fdv: token.fdv,
          risk_score: token.risk_score
        }));
        
        setTokens(processedTokens);
      } else {
        console.error("API返回数据格式无效:", data);
        throw new Error("API返回数据格式无效，无法加载代币信息");
      }
    } catch (err) {
      console.error("获取代币数据失败:", err);
      setError(err instanceof Error ? err.message : "未获得API数据，请稍后再试");
      // 保留当前数据，不清空
    } finally {
      setIsLoading(false);
    }
  };

  // 获取代币列表
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setImageErrors({}); // 重置图片错误状态
        
        const response = await fetch(`/api/tokens?topic=${activeTopicId}`);
        
        if (!response.ok) {
          throw new Error(`API请求失败，状态码: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.tokens && Array.isArray(data.tokens)) {
          // 确保每个代币对象有所有必要的字段，没有的赋予默认值
          const processedTokens = data.tokens.map((token: any) => ({
            token: token.token || "",
            chain: token.chain || "unknown",
            symbol: token.symbol || "Unknown",
            name: token.name || "Unknown Token",
            logo_url: token.logo_url || "",
            current_price_usd: typeof token.current_price_usd === 'number' ? token.current_price_usd : 0,
            price_change_24h: typeof token.price_change_24h === 'number' ? token.price_change_24h : 0,
            tx_volume_u_24h: typeof token.tx_volume_u_24h === 'number' ? token.tx_volume_u_24h : 0,
            holders: typeof token.holders === 'number' ? token.holders : 0,
            market_cap: token.market_cap,
            fdv: token.fdv,
            risk_score: token.risk_score
          }));
          
          setTokens(processedTokens);
        } else {
          safeLogError(data, "token-rankings:fetchTokens:invalid-data");
          throw new Error("API返回数据格式无效，无法加载代币信息");
        }
      } catch (err) {
        safeLogError(err, "token-rankings:fetchTokens");
        setError(err instanceof Error ? err.message : "未获得API数据，请稍后再试");
        
        // 当API调用失败时，使用测试数据（如果已有）
        if (dummyTokens.length > 0) {
          safeLogObject({ message: "使用测试数据作为后备" }, "token-rankings:fallback");
          setTokens(dummyTokens);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // 调用获取代币函数
    fetchTokens();
  }, [activeTopicId]);

  // 处理代币点击
  const handleTokenClick = (token: TokenRanking) => {
    if (token && token.chain && token.token) {
      router.push(`/kline?blockchain=${token.chain}&address=${token.token}`);
    }
  };

  // 处理图片加载错误
  const handleImageError = (tokenId: string) => {
    setImageErrors(prev => ({
      ...prev,
      [tokenId]: true
    }));
  };

  // 渲染代币卡片
  const renderTokenCards = () => {
    if (isLoading) {
      return Array(ITEMS_PER_PAGE).fill(0).map((_, index) => (
        <Card
          key={index}
          className={`p-3 ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} animate-pulse`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-700"></div>
              <div>
                <div className="h-4 w-16 bg-gray-700 rounded"></div>
                <div className="h-3 w-24 bg-gray-700 rounded mt-1"></div>
              </div>
            </div>
            <div className="text-right">
              <div className="h-4 w-20 bg-gray-700 rounded"></div>
              <div className="h-3 w-12 bg-gray-700 rounded mt-1 ml-auto"></div>
            </div>
          </div>
        </Card>
      ));
    }

    if (error && tokens.length === 0) {
      return (
        <div className="py-8 text-center">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-yellow-900/50 p-3 mb-3">
                <RefreshCw className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">数据加载失败</h3>
              <p className="text-red-400 mb-3 text-sm">{error}</p>
              <p className="text-gray-400 text-xs mb-4">
                无法从服务器获取最新代币数据，可能由于网络问题或API服务暂时不可用
              </p>
              <Button onClick={handleRefresh} className="bg-blue-600 hover:bg-blue-700">
                <RefreshCw className="w-4 h-4 mr-2" /> 重新加载
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (tokens.length === 0) {
      return (
        <div className="py-8 text-center text-gray-500">
          该类别下暂无代币数据
        </div>
      );
    }

    return displayTokens.map((token, index) => {
      // 生成一个唯一的token标识符
      const tokenId = `${token.chain}-${token.token}`;
      // 检查该token的logo是否加载失败
      const hasLogoError = imageErrors[tokenId];
      // 价格变化是正数还是负数
      const isPriceUp = token.price_change_24h > 0;
      
      return (
        <Card
          key={tokenId}
          className={`p-1.5 mb-1 ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} cursor-pointer hover:opacity-90 transition-opacity rounded-lg border-none`}
          onClick={() => handleTokenClick(token)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
                {token.logo_url && !hasLogoError ? (
                  <Image
                    src={token.logo_url}
                    alt={token.symbol}
                    fill
                    className="object-cover"
                    onError={() => handleImageError(tokenId)}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-yellow-400">
                    <Smile className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{token.symbol || 'Unknown'}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">{token.chain.toUpperCase()}</span>
                </div>
                <div className="text-xs text-gray-400">{formatVolume(token.tx_volume_u_24h)} • {formatHolders(token.holders)}持有</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-sm">{formatPrice(token.current_price_usd)}</div>
              <div
                className={`text-xs ${
                  isPriceUp 
                    ? "text-green-500" 
                    : token.price_change_24h < 0 
                    ? "text-red-500" 
                    : "text-gray-400"
                }`}
              >
                {formatPercentChange(token.price_change_24h)}
              </div>
            </div>
          </div>
        </Card>
      );
    });
  };

  // 格式化价格
  const formatPrice = (price: number) => {
    if (!price && price !== 0) return "N/A";
    if (price === 0) return "$0.00";
    if (price < 0.000001) return "<$0.000001";
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    if (price < 10) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(2)}`;
  };

  // 格式化百分比变化
  const formatPercentChange = (change: number) => {
    if (!change && change !== 0) return "0.00%";
    return change > 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
  };

  // 格式化交易量
  const formatVolume = (volume: number) => {
    if (!volume && volume !== 0) return "N/A";
    if (volume === 0) return "$0";
    if (volume < 1000) return `$${volume.toFixed(0)}`;
    if (volume < 1000000) return `$${(volume / 1000).toFixed(1)}K`;
    if (volume < 1000000000) return `$${(volume / 1000000).toFixed(1)}M`;
    return `$${(volume / 1000000000).toFixed(1)}B`;
  };

  // 格式化持有者数量
  const formatHolders = (holders: number) => {
    if (!holders && holders !== 0) return "N/A";
    if (holders === 0) return "0";
    if (holders < 1000) return holders.toString();
    if (holders < 1000000) return `${(holders / 1000).toFixed(1)}K`;
    return `${(holders / 1000000).toFixed(1)}M`;
  };

  return (
    <div className="mb-6">
      <div className="mb-5 overflow-x-auto pb-2">
        <div className="flex gap-2">
          {topics.map((topic) => (
            <Button
              key={topic.id}
              variant={activeTopicId === topic.id ? "default" : "outline"}
              size="sm"
              className={`text-xs ${
                activeTopicId === topic.id 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700 border-none"
              }`}
              onClick={() => setActiveTopicId(topic.id)}
            >
              {topic.name_zh}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {renderTokenCards()}
      </div>
    </div>
  );
}