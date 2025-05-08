"use client"

import { useState, useEffect } from "react"
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
import { getTokenDetails } from "@/app/lib/ave-api-service"

export default function TokenDetailPage() {
  const params = useParams()
  const [darkMode, setDarkMode] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D")
  const [klineInterval, setKlineInterval] = useState("1d")
  const [tokenLogo, setTokenLogo] = useState("/placeholder-token.png")
  const [tokenInfo, setTokenInfo] = useState<{
    name: string
    symbol: string
    price: string
    change24h: string
    volume24h: string
    liquidity: string
    marketCap: string
    logo?: string
  }>({
    name: "Unknown Token",
    symbol: "???",
    price: "$0.00",
    change24h: "+0.00%",
    volume24h: "$0",
    liquidity: "$0",
    marketCap: "$0",
  })

  const blockchain = params.blockchain as string
  const address = params.address as string

  // 图表源URL
  const chartUrl = `https://dexscreener.com/${blockchain}/${address}?embed=1&chartLeftToolbar=1&chartTradesTable=1&chartDefaultOnMobile=1&chartTheme=dark&theme=dark&chartStyle=2&chartType=usd&interval=1`

  // 时间周期选项
  const timeframes = ["15m", "1H", "4H", "1D", "1W"]

  // 时间框架对应的K线间隔
  const timeframeMap: Record<string, string> = {
    "15m": "15m",
    "1H": "1h",
    "4H": "4h",
    "1D": "1d",
    "1W": "1w"
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

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    } else {
      return `$${num.toFixed(2)}`;
    }
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
    window.open(`/chart?blockchain=${blockchain}&address=${address}`, "_blank")
  }

  // 时间框架改变时更新K线间隔
  useEffect(() => {
    setKlineInterval(timeframeMap[selectedTimeframe] || "1d")
  }, [selectedTimeframe])

  // Handle logo loading error
  const handleLogoError = () => {
    setTokenLogo("/placeholder-token.png");
  }

  useEffect(() => {
    // Fetch token data from Ave API
    setIsLoading(true);

    const fetchTokenData = async () => {
      try {
        const tokenDetails = await getTokenDetails(address, blockchain);
        
        if (tokenDetails) {
          // Update token logo
          if (tokenDetails.tokenInfo.logo_url) {
            setTokenLogo(tokenDetails.tokenInfo.logo_url);
          }
          
          // Update token information
        setTokenInfo({
            name: tokenDetails.tokenInfo.name || "Unknown Token",
            symbol: tokenDetails.tokenInfo.symbol || "???",
            price: `$${tokenDetails.price.toFixed(6)}`,
            change24h: tokenDetails.priceChange >= 0 
              ? `+${tokenDetails.priceChange.toFixed(2)}%` 
              : `${tokenDetails.priceChange.toFixed(2)}%`,
            volume24h: formatNumber(tokenDetails.volume24h),
            liquidity: formatNumber(tokenDetails.lpAmount),
            marketCap: formatNumber(tokenDetails.marketCap),
            logo: tokenDetails.tokenInfo.logo_url,
          });
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
        toast({
          variant: "destructive",
          title: "加载错误",
          description: "获取代币信息失败，请稍后重试。",
          action: <ToastAction altText="重试">重试</ToastAction>,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenData();
  }, [blockchain, address]);

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
                  src={tokenLogo} 
                  alt={tokenInfo.symbol}
                  width={32}
                  height={32}
                  className="object-cover"
                  onError={handleLogoError}
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
                      <button onClick={copyAddressToClipboard} className="hover:text-gray-300">
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
            <Button variant="ghost" size="icon" className="rounded-full">
              <Star className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={openInDexScreener}>
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
            <div className="flex gap-1">
              {timeframes.map(time => (
                <Button 
                  key={time}
                  variant={selectedTimeframe === time ? "default" : "outline"}
                  size="sm"
                  className={`px-2 py-1 h-7 text-xs ${
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
          
          <div className="h-[150px] relative">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-xs mb-1">24h 价格变化</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <p className={`font-semibold ${tokenInfo.change24h.startsWith("+") ? "text-green-500" : "text-red-500"}`}>
                    {tokenInfo.change24h}
                  </p>
                )}
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">当前价格</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <p className="font-semibold">{tokenInfo.price}</p>
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
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  暂无交易数据
                </div>
              )}
            </TabsContent>
            <TabsContent value="info" className="bg-gray-900 p-4 rounded-b-lg">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">合约地址</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-right">{shortenAddress(address)}</span>
                    <button onClick={copyAddressToClipboard}>
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
                      <span className="text-gray-400">交易对</span>
                      <span>{tokenInfo.symbol}/USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">价格</span>
                      <span>{tokenInfo.price}</span>
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
