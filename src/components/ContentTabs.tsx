
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
    { id: 'posts', label: 'All Posts', icon: User, shortLabel: 'All' },
    { id: 'project', label: 'Projects', icon: FileText, shortLabel: 'Projects' },
    { id: 'code', label: 'Code', icon: Code, shortLabel: 'Code' },
    { id: 'image', label: 'Images', icon: Image, shortLabel: 'Images' },
    { id: 'video', label: 'Videos', icon: Video, shortLabel: 'Videos' },
  ];

  return (
    <div className="mb-4 sm:mb-6 w-full overflow-hidden">
      {/* Mobile: Horizontal scrollable tabs with better spacing */}
      <div className="sm:hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex space-x-2 pb-3 border-b border-gray-700" style={{ minWidth: 'max-content' }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const count = getPostCountByType(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'text-purple-400 border-b-2 border-purple-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-1.5" />
                  <span className="mr-1.5">{tab.shortLabel}</span>
                  <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop: Full width tabs */}
      <div className="hidden sm:block">
        <div className="flex border-b border-gray-700 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const count = getPostCountByType(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center px-4 lg:px-6 py-3 font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
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
    </div>
  );
};

export default ContentTabs;