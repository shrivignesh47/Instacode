
import { User, FileText, Code, Image } from 'lucide-react';

interface ContentTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const ContentTabs = ({ activeTab, onTabChange }: ContentTabsProps) => {
  const tabs = [
    { id: 'posts', label: 'All Posts', icon: User },
    { id: 'projects', label: 'Projects', icon: FileText },
    { id: 'code', label: 'Code', icon: Code },
    { id: 'media', label: 'Media', icon: Image },
  ];

  return (
    <div className="mb-6">
      <div className="flex border-b border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
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
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ContentTabs;