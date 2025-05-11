'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { testHotTokens, testTopics } from './api-test';

export default function ApiTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runHotTokensTest = async () => {
    setLoading(true);
    const data = await testHotTokens();
    setResult(data);
    setLoading(false);
  };

  const runTopicsTest = async () => {
    setLoading(true);
    const data = await testTopics();
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API 测试页面</h1>
      
      <div className="flex gap-4 mb-4">
        <Button onClick={runHotTokensTest} disabled={loading}>
          测试热门代币API
        </Button>
        <Button onClick={runTopicsTest} disabled={loading}>
          测试主题列表API
        </Button>
      </div>
      
      {loading && <p>加载中...</p>}
      
      {result && (
        <Card className="p-4 mt-4">
          <h2 className="text-xl font-bold mb-2">API响应结果</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
} 