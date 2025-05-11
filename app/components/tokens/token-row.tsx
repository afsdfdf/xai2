import React, { useState, useEffect } from "react";
import Image from "next/image";
import { TokenRanking } from "@/app/types/token";
import { 
  formatPrice, 
  formatPercentChange, 
  formatVolume,
  formatHolders 
} from "@/app/lib/formatters";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { TrendingDown, TrendingUp } from "lucide-react";

interface TokenRowProps {
  token: TokenRanking;
  index: number;
  darkMode: boolean;
  onClick: (token: TokenRanking) => void;
}

/**
 * 代币行组件
 */
export default function TokenRow({ 
  token, 
  index, 
  darkMode,
  onClick 
}: TokenRowProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasValidLogo, setHasValidLogo] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || darkMode;
  
  // 检查logo_url是否有效
  useEffect(() => {
    // 预先检查logo_url是否为有效字符串
    setHasValidLogo(!!token.logo_url && token.logo_url.trim() !== '');
  }, [token.logo_url]);
  
  // 处理图片加载错误
  const handleImageError = () => {
    setImageError(true);
  };

  // 生成默认图标，当图片加载失败时显示
  const getDefaultIcon = () => {
    // 根据代币符号创建渐变背景
    const generateGradient = () => {
      // 使用代币符号的字符码生成颜色
      const char1 = token.symbol.charCodeAt(0) % 360;
      const char2 = (token.symbol.length > 1 ? token.symbol.charCodeAt(1) : 0) % 360;
      
      return {
        background: isDark
          ? `linear-gradient(135deg, hsl(${char1}, 70%, 40%), hsl(${char2}, 70%, 30%))`
          : `linear-gradient(135deg, hsl(${char1}, 80%, 60%), hsl(${char2}, 80%, 50%))`
      };
    };
    
    return (
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white shadow-sm"
        style={generateGradient()}
      >
        {token.symbol.substring(0, 2).toUpperCase()}
      </div>
    );
  };

  // 价格变化颜色和样式
  const getPriceChangeStyle = () => {
    const value = token.price_change_24h;
    
    // 基本文本颜色
    const textColor = value > 0 
      ? 'text-emerald-500' 
      : value < 0 
        ? 'text-rose-500' 
        : 'text-muted-foreground';
        
    // 背景色（只在有变化时添加）
    const bgColor = value === 0 ? '' : isDark
      ? value > 0 
          ? 'bg-emerald-500/10' 
          : 'bg-rose-500/10'
      : value > 0 
          ? 'bg-emerald-500/10' 
          : 'bg-rose-500/10';
      
    return cn(
      textColor,
      bgColor,
      "px-2 py-0.5 rounded-full text-xs font-medium flex items-center justify-center",
      "transition-all duration-200"
    );
  };

  return (
    <div 
      className={cn(
        "grid grid-cols-4 gap-2 py-3 px-3 text-sm items-center cursor-pointer rounded-lg transition-all duration-200",
        isDark 
          ? "hover:bg-muted/70 hover:scale-[1.01]" 
          : "hover:bg-secondary/90 hover:shadow-md hover:scale-[1.01]",
        (index + 1) % 2 === 0 
          ? isDark 
            ? 'bg-muted/20' 
            : 'bg-secondary/50'
          : isDark
            ? 'bg-transparent'
            : 'bg-background'
      )}
      onClick={() => onClick(token)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 代币信息 */}
      <div className="flex items-center col-span-2">
        <div className={cn(
          "relative flex-shrink-0",
          "transition-transform duration-200",
          isHovered ? "scale-110" : ""
        )}>
          {!hasValidLogo || imageError ? (
            getDefaultIcon()
          ) : (
            <div className={cn(
              "w-8 h-8 rounded-full overflow-hidden",
              "shadow-sm transition-transform duration-200",
              isHovered ? "shadow-md" : ""
            )}>
              <Image
                src={token.logo_url}
                alt={token.name || token.symbol}
                width={32}
                height={32}
                className={cn(
                  "w-full h-full object-cover",
                  isHovered ? "scale-110" : ""
                )}
                style={{ transition: "transform 0.2s ease" }}
                onError={handleImageError}
              />
            </div>
          )}
        </div>
        <div className="ml-2.5">
          <div className={cn(
            "font-medium transition-all",
            isHovered ? "text-primary" : ""
          )}>{token.symbol}</div>
          <div className="text-xs text-muted-foreground truncate max-w-[120px]">
            {token.name}
          </div>
        </div>
      </div>
      
      {/* 价格 */}
      <div className={cn(
        "font-medium transition-colors",
        isHovered ? "text-foreground" : isDark ? "text-foreground/90" : "text-foreground/80"
      )}>
        {formatPrice(token.current_price_usd)}
      </div>
      
      {/* 价格变化 */}
      <div className="font-medium flex items-center justify-end">
        <div className={getPriceChangeStyle()}>
          {token.price_change_24h > 0 && (
            <TrendingUp className="w-3 h-3 mr-1" />
          )}
          {token.price_change_24h < 0 && (
            <TrendingDown className="w-3 h-3 mr-1" />
          )}
          {formatPercentChange(token.price_change_24h)}
        </div>
      </div>
    </div>
  );
} 