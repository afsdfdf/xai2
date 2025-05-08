import { useState, useEffect } from 'react';
import { TokenData, RankTopic } from '@/app/types/token';
import { dummyTopics } from '@/app/constants/mock-data';
import { trackApiCall } from '@/app/lib/monitoring/performance';

interface UseTokenDataReturn {
  topics: RankTopic[];
  tokens: TokenData[];
  activeTopicId: string;
  isLoading: boolean;
  error: string | null;
  setActiveTopicId: (topicId: string) => void;
  refresh: () => Promise<void>;
}

export const useTokenData = (): UseTokenDataReturn => {
  const [topics, setTopics] = useState<RankTopic[]>(dummyTopics);
  const [activeTopicId, setActiveTopicId] = useState<string>("hot");
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTopics = async () => {
    try {
      const topicsData = await trackApiCall('fetchTopics', () =>
        fetch('/api/tokens?topic=topics').then(res => res.json())
      );
      if (topicsData?.topics?.length > 0) {
        setTopics(topicsData.topics);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load topics');
    }
  };

  const loadTokens = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const tokensData = await trackApiCall('fetchTokens', () =>
        fetch(`/api/tokens?topic=${activeTopicId}`).then(res => res.json())
      );
      if (tokensData?.tokens?.length > 0) {
        setTokens(tokensData.tokens);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tokens');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, []);

  useEffect(() => {
    loadTokens();
  }, [activeTopicId]);

  const refresh = async () => {
    await Promise.all([loadTopics(), loadTokens()]);
  };

  return {
    topics,
    tokens,
    activeTopicId,
    isLoading,
    error,
    setActiveTopicId,
    refresh,
  };
}; 