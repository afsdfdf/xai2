"use client";
import React, { useState } from "react";
import Image from "next/image";

interface TokenInfo {
  logo_url?: string;
  symbol?: string;
}

interface TokenSearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onSearch: () => void;
  tokenInfo: TokenInfo;
}

export default function TokenSearchBar({ value, onChange, onSearch, tokenInfo }: TokenSearchBarProps) {
  const [imageError, setImageError] = useState(false);
  
  // Check if logo_url exists, is not empty, and hasn't had an error
  const hasValidLogo = !!(tokenInfo.logo_url && tokenInfo.logo_url.trim() !== '' && !imageError);
  // Ensure we have a string that is never undefined
  const logoUrl = tokenInfo.logo_url || '';
  
  return (
    <div className="flex items-center bg-[#232b3b] rounded-lg px-3 py-2 mt-3 mb-2">
      <div className="w-7 h-7 rounded-full mr-2 bg-gray-700 flex items-center justify-center overflow-hidden">
        {hasValidLogo ? (
          <Image 
            src={logoUrl}
            alt={tokenInfo.symbol || 'Token'}
            width={28}
            height={28}
            className="rounded-full"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="text-xs text-white">
            {tokenInfo.symbol ? tokenInfo.symbol.slice(0, 2) : '?'}
          </div>
        )}
      </div>
      <span className="font-bold mr-2">{tokenInfo.symbol}</span>
      <input
        className="flex-1 bg-transparent outline-none text-white placeholder-gray-400"
        placeholder="搜索名称/地址"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSearch()}
      />
      <button onClick={onSearch} className="ml-2 text-gray-400 hover:text-white">
        <svg width="20" height="20" fill="none" stroke="currentColor"><circle cx="9" cy="9" r="7" /><line x1="15" y1="15" x2="19" y2="19" /></svg>
      </button>
    </div>
  );
} 