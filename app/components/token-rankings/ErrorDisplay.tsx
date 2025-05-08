import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ErrorDisplayProps {
  error: string;
  onRetry: () => void;
}

export const ErrorDisplay = ({ error, onRetry }: ErrorDisplayProps) => {
  return (
    <div className="py-8 text-center">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-md mx-auto">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-yellow-900/50 p-3 mb-3">
            <RefreshCw className="w-6 h-6 text-yellow-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">数据加载失败</h3>
          <p className="text-red-400 mb-3 text-sm">{error}</p>
          <p className="text-gray-400 text-xs mb-4">
            无法从服务器获取最新代币数据，可能由于网络问题或API服务暂时不可用
          </p>
          <Button onClick={onRetry} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" /> 重新加载
          </Button>
        </div>
      </div>
    </div>
  );
}; 