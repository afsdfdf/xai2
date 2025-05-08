"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TokenData } from '@/app/types/token';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { TokenCard } from './TokenCard';
import { TopicTabs } from './TopicTabs';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorDisplay } from './ErrorDisplay';
import { useTokenData } from '@/app/hooks/useTokenData';
// import { usePerformanceTracking } from '@/app/hooks/usePerformanceTracking';

export default function TokenRankings({ darkMode }: { darkMode: boolean }) {
  const router = useRouter();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  const {
    topics,
    tokens,
    activeTopicId,
    isLoading,
    error,
    setActiveTopicId,
    refresh,
  } = useTokenData();

  // 暂时注释掉，解决导入问题后再启用
  // usePerformanceTracking('TokenRankings');

  const handleTokenClick = (token: TokenData) => {
    if (token?.chain && token?.token) {
      router.push(`/kline?blockchain=${token.chain}&address=${token.token}`);
    }
  };

  const handleImageError = (tokenId: string) => {
    setImageErrors(prev => ({ ...prev, [tokenId]: true }));
  };

  return (
    <ErrorBoundary>
      <div className="mb-6">
        <TopicTabs
          topics={topics}
          activeTopicId={activeTopicId}
          onTopicChange={setActiveTopicId}
        />
        <div className="space-y-2">
          {isLoading ? (
            <LoadingSkeleton count={10} />
          ) : error ? (
            <ErrorDisplay error={error} onRetry={refresh} />
          ) : tokens.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无代币数据
            </div>
          ) : (
            tokens.map(token => (
              <TokenCard
                key={`${token.chain}-${token.token}`}
                token={token}
                darkMode={darkMode}
                onTokenClick={handleTokenClick}
                onImageError={handleImageError}
                imageErrors={imageErrors}
              />
            ))
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
} 