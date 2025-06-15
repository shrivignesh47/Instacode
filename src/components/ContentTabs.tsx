
import { User, FileText, Code, Image, Video } from 'lucide-react';

interface ContentTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  posts: any[];
}

const ContentTabs = ({ activeTab, onTabChange, posts }: ContentTabsProps) => {
  const getPostCountByType = (type: string) => {
    if (type === 'posts') return posts.length;
    return posts.filter(post => post.type === type).length;
  };

  const tabs = [
    { id: 'posts', label: 'All Posts', icon: User },
    { id: 'project', label: 'Projects', icon: FileText },
    { id: 'code', label: 'Code', icon: Code },
    { id: 'image', label: 'Images', icon: Image },
    { id: 'video', label: 'Videos', icon: Video },
  ];

  return (
    <div className="mb-6">
      <div className="flex border-b border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const count = getPostCountByType(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
              <span className="ml-2 text-xs bg-gray-700 px-2 py-1 rounded-full">
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ContentTabs;