import { RankTopic } from '@/app/types/token';
import { Button } from "@/components/ui/button";

interface TopicTabsProps {
  topics: RankTopic[];
  activeTopicId: string;
  onTopicChange: (topicId: string) => void;
}

export const TopicTabs = ({ 
  topics, 
  activeTopicId, 
  onTopicChange 
}: TopicTabsProps) => {
  return (
    <div className="mb-5 overflow-x-auto pb-2">
      <div className="flex gap-2 min-w-max">
        {topics.map((topic) => (
          <Button
            key={topic.id}
            variant={activeTopicId === topic.id ? "default" : "outline"}
            size="sm"
            className={`text-xs flex-shrink-0 ${
              activeTopicId === topic.id 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "bg-gray-800 text-gray-300 hover:bg-gray-700 border-none"
            }`}
            onClick={() => onTopicChange(topic.id)}
          >
            {topic.name_zh}
          </Button>
        ))}
      </div>
    </div>
  );
}; 