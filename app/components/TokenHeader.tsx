"use client";
import React, { useState } from "react";
import Image from "next/image";

interface TokenInfo {
  logo_url?: string;
  symbol?: string;
  name?: string;
  price?: number | string;
  priceChange24h?: number;
  volume24h?: number | string;
  marketCap?: number | string;
  lpAmount?: number | string;
  holders?: number | string;
}

export default function TokenHeader({ tokenInfo }: { tokenInfo: TokenInfo }) {
  const [imageError, setImageError] = useState(false);
  
  // 设置默认占位图，确保不会传递空字符串给Image组件
  const hasValidLogo = !!(tokenInfo.logo_url && tokenInfo.logo_url.trim() !== "" && !imageError);
  const placeholderImage = "/placeholder-token.png";
  // Make sure we never pass undefined to Image component
  const logoUrl = hasValidLogo && tokenInfo.logo_url ? tokenInfo.logo_url : placeholderImage;
  
  // 格式化数字
  const formatNumber = (num: number | string | undefined): string => {
    if (num === undefined) return "0";
    
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    
    if (isNaN(numValue)) return "0";
    
    if (numValue >= 1000000000) {
      return `$${(numValue / 1000000000).toFixed(2)}B`;
    } else if (numValue >= 1000000) {
      return `$${(numValue / 1000000).toFixed(2)}M`;
    } else if (numValue >= 1000) {
      return `$${(numValue / 1000).toFixed(2)}K`;
    } else {
      return `$${numValue.toFixed(2)}`;
    }
  };
  
  // 格式化价格
  const formatPrice = (price: number | string | undefined): string => {
    if (price === undefined) return "$0";
    
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(numPrice)) return "$0";
    
    if (numPrice < 0.000001) {
      return `$${numPrice.toExponential(4)}`;
    } else if (numPrice < 0.001) {
      return `$${numPrice.toFixed(6)}`;
    } else if (numPrice < 1) {
      return `$${numPrice.toFixed(4)}`;
    } else if (numPrice < 10000) {
      return `$${numPrice.toFixed(2)}`;
    } else {
      return formatNumber(numPrice);
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-[#181f2a] rounded-b-xl shadow mb-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 relative rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
          <Image 
            src={logoUrl}
            alt={tokenInfo.symbol || "Token"}
            width={40}
            height={40}
            className="rounded-full"
            onError={() => setImageError(true)}
          />
        </div>
        <div>
          <div className="font-bold text-lg">{tokenInfo.symbol || "Unknown Token"}</div>
          <div className="text-xs text-gray-400">{tokenInfo.name || ""}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 mt-2 md:mt-0">
        <div>
          <div className="text-2xl font-bold">{formatPrice(tokenInfo.price)}</div>
          <div className={`text-sm ${tokenInfo.priceChange24h && tokenInfo.priceChange24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {tokenInfo.priceChange24h && tokenInfo.priceChange24h > 0 ? '+' : ''}{tokenInfo.priceChange24h ? `${tokenInfo.priceChange24h.toFixed(2)}%` : '0%'}
          </div>
        </div>
        <div className="text-xs text-gray-400">24H额: {formatNumber(tokenInfo.volume24h)}</div>
        <div className="text-xs text-gray-400">流通市值: {formatNumber(tokenInfo.marketCap)}</div>
        <div className="text-xs text-gray-400">池子: {formatNumber(tokenInfo.lpAmount)}</div>
        <div className="text-xs text-gray-400">持有人: {typeof tokenInfo.holders === 'number' ? tokenInfo.holders.toLocaleString() : tokenInfo.holders || '0'}</div>
      </div>
    </div>
  );
} 