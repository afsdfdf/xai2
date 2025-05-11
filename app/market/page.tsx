"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Moon, Sun, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { OptimizedImage } from "@/app/components/ui/optimized-image"
import BottomNav from "@/app/components/BottomNav"
import TokenRankings from "@/app/components/token-rankings"
import EthereumProtection from "../components/EthereumProtection"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { searchTokens } from "@/app/lib/ave-api-service"
import Image from "next/image"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export default function MarketPage() {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  
  const topicsScrollRef = useRef<HTMLDivElement>(null)
  const [searchValue, setSearchValue] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const searchResultsRef = useRef<HTMLDivElement>(null)

  // 处理左右滚动箭头点击
  const scrollTopics = (direction: 'left' | 'right') => {
    if (!topicsScrollRef.current) return;
    
    const scrollAmount = 200; // 每次滚动的像素
    const currentScroll = topicsScrollRef.current.scrollLeft;
    
    topicsScrollRef.current.scrollTo({
      left: direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount,
      behavior: 'smooth'
    });
  };

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
        title: "搜索为空",
        description: "请输入代币名称或合约地址",
        variant: "destructive",
      });
      return;
    }
    
    setIsSearching(true);
    setShowResults(true);
    
    try {
      const results = await searchTokens(searchValue);
      setSearchResults(results);
    } catch (error) {
      console.error("搜索错误:", error);
      setSearchResults([]);
      toast({
        title: "搜索失败",
        description: "无法获取搜索结果，请稍后再试",
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

  // 切换主题
  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <div className={cn(
      "min-h-screen pb-16",
      isDark ? "bg-[#0b101a] text-white" : "bg-white text-foreground"
    )}>
      <EthereumProtection />
      <div className="max-w-md mx-auto">
        {/* 搜索部分 */}
        <div className="p-4 pb-2 pt-6">
          <div className="relative">
            <div className="flex items-center">
              <Input
                type="text"
                placeholder="搜索代币地址或符号..."
                className={cn(
                  "w-full h-10 pl-10 rounded-full shadow-sm",
                  "transition-all duration-200 border-opacity-60",
                  "focus:ring-2 focus:ring-primary/30 focus:border-primary/60",
                  isDark 
                    ? "bg-muted/40 border-muted/60 text-foreground" 
                    : "bg-secondary/80 border-border/50 text-foreground"
                )}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowResults(true)}
              />
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Button 
                variant="default" 
                size="sm" 
                className={cn(
                  "ml-2 rounded-full bg-primary hover:bg-primary/90 px-4",
                  "shadow-sm hover-scale"
                )}
                onClick={handleSearch}
              >
                查询
              </Button>
            </div>
            
            {showResults && (
              <div 
                ref={searchResultsRef} 
                className={cn(
                  "absolute left-0 right-0 mt-1 max-h-96 overflow-y-auto rounded-md shadow-lg z-50 animate-fade-in",
                  isDark 
                    ? "bg-card border border-border/70" 
                    : "bg-card border border-border/40"
                )}
              >
                {isSearching ? (
                  <div className="p-4 text-center text-sm">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full inline-block mr-2"></div>
                    搜索中...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((token, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-3 flex items-center gap-3 text-sm cursor-pointer transition-colors",
                        "border-b last:border-0",
                        isDark 
                          ? "border-border/30 hover:bg-muted/50" 
                          : "border-border/20 hover:bg-secondary/70",
                      )}
                      onClick={() => handleTokenSelect(token)}
                    >
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0 shadow-sm">
                        {token.logo_url && token.logo_url.trim() !== '' ? (
                          <Image
                            src={token.logo_url}
                            alt={token.symbol || 'Token'}
                            fill
                            className="object-cover transition-transform hover:scale-110"
                            style={{ transition: "transform 0.2s ease" }}
                          />
                        ) : (
                          <div className={cn(
                            "w-full h-full flex items-center justify-center text-xs font-medium text-white",
                            `bg-gradient-to-br ${
                              index % 5 === 0 ? "from-pink-500 to-rose-500" :
                              index % 5 === 1 ? "from-blue-500 to-indigo-500" :
                              index % 5 === 2 ? "from-green-500 to-emerald-500" :
                              index % 5 === 3 ? "from-amber-500 to-orange-500" :
                              "from-purple-500 to-fuchsia-500"
                            }`
                          )}>
                            {token.symbol?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {token.name} • {token.chain.toUpperCase()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium">
                          ${typeof token.current_price_usd === 'string' 
                            ? parseFloat(token.current_price_usd).toFixed(6) 
                            : (token.current_price_usd || 0).toFixed(6)}
                        </div>
                        {token.price_change_24h && (
                          <div className={cn(
                            "text-xs px-2 py-0.5 rounded-full mt-1 inline-block",
                            parseFloat(String(token.price_change_24h)) >= 0 
                              ? 'text-emerald-500 bg-emerald-500/10' 
                              : 'text-rose-500 bg-rose-500/10'
                          )}>
                            {parseFloat(String(token.price_change_24h)) >= 0 ? '+' : ''}
                            {parseFloat(String(token.price_change_24h)).toFixed(2)}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : searchValue.trim() ? (
                  <div className="p-6 text-center">
                    <div className="text-muted-foreground mb-1">未找到相关代币</div>
                    <div className="text-xs text-muted-foreground/70">
                      请尝试其他关键词或代币地址
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* 代币主题模块 */}
        <div className="p-4 pt-0 relative">
          {/* 添加滑动箭头控制 */}
          <div className="absolute right-4 top-1 z-20 flex space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              className={cn(
                "h-7 w-7 rounded-full opacity-80",
                isDark 
                  ? "bg-muted border-border hover:bg-muted/80" 
                  : "bg-secondary border-border hover:bg-muted"
              )}
              onClick={() => scrollTopics('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              className={cn(
                "h-7 w-7 rounded-full opacity-80",
                isDark 
                  ? "bg-muted border-border hover:bg-muted/80" 
                  : "bg-secondary border-border hover:bg-muted"
              )}
              onClick={() => scrollTopics('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* 主题内容与排行榜 */}
          <TokenRankings darkMode={isDark} mode="market" scrollRef={topicsScrollRef} />
        </div>

        {/* 底部导航 */}
        <BottomNav darkMode={isDark} />
      </div>
      <Toaster />
    </div>
  )
} 