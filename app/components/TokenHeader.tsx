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
          <div className="text-2xl font-bold">${tokenInfo.price || "0"}</div>
          <div className={`text-sm ${tokenInfo.priceChange24h && tokenInfo.priceChange24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {tokenInfo.priceChange24h && tokenInfo.priceChange24h > 0 ? '+' : ''}{tokenInfo.priceChange24h || 0}%
          </div>
        </div>
        <div className="text-xs text-gray-400">24H额: {tokenInfo.volume24h || 0}</div>
        <div className="text-xs text-gray-400">流通市值: {tokenInfo.marketCap || 0}</div>
        <div className="text-xs text-gray-400">池子: {tokenInfo.lpAmount || 0}</div>
        <div className="text-xs text-gray-400">持有人: {tokenInfo.holders || 0}</div>
      </div>
    </div>
  );
} 