"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Moon, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { OptimizedImage } from "@/app/components/ui/optimized-image"
import BottomNav from "@/app/components/BottomNav"
import TokenRankings from "@/app/components/token-rankings"
import EthereumProtection from "../components/EthereumProtection"
import { searchTokens } from "@/app/lib/ave-api-service"

export default function MarketPage() {
  const router = useRouter()
  const [darkMode, setDarkMode] = useState(true)
  const [searchValue, setSearchValue] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const searchResultsRef = useRef<HTMLDivElement>(null)

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

  // 搜索代币
  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast({
        title: "请输入搜索内容",
        description: "请输入代币名称或合约地址",
        variant: "destructive",
      });
      return;
    }
    
    setIsSearching(true);
    setShowResults(true);
    
    try {
      console.log(`Searching for tokens: ${searchValue}`);
      const results = await searchTokens(searchValue);
      
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
      
      // More descriptive error message
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
  }

  // 处理选择代币
  const handleTokenSelect = (token: any) => {
    setShowResults(false);
    
    // 导航到K线图页面
    if (token && token.chain && token.token) {
      router.push(`/kline?blockchain=${token.chain}&address=${token.token}`);
    }
  }

  // 处理搜索框键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-[#0b101a] text-white" : "bg-gray-50 text-gray-900"} pb-16`}>
      <EthereumProtection />
      <div className="max-w-md mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full p-1">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            <h1 className="text-xl font-bold">市场</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} className="rounded-full">
              <Moon className="w-5 h-5" />
                </Button>
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <OptimizedImage 
                src="/LOGO.JPG" 
                alt="Logo" 
                fill 
                className="object-cover"
                priority
                debug={true}
                useStaticFallback={true}
              />
            </div>
          </div>
        </div>

        {/* 搜索部分 */}
        <div className="p-4 pb-2">
          <div className="relative">
            <div className="flex items-center">
              <Input
                type="text"
                placeholder="搜索代币地址或符号..."
                className={`w-full h-10 pl-10 ${darkMode ? "bg-gray-900 border-gray-800" : "bg-gray-100 border-gray-200"}`}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowResults(true)}
              />
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Button 
                variant="default" 
                size="sm" 
                className="ml-2 bg-blue-600 hover:bg-blue-700"
                onClick={handleSearch}
              >
                查询
              </Button>
            </div>
            
            {showResults && (
              <div 
                ref={searchResultsRef} 
                className={`absolute left-0 right-0 mt-1 max-h-96 overflow-y-auto rounded-md shadow-lg z-50 ${
                  darkMode ? "bg-gray-900 border border-gray-800" : "bg-white border border-gray-200"
                }`}
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
                      className={`p-3 flex items-center gap-3 text-sm cursor-pointer hover:bg-gray-800 border-b ${
                        darkMode ? "border-gray-800" : "border-gray-200"
                      }`}
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
                  <div className="p-3 text-center text-sm text-gray-500">
                    未找到相关代币
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* 代币主题模块 */}
        <div className="p-4">
          <TokenRankings darkMode={darkMode} />
        </div>

        {/* 底部导航 */}
        <BottomNav darkMode={darkMode} />
      </div>
      <Toaster />
    </div>
  )
} 