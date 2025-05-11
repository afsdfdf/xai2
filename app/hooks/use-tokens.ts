'use client';

import { useState, useEffect, useCallback } from 'react';
import { TokenRanking, TokensResponse, ApiResponse } from '@/app/types/token';
import { toast } from '@/components/ui/use-toast';

// 备用数据，当API请求失败时使用
const fallbackTokens: TokenRanking[] = [
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

/**
 * 按主题获取代币数据的自定义Hook
 * @param topicId 主题ID
 * @returns 代币数据、加载状态、错误信息和刷新函数
 */
export function useTokensByTopic(topicId: string) {
  const [tokens, setTokens] = useState<TokenRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 获取代币数据的函数
  const fetchTokens = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 构建URL，添加请求参数
      const url = `/api/tokens?topic=${topicId}`;
      const options: RequestInit = forceRefresh 
        ? {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          } 
        : { next: { revalidate: 300 } }; // 5分钟缓存
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`API请求失败，状态码: ${response.status}`);
      }
      
      const result = await response.json() as ApiResponse<TokensResponse>;
      
      if (result && result.success && result.data && Array.isArray(result.data.tokens)) {
        setTokens(result.data.tokens);
        setLastUpdated(new Date());
      } else {
        // 如果响应格式不正确，使用备用数据
        console.error("API返回数据格式无效:", result);
        
        // 只有在没有现有数据时才使用备用数据
        if (tokens.length === 0) {
          setTokens(fallbackTokens);
        }
        
        throw new Error("API返回数据格式无效");
      }
    } catch (error) {
      console.error("获取代币数据失败:", error);
      setError(error instanceof Error ? error.message : "获取数据失败，请稍后再试");
      
      // 只有在没有现有数据时才使用备用数据
      if (tokens.length === 0) {
        setTokens(fallbackTokens);
        toast({
          title: "获取数据失败",
          description: "使用备用数据作为替代",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [topicId, tokens.length]);

  // 强制刷新数据
  const refresh = useCallback(() => {
    return fetchTokens(true);
  }, [fetchTokens]);

  // 当主题变化时获取数据
  useEffect(() => {
    fetchTokens();
  }, [topicId, fetchTokens]);

  return {
    tokens,
    isLoading,
    error,
    refresh,
    lastUpdated
  };
} 