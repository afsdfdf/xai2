"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import AveTradingViewChart, { AveTradingViewChartRef } from "./AveTradingViewChart"

// 定义可用的时间间隔选项
const TIME_INTERVALS = [
  { label: '1分', value: '1m' },
  { label: '5分', value: '5m' },
  { label: '15分', value: '15m' },
  { label: '1时', value: '1h' },
  { label: '4时', value: '4h' },
  { label: '1天', value: '1d' },
  { label: '1周', value: '1w' },
];

interface ChartWrapperProps {
  darkMode: boolean
  tokenAddress?: string
  tokenChain?: string
  interval?: string
  forceSimpleChart?: boolean
}

// 将区块链和代币地址转换为TradingView可识别的交易对格式
function formatSymbolForTradingView(chain: string, address: string): string {
  // 处理特殊代币
  if (chain === 'bsc' && address === '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c') {
    return 'BINANCE:BNBUSDT'; // BNB
  }
  if (chain === 'ethereum' && address === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2') {
    return 'BINANCE:ETHUSDT'; // WETH
  }
  if (chain === 'ethereum' && address === '0xdac17f958d2ee523a2206206994597c13d831ec7') {
    return 'BINANCE:USDTUSDC'; // USDT
  }
  if (chain === 'solana' && address === '83mCRQJzvKMeQd9wJbZDUCTPgRbZMDoPdMSx5Sf1pump') {
    return 'BINANCE:SOLUSDT'; // 默认SOL (示例)
  }
  
  // 转换区块链名称为交易所名称
  const exchangeMap: Record<string, string> = {
    'ethereum': 'COINBASE',
    'bsc': 'BINANCE',
    'solana': 'BINANCE',
    'avalanche': 'BINANCE',
    'polygon': 'BINANCE',
    'fantom': 'KUCOIN',
    'arbitrum': 'BINANCE',
    'optimism': 'BINANCE'
  };
  
  const exchange = exchangeMap[chain] || 'BINANCE';
  
  // 获取代币符号（这里应该从API获取，但我们使用简化逻辑）
  // 对于实际应用，你应该使用tokenInfo.symbol
  const symbol = address.substr(0, 6).toUpperCase();
  
  // 返回TradingView认可的格式
  return `${exchange}:${symbol}USDT`;
}

// 映射时间周期到TradingView时间周期格式
function mapIntervalToTradingView(interval: string): string {
  const intervalMap: Record<string, string> = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '30m': '30',
    '1h': '60',
    '4h': '240',
    '1d': 'D',
    '1w': 'W',
    '1M': 'M'
  };
  
  return intervalMap[interval] || '60'; // 默认1小时
}

export default function ChartWrapper({ 
  darkMode = true, 
  tokenAddress = "0xtoken", 
  tokenChain = "eth",
  interval = "1h",
  forceSimpleChart = false
}: ChartWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [scriptStatus, setScriptStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentInterval, setCurrentInterval] = useState(interval);
  const chartRef = useRef<AveTradingViewChartRef | null>(null);
  
  // 当外部传入的interval变化时，更新当前interval
  useEffect(() => {
    setCurrentInterval(interval);
  }, [interval]);
  
  // 切换时间间隔
  const handleIntervalChange = (newInterval: string) => {
    if (newInterval === currentInterval) return;
    setCurrentInterval(newInterval);
    // 重置状态，准备重新加载图表
    setError(null);
    setIsLoading(true);
  };
  
  // 检查图表库脚本加载状态
  useEffect(() => {
    const checkLibraryLoaded = () => {
      if (window.LightweightCharts) {
        console.log('图表库已加载');
        setScriptStatus('loaded');
        return true;
      }
      return false;
    };
    
    // 如果已经加载，直接设置状态
    if (checkLibraryLoaded()) return;
    
    // 否则设置一个轮询检查
    const interval = setInterval(() => {
      if (checkLibraryLoaded()) {
        clearInterval(interval);
      }
    }, 500);
    
    // 超时后设置错误
    const timeout = setTimeout(() => {
      if (scriptStatus !== 'loaded') {
        console.error('图表库加载超时');
        setScriptStatus('error');
        setError('图表库加载超时，请刷新页面重试');
        clearInterval(interval);
      }
    }, 10000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [scriptStatus]);
  
  // 处理加载状态回调
  const handleLoadingChange = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);
  
  // 处理错误状态回调
  const handleError = useCallback((err: string | null) => {
    setError(err);
  }, []);
  
      if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-full text-white">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => setRefreshKey(prev => prev + 1)}
        >
          重试加载
        </button>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full flex flex-col bg-[#111827] relative">
      {/* 添加时间间隔选择器 */}
      <div className="flex justify-end items-center px-2 py-1 border-b border-gray-700">
        <div className="flex items-center space-x-1">
          {TIME_INTERVALS.map(item => (
            <button
              key={item.value}
              onClick={() => handleIntervalChange(item.value)}
              className={`px-2 py-1 text-xs rounded ${
                currentInterval === item.value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#111827] bg-opacity-80">
          <div className="flex flex-col items-center">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
            <div className="text-white">正在加载图表...</div>
          </div>
        </div>
      )}
      
      <div className="flex-grow relative">
        <AveTradingViewChart 
          key={`ave-chart-${tokenAddress}-${tokenChain}-${currentInterval}-${refreshKey}`}
          tokenAddress={tokenAddress}
          tokenChain={tokenChain}
          interval={currentInterval}
          theme={darkMode ? 'dark' : 'light'}
          onLoadingChange={handleLoadingChange}
          onError={handleError}
          chartRef={chartRef}
          autoRefresh={true}
          refreshInterval={60000} // 每分钟自动刷新
        />
      </div>
    </div>
  );
} 