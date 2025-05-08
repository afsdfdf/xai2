"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getTokenDetails, searchTokens } from "@/app/lib/ave-api-service"
import BottomNav from "@/app/components/BottomNav"
import ChartWrapper from "@/app/components/ChartWrapper"
import TokenHeader from "@/app/components/TokenHeader"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { OptimizedImage } from "@/app/components/ui/optimized-image"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

// 防抖函数
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
  }

export default function KlinePage() {
  // 基础状态
  const searchParams = useSearchParams()
  const router = useRouter()
  const [darkMode, setDarkMode] = useState(true)
  const [searchValue, setSearchValue] = useState("")
  const [interval, setInterval] = useState("1h")
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [key, setKey] = useState(0) // 用于强制重新渲染ChartWrapper
  
  // 搜索状态
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const searchResultsRef = useRef<HTMLDivElement>(null)

  // 使用防抖处理搜索值，1.5秒后触发
  const debouncedSearchValue = useDebounce(searchValue, 1500);
  
  // 获取区块链和代币地址
  const blockchain = searchParams.get('blockchain') || 'bsc'
  const address = searchParams.get('address') || '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'

  // 处理点击外部关闭搜索结果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    if (showResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showResults]);

  // 搜索代币函数 - 被防抖调用
  const handleSearch = useCallback(async (value: string) => {
    if (!value.trim()) {
      return;
    }
    
    setIsSearching(true);
    setShowResults(true);
    
    try {
      console.log(`Searching for tokens: ${value}`);
      const results = await searchTokens(value);
      
      // Handle empty results case more gracefully
      if (results && results.length > 0) {
        console.log(`Found ${results.length} tokens`);
      setSearchResults(results);
      } else {
        console.log('No search results found');
        setSearchResults([]);
        toast({
          title: "没有找到结果",
          description: "找不到与您的搜索匹配的代币",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("搜索错误:", error);
      setSearchResults([]);
      
      let errorMsg = "无法获取搜索结果，请稍后再试";
      if (error instanceof Error) {
        errorMsg = `搜索错误: ${error.message}`;
      }
      
      toast({
        title: "搜索失败",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 监听防抖后的搜索值变化，自动触发搜索
  useEffect(() => {
    if (debouncedSearchValue) {
      handleSearch(debouncedSearchValue);
    }
  }, [debouncedSearchValue, handleSearch]);

  // 处理选择代币
  const handleTokenSelect = (token: any) => {
    setShowResults(false);
    setSearchValue("");
    
    // 导航到K线图页面
    if (token && token.chain && token.token) {
    router.push(`/kline?blockchain=${token.chain}&address=${token.token}`);
    }
  }

  // 处理搜索框键盘事件 - 保留Enter键立即搜索
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchValue);
    }
  }

  // 加载代币信息 - 当地址或区块链变更时触发
  useEffect(() => {
    console.log(`Loading token info for ${blockchain}:${address}`);
    
    async function fetchToken() {
      try {
        const info = await getTokenDetails(address, blockchain);
        if (info) {
          console.log("Token info loaded:", info);
          setTokenInfo(info?.tokenInfo || {});
    } else {
          console.warn("No token info returned");
          setTokenInfo({
            symbol: "未知代币",
            name: address.slice(0, 8) + "..." + address.slice(-6),
            price: 0,
            priceChange24h: 0
          });
  }
      } catch (err) {
        console.error("加载代币信息失败:", err);
        setTokenInfo({
          symbol: "未知代币",
          name: address.slice(0, 8) + "..." + address.slice(-6),
          price: 0,
          priceChange24h: 0
        });
    }
  }

    fetchToken();
  }, [address, blockchain]);

  if (!tokenInfo) return (
    <div className="min-h-screen bg-[#0b101a] text-white flex items-center justify-center">
      <div className="animate-spin mr-2 h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      <span className="text-gray-400">加载中...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b101a] text-white">
      <div className="mx-auto max-w-full pb-16">
        {/* 搜索栏 - 移至顶部 */}
        <div className="px-4 py-2 bg-[#232b3b] sticky top-0 z-10 border-b border-gray-800">
          <div className="relative flex items-center">
            {/* 代币Logo */}
            <div className="w-8 h-8 mr-3 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
              {tokenInfo.logo_url ? (
                <OptimizedImage 
                  src={tokenInfo.logo_url} 
                  alt={tokenInfo.symbol || 'Token'} 
                  fill 
                className="object-cover"
                  debug={true}
                  useStaticFallback={true}
              />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold">
                  {tokenInfo.symbol ? tokenInfo.symbol.slice(0, 2) : '?'}
            </div>
              )}
          </div>
          
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="搜索代币名称或地址..."
                className="w-full bg-[#151d28] border-transparent h-9 pl-10"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowResults(true)}
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              {isSearching && (
                <div className="absolute right-3 top-2 w-5 h-5">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
              )}
            
              {/* 搜索结果下拉框 */}
            {showResults && (
              <div 
                ref={searchResultsRef} 
                  className="absolute left-0 right-0 mt-1 max-h-96 overflow-y-auto rounded-md shadow-lg z-50 bg-[#232b3b] border border-gray-700"
              >
                {isSearching ? (
                  <div className="p-3 text-center text-sm">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full inline-block mr-2"></div>
                    搜索中...
            </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((token, index) => (
                    <div
                      key={index}
                        className="p-3 flex items-center gap-3 text-sm cursor-pointer hover:bg-[#151d28] border-b border-gray-700"
                      onClick={() => handleTokenSelect(token)}
                    >
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                        {token.logo_url ? (
                            <OptimizedImage
                            src={token.logo_url}
                            alt={token.symbol}
                            fill
                            className="object-cover"
                              debug={true}
                              useStaticFallback={true}
                          />
                        ) : (
                          <div className="w-full h-full bg-blue-900 flex items-center justify-center text-xs">
                            {token.symbol?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-xs text-gray-400">{token.name} • {token.chain.toUpperCase()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs">
                          ${typeof token.current_price_usd === 'string' 
                            ? parseFloat(token.current_price_usd).toFixed(6) 
                            : (token.current_price_usd || 0).toFixed(6)}
                        </div>
                        {token.price_change_24h && (
                          <div className={`text-xs ${parseFloat(String(token.price_change_24h)) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {parseFloat(String(token.price_change_24h)) >= 0 ? '+' : ''}
                            {parseFloat(String(token.price_change_24h)).toFixed(2)}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : searchValue.trim() ? (
                    <div className="p-3 text-center text-sm text-gray-400">
                    未找到相关代币
                  </div>
                ) : null}
              </div>
            )}
            </div>
          </div>
            </div>
        
        {/* 顶部信息栏 */}
        <TokenHeader tokenInfo={tokenInfo} />

        {/* K线图显示区域 */}
        <div className="w-full bg-[#11161f]">
          <div 
            style={{ height: "calc(100vh - 160px)" }} 
            className="relative"
            id="chart-container"
          >
            <ChartWrapper
              key={`chart-${address}-${blockchain}-${interval}-${key}`}
              darkMode={darkMode}
              tokenAddress={address}
              tokenChain={blockchain}
              interval={interval}
              />
          </div>
        </div>
      </div>
      
        {/* 底部导航 */}
      <BottomNav darkMode={darkMode} />
      <Toaster />
    </div>
  )
} 