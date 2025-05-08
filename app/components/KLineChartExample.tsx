"use client"

import React, { useRef, useState } from 'react';
import AveTradingViewChart, { TIME_INTERVALS, AveTradingViewChartRef } from './AveTradingViewChart';

interface KLineChartExampleProps {
  tokenAddress: string;
  tokenChain: string;
  initialInterval?: string;
  tokenName?: string;
  tokenSymbol?: string;
  price?: number;
  priceChange?: number;
}

export default function KLineChartExample({
  tokenAddress,
  tokenChain,
  initialInterval = "1h",
  tokenName = "Unknown Token",
  tokenSymbol = "Unknown Token",
  price = 0,
  priceChange = 0
}: KLineChartExampleProps) {
  const [interval, setInterval] = useState(initialInterval);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<AveTradingViewChartRef | null>(null);
  
  // 处理间隔变化
  const handleIntervalChange = (newInterval: string) => {
    setInterval(newInterval);
  };
  
  // 计算价格变化的颜色
  const priceColor = priceChange >= 0 ? 'text-green-500' : 'text-red-500';
  const priceChangeFormatted = `${priceChange >= 0 ? '+' : ''}${priceChange}%`;
  
  return (
    <div className="w-full h-full flex flex-col bg-[#1A2138]">
      {/* 代币基本信息 */}
      <div className="flex flex-col px-4 py-3 border-b border-gray-700">
        <div className="flex items-center mb-1">
          <div className="w-6 h-6 bg-gray-600 rounded-full mr-2"></div>
          <div className="text-white font-medium">{tokenName}</div>
        </div>
        <div className="text-gray-400 text-xs mb-2">{tokenSymbol}</div>
        <div className="flex items-baseline">
          <div className="text-white text-2xl font-bold mr-2">${price.toFixed(2)}</div>
          <div className={`text-sm ${priceColor}`}>{priceChangeFormatted}</div>
        </div>
        
        <div className="grid grid-cols-4 mt-2 text-xs text-gray-400">
          <div>24H额: 0</div>
          <div>流通市值: 0</div>
          <div>池子: 0</div>
          <div>持有人: 0</div>
        </div>
      </div>
      
      {/* 搜索栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
        <div className="flex items-center w-full">
          <div className="relative flex items-center text-gray-400 w-full">
            <button className="mr-2 text-gray-400 rounded-full bg-gray-800 w-6 h-6 flex items-center justify-center">?</button>
            <input 
              type="text" 
              placeholder="搜索名称/地址" 
              className="bg-gray-800 rounded-md px-3 py-1.5 w-full text-sm text-gray-300"
            />
            <div className="absolute right-2">🔍</div>
          </div>
        </div>
      </div>
      
      {/* 时间周期选择 */}
      <div className="flex justify-end items-center px-2 py-1 border-b border-gray-700">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleIntervalChange('1m')}
            className={`px-2 py-1 text-xs rounded ${interval === '1m' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
          >
            1分
          </button>
          <button
            onClick={() => handleIntervalChange('5m')}
            className={`px-2 py-1 text-xs rounded ${interval === '5m' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
          >
            5分
          </button>
          <button
            onClick={() => handleIntervalChange('15m')}
            className={`px-2 py-1 text-xs rounded ${interval === '15m' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
          >
            15分
          </button>
          <button
            onClick={() => handleIntervalChange('1h')}
            className={`px-2 py-1 text-xs rounded ${interval === '1h' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
          >
            1时
          </button>
          <button
            onClick={() => handleIntervalChange('4h')}
            className={`px-2 py-1 text-xs rounded ${interval === '4h' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
          >
            4时
          </button>
          <button
            onClick={() => handleIntervalChange('1d')}
            className={`px-2 py-1 text-xs rounded ${interval === '1d' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
          >
            1天
          </button>
          <button
            onClick={() => handleIntervalChange('1w')}
            className={`px-2 py-1 text-xs rounded ${interval === '1w' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
          >
            1周
          </button>
        </div>
      </div>
      
      {/* 图表区域 */}
      <div className="flex-grow h-0 min-h-[400px] relative">
        <AveTradingViewChart
          tokenAddress={tokenAddress}
          tokenChain={tokenChain}
          interval={interval}
          onIntervalChange={handleIntervalChange}
          onLoadingChange={setIsLoading}
          onError={setError}
          chartRef={chartRef}
          autoRefresh={true}
          refreshInterval={60000} // 60秒自动刷新一次
        />
      </div>
      
      {/* 底部导航栏 */}
      <div className="flex justify-around items-center py-3 border-t border-gray-700 bg-[#1A2138]">
        <div className="flex flex-col items-center">
          <div className="text-white mb-1">N</div>
          <div className="text-xs text-gray-400">首页</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-white mb-1">📊</div>
          <div className="text-xs text-gray-400">市场</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-white mb-1">🔍</div>
          <div className="text-xs text-gray-400">发现</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-white mb-1">💱</div>
          <div className="text-xs text-gray-400">交易</div>
        </div>
      </div>
      
      {/* 国家语言选择按钮 */}
      <div className="absolute bottom-20 right-3 z-10">
        <button className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
          25 国家语言
        </button>
      </div>
    </div>
  );
} 