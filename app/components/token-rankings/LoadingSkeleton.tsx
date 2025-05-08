import { Card } from "@/components/ui/card";

interface LoadingSkeletonProps {
  count: number;
}

export const LoadingSkeleton = ({ count }: LoadingSkeletonProps) => {
  return (
    <>
      {Array(count).fill(0).map((_, index) => (
        <Card
          key={index}
          className="p-3 bg-gray-900 border-gray-800 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-700"></div>
              <div>
                <div className="h-4 w-16 bg-gray-700 rounded"></div>
                <div className="h-3 w-24 bg-gray-700 rounded mt-1"></div>
              </div>
            </div>
            <div className="text-right">
              <div className="h-4 w-20 bg-gray-700 rounded"></div>
              <div className="h-3 w-12 bg-gray-700 rounded mt-1 ml-auto"></div>
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}; 