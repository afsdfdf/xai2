import { TokenData } from '@/app/types/token';
import { formatPrice, formatPercentChange, formatVolume, formatHolders } from '@/app/utils/formatters';
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Smile } from "lucide-react";

interface TokenCardProps {
  token: TokenData;
  darkMode: boolean;
  onTokenClick: (token: TokenData) => void;
  onImageError: (tokenId: string) => void;
  imageErrors: Record<string, boolean>;
}

export const TokenCard = ({ 
  token, 
  darkMode, 
  onTokenClick, 
  onImageError, 
  imageErrors 
}: TokenCardProps) => {
  const tokenId = `${token.chain}-${token.token}`;
  const hasLogoError = imageErrors[tokenId];
  const isPriceUp = token.price_change_24h > 0;

  return (
    <Card
      className={`p-1.5 mb-1 ${
        darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
      } cursor-pointer hover:opacity-90 transition-opacity rounded-lg border-none`}
      onClick={() => onTokenClick(token)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
            {token.logo_url && !hasLogoError ? (
              <Image
                src={token.logo_url}
                alt={token.symbol}
                fill
                className="object-cover"
                onError={() => onImageError(tokenId)}
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-yellow-400">
                <Smile className="w-6 h-6" />
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{token.symbol || 'Unknown'}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">
                {token.chain.toUpperCase()}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              {formatVolume(token.tx_volume_u_24h)} • {formatHolders(token.holders)}持有
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-medium text-sm">{formatPrice(token.current_price_usd)}</div>
          <div
            className={`text-xs ${
              isPriceUp 
                ? "text-green-500" 
                : token.price_change_24h < 0 
                ? "text-red-500" 
                : "text-gray-400"
            }`}
          >
            {formatPercentChange(token.price_change_24h)}
          </div>
        </div>
      </div>
    </Card>
  );
}; 