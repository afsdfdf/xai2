"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Share2, Star, Copy, ExternalLink, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import ChartWrapper from "@/app/components/ChartWrapper"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BottomNav from "@/app/components/BottomNav"
import Image from "next/image"
import { getTokenDetails, getTokenTransactions } from "@/app/lib/ave-api-service"

interface RecentTrade {
  timestamp: number;
  priceUsd: string;
  amount: string;
  type: 'buy' | 'sell';
  txHash?: string;  // 添加交易哈希用于链接到区块浏览器
}

export default function TokenDetailPage() {
  const params = useParams()
  const [darkMode, setDarkMode] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h")
  const [klineInterval, setKlineInterval] = useState("1h")
  const [tokenLogo, setTokenLogo] = useState("/placeholder-token.png")
  const [tokenTrades, setTokenTrades] = useState<RecentTrade[]>([])
  const [loadingRetries, setLoadingRetries] = useState(0)
  const [blockchain, setBlockchain] = useState("")
  const [address, setAddress] = useState("")
  const [tokenInfo, setTokenInfo] = useState<{
    name: string
    symbol: string
    price: string
    priceRaw: number  // Raw price value for calculations
    change24h: string
    changeRaw: number // Raw change value for calculations
    volume24h: string
    volumeRaw: number // Raw volume for calculations
    liquidity: string
    liquidityRaw: number // Raw liquidity for calculations
    marketCap: string
    marketCapRaw: number // Raw market cap for calculations
    logo?: string
  }>({
    name: "Unknown Token",
    symbol: "???",
    price: "$0.00",
    priceRaw: 0,
    change24h: "+0.00%",
    changeRaw: 0,
    volume24h: "$0",
    volumeRaw: 0,
    liquidity: "$0",
    liquidityRaw: 0,
    marketCap: "$0",
    marketCapRaw: 0,
  })

  // 初始化区块链和地址
  useEffect(() => {
    if (params.blockchain && params.address) {
      setBlockchain(params.blockchain as string)
      setAddress(params.address as string)
    }
  }, [params])

  // 图表源URL
  const chartUrl = `https://dexscreener.com/${blockchain}/${address}?embed=1&chartLeftToolbar=1&chartTradesTable=1&chartDefaultOnMobile=1&chartTheme=dark&theme=dark&chartStyle=2&chartType=usd&interval=1`

  // 时间周期选项 - 按照币安风格添加更多时间区间
  const timeframes = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"]

  // 时间框架对应的K线间隔
  const timeframeMap: Record<string, string> = {
    "1m": "1m",
    "5m": "5m",
    "15m": "15m",
    "1h": "1h",
    "4h": "4h",
    "1d": "1d",
    "1w": "1w"
  }

  // 获取区块浏览器交易URL
  const getExplorerTxUrl = (chain: string, txHash: string): string => {
    const explorerMap: Record<string, string> = {
      solana: `https://solscan.io/tx/${txHash}`,
      bsc: `https://bscscan.com/tx/${txHash}`,
      ethereum: `https://etherscan.io/tx/${txHash}`,
      polygon: `https://polygonscan.com/tx/${txHash}`,
      avalanche: `https://snowtrace.io/tx/${txHash}`,
      arbitrum: `https://arbiscan.io/tx/${txHash}`,
      optimism: `https://optimistic.etherscan.io/tx/${txHash}`,
      base: `https://basescan.org/tx/${txHash}`,
    }
    
    return explorerMap[chain.toLowerCase()] || `https://dexscreener.com/${chain}/${txHash}`;
  }

  // Format blockchain name for display
  const formatBlockchainName = (chain: string) => {
    const chainMap: Record<string, string> = {
      solana: "Solana",
      bsc: "BNB Chain",
      ethereum: "Ethereum",
      polygon: "Polygon",
      avalanche: "Avalanche",
      arbitrum: "Arbitrum",
      optimism: "Optimism",
      base: "Base",
    }
    return chainMap[chain.toLowerCase()] || chain
  }

  // Shortened address for display
  const shortenAddress = (addr: string) => {
    if (addr.length <= 13) return addr
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Format large numbers with better precision
  const formatNumber = (num: number) => {
    if (!num && num !== 0) return "$0.00";
    
    // Display exact value for smaller numbers
    if (num < 0.01) {
      return `$${num.toFixed(8)}`;
    } else if (num < 1) {
      return `$${num.toFixed(6)}`;
    } else if (num < 1000) {
      return `$${num.toFixed(2)}`;
    } else if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    } else {
      return `$${num.toFixed(2)}`;
    }
  }

  // Format crypto price with scientific notation for very small values
  const formatCryptoPrice = (price: number): string => {
    if (price === 0) return "$0.00";
    
    // For extremely small values, use scientific notation
    if (price < 0.00000001) {
      return `$${price.toExponential(2)}`;
    }
    
    // For very small values, show more decimal places
    if (price < 0.0000001) {
      return `$${price.toFixed(10)}`;
    } else if (price < 0.000001) {
      return `$${price.toFixed(9)}`;
    } else if (price < 0.00001) {
      return `$${price.toFixed(8)}`;
    } else if (price < 0.0001) {
      return `$${price.toFixed(7)}`;
    } else if (price < 0.001) {
      return `$${price.toFixed(6)}`;
    } else if (price < 0.01) {
      return `$${price.toFixed(5)}`;
    } else if (price < 0.1) {
      return `$${price.toFixed(4)}`;
    } else if (price < 1) {
      return `$${price.toFixed(3)}`;
    } else if (price < 10) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toFixed(2)}`;
    }
  }

  // Format date and time
  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      relative: getRelativeTime(timestamp)
    };
  }

  // Get relative time (e.g. "2 minutes ago")
  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Convert to seconds
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) {
      return `${seconds}秒前`;
    }
    
    // Convert to minutes
    const minutes = Math.floor(seconds / 60);
    
    if (minutes < 60) {
      return `${minutes}分钟前`;
    }
    
    // Convert to hours
    const hours = Math.floor(minutes / 60);
    
    if (hours < 24) {
      return `${hours}小时前`;
    }
    
    // Convert to days
    const days = Math.floor(hours / 24);
    
    return `${days}天前`;
  }

  // Copy address to clipboard
  const copyAddressToClipboard = () => {
    navigator.clipboard.writeText(address)
    toast({
      title: "地址已复制",
      description: "合约地址已复制到剪贴板",
    })
  }

  // Open in DexScreener
  const openInDexScreener = () => {
    window.open(`https://dexscreener.com/${blockchain}/${address}`, "_blank")
  }

  // View in K-Line detail page
  const viewKLineDetail = () => {
    window.open(`/chart?blockchain=${blockchain}&address=${address}&interval=${klineInterval}`, "_blank")
  }

  // 时间框架改变时更新K线间隔
  useEffect(() => {
    setKlineInterval(timeframeMap[selectedTimeframe] || "1h")
  }, [selectedTimeframe])

  // Handle logo loading error
  const handleLogoError = () => {
    setTokenLogo("/placeholder-token.png");
  }

  const loadTokenData = useCallback(async () => {
    if (!blockchain || !address) return;
    
    setIsLoading(true);
    console.log(`Loading token data for ${blockchain}/${address}...`);
    
    try {
      const tokenDetails = await getTokenDetails(address, blockchain);
      console.log('Token details received:', tokenDetails);
      
      if (tokenDetails) {
        // Update token logo
        if (tokenDetails.tokenInfo.logo_url) {
          setTokenLogo(tokenDetails.tokenInfo.logo_url);
        }
        
        // Log actual values for debugging
        console.log('Price:', tokenDetails.price);
        console.log('Price Change:', tokenDetails.priceChange);
        console.log('Volume 24h:', tokenDetails.volume24h);
        console.log('LP Amount:', tokenDetails.lpAmount);
        console.log('Market Cap:', tokenDetails.marketCap);
        
        // Check for missing critical data
        if (tokenDetails.price === undefined || tokenDetails.price === null) {
          console.error('API返回的价格数据为空');
          toast({
            variant: "destructive",
            title: "数据错误",
            description: "无法获取代币价格数据，请稍后重试",
            action: <ToastAction altText="重试" onClick={refreshData}>重试</ToastAction>,
          });
        }
        
        // Update token information - ensure all values have defaults
        setTokenInfo({
          name: tokenDetails.tokenInfo.name || "Unknown Token",
          symbol: tokenDetails.tokenInfo.symbol || "???",
          price: formatCryptoPrice(tokenDetails.price || 0),
          priceRaw: tokenDetails.price || 0,
          change24h: tokenDetails.priceChange != null ? (
            tokenDetails.priceChange >= 0 
            ? `+${tokenDetails.priceChange.toFixed(2)}%` 
            : `${tokenDetails.priceChange.toFixed(2)}%`
          ) : "0.00%",
          changeRaw: tokenDetails.priceChange || 0,
          volume24h: formatNumber(tokenDetails.volume24h || 0),
          volumeRaw: tokenDetails.volume24h || 0,
          liquidity: formatNumber(tokenDetails.lpAmount || 0),
          liquidityRaw: tokenDetails.lpAmount || 0,
          marketCap: formatNumber(tokenDetails.marketCap || 0),
          marketCapRaw: tokenDetails.marketCap || 0,
          logo: tokenDetails.tokenInfo.logo_url || "",
        });
        
        // Fetch recent trades separately
        try {
          const trades = await getTokenTransactions(address, blockchain, 10);
          console.log('Trades received:', trades && trades.length ? trades.length : 0);
          
          if (trades && trades.length > 0) {
            // Transform the trades into the expected format
            const formattedTrades: RecentTrade[] = trades.map(trade => ({
              timestamp: trade.timestamp || Date.now(), // 使用API返回的真实时间戳
              priceUsd: trade.price || "0.00",
              amount: trade.amount || "0",
              type: trade.type === 'buy' || trade.side === 'buy' ? 'buy' : 'sell', // 使用API返回的交易类型
              txHash: trade.txHash || trade.hash || undefined
            }));
            setTokenTrades(formattedTrades);
          }
        } catch (tradeError) {
          console.error("获取代币交易记录错误:", tradeError);
        }
      } else {
        // Handle case when token is not found
        toast({
          variant: "destructive",
          title: "未找到代币",
          description: "无法获取该代币的信息，请检查合约地址是否正确。",
        });
      }
    } catch (error) {
      console.error("获取代币数据错误:", error);
      
      if (loadingRetries < 3) {
        // 自动重试3次
        setLoadingRetries(prev => prev + 1);
        setTimeout(loadTokenData, 1500);
        
        toast({
          title: "正在重试",
          description: `加载数据失败，正在重试 (${loadingRetries + 1}/3)...`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "加载错误",
          description: "获取代币信息失败，请刷新重试。",
          action: <ToastAction altText="重试" onClick={loadTokenData}>重试</ToastAction>,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [blockchain, address, loadingRetries]);

  // 加载数据
  useEffect(() => {
    // 如果区块链和地址已加载则获取数据
    if (blockchain && address) {
      // 重置重试次数
      setLoadingRetries(0);
      // 加载代币数据
      loadTokenData();
    }
  }, [blockchain, address, loadTokenData]);

  // 刷新数据函数
  const refreshData = useCallback(() => {
    setLoadingRetries(0);
    loadTokenData();
  }, [loadTokenData]);

  return (
    <div className={`min-h-screen ${darkMode ? "bg-black text-white" : "bg-white text-black"}`}>
      <div className="max-w-md mx-auto pb-16">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
                <Image 
                  src={tokenInfo.logo || tokenLogo} 
                  alt={tokenInfo.symbol}
                  width={32}
                  height={32}
                  className="object-cover"
                  onError={handleLogoError}
                  priority
                />
              </div>
            <div>
              {isLoading ? (
                <>
                  <Skeleton className="h-5 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </>
              ) : (
                <>
                  <h1 className="text-lg font-bold">
                    {tokenInfo.name} ({tokenInfo.symbol})
                  </h1>
                  <div className="flex items-center text-xs text-gray-400">
                    <span>{formatBlockchainName(blockchain)}</span>
                    <span className="mx-1">•</span>
                    <span className="flex items-center gap-1">
                      {shortenAddress(address)}
                      <button 
                        onClick={copyAddressToClipboard} 
                        className="hover:text-gray-300"
                        aria-label="复制合约地址"
                        title="复制合约地址"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                </>
              )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full" 
              aria-label="刷新数据"
              onClick={refreshData}
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${isLoading ? 'animate-spin' : ''}`}>
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                <path d="M16 21h5v-5"></path>
              </svg>
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="添加到收藏">
              <Star className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="分享">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={openInDexScreener} aria-label="在DexScreener中查看">
              <ExternalLink className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Trading Pair Selector */}
        <div className="px-4 mb-2 mt-4">
          <div className={`flex justify-between items-center p-3 rounded-lg ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
            <div className="flex gap-2 items-center">
              <span className="text-lg font-bold">{isLoading ? "Loading..." : `${tokenInfo.symbol}/USD`}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex gap-1 overflow-x-auto hide-scrollbar">
              {timeframes.map(time => (
                <Button 
                  key={time}
                  variant={selectedTimeframe === time ? "default" : "outline"}
                  size="sm"
                  className={`px-2 py-1 h-7 text-xs flex-shrink-0 ${
                    selectedTimeframe === time 
                      ? "bg-blue-600" 
                      : darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"
                  }`}
                  onClick={() => setSelectedTimeframe(time)}
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">价格走势</h2>
            <Button 
              variant="outline" 
              size="sm" 
              className={`text-xs h-7 rounded-full ${darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"} text-white border-none`}
              onClick={viewKLineDetail}
            >
              查看详细K线
            </Button>
          </div>
          
          <div className="h-[280px] relative">
            <ChartWrapper 
              darkMode={darkMode} 
              tokenAddress={address}
              tokenChain={blockchain}
              interval={klineInterval}
            />
          </div>
        </div>

        {/* Trading Info */}
        <div className="px-4 py-2">
          <div className={`rounded-xl p-4 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">交易信息</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs flex items-center gap-1" 
                onClick={refreshData}
                disabled={isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${isLoading ? 'animate-spin' : ''}`}>
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                  <path d="M16 21h5v-5"></path>
                </svg>
                刷新
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-xs mb-1">24h 价格变化</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <p className={`font-semibold ${tokenInfo.changeRaw >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {tokenInfo.change24h}
                  </p>
                )}
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">当前价格</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <p className="font-semibold">
                    {formatCryptoPrice(tokenInfo.priceRaw)}
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-800">
              <div>
                <p className="text-gray-400 text-xs mb-1">24h交易量</p>
                {isLoading ? (
                  <Skeleton className="h-5 w-16" />
                ) : (
                  <p className="font-semibold">{tokenInfo.volume24h}</p>
                )}
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">流动性</p>
                {isLoading ? (
                  <Skeleton className="h-5 w-16" />
                ) : (
                  <p className="font-semibold">{tokenInfo.liquidity}</p>
                )}
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">市值</p>
                {isLoading ? (
                  <Skeleton className="h-5 w-16" />
                ) : (
                  <p className="font-semibold">{tokenInfo.marketCap}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Trades, Info */}
        <div className="px-4 pt-4">
          <Tabs defaultValue="trades" className="w-full">
            <TabsList className="w-full bg-gray-900">
              <TabsTrigger value="trades" className="flex-1">最近交易</TabsTrigger>
              <TabsTrigger value="info" className="flex-1">代币信息</TabsTrigger>
            </TabsList>
            <TabsContent value="trades" className="bg-gray-900 p-4 rounded-b-lg">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-gray-800">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                ))
              ) : tokenTrades && tokenTrades.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="text-gray-400 text-xs">
                      <tr>
                        <th className="text-left py-2">时间</th>
                        <th className="text-right py-2">价格</th>
                        <th className="text-right py-2">数量</th>
                        <th className="text-right py-2">类型</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tokenTrades.map((trade, index) => (
                        <tr key={index} className="border-t border-gray-800">
                          <td className="py-2 text-left" title={`${formatDateTime(trade.timestamp).date} ${formatDateTime(trade.timestamp).time}`}>
                            {formatDateTime(trade.timestamp).relative}
                          </td>
                          <td className="py-2 text-right">${parseFloat(trade.priceUsd).toFixed(6)}</td>
                          <td className="py-2 text-right">{parseFloat(trade.amount).toFixed(2)}</td>
                          <td className={`py-2 text-right ${trade.type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                            {trade.txHash ? (
                              <a 
                                href={getExplorerTxUrl(blockchain, trade.txHash)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-end gap-1"
                              >
                                {trade.type === 'buy' ? '买入' : '卖出'}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              trade.type === 'buy' ? '买入' : '卖出'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  <p className="mb-2">暂无交易数据</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs" 
                    onClick={refreshData}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                      <path d="M3 3v5h5"></path>
                      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                      <path d="M16 21h5v-5"></path>
                    </svg>
                    刷新数据
                  </Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="info" className="bg-gray-900 p-4 rounded-b-lg">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">合约地址</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-right">{shortenAddress(address)}</span>
                    <button 
                      onClick={copyAddressToClipboard}
                      aria-label="复制合约地址"
                      title="复制合约地址"
                    >
                      <Copy className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">区块链</span>
                  <span>{formatBlockchainName(blockchain)}</span>
                </div>
                {!isLoading && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">代币全称</span>
                      <span>{tokenInfo.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">代币符号</span>
                      <span>{tokenInfo.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">当前价格</span>
                      <span>{tokenInfo.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">24小时涨跌</span>
                      <span className={tokenInfo.change24h.startsWith("+") ? "text-green-500" : "text-red-500"}>
                        {tokenInfo.change24h}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">交易所</span>
                      <a 
                        href={`https://dexscreener.com/${blockchain}/${address}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-400"
                      >
                        <span>DEX</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <BottomNav darkMode={darkMode} />
    </div>
  )
}
