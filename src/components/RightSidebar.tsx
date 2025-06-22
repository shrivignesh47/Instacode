
import React, { useEffect, useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import DailyChallengeCard from './DailyChallengeCard';

interface RightSidebarProps {
  isCollapsed: boolean;
  isMobile?: boolean;
  onClose?: () => void;
  screenSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

interface Contest {
  contest_code: string;
  contest_name: string;
  link: string;
  start_date?: string;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  isCollapsed,
  isMobile,
  onClose,
  screenSize
}) => {
  const [futureContests, setFutureContests] = useState<Contest[]>([]);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const response = await fetch(
          'https://nmlgdixqnrtrvvipvawd.supabase.co/functions/v1/fetch-codechef-contests',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const contests = data?.future_contests?.map((c: any) => ({
          contest_code: c.contest_code,
          contest_name: c.contest_name,
          link: `https://www.codechef.com/${c.contest_code}`,
          start_date: c.start_date,
        })) || [];
        setFutureContests(contests);
      } catch (error) {
        console.error('Error fetching contests:', error);
      }
    };

    fetchContests();
  }, []);

  if (isCollapsed) return null;

  const sidebarWidth = screenSize === '2xl' ? 'w-96' : 'w-80';

  return (
    <aside className={`h-[calc(100vh-4rem)] ${sidebarWidth} bg-gray-800 border-l border-gray-700 overflow-y-auto`}>
      {isMobile && onClose && (
        <div className="flex justify-end p-4 border-b border-gray-700">
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Daily Challenge Section */}
        <DailyChallengeCard />

        {/* Weekly Contests Section */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-700 border-b border-gray-600 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">CodeChef Weekly Contests</h3>

            <button className="text-gray-400 hover:text-white text-xs">See All</button>
          </div>
          <div className="p-4">
            {futureContests.length > 0 ? (
              <div className="space-y-3">
                {futureContests.map((contest) => (
                  <a
                    key={contest.contest_code}
                    href={contest.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between hover:bg-gray-700 p-2 rounded transition"
                  >
                    <div>
                      <div className="text-sm font-medium text-white">{contest.contest_name}</div>
                      {contest.start_date && (
                        <div className="text-xs text-gray-400">{new Date(contest.start_date).toLocaleString()}</div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-400">No upcoming contests.</div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;